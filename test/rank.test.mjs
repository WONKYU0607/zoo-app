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

/* 랭킹은 탭마다 10분 동안 다시 쓴다 (2026-10-10) — 화면을 열 때마다 160명씩 읽지 않게 */
let calls = 0, mineCalls = 0;
window.__topScores = async () => { calls++; return rows; };
window.__myRank = async () => { mineCalls++; return { rank: 2, score: A.score, tier: 2 }; };
q('#rkTabs button[data-k="all"]').click();
await wait(50);
check("10분 안에 다시 연 탭은 새로 안 읽는다", calls === 0 && mineCalls === 0 &&
      q("#rkList").querySelectorAll(".rk__r").length === 3, "읽기 " + calls + "번");
window.__bootRank(); await wait(50);
check("화면을 다시 열어도 그대로 쓴다", calls === 0, "읽기 " + calls + "번");
A.score = 12500;
window.__bootRank(); await wait(50);
check("**내 점수가 바뀌면(판을 마치면) 10분 전이라도 새로 읽는다**", calls === 1 && mineCalls === 1, "읽기 " + calls + "번");
window.__bootRank(); await wait(50);
check("그다음엔 다시 10분 동안 그대로", calls === 1, "읽기 " + calls + "번");
const realNow = Date.now;
Date.now = () => realNow() + 10 * 60 * 1000 + 1000;
window.__bootRank(); await wait(50);
check("10분이 지나면 새로 읽는다", calls === 2, "읽기 " + calls + "번");
Object.assign(A, { uid: "other" });
window.__bootRank(); await wait(50);
check("계정이 바뀌면 새로 읽는다", calls === 3, "읽기 " + calls + "번");
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

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
