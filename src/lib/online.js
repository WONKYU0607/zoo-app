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
    const cur0 = await get(r);
    if (cur0.exists()) continue;                /* 이미 쓰는 번호 */
    const res = await runTransaction(r, cur => {
      if (cur !== null) return;                 /* 그 사이에 남이 잡았다 */
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
  const seats = seatArray(room);
  const seat = seats.findIndex(s => s && s.uid === account.uid);
  if (seat < 0){ forgetRoom(); return null; }
  online.code = c;
  online.seat = seat;
  await watchRoom(c);
  return { code: c, seat: seat, phase: room.phase };
}

/* 방에 들어간다.
   주의: runTransaction 은 서버 값을 받기 전에 빈 값으로 한 번 실행된다.
   그 시점 판단으로 자리를 잡으면 남의 자리를 덮었다가 되돌리는 깜빡임이 생긴다.
   그래서 자리 잡기는 트랜잭션이 아니라 "빈 자리에만 쓸 수 있다"는 규칙에 맡긴다. */
export async function joinRoom(c){
  const r = ref(rtdb, `rooms/${c}`);

  const snap = await get(r);
  if (!snap.exists()) throw new Error("그런 방이 없습니다 (" + c + ")");
  const room = snap.val();
  if (room.phase !== "waiting") throw new Error("이미 시작한 방입니다");

  const cap = (room.opts && room.opts.cap) || 6;
  const seats = seatArray(room, cap);

  /* 이미 들어와 있으면 그 자리로 돌아간다 */
  const mine = seats.findIndex(s => s && s.uid === account.uid);
  if (mine >= 0) return await settle(c, mine);

  const me = { uid: account.uid, name: account.name, tier: account.tier };

  /* 앞에서부터 훑는다. 중간이 비어 있으면 그 자리를 쓴다 */
  for (let i = 0; i < cap; i++){
    if (seats[i]) continue;
    try {
      /* 규칙이 "빈 자리에만 쓸 수 있다"를 강제한다.
         남이 먼저 잡았으면 여기서 권한 오류가 나고 다음 자리로 넘어간다 */
      await set(ref(rtdb, `rooms/${c}/seats/${i}`), me);
    } catch(e){ continue; }

    /* 잡은 뒤 다시 확인한다. 그 사이에 게임이 시작됐을 수 있다 */
    const after = await get(r);
    const now = after.exists() ? after.val() : null;
    const ok = now && now.seats && now.seats[i] && now.seats[i].uid === account.uid;
    if (!ok) continue;                                  /* 못 잡았다 */
    if (now.phase !== "waiting"){                       /* 그새 시작됐다 */
      try { await set(ref(rtdb, `rooms/${c}/seats/${i}`), null); } catch(e){}
      throw new Error("이미 시작한 방입니다");
    }
    /* 점수 칸을 자리 번호에 맞춰 채운다 */
    try { await set(ref(rtdb, `rooms/${c}/score/${i}`), 0); } catch(e){}
    await update(r, { touchedAt: Date.now() });
    return await settle(c, i);
  }
  throw new Error("자리가 찼습니다");
}

async function settle(c, seat){
  online.code = c;
  online.seat = seat;
  rememberRoom(c);
  await watchRoom(c);
  return seat;
}

/* 방 조건을 저장한다. 정원이 줄면 봇부터 뺀다 */
export async function saveOpts(c, opts){
  if (!c) return;
  await set(ref(rtdb, `rooms/${c}/opts`), opts);
  const snap = await get(ref(rtdb, `rooms/${c}`));
  if (!snap.exists()) return;
  const room = snap.val();
  const cap = opts.cap || 6;
  const seats = seatArray(room, Math.max(cap, 8));
  /* 정원 밖으로 밀려난 자리와 넘치는 봇을 정리한다 */
  for (let i = seats.length - 1; i >= 0; i--){
    if (!seats[i]) continue;
    if (i >= cap){ try { await set(ref(rtdb, `rooms/${c}/seats/${i}`), null); } catch(e){} }
  }
  let n = 0;
  for (let i = 0; i < cap; i++) if (seats[i]) n++;
  for (let i = cap - 1; i >= 0 && n > cap; i--){
    if (seats[i] && seats[i].bot){
      try { await set(ref(rtdb, `rooms/${c}/seats/${i}`), null); n--; } catch(e){}
    }
  }
  await set(ref(rtdb, `rooms/${c}/touchedAt`), Date.now());
}

/* 판이 끝난 순서를 방에 적는다 */
export async function reportFinish(c, order){
  if (!c) return;
  await set(ref(rtdb, `rooms/${c}/round/finish`), order || []);
}

/* 접속이 끊긴 사람을 나간 것으로 표시한다 (1분 뒤) */
export async function markOff(c, seat){
  if (!c) return;
  await update(ref(rtdb, `rooms/${c}/seats/${seat}`), { off: true, left: true });
}

/* 살아 있음을 알린다. 30초마다 */
let beat = null;
export function startBeat(){
  stopBeat();
  const c = online.code;
  if (!c) return;
  const mark = () => { try { set(ref(rtdb, `rooms/${c}/live/${account.uid}`), Date.now()); } catch(e){} };
  mark();
  beat = setInterval(mark, 30000);
}
export function stopBeat(){ if (beat){ clearInterval(beat); beat = null; } }

/* 봇 이름. 사람인 척 하므로 표시는 따로 하지 않는다 */
const BOT_NAMES = ["태윤","서연","준호","민지","하은","지훈","예린","도윤","수아","현우",
                   "지아","서준","하린","시우","윤서","건우"];

/* 빈 자리에 봇을 하나 넣는다. 방장만 부른다 */
export async function addBot(){
  const c = online.code;
  if (!c) return false;
  const snap = await get(ref(rtdb, `rooms/${c}`));
  if (!snap.exists()) return false;
  const room = snap.val();
  if (room.phase !== "waiting") return false;
  if (room.host !== account.uid) return false;

  const cap = (room.opts && room.opts.cap) || 6;
  const seats = seatArray(room, cap);
  const filled = seatCount(room, cap);
  const bots = seats.filter(s => s && s.bot).length;
  if (filled >= cap) return false;
  if (bots >= Math.floor(cap / 2)) return false;      /* 봇은 정원의 절반까지 */

  /* 안 쓰는 이름을 고른다 */
  const used = seats.filter(Boolean).map(s => s.name);
  const pool = BOT_NAMES.filter(n => !used.includes(n));
  if (!pool.length) return false;
  const name = pool[Math.floor(Math.random() * pool.length)];

  /* 빈 자리 아무 데나 (몰아 앉히면 봇인 게 티가 난다) */
  const empty = [];
  for (let i = 0; i < cap; i++) if (!seats[i]) empty.push(i);
  if (!empty.length) return false;
  const at = empty[Math.floor(Math.random() * empty.length)];

  try {
    await set(ref(rtdb, `rooms/${c}/seats/${at}`), {
      uid: "bot_" + c + "_" + at, name: name, tier: 0, bot: true,
    });
    await set(ref(rtdb, `rooms/${c}/score/${at}`), 0);
    await set(ref(rtdb, `rooms/${c}/touchedAt`), Date.now());
  } catch(e){ console.warn("봇 넣기 실패", e); return false; }
  return true;
}

/* 자리 목록을 항상 배열로 만든다.
   Firebase 는 중간이 빈 배열을 객체({0:..,2:..})로 돌려준다.
   그대로 쓰면 map 이 없어서 화면이 멈춘다. */
export function seatArray(room, cap){
  const raw = (room && room.seats) || [];
  const n = cap || (room && room.opts && room.opts.cap) || 8;
  const out = new Array(n).fill(null);
  if (Array.isArray(raw)) raw.forEach((v, i) => { if (i < n) out[i] = v || null; });
  else Object.keys(raw).forEach(k => { const i = +k; if (i >= 0 && i < n) out[i] = raw[k] || null; });
  return out;
}

/* 실제로 앉아 있는 사람 수 (중간이 비어 있어도 정확하다) */
export function seatCount(room, cap){
  return seatArray(room, cap).filter(s => s && !s.left).length;
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

  startBeat();
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
  stopBeat();
  [roomUnsub, moveUnsub, handUnsub].forEach(f => { try { f && f(); } catch(e){} });
  roomUnsub = moveUnsub = handUnsub = null;
}

/* 화면이 만든 수 문자열을 그대로 서버 목록에 붙인다 ("자리,숫자,장수" 또는 "자리,p") */
export async function playMove(mv){
  const c = online.code;
  if (!c) return false;
  const seq = (online.room && online.room.round ? online.room.round.seq : 0) + 1;
  const res = await runTransaction(ref(rtdb, `rooms/${c}/moves/${seq}`),
                                   cur => (cur ? undefined : mv));
  if (!res.committed) return false;
  await update(ref(rtdb, `rooms/${c}/round`), { seq: seq });
  return true;
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

/* 무엇이 잘못됐는지 알아보는 도구. 콘솔에서 __peek("9104") 처럼 쓴다 */
export async function peek(code){
  const out = { code: String(code), dbUrl: import.meta.env.VITE_FB_DB_URL || "(없음)" };
  try {
    const s1 = await get(ref(rtdb, `rooms/${code}`));
    out.방있음 = s1.exists();
    out.방내용 = s1.val();
  } catch(e){ out.방읽기오류 = e.code || e.message; }
  try {
    const s2 = await get(ref(rtdb, "rooms"));
    out.전체방목록 = s2.exists() ? Object.keys(s2.val()) : [];
  } catch(e){ out.목록읽기오류 = e.code || e.message; }
  console.log(out);
  return out;
}

export const startRound  = (code)        => call("startRound")({ code });
export const settleRound = (code, give)  => call("settleRound")({ code, give });
export const botMoves    = (code)        => call("botMoves")({ code });
export const finishGame  = (code)        => call("finishGame")({ code });

/* ---------- 나가기 ---------- */

export async function leaveRoom(){
  const c = online.code, i = online.seat;
  if (!c) return;
  try {
    /* 내 자리만 손댄다. 자리 배열을 통째로 쓰면 규칙이 막고 남의 자리도 건드리게 된다 */
    if (i >= 0){
      const waiting = online.room && online.room.phase === "waiting";
      if (waiting) await set(ref(rtdb, `rooms/${c}/seats/${i}`), null);   /* 대기 중이면 자리를 비운다 */
      else await update(ref(rtdb, `rooms/${c}/seats/${i}`), { left: true });
    }
    await set(ref(rtdb, `rooms/${c}/touchedAt`), Date.now());
  } catch(e){ console.warn("나가기 실패", e); }
  forgetRoom();
  stopWatch();
  online.code = null; online.seat = -1; online.room = null;
}
