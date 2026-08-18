/* 계정과 점수.
   - 구글 로그인만 쓴다. 로그인해야 게임에 들어간다
   - 처음에는 구글 이름을 쓰고, 겹치면 뒤에 숫자를 붙인다
   - 이름은 names/{소문자이름} 문서를 선점하는 방식으로 중복을 막는다.
     두 사람이 같은 순간에 같은 이름을 잡아도 한 명만 성공한다
   - 점수는 절대 깎이지 않는다. 상위 절반만 얻는다
   - 티어는 1000점 단위 숫자 */
import { ready, auth, db } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInAnonymously, signOut,
         linkWithPopup, linkWithRedirect, getRedirectResult,
         updateProfile, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, runTransaction,
         collection, query, where, orderBy, limit, getDocs, getCountFromServer,
         increment, serverTimestamp } from "firebase/firestore";

export const account = {
  uid: null, name: "", photo: "",
  score: 0, tier: 0, tickets: 5, ticketAt: 0, games: 0,
  wk: 0, mo: 0, wkKey: "", moKey: "",
  loaded: false, signedIn: false,
  /* 게스트(익명)로 들어왔는가. 게임·점수는 같지만 랭킹에는 안 오른다 */
  guest: false,
};

/* 이번 주 / 이번 달 딱지. 주는 월요일 시작 */
export function periodKeys(at){
  const d = at ? new Date(at) : new Date();
  const mo = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7;            /* 월=0 */
  t.setUTCDate(t.getUTCDate() - day + 3);         /* 그 주 목요일 */
  const year = t.getUTCFullYear();
  const first = new Date(Date.UTC(year, 0, 4));
  const wkNo = 1 + Math.round(((t - first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  return { wk: year + "-W" + String(wkNo).padStart(2, "0"), mo };
}

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

/* 팝업이 막혔거나 열 수 없는 경우 */
const POPUP_FAIL = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);
const CONFLICT = new Set([
  "auth/credential-already-in-use",
  "auth/email-already-in-use",
  "auth/account-exists-with-different-credential",
]);

async function markLinked(user){
  try { await updateDoc(doc(db, "users", user.uid), { guest: false }); } catch(e){}
  account.guest = false;
  if (user.photoURL) account.photo = user.photoURL;
  window.dispatchEvent(new Event("accountchange"));
}

/* 게스트 → 구글 잇기.
   반드시 link… 여야 한다. signIn… 을 부르면 새 계정으로 갈아타면서
   게스트로 쌓은 점수가 통째로 버려진다.
   팝업이 막히면(크롬이 자주 막는다) 주소 이동 방식으로 넘어간다. */
export async function linkGoogle(){
  if (!ready) throw new Error("Firebase 설정이 없습니다");
  const user = auth.currentUser;
  if (!user) throw new Error("로그인 상태가 아닙니다");
  if (!user.isAnonymous) return { already: true };

  const provider = new GoogleAuthProvider();
  try {
    const cred = await linkWithPopup(user, provider);
    await markLinked(cred.user);
    return { linked: true };
  } catch(err){
    const code = String(err && err.code || "");
    if (CONFLICT.has(code)) return { conflict: true };
    if (POPUP_FAIL.has(code)){
      /* 창을 못 여니 페이지를 통째로 넘겼다 돌아온다.
         돌아온 뒤 처리는 watchAuth 안의 getRedirectResult 가 맡는다 */
      try { sessionStorage.setItem("zoo_link", "1"); } catch(e){}
      await linkWithRedirect(user, provider);
      return { redirecting: true };
    }
    throw err;
  }
}

/* 위 충돌에서 "기존 구글 계정으로 들어간다"를 고른 경우.
   게스트로 쌓은 점수는 버려진다. */
export async function switchToGoogle(){
  return signInGoogle();
}

export async function signInGoogleRedirect(){
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
  return { redirecting: true };
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
/* 주소 이동으로 다녀온 결과. 잇기가 끝났으면 여기서 마무리된다.
   충돌이면 화면이 물어볼 수 있게 남겨 둔다 */
export const pending = { conflict: false, error: "" };

async function takeRedirect(){
  if (!ready) return;
  let asked = false;
  try { asked = sessionStorage.getItem("zoo_link") === "1"; } catch(e){}
  try {
    const res = await getRedirectResult(auth);
    if (res && res.user && asked) await markLinked(res.user);
  } catch(err){
    const code = String(err && err.code || "");
    if (CONFLICT.has(code)) pending.conflict = true;
    else pending.error = code || String(err && err.message || err);
  }
  try { sessionStorage.removeItem("zoo_link"); } catch(e){}
}

export function watchAuth(){
  return new Promise(resolve => {
    if (!ready){ account.loaded = true; resolve(account); return; }
    const stop = onAuthStateChanged(auth, async user => {
      stop();
      await takeRedirect();
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

  /* 주간·월간은 딱지가 바뀌면 0부터 다시 센다 */
  const k = periodKeys();
  const patch = {
    score: increment(gained), games: increment(1), lastPlayed: serverTimestamp(),
    guest: Boolean(account.guest),
  };
  patch.wkKey = k.wk;
  patch.moKey = k.mo;
  patch.wk = account.wkKey === k.wk ? increment(gained) : gained;
  patch.mo = account.moKey === k.mo ? increment(gained) : gained;
  account.wk = (account.wkKey === k.wk ? (account.wk || 0) : 0) + gained;
  account.mo = (account.moKey === k.mo ? (account.mo || 0) : 0) + gained;
  account.wkKey = k.wk; account.moKey = k.mo;

  await updateDoc(doc(db, "users", account.uid), patch);
  window.dispatchEvent(new Event("accountchange"));
  return gained;
}

/* ---------- 랭킹 ---------- */
/* 게스트는 목록에서 뺀다. 거르는 것은 받아온 뒤에 한다 —
   그래야 색인(index)을 하나 덜 만들어도 된다 */
const FIELD = { all: "score", week: "wk", month: "mo" };
const KEYF  = { week: "wkKey", month: "moKey" };

export async function topScores(kind = "all", want = 100){
  if (!ready) return [];
  const f = FIELD[kind] || "score";
  const col = collection(db, "users");
  const k = periodKeys();
  const q = kind === "all"
    ? query(col, orderBy(f, "desc"), limit(want + 60))
    : query(col, where(KEYF[kind], "==", kind === "week" ? k.wk : k.mo),
                 orderBy(f, "desc"), limit(want + 60));
  const snap = await getDocs(q);
  const out = [];
  snap.forEach(d => {
    const v = d.data() || {};
    if (v.guest) return;                       /* 게스트는 랭킹에 안 오른다 */
    const sc = Number(v[f] || 0);
    if (sc <= 0) return;
    out.push({ uid: d.id, name: v.name || "", score: sc, tier: tierOf(v.score || 0) });
  });
  return out.slice(0, want);
}

/* 내 순위 — 나보다 점수가 높은 사람 수 + 1 */
export async function myRank(kind = "all"){
  if (!ready || !account.signedIn || account.guest) return null;
  const f = FIELD[kind] || "score";
  const mine = Number(kind === "all" ? account.score : (kind === "week" ? account.wk : account.mo) || 0);
  if (mine <= 0) return null;
  const col = collection(db, "users");
  const k = periodKeys();
  const q = kind === "all"
    ? query(col, where(f, ">", mine))
    : query(col, where(KEYF[kind], "==", kind === "week" ? k.wk : k.mo), where(f, ">", mine));
  try {
    const c = await getCountFromServer(q);
    return { rank: (c.data().count || 0) + 1, score: mine, tier: account.tier };
  } catch(e){ return null; }
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
