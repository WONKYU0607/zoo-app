import "./state.js";
import { initNav, OPT_HTML, CFG_HTML, GEAR } from "./nav.js";
import { MARKUP } from "./screens/_markup.js";
import { watchAuth, signInGoogle, account, finishGame, useTicket } from "./lib/account.js";
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
