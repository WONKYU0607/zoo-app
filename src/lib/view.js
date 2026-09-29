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

/* ---------- 지금 둘 차례인 사람 ----------

   **서버 대전에서 `ctx.currentPlayer` 는 한 박자 늦다.**
   boardgame.io 는 내가 둔 수를 내 화면에 먼저 반영하지만, 차례를 넘기는 일은
   **서버만** 한다. 그래서 내가 두고 나서 서버가 답할 때까지(느린 연결이면 몇백 ms)
   `currentPlayer` 는 아직 **나**로 남아 있다. 라이브러리 소스에도 그렇게 적혀 있다:
     "If we're on the client, just process the move and no triggers in multiplayer
      mode. These will be processed on the server, which will send back a state update."

   그 사이를 "아직 내 차례" 로 읽으면 **한 차례에 두 번 낼 수 있다.**
   2026-09-28 신고가 이것이다 — 77 을 내고 바로 66 도 내졌고, 서버가 두 번째를
   거부해서 다음 턴에 66 이 손으로 되돌아왔다.

   판 규칙이 정한 "다음에 둘 사람" 은 `G.next` 에 들어 있다. 이것은 수를 처리할 때
   같이 계산되므로 **내 화면에서도 곧바로 맞는 값이 된다.** 그래서 둘이 어긋나면
   아직 안 넘어간 것이고, 내 차례가 아니다.
   1번으로 바닥을 엎어 내가 다시 선이 되는 경우는 `G.next` 도 나를 가리키므로
   그대로 바로 낼 수 있다 — 괜히 기다리게 만들지 않는다.
   이 기기 방(local)은 수를 처리할 때 차례까지 다 넘기므로 둘이 늘 같다 */
export function dueSeat(G, ctx){
  const n = G && G.counts ? G.counts.length : 0;
  const cur = Number(ctx.currentPlayer);
  return Number.isInteger(G && G.next) && G.next >= 0 && G.next < n ? G.next : cur;
}

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

  /* 지금 둘 차례인 사람 (위 dueSeat 설명 참고) */
  const due = dueSeat(G, ctx);

  const seats = new Array(n);
  for (let seat = 0; seat < n; seat++){
    const pos = toScreen(seat, me, n);
    seats[pos] = {
      /* 엔진 자리 번호. 얼굴 그림은 이 번호로 골라야 사람을 따라간다 —
         화면 위치로 고르면 판이 바뀔 때 얼굴만 그 자리에 남는다 */
      seat,
      name: nm[seat] || "",
      c: G.counts[seat],
      s: G.passed[seat] ? "pass" : "",
      out: G.counts[seat] === 0,
      /* 몇 번째로 끝냈는가. 0부터, 아직이면 -1 */
      rank: (G.finished || []).indexOf(seat),
      hold: seat === me ? (G.hands[seat] || []).slice() : null,
    };
  }

  /* 실제로 낸 카드. 엔진이 남겨 주면 그대로 쓴다 —
     카멜레온으로 채운 자리를 숫자 카드로 바꿔치기하면 화면이 거짓말을 한다.
     옛 판(서버가 아직 안 실어 주는 경우)은 숫자로 채워 예전처럼 그린다 */
  const realCards = t => (t.cards && t.cards.length === t.count)
    ? t.cards.slice()
    : new Array(t.count).fill(t.num);

  const table = (G.table || []).map(t => ({
    by: toScreen(t.by, me, n),
    num: t.num,
    count: t.count,
    cards: realCards(t),
  }));

  /* 뽑기 화면 몫. 자리 번호는 화면 자리로 바꿔서 넘긴다 */
  const draw = G.draw ? {
    /* 아직 아무도 안 집은 카드의 숫자는 화면에 주지 않는다.
       이 기기 방은 판 상태를 그대로 읽으므로 여기서 가려야 한다 —
       안 가리면 낮은 카드가 어디 있는지 다 보인다 */
    pool: G.draw.pool.map((v, i) => (G.draw.by[i] == null ? null : v)),
    /* 뽑기 화면 자리는 **방에 앉은 순서** 그대로다(나를 아래로 돌려놓기만 한다).
       등수 자리로 바꾸는 것은 뽑기가 끝난 뒤 판에서 한다 —
       여기서 ord 를 쓰면 마지막 사람이 고르는 순간 자리가 통째로 흔들린다 */
    by: G.draw.by.map(s => (s == null ? null : ((s - me + n) % n))),
    mine: G.draw.took[Number(myID)],                 /* 내가 가져간 카드 자리 */
    left: G.draw.took.filter(x => x == null).length,
  } : null;

  return {
    N: n,
    me: 0,                                      /* 화면에서 나는 언제나 0 */
    names: seats.map(s => s.name),
    seats,
    hand: (G.hands[me] || []).slice(),
    turn: ctx.phase === "play" ? toScreen(due, me, n) : -1,
    myTurn: ctx.phase === "play" && Number(ctx.currentPlayer) === me && due === me,
    table,
    pile: G.pile ? { by: toScreen(G.pile.by, me, n), num: G.pile.num, count: G.pile.count } : null,
    /* 바닥을 치우기 직전 모습. 1번으로 엎거나 마지막 카드로 완주하면
       올리기와 치우기가 한 수 안에서 끝나므로, 이걸 넘겨야 화면이 보여줄 수 있다 */
    lastTable: (G.shown || []).map(t => ({
      by: toScreen(t.by, me, n), num: t.num, count: t.count,
      cards: realCards(t),
    })),
    finish: (G.finished || []).map(s => toScreen(s, me, n)),
    score: G.counts.map((_, seat) => G.score[toSeat(seat, me, n)]),
    roundNo: G.roundNo,
    trickNo: G.trickNo || 0,          /* 몇 번째 바퀴인가 */
    /* 몇 번째 수인가 + 그 수가 무엇이었나 — 소리 겹침·빠짐을 가리는 데 쓴다 */
    moveNo: G.moveNo || 0,
    lastMove: G.lastMove ? { k: G.lastMove.k, by: toScreen(G.lastMove.by, me, n) } : null,
    /* 최근 몇 수. 신호가 뭉쳐 와도 화면이 빠짐없이 집어 갈 수 있게 한다 */
    recent: (G.recent || []).map(m => ({ no: m.no, k: m.k, by: toScreen(m.by, me, n) })),
    totalRounds: G.totalRounds,
    phase: ctx.phase,
    draw,
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
      /* 혁명을 정하기 전이거나 세금이 사라졌으면 아직(또는 영영) 낼 것이 없다.
         이걸 안 걸면 화면·검사가 계속 세금을 내려다 거부당한다 */
      if (!G.revDecided || G.taxCancelled || !G.taxOn) return 0;
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
    /* ---------- 방금 끝난 판 ----------

       **그 판을 돌 때의 자리 줄로 옮긴다.** 판이 끝나면 엔진이 곧바로 자리를
       등수대로 다시 앉히는데(`G.seatOrder`), 마지막 장면을 지금 자리 줄로 그리면
       **자리가 통째로 튄다** — 화면은 그 장면을 2초 보여 주므로 그게 눈에 보인다.
       2026-09-28 신고: "꼴찌가 갑자기 내 오른쪽으로 이동하고 결과 화면으로 넘어감".
       `seats` 도 같이 실어 준다. 판 화면이 마지막 장면을 그릴 때 지금 자리(`seats`)를
       쓰면 이름·얼굴이 새 자리에 붙어 버리기 때문이다 */
    lastRound: G.lastRound ? (() => {
      const pOrd = (G.lastRound.seatOrder && G.lastRound.seatOrder.length === n)
        ? G.lastRound.seatOrder : ord;
      const toPrev = seat => toScreenIn(pOrd, seat, me);
      const counts = new Array(n).fill(0);
      (G.lastRound.counts || []).forEach((v, seat) => { counts[toPrev(seat)] = v; });
      const seatsPrev = new Array(n);
      for (let seat = 0; seat < n; seat++){
        seatsPrev[toPrev(seat)] = {
          seat, name: nm[seat] || "",
          c: (G.lastRound.counts || [])[seat] || 0,
          rank: G.lastRound.order.indexOf(seat),
        };
      }
      return {
        roundNo: G.lastRound.roundNo,
        order: G.lastRound.order.map(s => toPrev(s)),
        /* 그때의 자리 줄로 옮긴 '그때의 장수' */
        counts,
        /* 그때의 자리 줄로 앉힌 사람들 (이름·얼굴 번호·등수) */
        seats: seatsPrev,
        points: G.lastRound.points.slice(),
        table: G.lastRound.table.map(t => ({
          by: toPrev(t.by), num: t.num, count: t.count,
          cards: realCards(t),
        })),
      };
    })() : null,
    over: ctx.gameover
      ? {
          score: G.counts.map((_, seat) => ctx.gameover.score[toSeat(seat, me, n)]),
          order: (ctx.gameover.order || []).map(s => toScreen(s, me, n)),
        }
      : null,
  };
}
