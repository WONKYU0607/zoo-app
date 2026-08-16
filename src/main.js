import "./state.js";
import { initNav, OPT_HTML, CFG_HTML, GEAR } from "./nav.js";
import { MARKUP } from "./screens/_markup.js";
import { watchAuth, signInGoogle, signInTest, isLocal, account, finishGame, useTicket, ticketLeft } from "./lib/account.js";
import * as net from "./lib/online.js";
import { BAR_SWAP } from "./lib/bar.js";

import * as entry  from "./screens/entry.js";
import * as lobby  from "./screens/lobby.js";
import * as room   from "./screens/room.js";
import * as draw   from "./screens/draw.js";
import * as table  from "./screens/table.js";
import * as tax    from "./screens/tax.js";
import * as result from "./screens/result.js";

const SCREENS = { entry, lobby, room, draw, table, tax, result };

/* 화면마다 상단에 붙일 것 (뒤로 가기 / 설정 버튼) */
const BAR = {
  lobby:  { back: "entry" },
  room:   { back: "lobby" },
  draw:   { back: "room" },
  tax:    { back: null },
  result: { back: null },
  table:  { back: null },
};

function build(){
  Object.keys(SCREENS).forEach(id => {
    const sec = document.getElementById(id);
    let html = MARKUP[id];
    const sw = BAR_SWAP[id];
    if (sw) html = html.replace(sw[0], sw[1]);   /* 상단바에 뒤로/판 종료 붙이기 */
    sec.innerHTML = html;
    /* 언어 토글 자리를 설정 버튼으로 */
    sec.querySelectorAll('.lang, .view#lang').forEach(el => {
      if (el.id !== "lang") return;
      const b = document.createElement("button");
      b.className = "cfgbtn";
      b.setAttribute("data-cfgopen", "");
      b.setAttribute("aria-label", "settings");
      b.innerHTML = GEAR;
      el.replaceWith(b);
    });
  });
  const stage = document.getElementById("stage");
  stage.insertAdjacentHTML("beforeend", OPT_HTML + CFG_HTML);
}

build();
Object.entries(SCREENS).forEach(([id, mod]) => {
  if (mod.mount) mod.mount(document.getElementById(id));
});
initNav();

/* 로그인 벽 — 구글로 로그인해야 들어간다 */
window.ACCOUNT = account;
window.signInGoogle = signInGoogle;
window.signInTest = signInTest;
window.__isLocal = isLocal;

watchAuth().then(async () => {
  window.dispatchEvent(new Event("accountready"));
  /* 새로고침했으면 있던 방으로 돌아간다 */
  if (account.signedIn && app){
    try {
      net.initOnline(app); netReady = true;
      const back = await net.rejoin();
      if (back){
        net.online.onRoom = pushRoom;
        pushRoom(net.online.room);
        window.__goto && window.__goto("room");
      }
    } catch(e){ console.warn("방 복귀 실패", e); }
  }
});

/* 게임이 끝났을 때 계정에 점수를 올린다.
   earned 는 게임 안에서 쌓은 누적 점수, quit 는 완주 실패 여부 */
window.reportGame = (rank, players, earned, quit) => {
  finishGame(rank, players, earned, quit)
    .then(g => { if (g) console.log("획득", g); })
    .catch(err => console.warn("점수 반영 실패", err));
};

/* 티켓 한 장. 없으면 false */
window.spendTicket = () => useTicket();
window.__ticketLeft = () => ticketLeft();

/* ---------- 온라인 대전 연결 ---------- */
import { app } from "./lib/firebase.js";

let netReady = false;
function ensureNet(){
  if (netReady) return true;
  if (!app){ alert("서버 설정이 없습니다 (.env 확인)"); return false; }
  if (!account.signedIn){ alert("로그인이 필요합니다"); return false; }
  net.initOnline(app);
  netReady = true;
  return true;
}

/* 방 상태가 바뀌면 화면에 알린다 */
function pushRoom(room){
  if (!room) { window.__room = null; botFillStop(); return; }
  watchPhase(room);
  if (room.phase === "waiting" && room.host === account.uid) botFillStart();
  else botFillStop();
  if (room.phase === "playing"){ watchBotTurn(room); botWatchStart(); }
  else botWatchStop();
  watchLeavers(room);
  const cap = (room.opts && room.opts.cap) || 6;
  window.__room = {
    cap: cap,
    me: net.online.seat,
    host: room.host,
    phase: room.phase,
    round: room.round || null,
    seats: net.seatArray(room, cap),        /* 항상 배열로 */
  };
  window.__opts = Object.assign(window.__opts || {}, room.opts || {});
  window.dispatchEvent(new Event("roomchange"));
}

async function guard(fn, label){
  try { return await fn(); }
  catch (e){
    console.error(label, e);
    alert(label + " : " + (e && (e.code || e.message) || e));
    return null;
  }
}

/* 방 만들기 — 설정 창에서 확인을 누르면 실제 방을 만든다 */
window.__createRoom = async () => {
  if (!ensureNet()) return null;
  const code = await guard(() => net.createRoom(window.__opts), "방을 만들지 못했습니다");
  if (!code) return null;
  net.online.onRoom = pushRoom;
  pushRoom(net.online.room);
  return code;
};

/* 번호로 들어가기 */
window.__joinRoom = async code => {
  if (!ensureNet()) return null;
  const seat = await guard(() => net.joinRoom(String(code)), "들어갈 수 없습니다");
  if (seat == null) return null;
  net.online.onRoom = pushRoom;
  pushRoom(net.online.room);
  return seat;
};

window.__leaveRoom = () => { try { net.leaveRoom(); } catch(e){} window.__room = null; };
window.__roomCode = () => net.online.code;
window.__peek = code => { ensureNet(); return net.peek(code); };

/* 방장이 방 조건을 바꾸면 서버에 쓴다. 안 그러면 나만 바뀌고 남은 모른다 */
window.__saveOpts = async () => {
  const R = net.online.room;
  if (!R || R.host !== account.uid) return;
  const o = window.__opts || {};
  try { await net.saveOpts(net.online.code, {
    cap: o.cap, rounds: o.rounds, tax: o.tax, clear2: o.clear2 }); }
  catch(e){ console.warn("설정 저장 실패", e); }
};

/* 세금에서 1등이 고른 두 장을 서버에 넘긴다 */
window.__setTaxGive = cards => { window.__taxGive = cards; };

/* 방장이 누르면 서버가 카드를 나눈다 */
/* 봇 채우기 — 방장 화면에서 7초마다 한 명씩 */
let botTimer = null;
function botFillStart(){
  if (botTimer) return;
  botTimer = setInterval(async () => {
    const R = net.online.room;
    if (!R || R.phase !== "waiting" || R.host !== account.uid){ botFillStop(); return; }
    try { await net.addBot(); } catch(e){ console.warn(e); }
  }, 5000);
}
function botFillStop(){ if (botTimer){ clearInterval(botTimer); botTimer = null; } }
window.__botFill = on => (on ? botFillStart() : botFillStop());

window.__startRound = async () => {
  const code = net.online.code;
  if (!code) throw new Error("방이 없습니다");
  botFillStop();                     /* 나누는 사이에 봇이 더 들어오면 인원이 흔들린다 */
  /* 버튼이 어떤 이유로든 눌렸을 때를 대비해 한 번 더 센다 */
  const n = net.seatCount(net.online.room);
  if (n < 4) throw new Error("4명이 모여야 시작합니다 (지금 " + n + "명)");
  await net.startRound(code);
};

/* 방 상태가 playing 으로 바뀌면 모두 함께 게임으로 들어간다 */
let lastPhase = null, lastRound = 0;
function watchPhase(room){
  if (!room) { lastPhase = null; lastRound = 0; return; }

  /* 게임이 끝났으면 결과로 */
  if (room.phase === "over" && lastPhase !== "over"){
    lastPhase = "over";
    window.GAME = window.GAME || {};
    window.GAME.score = room.score || [];
    window.GAME.finish = room.order || null;
    window.__goto && window.__goto("result");
    return;
  }

  const rn = room.roundNo || 1;
  const newRound = room.phase === "playing" && rn !== lastRound;
  if (room.phase === lastPhase && !newRound) return;
  lastPhase = room.phase;
  if (room.phase !== "playing") return;
  lastRound = rn;

  /* 서버가 적어 둔 순서를 그대로 쓴다. 자리 배열에 구멍이 있어도 어긋나지 않는다 */
  const capN = (room.opts && room.opts.cap) || 6;
  const all = net.seatArray(room, capN);
  const order = room.order || all.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
  const seats = order.map(i => all[i]).filter(Boolean);
  const me = Math.max(0, order.indexOf(net.online.seat));

  /* 게임 화면이 서버 값을 쓰도록 넘겨준다 */
  window.GAME = {
    N: seats.length,
    roundNo: room.roundNo || 1,
    names: seats.map(s => s.name || ""),
    namesEn: seats.map(s => s.name || ""),
    hold: null,
    order: null,
    finish: null,
    score: room.score || seats.map(() => 0),
    mySeat: me,
  };
  window.__opts = Object.assign(window.__opts || {}, room.opts || {}, { seated: seats.length });
  window.__net = {
    seat: me,
    /* 화면이 계산한 판 상태를 같이 보낸다.
       자리 번호는 내 기준으로 돌아가 있으므로 서버 기준으로 되돌린다 */
    send: (mv, st) => {
      const nn = seats.length;
      const back = v => ((v + me) % nn);
      let out = null;
      if (st){
        out = { turn: back(st.turn), trick: null };
        if (st.counts){ out.counts = new Array(nn);
          st.counts.forEach((c, i) => { out.counts[back(i)] = c; }); }
        if (st.passed){ out.passed = new Array(nn);
          st.passed.forEach((v, i) => { out.passed[back(i)] = v; }); }
        if (st.finish) out.finish = st.finish.map(back);
        if (st.trick) out.trick = { by: back(st.trick.by), num: st.trick.num, count: st.trick.count };
      }
      return net.playMove(mv, out);
    },
  };
  window.__room = window.__room || {};
  window.__room.round = room.round;

  /* 내 손패가 오면 화면에 넘긴다 */
  net.online.onHand = h => {
    window.__hand = h || [];
    window.dispatchEvent(new Event("handchange"));
  };
  window.__hand = net.online.hand || [];

  /* 남의 수가 들어오면 화면에 적용한다. 내 자리 기준으로 돌려서 넘긴다 */
  seenMove = 0;
  moveQueue.length = 0;
  if (drainId){ clearTimeout(drainId); drainId = null; }
  net.online.onMove = (seq, mv) => {
    if (seq <= seenMove) return;
    seenMove = seq;
    const a = String(mv).split(",");
    const from = (Number(a[0]) - me + seats.length) % seats.length;
    a[0] = String(from);
    moveQueue.push({ seq: seq, mv: a.join(","), mine: from === 0 });
    drainMoves();
  };

  /* 서버가 정한 선을 뽑기 화면이 연출로 보여준다 */
  const lead = room.round ? room.round.lead : 0;
  const n = seats.length;
  window.__leadSeat = ((lead - me + n) % n);        /* 내 자리 기준으로 돌린 선 */
  window.GAME.order = [];
  for (let i = 0; i < n; i++) window.GAME.order.push((window.__leadSeat + i) % n);

  watchBotTurn(room);
  window.__goto && window.__goto("draw");
}
let seenMove = 0;

/* 서버는 봇 차례를 한꺼번에 계산해서 수를 통째로 보낸다.
   그대로 다 적용하면 눈 깜짝할 새 지나가 게임 같지가 않다.
   하나씩 사이를 띄워서 적용한다. */
const moveQueue = [];
let drainId = null;
function drainMoves(){
  if (drainId) return;                       /* 이미 하나씩 내보내는 중 */
  const step = () => {
    const m = moveQueue.shift();
    if (!m){ drainId = null; return; }
    if (window.__applyMove) window.__applyMove(m.mv);
    /* 내 수는 이미 화면에 반영돼 있으니 기다리지 않는다 */
    drainId = setTimeout(step, m.mine ? 0 : 2000);
  };
  step();
}

/* 판이 끝나면 방장 기기가 서버에 정산을 맡긴다.
   결과(다음 판 카드, 등수, 혁명 여부)는 방 상태로 모두에게 온다. */
let settling = false;
window.__endRoundOnline = async finishOrder => {
  const R = net.online.room;
  if (!R) return;
  /* 판 결과를 방에 적어 둔다. 방장이 그걸 보고 정산한다 */
  try { await net.reportFinish(net.online.code, finishOrder); } catch(e){ console.warn(e); }
  if (R.host !== account.uid) return;              /* 방장만 정산 */
  if (settling) return;
  settling = true;
  try {
    const give = window.__taxGive || null;
    const res = await net.settleRound(net.online.code, give);
    window.__taxGive = null;
    if (res && res.data && res.data.over){
      window.__gameOver = res.data;
      window.__goto && window.__goto("result");
    }
  } catch(e){ console.warn("정산 실패", e); }
  finally { setTimeout(() => { settling = false; }, 500); }
};

/* 이탈 판정 — 1분 동안 안 돌아오면 나간 것으로 표시한다.
   방장 기기가 맡는다. 방장이 없으면 남은 사람 중 가장 앞자리가 맡는다. */
let leaveTimer = null;
function watchLeavers(room){
  if (leaveTimer){ clearInterval(leaveTimer); leaveTimer = null; }
  if (!room || !net.online.code) return;
  leaveTimer = setInterval(async () => {
    const R = net.online.room;
    if (!R) return;
    const seats = net.seatArray(R);
    const live = R.live || {};
    /* 이 일을 맡을 사람: 방장, 없으면 가장 앞자리 사람 */
    let keeper = R.host;
    const hostSeat = seats.find(s => s && s.uid === R.host && !s.left);
    if (!hostSeat){
      const first = seats.find(s => s && !s.bot && !s.left);
      keeper = first ? first.uid : null;
    }
    if (keeper !== account.uid) return;

    const now = Date.now();
    for (let i = 0; i < seats.length; i++){
      const s = seats[i];
      if (!s || s.bot || s.left) continue;
      if (s.uid === account.uid) continue;
      const seen = live[s.uid];
      if (seen === 0 || (typeof seen === "number" && now - seen > 60000)){
        try { await net.markOff(net.online.code, i); } catch(e){}
      }
    }
  }, 5000);
}

/* 봇 차례가 오면 서버에 다음 수를 맡긴다.
   방장 한 명만 부른다. 여럿이 부르면 같은 수가 두 번 적힌다. */
let botBusy = false, botTick = null;
function botWatchStart(){
  if (botTick) return;
  botTick = setInterval(() => {
    const R = net.online.room;
    if (!R || R.phase !== "playing"){ botWatchStop(); return; }
    watchBotTurn(R);
  }, 2500);
}
function botWatchStop(){ if (botTick){ clearInterval(botTick); botTick = null; } }

async function watchBotTurn(room){
  if (!room || room.phase !== "playing") return;
  if (room.host !== account.uid) return;          /* 방장만 */
  if (botBusy) return;
  const r = room.round;
  if (!r) return;
  /* r.turn 은 "몇 번째 차례"이고 자리 번호가 아니다.
     8명 방에 5명이 흩어져 앉으면 둘이 다르다. order 로 바꿔서 봐야 한다. */
  const capN = (room.opts && room.opts.cap) || 8;
  const seats = net.seatArray(room, capN);
  let ord = room.order;
  if (!Array.isArray(ord) || !ord.length){
    ord = seats.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
  }
  const at = ord[r.turn];
  const cur = (at == null) ? null : seats[at];
  if (!cur){ console.warn("봇 판정 실패 — 차례", r.turn, "자리표", ord); return; }
  if (!cur.bot) return;                            /* 사람 차례 */
  botBusy = true;
  console.log("봇 차례 → 서버에 맡김", cur.name, "(자리", at, ", 차례", r.turn, ")");
  try { await net.botMoves(net.online.code); }
  catch(e){ console.error("봇 수 실패", e && (e.code || e.message) || e); }
  finally { setTimeout(() => { botBusy = false; }, 400); }
}
