/* 동물의 왕국 — 규칙 한 벌.
   여기가 유일한 규칙이다. 서버도 화면도 이 파일만 본다.

   중요한 약속 하나:
   자리 번호는 오직 하나뿐이다. boardgame.io 의 playerID("0","1",...) 를 그대로 쓴다.
   화면에서 내 자리를 아래로 돌리는 것은 그릴 때만 하고, 여기에는 절대 들이지 않는다.
   지난 구조에서 번호 체계가 셋이라 생긴 사고를 되풀이하지 않기 위함이다. */

import { INVALID_MOVE } from "boardgame.io/dist/esm/core.js";
import { makeDeck, isJoker, takeFrom, legalMove } from "./deck.js";

const JOKER_ALONE = 13;                       /* 카멜레온 단독은 13번 취급 */

/* ---------- 작은 도우미 ---------- */

const alive = G => G.counts.map((c, i) => (c > 0 ? i : -1)).filter(i => i >= 0);
const active = G => G.counts.map((c, i) => (c > 0 && !G.passed[i] ? i : -1)).filter(i => i >= 0);

/* 자리 순서(= 등수 순서). 1등이 맨 앞이고 거기서 시계 방향으로 앉는다.
   원작 달무티가 매 판 등수대로 자리를 다시 앉는 것을 그대로 옮긴 것이다.
   차례도 자리 번호가 아니라 이 줄을 따라 돈다 — 대혁명으로 줄이 뒤집히면
   누구 다음에 누가 두는지가 통째로 바뀐다. */
const seatOrder = G => (G.seatOrder && G.seatOrder.length
  ? G.seatOrder
  : G.counts.map((_, i) => i));
const seatPos = (G, seat) => seatOrder(G).indexOf(seat);

/* 자리 줄에서 from 다음으로 조건을 만족하는 사람 */
function nextBy(G, from, ok){
  const o = seatOrder(G), n = o.length;
  const at = o.indexOf(from);
  for (let k = 1; k <= n; k++){
    const i = o[(at + k + n) % n];
    if (ok(i)) return i;
  }
  return -1;
}
/* 다음 순번 중 아직 낼 수 있는 사람 */
const nextActive = (G, from) => nextBy(G, from, i => G.counts[i] > 0 && !G.passed[i]);
/* 다음 순번 중 카드가 남은 사람 (선을 넘길 때) */
const nextAlive  = (G, from) => nextBy(G, from, i => G.counts[i] > 0);

function clearPile(G, leader){
  G.pile = null;
  /* 치우기 직전 모습을 남긴다. 화면이 "무슨 카드로 끝냈는지"를 보여줄 때 쓴다 */
  if ((G.table || []).length) G.shown = G.table.map(t => ({
    by: t.by, num: t.num, count: t.count, cards: (t.cards || []).slice() }));
  G.table = [];
  G.passed = G.passed.map(() => false);
  G.next = leader;
  /* 몇 번째 바퀴인지. 화면이 "이미 울린 수"를 가릴 때 쓴다.
     판이 바뀌어도 되돌리지 않는다 — 한 게임 안에서 겹치지 않아야 한다 */
  G.trickNo = (G.trickNo || 0) + 1;
}

/* 몇 번째 수인가.

   화면이 "이 수는 이미 울렸다"를 가리는 데 쓴다.
   바닥에 쌓인 것으로만 알아내면 **바닥을 치우는 수**(마지막 패스,
   판 엎기, 마지막 카드)는 흔적이 안 남아 소리가 통째로 빠진다.
   되돌림이 와도 같은 수는 같은 번호라 두 번 울리지 않는다 */
function noteMove(G, kind, seat){
  G.moveNo = (G.moveNo || 0) + 1;
  G.lastMove = { k: kind, by: seat };
}

/* 카드를 다 턴 사람을 완주 목록에 올린다 */
function noteFinish(G, seat){
  if (G.counts[seat] === 0 && !G.finished.includes(seat)) G.finished.push(seat);
}

/* 한 판이 끝났는지 — 카드가 남은 사람이 한 명 이하 */
const roundDone = G => alive(G).length <= 1;

/* 점수 — 상위 절반만 100, 90, 80 … */
export const winnersCount = n => Math.floor(n / 2);
export const roundPoints = (rank, n) => (rank < winnersCount(n) ? 100 - rank * 10 : 0);

/* 세금 계산에서 카멜레온은 가장 나쁜 카드로 친다 */
const worst = c => (isJoker(c) ? 99 : c);

/* 이번 판 등수: 완주 순서 + 아직 남은 사람 */
function finalOrder(G){
  const order = G.finished.slice();
  for (let i = 0; i < G.counts.length; i++) if (!order.includes(i)) order.push(i);
  return order;
}

/* ---------- 판 나누기 ---------- */

function dealRound(G, random){
  const n = G.counts.length;
  const deck = random.Shuffle(makeDeck());
  const hands = Array.from({ length: n }, () => []);
  deck.forEach((c, i) => hands[i % n].push(c));
  hands.forEach(h => h.sort((a, b) => a - b));
  G.hands = hands;
  G.counts = hands.map(h => h.length);
  G.pile = null;
  G.table = [];
  G.shown = [];
  G.passed = hands.map(() => false);
  G.finished = [];
}

/* 카멜레온 두 장을 쥔 사람이 있으면 혁명 */
function findRevolution(G, order){
  const seat = G.hands.findIndex(h => h.filter(isJoker).length === 2);
  if (seat < 0) return { on: false, seat: -1, great: false };
  return { on: true, seat, great: order[order.length - 1] === seat };
}

/* 세금 한 쌍. 아래 등수가 가장 좋은 카드를 내주고, 위 등수는 고른 카드(없으면 가장 나쁜 것)를 준다 */
function taxPair(G, hiSeat, loSeat, howMany, chosen){
  const hi = G.hands[hiSeat], lo = G.hands[loSeat];
  lo.sort((a, b) => worst(a) - worst(b));
  const fromLo = lo.splice(0, howMany);

  let fromHi = [];
  if (Array.isArray(chosen) && chosen.length === howMany){
    for (const c of chosen){
      const at = hi.indexOf(c);
      if (at >= 0) fromHi.push(hi.splice(at, 1)[0]);
    }
  }
  while (fromHi.length < howMany){                    /* 안 골랐거나 손에 없으면 */
    hi.sort((a, b) => worst(b) - worst(a));
    fromHi.push(hi.shift());
  }
  hi.push(...fromLo);
  lo.push(...fromHi);
  hi.sort((a, b) => a - b);
  lo.sort((a, b) => a - b);
  G.counts[hiSeat] = hi.length;
  G.counts[loSeat] = lo.length;
}

/* 세금을 실제로 걷는다. chosen 은 {자리: [카드…]} */
function applyTax(G, chosen){
  const order = G.taxOrder;
  const n = order.length;
  if (n >= 4){
    taxPair(G, order[0], order[n - 1], 2, chosen && chosen[order[0]]);
    taxPair(G, order[1], order[n - 2], 1, chosen && chosen[order[1]]);
  }
}

/* 다음 판을 세운다. 세금이 필요하면 tax 단계로 넘어간다 */
function openNextRound(G, random){
  const order = finalOrder(G);
  const n = G.counts.length;

  /* 판이 끝난 순간을 남겨 둔다. 바로 다음 판을 나누기 때문에
     이걸 안 남기면 마지막에 무슨 카드로 끝냈는지 화면이 못 보여준다 */
  G.lastRound = {
    order: order.slice(),
    /* 판이 끝난 순간의 손패 장수. 바로 다음 판을 나누므로 이걸 안 남기면
       마지막까지 남은 꼴등의 손패가 갑자기 새 판 장수로 바뀐다 */
    counts: G.counts.slice(),
    table: ((G.table || []).length ? G.table : (G.shown || []))
             .map(t => ({ by: t.by, num: t.num, count: t.count, cards: (t.cards || []).slice() })),
    points: order.map((seat, rank) => roundPoints(rank, n)),
    roundNo: G.roundNo,
  };

  order.forEach((seat, rank) => { G.score[seat] += roundPoints(rank, n); });
  G.lastOrder = order;
  G.roundNo += 1;

  if (G.roundNo > G.totalRounds){ G.gameOver = true; return; }

  dealRound(G, random);

  /* 혁명은 "쥐었다"가 아니라 "선언했다"로 발동한다.
     쥐고도 안 부르는 것이 전략이므로 여기서는 가능 여부만 표시한다 */
  const rev = findRevolution(G, order);
  G.revolution = rev.on ? { seat: rev.seat, great: rev.great } : null;
  G.revDeclared = false;
  G.revDecided = !rev.on;                             /* 쥔 사람이 없으면 정할 것도 없다 */
  G.taxCancelled = false;
  G.taxOrder = order;
  G.seatOrder = order.slice();          /* 등수대로 다시 앉는다 */

  const taxOn = Boolean(G.opts.tax) && n >= 4;
  /* 세금이 있거나, 선언할 사람이 있으면 그 단계를 거친다 */
  G.needTax = taxOn || rev.on;
  G.taxOn = taxOn;
  G.next = order[0];                                  /* 1등이 선 */
  G.given = {};
}

/* 1~12 중에서 서로 다른 수를 n 개. 같은 수가 둘이면 누가 위인지 흐려진다 */
function pickDistinct(random, n){
  const all = [];
  for (let v = 1; v <= 12; v++) all.push(v);
  return random.Shuffle(all).slice(0, n);
}

/* 뽑기 결과로 순서를 정한다. 낮은 숫자가 위, 같으면 먼저 고른 쪽이 위 */
export function drawOrder(d, n){
  const seats = Array.from({ length: n }, (_, i) => i);
  return seats.sort((a, b) => {
    const va = d.pool[d.took[a]], vb = d.pool[d.took[b]];
    if (va !== vb) return va - vb;
    return d.seq.indexOf(a) - d.seq.indexOf(b);
  });
}

/* ---------- 게임 ---------- */

export const ZooPresident = {
  name: "zoo-president",

  setup: ({ ctx, random }, setupData) => {
    const n = ctx.numPlayers;
    const opts = Object.assign({ rounds: 3, tax: true, clear2: false }, setupData || {});
    const G = {
      hands: [], counts: new Array(n).fill(0), passed: new Array(n).fill(false),
      pile: null, table: [], finished: [], next: 0, trickNo: 0,
      moveNo: 0, lastMove: null,
      score: new Array(n).fill(0),
      roundNo: 1, totalRounds: Math.max(3, opts.rounds),
      opts, lastOrder: null, taxOrder: null, seatOrder: null, revolution: null,
      revDeclared: false, revDecided: true, taxCancelled: false, taxOn: false,
      lastRound: null, shown: [],
      needTax: false, given: {}, gameOver: false,
    };
    dealRound(G, random);
    /* 첫 판 자리는 **진짜 뽑기**로 정한다.
       예전에는 여기서 순서를 미리 섞어 놓고 뽑기 화면이 그 결과에 맞춰
       숫자를 배정했다 — 누가 무엇을 골라도 결과가 같은 가짜였다.
       이제 카드를 깔아만 두고, 각자 고른 것으로 순서가 결정된다 */
    G.seatOrder = null;
    G.next = 0;
    G.draw = {
      pool: pickDistinct(random, n),     /* 자리마다 한 장씩, 서로 다른 숫자 */
      by: new Array(n).fill(null),       /* 카드 자리 → 가져간 사람 */
      took: new Array(n).fill(null),     /* 사람 → 가져간 카드 자리 */
      seq: [],                           /* 고른 차례. 같은 숫자면 먼저 고른 쪽이 위 */
    };
    return G;
  },

  /* 남의 손패는 장수만 보인다 */
  playerView: ({ G, playerID }) => {
    const out = Object.assign({}, G);
    out.hands = G.hands.map((h, i) => (String(i) === String(playerID) ? h.slice() : null));
    /* 아직 아무도 안 가져간 카드의 숫자는 가린다. 안 가리면 낮은 것만 골라 간다 */
    if (G.draw){
      out.draw = Object.assign({}, G.draw, {
        pool: G.draw.pool.map((v, i) => (G.draw.by[i] == null ? null : v)),
      });
    }
    return out;
  },

  phases: {
    /* 첫 순서 정하기. 모두가 동시에 참여하므로 activePlayers 로 열어 둔다.
       한 장씩만 가져갈 수 있고, 남이 가져간 자리는 못 가져간다 */
    draw: {
      start: true,
      turn: { activePlayers: { all: "picking" },
        stages: {
          picking: {
            moves: {
              takeCard: ({ G, playerID }, idx) => {
                const seat = Number(playerID);
                const d = G.draw;
                if (!d) return INVALID_MOVE;
                if (d.took[seat] != null) return INVALID_MOVE;     /* 이미 골랐다 */
                if (!(idx >= 0 && idx < d.pool.length)) return INVALID_MOVE;
                if (d.by[idx] != null) return INVALID_MOVE;        /* 남이 가져갔다 */
                d.by[idx] = seat;
                d.took[seat] = idx;
                d.seq.push(seat);
              },
            },
          },
        },
      },
      endIf: ({ G, ctx }) => G.draw && G.draw.took.every((x, i) => x != null || i >= ctx.numPlayers),
      onEnd: ({ G, ctx }) => {
        const order = drawOrder(G.draw, ctx.numPlayers);
        G.seatOrder = order.slice();
        G.next = order[0];
      },
      next: "play",
    },
    play: {
      turn: {
        /* 한 사람이 한 번 두면 차례가 넘어간다. 다음 사람은 G.next 가 정한다 */
        minMoves: 1,
        maxMoves: 1,
        order: {
          first: ({ G }) => G.next,
          next:  ({ G }) => G.next,
        },
      },
      endIf: ({ G }) => roundDone(G),
      onEnd: ({ G, random }) => { openNextRound(G, random); },
      next: ({ G }) => (G.needTax ? "tax" : "play"),
      moves: {
        play: ({ G, playerID }, num, count) => {
          const seat = Number(playerID);
          const hand = G.hands[seat];
          if (!legalMove(hand, num, count, G.pile)) return INVALID_MOVE;

          const t = takeFrom(hand, num, count);
          if (!t) return INVALID_MOVE;
          G.hands[seat] = t.hand;
          G.counts[seat] = t.hand.length;
          G.pile = { by: seat, num, count };
          /* 실제로 낸 카드를 그대로 남긴다. 숫자·장수만 남기면
             카멜레온으로 채운 것을 화면이 알 수가 없어 숫자 카드로 거짓말을 하게 된다.
             바닥은 모두가 보는 정보라 가릴 이유도 없다 */
          G.table.push({ by: seat, num, count, cards: t.used.slice().sort((a, b) => a - b) });
          noteMove(G, "play", seat);
          noteFinish(G, seat);

          const cleared = num === 1 || (G.opts.clear2 && num === 2);
          const out = G.counts[seat] === 0;

          if (out){
            /* 마지막 카드로 끝냈다 — 판을 비우든 아니든 선은 다음 생존자에게 */
            clearPile(G, nextAlive(G, seat));
            if (G.next < 0) G.next = seat;
            return;
          }
          if (cleared){ clearPile(G, seat); return; }

          /* 낼 수 있는 사람이 나뿐이면 바닥을 치우고 내가 다시 선 */
          const still = active(G);
          if (still.length <= 1){ clearPile(G, seat); return; }

          const nx = nextActive(G, seat);
          G.next = nx >= 0 ? nx : seat;
        },

        pass: ({ G, playerID }) => {
          const seat = Number(playerID);
          if (!G.pile) return INVALID_MOVE;            /* 선은 패스할 수 없다 */
          G.passed[seat] = true;
          noteMove(G, "pass", seat);

          const still = active(G);
          if (still.length <= 1){
            /* 마지막에 낸 사람이 바닥을 치우고 다시 선 */
            const last = G.pile.by;
            clearPile(G, G.counts[last] > 0 ? last : nextAlive(G, last));
            return;
          }
          const nx = nextActive(G, seat);
          G.next = nx >= 0 ? nx : seat;
        },
      },
    },

    tax: {
      turn: {
        activePlayers: { all: "giving" },
        stages: {
          giving: {
            moves: {
              /* 혁명 선언 — 카멜레온 두 장을 쥔 사람만.
                 선언하면 이번 판 세금이 사라지고, 대혁명이면 등수가 통째로 뒤집힌다 */
              declare: ({ G, playerID }) => {
                const seat = Number(playerID);
                if (!G.revolution || G.revDecided) return INVALID_MOVE;
                if (G.revolution.seat !== seat) return INVALID_MOVE;
                G.revDeclared = true;
                G.revDecided = true;
                G.taxCancelled = true;
                if (G.revolution.great){
                  G.taxOrder = G.taxOrder.slice().reverse();
                  G.seatOrder = G.taxOrder.slice();   /* 자리도 통째로 뒤집힌다 */
                }
                G.next = G.taxOrder[0];
              },
              /* 쥐고도 안 부른다 — 세금은 그대로 걷는다 */
              passRev: ({ G, playerID }) => {
                const seat = Number(playerID);
                if (!G.revolution || G.revDecided) return INVALID_MOVE;
                if (G.revolution.seat !== seat) return INVALID_MOVE;
                G.revDecided = true;
              },
              give: ({ G, playerID }, cards) => {
                const seat = Number(playerID);
                if (!G.revDecided || G.taxCancelled || !G.taxOn) return INVALID_MOVE;
                const o = G.taxOrder;
                const need = seat === o[0] ? 2 : (seat === o[1] ? 1 : 0);
                if (!need) return INVALID_MOVE;
                if (!Array.isArray(cards) || cards.length !== need) return INVALID_MOVE;
                const hand = G.hands[seat];
                const tmp = hand.slice();
                for (const c of cards){
                  const at = tmp.indexOf(c);
                  if (at < 0) return INVALID_MOVE;     /* 손에 없는 카드 */
                  tmp.splice(at, 1);
                }
                G.given[seat] = cards.slice();
              },
            },
          },
        },
      },
      /* 혁명을 정했고, 세금까지 끝나야 넘어간다 */
      endIf: ({ G }) => {
        if (!G.revDecided) return false;
        if (G.taxCancelled || !G.taxOn) return true;
        const o = G.taxOrder;
        return G.given[o[0]] !== undefined && G.given[o[1]] !== undefined;
      },
      onEnd: ({ G }) => {
        if (!G.taxCancelled && G.taxOn) applyTax(G, G.given);
        G.needTax = false;
        G.next = G.taxOrder[0];
      },
      next: "play",
      moves: {},
    },
  },

  endIf: ({ G }) => (G.gameOver ? { score: G.score.slice(), order: G.lastOrder } : undefined),

  /* 봇이 고를 수 있는 수 목록 */
  ai: {
    enumerate: (G, ctx, playerID) => {
      const seat = Number(playerID);
      if (ctx.phase === "tax"){
        /* 혁명을 쥔 봇은 선언한다 (봇은 늘 이득을 택한다) */
        if (G.revolution && !G.revDecided){
          if (G.revolution.seat === seat) return [{ move: "declare", args: [] }];
          return [];
        }
        if (G.taxCancelled || !G.taxOn) return [];
        const o = G.taxOrder;
        const need = seat === o[0] ? 2 : (seat === o[1] ? 1 : 0);
        if (!need || G.given[seat] !== undefined) return [];
        const hand = (G.hands[seat] || []).slice().sort((a, b) => worst(b) - worst(a));
        return [{ move: "give", args: [hand.slice(0, need)] }];
      }
      const hand = G.hands[seat] || [];
      const out = [];
      const cnt = {};
      let jok = 0;
      hand.forEach(c => { if (isJoker(c)) jok++; else cnt[c] = (cnt[c] || 0) + 1; });
      const maxN = G.pile ? G.pile.num - 1 : 12;
      for (let num = 1; num <= maxN; num++){
        const same = cnt[num] || 0;
        if (!same) continue;
        if (G.pile){
          if (same + jok >= G.pile.count) out.push({ move: "play", args: [num, G.pile.count] });
        } else {
          for (let c = 1; c <= same + jok; c++) out.push({ move: "play", args: [num, c] });
        }
      }
      if (!G.pile && jok > 0) out.push({ move: "play", args: [JOKER_ALONE, 1] });
      if (G.pile) out.push({ move: "pass", args: [] });
      return out;
    },
  },
};
