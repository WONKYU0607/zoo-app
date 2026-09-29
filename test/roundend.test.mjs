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
  /* 뽑기 단계를 먼저 끝낸다. 자리 순서는 여기서 정해진다 */
  for (let seat = 0; seat < N; seat++){
    const s0 = c.store.getState();
    if (s0.ctx.phase !== "draw") break;
    const free = s0.G.draw.by.map((v, i) => (v == null ? i : -1)).filter(i => i >= 0);
    c.updatePlayerID(String(seat));
    c.moves.takeCard(free[0]);
  }
  c.updatePlayerID("0");
  let guard = 0, seenRound = 1;
  /* 판이 끝나기 **직전**의 자리 배치를 들고 있는다 (자리 이름을 순서대로) */
  let beforeSeats = null;

  while (guard++ < 3000){
    const st = c.store.getState();
    if (!st || st.ctx.gameover) break;

    /* 판이 넘어가는 순간을 잡는다 */
    if (st.G.roundNo !== seenRound){
      seenRound = st.G.roundNo;
      sawRoundEnd++;
      const v = screenView(st.G, st.ctx, "0", NAMES);

      /* ---------- 마지막 장면의 자리가 그대로인가 ----------
         판이 끝나면 엔진이 곧바로 자리를 등수대로 다시 앉힌다(`G.seatOrder`).
         화면은 마지막 장면을 2초 보여 주는데, 그것을 **새 자리**로 그리면
         자리가 통째로 튄다 — 2026-09-28 신고("꼴찌가 갑자기 내 오른쪽으로 이동").
         `lastRound.seats` 는 **그 판을 돌 때의 자리**여야 한다 */
      if (sawRoundEnd <= 6 && beforeSeats){
        const nowSeats = (v.lastRound && v.lastRound.seats)
          ? v.lastRound.seats.map(x => x.name) : null;
        check("**판이 끝나도 마지막 장면의 자리가 안 바뀐다**",
              Boolean(nowSeats) && nowSeats.join("|") === beforeSeats.join("|"),
              (beforeSeats.join("|")) + "  →  " + (nowSeats ? nowSeats.join("|") : "없음"));
        /* 새 판 자리는 바뀌는 것이 맞다 — 그건 결과 화면을 보는 동안 일어난다 */
      }

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
        /* 자리 줄이 판마다 바뀌므로 번호로 비교하면 안 된다.
           "그 자리에 앉은 사람이 같은 사람인가"로 본다.
           **`seats`(지금 자리)가 아니라 `lastRound.seats`(그때 자리)로 봐야 한다** —
           판 끝 장면은 그때 자리 줄로 그리기 때문이다 (자리 튐을 고치면서 바뀌었다) */
        for (let me = 1; me < N; me++){
          const w = screenView(st.G, st.ctx, String(me), NAMES);
          const who = (view, pos) => (view.lastRound && view.lastRound.seats
                                       ? view.lastRound.seats : view.seats)[pos].name;
          const ok = w.lastRound.table.every((t, k) =>
                       who(w, t.by) === who(v, v.lastRound.table[k].by))
                  && w.lastRound.order.every((o, k) =>
                       who(w, o) === who(v, v.lastRound.order[k]));
          check("판 끝 장면도 자리 따라 돔 (me=" + me + ")", ok);
        }
      }
      if (v.revolution) sawRevolution++;
    }

    if (st.ctx.phase === "tax"){
      sawTax++;
      /* 혁명은 선언해야 발동한다. 쥔 사람이 있으면 선언시켜 본다 */
      if (st.G.revolution && !st.G.revDecided){
        c.updatePlayerID(String(st.G.revolution.seat));
        c.moves.declare();
        c.updatePlayerID(null);
        continue;
      }
      if (st.G.taxCancelled || !st.G.taxOn) { c.updatePlayerID(null); continue; }
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
    /* 매 수마다 지금 자리 배치를 적어 둔다 — 판이 끝나면 이것과 비교한다 */
    beforeSeats = screenView(st.G, st.ctx, "0", NAMES).seats.map(x => x.name);
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
