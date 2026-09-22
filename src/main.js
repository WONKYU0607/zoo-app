import "./state.js";
import { initNav, OPT_HTML, CFG_HTML, ACCT_HTML, ASK_HTML, FRIEND_HTML, GEAR, CROWN } from "./nav.js";
import { MARKUP } from "./screens/_markup.js";
import { db } from "./lib/firebase.js";
import * as FR from "./lib/friends.js";
import { initFriends } from "./lib/friends.js";
import { watchAuth, signInGoogle, signInGuest, linkGoogle, switchToGoogle, signOutNow, setNickname, signInTest, isLocal, account, pending, finishGame, useTicket, ticketLeft, setAvatar, rewardTicket, TICKET_MAX } from "./lib/account.js";
import { showRewardAd } from "./lib/ads.js";
import { BAR_SWAP } from "./lib/bar.js";

import * as entry  from "./screens/entry.js";
import * as lobby  from "./screens/lobby.js";
import * as room   from "./screens/room.js";
import * as draw   from "./screens/draw.js";
import * as table  from "./screens/table.js";
import * as tax    from "./screens/tax.js";
import * as result from "./screens/result.js";
import * as rank   from "./screens/rank.js";

const SCREENS = { entry, lobby, room, draw, table, tax, result, rank };

/* 화면마다 상단에 붙일 것 (뒤로 가기 / 설정 버튼) */
const BAR = {
  lobby:  { back: "entry" },
  room:   { back: "lobby" },
  rank:   { back: "lobby" },
  draw:   { back: "room" },
  tax:    { back: null },
  result: { back: null },
  table:  { back: null },
};

function build(){
  const stageEl = document.getElementById("stage");
  Object.keys(SCREENS).forEach(id => {
    let sec = document.getElementById(id);
    /* 화면 자리가 없으면 만들어 둔다. index.html 에 빠져도 앱이 통째로 죽지 않게 */
    if (!sec && stageEl){
      sec = document.createElement("section");
      sec.className = "page";
      sec.id = id;
      stageEl.appendChild(sec);
    }
    if (!sec) return;
    let html = MARKUP[id] || "";        /* 화면이 자기 뼈대를 직접 그리는 경우도 있다 */
    const sw = BAR_SWAP[id];
    if (sw && html) html = html.replace(sw[0], sw[1]);   /* 상단바에 뒤로/판 종료 붙이기 */
    if (html) sec.innerHTML = html;
    /* 언어 토글 자리를 설정 버튼으로 */
    sec.querySelectorAll('.lang, .view#lang').forEach(el => {
      if (el.id !== "lang") return;
      /* 설정 단추는 **로비 것으로 통일**한다. 화면마다 모양이 달랐다 */
      const b = document.createElement("button");
      b.className = "cfgbtn";
      b.setAttribute("data-cfgopen", "");
      b.setAttribute("aria-label", "settings");
      el.replaceWith(b);
    });
    /* 로비 상단바 바로 아래에 랭킹 단추. 글자를 같이 넣는다 */
    if (id === "lobby"){
      const bar = sec.querySelector(".bar");
      if (bar && !sec.querySelector("[data-rankopen]")){
        const wrap = document.createElement("div");
        wrap.className = "rankbar";
        /* 왼쪽 끝(프로필 밑)에 광고 시청 티켓, 오른쪽에 랭킹 · 친구 · 소리 */
        wrap.innerHTML =
          '<button class="bt-rank bt-ad" id="btAd">' +
          '<span id="adLabel">광고 시청 티켓</span></button>' +
          '<button class="bt-rank" data-rankopen>' +
          '<span id="rankLabel">랭킹</span></button>' +
          '<button class="bt-rank bt-friend" data-friendopen>' +
          '<span id="friendLabel">친구</span></button>' +
          '<button class="bt-mute" id="btMute" aria-pressed="true" aria-label="소리 끄기">' +
          '<i class="bt-mute__on"></i><i class="bt-mute__off"></i></button>';
        bar.parentNode.insertBefore(wrap, bar.nextSibling);
      }
    }
  });
  stageEl.insertAdjacentHTML("beforeend", OPT_HTML + CFG_HTML + ACCT_HTML + ASK_HTML + FRIEND_HTML);
}

build();
Object.entries(SCREENS).forEach(([id, mod]) => {
  if (mod.mount) mod.mount(document.getElementById(id));
});
initNav();

/* 로그인 벽 — 구글로 로그인해야 들어간다 */
window.ACCOUNT = account;
/* 친구 — 계정과 같은 데이터베이스를 쓴다 */
initFriends(db, account);
window.__friends = FR;
/* 얼굴 고르기 — 화면(nav)이 부른다 */
window.__setAvatar = i => setAvatar(i);

/* ---------- 광고 시청 티켓 ----------
   누르면 보상형 광고를 띄우고, **끝까지 보면** 티켓 1장. 횟수 제한 없음.
   보유 3장이면 단추를 잠근다(더 받을 수 없으니). 광고 보는 동안에도 잠근다 —
   두 번 눌러 광고가 겹치면 안 된다 */
let adBusy = false;
function paintAd(){
  const b = document.getElementById("btAd");
  if (!b) return;
  const full = (Number(account.tickets) || 0) >= TICKET_MAX;
  b.disabled = adBusy || full;
}
async function watchAd(){
  if (adBusy || (Number(account.tickets) || 0) >= TICKET_MAX) return;
  adBusy = true; paintAd();
  try {
    const r = await showRewardAd();
    if (r && r.ok) await (window.__rewardTicket || rewardTicket)();
  } catch (e){
    console.warn("[광고] " + (e && e.message || e));
  } finally {
    adBusy = false; paintAd();
  }
}
document.addEventListener("click", e => { if (e.target.closest("#btAd")) watchAd(); });
window.addEventListener("accountchange", paintAd);
paintAd();
window.__watchAd = watchAd;           /* 검사용 */
window.signInGoogle = signInGoogle;
window.signInTest = signInTest;
window.signInGuest = signInGuest;
window.linkGoogle = linkGoogle;
window.switchToGoogle = switchToGoogle;
window.signOutNow = signOutNow;
window.setNickname = setNickname;
window.__isLocal = isLocal;

watchAuth().then(() => {
  window.dispatchEvent(new Event("accountready"));
  /* 구글로 처음 들어왔으면 별명부터 정한다 */
  if (account.needName && window.__askName) window.__askName();
  /* 팝업이 막혀 주소 이동으로 다녀온 경우의 뒤처리 */
  if (pending.conflict){
    pending.conflict = false;
    /* 설정 창을 열어 거기서 고르게 한다 (팝업 직후의 confirm 은 막힌다) */
    if (window.__goto) window.__goto("lobby");
    const cfg = document.getElementById("cfg");
    if (cfg) cfg.classList.add("on");
    if (window.__showLinkConflict) window.__showLinkConflict();
  } else if (pending.error){
    const code = pending.error; pending.error = "";
    console.warn("구글 잇기 실패:", code);
  }
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
/* 흐름은 lib/flow.js 가 다 갖고 있다. 여기서는 설치만 한다.
   그래야 검사에서 flow.js 를 그대로 돌려볼 수 있다. */

import { install as installFlow } from "./lib/flow.js";

installFlow({
  goto: id => window.__goto && window.__goto(id),
  myName: () => (account && account.name) || "나",
});
