/* 랭킹 화면 검사.
   전체/주간/월간 탭, 순위·티어·이름·점수 줄, 내 순위 고정, 게스트 안내. */
import { JSDOM } from "jsdom";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"),
  join(HERE, "_entry_rank.js"), "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty",
  /* 이 검사는 브라우저 없이 묶어 돌린다. `import.meta.env` 가 없어서
     그대로 두면 빌드 깃발을 읽다가 터진다 — 검사용 값으로 채워 준다 */
  "--define:import.meta.env.VITE_TEST_HOOKS=\"1\"", "--outfile=" + join(HERE, "_bundle_rank.mjs"), "--log-level=warning",
  /* firebase 설정값은 빌드 때 꽂히는 것이라 검사에서는 빈 값으로 채운다 */
  "--define:import.meta.env=globalThis.__ENV__",
], { cwd: ROOT, stdio: "inherit" });

const dom = new JSDOM("<!doctype html><html><body><div id='stage'>" +
  "<section class='page is-on' id='rank'></section></div></body></html>",
  { pretendToBeVisual: true, url: "http://localhost/" });
global.window = dom.window; global.document = dom.window.document;
global.Element = dom.window.Element; global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
window.__lang = "ko";

globalThis.__ENV__ = {};
const B = await import("./_bundle_rank.mjs");

/* 주·달 딱지 계산이 맞는지 */
const k = B.acct.periodKeys(new Date("2026-08-18T00:00:00Z"));
check("이번 달 딱지", k.mo === "2026-08", k.mo);
check("이번 주 딱지 모양", /^\d{4}-W\d{2}$/.test(k.wk), k.wk);
const k2 = B.acct.periodKeys(new Date("2026-08-24T00:00:00Z"));   /* 다음 주 월요일 */
check("주가 넘어가면 딱지가 바뀐다", k.wk !== k2.wk, k.wk + " → " + k2.wk);

/* 화면 */
B.mountRank(document.getElementById("rank"));
const q = s => document.querySelector("#rank " + s);
check("탭이 셋", q("#rkTabs").querySelectorAll("button").length === 3);
check("탭 글자", [...q("#rkTabs").querySelectorAll("button")].map(b => b.textContent).join("/") === "전체 랭킹/월간 랭킹/주간 랭킹",
      [...q("#rkTabs").querySelectorAll("button")].map(b => b.textContent).join("/"));

/* 가짜 데이터로 그려 본다 */
const A = B.acct.account;
Object.assign(A, { uid: "me", name: "원규", score: 12000, tier: 2, guest: false, signedIn: true });
const rows = [
  { uid: "a", name: "서연", score: 30000, tier: 6 },
  { uid: "me", name: "원규", score: 12000, tier: 2 },
  { uid: "b", name: "준호", score: 900, tier: 0 },
];
window.__topScores = async () => rows;
window.__myRank = async () => ({ rank: 2, score: 12000, tier: 2 });
window.__bootRank();
await wait(200);

const rr = q("#rkList").querySelectorAll(".rk__r");
check("줄이 세 개 그려진다", rr.length === 3, rr.length + "줄");
check("1등 줄에 순위·티어뱃지·이름·점수",
      rr[0].querySelector(".rk__no").textContent === "1" &&
      rr[0].querySelector(".rk__t").textContent === "6" &&
      /tier_06\.webp/.test(rr[0].querySelector(".rk__t").getAttribute("style") || "") &&
      rr[0].querySelector(".rk__n").textContent === "서연" &&
      rr[0].querySelector(".rk__s").textContent === "30,000",
      [...rr[0].children].map(c => c.textContent).join(" | "));
check("내 줄이 표시된다", rr[1].classList.contains("rk__r--me"));
check("내 순위가 아래에 붙는다",
      (q("#rkMe").textContent || "").includes("내 순위") &&
      q("#rkMe").querySelector(".rk__no").textContent === "2",
      q("#rkMe").textContent.replace(/\s+/g, " ").slice(0, 40));

/* 게스트면 안내가 뜬다 */
Object.assign(A, { guest: true });
window.dispatchEvent(new Event("accountchange"));
await wait(50);
check("게스트에게 안내가 뜬다", (q("#rkNote").textContent || "").includes("게스트는 랭킹에 오르지 않습니다"),
      q("#rkNote").textContent.slice(0, 30));
check("게스트는 내 순위 칸이 빈다", q("#rkMe").innerHTML === "");

/* 탭을 누르면 바뀐다 */
Object.assign(A, { guest: false });
q('#rkTabs button[data-k="week"]').click();
await wait(100);
check("주간 탭이 선택된다",
      q('#rkTabs button[data-k="week"]').getAttribute("aria-pressed") === "true");

/* 랭킹 화면을 열 때마다 새로 읽는다 (2026-11-01 — "순위집계는 바로바로 올라와야 맞는거 아닌가").
   예전 10분 기억 때문에 남이 별명을 바꿔도(새사용자 → 조프로) 옛 이름·옛 점수가 보였다.
   받아 둔 것은 **열어 둔 화면 안에서 탭을 오갈 때만** 다시 쓴다 */
let calls = 0, mineCalls = 0;
/* 받을 때마다 **새 배열**을 준다 — 같은 배열을 주면 아래에서 rows 를 고칠 때 받아 둔 것까지 같이 바뀌어
   "다시 읽었는가" 를 못 가린다 */
window.__topScores = async () => { calls++; return rows.map(r => Object.assign({}, r)); };
window.__myRank = async () => { mineCalls++; return { rank: 2, score: A.score, tier: 2 }; };
q('#rkTabs button[data-k="all"]').click();
await wait(50);
check("열어 둔 화면 안에서 탭을 오가면 새로 안 읽는다", calls === 0 && mineCalls === 0 &&
      q("#rkList").querySelectorAll(".rk__r").length === 3, "읽기 " + calls + "번");
window.__bootRank(); await wait(50);
check("**화면을 다시 열면 새로 읽는다**", calls === 1 && mineCalls === 1, "읽기 " + calls + "번");
window.__bootRank(); await wait(50);
check("또 열면 또 새로 읽는다(10분 안이어도)", calls === 2 && mineCalls === 2, "읽기 " + calls + "번");
/* 남이 별명을 바꾸고 점수를 땄다 — 다시 열면 바로 보여야 한다 */
/* rows 를 제자리에서 고치면 처음에 받아 둔 배열(같은 것)까지 바뀐다 — 다른 배열을 돌려준다 */
const before = rows.slice();
const changed = before.map((r, i) => i === before.length - 1 ? Object.assign({}, r, { name: "조프로", score: r.score + 45 }) : Object.assign({}, r));
window.__topScores = async () => { calls++; return changed.map(r => Object.assign({}, r)); };
window.__bootRank(); await wait(50);
const lastRow = [...q("#rkList").querySelectorAll(".rk__r")].pop();
check("**남이 바꾼 별명·점수가 다시 열면 바로 보인다**",
      lastRow && lastRow.querySelector(".rk__n").textContent === "조프로" &&
      lastRow.querySelector(".rk__s").textContent === Number(before[before.length - 1].score + 45).toLocaleString(),
      lastRow ? lastRow.textContent : "줄 없음");
window.__topScores = async () => { calls++; return rows.map(r => Object.assign({}, r)); };
const realNow = Date.now;
Object.assign(A, { uid: "other" });
const c1 = calls;
window.__bootRank(); await wait(50);
check("계정이 바뀌어도 새로 읽는다", calls === c1 + 1, "읽기 " + calls + "번");
Object.assign(A, { uid: "me" });
window.__topScores = async () => { calls++; throw new Error("net"); };
Date.now = () => realNow() + 30 * 60 * 1000;
const warn0 = console.warn; console.warn = () => {};     /* 화면이 남기는 경고 줄은 여기서 감춘다 */
window.__bootRank(); await wait(50);
console.warn = warn0;
check("못 읽었을 때는 '불러오지 못했습니다'", (q("#rkList").textContent || "").includes("불러오지 못했습니다"));
window.__topScores = async () => { calls++; return rows; };
const c0 = calls;
window.__bootRank(); await wait(50);
check("못 읽은 것은 기억하지 않는다 — 다시 열면 다시 읽는다", calls === c0 + 1 && q("#rkList").querySelectorAll(".rk__r").length === 3);
Date.now = realNow;

/* 완주 실패(도중에 나감)는 그때까지 쌓은 점수의 **절반**만 준다.
   나가기 단추가 이 값을 실제로 기록하는지는 `leavegame.test.mjs` 가 본다 */
check("완주하면 쌓은 점수를 그대로 받는다", B.acct.scoreFor(0, 4, 300, false) === 300,
      String(B.acct.scoreFor(0, 4, 300, false)));
check("**도중에 나가면 절반만 받는다**", B.acct.scoreFor(0, 4, 300, true) === 150,
      String(B.acct.scoreFor(0, 4, 300, true)));
check("홀수는 내림", B.acct.scoreFor(0, 4, 301, true) === 150,
      String(B.acct.scoreFor(0, 4, 301, true)));

/* ---------- 랭킹판 한 장 지켜보기 (2026-11-01 — "랭킹 변동이 생기면 바뀌면되잖아") ----------
   서버가 순위가 바뀔 때만 board/top 을 고치고, 화면은 그 한 장만 지켜본다 */
console.log("\n--- 랭킹판 ---");
Date.now = realNow;
const PK = B.acct.periodKeys();
const mkBoard = (over = {}) => {
  const all = Array.from({ length: 120 }, (_, i) => ({ u: "p" + i, n: "사람" + i, s: 100000 - i * 100 }));
  all[104] = { u: "me", n: "원규", s: 100000 - 104 * 100 };                    /* 나는 105등 — 보이는 100명 밖, 적힌 120명 안 */
  return Object.assign({ ver: 1, all: { rows: all, cut: { s: 1, u: "z" } },
    wk: { key: PK.wk, rows: [{ u: "w1", n: "주간왕", s: 500, a: 30000 }, { u: "me", n: "원규", s: 90, a: 12000 }], cut: false },
    mo: { key: "2000-01", rows: [{ u: "m1", n: "옛달", s: 999, a: 1 }], cut: false } }, over);
};
let feed = null, unwatched = 0, watches = 0;
window.__watchBoard = cb => { watches++; feed = cb; cb(mkBoard()); return () => { unwatched++; }; };
calls = 0; mineCalls = 0;
Object.assign(A, { uid: "me", guest: false, signedIn: true, score: 12000 });
q('#rkTabs button[data-k="all"]').click(); await wait(20);
window.__bootRank(); await wait(50);
let rk = q("#rkList").querySelectorAll(".rk__r");
check("**판 한 장으로 그린다 — 점수순 160명 읽기를 안 한다**", calls === 0 && watches === 1, "예전 방식 읽기 " + calls + "번");
check("**100위까지 보인다**", rk.length === 100 && rk[99].querySelector(".rk__no").textContent === "100", rk.length + "줄");
check("내 순위는 판에서 센다(105등 — 따로 안 읽음)", q("#rkMe").querySelector(".rk__no").textContent === "105" && mineCalls === 0,
      q("#rkMe").textContent.replace(/\s+/g, " ").slice(0, 30) + " · 내 순위 읽기 " + mineCalls);
check("티어는 누적 점수로", rk[0].querySelector(".rk__t").textContent === String(Math.min(10, B.tierOf(100000))) &&
      rk[99].querySelector(".rk__t").textContent === String(Math.min(10, B.tierOf(100000 - 99 * 100))), rk[0].querySelector(".rk__t").textContent);
/* 서버가 판을 고쳤다(누가 별명을 바꾸고 점수를 땀) — 다시 안 열어도 바로 바뀐다 */
const b2 = mkBoard(); b2.all.rows[2] = { u: "p2", n: "조프로", s: 100000 - 200 };
feed(b2); await wait(20);
rk = q("#rkList").querySelectorAll(".rk__r");
check("**판이 바뀌면 열어 둔 화면이 곧바로 바뀐다** (다시 열지 않아도)", rk[2].querySelector(".rk__n").textContent === "조프로" && calls === 0,
      rk[2].querySelector(".rk__n").textContent);
q('#rkTabs button[data-k="week"]').click(); await wait(20);
rk = q("#rkList").querySelectorAll(".rk__r");
check("주간 탭 — 같은 판에서(안 읽음)", rk.length === 2 && rk[0].querySelector(".rk__n").textContent === "주간왕" && watches === 1 && calls === 0);
check("주간 티어도 누적 점수로(주간 점수 500 이 아니라 누적 30000)", rk[0].querySelector(".rk__t").textContent === String(Math.min(10, B.tierOf(30000))) && B.tierOf(30000) !== B.tierOf(500));
q('#rkTabs button[data-k="month"]').click(); await wait(20);
check("딱지가 지난 달인 월간 판은 빈 판으로", q("#rkList").querySelectorAll(".rk__r").length === 0 && (q("#rkList").textContent || "").includes("아직 기록이 없습니다"));
/* 판 밖 */
const b3 = mkBoard(); b3.all.rows = b3.all.rows.filter(r => r.u !== "me");
q('#rkTabs button[data-k="all"]').click(); await wait(20);
mineCalls = 0;
feed(b3); await wait(50);
check("판 밖이면 내 순위를 한 번 센다", mineCalls === 1 && q("#rkMe").querySelector(".rk__no") !== null, "읽기 " + mineCalls);
q('#rkTabs button[data-k="week"]').click(); await wait(20);
q('#rkTabs button[data-k="all"]').click(); await wait(20);
feed(b3); await wait(20);
check("탭을 오가거나 판이 바뀌어도 다시 안 센다", mineCalls === 1, "읽기 " + mineCalls);
window.__leaveRank && window.__leaveRank();
check("**화면을 떠나면 그만 본다**", unwatched >= 1, unwatched + "번");
/* 판이 아직 없거나(서버 미배포) 못 읽으면(규칙 미배포) 예전 방식 */
window.__watchBoard = cb => { cb(null); return () => {}; };
window.__topScores = async () => { calls++; return rows.map(r => Object.assign({}, r)); };
calls = 0;
window.__bootRank(); await wait(50);
check("**판이 없으면 예전 방식으로 — 랭킹이 비지 않는다**", calls === 1 && q("#rkList").querySelectorAll(".rk__r").length === 3, "읽기 " + calls);
window.__watchBoard = cb => { cb(undefined, Object.assign(new Error("Missing or insufficient permissions."), { code: "permission-denied" })); return () => {}; };
calls = 0; console.warn = () => {};
window.__bootRank(); await wait(50);
console.warn = warn0;
check("판을 못 읽어도(규칙 미배포) 예전 방식으로 — 한 번만 읽는다", calls === 1 && q("#rkList").querySelectorAll(".rk__r").length === 3, "읽기 " + calls);

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
