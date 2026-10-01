/* 계정과 점수.
   - 구글 로그인만 쓴다. 로그인해야 게임에 들어간다
   - 처음에는 구글 이름을 쓰고, 겹치면 뒤에 숫자를 붙인다
   - 이름은 names/{소문자이름} 문서를 선점하는 방식으로 중복을 막는다.
     두 사람이 같은 순간에 같은 이름을 잡아도 한 명만 성공한다
   - 점수는 절대 깎이지 않는다. 상위 절반만 얻는다
   - 티어는 1000점 단위 숫자

   **점수·판 수·티켓은 앱이 적지 않는다(2026-09-30).**
   예전에는 여기서 Firestore 에 직접 적었고, 개발자도구로 숫자를 바꾸거나 티켓 빼기를
   건너뛰면 그대로 통했다. 이제는 게임 서버가 적는다(server/accounts.js):
     점수  판이 끝나면 서버가 판 기록을 보고 적는다
     티켓  방장이 시작을 누르면 서버가 뺀다 / 광고는 AdMob 이 서버로 직접 알려 온 것만
   보안 규칙도 앱이 이 칸들을 못 고치게 막는다. 앱은 **읽기만** 하고(refreshAccount),
   화면에 보이는 티켓 수는 서버와 같은 식(refill)으로 계산만 한다 */
import { ready, auth, db } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInAnonymously, signOut,
         linkWithPopup, linkWithRedirect, getRedirectResult, signInWithCredential, linkWithCredential,
         updateProfile, onAuthStateChanged,
         reauthenticateWithCredential, reauthenticateWithPopup, deleteUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, runTransaction,
         collection, query, where, orderBy, limit, getDocs, getCountFromServer,
         serverTimestamp } from "firebase/firestore";
import { wipeMine } from "./friends.js";

/* 티켓. account 보다 **먼저** 선언해야 한다 —
   const 는 선언 전에 못 쓰고, account 는 파일이 열리는 순간 만들어진다.
   아래에 두면 앱이 통째로 안 뜬다 */
export const TICKET_MAX = 3;
export const TICKET_MS = 30 * 60 * 1000;      /* 30분에 한 장 */

export const account = {
  uid: null, name: "", photo: "",
  score: 0, tier: 0, tickets: TICKET_MAX, ticketAt: 0, games: 0, avatar: 0,
  wk: 0, mo: 0, wkKey: "", moKey: "",
  needName: false,        /* 구글로 처음 들어왔으면 별명을 정해야 한다 */
  loaded: false, signedIn: false,
  /* 게스트(익명)로 들어왔는가. 게임·점수는 같지만 랭킹에는 안 오른다 */
  guest: false,
};

/* 이번 주 / 이번 달 딱지. 주는 월요일 시작.
   **한국 시각(KST)으로 자른다** — 서버(accounts.js)가 같은 식으로 적는다.
   기기 시각으로 자르면 외국에 있는 사람은 월요일 아침에 지난주 랭킹을 본다 */
export function periodKeys(at){
  /* at 은 숫자(밀리초)·Date 둘 다 받는다 — Date 에 바로 숫자를 더하면 글자 잇기가 된다 */
  const base = at ? +new Date(at) : Date.now();
  const d = new Date(base + 9 * 3600 * 1000);   /* KST 벽시계를 UTC 칸으로 읽는다 */
  const mo = d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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


/* 마지막으로 기록한 시각부터 지난 만큼 채운다.
   최대치를 넘지 않고, 남은 시간을 같이 돌려준다.
   **서버(accounts.js 의 refill)와 같은 식이다** — 화면 숫자와 서버가 아는 숫자가 같아야 한다 */
export function refill(tickets, at){
  const now = Date.now();
  let t = typeof tickets === "number" && Number.isFinite(tickets) ? Math.floor(tickets) : TICKET_MAX;
  let last = typeof at === "number" && at > 0 ? at : now;
  if (t >= TICKET_MAX) return { tickets: TICKET_MAX, at: now, left: 0 };
  if (t < 0) t = 0;
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

/* **시간이 지나 찬 티켓을 화면에도 반영한다.**

   `refill()` 은 값을 계산만 하고 `account` 에 안 적는다. 그래서 로비를 켜 둔 채
   30분이 지나도 위쪽 티켓 숫자가 0 그대로였다 — 방 만들기를 티켓으로 잠그면 그게 그대로
   "30분이 지났는데도 안 풀린다" 가 된다.

   초읽기를 그리는 쪽이 1초마다 불러 준다. **달라졌을 때만** 알린다.
   디스크(Firestore)에는 안 적는다 — 서버가 쓸 때·줄 때 같은 식으로 다시 계산한다 */
export function syncTickets(){
  if (account.tickets >= TICKET_MAX) return account.tickets;
  const r = refill(account.tickets, account.ticketAt);
  if (r.tickets === account.tickets) return account.tickets;
  account.tickets = r.tickets;
  account.ticketAt = r.at;
  window.dispatchEvent(new Event("accountchange"));
  return account.tickets;
}

function today(){ return new Date().toISOString().slice(0, 10); }
const key = s => s.trim().toLowerCase();

/* ---------- 별명 규칙 ----------
   한글만 쓰면 6자, 영문·숫자만 쓰면 8자. 섞으면 그 사이.
   (한글 한 자 = 8/6 칸, 나머지 한 자 = 1칸, 총 8칸) */
const HANGUL = /[\u3131-\u318E\uAC00-\uD7A3]/;
export function nameCost(str){
  let cost = 0;
  for (const ch of String(str || "")){
    cost += HANGUL.test(ch) ? (8 / 6) : 1;
  }
  return cost;
}
export const NAME_MAX = 8;

/* 쓸 수 있는 이름인지. 안 되면 왜 안 되는지 돌려준다 */
export function checkName(str){
  const v = String(str || "").trim();
  if (!v) return { ok: false, why: "empty" };
  if (/\s/.test(v)) return { ok: false, why: "space" };
  for (const ch of v){
    if (!HANGUL.test(ch) && !/[A-Za-z0-9]/.test(ch)) return { ok: false, why: "char" };
  }
  if (nameCost(v) > NAME_MAX + 0.001) return { ok: false, why: "long" };
  return { ok: true, name: v };
}

/* 게스트 번호. 들어온 순서대로 매긴다 — 게스트168 처럼 */
async function nextGuestName(){
  const ref = doc(db, "meta", "guest");
  let no = 0;
  await runTransaction(db, async tx => {
    const got = await tx.get(ref);
    no = ((got.exists() && Number(got.data().seq)) || 0) + 1;
    tx.set(ref, { seq: no }, { merge: true });
  });
  return "게스트" + no;
}

/* 이름 문서가 남의 것인가. `uid` 가 비어 있으면(예전에 놓아준 이름) 비어 있는 이름으로 본다 —
   규칙도 그런 이름은 잡을 수 있게 해 둔다 */
const heldByOther = (got, uid) => got.exists() && got.data().uid && got.data().uid !== uid;

/* 옛 이름 놓아주기 — **지운다.**
   예전에는 `uid: null` 로 덮어썼는데 규칙이 그 쓰기를 거부해서(조용히 실패) 옛 이름이
   영영 내 것으로 남았다. 내 이름 문서를 지우는 것은 규칙이 허용한다(계정 삭제와 같은 줄) */
async function releaseName(old){
  try { await deleteDoc(doc(db, "names", key(old))); } catch(e){}
}

/* 별명 정하기. 이미 쓰는 이름이면 taken 을 돌려준다 */
/* 프로필 얼굴. 앞 5개는 처음부터, 그 뒤는 5,000점마다 하나씩 */
export const AVT_NEED = i => (i < 5 ? 0 : (i - 4) * TIER_STEP);
export function avatarOpen(i){ return (account.score || 0) >= AVT_NEED(i); }

export async function setAvatar(i){
  i = Number(i) || 0;
  if (!avatarOpen(i)) return { ok: false, why: "locked", need: AVT_NEED(i) };
  account.avatar = i;
  if (ready && account.uid){
    try { await updateDoc(doc(db, "users", account.uid), { avatar: i }); } catch(e){}
  }
  try { localStorage.setItem("zk_avatar", String(i)); } catch(e){}
  return { ok: true };
}

export async function setNickname(wanted){
  if (!ready || !account.uid) throw new Error("로그인 상태가 아닙니다");
  const c = checkName(wanted);
  if (!c.ok) return { ok: false, why: c.why };
  const want = c.name;
  const ref = doc(db, "names", key(want));
  try {
    await runTransaction(db, async tx => {
      const got = await tx.get(ref);
      if (heldByOther(got, account.uid)) throw new Error("taken");
      tx.set(ref, { uid: account.uid, name: want });
    });
  } catch(e){
    if (String(e.message) === "taken") return { ok: false, why: "taken" };
    throw e;
  }
  const old = account.name;
  await updateDoc(doc(db, "users", account.uid), { name: want });
  try { await updateProfile(auth.currentUser, { displayName: want }); } catch(e){}
  account.name = want;
  account.needName = false;
  try { await updateDoc(doc(db, "users", account.uid), { needName: false }); } catch(e){}
  if (old && key(old) !== key(want)){
    await releaseName(old);
  }
  window.dispatchEvent(new Event("accountchange"));
  return { ok: true, name: want };
}

/* 이름을 선점한다. 이미 있으면 숫자를 늘려가며 다시 시도 */
async function claimName(uid, wanted){
  const base = (wanted || "이름없음").trim().slice(0, 12);
  for (let n = 0; n < 40; n++){
    const tryName = n === 0 ? base : base + (n + 1);
    const ref = doc(db, "names", key(tryName));
    try {
      await runTransaction(db, async tx => {
        const got = await tx.get(ref);
        if (heldByOther(got, uid)) throw new Error("taken");
        tx.set(ref, { uid, name: tryName });
      });
      return tryName;
    } catch(e){
      if (e.message !== "taken") throw e;
    }
  }
  /* 40개가 다 찼으면 뒤에 네 자리 숫자를 붙여 **잡아 본다.**
     예전에는 잡지 않은 이름을 그냥 돌려줬는데, 이제 보안 규칙이 "내가 잡은 이름만" 계정에
     적게 해서 그 이름으로는 계정을 못 만든다 */
  for (let k = 0; k < 5; k++){
    const tryName = base + Math.floor(Math.random() * 9000 + 1000);
    const ref = doc(db, "names", key(tryName));
    try {
      await runTransaction(db, async tx => {
        const got = await tx.get(ref);
        if (heldByOther(got, uid)) throw new Error("taken");
        tx.set(ref, { uid, name: tryName });
      });
      return tryName;
    } catch(e){
      if (e.message !== "taken") throw e;
    }
  }
  throw new Error("이름을 정하지 못했습니다");
}

/* 별명 바꾸기. 성공하면 새 이름, 이미 쓰는 이름이면 null */
export async function changeName(wanted){
  const want = (wanted || "").trim().slice(0, 12);
  if (!want) return null;
  const ref = doc(db, "names", key(want));
  try {
    await runTransaction(db, async tx => {
      const got = await tx.get(ref);
      if (heldByOther(got, account.uid)) throw new Error("taken");
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
    await releaseName(old);
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
  /* **표를 새로 받은 뒤에 적는다.** 보안 규칙은 "구글이 이어진 표" 일 때만 게스트 표시를 끄게 한다.
     잇기 직후의 표는 옛것(게스트)일 수 있다 */
  try { await user.getIdToken(true); } catch(e){}
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

  if (isApp()){
    /* 게스트로 놀던 것을 구글 계정에 잇는다 */
    try {
      const cred = await linkWithCredential(user, await googleCredential());
      await markLinked(cred.user);
      return { linked: true };
    } catch(err){
      const code = String(err && err.code || "");
      if (CONFLICT.has(code)) return { conflict: true };
      throw err;
    }
  }
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
   게스트를 먼저 내보내야 구글로 갈아탈 수 있다. 게스트 점수는 버려진다. */
export async function switchToGoogle(){
  try { await signOut(auth); } catch(e){}
  return signInGoogle();
}

/* 구글로 로그인. 팝업이 막히면(크롬이 자주 막는다) 주소 이동으로 넘어간다.
   잇기와 같은 대비를 여기에도 해야 한다 — 한 군데만 고쳐서 겪은 문제다 */
/* ---------- 앱(안드로이드)에서의 구글 로그인 ----------

   앱 안의 화면은 크롬이 아니라 **껍데기 브라우저**다. 그래서 웹에서 쓰는
   "로그인 창 띄우기"가 통하지 않는다. 실제로 **크롬이 따로 열리고 돌아오지 못했다**(신고받음).

   앱에서는 안드로이드가 직접 구글 로그인을 띄우고, 거기서 받은 표(idToken)로
   파이어베이스에 들어간다. 웹에서는 예전 방식 그대로다 */
const isApp = () => Boolean(
  typeof window !== "undefined" && window.Capacitor &&
  typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()
);

/* 안드로이드 로그인 창을 띄우고 표를 받아 온다 */
async function googleCredential(){
  const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
  const r = await FirebaseAuthentication.signInWithGoogle();
  const idToken = r && r.credential && r.credential.idToken;
  if (!idToken) throw new Error("구글 로그인에서 표를 못 받았습니다");
  return GoogleAuthProvider.credential(idToken, r.credential.accessToken || undefined);
}

export async function signInGoogle(){
  if (!ready) throw new Error("Firebase 설정이 없습니다");
  if (isApp()){
    const cred = await signInWithCredential(auth, await googleCredential());
    return loadProfile(cred.user);
  }
  const provider = new GoogleAuthProvider();
  try {
    const cred = await signInWithPopup(auth, provider);
    return loadProfile(cred.user);
  } catch(err){
    const code = String(err && err.code || "");
    if (POPUP_FAIL.has(code)){
      await signInWithRedirect(auth, provider);
      return { redirecting: true };
    }
    throw err;
  }
}

async function loadProfile(user){
  account.uid = user.uid;
  account.photo = user.photoURL || "";

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()){
    /* 게스트는 들어온 순서대로 번호를 매긴다.
       구글은 이름을 직접 정하게 하므로 임시 이름만 걸어 둔다 */
    const guest = Boolean(user.isAnonymous);
    let name;
    if (guest){
      try { name = await nextGuestName(); }
      catch(e){ name = "게스트" + Math.floor(Math.random() * 9000 + 1000); }
      name = await claimName(user.uid, name);
    } else {
      name = await claimName(user.uid, "새사용자");
    }
    /* 처음 만들 때만 앱이 적는다 — 보안 규칙이 값을 못박는다(점수 0·판 0·티켓 3·얼굴 0) */
    const fresh = { name, score: 0, games: 0, tickets: TICKET_MAX,
                    ticketAt: Date.now(), createdAt: serverTimestamp(),
                    guest, needName: !guest, avatar: 0 };
    await setDoc(ref, fresh);
    Object.assign(account, fresh);
  } else {
    const d = snap.data();
    Object.assign(account, d);
    account.needName = Boolean(d.needName);
    /* 지난 시간만큼 채운 티켓을 **화면에만** 보인다. 적지는 않는다 —
       티켓은 서버만 적는다. 서버도 쓸 때 같은 식으로 채워서 계산한다 */
    const r = refill(d.tickets, d.ticketAt);
    account.tickets = r.tickets;
    account.ticketAt = r.at;
  }
  account.tier = tierOf(account.score);
  /* 얼굴은 문서에 없으면 첫 번째(생쥐). 점수가 줄 일은 없지만 혹시 잠긴 것을 들고 있으면 되돌린다 */
  account.avatar = Number(account.avatar) || 0;
  if (!avatarOpen(account.avatar)) account.avatar = 0;
  /* 게스트인지는 로그인 상태가 진실이다. 문서 값은 따라온다 */
  account.guest = Boolean(user.isAnonymous);
  /* 구글인데 아직 별명을 안 정했으면 물어봐야 한다 */
  account.needName = !account.guest && Boolean(account.needName);
  account.signedIn = true;
  account.loaded = true;
  window.dispatchEvent(new Event("accountchange"));
  /* 구글로 처음 들어온 사람은 별명부터 정하게 한다 */
  if (account.needName && typeof window !== "undefined" && window.__askName) window.__askName();
  return account;
}

export async function signOutNow(){
  /* 앱에서는 안드로이드 쪽 로그인도 같이 끊는다.
     안 끊으면 다음에 로그인할 때 **계정을 고르지 않고 바로 옛 계정으로** 들어간다 */
  if (isApp()){
    try {
      const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
      await FirebaseAuthentication.signOut();
    } catch(e){}
  }
  await signOut(auth);
  Object.assign(account, { uid: null, name: "", photo: "", score: 0,
                           tier: 0, tickets: TICKET_MAX, games: 0, signedIn: false });
  window.dispatchEvent(new Event("accountchange"));
}

/* ---------- 계정 삭제 ----------
   플레이 스토어 요건 — 앱 안에서 계정과 기록을 지울 수 있어야 한다.

   순서가 중요하다.
   1) 구글이면 **먼저** 본인 확인을 다시 한다. 파이어베이스는 로그인한 지 오래된
      계정의 삭제를 거부한다(auth/requires-recent-login). 기록을 다 지운 뒤에
      거부당하면 로그인 계정만 남으므로 맨 앞에서 한다.
   2) 기록을 지운다 — 친구·신청·초대·접속 상태 → 이름 → 사용자 문서.
      하나라도 실패하면 던진다. 로그인 계정은 그대로 두므로 다시 누르면 이어서 지운다.
   3) 로그인 계정을 지운다. 게스트는 다시 확인할 방법이 없어 거부될 수 있다 —
      그때는 로그아웃만 한다. 남는 것은 개인정보 없는 익명 번호뿐이다.
   돌려주는 값: { ok: true, authLeft } — authLeft 는 로그인 계정이 남았는가 */
export async function deleteAccount(){
  if (!ready) throw new Error("Firebase 설정이 없습니다");
  const user = auth.currentUser;
  if (!user) throw new Error("로그인 상태가 아닙니다");
  const uid = user.uid;

  if (!user.isAnonymous){
    if (isApp()) await reauthenticateWithCredential(user, await googleCredential());
    else await reauthenticateWithPopup(user, new GoogleAuthProvider());
  }

  await wipeMine();
  /* 이름 — 지금 이름만이 아니라 **내 것으로 잡혀 있는 이름 전부**.
     별명을 바꿀 때 옛 이름을 놓아주는 쓰기가 실패하면 옛 이름이 내 것으로 남아 있다 */
  const mine = await getDocs(query(collection(db, "names"), where("uid", "==", uid)));
  for (const d of mine.docs) await deleteDoc(d.ref);
  await deleteDoc(doc(db, "users", uid));

  let authLeft = false;
  try { await deleteUser(user); }
  catch(e){
    authLeft = true;
    console.warn("[계정 삭제] 로그인 계정은 못 지움:", (e && e.code) || e);
  }
  await signOutNow();
  return { ok: true, authLeft, guest: Boolean(user.isAnonymous) };
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

/* ---------- 서버가 적은 값을 다시 읽는다 ----------
   점수·판 수·티켓은 서버가 적으므로, 적힐 만한 때(시작한 뒤·게임이 끝난 뒤·광고를 본 뒤)
   계정 문서를 다시 읽어 화면에 반영한다. 이름·얼굴은 앱이 바꾸는 값이라 여기서 덮지 않는다
   (고르는 도중에 옛 값으로 되돌아가면 안 된다) */
const SERVER_FIELDS = ["score", "games", "tickets", "ticketAt", "wk", "mo", "wkKey", "moKey"];
export async function refreshAccount(){
  if (!ready || !account.uid) return account;
  const snap = await getDoc(doc(db, "users", account.uid));
  if (!snap.exists()) return account;
  const d = snap.data() || {};
  for (const k of SERVER_FIELDS) if (d[k] !== undefined) account[k] = d[k];
  const r = refill(d.tickets, d.ticketAt);
  account.tickets = r.tickets;
  account.ticketAt = r.at;
  account.tier = tierOf(account.score || 0);
  window.dispatchEvent(new Event("accountchange"));
  return account;
}

/* 서버에 보낼 로그인 표. 방에 앉을 때 서버가 이걸로 누구인지 가린다(점수·티켓을 적을 계정) */
export async function idToken(){
  if (!ready || !auth || !auth.currentUser) return null;
  try { return await auth.currentUser.getIdToken(); } catch(e){ return null; }
}

/* 한 게임(정해진 판 수)이 끝났을 때.
   rank 는 0부터 (0 이 1등), earned 는 게임 안에서 쌓은 누적 점수,
   quit 는 완주하지 못하고 나갔는지.
   **점수는 서버가 적는다** — 여기서는 얼마나 받을지 계산해 돌려주고,
   서버가 적을 때쯤 계정을 다시 읽어 화면을 맞춘다 */
export async function finishGame(rank, players, earned, quit){
  const gained = scoreFor(rank, players, earned, quit);
  if (!account.signedIn) return gained;
  /* 서버는 판이 끝나는 순간(또는 나가는 순간) 적는다. 결과 화면이 뜰 즈음이면 대개 적혀 있다 */
  for (const ms of [1500, 5000, 12000]) setTimeout(() => { refreshAccount().catch(() => {}); }, ms);
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

/* 시작할 수 있을 만큼 티켓이 있는가 — **화면에서 미리 막는 용도일 뿐**이다.
   진짜로 빼는 것은 서버다(시작을 누르면 서버가 방장 티켓을 한 장 뺀다. 없으면 402) */
export function hasTicket(){
  if (!account.signedIn) return true;          /* 로그인 전(검사·개발)에는 서버가 가린다 */
  const r = refill(account.tickets, account.ticketAt);
  return r.tickets > 0;
}

/* 광고를 끝까지 봤다 — **티켓은 AdMob 이 서버로 알려 와서 서버가 준다**(서버 측 확인).
   앱은 그게 계정에 적힐 때까지 계정을 몇 번 다시 읽어 본다.
   돌려주는 값: true(들어왔다) / false(시간 안에 안 들어왔다 — 늦게라도 들어오면 로비가 다시 읽는다) */
export async function waitReward(before, maxMs = 25000){
  if (!account.signedIn) return false;
  const was = typeof before === "number" ? before : refill(account.tickets, account.ticketAt).tickets;
  const t0 = Date.now();
  /* 처음 8초는 0.5초마다 본다 — 구글 알림은 대개 1초 안팎에 온다(예전에는 1.5초마다라 늦어 보였다) */
  while (Date.now() - t0 < maxMs){
    await new Promise(r => setTimeout(r, Date.now() - t0 < 8000 ? 500 : 1500));
    try { await refreshAccount(); } catch(e){}
    if (account.tickets > was || account.tickets >= TICKET_MAX) return true;
  }
  /* 늦게 온 것도 반영되게 한 번 더 */
  setTimeout(() => { refreshAccount().catch(() => {}); }, 60000);
  return false;
}
