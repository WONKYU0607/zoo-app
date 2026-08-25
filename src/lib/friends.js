/* 친구.

   별명으로 찾아 신청하고, 상대가 받으면 친구가 된다.
   접속 중인지 보이고, 방에 부를 수 있고, 친구끼리만 순위를 볼 수 있다.

   Firestore 에 이렇게 담는다.
     friends/{내uid}/list/{상대uid}   { name, at }        서로 하나씩 갖는다
     freq/{받는uid}/from/{보낸uid}    { name, at }        신청함
     pres/{uid}                       { name, state, at }  접속 상태
     inv/{받는uid}/list/{보낸uid}     { name, code, at }   초대

   게스트도 쓴다. 기기를 바꾸면 계정이 사라지므로 친구도 같이 사라진다 — 그건 감수한다 */

import {
  doc, getDoc, setDoc, deleteDoc, collection, getDocs,
  query, where, limit, serverTimestamp,
} from "firebase/firestore";

let db = null, me = () => ({});

export function initFriends(theDb, account){
  db = theDb;
  me = () => account || {};
}

const ok = () => Boolean(db && me().uid);

/* ---------- 접속 상태 ---------- */

/* state: "lobby"(로비·대기실 — 부를 수 있다) | "game"(판 중 — 못 부른다) */
export async function setPresence(state){
  if (!ok()) return;
  try {
    await setDoc(doc(db, "pres", me().uid),
      { name: me().name || "", state, at: Date.now() }, { merge: true });
  } catch(e){}
}

/* 3분 넘게 소식이 없으면 접속 중이 아니라고 본다 */
const FRESH = 3 * 60 * 1000;
export const isOnline = p => Boolean(p && p.at && Date.now() - p.at < FRESH);

/* ---------- 찾기·신청 ---------- */

/* 별명으로 찾는다. 이름은 겹치지 않으므로 한 명만 나온다 */
export async function findByName(name){
  if (!ok()) return null;
  const want = String(name || "").trim();
  if (!want) return null;
  try {
    const q = query(collection(db, "users"), where("name", "==", want), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    if (d.id === me().uid) return { self: true };
    const v = d.data() || {};
    return { uid: d.id, name: v.name || want, score: v.score || 0 };
  } catch(e){ return null; }
}

export async function sendRequest(uid, name){
  if (!ok() || !uid || uid === me().uid) return { ok: false };
  /* 이미 친구면 그만 */
  if (await isFriend(uid)) return { ok: false, why: "already" };
  try {
    await setDoc(doc(db, "freq", uid, "from", me().uid),
      { name: me().name || "", at: Date.now() });
    return { ok: true };
  } catch(e){ return { ok: false, why: "fail" }; }
}

/* 나에게 온 신청 */
export async function incoming(){
  if (!ok()) return [];
  try {
    const snap = await getDocs(collection(db, "freq", me().uid, "from"));
    return snap.docs.map(d => ({ uid: d.id, ...(d.data() || {}) }))
      .sort((a, b) => (b.at || 0) - (a.at || 0));
  } catch(e){ return []; }
}

/* 받아 준다 — 양쪽에 하나씩 적는다 */
export async function accept(uid, name){
  if (!ok() || !uid) return false;
  try {
    const now = Date.now();
    await setDoc(doc(db, "friends", me().uid, "list", uid),
      { name: name || "", at: now });
    await setDoc(doc(db, "friends", uid, "list", me().uid),
      { name: me().name || "", at: now });
    await deleteDoc(doc(db, "freq", me().uid, "from", uid));
    return true;
  } catch(e){ return false; }
}

export async function reject(uid){
  if (!ok() || !uid) return false;
  try { await deleteDoc(doc(db, "freq", me().uid, "from", uid)); return true; }
  catch(e){ return false; }
}

/* ---------- 목록 ---------- */

export async function isFriend(uid){
  if (!ok() || !uid) return false;
  try { return (await getDoc(doc(db, "friends", me().uid, "list", uid))).exists(); }
  catch(e){ return false; }
}

/* 친구 목록. 접속 상태와 점수를 같이 붙여 준다 */
export async function listFriends(){
  if (!ok()) return [];
  try {
    const snap = await getDocs(collection(db, "friends", me().uid, "list"));
    const rows = snap.docs.map(d => ({ uid: d.id, ...(d.data() || {}) }));
    /* 상태와 점수는 한 명씩 받아 온다. 친구 수가 많지 않으므로 이 정도면 된다 */
    await Promise.all(rows.map(async r => {
      try {
        const p = await getDoc(doc(db, "pres", r.uid));
        const v = p.exists() ? p.data() : null;
        r.online = isOnline(v);
        r.state = v && v.state === "game" ? "game" : "lobby";
        if (v && v.name) r.name = v.name;
      } catch(e){ r.online = false; r.state = "lobby"; }
      try {
        const u = await getDoc(doc(db, "users", r.uid));
        r.score = u.exists() ? (u.data().score || 0) : 0;
      } catch(e){ r.score = 0; }
    }));
    rows.sort((a, b) =>
      (b.online - a.online) || (b.score - a.score) || String(a.name).localeCompare(String(b.name)));
    return rows;
  } catch(e){ return []; }
}

export async function removeFriend(uid){
  if (!ok() || !uid) return false;
  try {
    await deleteDoc(doc(db, "friends", me().uid, "list", uid));
    await deleteDoc(doc(db, "friends", uid, "list", me().uid));
    return true;
  } catch(e){ return false; }
}

/* 친구끼리만 보는 순위. 나도 넣는다 */
export async function friendRank(){
  const rows = await listFriends();
  rows.push({ uid: me().uid, name: me().name || "나", score: me().score || 0, mine: true });
  rows.sort((a, b) => (b.score || 0) - (a.score || 0));
  return rows;
}

/* ---------- 초대 ---------- */

export async function invite(uid, code){
  if (!ok() || !uid || !code) return false;
  try {
    await setDoc(doc(db, "inv", uid, "list", me().uid),
      { name: me().name || "", code: String(code), at: Date.now() });
    return true;
  } catch(e){ return false; }
}

/* 나에게 온 초대. 2분이 지난 것은 버린다 */
const INV_LIFE = 2 * 60 * 1000;
export async function invites(){
  if (!ok()) return [];
  try {
    const snap = await getDocs(collection(db, "inv", me().uid, "list"));
    const now = Date.now();
    const rows = [];
    for (const d of snap.docs){
      const v = d.data() || {};
      if (now - (v.at || 0) > INV_LIFE){
        deleteDoc(doc(db, "inv", me().uid, "list", d.id)).catch(() => {});
        continue;
      }
      rows.push({ uid: d.id, ...v });
    }
    return rows.sort((a, b) => (b.at || 0) - (a.at || 0));
  } catch(e){ return []; }
}

export async function dropInvite(uid){
  if (!ok() || !uid) return;
  try { await deleteDoc(doc(db, "inv", me().uid, "list", uid)); } catch(e){}
}
