import "./state.js";
import { initNav, OPT_HTML, CFG_HTML, GEAR } from "./nav.js";
import { MARKUP } from "./screens/_markup.js";
import { watchAuth, signInGoogle, account, finishGame, useTicket } from "./lib/account.js";
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

watchAuth().then(() => {
  window.dispatchEvent(new Event("accountready"));
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

/* ---------- 온라인 대전 연결 ---------- */
import { app } from "./lib/firebase.js";

let netReady = false;
function ensureNet(){
  if (netReady || !app) return netReady;
  net.initOnline(app);
  netReady = true;
  return true;
}

/* 방 상태가 바뀌면 화면에 알린다 */
function pushRoom(room){
  if (!room) { window.__room = null; return; }
  window.__room = {
    cap: room.opts ? room.opts.cap : 6,
    me: net.online.seat,
    host: room.host,
    phase: room.phase,
    seats: room.seats || [],
  };
  window.__opts = Object.assign(window.__opts || {}, room.opts || {});
  window.dispatchEvent(new Event("roomchange"));
}

async function guard(fn, label){
  try { return await fn(); }
  catch (e){
    console.warn(label, e);
    alert(label + ": " + (e.message || e));
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
