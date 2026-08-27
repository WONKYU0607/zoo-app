/* 화면 변환이 자리마다 정확한지 검사한다.
   지난 구조가 깨진 원인이 바로 이 변환이었으므로, 여기를 제일 촘촘히 본다.

   쓰는 법:  node viewtest.js [게임수] [인원]  */

import { Client } from "boardgame.io/dist/esm/client.js";
import { ZooPresident } from "./game.js";
import { screenView, toScreenIn, toSeatIn } from "./view.js";
import { isJoker } from "./deck.js";

const GAMES = Number(process.argv[2] || 20);
const N     = Number(process.argv[3] || 6);

let pass = 0, fail = 0;
const bad = [];
const check = (name, ok, note) => {
  if (ok) pass++;
  else { fail++; if (bad.length < 8) bad.push("  [실패] " + name + (note ? "  " + note : "")); }
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

/* 자리 이름표는 엔진 자리 순서로 준다 */
const NAMES = ["가", "나", "다", "라", "마", "바", "사", "아"].slice(0, N);

function inspect(G, ctx, gi){
  /* 이 판의 자리 줄. 등수대로 다시 앉으므로 판마다 바뀐다 */
  const ord = G.seatOrder && G.seatOrder.length === N
    ? G.seatOrder : Array.from({ length: N }, (_, i) => i);
  const toScreen = (seat, me) => toScreenIn(ord, seat, me);
  const toSeat   = (pos,  me) => toSeatIn(ord, pos, me);

  /* 1. 돌렸다 되돌리면 제자리 */
  for (let me = 0; me < N; me++)
    for (let seat = 0; seat < N; seat++)
      check("돌리기 왕복", toSeat(toScreen(seat, me), me) === seat,
            "게임 " + gi + " me=" + me + " seat=" + seat);

  const views = [];
  for (let me = 0; me < N; me++) views.push(screenView(G, ctx, String(me), NAMES));

  views.forEach((v, me) => {
    /* 2. 화면 0번은 언제나 나 */
    check("0번은 나", v.seats[0].name === NAMES[me], "게임 " + gi + " me=" + me + " 이름 " + v.seats[0].name);
    check("내 손패만 보임", v.seats[0].hold !== null && v.seats.slice(1).every(s => s.hold === null),
          "게임 " + gi + " me=" + me);
    check("손패와 장수 일치", v.seats[0].hold.length === v.seats[0].c, "게임 " + gi + " me=" + me);

    /* 3. 장수·패스·점수가 사람별로 따라 돌았는가 */
    for (let seat = 0; seat < N; seat++){
      const pos = toScreen(seat, me);
      check("장수 따라감", v.seats[pos].c === G.counts[seat], "게임 " + gi + " me=" + me + " seat=" + seat);
      check("이름 따라감", v.seats[pos].name === NAMES[seat], "게임 " + gi + " me=" + me + " seat=" + seat);
      check("패스 따라감", v.seats[pos].s === (G.passed[seat] ? "pass" : ""), "게임 " + gi);
      check("점수 따라감", v.score[pos] === G.score[seat], "게임 " + gi + " me=" + me + " seat=" + seat);
    }

    /* 4. 차례: 내 차례라고 나오는 사람은 오직 한 명, 그리고 그게 엔진의 차례와 같다 */
    if (ctx.phase === "play"){
      const want = toScreen(Number(ctx.currentPlayer), me);
      check("차례 따라감", v.turn === want, "게임 " + gi + " me=" + me + " " + v.turn + " ≠ " + want);
      check("내 차례 판정", v.myTurn === (Number(ctx.currentPlayer) === me), "게임 " + gi + " me=" + me);
    }

    /* 5. 바닥에 쌓인 것도 사람이 따라 돌았는가 */
    (G.table || []).forEach((t, k) => {
      check("바닥 낸 사람 따라감", v.table[k].by === toScreen(t.by, me), "게임 " + gi + " me=" + me);
      check("바닥 카드 그대로", v.table[k].num === t.num && v.table[k].count === t.count, "게임 " + gi);
    });
    if (G.pile) check("맨 위 낸 사람 따라감", v.pile.by === toScreen(G.pile.by, me), "게임 " + gi + " me=" + me);
  });

  /* 6. 모든 사람의 화면을 합치면 정확히 한 명만 자기 차례다 */
  if (ctx.phase === "play"){
    const mine = views.filter(v => v.myTurn).length;
    check("자기 차례는 딱 한 명", mine === 1, "게임 " + gi + " " + mine + "명");
  }

  /* 7. 세금 단계: 내야 하는 사람은 최대 두 명 */
  if (ctx.phase === "tax"){
    const givers = views.filter(v => v.taxGive > 0).length;
    check("세금 낼 사람 2명 이하", givers <= 2, "게임 " + gi + " " + givers + "명");
    views.forEach((v, me) => {
      if (v.taxGive > 0) check("세금 상대 있음", v.taxWith >= 0, "게임 " + gi + " me=" + me);
    });
  }
}

console.log("\n=== 화면 변환 검사 ===  " + GAMES + "게임 / " + N + "명\n");

for (let gi = 1; gi <= GAMES; gi++){
  const client = Client({ game: ZooPresident, numPlayers: N });
  client.start();
  let guard = 0;
  while (guard++ < 3000){
    const st = client.store.getState();
    if (!st || st.ctx.gameover) break;
    inspect(st.G, st.ctx, gi);

    /* 뽑기 단계 — 자리 순서를 여기서 정한다.
       **이걸 빠뜨리면 게임이 시작조차 못 하고, 검사는 같은 첫 상태만
       3000번 들여다보며 통과했다고 말한다.** 실제로 그런 적이 있다 */
    if (st.ctx.phase === "draw"){
      const free = st.G.draw.by.map((v, i) => (v == null ? i : -1)).filter(i => i >= 0);
      const who = st.G.draw.took.findIndex((v, i) => v == null && i < N);
      if (!free.length || who < 0) break;
      client.updatePlayerID(String(who));
      client.moves.takeCard(free[Math.floor(Math.random() * free.length)]);
      client.updatePlayerID(null);
      continue;
    }

    if (st.ctx.phase === "tax"){
      if (st.G.revolution && !st.G.revDecided){
        client.updatePlayerID(String(st.G.revolution.seat));
        client.moves.declare();
        client.updatePlayerID(null);
        continue;
      }
      if (st.G.taxCancelled || !st.G.taxOn){ client.updatePlayerID(null); continue; }
      const o = st.G.taxOrder;
      for (const seat of [o[0], o[1]]){
        if (st.G.given[seat] !== undefined) continue;
        const hand = st.G.hands[seat].slice().sort((a, b) => (isJoker(b) ? 99 : b) - (isJoker(a) ? 99 : a));
        client.updatePlayerID(String(seat));
        client.moves.give(hand.slice(0, seat === o[0] ? 2 : 1));
      }
      client.updatePlayerID(null);
      continue;
    }
    const seat = Number(st.ctx.currentPlayer);
    const mv = pick(st.G.hands[seat], st.G.pile);
    client.updatePlayerID(String(seat));
    if (mv) client.moves.play(mv.num, mv.count); else client.moves.pass();
    client.updatePlayerID(null);
  }
  /* 끝난 상태도 본다 */
  const fin = client.store.getState();
  if (fin && fin.ctx.gameover){
    const ordF = fin.G.seatOrder && fin.G.seatOrder.length === N
      ? fin.G.seatOrder : Array.from({ length: N }, (_, i) => i);
    for (let me = 0; me < N; me++){
      const v = screenView(fin.G, fin.ctx, String(me), NAMES);
      check("끝난 뒤 점수 따라감",
            v.over.score.every((s, pos) => s === fin.ctx.gameover.score[toSeatIn(ordF, pos, me)]),
            "게임 " + gi + " me=" + me);
    }
  }
  client.stop();
}

bad.forEach(b => console.log(b));
console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
