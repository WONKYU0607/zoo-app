/* [stated] **출시 후에는 웹으로 게임을 못 한다 — 앱으로만** (2026-10-21).
   "게임 출시한 후에는 웹으로는 못 들어가야지. 앱을 다운받아서 컴터로 하든 폰으로 하든 상관없는데"
   웹으로 하면 광고가 안 나와서(판 끝 광고·광고 티켓) 광고 없이 공짜로 하게 된다.

   막는 건 **웹판 화면**뿐이다 — 약관·개인정보처리방침·계정 삭제 안내(public/*.html)와
   app-ads.txt 는 그대로 열린다 (플레이 콘솔·AdMob 이 보는 주소).
   앱은 게임 화면 파일을 빌드 때 안에 담아 가므로(웹 주소에서 안 불러온다) 이 막기와 상관없다.
   **검사용 빌드(`VITE_TEST_HOOKS`)·개발 서버는 연다** — 화면 검사가 빌드된 dist 를 띄운다 */

/* 웹에서도 게임을 열어 둘 때만 true */
export const WEB_PLAY = false;

export const STORE_URL = "https://play.google.com/store/apps/details?id=com.wonkyu.zoopresident";

/* 앱(안드로이드)에서 도는가 — 앱이 켜질 때 네이티브 쪽이 먼저 심어 두는 값만 본다 */
export function isNativeApp(){
  try {
    const C = window.Capacitor;
    if (C && typeof C.isNativePlatform === "function" && C.isNativePlatform()) return true;
    if (window.androidBridge) return true;            /* 캐패시터 안드로이드 다리 */
  } catch(e){}
  return false;
}

/* [stated] **안전장치 — 웹판 주소(Vercel)일 때만 막는다** (2026-10-21 "걸어놔 그럼").
   앱 안의 주소는 `localhost` 라서, 앱 표시(위 `isNativeApp`)를 혹시 못 읽는 일이 생겨도 **앱은 절대 안 막힌다**.
   막을 주소만 적는다(허용 목록이 아니라). 나중에 웹판에 다른 주소(내 도메인 등)를 붙이면 여기에 더한다 */
const WEB_HOSTS = /(^|\.)vercel\.app$/i;
export function onWebHost(host){
  try { return WEB_HOSTS.test(String(host != null ? host : (window.location && window.location.hostname) || "")); }
  catch(e){ return false; }
}

export function webBlocked(){
  if (WEB_PLAY || isNativeApp()) return false;
  const env = import.meta.env || {};
  if (env.DEV || env.VITE_TEST_HOOKS) return false;
  return onWebHost();
}

/* "앱에서만 할 수 있습니다" 화면. 게임 코드(main.js)는 아예 불러오지 않는다 —
   로그인·서버 접속도 안 일어난다 */
export function showWebOnly(){
  let ko = true;
  try {
    const v = localStorage.getItem("zk_lang");
    ko = v ? v === "ko" : (navigator.language || "ko").toLowerCase().indexOf("ko") === 0;
  } catch(e){}
  const T = ko
    ? { name: "동물의 왕국", msg: "동물의 왕국은 앱에서만 할 수 있습니다. 구글 플레이에서 받아 주세요.", go: "구글 플레이에서 받기", priv: "개인정보처리방침" }
    : { name: "Zoo President", msg: "Zoo President is available in the app only. Get it on Google Play.", go: "Get it on Google Play", priv: "Privacy policy" };
  document.documentElement.lang = ko ? "ko" : "en";
  document.title = T.name;
  const st = document.getElementById("stage");
  if (st) st.remove();
  const box = document.createElement("main");
  box.className = "web-only";
  box.setAttribute("style",
    "min-height:100vh;margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;" +
    "gap:18px;padding:24px;box-sizing:border-box;background:#140E0A;color:#D9CCB0;" +
    "font-family:system-ui,sans-serif;text-align:center");
  box.innerHTML =
    `<h1 style="margin:0;color:#E8C46A;font-size:26px;letter-spacing:2px">${T.name}</h1>` +
    `<p class="wo-msg" style="margin:0;max-width:300px;line-height:1.6;word-break:keep-all">${T.msg}</p>` +
    `<a class="wo-go" href="${STORE_URL}" target="_blank" rel="noopener noreferrer" ` +
    `style="padding:13px 26px;border-radius:10px;background:#C69A3C;color:#1A120A;font-weight:800;text-decoration:none;white-space:nowrap">${T.go}</a>` +
    `<a href="privacy.html" style="color:#8C7B5C;font-size:13px">${T.priv}</a>`;
  document.body.style.margin = "0";
  document.body.appendChild(box);
}
