/* 서버가 맡는 일은 넷뿐이다.
   1) 판 시작할 때 카드를 나눈다
   2) 판이 끝나면 세금을 처리하고 다음 판 패를 만든다
   3) 봇 차례가 오면 다음 수를 정한다 (연달아 있으면 한 번에)
   4) 게임이 끝나면 전체를 다시 돌려 검증하고 점수를 준다

   진행 자체는 앱끼리 실시간 데이터베이스로 주고받는다. 서버를 안 부른다. */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { deal, takeFrom, legalMove, isJoker } from "./deck.js";

initializeApp();
const rtdb = () => getDatabase();
const fs = () => getFirestore();

const REGION = { region: "asia-northeast3" };

/* ---------- 도우미 ---------- */

function requireAuth(req){
  if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다");
  return req.auth.uid;
}

async function loadRoom(code){
  const snap = await rtdb().ref(`rooms/${code}`).get();
  if (!snap.exists()) throw new HttpsError("not-found", "방이 없습니다");
  return snap.val();
}

/* 실시간 데이터베이스는 중간이 빈 배열을 객체({0:..,2:..})로 돌려준다.
   항상 배열로 바꿔서 다룬다. */
function seatArray(seats, cap){
  const n = cap || 8;
  const out = new Array(n).fill(null);
  if (!seats) return out;
  if (Array.isArray(seats)) seats.forEach((v, i) => { if (i < n) out[i] = v || null; });
  else Object.keys(seats).forEach(k => { const i = Number(k); if (i >= 0 && i < n) out[i] = seats[k] || null; });
  return out;
}

/* 실제로 앉아 있는 사람만 순서대로. 자리 번호도 같이 들고 다닌다 */
function alive(seats, cap){
  const out = [];
  seatArray(seats, cap).forEach((s, i) => { if (s && !s.left) out.push(Object.assign({}, s, {at: i})); });
  return out;
}

/* 점수를 받는 등수까지 — 상위 절반 */
const winners = n => Math.floor(n / 2);
const roundPoints = (rank, n) => (rank < winners(n) ? 100 - rank * 10 : 0);

/* ---------- 1) 판 시작 ---------- */

export const startRound = onCall(REGION, async req => {
  const uid = requireAuth(req);
  const { code } = req.data || {};
  const room = await loadRoom(code);

  if (room.host !== uid) throw new HttpsError("permission-denied", "방장만 시작할 수 있습니다");
  if (room.phase === "playing") throw new HttpsError("failed-precondition", "이미 진행 중입니다");

  const cap = (room.opts && room.opts.cap) || 8;
  const live = alive(room.seats, cap);
  if (live.length < 4) throw new HttpsError("failed-precondition", "4명이 모여야 시작합니다");

  const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  const hands = deal(live.length, seed);

  /* 손패는 각자 것만 볼 수 있는 곳에 넣는다. 봇 손패도 여기 둔다 */
  const handWrites = {};
  live.forEach((s, i) => { handWrites[`hands/${code}/${s.uid}`] = hands[i]; });

  /* 첫 판은 카드를 뽑아 선을 정한다. 이후 판은 지난 판 1등이 선 */
  const lead = room.roundNo > 1 && room.lastWinner != null
    ? live.findIndex(s => s.uid === room.lastWinner)
    : Math.floor(Math.random() * live.length);

  await rtdb().ref().update({
    ...handWrites,
    [`rooms/${code}/phase`]: "playing",
    [`rooms/${code}/seed`]: seed,
    [`rooms/${code}/order`]: live.map(s => s.at),   /* 실제 자리 번호 순서 */
    [`rooms/${code}/round`]: {
      no: room.roundNo || 1,
      turn: lead < 0 ? 0 : lead,
      lead: lead < 0 ? 0 : lead,
      counts: hands.map(h => h.length),
      trick: null,
      passed: live.map(() => false),
      finish: [],
      deadline: Date.now() + 15000,
      seq: 0,
    },
    [`rooms/${code}/moves`]: null,
  });

  return { ok: true, seat: live.findIndex(s => s.uid === uid) };
});

/* ---------- 3) 봇 차례 ---------- */

/* 앱에서 검증된 것과 같은 판단. 약한 카드부터 털되 조합은 깨지 않는다 */
function botPick(hand, cur){
  const jok = hand.filter(isJoker).length;
  const cnt = {};
  hand.forEach(c => { if (!isJoker(c)) cnt[c] = (cnt[c] || 0) + 1; });

  const opts = [];
  const maxN = cur ? cur.num - 1 : 12;
  for (let n = 1; n <= maxN; n++){
    const same = cnt[n] || 0;
    if (!same) continue;
    if (cur){
      const need = cur.count - same;
      if (need > jok) continue;
      opts.push({ num: n, count: cur.count, useJok: Math.max(0, need), own: same });
    } else {
      opts.push({ num: n, count: same, useJok: 0, own: same });
    }
  }
  if (!opts.length){
    /* 손에 카멜레온만 남은 경우. 혼자 내면 13번으로 칠 수 있다 (선일 때만) */
    if (!cur && jok > 0) return { num: 13, count: 1, useJok: 1, own: 0 };
    return null;
  }

  opts.forEach(o => {
    let s = o.num * 2;                       /* 약한 카드부터 */
    s -= o.useJok * 10;                      /* 카멜레온은 아깝다 */
    if (cur && o.own > o.count) s -= 24;     /* 남는 짝을 깨면 감점 */
    o.score = s;
  });
  opts.sort((a, b) => b.score - a.score);
  if (opts.length > 1 && Math.random() < 0.1) return opts[1];
  return opts[0];
}

export const botMoves = onCall(REGION, async req => {
  requireAuth(req);
  const { code } = req.data || {};
  const room = await loadRoom(code);
  if (room.phase !== "playing") throw new HttpsError("failed-precondition", "진행 중이 아닙니다");

  const seats = alive(room.seats, (room.opts && room.opts.cap) || 8);
  const r = room.round;
  const made = [];
  let seq = r.seq || 0;
  let turn = r.turn;
  let trick = r.trick;
  let passed = r.passed.slice();
  const counts = r.counts.slice();
  const finish = (r.finish || []).slice();

  /* 손패를 한 번에 읽어 둔다 */
  const hands = {};
  for (const s of seats){
    if (!s.bot) continue;
    const h = await rtdb().ref(`hands/${code}/${s.uid}`).get();
    hands[s.uid] = h.val() || [];
  }

  /* 봇 차례가 이어지는 동안 계속 둔다. 사람 차례가 오면 멈춘다 */
  let guard = 0;
  while (guard++ < 60){
    const s = seats[turn];
    if (!s || !s.bot) break;                       /* 사람 차례 */
    if (counts[turn] === 0 || passed[turn]){       /* 이미 끝났거나 패스함 */
      turn = (turn + 1) % seats.length;
      continue;
    }

    const hand = hands[s.uid] || [];
    const pick = botPick(hand, trick);

    if (pick){
      const t = takeFrom(hand, pick.num, pick.count);
      if (!t) break;
      hands[s.uid] = t.hand;
      counts[turn] = t.hand.length;
      trick = { by: turn, num: pick.num, count: pick.count };
      made.push({ seq: ++seq, seat: turn, num: pick.num, count: pick.count });
      if (t.hand.length === 0) finish.push(turn);
      /* 1번은 아무도 못 받으니 바로 정리하고 다시 선 */
      if (pick.num === 1){
        trick = null;
        passed = seats.map(() => false);
        if (counts[turn] > 0) continue;
      }
    } else {
      passed[turn] = true;
      made.push({ seq: ++seq, seat: turn, pass: true });
    }

    /* 남은 사람이 하나뿐이면 바닥을 치우고 마지막에 낸 사람이 다시 선 */
    const still = seats.filter((x, i) => counts[i] > 0 && !passed[i]).length;
    if (still <= 1 && trick){
      const last = trick.by;
      trick = null;
      passed = seats.map(() => false);
      turn = counts[last] > 0 ? last : (last + 1) % seats.length;
      while (counts[turn] === 0) turn = (turn + 1) % seats.length;
      continue;
    }

    do { turn = (turn + 1) % seats.length; }
    while (counts[turn] === 0 || passed[turn]);
  }

  if (!made.length) return { ok: true, made: 0 };

  /* 바뀐 것만 한 번에 적는다 */
  const writes = {};
  made.forEach(m => { writes[`rooms/${code}/moves/${m.seq}`] = m.pass
    ? `${m.seat},p` : `${m.seat},${m.num},${m.count}`; });
  Object.entries(hands).forEach(([u, h]) => { writes[`hands/${code}/${u}`] = h; });
  writes[`rooms/${code}/round/turn`] = turn;
  writes[`rooms/${code}/round/trick`] = trick;
  writes[`rooms/${code}/round/passed`] = passed;
  writes[`rooms/${code}/round/counts`] = counts;
  writes[`rooms/${code}/round/finish`] = finish;
  writes[`rooms/${code}/round/seq`] = seq;
  writes[`rooms/${code}/round/deadline`] = Date.now() + 15000;
  await rtdb().ref().update(writes);

  return { ok: true, made: made.length };
});

/* ---------- 2) 세금과 다음 판 ---------- */

export const settleRound = onCall(REGION, async req => {
  const uid = requireAuth(req);
  const { code, give } = req.data || {};      /* give: 1등이 꼴등에게 줄 카드 두 장 */
  const room = await loadRoom(code);
  const seats = alive(room.seats, (room.opts && room.opts.cap) || 8);
  const r = room.round;

  /* 앱이 적어 둔 완주 순서를 쓴다. 빠진 사람은 뒤에 붙인다 */
  const order = (r.finish || []).slice();
  seats.forEach((_, i) => { if (!order.includes(i)) order.push(i); });

  /* 이번 판 점수 — 상위 절반만 */
  const score = (room.score || seats.map(() => 0)).slice();
  order.forEach((seat, rank) => { score[seat] += roundPoints(rank, seats.length); });

  const roundNo = (room.roundNo || 1) + 1;
  /* 남은 사람이 3명이면 이 판까지만, 2명 이하면 즉시 끝낸다 */
  const humans = seats.length;
  const last = roundNo > (room.opts?.rounds || 5) || humans <= 3;

  if (last){
    await rtdb().ref(`rooms/${code}`).update({ score, phase: "over", order });
    return { ok: true, over: true, order, score };
  }

  /* 다음 판 카드를 새로 나눈다 */
  const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  const hands = deal(seats.length, seed);

  /* 세금: 1등↔꼴등 두 장, 2등↔뒤에서 2등 한 장.
     하위가 가장 좋은(낮은) 카드를 내주고, 상위는 아무 카드나 준다.
     카멜레온은 이때 가장 나쁜 카드로 친다. */
  const worst = c => (isJoker(c) ? 99 : c);
  const tax = (hiIdx, loIdx, n) => {
    const hi = hands[order[hiIdx]], lo = hands[order[loIdx]];
    lo.sort((a, b) => worst(a) - worst(b));
    const fromLo = lo.splice(0, n);                    /* 하위의 가장 좋은 카드 */
    let fromHi;
    if (hiIdx === 0 && Array.isArray(give) && give.length === n){
      fromHi = [];
      for (const c of give){
        const at = hi.indexOf(c);
        if (at >= 0) fromHi.push(hi.splice(at, 1)[0]);
      }
      while (fromHi.length < n){                        /* 고른 게 손에 없으면 */
        hi.sort((a, b) => worst(b) - worst(a));
        fromHi.push(hi.shift());
      }
    } else {
      hi.sort((a, b) => worst(b) - worst(a));           /* 안 고르면 가장 나쁜 것 */
      fromHi = hi.splice(0, n);
    }
    hi.push(...fromLo); lo.push(...fromHi);
    hi.sort((a, b) => a - b); lo.sort((a, b) => a - b);
  };

  const revSeat = hands.findIndex(h => h.filter(isJoker).length === 2);
  const revolution = revSeat >= 0;
  const greatRev = revolution && order[order.length - 1] === revSeat;

  if (!revolution && seats.length >= 4){
    tax(0, order.length - 1, 2);
    if (order.length >= 4) tax(1, order.length - 2, 1);
  }
  if (greatRev) order.reverse();

  const handWrites = {};
  seats.forEach((s, i) => { handWrites[`hands/${code}/${s.uid}`] = hands[i]; });

  const lead = order[0];
  await rtdb().ref().update({
    ...handWrites,
    [`rooms/${code}/score`]: score,
    [`rooms/${code}/roundNo`]: roundNo,
    [`rooms/${code}/lastWinner`]: seats[order[0]]?.uid || null,
    [`rooms/${code}/revolution`]: revolution ? { seat: revSeat, great: greatRev } : null,
    [`rooms/${code}/moves`]: null,
    [`rooms/${code}/round`]: {
      no: roundNo, turn: lead, lead,
      counts: hands.map(h => h.length),
      trick: null, passed: seats.map(() => false), finish: [],
      deadline: Date.now() + 15000, seq: 0,
    },
  });

  return { ok: true, roundNo, order, score, revolution, greatRev };
});

/* ---------- 4) 게임 종료와 점수 ---------- */

export const finishGame = onCall(REGION, async req => {
  const uid = requireAuth(req);
  const { code } = req.data || {};
  const room = await loadRoom(code);
  if (room.phase !== "over") throw new HttpsError("failed-precondition", "아직 안 끝났습니다");

  const seats = seatArray(room.seats, (room.opts && room.opts.cap) || 8);
  const score = room.score || [];
  const me = seats.findIndex(s => s && s.uid === uid);
  if (me < 0) throw new HttpsError("permission-denied", "이 방의 참가자가 아닙니다");
  if (room.paid && room.paid[uid]) return { ok: true, gained: 0, already: true };

  const earned = score[me] || 0;
  const quit = Boolean(seats[me].left);
  const gained = quit ? Math.floor(earned / 2) : earned;

  if (gained > 0){
    await fs().doc(`users/${uid}`).update({
      score: FieldValue.increment(gained),
      games: FieldValue.increment(1),
      lastPlayed: FieldValue.serverTimestamp(),
    });
  }
  await rtdb().ref(`rooms/${code}/paid/${uid}`).set(true);

  return { ok: true, gained, earned, quit };
});
