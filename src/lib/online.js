/* 온라인 대전. 방 만들기·참가와 실시간 동기화를 맡는다.
   보내는 양을 줄이려고 수 하나를 "자리,숫자,장수" 짧은 문자열로 적고,
   moves 목록에 새로 붙는 것만 듣는다. 판 전체를 다시 받지 않는다. */
import { ready, db as fsDb, auth } from "./firebase.js";
import { getDatabase, ref, get, set, update, push, onValue,
         onChildAdded, off, runTransaction, onDisconnect,
         serverTimestamp } from "firebase/database";
import { getFunctions, httpsCallable } from "firebase/functions";
import { account } from "./account.js";

let rtdb = null, fns = null;
export function initOnline(app){
  const url = import.meta.env.VITE_FB_DB_URL;
  rtdb = url ? getDatabase(app, url) : getDatabase(app);
  fns = getFunctions(app, "asia-northeast3");
}
const call = name => httpsCallable(fns, name);

export const online = {
  code: null,       /* 방 번호 */
  seat: -1,         /* 내 자리 */
  room: null,       /* 방 상태 */
  hand: [],         /* 내 손패 */
  onRoom: null,     /* 방이 바뀌면 부른다 */
  onMove: null,     /* 새 수가 들어오면 부른다 */
  onHand: null,
};

/* ---------- 방 만들기 ---------- */

function code4(){ return String(Math.floor(1000 + Math.random() * 9000)); }

export async function createRoom(opts){
  /* 안 쓰는 번호를 잡는다. 동시에 같은 번호를 노려도 한 명만 성공한다 */
  for (let i = 0; i < 12; i++){
    const c = code4();
    const r = ref(rtdb, `rooms/${c}`);
    await get(r);                               /* 서버 값을 먼저 받아 둔다 */
    const res = await runTransaction(r, cur => {
      if (cur !== null) return;                 /* 이미 쓰는 번호 */
      return {
        host: account.uid,
        phase: "waiting",
        roundNo: 1,
        opts: { cap: opts.cap, rounds: opts.rounds, tax: opts.tax, clear2: opts.clear2 },
        seats: [{ uid: account.uid, name: account.name, tier: account.tier }],
        score: [0],
        createdAt: Date.now(),
        touchedAt: Date.now(),
      };
    });
    if (res.committed){
      online.code = c;
      online.seat = 0;
      rememberRoom(c);
      await watchRoom(c);
      console.log("방을 만들었습니다:", c);
      return c;
    }
  }
  throw new Error("방 번호를 만들지 못했습니다 (빈 번호 없음)");
}

/* ---------- 참가 ---------- */

const KEEP = "zk_room";
export function rememberRoom(c){ try { localStorage.setItem(KEEP, c || ""); } catch(e){} }
export function forgetRoom(){ try { localStorage.removeItem(KEEP); } catch(e){} }
export function lastRoom(){ try { return localStorage.getItem(KEEP) || ""; } catch(e){ return ""; } }

/* 새로고침 뒤 원래 방으로 돌아간다. 없으면 빈 값 */
export async function rejoin(){
  const c = lastRoom();
  if (!c) return null;
  const snap = await get(ref(rtdb, `rooms/${c}`));
  if (!snap.exists()){ forgetRoom(); return null; }
  const room = snap.val();
  const seats = room.seats || [];
  const seat = seats.findIndex(s => s && s.uid === account.uid);
  if (seat < 0){ forgetRoom(); return null; }
  online.code = c;
  online.seat = seat;
  await watchRoom(c);
  return { code: c, seat: seat, phase: room.phase };
}

export async function joinRoom(c){
  const r = ref(rtdb, `rooms/${c}`);

  /* 먼저 서버에서 방을 받아온다.
     이걸 안 하면 아래 처리가 "아직 안 받아온 빈 값"을 보고 방이 없다고 판단해 버린다. */
  const first = await get(r);
  if (!first.exists()) throw new Error("그런 방이 없습니다 (" + c + ")");

  let seat = -1, why = "";
  const res = await runTransaction(r, cur => {
    if (cur === null){ why = "그런 방이 없습니다 (" + c + ")"; return; }
    if (cur.phase !== "waiting"){ why = "이미 시작한 방입니다"; return; }
    const seats = cur.seats || [];
    if (seats.length >= (cur.opts ? cur.opts.cap : 6)){ why = "자리가 찼습니다"; return; }
    if (seats.some(s => s && s.uid === account.uid)){ why = "이미 들어와 있습니다"; return; }
    seat = seats.length;
    seats.push({ uid: account.uid, name: account.name, tier: account.tier });
    cur.seats = seats;
    cur.score = (cur.score || []).concat(0);
    cur.touchedAt = Date.now();
    return cur;
  });
  if (!res.committed) throw new Error(why || "들어갈 수 없습니다");
  online.code = c;
  online.seat = seat;
  rememberRoom(c);
  await watchRoom(c);
  return seat;
}

/* ---------- 지켜보기 ---------- */

let roomUnsub = null, moveUnsub = null, handUnsub = null;

async function watchRoom(c){
  stopWatch();
  const rr = ref(rtdb, `rooms/${c}`);

  /* 접속이 끊기면 표시해 둔다. 1분 뒤 남은 사람이 이탈로 처리한다 */
  const meRef = ref(rtdb, `rooms/${c}/live/${account.uid}`);
  await set(meRef, Date.now());
  onDisconnect(meRef).set(0);

  roomUnsub = onValue(rr, snap => {
    online.room = snap.val();
    if (online.room && online.onRoom) online.onRoom(online.room);
  });

  /* 새로 붙는 수만 듣는다 */
  moveUnsub = onChildAdded(ref(rtdb, `rooms/${c}/moves`), snap => {
    if (online.onMove) online.onMove(Number(snap.key), snap.val());
  });

  handUnsub = onValue(ref(rtdb, `hands/${c}/${account.uid}`), snap => {
    online.hand = snap.val() || [];
    if (online.onHand) online.onHand(online.hand);
  });
}

export function stopWatch(){
  [roomUnsub, moveUnsub, handUnsub].forEach(f => { try { f && f(); } catch(e){} });
  roomUnsub = moveUnsub = handUnsub = null;
}

/* ---------- 내 수를 적는다 ---------- */

/* 번호를 붙여서 적는다. 이미 그 번호가 있으면 남이 먼저 적은 것이라 거부된다 */
export async function playCards(num, count){
  const c = online.code;
  const seq = (online.room?.round?.seq || 0) + 1;
  const r = ref(rtdb, `rooms/${c}/moves/${seq}`);
  const res = await runTransaction(r, cur => {
    if (cur !== null) return;                       /* 남이 먼저 적었다 */
    return `${online.seat},${num},${count}`;
  });
  if (!res.committed) return false;

  /* 내 손패에서 빼고 판 상태를 갱신한다 */
  const hand = online.hand.slice();
  const used = [];
  for (let i = 0; i < count; i++){
    let at = hand.indexOf(num);
    if (at < 0) at = hand.findIndex(x => x >= 13);
    if (at < 0) return false;
    used.push(hand.splice(at, 1)[0]);
  }
  const r2 = online.room.round;
  const counts = r2.counts.slice();
  counts[online.seat] = hand.length;

  await update(ref(rtdb), {
    [`hands/${c}/${account.uid}`]: hand,
    [`rooms/${c}/round/seq`]: seq,
    [`rooms/${c}/round/counts`]: counts,
    [`rooms/${c}/round/trick`]: num === 1 ? null : { by: online.seat, num, count },
    [`rooms/${c}/round/turn`]: nextTurn(num === 1),
    [`rooms/${c}/round/deadline`]: Date.now() + 15000,
    [`rooms/${c}/touchedAt`]: Date.now(),
  });
  return true;
}

export async function passTurn(){
  const c = online.code;
  const seq = (online.room?.round?.seq || 0) + 1;
  const res = await runTransaction(ref(rtdb, `rooms/${c}/moves/${seq}`), cur => {
    if (cur !== null) return;
    return `${online.seat},p`;
  });
  if (!res.committed) return false;

  const passed = online.room.round.passed.slice();
  passed[online.seat] = true;
  await update(ref(rtdb), {
    [`rooms/${c}/round/seq`]: seq,
    [`rooms/${c}/round/passed`]: passed,
    [`rooms/${c}/round/turn`]: nextTurn(false, passed),
    [`rooms/${c}/round/deadline`]: Date.now() + 15000,
    [`rooms/${c}/touchedAt`]: Date.now(),
  });
  return true;
}

/* 1번을 냈으면 그대로 선을 잡는다 */
function nextTurn(keep, passedArg){
  const r = online.room.round;
  const seats = online.room.seats || [];
  const passed = passedArg || r.passed;
  if (keep) return online.seat;
  let t = online.seat, g = 0;
  do { t = (t + 1) % seats.length; }
  while ((r.counts[t] === 0 || passed[t]) && g++ < seats.length * 2);
  return t;
}

/* ---------- 서버 부르기 ---------- */

export const startRound  = (code)        => call("startRound")({ code });
export const settleRound = (code, give)  => call("settleRound")({ code, give });
export const botMoves    = (code)        => call("botMoves")({ code });
export const finishGame  = (code)        => call("finishGame")({ code });

/* ---------- 나가기 ---------- */

export async function leaveRoom(){
  const c = online.code;
  if (!c) return;
  const seats = (online.room?.seats || []).slice();
  if (seats[online.seat]) seats[online.seat].left = true;
  await update(ref(rtdb, `rooms/${c}`), { seats, touchedAt: Date.now() });
  forgetRoom();
  stopWatch();
  online.code = null; online.seat = -1; online.room = null;
}
