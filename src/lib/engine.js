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
  botMs: 1400,         /* 봇이 생각하는 척하는 시간 */
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
  listeners.forEach(f => { try { f(engine.view); } catch(e){ console.error(e); } });
  if (engine.mode === "local") scheduleBot();
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
function scheduleBot(){
  if (botTimer) return;
  const st = raw();
  if (!st || st.ctx.gameover) return;

  const G = st.G, ctx = st.ctx;

  if (ctx.phase === "tax"){
    const o = G.taxOrder;
    const todo = [o[0], o[1]].filter(seat =>
      engine.bots.includes(seat) && G.given[seat] === undefined);
    if (!todo.length) return;
    const g = ++gen;
    botTimer = setTimeout(() => {
      botTimer = null;
      if (g !== gen) return;
      const s2 = raw(); if (!s2 || s2.ctx.phase !== "tax") { push(); return; }
      for (const seat of todo){
        const hand = (s2.G.hands[seat] || []).slice().sort(worstFirst);
        const need = seat === s2.G.taxOrder[0] ? 2 : 1;
        if (hand.length < need) continue;
        engine.client.updatePlayerID(String(seat));
        engine.client.moves.give(hand.slice(0, need));
      }
      engine.client.updatePlayerID(engine.myID);
      push();
    }, 700);
    return;
  }

  /* 판 결과를 보고 있는 동안에는 다음 판이 저 혼자 굴러가면 안 된다.
     세금은 멈추지 않는다 — 봇이 내야 다음으로 넘어간다 */
  if (engine.paused) return;

  const seat = Number(ctx.currentPlayer);
  if (!engine.bots.includes(seat)) return;

  const g = ++gen;
  botTimer = setTimeout(() => {
    botTimer = null;
    if (g !== gen) return;
    const s2 = raw();
    if (!s2 || s2.ctx.gameover || s2.ctx.phase !== "play") { push(); return; }
    const now = Number(s2.ctx.currentPlayer);
    if (!engine.bots.includes(now)) { push(); return; }
    const mv = botPick(s2.G.hands[now] || [], s2.G.pile);
    engine.client.updatePlayerID(String(now));
    if (mv) engine.client.moves.play(mv.num, mv.count);
    else    engine.client.moves.pass();
    engine.client.updatePlayerID(engine.myID);
    push();
  }, engine.botMs);
}

/* ---------- 시작 / 끝 ---------- */

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
  }));
}

/* 결과 화면을 보는 동안 다음 판을 멈춰 둔다 */
export function setPaused(on){
  engine.paused = Boolean(on);
  if (!engine.paused) scheduleBot();
}

export function stop(){
  gen++;
  if (botTimer){ clearTimeout(botTimer); botTimer = null; }
  if (unsub){ unsub(); unsub = null; }
  if (engine.client){ try { engine.client.stop(); } catch(e){} }
  engine.client = null;
  engine.view = null;
}

/* ---------- 내 수 ---------- */
/* 자리 번호를 붙이지 않는다. 엔진이 내가 누구인지 안다 */

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
export function give(cards){
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.give(cards);
  return true;
}
