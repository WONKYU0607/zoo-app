/* 엔진과 화면 사이의 유일한 통로.

   화면은 여기서 나오는 view 만 보고 그린다. 엔진 상태를 직접 만지지 않는다.
   자리 번호를 돌리는 일은 view.js 안에서만 일어난다.

   두 가지 모드가 같은 규칙 한 벌을 쓴다.
     local  — 서버 없이 이 기기 안에서. 빈자리는 봇이 앉는다
     online — 게임 서버에 붙어서. 내 수만 보내고 나머지는 서버가 알려준다 */

import { Client } from "boardgame.io/dist/esm/client.js";
import { SocketIO } from "boardgame.io/dist/esm/multiplayer.js";
import { ZooPresident } from "./game.js";
import { screenView } from "./view.js";
import { isJoker } from "./deck.js";

export const engine = {
  mode: null,          /* "local" | "online" */
  client: null,
  myID: "0",
  names: [],
  bots: [],            /* 봇이 앉은 자리 (엔진 자리 번호) */
  view: null,
  paused: false,       /* 결과를 보는 동안 다음 판을 멈춘다 */
  auto: false,         /* 자동치기 — 내 자리도 봇과 같은 판단으로 둔다 */
  botMs: 3000,         /* 봇이 생각하는 척하는 시간 */
  moveLog: [],         /* 실제로 둔 수 [{no,k,by}] — 검사용 정답지 */
  lastLogged: 0,
};

let listeners = [];
let unsub = null;
let botTimer = null;
let gen = 0;           /* 판이 바뀌면 올려서 예전 예약을 무효화한다 */

export function onView(fn){
  listeners.push(fn);
  if (engine.view) fn(engine.view);
  return () => { listeners = listeners.filter(f => f !== fn); };
}

function raw(){
  if (!engine.client) return null;
  /* local 은 store 가 진짜 상태, online 은 서버가 이미 가려서 보내준다 */
  return engine.mode === "local" ? engine.client.store.getState() : engine.client.getState();
}

function push(){
  const st = raw();
  if (!st) return;
  engine.view = screenView(st.G, st.ctx, engine.myID, engine.names);
  /* 실제로 둔 수를 그대로 적어 둔다 — **검사가 정답으로 삼을 유일한 기록**.
     이것이 없으면 "눌렀는데 패스가 됐나"를 손패 장수 따위로 짐작해야 하고,
     눌러도 안 된 경우를 "소리가 빠졌다" 로 잘못 세게 된다 */
  const v = engine.view;
  /* 최근 몇 수를 다 실어 보내 주면 그것을 쓴다 — 뭉쳐 온 신호도 빠짐없이 적힌다.
     마지막 하나만 적으면 검사의 정답지 자체에 구멍이 생긴다 */
  const ms = (v && v.recent && v.recent.length) ? v.recent
    : (v && v.moveNo && v.lastMove ? [{ no: v.moveNo, k: v.lastMove.k, by: v.lastMove.by }] : []);
  ms.forEach(m => {
    if (!m || m.no <= engine.lastLogged) return;
    engine.lastLogged = m.no;
    engine.moveLog.push({ no: m.no, k: m.k, by: m.by });
  });
  if (engine.moveLog.length > 400) engine.moveLog.splice(0, 200);
  drainEmotes();
  listeners.forEach(f => { try { f(engine.view); } catch(e){ console.error(e); } });
  /* 다음 수를 예약한다.
     **서버 대전에서도 해야 한다.** 예전에는 이 기기 판일 때만 했는데,
     그러면 자동치기를 켜도 화면이 새로 올 때마다 다시 잡아 주는 사람이 없어
     내 차례가 와도 아무도 안 둔다. 15초가 지나 시간 넘김으로 패스만 되니
     "자동을 켰는데 패스만 한다" 로 보였다.
     서버 대전에서 `engine.bots` 는 비어 있으므로, 여기서 두는 자리는
     **자동치기를 켠 내 자리뿐**이다 (actsFor 참고) */
  if (engine.mode === "local" || engine.auto) scheduleBot();
}

/* ---------- 감정표현 ----------

   판 상태가 아니라 boardgame.io 의 쪽지 통로로 보낸다.
   판에 넣으면 자기 차례가 아닌 사람은 아예 못 보낸다 (moves 는 차례인 사람만 부를 수 있다).
   쪽지 통로는 서버가 그냥 흘려보내 주므로 게임 서버 코드를 새로 짤 것이 없다.
   이 기기 방(local)은 통로가 없으니 내가 보낸 것을 그대로 되돌려 준다 */

let emoteSeen = 0;
const emoteFns = [];

export function onEmote(fn){
  emoteFns.push(fn);
  return () => { const i = emoteFns.indexOf(fn); if (i >= 0) emoteFns.splice(i, 1); };
}

function fireEmote(seat, k){
  const n = (engine.view && engine.view.N) || 0;
  if (!n) return;
  const pos = toScreenSeat(seat);
  emoteFns.forEach(f => { try { f({ pos, seat, k }); } catch(e){ console.error(e); } });
}

/* 엔진 자리 → 화면 자리. view 가 이미 그 짝을 들고 있다 */
function toScreenSeat(seat){
  const v = engine.view;
  if (!v || !v.seats) return 0;
  const i = v.seats.findIndex(x => x.seat === Number(seat));
  return i < 0 ? 0 : i;
}

function drainEmotes(){
  const c = engine.client;
  const list = (c && c.chatMessages) || [];
  for (; emoteSeen < list.length; emoteSeen++){
    const m = list[emoteSeen];
    const p = m && m.payload;
    if (!p || p.t !== "emote") continue;
    fireEmote(m.sender, p.k);
  }
}

export function sendEmote(k){
  const c = engine.client;
  if (!c) return;
  if (engine.mode === "local"){
    /* 통로가 없다. 곧바로 내 자리에 띄운다 */
    fireEmote(Number(engine.myID), k);
    return;
  }
  c.sendChatMessage({ t: "emote", k });
}

/* ---------- 봇 (local 전용) ---------- */

/* 약한 카드부터 털되 조합은 깨지 않는다 */
function botPick(hand, pile){
  const cnt = {}; let jok = 0;
  hand.forEach(c => { if (isJoker(c)) jok++; else cnt[c] = (cnt[c] || 0) + 1; });
  const opts = [];
  const maxN = pile ? pile.num - 1 : 12;
  for (let num = 1; num <= maxN; num++){
    const same = cnt[num] || 0;
    if (!same) continue;
    if (pile){
      const need = pile.count - same;
      if (need > jok) continue;
      opts.push({ num, count: pile.count, useJok: Math.max(0, need), own: same });
    } else opts.push({ num, count: same, useJok: 0, own: same });
  }
  if (!opts.length) return (!pile && jok > 0) ? { num: 13, count: 1 } : null;
  opts.forEach(o => {
    let s = o.num * 2;
    s -= o.useJok * 10;
    if (pile && o.own > o.count) s -= 24;
    o.s = s;
  });
  opts.sort((a, b) => b.s - a.s);
  if (opts.length > 1 && Math.random() < 0.1) return opts[1];
  return opts[0];
}

const worstFirst = (a, b) => (isJoker(b) ? 99 : b) - (isJoker(a) ? 99 : a);

/* 봇 차례면 잠시 뒤에 둔다. 사람 차례면 아무것도 안 한다 */
/* 이 자리를 내가 대신 둬 주는가 — 봇이거나, 자동치기를 켠 내 자리 */
const actsFor = seat =>
  engine.bots.includes(seat) || (engine.auto && seat === Number(engine.myID));

function scheduleBot(){
  if (botTimer) return;
  const st = raw();
  if (!st || st.ctx.gameover) return;

  const G = st.G, ctx = st.ctx;

  /* 뽑기: 봇이 아직 안 고른 자리 하나를 무작위로 집는다 */
  if (ctx.phase === "draw"){
    const d = G.draw;
    if (!d) return;
    const todo = d.took.map((x, seat) => (x == null && actsFor(seat) ? seat : -1))
                       .filter(x => x >= 0);
    if (!todo.length) return;
    const g = ++gen;
    botTimer = setTimeout(() => {
      botTimer = null;
      if (g !== gen) return;
      const s2 = raw(); if (!s2 || s2.ctx.phase !== "draw"){ push(); return; }
      const d2 = s2.G.draw;
      const seat = todo[0];
      if (d2.took[seat] != null){ push(); return; }
      const free = d2.by.map((v, i) => (v == null ? i : -1)).filter(i => i >= 0);
      if (!free.length) return;
      engine.client.updatePlayerID(String(seat));
      engine.client.moves.takeCard(free[Math.floor(Math.random() * free.length)]);
      engine.client.updatePlayerID(engine.myID);
      push();
    }, Math.min(engine.botMs, 800));   /* 뽑기는 기다릴 것이 없다. 너무 느리면 답답하다 */
    return;
  }

  if (ctx.phase === "tax"){
    /* 혁명을 쥔 사람이 봇이면 대신 선언해 준다.
       내 자리면 화면이 정할 때까지 기다린다 — 쥐고도 안 부르는 것이 전략이므로 */
    const revSeat = G.revolution && !G.revDecided ? G.revolution.seat : -1;
    const revTodo = revSeat >= 0 && actsFor(revSeat);
    const o = G.taxOrder;
    const canGive = G.revDecided && !G.taxCancelled && G.taxOn;
    const todo = canGive
      ? [o[0], o[1]].filter(seat => actsFor(seat) && G.given[seat] === undefined)
      : [];
    if (!revTodo && !todo.length) return;
    const g = ++gen;
    botTimer = setTimeout(() => {
      botTimer = null;
      if (g !== gen) return;
      const s2 = raw(); if (!s2 || s2.ctx.phase !== "tax") { push(); return; }
      if (revTodo && s2.G.revolution && !s2.G.revDecided){
        engine.client.updatePlayerID(String(s2.G.revolution.seat));
        engine.client.moves.declare();          /* 봇은 늘 이득을 택한다 */
      }
      const s3 = raw();
      if (s3 && s3.ctx.phase === "tax" && s3.G.revDecided && !s3.G.taxCancelled && s3.G.taxOn){
        for (const seat of [s3.G.taxOrder[0], s3.G.taxOrder[1]]){
          if (!actsFor(seat) || s3.G.given[seat] !== undefined) continue;
          const hand = (s3.G.hands[seat] || []).slice().sort(worstFirst);
          const need = seat === s3.G.taxOrder[0] ? 2 : 1;
          if (hand.length < need) continue;
          engine.client.updatePlayerID(String(seat));
          engine.client.moves.give(hand.slice(0, need));
        }
      }
      engine.client.updatePlayerID(engine.myID);
      push();
    }, 700);
    return;
  }

  /* 판 결과·세금 화면을 보고 있는 동안 다음 판이 저 혼자 굴러가면 안 된다.
     다만 **세금 단계 자체는 멈추지 않는다** — 봇이 세금을 내야 다음으로 넘어간다.
     멈추는 것은 카드를 내는 단계뿐이다.
     이걸 안 나눠서, 세금 화면을 보는 동안 봇들이 이미 카드를 다 내버렸다 */
  if (engine.paused && ctx.phase !== "tax") return;

  const seat = Number(ctx.currentPlayer);
  if (!actsFor(seat)) return;

  const g = ++gen;
  botTimer = setTimeout(() => {
    botTimer = null;
    if (g !== gen) return;
    const s2 = raw();
    if (!s2 || s2.ctx.gameover || s2.ctx.phase !== "play") { push(); return; }
    const now = Number(s2.ctx.currentPlayer);
    if (!actsFor(now)) { push(); return; }
    const mv = botPick(s2.G.hands[now] || [], s2.G.pile);
    engine.client.updatePlayerID(String(now));
    if (mv) engine.client.moves.play(mv.num, mv.count);
    else    engine.client.moves.pass();
    engine.client.updatePlayerID(engine.myID);
    push();
  }, engine.botMs);
}

/* 자동치기를 켜면 내 자리도 봇과 같은 판단으로 둔다.
   판단 로직이 한 벌뿐이라, 자동으로 두는 수와 봇이 두는 수가 항상 같다 */
export function setAuto(on){
  engine.auto = Boolean(on);
  /* 예약돼 있던 것을 걷어내고 지금 차례 기준으로 다시 잡는다.
     끌 때 그냥 취소만 하면 봇 차례였을 경우 아무도 안 두고 멈춘다 */
  gen++;
  if (botTimer){ clearTimeout(botTimer); botTimer = null; }
  scheduleBot();
}

/* ---------- 시작 / 끝 ---------- */

/* 검사용 손잡이. 진짜 브라우저에서 엔진 상태를 들여다볼 수 있어야
   "화면과 엔진이 어긋났다" 를 잡을 수 있다 */
if (typeof window !== "undefined") window.__eng = engine;

function attach(client){
  engine.client = client;
  client.start();
  if (unsub) unsub();
  unsub = client.subscribe(() => push());
  push();
}

/* 서버 없이 이 기기 안에서. bots 는 엔진 자리 번호 목록 */
export function startLocal({ numPlayers = 6, opts = {}, names = [], myID = "0", bots = null } = {}){
  stop();
  engine.mode = "local";
  engine.myID = String(myID);
  engine.names = names.length ? names : new Array(numPlayers).fill("");
  engine.bots = bots || Array.from({ length: numPlayers }, (_, i) => i).filter(i => i !== Number(myID));
  /* Client 는 setupData 를 받지 않는다. 방 설정을 setup 에 미리 넣어 둔다 */
  const game = Object.assign({}, ZooPresident, {
    setup: (ctx) => ZooPresident.setup(ctx, opts),
  });
  attach(Client({ game, numPlayers, playerID: engine.myID }));
}

/* 게임 서버에 붙는다 */
export function startOnline({ server, matchID, playerID, credentials, numPlayers, names = [] }){
  stop();
  engine.mode = "online";
  engine.myID = String(playerID);
  engine.names = names.length ? names : new Array(numPlayers).fill("");
  engine.bots = [];
  attach(Client({
    game: ZooPresident, numPlayers, matchID,
    playerID: engine.myID, credentials,
    multiplayer: SocketIO({ server }),
    debug: false,                          /* boardgame.io 의 개발용 패널을 띄우지 않는다 */
  }));
}

/* 결과 화면을 보는 동안 다음 판을 멈춰 둔다 */
export function setPaused(on){
  engine.paused = Boolean(on);
  if (engine.paused){
    /* 이미 예약돼 있던 수까지 걷어내야 한다.
       안 그러면 멈추라고 한 뒤에도 한 수가 더 나간다 */
    gen++;
    if (botTimer){ clearTimeout(botTimer); botTimer = null; }
    return;
  }
  scheduleBot();
}

export function stop(){
  gen++;
  if (botTimer){ clearTimeout(botTimer); botTimer = null; }
  if (unsub){ unsub(); unsub = null; }
  if (engine.client){ try { engine.client.stop(); } catch(e){} }
  engine.client = null;
  engine.view = null;
  emoteSeen = 0;      /* 새 판에서 옛 쪽지를 다시 읽지 않게 */
}

/* ---------- 내 수 ---------- */
/* 자리 번호를 붙이지 않는다. 엔진이 내가 누구인지 안다 */

/* 뽑기에서 카드 한 장을 가져간다 */
export function takeCard(idx){
  const c = engine.client;
  if (!c) return;
  c.updatePlayerID(engine.myID);
  c.moves.takeCard(idx);
}

/* 남은 자리를 한꺼번에 뽑아 버린다. 검사에서 판부터 보고 싶을 때 쓴다 */
export function autoDraw(){
  const c = engine.client;
  const st = raw();
  if (!c || !st || st.ctx.phase !== "draw") return;
  const d = st.G.draw;
  if (!d) return;
  for (let seat = 0; seat < d.took.length; seat++){
    const s2 = raw();
    if (!s2 || s2.ctx.phase !== "draw") break;
    if (s2.G.draw.took[seat] != null) continue;
    const free = s2.G.draw.by.map((v, i) => (v == null ? i : -1)).filter(i => i >= 0);
    if (!free.length) break;
    c.updatePlayerID(String(seat));
    c.moves.takeCard(free[Math.floor(Math.random() * free.length)]);
  }
  c.updatePlayerID(engine.myID);
  push();
}

export function play(num, count){
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.play(num, count);
  return true;
}
export function passTurn(){
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.pass();
  return true;
}
/* 혁명 선언 / 안 하고 넘기기 */
export function declareRev(){
  if (!engine.client) return;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.declare();
  push();
}
export function passRev(){
  if (!engine.client) return;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.passRev();
  push();
}

export function give(cards){
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.give(cards);
  return true;
}
