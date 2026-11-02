/* 랭킹 화면.
   전체 누적 / 이번 주 / 이번 달 세 갈래.
   줄마다 순위 · 티어 · 이름 · 점수. 내 순위는 아래에 고정으로 붙는다.
   게스트는 목록에 안 오르고, 대신 구글로 이으라고 알린다. */

import "../styles/lobby.css";
import { account, topScores, myRank, periodKeys, watchBoard } from "../lib/account.js";
import { WEEK_PRIZE } from "../lib/shop.js";
import { tierOf } from "../lib/tier.js";

/* 검사에서 가짜 자료를 끼울 수 있게 한 겹 둔다 */
const fetchTop  = (...a) => (window.__topScores  || topScores)(...a);
const fetchMine = (...a) => (window.__myRank     || myRank)(...a);
const watchB    = (...a) => (window.__watchBoard || watchBoard)(...a);

/* **랭킹판 한 장(board/top)을 지켜본다** (2026-11-01 사용자 지시 — "저 읽기를 계속 받지말고 걍 랭킹 변동이 생기면 바뀌면되잖아").
   서버가 순위가 바뀔 때만 그 한 장을 고친다(zoo-server board.js). 이 화면은
     - 열 때 그 한 장을 1번 읽고, 열어 둔 동안 바뀌면 그때만 1번씩 더 받는다(바로 바뀐다)
     - 탭(전체·월간·주간)은 같은 한 장 안에 다 있어 옮겨도 안 읽는다
     - 화면을 떠나면 그만 본다
   내 순위: 판(120명까지 적혀 있음) 안에 있으면 거기서 센다. 밖이면 예전처럼 "나보다 높은 사람 수" 를 한 번 센다.
   **판이 아직 없거나(서버를 아직 안 올림) 못 읽으면(규칙을 아직 안 올림) 예전 방식(점수순 160명 읽기)으로** —
   앱·서버·규칙을 올리는 순서가 어떻든 랭킹이 비지 않게 */
export const SHOW = 100;
const cache = {};          /* 예전 방식일 때만 — 열어 둔 화면 안에서 탭을 오갈 때 다시 쓴다 */
export const RANK_CACHE_MS = 10 * 60 * 1000;
function cacheKey(kind){
  const k = periodKeys();
  const mine = kind === "all" ? account.score : (kind === "week" ? account.wk : account.mo);
  return [account.uid || "", account.guest ? "g" : "", account.signedIn ? "s" : "",
          Number(mine || 0), kind === "week" ? k.wk : kind === "month" ? k.mo : ""].join("|");
}
/* 판 한 장 → 그 탭의 줄들(120명까지). 주·달 딱지가 지금과 다르면(이번 주에 아직 아무도 안 함) 빈 판 */
export function boardRows(b, kind){
  if (!b) return [];
  const k = periodKeys();
  const l = kind === "all" ? b.all : kind === "week" ? b.wk : b.mo;
  if (!l || !Array.isArray(l.rows)) return [];
  if (kind === "week" && l.key !== k.wk) return [];
  if (kind === "month" && l.key !== k.mo) return [];
  return l.rows.map(r => ({ uid: r.u, name: r.n, score: Number(r.s) || 0, tier: tierOf(Number(r.a != null ? r.a : r.s) || 0) }));
}

const T = {
  ko: {
    title: "랭킹",
    tabs: { all: "전체 랭킹", month: "월간 랭킹", week: "주간 랭킹" },
    loading: "불러오는 중",
    empty: "아직 기록이 없습니다",
    guest: "게스트는 랭킹에 오르지 않습니다. 설정에서 구글 계정을 이으면 지금 점수 그대로 오릅니다.",
    meOut: "아직 순위에 들지 않았습니다",
    me: "내 순위",
    tier: t => t + "티어",
    err: "불러오지 못했습니다",
    /* 주간 보상 안내 (2026-10-27) — 값은 shop.js WEEK_PRIZE */
    prize: "매주 1~10등은 코인을 받습니다\n1등 " + WEEK_PRIZE[0] + "개 · 2등 " + WEEK_PRIZE[1] + "개 · 3등 " + WEEK_PRIZE[2] + "개 · 4~10등 " + WEEK_PRIZE[3] + "개",
  },
  en: {
    title: "Leaderboard",
    tabs: { all: "All time", month: "Monthly", week: "Weekly" },
    loading: "Loading",
    empty: "No records yet",
    guest: "Guests don't appear here. Link a Google account in settings to keep your score and join.",
    meOut: "Not ranked yet",
    me: "Your rank",
    tier: t => "Tier " + t,
    err: "Could not load",
    prize: "Top 10 each week earn coins\n1st " + WEEK_PRIZE[0] + " · 2nd " + WEEK_PRIZE[1] + " · 3rd " + WEEK_PRIZE[2] + " · 4th–10th " + WEEK_PRIZE[3],
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
      <button data-k="month"></button>
      <button data-k="week"></button>
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

    el("rkNote").textContent = account.guest ? t.guest : kind === "week" ? t.prize : "";
  }

  /* ---- 판 지켜보기 ---- */
  let board;                     /* undefined = 아직 · null = 판 없음 · 객체 = 판 */
  let unwatch = null, legacy = false;
  const mineAsked = {};          /* 판 밖일 때 센 내 순위 — 탭마다 한 번(열 때마다 다시) */

  function fromBoard(){
    const all = boardRows(board, kind);
    rows = all.slice(0, SHOW);
    mine = null;
    if (account.signedIn && !account.guest){
      const i = all.findIndex(r => r.uid === account.uid);
      if (i >= 0) mine = { rank: i + 1, score: all[i].score, tier: all[i].tier };
      else if (mineAsked[kind] && mineAsked[kind].v) mine = mineAsked[kind].v;
      else if (!mineAsked[kind]){
        /* 판 밖 — 나보다 높은 사람 수를 한 번 센다 */
        const want = kind;
        mineAsked[want] = { v: null };
        Promise.resolve(fetchMine(want)).then(v => { mineAsked[want] = { v }; if (kind === want && !legacy){ fromBoard(); draw(); } })
          .catch(() => {});
      }
    }
    state = "done";
  }

  async function load(){
    if (!legacy && board !== undefined && board !== null){ fromBoard(); draw(); return; }
    if (!legacy && board === undefined){ state = "loading"; rows = null; mine = null; draw(); return; }
    /* 예전 방식 (판이 없거나 못 읽을 때) */
    const key = cacheKey(kind);
    const c = cache[kind];
    if (c && c.key === key && Date.now() - c.at < RANK_CACHE_MS){
      rows = c.rows; mine = c.mine; state = "done"; draw();
      return;
    }
    state = "loading"; rows = null; mine = null; draw();
    const want = kind;
    try {
      const [list, r] = await Promise.all([fetchTop(kind, SHOW), fetchMine(kind)]);
      cache[want] = { key, at: Date.now(), rows: list, mine: r };
      if (want !== kind) return;                 /* 그 사이 다른 탭을 눌렀다 */
      rows = list; mine = r; state = "done";
    } catch(e){
      if (want !== kind) return;
      state = "error"; console.warn(e);
    }
    draw();
  }

  function startWatch(){
    stopWatch();
    board = undefined; legacy = false;
    unwatch = watchB((b, err) => {
      if (b === undefined || b === null){
        /* 판을 못 읽음(규칙 미배포 등) 또는 판이 아직 없음(서버 미배포) → 예전 방식 */
        if (!legacy){ legacy = true; if (err) console.warn("[랭킹판] 못 읽어 예전 방식으로", err); load(); }
        return;
      }
      legacy = false;
      board = b;
      fromBoard(); draw();
    });
  }
  function stopWatch(){ if (unwatch){ try { unwatch(); } catch(e){} unwatch = null; } }

  el("rkTabs").addEventListener("click", e => {
    const b = e.target.closest("button[data-k]");
    if (!b || b.dataset.k === kind) return;
    kind = b.dataset.k;
    load();
  });

  window.addEventListener("langchange", () => { lang = window.__lang || "ko"; draw(); });
  window.addEventListener("accountchange", draw);

  /* 화면이 열릴 때 — 판을 지켜보기 시작(1번 읽기). 예전 방식에 받아 둔 것은 버린다 */
  window.__bootRank = () => {
    lang = window.__lang || "ko";
    for (const k of Object.keys(cache)) delete cache[k];
    for (const k of Object.keys(mineAsked)) delete mineAsked[k];
    startWatch();
    if (!legacy) load();          /* 못 읽어 예전 방식으로 넘어갔으면 그쪽에서 이미 불렀다(두 번 읽지 않게) */
  };
  /* 화면을 떠날 때 — 그만 본다(안 보는 동안 판이 바뀌어도 안 읽는다) */
  window.__leaveRank = () => { stopWatch(); };
  draw();
}
