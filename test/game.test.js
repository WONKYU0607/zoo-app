/* 한 게임을 처음부터 끝까지 자동으로 플레이해서 어디가 깨지는지 찾는다.
   에뮬레이터(내 컴퓨터 안의 가짜 서버)를 상대로 돈다. 실제 데이터는 안 건드린다.

   쓰는 법:
     터미널 1)  npm run emu
     터미널 2)  npm run test:game

   결과는 단계별로 [OK] / [실패] 로 찍힌다. */

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator, ref, get, set, update,
         onValue, onChildAdded, runTransaction } from "firebase/database";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { makeDeck, takeFrom, legalMove, isJoker } from "../functions/deck.js";

const PROJECT = "zoo-app-d6cb4";
const REGION  = "asia-northeast3";

let pass = 0, fail = 0;
const step = (name, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + name + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + name + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

/* 한 사람 몫의 접속을 만든다 */
async function makeClient(tag){
  const app = initializeApp({
    apiKey: "demo", projectId: PROJECT,
    databaseURL: "http://127.0.0.1:9000/?ns=" + PROJECT,
  }, tag);
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const db = getDatabase(app);
  connectDatabaseEmulator(db, "127.0.0.1", 9000);
  const fns = getFunctions(app, REGION);
  connectFunctionsEmulator(fns, "127.0.0.1", 5001);
  const cred = await signInAnonymously(auth);
  return { app, db, fns, uid: cred.user.uid, name: tag,
           call: n => httpsCallable(fns, n) };
}

/* 방을 하나 만든다 */
async function createRoom(c, cap, rounds){
  const code = String(Math.floor(1000 + Math.random() * 9000));
  await set(ref(c.db, `rooms/${code}`), {
    host: c.uid, phase: "waiting", roundNo: 1,
    opts: { cap, rounds, tax: true, clear2: false },
    seats: [{ uid: c.uid, name: c.name, tier: 0 }],
    score: [0], createdAt: Date.now(), touchedAt: Date.now(),
  });
  return code;
}

/* 빈자리에 봇을 넣는다 */
async function addBots(c, code, howMany){
  const names = ["서연","준호","민지","태윤","하은","지훈","예린"];
  const snap = await get(ref(c.db, `rooms/${code}`));
  const room = snap.val();
  const cap = room.opts.cap;
  const seats = room.seats || [];
  let added = 0;
  for (let i = 0; i < cap && added < howMany; i++){
    if (seats[i]) continue;
    await set(ref(c.db, `rooms/${code}/seats/${i}`), {
      uid: "bot_" + code + "_" + i, name: names[added % names.length], tier: 0, bot: true,
    });
    await set(ref(c.db, `rooms/${code}/score/${i}`), 0);
    added++;
  }
  return added;
}

/* 자리 목록을 항상 배열로 */
function seatArray(raw, n){
  const out = new Array(n).fill(null);
  if (!raw) return out;
  if (Array.isArray(raw)) raw.forEach((v, i) => { if (i < n) out[i] = v || null; });
  else Object.keys(raw).forEach(k => { const i = +k; if (i >= 0 && i < n) out[i] = raw[k] || null; });
  return out;
}

/* 사람 몫으로 낼 수를 고른다 (앱의 판단과 같게) */
function pickMove(hand, cur){
  const jok = hand.filter(isJoker).length;
  const cnt = {};
  hand.forEach(x => { if (!isJoker(x)) cnt[x] = (cnt[x] || 0) + 1; });
  const opts = [];
  const maxN = cur ? cur.num - 1 : 12;
  for (let n = 1; n <= maxN; n++){
    const same = cnt[n] || 0;
    if (!same) continue;
    if (cur){ const need = cur.count - same; if (need > jok) continue;
      opts.push({ num: n, count: cur.count, useJok: Math.max(0, need), own: same }); }
    else opts.push({ num: n, count: same, useJok: 0, own: same });
  }
  if (!opts.length){ if (!cur && jok > 0) return { num: 13, count: 1 }; return null; }
  opts.forEach(o => { let s = o.num * 2; s -= o.useJok * 10;
    if (cur && o.own > o.count) s -= 24; o.score = s; });
  opts.sort((a, b) => b.score - a.score);
  return opts[0];
}

async function main(){
  console.log("\n=== 한 게임 자동 시험 ===\n");

  /* 1. 접속 */
  let me;
  try { me = await makeClient("나"); step("로그인", true, me.uid.slice(0, 8)); }
  catch (e){ step("로그인", false, String(e.message || e)); return done(); }

  /* 2. 방 만들기 */
  let code;
  try { code = await createRoom(me, 6, 3); step("방 만들기", true, "번호 " + code); }
  catch (e){ step("방 만들기", false, String(e.message || e)); return done(); }

  /* 3. 봇 채우기 */
  try {
    const n = await addBots(me, code, 5);
    const snap = await get(ref(me.db, `rooms/${code}`));
    const seats = seatArray(snap.val().seats, 6).filter(Boolean).length;
    step("봇 채우기", seats === 6, "자리 " + seats + "명");
  } catch (e){ step("봇 채우기", false, String(e.message || e)); return done(); }

  /* 4. 판 시작 (서버가 카드를 나눈다) */
  try {
    await me.call("startRound")({ code });
    const snap = await get(ref(me.db, `rooms/${code}`));
    const room = snap.val();
    const hand = (await get(ref(me.db, `hands/${code}/${me.uid}`))).val() || [];
    step("판 시작", room.phase === "playing", "상태 " + room.phase);
    step("내 손패 받기", hand.length > 0, hand.length + "장");
    step("자리 순서 기록", Array.isArray(room.order) && room.order.length === 6,
         "order " + JSON.stringify(room.order));
    const total = (room.round.counts || []).reduce((a, b) => a + b, 0);
    step("카드 80장 배분", total === 80, "합계 " + total);
    /* 남의 패는 안 보여야 한다 */
    let leaked = false;
    for (const s of seatArray(room.seats, 6)){
      if (!s || s.uid === me.uid) continue;
      try {
        const h = await get(ref(me.db, `hands/${code}/${s.uid}`));
        if (h.exists()) leaked = true;
      } catch (e){ /* 막히는 것이 정상 */ }
    }
    step("남의 손패는 안 보임", !leaked);
  } catch (e){ step("판 시작", false, String(e.message || e)); return done(); }

  /* 5. 한 판을 끝까지 진행 */
  let rounds = 0, guard = 0, lastSeq = -1, stuck = 0;
  while (guard++ < 400){
    const snap = await get(ref(me.db, `rooms/${code}`));
    const room = snap.val();
    if (!room) break;
    if (room.phase === "over"){ break; }

    const cap = room.opts.cap;
    const seats = seatArray(room.seats, cap);
    const ord = room.order || seats.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
    const r = room.round;
    if (!r){ await wait(200); continue; }

    if ((r.seq || 0) === lastSeq) stuck++; else { stuck = 0; lastSeq = r.seq || 0; }
    if (stuck > 25){ step("판 진행", false, "같은 자리에서 멈춤 (차례 " + r.turn + ")"); break; }

    const at = ord[r.turn];
    const cur = seats[at];
    if (!cur){ step("차례 판정", false, "차례 " + r.turn + " 에 사람이 없음"); break; }

    if (cur.bot){
      try { await me.call("botMoves")({ code }); }
      catch (e){ step("봇 수", false, String(e.message || e)); break; }
      await wait(60);
      continue;
    }

    /* 내 차례 */
    const myPos = ord.indexOf(seats.findIndex(s => s && s.uid === me.uid));
    const hand = (await get(ref(me.db, `hands/${code}/${me.uid}`))).val() || [];
    if (!hand.length){ await wait(120); continue; }
    const pick = pickMove(hand, r.trick);
    const seq = (r.seq || 0) + 1;
    const mv = pick ? `${myPos},${pick.num},${pick.count}` : `${myPos},p`;

    const res = await runTransaction(ref(me.db, `rooms/${code}/moves/${seq}`),
                                     x => (x ? undefined : mv));
    if (!res.committed){ await wait(120); continue; }

    /* 내 손패를 줄이고 판 상태를 적는다 (앱이 하는 일과 같다) */
    const counts = (r.counts || []).slice();
    const passed = (r.passed || []).slice();
    const finish = (r.finish || []).slice();
    let trick = r.trick, turn = r.turn;
    if (pick){
      const t = takeFrom(hand, pick.num, pick.count);
      if (!t){ step("내 수", false, "뺄 수 없는 카드"); break; }
      await set(ref(me.db, `hands/${code}/${me.uid}`), t.hand);
      counts[myPos] = t.hand.length;
      trick = { by: myPos, num: pick.num, count: pick.count };
      if (t.hand.length === 0 && !finish.includes(myPos)) finish.push(myPos);
      if (pick.num === 1){ trick = null; for (let i = 0; i < passed.length; i++) passed[i] = false; }
    } else passed[myPos] = true;

    const still = counts.filter((c, i) => c > 0 && !passed[i]).length;
    if (still <= 1){
      const last = trick ? trick.by : myPos;
      trick = null;
      for (let i = 0; i < passed.length; i++) passed[i] = false;
      turn = counts[last] > 0 ? last : counts.findIndex(c => c > 0);
      if (turn < 0) turn = 0;
    } else {
      let g = 0; turn = myPos;
      do { turn = (turn + 1) % counts.length; }
      while ((counts[turn] === 0 || passed[turn]) && g++ < counts.length * 2);
    }

    await update(ref(me.db, `rooms/${code}/round`),
      { seq, turn, counts, passed, finish, trick: trick || null, deadline: Date.now() + 15000 });

    /* 판이 끝났으면 정산 */
    const left = counts.filter(c => c > 0).length;
    if (left <= 1){
      rounds++;
      try {
        const out = await me.call("settleRound")({ code, give: null });
        const d = out.data || {};
        step("판 " + rounds + " 정산", true,
             d.over ? "게임 종료" : ("다음 판 " + d.roundNo));
        if (d.over) break;
      } catch (e){ step("판 " + rounds + " 정산", false, String(e.message || e)); break; }
      await wait(100);
    }
  }
  if (guard >= 400) step("판 진행", false, "400수를 넘겨도 안 끝남");

  /* 6. 결과와 점수 */
  try {
    const room = (await get(ref(me.db, `rooms/${code}`))).val();
    step("게임 종료", room.phase === "over", "상태 " + room.phase);
    step("판 수", rounds === 3, rounds + "판 진행");
    const sc = room.score || [];
    step("점수 기록", sc.some(v => v > 0), JSON.stringify(sc));

    const res = await me.call("finishGame")({ code });
    step("점수 반영", res.data && typeof res.data.gained === "number",
         "획득 " + (res.data ? res.data.gained : "?"));
    const again = await me.call("finishGame")({ code });
    step("두 번 받지 않음", again.data && again.data.already === true);
  } catch (e){ step("결과 확인", false, String(e.message || e)); }

  done();
}

function done(){
  console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error("시험 자체가 멈췄습니다:", e); process.exit(1); });
