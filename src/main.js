import "./state.js";
import { initNav, OPT_HTML, CFG_HTML, GEAR } from "./nav.js";
import { MARKUP } from "./screens/_markup.js";
import { watchAuth, signInGoogle, signInTest, isLocal, account, finishGame, useTicket, ticketLeft } from "./lib/account.js";
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

watchAuth().then(() => {
  window.dispatchEvent(new Event("accountready"));
  /* 판은 이 기기 안에서 도므로 새로고침하면 처음부터다.
     서버 대전을 붙이면 그때 방 복귀를 다시 넣는다 */
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

/* ---------- 대전 연결 (엔진) ---------- */
/* 게임 진행은 전부 lib/engine.js 가 맡는다. 여기는 방을 세우고 화면을 넘길 뿐이다.
   자리 번호를 돌리는 코드는 이 파일에 한 줄도 없다. view.js 가 혼자 한다. */

import { app } from "./lib/firebase.js";
import * as eng from "./lib/engine.js";
import { createRoom, addBot as addBotTo, setCap, toRoomView, seatCount } from "./lib/localroom.js";

/* 이 기기 안의 방. 자리 0번은 언제나 나 */
let myRoom = null;
function emitRoom(){
  window.__room = toRoomView(myRoom);
  window.dispatchEvent(new Event("roomchange"));
}

function myName(){
  return (account && account.name) || (window.__opts && window.__opts.myName) || "나";
}

/* 방 만들기 — 지금은 이 기기 안에서만. 서버 대전은 다음 단계 */
window.__createRoom = async () => {
  const o = window.__opts || {};
  myRoom = createRoom({ cap: o.cap || 6, name: myName() });
  window.__opts = Object.assign(window.__opts || {}, { cap: myRoom.cap, seated: 1 });
  emitRoom();
  botFillStart();                       /* 사람이 없으니 봇이 한 명씩 들어온다 */
  return "LOCAL";
};

window.__joinRoom = async () => {
  alert("서버 대전은 아직 준비 중입니다. 봇과 하기로 시작해 주세요.");
  return null;
};
window.__peek = async () => null;
window.__roomCode = () => (myRoom ? "LOCAL" : null);
window.__leaveRoom = () => { botFillStop(); eng.stop(); myRoom = null; emitRoom(); };

window.__saveOpts = async () => {
  if (!myRoom) return;
  setCap(myRoom, (window.__opts || {}).cap);
  window.__opts.cap = myRoom.cap;
  window.__opts.seated = seatCount(myRoom);
  emitRoom();
};

/* 봇 채우기 — 빈자리에 한 명씩 */
let botTimer = null;
function addBot(){
  if (!addBotTo(myRoom)) return false;
  window.__opts.seated = seatCount(myRoom);
  emitRoom();
  return true;
}
function botFillStart(){
  if (botTimer) return;
  botTimer = setInterval(() => { if (!addBot()) botFillStop(); }, 2500);
}
function botFillStop(){ if (botTimer){ clearInterval(botTimer); botTimer = null; } }
window.__botFill = on => (on ? botFillStart() : botFillStop());
window.__addBot = addBot;

/* 시작 */
window.__startRound = async () => {
  if (!myRoom) throw new Error("방이 없습니다");
  botFillStop();
  while (seatCount(myRoom) < 4) if (!addBot()) break;
  const n = seatCount(myRoom);
  if (n < 4) throw new Error("4명이 모여야 시작합니다 (지금 " + n + "명)");

  myRoom.phase = "playing";
  emitRoom();

  const o = window.__opts || {};
  eng.startLocal({
    numPlayers: n,
    myID: "0",
    names: myRoom.seats.map(s => s.name),
    opts: { rounds: o.rounds || 3, tax: o.tax !== false, clear2: Boolean(o.clear2) },
  });

  const v = eng.engine.view;
  if (!v) throw new Error("판을 세우지 못했습니다");

  /* 화면이 쓰는 값. 이름·점수는 이미 내 자리 기준으로 돌아온 것들이다 */
  window.__net = { engine: true };            /* 뽑기 화면이 선을 엔진에서 받게 한다 */
  window.GAME = {
    N: n,
    roundNo: v.roundNo,
    names: v.names.slice(),
    namesEn: v.names.slice(),
    hold: null, order: null, finish: null,
    score: v.score.slice(),
    mySeat: 0,
  };
  window.__opts = Object.assign(window.__opts || {}, { seated: n });
  window.__leadSeat = v.turn >= 0 ? v.turn : 0;
  window.GAME.order = Array.from({ length: n }, (_, k) => (window.__leadSeat + k) % n);
  window.__roundNo = v.roundNo;
  window.__myRankIdx = null;
  window.__scored = null;

  window.__goto && window.__goto("draw");
};

/* 세금 — 화면이 고른 카드를 엔진에 그대로 넘긴다 */
window.__setTaxGive = cards => {
  window.__taxGive = cards;
  if (Array.isArray(cards) && cards.length) eng.give(cards);
};

/* 판이 끝났을 때 화면이 부른다. 엔진이 알아서 다음 판을 세우므로 할 일이 없다 */
window.__endRoundOnline = async () => {};

/* 세금 단계에 들어가면 화면을 넘긴다 */
window.__onTax = v => {
  window.__myRankIdx = v.taxGive > 0 ? (v.taxGive === 2 ? 0 : 1) : null;
  window.__myGive = v.taxGive;
  if (v.taxGive > 0 && window.__goto) window.__goto("tax");
};

/* 게임이 끝나면 결과로 */
window.__onGameOver = () => { window.__goto && window.__goto("result"); };
