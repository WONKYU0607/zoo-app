/* 계정과 점수.
   - 구글 로그인만 쓴다. 로그인해야 게임에 들어간다
   - 처음에는 구글 이름을 쓰고, 겹치면 뒤에 숫자를 붙인다
   - 이름은 names/{소문자이름} 문서를 선점하는 방식으로 중복을 막는다.
     두 사람이 같은 순간에 같은 이름을 잡아도 한 명만 성공한다
   - 점수는 절대 깎이지 않는다. 상위 절반만 얻는다
   - 티어는 1000점 단위 숫자 */
import { ready, auth, db } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, runTransaction,
         increment, serverTimestamp } from "firebase/firestore";

export const account = {
  uid: null, name: "", photo: "",
  score: 0, tier: 0, tickets: 5, games: 0,
  loaded: false, signedIn: false,
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
    const fresh = { name, score: 0, games: 0, tickets: 5,
                    ticketDay: today(), createdAt: serverTimestamp() };
    await setDoc(ref, fresh);
    Object.assign(account, fresh);
  } else {
    const d = snap.data();
    Object.assign(account, d);
    if (d.ticketDay !== today()){          /* 날짜가 바뀌면 티켓을 채운다 */
      const fill = { tickets: 5, ticketDay: today() };
      await updateDoc(ref, fill);
      Object.assign(account, fill);
    }
  }
  account.tier = tierOf(account.score);
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
  if (!account.signedIn || account.tickets <= 0) return false;
  account.tickets -= 1;
  await updateDoc(doc(db, "users", account.uid), { tickets: increment(-1) });
  window.dispatchEvent(new Event("accountchange"));
  return true;
}

export async function addTicket(n = 1){
  if (!account.signedIn) return account.tickets;
  account.tickets += n;
  await updateDoc(doc(db, "users", account.uid), { tickets: increment(n) });
  window.dispatchEvent(new Event("accountchange"));
  return account.tickets;
}
