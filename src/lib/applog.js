/* 앱 오류를 서버로 보낸다 (2026-10-09 요청 A3)

   테스터가 AI 라 실제 폰에서 나는 오류를 알 길이 없다. 처리 못 한 오류·약속 실패를 잡아
   서버 /zoo/log 로 보낸다. 서버는 Fly 로그에 "[앱오류]" 로 남긴다.
   **개인정보는 안 보낸다** — 오류 글, 어디서(파일:줄), 화면 이름, 앱 버전, 기기 모델까지.
   같은 오류는 한 번만, 한 번 켤 때 최대 8개. 보내다 실패해도 그냥 넘긴다(게임에 영향 없음) */
import { appInfo } from "./appinfo.js";
import { serverUrl } from "./lobby.js";

const MAX = 8;
let sent = 0;
const seen = new Set();
/* 우리 탓이 아니거나 정보가 없는 것 */
const NOISE = [/ResizeObserver loop/i, /^Script error\.?$/i];

function dev(){
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  const m = ua.match(/Android [^;)]*(;[^;)]*)?/);
  return m ? m[0].replace(/;\s*wv$/, "").trim() : (/iPhone|iPad/.test(ua) ? "iOS" : "web");
}

export async function sendError(msg, where, stack){
  try {
    msg = String(msg || "").slice(0, 300);
    if (!msg || NOISE.some(r => r.test(msg))) return false;
    const key = msg + "@" + (where || "");
    if (seen.has(key) || sent >= MAX) return false;
    seen.add(key);
    sent++;
    const base = serverUrl();
    if (!base) return false;
    const info = await appInfo();
    const body = { msg, where: String(where || "").slice(0, 160), stack: String(stack || "").slice(0, 1200),
                   scr: (document.querySelector(".page.is-on") || {}).id || "-",
                   ver: info.version, build: info.build == null ? "" : String(info.build), dev: dev() };
    (window.__applogSent = window.__applogSent || []).push(body);     /* 검사용 */
    /* text/plain 으로 보낸다 — JSON 머리를 달면 브라우저가 먼저 허락을 묻는데(preflight),
       keepalive(앱이 꺼지는 중에도 보내기)와 그 허락 묻기가 같이 안 되는 브라우저가 있다 */
    await fetch(base + "/zoo/log", { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" },
                                     body: JSON.stringify(body), keepalive: true });
    return true;
  } catch(e){ return false; }
}

export function installErrorLog(){
  if (window.__applogOn) return;
  window.__applogOn = true;
  window.addEventListener("error", e => {
    if (!e) return;
    const where = e.filename ? String(e.filename).split("/").pop() + ":" + (e.lineno || 0) + ":" + (e.colno || 0) : "";
    sendError(e.message || (e.error && e.error.message), where, e.error && e.error.stack);
  });
  window.addEventListener("unhandledrejection", e => {
    const r = e && e.reason;
    const msg = r && (r.message || (typeof r === "string" ? r : "")) || "unhandled rejection";
    sendError("(약속) " + msg, "", r && r.stack);
  });
}
