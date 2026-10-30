/* ---------- 우편함 (2026-10-29 사용자 결정: "광고시청 옆에 빈칸에 … 우편함 하나 만들자 누르면 그 주간랭킹보상 같은거 거기서 받을수잇게") ----------
   로비 윗줄, 광고 시청 티켓 바로 옆의 봉투 단추(#btMail) → 화면 가운데 놋쇠 틀 창(#mailBox).
   서버가 넣은 보상(지금은 주간 랭킹 보상)을 하나씩 또는 "모두 받기" 로 받는다. 받은 우편은 사라진다.
   목록은 계정 문서의 mail(서버만 적는다) — 창을 열 때 다시 읽는다. 단추에는 받을 우편 수를 빨간 점으로.

   다시 만듦(2026-10-29 사용자: "좀 성의잇게좀 만들어라 … 다른게임들 좀 보고 배우든가") — 게임 우편함 꼴로:
     창 위에 붉은 이름판 · 모서리 둥근 닫기 · 우편마다 보상 칸(코인 그림 + 수량) · 제목 · 그 주 날짜 · 도착 시간 · 붉은 [받기]
     · 아래에 늘 [모두 받기](비면 꺼짐) · 받으면 줄이 빠지고 "보상 획득" 창 · 비면 봉투 그림 안내
   화면이 아니라 창이라 SCREENS 에는 없다(main.js 가 뼈대를 붙이고 initMail 을 부른다) */
import { account, claimMail, refreshAccount } from "../lib/account.js";

/* 빈 우편함 그림 — 놋쇠 선 봉투 + 붉은 봉인 (그림 파일 없이 SVG) */
const ENVELOPE =
  '<svg class="ml__art" viewBox="0 0 120 92" aria-hidden="true">' +
  '<defs><linearGradient id="mlG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2D58A"/><stop offset="1" stop-color="#A8792E"/></linearGradient>' +
  '<radialGradient id="mlR" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#E0573E"/><stop offset="1" stop-color="#7A1A12"/></radialGradient></defs>' +
  '<ellipse cx="60" cy="86" rx="40" ry="4" fill="rgba(0,0,0,.45)"/>' +
  '<rect x="14" y="20" width="92" height="60" rx="5" fill="#2A1E12" stroke="url(#mlG)" stroke-width="2.6"/>' +
  '<path d="M16 24 60 56 104 24" fill="none" stroke="url(#mlG)" stroke-width="2.6" stroke-linejoin="round"/>' +
  '<path d="M16 78 47 47M104 78 73 47" fill="none" stroke="#8C6A2C" stroke-width="1.8" stroke-linecap="round"/>' +
  '<circle cx="60" cy="56" r="9" fill="url(#mlR)" stroke="#F2C46B" stroke-width="1.4"/>' +
  '<circle cx="60" cy="56" r="5" fill="none" stroke="#F8D9A0" stroke-width="1.2" opacity=".75"/>' +
  '</svg>';

export const MAIL_HTML =
  '<div class="cfg ml" id="mailBox" role="dialog" aria-modal="true">' +
  '<div class="cfg__v" data-mailclose></div>' +
  '<div class="ml__p">' +
  '<div class="ml__rib"><span id="mailT"></span></div>' +
  '<button class="ml__x" data-mailclose aria-label="close"></button>' +
  '<div class="ml__list" id="mailList"></div>' +
  '<p class="ml__note" id="mailNote"></p>' +
  '<div class="ml__foot" id="mailAllRow"><button class="ml__all" id="mailAll"></button></div>' +
  '</div></div>' +
  /* 받은 뒤 뜨는 "보상 획득" 창 — 우편함보다 위(뒤로가기는 이것부터 닫는다: DOM 에서 뒤에 있다) */
  '<div class="cfg mg" id="mailGot" role="dialog" aria-modal="true">' +
  '<div class="cfg__v" data-gotclose></div>' +
  '<div class="mg__p">' +
  '<div class="mg__rib"><span id="mgT"></span></div>' +
  '<div class="mg__fx"><i class="mg__ray"></i><i class="mg__glow"></i><i class="mg__coin"></i></div>' +
  '<b class="mg__n" id="mgN"></b>' +
  '<p class="mg__m" id="mgM"></p>' +
  '<button class="mg__ok" id="mgOk" data-gotclose></button>' +
  '</div></div>';

const T = {
  ko: { t: "우편함", weekly: p => "주간 랭킹 " + p + "등 보상", other: "보상",
        range: (a, b) => (a.m + 1) + "월 " + a.d + "일 ~ " + (a.m === b.m ? "" : (b.m + 1) + "월 ") + b.d + "일",
        ago: ms => ms < 3600e3 ? "방금" : ms < 86400e3 ? Math.floor(ms / 3600e3) + "시간 전" : Math.floor(ms / 86400e3) + "일 전",
        get: "받기", all: "모두 받기", none: "받을 우편이 없습니다", noneM: "매주 주간 랭킹 1~10등 보상이 이곳으로 옵니다",
        got: n => "코인 " + n.toLocaleString() + "개를 받았습니다", dup: "이미 받은 우편입니다",
        gotT: "보상 획득", ok: "확인",
        auth: "로그인이 필요합니다.", off: "지금은 우편함을 사용할 수 없습니다.", fail: "받지 못했습니다. 잠시 뒤 다시 시도해 주세요." },
  en: { t: "Mailbox", weekly: p => "Weekly ranking #" + p + " reward", other: "Reward",
        range: (a, b) => MON[a.m] + " " + a.d + " – " + (a.m === b.m ? "" : MON[b.m] + " ") + b.d,
        ago: ms => ms < 3600e3 ? "Just now" : ms < 86400e3 ? Math.floor(ms / 3600e3) + "h ago" : Math.floor(ms / 86400e3) + "d ago",
        get: "Claim", all: "Claim all", none: "No mail", noneM: "Weekly top 10 rewards arrive here",
        got: n => "You received " + n.toLocaleString() + " coins", dup: "Already claimed",
        gotT: "Reward", ok: "OK",
        auth: "Sign-in required.", off: "The mailbox is unavailable right now.", fail: "Couldn't claim. Please try again later." },
};
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const tt = () => T[window.__lang] || T.ko;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = id => document.getElementById(id);
const nap = ms => new Promise(r => setTimeout(r, ms));

/* 주 딱지("2026-W44", 월요일 시작 — account.js periodKeys) → 그 주 월요일 ~ 일요일 */
export function weekSpan(key){
  const m = /^(\d{4})-W(\d{1,2})$/.exec(String(key || ""));
  if (!m) return null;
  const y = Number(m[1]), w = Number(m[2]);
  const jan4 = Date.UTC(y, 0, 4);
  const mon = jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * 86400e3 + (w - 1) * 7 * 86400e3;
  const a = new Date(mon), b = new Date(mon + 6 * 86400e3);
  return { a: { m: a.getUTCMonth(), d: a.getUTCDate() }, b: { m: b.getUTCMonth(), d: b.getUTCDate() } };
}

const list = () => (Array.isArray(account.mail) ? account.mail : []).filter(x => x && x.id);
const coinsOf = m => Math.max(0, Math.floor(Number(m.coins) || 0));
let busy = false;

function note(msg, bad){
  const n = $("mailNote");
  if (!n) return;
  n.textContent = msg || "";
  n.classList.toggle("ml__note--bad", Boolean(bad));
}

function paint(){
  const box = $("mailList");
  if (!box) return;
  const t = tt();
  $("mailT").textContent = t.t;
  const ms = list().slice().sort((x, y) => (Number(y.at) || 0) - (Number(x.at) || 0));
  if (!ms.length){
    box.innerHTML = '<div class="ml__empty">' + ENVELOPE + "<b>" + esc(t.none) + "</b><small>" + esc(t.noneM) + "</small></div>";
  } else {
    const now = Date.now();
    box.innerHTML = ms.map(m => {
      const sp = m.kind === "weekly" ? weekSpan(m.key) : null;
      const place = Math.max(1, Number(m.place) || 1);
      const title = m.kind === "weekly" ? t.weekly(place) : t.other;
      const at = Number(m.at) || 0;
      /* 1~3등은 보상 칸 빛깔을 금·은·동으로 */
      const tier = m.kind === "weekly" && place <= 3 ? " ml__slot--p" + place : "";
      return '<div class="ml__row" data-mailrow="' + esc(m.id) + '">' +
        '<div class="ml__slot' + tier + '"><i class="ml__coin"></i><span class="ml__c">' + coinsOf(m).toLocaleString() + "</span></div>" +
        '<div class="ml__tx"><b>' + esc(title) + "</b>" + (sp ? "<span>" + esc(t.range(sp.a, sp.b)) + "</span>" : "") +
        (at ? "<em>" + esc(t.ago(Math.max(0, now - at))) + "</em>" : "") + "</div>" +
        '<button class="ml__get" data-mailget="' + esc(m.id) + '">' + esc(t.get) + "</button></div>";
    }).join("");
  }
  const all = $("mailAll");
  if (all){ all.textContent = t.all; all.disabled = ms.length === 0; }
  more();
  const ok = $("mgOk"), gt = $("mgT");
  if (ok) ok.textContent = t.ok;
  if (gt) gt.textContent = t.gotT;
}

/* 목록 아래에 더 있으면 끝을 흐리게(.ml__list--more) */
function more(){
  const l = $("mailList");
  if (l) l.classList.toggle("ml__list--more", l.scrollTop + l.clientHeight < l.scrollHeight - 2);
}

/* 단추의 빨간 점 — 받을 우편 수 (10개부터 9+) */
function paintBadge(){
  const b = $("btMail");
  if (!b) return;
  const n = list().length;
  let dot = b.querySelector(".bt-mail__n");
  if (!dot){ dot = document.createElement("b"); dot.className = "bt-mail__n"; b.appendChild(dot); }
  dot.textContent = n > 9 ? "9+" : String(n);
  dot.hidden = n === 0;
  b.setAttribute("aria-label", tt().t + (n ? " " + n : ""));
}

/* "보상 획득" 창 — 코인 그림이 튀어나오고 뒤에서 빛살이 돈다 */
function showGot(n){
  const g = $("mailGot");
  if (!g) return;
  const t = tt();
  $("mgT").textContent = t.gotT;
  $("mgN").textContent = "+" + n.toLocaleString();
  $("mgM").textContent = t.got(n);
  $("mgOk").textContent = t.ok;
  g.classList.remove("on");
  void g.offsetWidth;                                   /* 연달아 받아도 처음부터 다시 튀게 */
  g.classList.add("on");
}
const closeGot = () => { const g = $("mailGot"); if (g) g.classList.remove("on"); };

async function claim(id){
  if (busy) return;
  const t = tt();
  const want = id === "all" ? list() : list().filter(m => m.id === id);
  const expect = want.reduce((s, m) => s + coinsOf(m), 0);
  busy = true; note("");
  let r;
  try { r = await claimMail(id); } catch(e){ r = { ok: false, why: "net" }; }
  let got = 0;
  if (r.ok && !r.dup) got = r.got;
  else if (r.ok && r.again) got = expect;               /* 첫 요청이 넣고 답만 잃었다 */
  if (got > 0){
    /* 받은 줄이 옆으로 빠져나간 뒤 목록을 다시 그린다 */
    const rows = [...document.querySelectorAll("#mailList .ml__row")]
      .filter(x => id === "all" || x.getAttribute("data-mailrow") === id);
    if (rows.length){
      rows.forEach(x => { x.style.height = x.offsetHeight + "px"; x.classList.add("ml__row--out"); });
      await nap(240);
      rows.forEach(x => x.classList.add("ml__row--gone"));   /* 빈자리가 접히며 아래 줄이 올라온다 */
      await nap(200);
    }
  }
  busy = false;
  if (got > 0) note("");
  else if (r.ok) note(t.dup);
  else note(r.why === "auth" ? t.auth : r.why === "off" ? t.off : t.fail, true);
  paint(); paintBadge();
  if (got > 0) showGot(got);
}

export function openMail(){
  const box = $("mailBox");
  if (!box) return;
  note("");
  paint();
  box.classList.add("on");
  requestAnimationFrame(more);                          /* 창이 보인 뒤에야 높이를 잰다 */
  /* 서버가 그새 넣은 우편(월요일 주간 보상 등)을 받아 온다 */
  /* 받는 중(줄이 빠져나가는 중)이면 다시 그리지 않는다 — 끝나면 claim 이 그린다(2026-10-29 검토) */
  refreshAccount().then(() => { if (!busy){ paint(); paintBadge(); } }).catch(() => {});
}

export function initMail(){
  window.__openMail = openMail;
  document.addEventListener("click", e => {
    if (e.target.closest("#btMail")){ openMail(); return; }
    if (e.target.closest("[data-gotclose]")){ closeGot(); return; }
    if (e.target.closest("[data-mailclose]")){ const b = $("mailBox"); if (b) b.classList.remove("on"); closeGot(); return; }
    const g = e.target.closest("[data-mailget]");
    if (g && !g.disabled){ claim(g.getAttribute("data-mailget")); return; }
    if (e.target.closest("#mailAll") && !busy && list().length) claim("all");
  });
  /* 받는 중에는 다시 그리지 않는다 — 계정이 먼저 바뀌어 줄이 빠지는 그림 없이 사라졌다. 끝나면 claim 이 그린다 */
  const again = () => { if (busy) return; paintBadge(); const b = $("mailBox"); if (b && b.classList.contains("on")) paint(); };
  window.addEventListener("accountchange", again);
  window.addEventListener("accountready", again);
  window.addEventListener("langchange", again);
  const l = $("mailList");
  if (l) l.addEventListener("scroll", more, { passive: true });
  paintBadge();
}
