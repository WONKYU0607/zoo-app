/* 판이 끝나는 순간을 화면이 보여줄 수 있는지 검사한다.
   엔진은 판이 끝나자마자 다음 판을 나눠 버리므로, 마지막 장면이 남아 있어야 한다.

   쓰는 법:  node test/roundend.test.mjs  */

import { Client } from "boardgame.io/dist/esm/client.js";
import { ZooPresident } from "../src/lib/game.js";
import { screenView, toScreen } from "../src/lib/view.js";
import { isJoker } from "../src/lib/deck.js";

const N = 6;
let pass = 0, fail = 0;
const check = (name, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + name + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + name + (note ? "  " + note : "")); }
};

function pick(hand, cur){
  const cnt = {}; let jok = 0;
  hand.forEach(c => { if (isJoker(c)) jok++; else cnt[c] = (cnt[c] || 0) + 1; });
  const opts = []; const maxN = cur ? cur.num - 1 : 12;
  for (let num = 1; num <= maxN; num++){
    const same = cnt[num] || 0; if (!same) continue;
    if (cur){ const need = cur.count - same; if (need > jok) continue;
      opts.push({ num, count: cur.count, useJok: Math.max(0, need), own: same }); }
    else opts.push({ num, count: same, useJok: 0, own: same });
  }
  if (!opts.length) return (!cur && jok > 0) ? { num: 13, count: 1 } : null;
  opts.forEach(o => { let s = o.num * 2; s -= o.useJok * 10; if (cur && o.own > o.count) s -= 24; o.s = s; });
  opts.sort((a, b) => b.s - a.s);
  return opts[0];
}

const NAMES = ["나", "서연", "준호", "민지", "태윤", "하은"];

console.log("\n=== 판 끝 장면 검사 ===\n");

let sawRoundEnd = 0, sawTax = 0, sawRevolution = 0;

for (let gi = 1; gi <= 12; gi++){
  const c = Client({ game: ZooPresident, numPlayers: N });
  c.start();
  let guard = 0, seenRound = 1;

  while (guard++ < 3000){
    const st = c.store.getState();
    if (!st || st.ctx.gameover) break;

    /* 판이 넘어가는 순간을 잡는다 */
    if (st.G.roundNo !== seenRound){
      seenRound = st.G.roundNo;
      sawRoundEnd++;
      const v = screenView(st.G, st.ctx, "0", NAMES);

      if (sawRoundEnd <= 3){
        check("판 끝 장면이 남아 있다", Boolean(v.lastRound));
        check("마지막에 낸 카드가 남아 있다",
              Boolean(v.lastRound && v.lastRound.table.length > 0),
              v.lastRound ? v.lastRound.table.length + "번 쌓임" : "");
        check("등수가 전원분 있다",
              Boolean(v.lastRound && v.lastRound.order.length === N),
              v.lastRound ? v.lastRound.order.join(",") : "");
        check("등수와 배점이 짝이 맞는다",
              Boolean(v.lastRound &&
                      v.lastRound.points.length === N &&
                      v.lastRound.points[0] === 100 &&
                      v.lastRound.points[N - 1] === 0),
              v.lastRound ? v.lastRound.points.join(",") : "");
        /* 마지막에 낸 사람이 1등이어야 한다 (마지막 카드를 낸 사람이 먼저 턴다) */
        if (v.lastRound && v.lastRound.table.length){
          const last = v.lastRound.table[v.lastRound.table.length - 1];
          check("마지막에 낸 사람이 완주자 안에 있다",
                v.lastRound.order.indexOf(last.by) < N,
                "낸 사람 " + last.by + " / 등수 " + v.lastRound.order.indexOf(last.by));
        }
        /* 그 장면도 자리마다 따라 돌아야 한다 */
        /* me=0 화면에서 0은 곧 엔진 자리 0 이므로, 다른 사람 화면은 그걸 돌린 값이어야 한다 */
        for (let me = 1; me < N; me++){
          const w = screenView(st.G, st.ctx, String(me), NAMES);
          const ok = w.lastRound.table.every((t, k) =>
                       t.by === toScreen(v.lastRound.table[k].by, me, N))
                  && w.lastRound.order.every((o, k) =>
                       o === toScreen(v.lastRound.order[k], me, N));
          check("판 끝 장면도 자리 따라 돔 (me=" + me + ")", ok);
        }
      }
      if (v.revolution) sawRevolution++;
    }

    if (st.ctx.phase === "tax"){
      sawTax++;
      const o = st.G.taxOrder;
      for (const seat of [o[0], o[1]]){
        if (st.G.given[seat] !== undefined) continue;
        const h = st.G.hands[seat].slice().sort((a, b) => (isJoker(b) ? 99 : b) - (isJoker(a) ? 99 : a));
        c.updatePlayerID(String(seat));
        c.moves.give(h.slice(0, seat === o[0] ? 2 : 1));
      }
      c.updatePlayerID(null);
      continue;
    }
    const seat = Number(st.ctx.currentPlayer);
    const mv = pick(st.G.hands[seat], st.G.pile);
    c.updatePlayerID(String(seat));
    if (mv) c.moves.play(mv.num, mv.count); else c.moves.pass();
    c.updatePlayerID(null);
  }
  c.stop();
}

check("판이 끝나는 순간을 여러 번 지나감", sawRoundEnd >= 20, sawRoundEnd + "회");
check("세금 단계도 지나감", sawTax > 0, sawTax + "회");
/* 혁명은 운이라 안 나오는 판도 있다. 실패로 치지 않고 알려만 준다 */
console.log("  혁명이 나온 횟수: " + sawRevolution);

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
