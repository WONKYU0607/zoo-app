/* 랭킹판 지켜보기 — 진짜 앱 화면 전환으로 (2026-11-01 "랭킹 변동이 생기면 바뀌면되잖아")

   rank.test 는 화면 하나만 세워 본다. 여기서는 **진짜 앱(index.html · nav.js 의 go())** 에서
     - 랭킹 화면에 들어가면 판(board/top)을 지켜보기 시작한다(한 번)
     - 탭을 오가도 다시 지켜보지 않는다(안 읽는다)
     - **랭킹 화면을 떠나면(로비·상점·하단 탭) 그만 본다** — 안 보는 동안 판이 바뀌어도 안 읽게
     - 다시 들어오면 다시 지켜본다
     - 열어 둔 동안 판이 바뀌면 곧바로 화면이 바뀐다
   쓰는 법:  node test/rankwatch.test.mjs */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5797);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("zk_lang", "ko"); } catch(e){} });
await page.reload({ waitUntil: "networkidle0" });
await page.evaluate(() => {
  window.__w = { watch: 0, stop: 0, feed: null };
  const rows = Array.from({ length: 120 }, (_, i) => ({ u: "p" + i, n: "사람" + i, s: 50000 - i * 100 }));
  window.__mkBoard = (name2) => { const r = rows.map(x => Object.assign({}, x)); if (name2) r[2].n = name2;
    return { ver: 1, all: { rows: r, cut: false }, wk: { key: "x", rows: [], cut: false }, mo: { key: "x", rows: [], cut: false } }; };
  window.__watchBoard = cb => { window.__w.watch++; window.__w.feed = cb; cb(window.__mkBoard()); return () => { window.__w.stop++; }; };
  window.__topScores = async () => { window.__w.legacy = (window.__w.legacy || 0) + 1; return []; };
});
const W = () => page.evaluate(() => ({ watch: window.__w.watch, stop: window.__w.stop, legacy: window.__w.legacy || 0 }));
const go = async id => { await page.evaluate(i => window.__goto(i), id); await wait(400); };

await go("lobby");
await go("rank");
let w = await W();
const n1 = await page.evaluate(() => document.querySelectorAll("#rank #rkList .rk__r").length);
check("랭킹 화면에 들어가면 판을 지켜본다(한 번)", w.watch === 1 && w.stop === 0, JSON.stringify(w));
check("**100위까지 그려진다** (예전 방식 읽기 없음)", n1 === 100 && w.legacy === 0, n1 + "줄");
await page.evaluate(() => { document.querySelector('#rank [data-k="week"]').click(); });
await wait(150);
await page.evaluate(() => { document.querySelector('#rank [data-k="all"]').click(); });
await wait(150);
w = await W();
check("탭을 오가도 다시 지켜보지 않는다", w.watch === 1, JSON.stringify(w));
await page.evaluate(() => window.__w.feed(window.__mkBoard("조프로")));
await wait(150);
const third = await page.evaluate(() => document.querySelectorAll("#rank #rkList .rk__r")[2].querySelector(".rk__n").textContent);
check("**열어 둔 동안 판이 바뀌면 곧바로 바뀐다**", third === "조프로", third);
await go("lobby");
w = await W();
check("**랭킹 화면을 떠나면 그만 본다**", w.stop === 1, JSON.stringify(w));
await go("shop");
w = await W();
check("다른 화면끼리 옮겨도 다시 안 본다", w.watch === 1 && w.stop >= 1, JSON.stringify(w));
await go("rank");
w = await W();
check("다시 들어오면 다시 지켜본다", w.watch === 2, JSON.stringify(w));
await go("lobby");
w = await W();
check("또 떠나면 또 그만 본다", w.stop >= 2, JSON.stringify(w));

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
