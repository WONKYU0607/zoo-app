/* 계정과 점수.
   - 구글 로그인만 쓴다. 로그인해야 게임에 들어간다
   - 처음에는 구글 이름을 쓰고, 겹치면 뒤에 숫자를 붙인다
   - 이름은 names/{소문자이름} 문서를 선점하는 방식으로 중복을 막는다.
     두 사람이 같은 순간에 같은 이름을 잡아도 한 명만 성공한다
   - 점수는 절대 깎이지 않는다. 상위 절반만 얻는다
   - 티어는 1000점 단위 숫자 */
import { ready, auth, db } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut,
         linkWithPopup, updateProfile, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, runTransaction,
         increment, serverTimestamp } from "firebase/firestore";

export const account = {
  uid: null, name: "", photo: "",
  score: 0, tier: 0, tickets: 5, ticketAt: 0, games: 0,
  loaded: false, signedIn: false,
  /* 게스트(익명)로 들어왔는가. 게임·점수는 같지만 랭킹에는 안 오른다 */
  guest: false,
};

export const TIER_STEP = 5000;
export function tierOf(score){ return Math.floor(score / TIER_STEP); }
export function winnersCount(n){ return Math.floor(n / 2); }

/* 계정에 올릴 점수.
   판마다 이미 상위 절반만 받았으므로 여기서는 합산한 값을 그대로 준다.
   완주하지 못하고 나간 사람만 절반으로 깎는다. */
export function scoreFor(rank, n, earned, quit){
  const s = Math.max(0, Math.round(earned || 0));
  return quit ? Math.floor(s / 2) : s;
}

export const TICKET_MAX = 5;
export const TICKET_MS = 30 * 60 * 1000;      /* 30분에 한 장 */

/* 마지막으로 기록한 시각부터 지난 만큼 채운다.
   최대치를 넘지 않고, 남은 시간을 같이 돌려준다. */
function refill(tickets, at){
  const now = Date.now();
  let t = typeof tickets === "number" ? tickets : TICKET_MAX;
  let last = typeof at === "number" && at > 0 ? at : now;
  if (t >= TICKET_MAX) return { tickets: TICKET_MAX, at: now, left: 0 };
  const gained = Math.floor((now - last) / TICKET_MS);
  if (gained > 0){
    t = Math.min(TICKET_MAX, t + gained);
    last = last + gained * TICKET_MS;
  }
  if (t >= TICKET_MAX) return { tickets: TICKET_MAX, at: now, left: 0 };
  return { tickets: t, at: last, left: TICKET_MS - (now - last) };
}

/* 다음 티켓까지 남은 밀리초 (0이면 가득 찼다) */
export function ticketLeft(){
  if (account.tickets >= TICKET_MAX) return 0;
  const r = refill(account.tickets, account.ticketAt);
  return r.left;
}

function today(){ return new Date().toISOString().slice(0, 10); }
const key = s => s.trim().toLowerCase();

/* 이름을 선점한다. 이미 있으면 숫자를 늘려가며 다시 시도 */
async function claimName(uid, wanted){
  const base = (wanted || "이름없음").trim().slice(0, 12);
  for (let n = 0; n < 40; n++){
    const tryName = n === 0 ? base : base + (n + 1);
    const ref = doc(db, "names", key(tryName));
    try {
      await runTransaction(db, async tx => {
        const got = await tx.get(ref);
        if (got.exists() && got.data().uid !== uid) throw new Error("taken");
        tx.set(ref, { uid, name: tryName });
      });
      return tryName;
    } catch(e){
      if (e.message !== "taken") throw e;
    }
  }
  return base + Math.floor(Math.random() * 9000 + 1000);
}

/* 별명 바꾸기. 성공하면 새 이름, 이미 쓰는 이름이면 null */
export async function changeName(wanted){
  const want = (wanted || "").trim().slice(0, 12);
  if (!want) return null;
  const ref = doc(db, "names", key(want));
  try {
    await runTransaction(db, async tx => {
      const got = await tx.get(ref);
      if (got.exists() && got.data().uid !== account.uid) throw new Error("taken");
      tx.set(ref, { uid: account.uid, name: want });
    });
  } catch(e){
    if (e.message === "taken") return null;
    throw e;
  }
  const old = account.name;
  await updateDoc(doc(db, "users", account.uid), { name: want });
  account.name = want;
  if (old && key(old) !== key(want)){
    try { await setDoc(doc(db, "names", key(old)), { uid: null, name: old }); } catch(e){}
  }
  window.dispatchEvent(new Event("accountchange"));
  return want;
}

/* 혼자 시험할 때 쓰는 로그인. localhost 에서만 보인다.
   구글 계정 없이 두 창을 서로 다른 사람으로 만들 수 있다. */
export const isLocal = typeof location !== "undefined" &&
  /^(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(location.hostname);

export async function signInTest(name){
  if (!ready) throw new Error("Firebase 설정이 없습니다");
  const cred = await signInAnonymously(auth);
  const want = (name || "").trim() || ("시험" + Math.floor(Math.random() * 900 + 100));
  try { await updateProfile(cred.user, { displayName: want }); } catch(e){}
  return loadProfile(Object.assign(cred.user, { displayName: want }));
}

/* 게스트로 시작 — 구글 계정 없이 바로 논다.
   점수·티켓은 구글과 똑같이 쌓이지만 랭킹에는 안 오른다.
   나중에 구글로 이으면 그동안의 점수를 그대로 가져간다. */
export async function signInGuest(){
  if (!ready) throw new Error("Firebase 설정이 없습니다");
  const cred = await signInAnonymously(auth);
  return loadProfile(cred.user);
}

/* 게스트 → 구글 잇기.
   반드시 linkWithPopup 이어야 한다. signInWithPopup 을 부르면 새 계정으로
   갈아타면서 게스트로 쌓은 점수가 통째로 버려진다. */
export async function linkGoogle(){
  if (!ready) throw new Error("Firebase 설정이 없습니다");
  const user = auth.currentUser;
  if (!user) throw new Error("로그인 상태가 아닙니다");
  if (!user.isAnonymous) return { already: true };

  const provider = new GoogleAuthProvider();
  try {
    const cred = await linkWithPopup(user, provider);
    await updateDoc(doc(db, "users", cred.user.uid), { guest: false });
    account.guest = false;
    if (cred.user.photoURL) account.photo = cred.user.photoURL;
    window.dispatchEvent(new Event("accountchange"));
    return { linked: true };
  } catch(err){
    const code = String(err && err.code || "");
    if (code === "auth/credential-already-in-use" ||
        code === "auth/email-already-in-use" ||
        code === "auth/account-exists-with-different-credential"){
      /* 그 구글 계정이 이미 있다. 어느 쪽을 살릴지는 화면이 묻는다 */
      return { conflict: true };
    }
    throw err;
  }
}

/* 위 충돌에서 "기존 구글 계정으로 들어간다"를 고른 경우.
   게스트로 쌓은 점수는 버려진다. */
export async function switchToGoogle(){
  return signInGoogle();
}

export async function signInGoogle(){
  if (!ready) throw new Error("Firebase 설정이 없습니다");
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return loadProfile(cred.user);
}

async function loadProfile(user){
  account.uid = user.uid;
  account.photo = user.photoURL || "";

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()){
    const name = await claimName(user.uid, user.displayName);
    const fresh = { name, score: 0, games: 0, tickets: TICKET_MAX,
                    ticketAt: Date.now(), createdAt: serverTimestamp(),
                    guest: Boolean(user.isAnonymous) };
    await setDoc(ref, fresh);
    Object.assign(account, fresh);
  } else {
    const d = snap.data();
    Object.assign(account, d);
    /* 지난 시간만큼 티켓을 채운다 */
    const r = refill(d.tickets, d.ticketAt);
    if (r.tickets !== d.tickets || !d.ticketAt){
      await updateDoc(ref, { tickets: r.tickets, ticketAt: r.at });
    }
    account.tickets = r.tickets;
    account.ticketAt = r.at;
  }
  account.tier = tierOf(account.score);
  /* 게스트인지는 로그인 상태가 진실이다. 문서 값은 따라온다 */
  account.guest = Boolean(user.isAnonymous);
  account.signedIn = true;
  account.loaded = true;
  window.dispatchEvent(new Event("accountchange"));
  return account;
}

export async function signOutNow(){
  await signOut(auth);
  Object.assign(account, { uid: null, name: "", photo: "", score: 0,
                           tier: 0, tickets: 5, games: 0, signedIn: false });
  window.dispatchEvent(new Event("accountchange"));
}

/* 이미 로그인돼 있으면 그대로 이어간다 */
export function watchAuth(){
  return new Promise(resolve => {
    if (!ready){ account.loaded = true; resolve(account); return; }
    const stop = onAuthStateChanged(auth, async user => {
      stop();
      if (user){
        try { await loadProfile(user); } catch(e){ console.warn(e); }
      } else {
        account.loaded = true;
      }
      resolve(account);
    });
  });
}

/* 한 게임(정해진 판 수)이 끝났을 때.
   rank 는 0부터 (0 이 1등), earned 는 게임 안에서 쌓은 누적 점수,
   quit 는 완주하지 못하고 나갔는지 */
export async function finishGame(rank, players, earned, quit){
  const gained = scoreFor(rank, players, earned, quit);
  if (!account.signedIn || gained <= 0) return gained;
  account.score += gained;
  account.games += 1;
  account.tier = tierOf(account.score);
  await updateDoc(doc(db, "users", account.uid), {
    score: increment(gained), games: increment(1), lastPlayed: serverTimestamp() });
  window.dispatchEvent(new Event("accountchange"));
  return gained;
}

export async function useTicket(){
  if (!account.signedIn) return false;
  const r = refill(account.tickets, account.ticketAt);
  account.tickets = r.tickets; account.ticketAt = r.at;
  if (account.tickets <= 0) return false;
  /* 가득 찬 상태에서 한 장을 쓰면 그때부터 다시 시간을 잰다 */
  const wasFull = account.tickets >= TICKET_MAX;
  account.tickets -= 1;
  if (wasFull) account.ticketAt = Date.now();
  await updateDoc(doc(db, "users", account.uid),
    { tickets: account.tickets, ticketAt: account.ticketAt });
  window.dispatchEvent(new Event("accountchange"));
  return true;
}

export async function addTicket(n = 1){
  if (!account.signedIn) return account.tickets;
  account.tickets = Math.min(TICKET_MAX, account.tickets + n);
  await updateDoc(doc(db, "users", account.uid), { tickets: account.tickets });
  window.dispatchEvent(new Event("accountchange"));
  return account.tickets;
}
