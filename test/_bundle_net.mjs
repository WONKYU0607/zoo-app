var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/flow.js
var flow_exports = {};
__export(flow_exports, {
  install: () => install,
  teardown: () => teardown
});

// src/lib/engine.js
var engine_exports = {};
__export(engine_exports, {
  declareRev: () => declareRev,
  engine: () => engine,
  give: () => give,
  onView: () => onView,
  passRev: () => passRev,
  passTurn: () => passTurn,
  play: () => play,
  setAuto: () => setAuto,
  setPaused: () => setPaused,
  startLocal: () => startLocal,
  startOnline: () => startOnline,
  stop: () => stop
});
import { Client } from "boardgame.io/dist/esm/client.js";
import { SocketIO } from "boardgame.io/dist/esm/multiplayer.js";

// src/lib/game.js
import { INVALID_MOVE } from "boardgame.io/dist/esm/core.js";

// src/lib/deck.js
var JOKER_A = 13;
var JOKER_B = 14;
var isJoker = (c) => c >= 13;
function makeDeck() {
  const d = [];
  for (let n = 1; n <= 12; n++) for (let i = 0; i < n; i++) d.push(n);
  d.push(JOKER_A, JOKER_B);
  return d;
}
function takeFrom(hand, num, count) {
  const h = hand.slice();
  const used = [];
  for (let i = 0; i < count; i++) {
    const at = h.indexOf(num);
    if (at >= 0) {
      used.push(h.splice(at, 1)[0]);
      continue;
    }
    const j = h.findIndex(isJoker);
    if (j < 0) return null;
    used.push(h.splice(j, 1)[0]);
  }
  return { hand: h, used };
}
function legalMove(hand, num, count, cur) {
  if (!Number.isInteger(num) || !Number.isInteger(count)) return false;
  if (num < 1 || num > 13 || count < 1) return false;
  if (cur) {
    if (count !== cur.count) return false;
    if (num >= cur.num) return false;
  }
  const plain = hand.filter((c) => c === num).length;
  const jok = hand.filter(isJoker).length;
  if (num === 13) {
    return jok >= count;
  }
  return plain + jok >= count;
}

// src/lib/game.js
var JOKER_ALONE = 13;
var alive = (G) => G.counts.map((c, i) => c > 0 ? i : -1).filter((i) => i >= 0);
var active = (G) => G.counts.map((c, i) => c > 0 && !G.passed[i] ? i : -1).filter((i) => i >= 0);
function nextActive(G, from) {
  const n = G.counts.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (G.counts[i] > 0 && !G.passed[i]) return i;
  }
  return -1;
}
function nextAlive(G, from) {
  const n = G.counts.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (G.counts[i] > 0) return i;
  }
  return -1;
}
function clearPile(G, leader) {
  G.pile = null;
  if ((G.table || []).length) G.shown = G.table.map((t) => ({ by: t.by, num: t.num, count: t.count }));
  G.table = [];
  G.passed = G.passed.map(() => false);
  G.next = leader;
}
function noteFinish(G, seat) {
  if (G.counts[seat] === 0 && !G.finished.includes(seat)) G.finished.push(seat);
}
var roundDone = (G) => alive(G).length <= 1;
var winnersCount = (n) => Math.floor(n / 2);
var roundPoints = (rank, n) => rank < winnersCount(n) ? 100 - rank * 10 : 0;
var worst = (c) => isJoker(c) ? 99 : c;
function finalOrder(G) {
  const order = G.finished.slice();
  for (let i = 0; i < G.counts.length; i++) if (!order.includes(i)) order.push(i);
  return order;
}
function dealRound(G, random) {
  const n = G.counts.length;
  const deck = random.Shuffle(makeDeck());
  const hands = Array.from({ length: n }, () => []);
  deck.forEach((c, i) => hands[i % n].push(c));
  hands.forEach((h) => h.sort((a, b) => a - b));
  G.hands = hands;
  G.counts = hands.map((h) => h.length);
  G.pile = null;
  G.table = [];
  G.shown = [];
  G.passed = hands.map(() => false);
  G.finished = [];
}
function findRevolution(G, order) {
  const seat = G.hands.findIndex((h) => h.filter(isJoker).length === 2);
  if (seat < 0) return { on: false, seat: -1, great: false };
  return { on: true, seat, great: order[order.length - 1] === seat };
}
function taxPair(G, hiSeat, loSeat, howMany, chosen) {
  const hi = G.hands[hiSeat], lo = G.hands[loSeat];
  lo.sort((a, b) => worst(a) - worst(b));
  const fromLo = lo.splice(0, howMany);
  let fromHi = [];
  if (Array.isArray(chosen) && chosen.length === howMany) {
    for (const c of chosen) {
      const at = hi.indexOf(c);
      if (at >= 0) fromHi.push(hi.splice(at, 1)[0]);
    }
  }
  while (fromHi.length < howMany) {
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
function applyTax(G, chosen) {
  const order = G.taxOrder;
  const n = order.length;
  if (n >= 4) {
    taxPair(G, order[0], order[n - 1], 2, chosen && chosen[order[0]]);
    taxPair(G, order[1], order[n - 2], 1, chosen && chosen[order[1]]);
  }
}
function openNextRound(G, random) {
  const order = finalOrder(G);
  const n = G.counts.length;
  G.lastRound = {
    order: order.slice(),
    table: ((G.table || []).length ? G.table : G.shown || []).map((t) => ({ by: t.by, num: t.num, count: t.count })),
    points: order.map((seat, rank) => roundPoints(rank, n)),
    roundNo: G.roundNo
  };
  order.forEach((seat, rank) => {
    G.score[seat] += roundPoints(rank, n);
  });
  G.lastOrder = order;
  G.roundNo += 1;
  if (G.roundNo > G.totalRounds) {
    G.gameOver = true;
    return;
  }
  dealRound(G, random);
  const rev = findRevolution(G, order);
  G.revolution = rev.on ? { seat: rev.seat, great: rev.great } : null;
  G.revDeclared = false;
  G.revDecided = !rev.on;
  G.taxCancelled = false;
  G.taxOrder = order;
  const taxOn = Boolean(G.opts.tax) && n >= 4;
  G.needTax = taxOn || rev.on;
  G.taxOn = taxOn;
  G.next = order[0];
  G.given = {};
}
var ZooPresident = {
  name: "zoo-president",
  setup: ({ ctx, random }, setupData) => {
    const n = ctx.numPlayers;
    const opts = Object.assign({ rounds: 3, tax: true, clear2: false }, setupData || {});
    const G = {
      hands: [],
      counts: new Array(n).fill(0),
      passed: new Array(n).fill(false),
      pile: null,
      table: [],
      finished: [],
      next: 0,
      score: new Array(n).fill(0),
      roundNo: 1,
      totalRounds: Math.max(3, opts.rounds),
      opts,
      lastOrder: null,
      taxOrder: null,
      revolution: null,
      revDeclared: false,
      revDecided: true,
      taxCancelled: false,
      taxOn: false,
      lastRound: null,
      shown: [],
      needTax: false,
      given: {},
      gameOver: false
    };
    dealRound(G, random);
    G.next = Math.floor(random.Number() * n);
    return G;
  },
  /* 남의 손패는 장수만 보인다 */
  playerView: ({ G, playerID }) => {
    const out = Object.assign({}, G);
    out.hands = G.hands.map((h, i) => String(i) === String(playerID) ? h.slice() : null);
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
          next: ({ G }) => G.next
        }
      },
      endIf: ({ G }) => roundDone(G),
      onEnd: ({ G, random }) => {
        openNextRound(G, random);
      },
      next: ({ G }) => G.needTax ? "tax" : "play",
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
          const cleared = num === 1 || G.opts.clear2 && num === 2;
          const out = G.counts[seat] === 0;
          if (out) {
            clearPile(G, nextAlive(G, seat));
            if (G.next < 0) G.next = seat;
            return;
          }
          if (cleared) {
            clearPile(G, seat);
            return;
          }
          const still = active(G);
          if (still.length <= 1) {
            clearPile(G, seat);
            return;
          }
          const nx = nextActive(G, seat);
          G.next = nx >= 0 ? nx : seat;
        },
        pass: ({ G, playerID }) => {
          const seat = Number(playerID);
          if (!G.pile) return INVALID_MOVE;
          G.passed[seat] = true;
          const still = active(G);
          if (still.length <= 1) {
            const last = G.pile.by;
            clearPile(G, G.counts[last] > 0 ? last : nextAlive(G, last));
            return;
          }
          const nx = nextActive(G, seat);
          G.next = nx >= 0 ? nx : seat;
        }
      }
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
                if (G.revolution.great) G.taxOrder = G.taxOrder.slice().reverse();
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
                const need = seat === o[0] ? 2 : seat === o[1] ? 1 : 0;
                if (!need) return INVALID_MOVE;
                if (!Array.isArray(cards) || cards.length !== need) return INVALID_MOVE;
                const hand = G.hands[seat];
                const tmp = hand.slice();
                for (const c of cards) {
                  const at = tmp.indexOf(c);
                  if (at < 0) return INVALID_MOVE;
                  tmp.splice(at, 1);
                }
                G.given[seat] = cards.slice();
              }
            }
          }
        }
      },
      /* 혁명을 정했고, 세금까지 끝나야 넘어간다 */
      endIf: ({ G }) => {
        if (!G.revDecided) return false;
        if (G.taxCancelled || !G.taxOn) return true;
        const o = G.taxOrder;
        return G.given[o[0]] !== void 0 && G.given[o[1]] !== void 0;
      },
      onEnd: ({ G }) => {
        if (!G.taxCancelled && G.taxOn) applyTax(G, G.given);
        G.needTax = false;
        G.next = G.taxOrder[0];
      },
      next: "play",
      moves: {}
    }
  },
  endIf: ({ G }) => G.gameOver ? { score: G.score.slice(), order: G.lastOrder } : void 0,
  /* 봇이 고를 수 있는 수 목록 */
  ai: {
    enumerate: (G, ctx, playerID) => {
      const seat = Number(playerID);
      if (ctx.phase === "tax") {
        if (G.revolution && !G.revDecided) {
          if (G.revolution.seat === seat) return [{ move: "declare", args: [] }];
          return [];
        }
        if (G.taxCancelled || !G.taxOn) return [];
        const o = G.taxOrder;
        const need = seat === o[0] ? 2 : seat === o[1] ? 1 : 0;
        if (!need || G.given[seat] !== void 0) return [];
        const hand2 = (G.hands[seat] || []).slice().sort((a, b) => worst(b) - worst(a));
        return [{ move: "give", args: [hand2.slice(0, need)] }];
      }
      const hand = G.hands[seat] || [];
      const out = [];
      const cnt = {};
      let jok = 0;
      hand.forEach((c) => {
        if (isJoker(c)) jok++;
        else cnt[c] = (cnt[c] || 0) + 1;
      });
      const maxN = G.pile ? G.pile.num - 1 : 12;
      for (let num = 1; num <= maxN; num++) {
        const same = cnt[num] || 0;
        if (!same) continue;
        if (G.pile) {
          if (same + jok >= G.pile.count) out.push({ move: "play", args: [num, G.pile.count] });
        } else {
          for (let c = 1; c <= same + jok; c++) out.push({ move: "play", args: [num, c] });
        }
      }
      if (!G.pile && jok > 0) out.push({ move: "play", args: [JOKER_ALONE, 1] });
      if (G.pile) out.push({ move: "pass", args: [] });
      return out;
    }
  }
};

// src/lib/view.js
var toScreen = (seat, me, n) => ((seat - me) % n + n) % n;
var toSeat = (pos, me, n) => ((pos + me) % n + n) % n;
function screenView(G, ctx, myID, names) {
  const n = G.counts.length;
  const me = Number(myID);
  const nm = names || new Array(n).fill("");
  const seats = new Array(n);
  for (let seat = 0; seat < n; seat++) {
    const pos = toScreen(seat, me, n);
    seats[pos] = {
      name: nm[seat] || "",
      c: G.counts[seat],
      s: G.passed[seat] ? "pass" : "",
      out: G.counts[seat] === 0,
      hold: seat === me ? (G.hands[seat] || []).slice() : null
    };
  }
  const table = (G.table || []).map((t) => ({
    by: toScreen(t.by, me, n),
    num: t.num,
    count: t.count,
    cards: new Array(t.count).fill(t.num)
    /* 남의 카드는 숫자만 안다 */
  }));
  return {
    N: n,
    me: 0,
    /* 화면에서 나는 언제나 0 */
    names: seats.map((s) => s.name),
    seats,
    hand: (G.hands[me] || []).slice(),
    turn: ctx.phase === "play" ? toScreen(Number(ctx.currentPlayer), me, n) : -1,
    myTurn: ctx.phase === "play" && Number(ctx.currentPlayer) === me,
    table,
    pile: G.pile ? { by: toScreen(G.pile.by, me, n), num: G.pile.num, count: G.pile.count } : null,
    /* 바닥을 치우기 직전 모습. 1번으로 엎거나 마지막 카드로 완주하면
       올리기와 치우기가 한 수 안에서 끝나므로, 이걸 넘겨야 화면이 보여줄 수 있다 */
    lastTable: (G.shown || []).map((t) => ({
      by: toScreen(t.by, me, n),
      num: t.num,
      count: t.count,
      cards: new Array(t.count).fill(t.num)
    })),
    finish: (G.finished || []).map((s) => toScreen(s, me, n)),
    score: G.counts.map((_, seat) => G.score[toSeat(seat, me, n)]),
    roundNo: G.roundNo,
    totalRounds: G.totalRounds,
    phase: ctx.phase,
    revolution: G.revolution ? {
      seat: toScreen(G.revolution.seat, me, n),
      great: G.revolution.great,
      mine: G.revolution.seat === me,
      decided: Boolean(G.revDecided),
      declared: Boolean(G.revDeclared)
    } : null,
    /* 내가 지금 선언할 수 있는가 */
    canDeclare: Boolean(G.revolution && !G.revDecided && G.revolution.seat === me),
    taxCancelled: Boolean(G.taxCancelled),
    /* 세금 단계에서 내가 내야 할 장수 (0이면 낼 것 없음) */
    taxGive: (() => {
      if (ctx.phase !== "tax" || !G.taxOrder) return 0;
      if (G.given && G.given[me] !== void 0) return 0;
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
      order: G.lastRound.order.map((s) => toScreen(s, me, n)),
      points: G.lastRound.points.slice(),
      table: G.lastRound.table.map((t) => ({
        by: toScreen(t.by, me, n),
        num: t.num,
        count: t.count,
        cards: new Array(t.count).fill(t.num)
      }))
    } : null,
    over: ctx.gameover ? {
      score: G.counts.map((_, seat) => ctx.gameover.score[toSeat(seat, me, n)]),
      order: (ctx.gameover.order || []).map((s) => toScreen(s, me, n))
    } : null
  };
}

// src/lib/engine.js
var engine = {
  mode: null,
  /* "local" | "online" */
  client: null,
  myID: "0",
  names: [],
  bots: [],
  /* 봇이 앉은 자리 (엔진 자리 번호) */
  view: null,
  paused: false,
  /* 결과를 보는 동안 다음 판을 멈춘다 */
  auto: false,
  /* 자동치기 — 내 자리도 봇과 같은 판단으로 둔다 */
  botMs: 3e3
  /* 봇이 생각하는 척하는 시간 */
};
var listeners = [];
var unsub = null;
var botTimer = null;
var gen = 0;
function onView(fn) {
  listeners.push(fn);
  if (engine.view) fn(engine.view);
  return () => {
    listeners = listeners.filter((f) => f !== fn);
  };
}
function raw() {
  if (!engine.client) return null;
  return engine.mode === "local" ? engine.client.store.getState() : engine.client.getState();
}
function push() {
  const st = raw();
  if (!st) return;
  engine.view = screenView(st.G, st.ctx, engine.myID, engine.names);
  listeners.forEach((f) => {
    try {
      f(engine.view);
    } catch (e) {
      console.error(e);
    }
  });
  if (engine.mode === "local") scheduleBot();
}
function botPick(hand, pile) {
  const cnt = {};
  let jok = 0;
  hand.forEach((c) => {
    if (isJoker(c)) jok++;
    else cnt[c] = (cnt[c] || 0) + 1;
  });
  const opts = [];
  const maxN = pile ? pile.num - 1 : 12;
  for (let num = 1; num <= maxN; num++) {
    const same = cnt[num] || 0;
    if (!same) continue;
    if (pile) {
      const need = pile.count - same;
      if (need > jok) continue;
      opts.push({ num, count: pile.count, useJok: Math.max(0, need), own: same });
    } else opts.push({ num, count: same, useJok: 0, own: same });
  }
  if (!opts.length) return !pile && jok > 0 ? { num: 13, count: 1 } : null;
  opts.forEach((o) => {
    let s = o.num * 2;
    s -= o.useJok * 10;
    if (pile && o.own > o.count) s -= 24;
    o.s = s;
  });
  opts.sort((a, b) => b.s - a.s);
  if (opts.length > 1 && Math.random() < 0.1) return opts[1];
  return opts[0];
}
var worstFirst = (a, b) => (isJoker(b) ? 99 : b) - (isJoker(a) ? 99 : a);
var actsFor = (seat) => engine.bots.includes(seat) || engine.auto && seat === Number(engine.myID);
function scheduleBot() {
  if (botTimer) return;
  const st = raw();
  if (!st || st.ctx.gameover) return;
  const G = st.G, ctx = st.ctx;
  if (ctx.phase === "tax") {
    const revSeat = G.revolution && !G.revDecided ? G.revolution.seat : -1;
    const revTodo = revSeat >= 0 && actsFor(revSeat);
    const o = G.taxOrder;
    const canGive = G.revDecided && !G.taxCancelled && G.taxOn;
    const todo = canGive ? [o[0], o[1]].filter((seat2) => actsFor(seat2) && G.given[seat2] === void 0) : [];
    if (!revTodo && !todo.length) return;
    const g2 = ++gen;
    botTimer = setTimeout(() => {
      botTimer = null;
      if (g2 !== gen) return;
      const s2 = raw();
      if (!s2 || s2.ctx.phase !== "tax") {
        push();
        return;
      }
      if (revTodo && s2.G.revolution && !s2.G.revDecided) {
        engine.client.updatePlayerID(String(s2.G.revolution.seat));
        engine.client.moves.declare();
      }
      const s3 = raw();
      if (s3 && s3.ctx.phase === "tax" && s3.G.revDecided && !s3.G.taxCancelled && s3.G.taxOn) {
        for (const seat2 of [s3.G.taxOrder[0], s3.G.taxOrder[1]]) {
          if (!actsFor(seat2) || s3.G.given[seat2] !== void 0) continue;
          const hand = (s3.G.hands[seat2] || []).slice().sort(worstFirst);
          const need = seat2 === s3.G.taxOrder[0] ? 2 : 1;
          if (hand.length < need) continue;
          engine.client.updatePlayerID(String(seat2));
          engine.client.moves.give(hand.slice(0, need));
        }
      }
      engine.client.updatePlayerID(engine.myID);
      push();
    }, 700);
    return;
  }
  if (engine.paused) return;
  const seat = Number(ctx.currentPlayer);
  if (!actsFor(seat)) return;
  const g = ++gen;
  botTimer = setTimeout(() => {
    botTimer = null;
    if (g !== gen) return;
    const s2 = raw();
    if (!s2 || s2.ctx.gameover || s2.ctx.phase !== "play") {
      push();
      return;
    }
    const now = Number(s2.ctx.currentPlayer);
    if (!actsFor(now)) {
      push();
      return;
    }
    const mv = botPick(s2.G.hands[now] || [], s2.G.pile);
    engine.client.updatePlayerID(String(now));
    if (mv) engine.client.moves.play(mv.num, mv.count);
    else engine.client.moves.pass();
    engine.client.updatePlayerID(engine.myID);
    push();
  }, engine.botMs);
}
function setAuto(on) {
  engine.auto = Boolean(on);
  gen++;
  if (botTimer) {
    clearTimeout(botTimer);
    botTimer = null;
  }
  scheduleBot();
}
function attach(client) {
  engine.client = client;
  client.start();
  if (unsub) unsub();
  unsub = client.subscribe(() => push());
  push();
}
function startLocal({ numPlayers = 6, opts = {}, names = [], myID = "0", bots = null } = {}) {
  stop();
  engine.mode = "local";
  engine.myID = String(myID);
  engine.names = names.length ? names : new Array(numPlayers).fill("");
  engine.bots = bots || Array.from({ length: numPlayers }, (_, i) => i).filter((i) => i !== Number(myID));
  const game = Object.assign({}, ZooPresident, {
    setup: (ctx) => ZooPresident.setup(ctx, opts)
  });
  attach(Client({ game, numPlayers, playerID: engine.myID }));
}
function startOnline({ server, matchID, playerID, credentials, numPlayers, names = [] }) {
  stop();
  engine.mode = "online";
  engine.myID = String(playerID);
  engine.names = names.length ? names : new Array(numPlayers).fill("");
  engine.bots = [];
  attach(Client({
    game: ZooPresident,
    numPlayers,
    matchID,
    playerID: engine.myID,
    credentials,
    multiplayer: SocketIO({ server }),
    debug: false
    /* boardgame.io 의 개발용 패널을 띄우지 않는다 */
  }));
}
function setPaused(on) {
  engine.paused = Boolean(on);
  if (engine.paused) {
    gen++;
    if (botTimer) {
      clearTimeout(botTimer);
      botTimer = null;
    }
    return;
  }
  scheduleBot();
}
function stop() {
  gen++;
  if (botTimer) {
    clearTimeout(botTimer);
    botTimer = null;
  }
  if (unsub) {
    unsub();
    unsub = null;
  }
  if (engine.client) {
    try {
      engine.client.stop();
    } catch (e) {
    }
  }
  engine.client = null;
  engine.view = null;
}
function play(num, count) {
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.play(num, count);
  return true;
}
function passTurn() {
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.pass();
  return true;
}
function declareRev() {
  if (!engine.client) return;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.declare();
  push();
}
function passRev() {
  if (!engine.client) return;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.passRev();
  push();
}
function give(cards) {
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.give(cards);
  return true;
}

// src/lib/localroom.js
var BOT_NAMES = ["\uC11C\uC5F0", "\uC900\uD638", "\uBBFC\uC9C0", "\uD0DC\uC724", "\uD558\uC740", "\uC9C0\uD6C8", "\uC608\uB9B0"];
var ME = "me";
var newCode = () => String(Math.floor(1e3 + Math.random() * 9e3));
function createRoom({ cap = 4, name = "\uB098" } = {}) {
  return {
    code: newCode(),
    cap: Math.min(8, Math.max(4, cap)),
    phase: "waiting",
    seats: [{ uid: ME, name: String(name || "\uB098"), bot: false }]
  };
}
function addBot(room) {
  if (!room || room.phase !== "waiting") return false;
  if (room.seats.length >= room.cap) return false;
  const used = room.seats.map((s) => s && s.name);
  const name = BOT_NAMES.find((n) => !used.includes(n)) || "\uBD07" + room.seats.length;
  room.seats.push({ uid: "bot" + room.seats.length, name, bot: true });
  return true;
}
function setCap(room, cap) {
  if (!room) return;
  room.cap = Math.min(8, Math.max(4, Number(cap) || room.cap));
  while (room.seats.length > room.cap) room.seats.pop();
}
function toRoomView(room) {
  if (!room) return null;
  return {
    code: room.code,
    cap: room.cap,
    me: 0,
    host: ME,
    phase: room.phase,
    round: null,
    seats: room.seats.slice()
  };
}
var seatCount = (room) => room ? room.seats.length : 0;

// src/lib/lobby.js
var lobby_exports = {};
__export(lobby_exports, {
  createRoom: () => createRoom2,
  joinRoom: () => joinRoom,
  keepAlive: () => keepAlive,
  online: () => online,
  peekRoom: () => peekRoom,
  serverUrl: () => serverUrl,
  startRoom: () => startRoom
});
var serverUrl = () => typeof globalThis !== "undefined" && globalThis.__ZOO_SERVER || (import.meta && import.meta.env && import.meta.env.VITE_GAME_SERVER || "");
var online = () => Boolean(serverUrl());
async function api(path, body) {
  const res = await fetch(serverUrl() + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : void 0
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = {};
  }
  if (!res.ok) throw new Error(data && data.error || "\uC11C\uBC84 \uC624\uB958 " + res.status);
  return data;
}
var createRoom2 = ({ numPlayers, name, rounds, tax, clear2 }) => api("/zoo/rooms", { numPlayers, name, rounds, tax, clear2 });
var joinRoom = (code, name) => api(`/zoo/rooms/${code}/join`, { name });
var peekRoom = (code) => api(`/zoo/rooms/${code}`);
var startRoom = (code) => api(`/zoo/rooms/${code}/start`, {});
var keepAlive = (code, seat) => api(`/zoo/rooms/${code}/alive`, { seat }).catch(() => null);

// src/lib/flow.js
var opt = null;
var myRoom = null;
var botTimer2 = null;
var net = null;
var pollId = null;
var W = () => window;
var D = () => window.document;
function emitRoom() {
  W().__room = net ? netRoomView() : toRoomView(myRoom);
  W().dispatchEvent(new Event("roomchange"));
}
function netRoomView() {
  if (!net) return null;
  const seats = new Array(net.numPlayers).fill(null);
  (net.players || []).forEach((p) => {
    const i = Number(p.id);
    if (!p.name) return;
    seats[i] = {
      uid: "s" + i,
      name: p.name,
      bot: Boolean(p.bot),
      off: Boolean(p.away),
      left: Boolean(p.left)
    };
  });
  return {
    code: net.code,
    cap: net.numPlayers,
    me: Number(net.playerID),
    host: net.playerID === "0" ? "s0" : "host",
    phase: net.started ? "playing" : "waiting",
    round: null,
    seats
  };
}
function pollStart() {
  if (pollId || !net) return;
  pollId = setInterval(async () => {
    if (!net) {
      pollStop();
      return;
    }
    try {
      const r = await peekRoom(net.code);
      net.players = r.players;
      net.started = r.started;
      W().__opts.seated = (r.players || []).filter((p) => p.name).length;
      emitRoom();
      if (r.started && !net.inGame) enterOnlineGame();
    } catch (e) {
    }
  }, 1500);
}
function pollStop() {
  if (pollId) {
    clearInterval(pollId);
    pollId = null;
  }
}
function botFillStart() {
  if (botTimer2) return;
  botTimer2 = setInterval(() => {
    if (!addOneBot()) botFillStop();
  }, opt.botJoinMs);
}
function botFillStop() {
  if (botTimer2) {
    clearInterval(botTimer2);
    botTimer2 = null;
  }
}
function addOneBot() {
  if (!addBot(myRoom)) return false;
  W().__opts.seated = seatCount(myRoom);
  emitRoom();
  if (myRoom && seatCount(myRoom) >= myRoom.cap) startRoomCount(15);
  return true;
}
var roomCountId = null;
function stopRoomCount() {
  if (roomCountId) {
    clearInterval(roomCountId);
    roomCountId = null;
  }
  const b = D().querySelector("#room #action button");
  if (b) b.textContent = (b.textContent || "").replace(/\s*\(\d+\)$/, "");
}
function startRoomCount(sec) {
  if (roomCountId) return;
  const page = D().getElementById("room");
  if (!page) return;
  let left = sec;
  const tick = () => {
    const b = D().querySelector("#room #action button");
    if (!myRoom || myRoom.phase !== "waiting" || !page.classList.contains("is-on")) {
      if (!myRoom || myRoom.phase !== "waiting") {
        stopRoomCount();
      }
      return;
    }
    if (!b || b.disabled) return;
    const base = (b.textContent || "").replace(/\s*\(\d+\)$/, "");
    if (left <= 0) {
      stopRoomCount();
      b.click();
      return;
    }
    b.textContent = base + " (" + left + ")";
    left--;
  };
  tick();
  roomCountId = setInterval(tick, 1e3);
}
function startGame() {
  if (net) return startOnlineGame();
  botFillStop();
  stopRoomCount();
  while (seatCount(myRoom) < 4) if (!addOneBot()) break;
  const n = seatCount(myRoom);
  if (n < 4) throw new Error("4\uBA85\uC774 \uBAA8\uC5EC\uC57C \uC2DC\uC791\uD569\uB2C8\uB2E4 (\uC9C0\uAE08 " + n + "\uBA85)");
  myRoom.phase = "playing";
  emitRoom();
  setAuto(false);
  const o = W().__opts || {};
  const rounds = Math.max(3, Number(o.rounds) || 3);
  startLocal({
    numPlayers: n,
    myID: "0",
    names: myRoom.seats.map((s) => s.name),
    opts: { rounds, tax: o.tax !== false, clear2: Boolean(o.clear2) }
  });
  setPaused(true);
  const v = engine.view;
  if (!v) throw new Error("\uD310\uC744 \uC138\uC6B0\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4");
  W().__opts = Object.assign(W().__opts || {}, { rounds });
  openTable(v, n, myRoom.seats.map((s) => s.name));
}
async function startOnlineGame() {
  stopRoomCount();
  await startRoom(net.code);
  const r = await peekRoom(net.code);
  net.players = r.players;
  net.started = true;
  emitRoom();
  enterOnlineGame();
}
function enterOnlineGame() {
  if (!net || net.inGame) return;
  net.inGame = true;
  pollStop();
  startOnline({
    server: serverUrl(),
    matchID: net.matchID,
    playerID: net.playerID,
    credentials: net.credentials,
    numPlayers: net.numPlayers,
    names: (net.players || []).map((p) => p.name || "")
  });
  setPaused(true);
  let tries = 0;
  const wait = setInterval(() => {
    const v = engine.view;
    if (!v) {
      if (tries++ > 120) {
        clearInterval(wait);
      }
      return;
    }
    clearInterval(wait);
    openTable(v, net.numPlayers, (net.players || []).map((p) => p.name || ""));
  }, 100);
}
function openTable(v, n, names) {
  W().__net = { engine: true };
  W().GAME = {
    N: n,
    roundNo: v.roundNo,
    names: v.names.slice(),
    namesEn: v.names.slice(),
    hold: null,
    order: null,
    finish: null,
    score: v.score.slice(),
    mySeat: 0
  };
  W().__opts = Object.assign(W().__opts || {}, { seated: n });
  W().__leadSeat = v.turn >= 0 ? v.turn : 0;
  W().GAME.order = Array.from({ length: n }, (_, k) => (W().__leadSeat + k) % n);
  W().__roundNo = v.roundNo;
  W().__myRankIdx = null;
  W().__scored = null;
  W().__gameOver = null;
  opt.goto("draw");
}
function onRoundEnd(v) {
  const lr = v.lastRound;
  if (!lr) {
    setPaused(false);
    return;
  }
  setPaused(true);
  const G = W().GAME = W().GAME || {};
  G.N = v.N;
  G.names = v.names.slice();
  G.namesEn = v.names.slice();
  G.finish = lr.order.slice();
  G.score = v.score.slice();
  G.hold = Array.from({ length: v.N }, (_, i) => i === 0 ? v.hand.slice() : []);
  G.roundNo = lr.roundNo;
  W().__roundNo = lr.roundNo;
  W().__myGive = null;
  W().__taxGive = null;
  W().__taxCancelled = v.taxCancelled;
  W().__revolution = v.revolution ? { seat: v.revolution.seat, great: v.revolution.great, mine: v.revolution.mine } : null;
  opt.goto("result");
  startCount(5);
}
function onGameOver(over) {
  stopCount();
  setPaused(true);
  const G = W().GAME = W().GAME || {};
  G.roundNo = W().__opts && W().__opts.rounds || G.roundNo || 3;
  G.finish = over.order.slice();
  G.score = over.score.slice();
  opt.goto("result");
}
var countId = null;
function stopCount() {
  if (countId) {
    clearInterval(countId);
    countId = null;
  }
}
function startCount(sec) {
  stopCount();
  const btn = D().querySelector("#result #next");
  const page = D().getElementById("result");
  if (!btn || !page) return;
  const base = (btn.textContent || "\uB2E4\uC74C").replace(/\s*\(\d+\)$/, "");
  let left = sec;
  const tick = () => {
    if (!page.classList.contains("is-on")) {
      stopCount();
      btn.textContent = base;
      return;
    }
    if (left <= 0) {
      stopCount();
      btn.textContent = base;
      btn.click();
      return;
    }
    btn.textContent = base + " (" + left + ")";
    left--;
  };
  tick();
  countId = setInterval(tick, 1e3);
}
function ensureTaxGiven() {
  const v = engine.view;
  if (!v || v.phase !== "tax") return;
  if (v.canDeclare) passRev();
  if (!v.taxGive) return;
  const worst2 = (c) => c >= 13 ? 99 : c;
  const hand = (v.hand || []).slice().sort((a, b) => worst2(b) - worst2(a));
  if (hand.length < v.taxGive) return;
  give(hand.slice(0, v.taxGive));
}
function install({ goto, myName = () => "\uB098", botJoinMs = 2500 } = {}) {
  opt = { goto, myName, botJoinMs };
  W().__createRoom = async () => {
    const o = W().__opts || {};
    if (online()) {
      const r = await createRoom2({
        numPlayers: o.cap || 4,
        name: opt.myName(),
        rounds: o.rounds || 3,
        tax: o.tax !== false,
        clear2: Boolean(o.clear2)
      });
      net = Object.assign(
        { started: false, inGame: false },
        r,
        { players: [{ id: 0, name: opt.myName() }] }
      );
      W().__opts = Object.assign(W().__opts || {}, { cap: r.numPlayers, seated: 1 });
      emitRoom();
      pollStart();
      return r.code;
    }
    myRoom = createRoom({ cap: o.cap || 4, name: opt.myName() });
    W().__opts = Object.assign(W().__opts || {}, { cap: myRoom.cap, seated: 1 });
    emitRoom();
    botFillStart();
    return myRoom.code;
  };
  W().__joinRoom = async (code) => {
    if (!online()) {
      alert("\uC11C\uBC84 \uB300\uC804\uC744 \uC4F0\uB824\uBA74 \uAC8C\uC784 \uC11C\uBC84 \uC8FC\uC18C\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.");
      return null;
    }
    const r = await joinRoom(String(code).trim(), opt.myName());
    net = Object.assign(
      { started: false, inGame: false },
      r,
      { players: [{ id: Number(r.playerID), name: opt.myName() }] }
    );
    W().__opts = Object.assign(W().__opts || {}, {
      cap: r.numPlayers,
      rounds: r.opts && r.opts.rounds || 3,
      tax: !(r.opts && r.opts.tax === false),
      clear2: Boolean(r.opts && r.opts.clear2)
    });
    emitRoom();
    pollStart();
    return r.code;
  };
  W().__peek = async (code) => {
    if (!online()) return null;
    try {
      return await peekRoom(String(code).trim());
    } catch (e) {
      return null;
    }
  };
  W().__roomCode = () => net ? net.code : myRoom ? myRoom.code : null;
  W().__leaveRoom = () => {
    botFillStop();
    stopRoomCount();
    pollStop();
    stop();
    myRoom = null;
    net = null;
    emitRoom();
  };
  W().__saveOpts = async () => {
    if (!myRoom) return;
    setCap(myRoom, (W().__opts || {}).cap);
    W().__opts.cap = myRoom.cap;
    W().__opts.seated = seatCount(myRoom);
    emitRoom();
  };
  W().__botFill = (on) => on ? botFillStart() : botFillStop();
  W().__addBot = addOneBot;
  W().__startRound = async () => startGame();
  W().__onRoundEnd = onRoundEnd;
  W().__onGameOver = () => {
    const o = W().__gameOver;
    if (o) onGameOver(o);
  };
  W().__onTax = (v) => {
    W().__myNeedGive = v.taxGive;
  };
  W().__iMoved = () => {
    if (net) keepAlive(net.code, Number(net.playerID));
  };
  W().__declareRev = () => declareRev();
  W().__passRev = () => passRev();
  W().__setTaxGive = (cards) => {
    W().__taxGive = cards;
    if (Array.isArray(cards) && cards.length) give(cards);
  };
  W().__endRoundOnline = async () => {
  };
  const prevBootTable = W().__bootTable;
  W().__bootTable = (fresh) => {
    stopCount();
    ensureTaxGiven();
    setPaused(false);
    if (typeof prevBootTable === "function") prevBootTable(fresh);
  };
  const prevToTable = W().__toTable;
  W().__toTable = () => {
    setPaused(false);
    if (typeof prevToTable === "function") prevToTable();
    else opt.goto("table");
  };
  W().__onRestart = () => {
    stop();
    if (!myRoom) return opt.goto("lobby");
    myRoom.phase = "waiting";
    emitRoom();
    opt.goto("room");
  };
  W().__quitGame = () => {
    stopCount();
    botFillStop();
    stop();
    setPaused(false);
  };
  const quit = D().querySelector("#result #quit");
  if (quit) quit.addEventListener("click", () => {
    stopCount();
    stop();
    myRoom = null;
  });
}
function teardown() {
  botFillStop();
  stopRoomCount();
  stopCount();
  pollStop();
  net = null;
  stop();
  myRoom = null;
}
export {
  engine_exports as eng,
  flow_exports as flow,
  lobby_exports as lobby
};
