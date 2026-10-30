import "./state.js";
import { initNav, OPT_HTML, CFG_HTML, ACCT_HTML, ASK_HTML, FRIEND_HTML, DOC_HTML, GEAR, CROWN, TAB_HTML } from "./nav.js";
import { checkUpdate } from "./lib/update.js";
import { installErrorLog } from "./lib/applog.js";
import { installAria } from "./lib/aria.js";
import { installPress } from "./lib/press.js";
import { MARKUP } from "./screens/_markup.js";
import { db } from "./lib/firebase.js";
import * as FR from "./lib/friends.js";
import { initFriends } from "./lib/friends.js";
import { watchAuth, signInGoogle, signInGuest, linkGoogle, switchToGoogle, signOutNow, deleteAccount, setNickname, signInTest, isLocal, account, pending, finishGame, hasTicket, ticketLeft, syncTickets, setAvatar, waitReward, refreshAccount, idToken, TICKET_MAX, adLeft, freeLeft, freeTicket } from "./lib/account.js";
import { restorePurchases } from "./lib/billing.js";
import { showRewardAd, preloadRewardAd, rewardReady, warmAds, adsAvailable } from "./lib/ads.js";
import { BAR_SWAP } from "./lib/bar.js";
import { AVATARS } from "./lib/assets.js";
import { MAIL_HTML, initMail } from "./screens/mail.js";      /* 우편함 (2026-10-29) */

import * as entry  from "./screens/entry.js";
import * as lobby  from "./screens/lobby.js";
import * as room   from "./screens/room.js";
import * as draw   from "./screens/draw.js";
import * as table  from "./screens/table.js";
import * as tax    from "./screens/tax.js";
import * as result from "./screens/result.js";
import * as rank   from "./screens/rank.js";
import * as shop   from "./screens/shop.js";
import { applySkin, bootSkin } from "./lib/skin.js";

/* 카드 뒷면·판 배경 — 지난번 것을 먼저 입히고, 계정을 읽으면 계정 것으로 (2026-10-26 상점) */
bootSkin();
window.addEventListener("accountchange", () => applySkin(account));
window.addEventListener("accountready", () => applySkin(account));

/* ---------- 상단바 아래 단추 글자 ----------
   예전에는 한국어로 박혀 있어서 **영어로 바꿔도 그대로였다**(랭킹·친구).
   광고 단추도 같은 모양으로 넣었다가 같이 고친다 */
const BAR_T = {
  ko: { ad: "광고 시청 티켓", free: "무료 티켓 받기", shop: "상점", rank: "랭킹", friend: "친구", mute: "소리 끄기", unmute: "소리 켜기",
        me: "프로필", home: "홈", cfg: "설정" },
  en: { ad: "Ad ticket", free: "Free ticket", shop: "Shop", rank: "Ranking", friend: "Friends", mute: "Mute", unmute: "Unmute",
        me: "Profile", home: "Home", cfg: "Settings" },
};
function paintBarLabels(){
  const t = BAR_T[window.__lang] || BAR_T.ko;
  const put = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  /* 광고 제거를 산 사람은 광고 없이 받는다 (2026-10-26) */
  put("adLabel", account && account.noAds ? t.free : t.ad);
  put("shopLabel", t.shop);
  put("rankLabel", t.rank);
  put("friendLabel", t.friend);
  put("tbMeL", t.me); put("tbHomeL", t.home); put("tbCfgL", t.cfg);
  const m = document.getElementById("btMute");
  /* 꺼져 있으면 "소리 켜기" — 예전에는 언어를 바꾸면 꺼져 있어도 "소리 끄기" 로 덮였다 */
  if (m) m.setAttribute("aria-label", m.getAttribute("aria-pressed") === "false" ? t.unmute : t.mute);
}
window.addEventListener("langchange", paintBarLabels);


const SCREENS = { entry, lobby, room, draw, table, tax, result, rank, shop };

/* 하단 고정 탭 — 뼈대(TAB_HTML)는 nav.js (검사도 같은 것을 쓴다) */
/* 프로필 탭 그림 = 지금 고른 얼굴 (안 가진 번호면 기본) */
function paintTabMe(){
  const ic = document.getElementById("tbMeIc");
  if (!ic) return;
  const n = Math.max(0, Math.floor(Number(account && account.avatar) || 0));
  const f = (AVATARS[n] || AVATARS[0] || {}).f;
  ic.style.backgroundImage = "url(/assets/ring.webp)" + (f ? ", url(/" + f + ")" : "");
}
window.addEventListener("accountchange", paintTabMe);
window.addEventListener("accountready", paintTabMe);

/* 화면마다 상단에 붙일 것 (뒤로 가기 / 설정 버튼) */
const BAR = {
  lobby:  { back: "entry" },
  room:   { back: "lobby" },
  rank:   { back: "lobby" },
  shop:   { back: "lobby" },
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
        /* 왼쪽 끝에 광고 시청 티켓 · 우편함, 오른쪽에 친구 · 규칙 보기 · 소리.
           상점·랭킹은 하단 고정 탭으로, 규칙 보기는 맨 아래에서 이 줄로 올라왔다 (2026-10-29 사용자 결정 — 아래 TAB_HTML)
           우편함 = 봉투 그림 단추(소리 단추와 같은 틀) · 받을 우편 수는 빨간 점 (2026-10-29 — screens/mail.js) */
        wrap.innerHTML =
          '<button class="bt-rank bt-ad" id="btAd">' +
          '<span id="adLabel">광고 시청 티켓</span></button>' +
          '<button class="bt-mail" id="btMail" aria-label="우편함"><i class="bt-mail__ic"></i></button>' +
          '<button class="bt-rank bt-friend" data-friendopen>' +
          '<span id="friendLabel">친구</span></button>' +
          '<button class="bt-rank bt-rules" id="btRules"></button>' +
          '<button class="bt-mute" id="btMute" aria-pressed="true" aria-label="소리 끄기">' +
          '<i class="bt-mute__on"></i><i class="bt-mute__off"></i></button>';
        bar.parentNode.insertBefore(wrap, bar.nextSibling);
        paintBarLabels();
      }
    }
  });
  stageEl.insertAdjacentHTML("beforeend", TAB_HTML + OPT_HTML + CFG_HTML + ACCT_HTML + ASK_HTML + FRIEND_HTML + DOC_HTML + MAIL_HTML);
}

build();
paintTabMe();
initMail();
Object.entries(SCREENS).forEach(([id, mod]) => {
  if (mod.mount) mod.mount(document.getElementById(id));
});
initNav();

/* 앱 오류를 서버로 (A3) — 가능한 한 일찍 건다 */
installErrorLog();
installAria();          /* 화면 읽기용 단추 이름을 고른 말로 (2026-10-10) */
installPress();         /* 손이 닿는 순간 눌림 표시 — 네이티브처럼 (2026-10-26) */
/* 업데이트 강제 안내 (A1) — 켤 때와 다시 앞으로 나올 때 */
checkUpdate();
(async () => {
  try {
    if (!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) return;
    const { App } = await import("@capacitor/app");
    App.addListener("resume", () => { checkUpdate(); });
  } catch(e){}
})();

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
   두 번 눌러 광고가 겹치면 안 된다.

   **티켓은 서버가 준다.** 광고를 끝까지 보면 AdMob 이 게임 서버로 직접 알려 오고(서명 확인),
   서버가 계정에 한 장 적는다. 앱은 그게 적힐 때까지 기다렸다가 화면에 반영한다.
   예전에는 앱이 스스로 적어서, 광고를 안 보고도 그 함수만 부르면 티켓이 생겼다 */
let adBusy = false;
const AD_T = {
  ko: { late: "광고 보상을 확인하는 중입니다. 잠시 뒤 티켓이 들어옵니다",
        loading: "광고를 불러오는 중입니다",
        fail: "광고를 불러오지 못했습니다. 잠시 뒤 다시 눌러 주세요",
        early: "광고를 끝까지 보면 티켓 1장을 받습니다",
        cap: "오늘 광고로 받는 티켓 5장을 다 받았습니다. 내일 다시 받을 수 있습니다",
        freeCap: "오늘 무료 티켓 5장을 다 받았습니다. 내일 다시 받을 수 있습니다",
        freeGot: n => "티켓 1장을 받았습니다 (오늘 " + n + "장 남음)",
        freeFail: "티켓을 받지 못했습니다. 잠시 뒤 다시 눌러 주세요" },
  en: { late: "Checking the ad reward. Your ticket will arrive shortly",
        loading: "Loading the ad",
        fail: "Couldn't load an ad. Please try again shortly",
        early: "Watch the ad to the end to get a ticket",
        cap: "You've used today's 5 ad tickets. More tomorrow",
        freeCap: "You've claimed today's 5 free tickets. More tomorrow",
        freeGot: n => "Got 1 ticket (" + n + " left today)",
        freeFail: "Couldn't get a ticket. Please try again shortly" },
};
function paintAd(){
  const b = document.getElementById("btAd");
  if (!b) return;
  const full = (Number(account.tickets) || 0) >= TICKET_MAX;
  b.disabled = adBusy || full;
}
async function watchAd(){
  if (adBusy || (Number(account.tickets) || 0) >= TICKET_MAX) return;
  const t = AD_T[window.__lang] || AD_T.ko;
  const note = m => { if (window.__lobbyNote) window.__lobbyNote(m); };
  /* 광고 제거를 산 사람 — 광고 없이 하루 5장 (2026-10-26) */
  if (account.noAds){
    if (freeLeft() <= 0){ note(t.freeCap); return; }
    adBusy = true; paintAd();
    try {
      const r = await freeTicket();
      if (r.ok) note(t.freeGot(freeLeft()));
      else note(r.why === "cap" ? t.freeCap : t.freeFail);
    } finally { adBusy = false; paintAd(); }
    return;
  }
  /* 광고 보고 받는 티켓은 하루 5장 — 다 받았으면 광고를 띄우지 않는다(봐도 못 받는다) */
  if (adLeft() <= 0){ note(t.cap); return; }
  adBusy = true; paintAd();
  try {
    const before = Number(account.tickets) || 0;
    /* 받아 둔 광고가 아직 없으면 누른 즉시 알린다 — 아무 반응 없이 몇 초 멈춰 보이면 안 된다 (2026-10-26) */
    if (adsAvailable() && !rewardReady(account.uid || "")) note(t.loading);
    /* 광고에 내 계정 번호(uid)를 실어 보낸다 — AdMob 이 서버에 "누가 봤는지" 로 그대로 전한다 */
    const r = await showRewardAd(account.uid || "");
    if (r && r.ok){
      const hook = import.meta.env.VITE_TEST_HOOKS && globalThis.__ZOO_TEST && window.__rewardTicket;
      const got = hook ? await hook() : await waitReward(before);
      if (!got && !hook) note(t.late);
    } else if (r && r.why === "dismissed") note(t.early);                       /* 중간에 닫았다 */
    else if (r && /^(load|noshow|show|timeout)$/.test(r.why || "")) note(t.fail); /* 못 불러왔거나 못 띄웠다 */
  } catch (e){
    console.warn("[광고] " + (e && e.message || e));
  } finally {
    adBusy = false; paintAd();
    preloadAd();                               /* 다음 광고를 미리 받아 둔다 */
  }
}
/* 티켓을 더 받을 수 있고 로그인돼 있으면 광고를 미리 받아 둔다(누르자마자 뜨게).
   받아 둔 것이 아직 쓸 만하면 아무것도 안 한다 — 계정 변화마다 불러도 된다 */
function preloadAd(){
  if (adBusy || !account.signedIn || !account.uid) return;
  if ((Number(account.tickets) || 0) >= TICKET_MAX) return;
  if (account.noAds || adLeft() <= 0) return;           /* 광고를 안 볼 사람 · 오늘 다 받은 사람 */
  preloadRewardAd(account.uid).catch(() => {});
}
window.addEventListener("accountchange", () => setTimeout(preloadAd, 300));
document.addEventListener("click", e => { if (e.target.closest("#btAd")) watchAd(); });
window.addEventListener("accountchange", paintAd);
window.addEventListener("accountchange", paintBarLabels);     /* 광고 제거를 사면 "무료 티켓 받기" 로 */

/* 주간 랭킹 보상 알림 창(2026-10-27)은 없앴다 — 보상은 우편함으로 온다(2026-10-29, screens/mail.js) */
/* 남은 결제 다시 보내기 — 켤 때 한 번, 다른 계정으로 들어오면 그 계정으로 한 번,
   **앱으로 돌아올 때도(10분에 한 번까지)** — 결제 대기(편의점 결제 등)가 끝났거나, 결제 직후 앱이 내려가 못 보낸 것을
   다시 켜기 전에도 받게. 결제 창이 닫혀 돌아오는 것도 여기에 걸리지만, 플러그인 부르기는 한 줄로 서므로(billing.js) 결제와 겹치지 않는다 */
let restoredUid = "", restoredAt = 0;
const RESTORE_GAP = 10 * 60 * 1000;
function restoreFor(){
  if (!account.signedIn || !account.uid || account.uid === restoredUid) return;
  restoredUid = account.uid; restoredAt = Date.now();
  setTimeout(() => { restorePurchases().catch(() => {}); }, 1500);
}
window.addEventListener("accountchange", () => { if (window.__authDone) restoreFor(); });
window.addEventListener("appresume", () => {
  const gap = (import.meta.env.VITE_TEST_HOOKS && globalThis.__ZOO_TEST && Number(globalThis.__restoreGapMs)) || RESTORE_GAP;   /* 검사는 짧게 */
  if (!window.__authDone || !account.signedIn || !account.uid || Date.now() - restoredAt < gap) return;
  restoredUid = account.uid; restoredAt = Date.now();
  setTimeout(() => { restorePurchases().catch(() => {}); }, 1500);
});
if (import.meta.env.VITE_TEST_HOOKS && globalThis.__ZOO_TEST) window.__restorePurchases = () => restorePurchases();   /* 검사용 */
paintAd();
if (import.meta.env.VITE_TEST_HOOKS && globalThis.__ZOO_TEST) window.__watchAd = watchAd;   /* 검사용 */
window.signInGoogle = signInGoogle;
/* 검사용 로그인 — 배포판에서는 닫는다 */
if (import.meta.env.VITE_TEST_HOOKS && globalThis.__ZOO_TEST) window.signInTest = signInTest;
window.signInGuest = signInGuest;
window.linkGoogle = linkGoogle;
window.switchToGoogle = switchToGoogle;
window.signOutNow = signOutNow;
window.deleteAccount = deleteAccount;
window.setNickname = setNickname;
window.__isLocal = isLocal;

watchAuth().then(() => {
  window.__authDone = true;                    /* 로그인 확인이 끝났다 — 첫 화면이 적어 둔 기록 대신 진짜 상태를 본다 */
  window.dispatchEvent(new Event("accountready"));
  /* 광고 SDK 를 미리 켠다 — 처음 광고를 받을 때(로비에 막 들어선 때) 켜면 그 순간 버벅일 수 있다 (2026-10-26).
     약관에 동의한 사람만(동의 전에는 광고 쪽을 아예 건드리지 않는다 — 동의 창에서 개인화 동의를 먼저 받는다) */
  try { if (Number(localStorage.getItem("zk_agree")) >= 1) setTimeout(() => { warmAds(); }, 300); } catch(e){}
  /* 구글로 처음 들어왔으면 별명부터 정한다 */
  if (account.needName && window.__askName) window.__askName();
  /* 결제는 됐는데 서버에 못 넣은 것(앱이 꺼짐·끊김) — 켤 때 다시 보낸다 (2026-10-26 현금 결제) */
  restoreFor();
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

/* 게임이 끝났을 때. **점수는 서버가 판 기록을 보고 적는다** —
   여기서는 서버가 적은 값을 다시 읽어 화면을 맞출 뿐이다 */
window.reportGame = (rank, players, earned, quit) => {
  finishGame(rank, players, earned, quit)
    .catch(err => console.warn("점수 확인 실패", err));
};

/* 시작해도 되는지 미리 본다(티켓이 있는가). **빼는 것은 서버다** — 방장이 시작을 누르면
   서버가 앉은 사람 전원에게서 한 장씩 뺀다(2026-10-17). 여기서 막는 것은 헛걸음을 줄이려는 것뿐 */
window.spendTicket = async () => hasTicket();
/* 서버가 티켓을 뺐거나 점수를 적은 뒤 화면 값을 맞춘다 */
window.__refreshAccount = () => refreshAccount().catch(() => {});
/* 방에 앉을 때 서버에 보낼 로그인 표 — flow·lobby 는 파이어베이스를 모르므로 여기서 넣어 준다 */
window.__idToken = () => idToken();
window.__ticketLeft = () => ticketLeft();
/* 시간이 지나 찬 티켓을 화면 값에도 반영한다 (로비가 1초마다 부른다) */
window.__syncTickets = () => syncTickets();

/* ---------- 대전 연결 (엔진) ---------- */
/* 흐름은 lib/flow.js 가 다 갖고 있다. 여기서는 설치만 한다.
   그래야 검사에서 flow.js 를 그대로 돌려볼 수 있다. */

import { install as installFlow } from "./lib/flow.js";

installFlow({
  goto: id => window.__goto && window.__goto(id),
  myName: () => (account && account.name) || "나",
});
