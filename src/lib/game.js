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

/* 다음 순번 중 아직 낼 수 있는 사람 */
function nextActive(G, from){
  const n = G.counts.length;
  for (let k = 1; k <= n; k++){
    const i = (from + k) % n;
    if (G.counts[i] > 0 && !G.passed[i]) return i;
  }
  return -1;
}
/* 다음 순번 중 카드가 남은 사람 (선을 넘길 때) */
function nextAlive(G, from){
  const n = G.counts.length;
  for (let k = 1; k <= n; k++){
    const i = (from + k) % n;
    if (G.counts[i] > 0) return i;
  }
  return -1;
}

function clearPile(G, leader){
  G.pile = null;
  G.table = [];                               /* 바닥에 쌓인 것도 같이 치운다 */
  G.passed = G.passed.map(() => false);
  G.next = leader;
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

  order.forEach((seat, rank) => { G.score[seat] += roundPoints(rank, n); });
  G.lastOrder = order;
  G.roundNo += 1;

  if (G.roundNo > G.totalRounds){ G.gameOver = true; return; }

  dealRound(G, random);

  const rev = findRevolution(G, order);
  G.revolution = rev.on ? { seat: rev.seat, great: rev.great } : null;
  if (rev.great) order.reverse();
  G.taxOrder = order;

  /* 혁명이 나면 세금은 전면 취소 */
  G.needTax = Boolean(G.opts.tax) && !rev.on && n >= 4;
  G.next = order[0];                                  /* 1등이 선 */
  G.given = {};
}

/* ---------- 게임 ---------- */

export const ZooPresident = {
  name: "zoo-president",

  setup: ({ ctx, random }, setupData) => {
    const n = ctx.numPlayers;
    const opts = Object.assign({ rounds: 3, tax: true, clear2: false }, setupData || {});
    const G = {
      hands: [], counts: new Array(n).fill(0), passed: new Array(n).fill(false),
      pile: null, table: [], finished: [], next: 0,
      score: new Array(n).fill(0),
      roundNo: 1, totalRounds: Math.max(3, opts.rounds),
      opts, lastOrder: null, taxOrder: null, revolution: null,
      needTax: false, given: {}, gameOver: false,
    };
    dealRound(G, random);
    G.next = Math.floor(random.Number() * n);         /* 첫 판 선은 무작위 */
    return G;
  },

  /* 남의 손패는 장수만 보인다 */
  playerView: ({ G, playerID }) => {
    const out = Object.assign({}, G);
    out.hands = G.hands.map((h, i) => (String(i) === String(playerID) ? h.slice() : null));
    return out;
  },

  phases: {
    play: {
      start: true,
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
          G.table.push({ by: seat, num, count });
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
              give: ({ G, playerID }, cards) => {
                const seat = Number(playerID);
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
      /* 둘 다 골랐으면 넘어간다. 안 고르면 밖에서 시간 초과로 넘긴다 */
      endIf: ({ G }) => {
        const o = G.taxOrder;
        return G.given[o[0]] !== undefined && G.given[o[1]] !== undefined;
      },
      onEnd: ({ G }) => {
        applyTax(G, G.given);
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
