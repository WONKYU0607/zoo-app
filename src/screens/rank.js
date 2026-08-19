/* 랭킹 화면.
   전체 누적 / 이번 주 / 이번 달 세 갈래.
   줄마다 순위 · 티어 · 이름 · 점수. 내 순위는 아래에 고정으로 붙는다.
   게스트는 목록에 안 오르고, 대신 구글로 이으라고 알린다. */

import "../styles/lobby.css";
import { account, topScores, myRank } from "../lib/account.js";

/* 검사에서 가짜 자료를 끼울 수 있게 한 겹 둔다 */
const fetchTop  = (...a) => (window.__topScores || topScores)(...a);
const fetchMine = (...a) => (window.__myRank    || myRank)(...a);

const T = {
  ko: {
    title: "랭킹",
    tabs: { all: "전체", week: "이번 주", month: "이번 달" },
    loading: "불러오는 중",
    empty: "아직 기록이 없습니다",
    guest: "게스트는 랭킹에 오르지 않습니다. 설정에서 구글 계정을 이으면 지금 점수 그대로 오릅니다.",
    meOut: "아직 순위에 들지 않았습니다",
    me: "내 순위",
    tier: t => t + "티어",
    err: "불러오지 못했습니다",
  },
  en: {
    title: "Leaderboard",
    tabs: { all: "All time", week: "This week", month: "This month" },
    loading: "Loading",
    empty: "No records yet",
    guest: "Guests don't appear here. Link a Google account in settings to keep your score and join.",
    meOut: "Not ranked yet",
    me: "Your rank",
    tier: t => "Tier " + t,
    err: "Could not load",
  },
};

const HTML = `
<div class="veil"></div>
<main class="screen">
  <div class="bar">
    <button class="navback" data-back="lobby" aria-label="뒤로">‹</button>
    <div class="bar__t" id="rkBar"></div>
  </div>
  <div class="body">
    <div class="block__label" id="rkTitle"></div>
    <div class="cfg__row" id="rkTabs">
      <button data-k="all"></button>
      <button data-k="week"></button>
      <button data-k="month"></button>
    </div>
    <div id="rkList" class="rk"></div>
    <div id="rkMe" class="rk rk--me"></div>
    <p class="hint" id="rkNote"></p>
  </div>
</main>`;

export function mount(root){
  if (!root) return;
  root.innerHTML = HTML;
  const el = id => root.querySelector("#" + id);
  let lang = window.__lang || "ko";
  let kind = "all";
  let rows = null, mine = null, state = "idle";

  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* 티어 뱃지 — 그림 위에 숫자를 얹는다 */
  function tierHTML(t){
    const n = Math.max(0, Math.min(10, Number(t) || 0));
    return '<span class="rk__t" style="background-image:url(/assets/tier_' +
      String(n).padStart(2, "0") + '.webp)"><b>' + n + '</b></span>';
  }

  function rowHTML(no, r, me){
    return '<div class="rk__r' + (me ? " rk__r--me" : "") + '">' +
      '<span class="rk__no">' + no + '</span>' +
      tierHTML(r.tier) +
      '<span class="rk__n">' + esc(r.name || "-") + '</span>' +
      '<span class="rk__s">' + Number(r.score || 0).toLocaleString() + '</span>' +
      '</div>';
  }

  function draw(){
    const t = T[lang];
    el("rkTitle").textContent = t.title;
    if (el("rkBar")) el("rkBar").textContent = t.title;
    el("rkTabs").querySelectorAll("button").forEach(b => {
      b.textContent = t.tabs[b.dataset.k];
      b.setAttribute("aria-pressed", String(b.dataset.k === kind));
    });

    const list = el("rkList");
    if (state === "loading"){ list.innerHTML = '<p class="hint">' + t.loading + '</p>'; }
    else if (state === "error"){ list.innerHTML = '<p class="hint">' + t.err + '</p>'; }
    else if (!rows || !rows.length){ list.innerHTML = '<p class="hint">' + t.empty + '</p>'; }
    else {
      list.innerHTML = rows.map((r, i) => rowHTML(i + 1, r, r.uid === account.uid)).join("");
    }

    const meBox = el("rkMe");
    if (account.guest || !account.signedIn){
      meBox.innerHTML = "";
    } else if (mine){
      meBox.innerHTML = '<div class="rk__cap">' + t.me + '</div>' +
        rowHTML(mine.rank, { name: account.name, score: mine.score, tier: mine.tier }, true);
    } else {
      meBox.innerHTML = '<div class="rk__cap">' + t.me + '</div><p class="hint">' + t.meOut + '</p>';
    }

    el("rkNote").textContent = account.guest ? t.guest : "";
  }

  async function load(){
    state = "loading"; rows = null; mine = null; draw();
    const want = kind;
    try {
      const [list, r] = await Promise.all([fetchTop(kind, 100), fetchMine(kind)]);
      if (want !== kind) return;                 /* 그 사이 다른 탭을 눌렀다 */
      rows = list; mine = r; state = "done";
    } catch(e){
      if (want !== kind) return;
      state = "error"; console.warn(e);
    }
    draw();
  }

  el("rkTabs").addEventListener("click", e => {
    const b = e.target.closest("button[data-k]");
    if (!b || b.dataset.k === kind) return;
    kind = b.dataset.k;
    load();
  });

  window.addEventListener("langchange", () => { lang = window.__lang || "ko"; draw(); });
  window.addEventListener("accountchange", draw);

  /* 화면이 열릴 때마다 새로 받아 온다 */
  window.__bootRank = () => { lang = window.__lang || "ko"; load(); };
  draw();
}
