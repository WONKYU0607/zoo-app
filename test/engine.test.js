/* 앱이 쓰는 engine.js 를 그대로 불러 한 게임을 끝까지 돌린다.
   봇이 실제로 두는지, 화면에 내려가는 view 가 맞는지 본다.

   쓰는 법:  node test/engine.test.js [인원] [게임수]  */

import { engine, onView, startLocal, stop, play, passTurn, give, declareRev, passRev } from "../src/lib/engine.js";

const N     = Number(process.argv[2] || 6);
const GAMES = Number(process.argv[3] || 5);

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const NAMES = ["나", "서연", "준호", "민지", "태윤", "하은", "지훈", "예린"].slice(0, N);

/* 화면이 하는 것과 같은 판단 — 고른 카드가 규칙에 맞는지 */
const isJ = c => c >= 13;
function myPick(v){
  const hand = v.hand;
  const cnt = {}; let jok = 0;
  hand.forEach(c => { if (isJ(c)) jok++; else cnt[c] = (cnt[c] || 0) + 1; });
  const pile = v.pile;
  const opts = [];
  const maxN = pile ? pile.num - 1 : 12;
  for (let num = 1; num <= maxN; num++){
    const same = cnt[num] || 0; if (!same) continue;
    if (pile){ const need = pile.count - same; if (need > jok) continue;
      opts.push({ num, count: pile.count, useJok: Math.max(0, need), own: same }); }
    else opts.push({ num, count: same, useJok: 0, own: same });
  }
  if (!opts.length) return (!pile && jok > 0) ? { num: 13, count: 1 } : null;
  opts.forEach(o => { let s = o.num * 2; s -= o.useJok * 10; if (pile && o.own > o.count) s -= 24; o.s = s; });
  opts.sort((a, b) => b.s - a.s);
  return opts[0];
}

async function one(gi){
  let views = 0, sawBotMove = false, lastCounts = null, over = null;
  const off = onView(v => {
    views++;
    if (lastCounts && v.turn !== 0){
      /* 내가 안 뒀는데 장수가 줄었으면 봇이 둔 것 */
      if (v.seats.some((s, i) => i !== 0 && s.c < lastCounts[i])) sawBotMove = true;
    }
    lastCounts = v.seats.map(s => s.c);
    if (v.over) over = v.over;
  });

  engine.botMs = 8;                                   /* 시험에서는 빨리 */
  startLocal({ numPlayers: N, names: NAMES, myID: "0", opts: { rounds: 3, tax: true } });

  const v0 = engine.view;
  if (gi === 1){
    check("첫 화면이 옴", Boolean(v0), v0 ? "" : "view 없음");
    check("내 손패가 있음", v0.hand.length > 0, v0.hand.length + "장");
    check("내가 0번", v0.seats[0].name === "나");
    check("남의 손패는 없음", v0.seats.slice(1).every(s => s.hold === null));
    check("장수는 다 보임", v0.seats.every(s => s.c > 0));
  }

  let guard = 0;
  while (guard++ < 4000 && !over){
    const v = engine.view;
    if (!v){ await wait(5); continue; }

    /* 혁명을 쥐었으면 정해야 한다. 안 정하면 엔진이 계속 기다린다
       (쥐고도 안 부르는 것이 전략이라 엔진이 대신 정해 주지 않는다) */
    if (v.canDeclare){
      if (Math.random() < 0.5) declareRev(); else passRev();
      await wait(5); continue;
    }
    if (v.phase === "tax" && v.taxGive > 0){
      const hand = v.hand.slice().sort((a, b) => (isJ(b) ? 99 : b) - (isJ(a) ? 99 : a));
      give(hand.slice(0, v.taxGive));
      await wait(5); continue;
    }
    if (v.myTurn){
      const mv = myPick(v);
      if (mv) play(mv.num, mv.count); else passTurn();
      await wait(5); continue;
    }
    await wait(12);                                   /* 봇 차례를 기다린다 */
  }

  off();
  stop();
  return { views, sawBotMove, over, guard };
}

console.log("\n=== 앱 엔진 시험 ===  " + N + "명 " + GAMES + "게임\n");

for (let gi = 1; gi <= GAMES; gi++){
  const r = await one(gi);
  check("게임 " + gi + " 끝남", Boolean(r.over), r.over ? "" : (r.guard + "수에서 멈춤"));
  check("게임 " + gi + " 봇이 실제로 둠", r.sawBotMove);
  if (r.over){
    const sum = r.over.score.reduce((a, b) => a + b, 0);
    const want = [100, 90, 80, 70, 60, 50, 40, 30].slice(0, Math.floor(N / 2))
                   .reduce((a, b) => a + b, 0) * 3;
    check("게임 " + gi + " 점수 합계", sum === want, sum + " (기대 " + want + ")  " + JSON.stringify(r.over.score));
  }
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
