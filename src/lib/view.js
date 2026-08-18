/* 엔진 상태 → 화면이 쓰는 모양.

   화면은 "내가 항상 아래 0번"으로 그린다. 엔진은 자리 번호가 고정이다.
   그 둘 사이를 돌리는 일은 **오직 이 파일에서만** 한다.
   여기 말고 어디에서도 자리 번호를 돌리지 말 것. 지난 구조가 그것 때문에 깨졌다. */

/* 자리 줄(등수 순서)이 없으면 자리 번호 순서로 앉은 것으로 본다 */
const orderOf = (G, n) => (G && G.seatOrder && G.seatOrder.length === n
  ? G.seatOrder
  : Array.from({ length: n }, (_, i) => i));

/* 엔진 자리 → 화면 자리.
   화면은 나를 아래(0번)에 두고 자리 줄을 따라 시계 방향으로 앉힌다.
   자리 줄이 매 판 바뀌므로 같은 사람이 판마다 다른 위치에 앉는다 — 원작 그대로다 */
export const toScreenIn = (order, seat, me) => {
  const n = order.length;
  return ((order.indexOf(seat) - order.indexOf(me)) % n + n) % n;
};
export const toSeatIn = (order, pos, me) => {
  const n = order.length;
  return order[((order.indexOf(me) + pos) % n + n) % n];
};
/* 자리 줄이 없던 시절의 모양 — 검사와 옛 코드가 쓴다 */
export const toScreen = (seat, me, n) => ((seat - me) % n + n) % n;
export const toSeat   = (pos,  me, n) => ((pos + me) % n + n) % n;

/* 화면이 한 번에 받아 쓰는 덩어리.
   names 는 방에서 받은 이름표(엔진 자리 순서)를 넣어 준다. 없으면 빈 이름. */
export function screenView(G, ctx, myID, names){
  const n = G.counts.length;
  const me = Number(myID);
  const nm = names || new Array(n).fill("");
  /* 이 판의 자리 줄. 여기서만 자리를 돌린다 */
  const ord = orderOf(G, n);
  const toScreen = (seat, _me, _n) => toScreenIn(ord, seat, me);
  const toSeat   = (pos,  _me, _n) => toSeatIn(ord, pos, me);

  const seats = new Array(n);
  for (let seat = 0; seat < n; seat++){
    const pos = toScreen(seat, me, n);
    seats[pos] = {
      name: nm[seat] || "",
      c: G.counts[seat],
      s: G.passed[seat] ? "pass" : "",
      out: G.counts[seat] === 0,
      hold: seat === me ? (G.hands[seat] || []).slice() : null,
    };
  }

  const table = (G.table || []).map(t => ({
    by: toScreen(t.by, me, n),
    num: t.num,
    count: t.count,
    cards: new Array(t.count).fill(t.num),      /* 남의 카드는 숫자만 안다 */
  }));

  return {
    N: n,
    me: 0,                                      /* 화면에서 나는 언제나 0 */
    names: seats.map(s => s.name),
    seats,
    hand: (G.hands[me] || []).slice(),
    turn: ctx.phase === "play" ? toScreen(Number(ctx.currentPlayer), me, n) : -1,
    myTurn: ctx.phase === "play" && Number(ctx.currentPlayer) === me,
    table,
    pile: G.pile ? { by: toScreen(G.pile.by, me, n), num: G.pile.num, count: G.pile.count } : null,
    /* 바닥을 치우기 직전 모습. 1번으로 엎거나 마지막 카드로 완주하면
       올리기와 치우기가 한 수 안에서 끝나므로, 이걸 넘겨야 화면이 보여줄 수 있다 */
    lastTable: (G.shown || []).map(t => ({
      by: toScreen(t.by, me, n), num: t.num, count: t.count,
      cards: new Array(t.count).fill(t.num),
    })),
    finish: (G.finished || []).map(s => toScreen(s, me, n)),
    score: G.counts.map((_, seat) => G.score[toSeat(seat, me, n)]),
    roundNo: G.roundNo,
    totalRounds: G.totalRounds,
    phase: ctx.phase,
    revolution: G.revolution
      ? {
          seat: toScreen(G.revolution.seat, me, n),
          great: G.revolution.great,
          mine: G.revolution.seat === me,
          decided: Boolean(G.revDecided),
          declared: Boolean(G.revDeclared),
        }
      : null,
    /* 내가 지금 선언할 수 있는가 */
    canDeclare: Boolean(G.revolution && !G.revDecided && G.revolution.seat === me),
    taxCancelled: Boolean(G.taxCancelled),
    /* 세금 단계에서 내가 내야 할 장수 (0이면 낼 것 없음) */
    taxGive: (() => {
      if (ctx.phase !== "tax" || !G.taxOrder) return 0;
      if (G.given && G.given[me] !== undefined) return 0;
      if (G.taxOrder[0] === me) return 2;
      if (G.taxOrder[1] === me) return 1;
      return 0;
    })(),
    /* 세금 상대 (화면 자리) */
    taxWith: (() => {
      if (ctx.phase !== "tax" || !G.taxOrder) return -1;
      const o = G.taxOrder, last = o.length - 1;
      if (o[0] === me) return toScreen(o[last], me, n);
      if (o[1] === me) return toScreen(o[last - 1], me, n);
      if (o[last] === me) return toScreen(o[0], me, n);
      if (o[last - 1] === me) return toScreen(o[1], me, n);
      return -1;
    })(),
    /* 방금 끝난 판의 마지막 장면과 등수 */
    lastRound: G.lastRound ? {
      roundNo: G.lastRound.roundNo,
      order: G.lastRound.order.map(s => toScreen(s, me, n)),
      points: G.lastRound.points.slice(),
      table: G.lastRound.table.map(t => ({
        by: toScreen(t.by, me, n), num: t.num, count: t.count,
        cards: new Array(t.count).fill(t.num),
      })),
    } : null,
    over: ctx.gameover
      ? {
          score: G.counts.map((_, seat) => ctx.gameover.score[toSeat(seat, me, n)]),
          order: (ctx.gameover.order || []).map(s => toScreen(s, me, n)),
        }
      : null,
  };
}
