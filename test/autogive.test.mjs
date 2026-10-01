/* 세금을 대신 낼 때 — **사람 자리는 카멜레온을 빼고 큰 숫자부터, 봇은 예전 그대로.**
   (2026-09-30 결정: "카멜레온은 빼고 큰숫자로줘")

   이 기기에서 사람 자리를 대신 내는 길은 둘이다.
     엔진  자동치기를 켜 둔 내 자리 (engine.js 의 세금 대리)
     흐름  판에 들어설 때 안 낸 세금 · 엔진이 거부할 세금을 대신 내기 (flow.js giveAuto)
   세금 화면에서 시간이 다 됐을 때는 tax.test.mjs 가 본다. 서버가 대신 낼 때는 zoo-server/givetest.js.

   손패가 무작위라 카멜레온을 쥐고 1·2등을 한 판이 나올 때까지 판을 돌린다.
   쓰는 법:  node test/autogive.test.mjs   (브라우저 없이 돈다) */
import { JSDOM } from "jsdom";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++;
  console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };
const wait = ms => new Promise(r => setTimeout(r, ms));

execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"),
  join(HERE, "_entry_seq.js"), "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty",
  "--define:import.meta.env.VITE_TEST_HOOKS=\"1\"", "--outfile=" + join(HERE, "_bundle_give.mjs"), "--log-level=warning",
], { cwd: ROOT, stdio: "inherit" });

const dom = new JSDOM("<!doctype html><html><body><div id='stage'></div></body></html>",
  { pretendToBeVisual: true, url: "http://localhost/" });
global.window = dom.window; global.document = dom.window.document;
global.Element = dom.window.Element; global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
window.__lang = "ko"; window.alert = () => {};
window.__opts = { cap: 4, rounds: 8, tax: true, clear2: false };

const B = await import("./_bundle_give.mjs");
const eng = B.eng;
B.flow.install({ goto: () => {}, myName: () => "나", botJoinMs: 5 });

const isJ = c => c >= 13;
const humanKey = c => (isJ(c) ? -1 : c);
const botKey = c => (isJ(c) ? 99 : c);
const top = (hand, need, key) => hand.slice().sort((a, b) => key(b) - key(a)).slice(0, need).sort((a, b) => a - b);
const S = a => JSON.stringify(a.slice().sort((x, y) => x - y));

const got = { engine: [], flow: [], bot: [] };
const enough = () => ["engine", "flow"].every(m => got[m].filter(s => s.hand.some(isJ)).length >= 2);

for (let game = 0; game < 30 && !enough(); game++){
  const mode = game % 2 ? "flow" : "engine";
  eng.startLocal({ numPlayers: 4, myID: "0", names: ["나", "A", "B", "C"], opts: { rounds: 8, tax: true } });
  eng.autoDraw();
  eng.engine.botMs = 2;
  eng.setAuto(true);
  let prev = "", snap = null, asked = false;
  for (let k = 0; k < 40000; k++){
    const st = eng.engine.client && eng.engine.client.store.getState();
    if (!st || st.ctx.gameover) break;
    const G = st.G, ph = st.ctx.phase;
    if (ph === "tax" && prev !== "tax"){
      snap = { hands: G.hands.map(h => h.slice()), order: G.taxOrder.slice() };
      asked = false;
      /* 흐름 쪽을 볼 판: 자동치기를 끄고(엔진이 대신 안 내게) 흐름에게 맡긴다 */
      if (mode === "flow"){ eng.setAuto(false); window.__taxGive = null; window.__taxPending = null; }
    }
    if (ph === "tax" && mode === "flow"){
      const v = eng.engine.view;
      if (v && v.canDeclare) eng.passRev();
      /* 엔진이 거부할 세금(손에 없는 카드)을 보내면 흐름이 대신 낸다 */
      if (v && v.taxGive > 0 && !asked){ asked = true; window.__setTaxGive([999]); }
    }
    if (prev === "tax" && ph !== "tax" && snap){
      if (!G.taxCancelled && G.taxOn){
        const o = snap.order;
        [o[0], o[1]].forEach(s => {
          const g = (G.given || {})[s];
          if (!Array.isArray(g)) return;
          const need = s === o[0] ? 2 : 1;
          const row = { hand: snap.hands[s], need, given: g.slice() };
          if (s === 0) got[mode].push(row); else got.bot.push(row);
        });
      }
      snap = null;
      if (mode === "flow") eng.setAuto(true);
    }
    prev = ph;
    await wait(1);
  }
  eng.stop();
}

for (const m of ["engine", "flow"]){
  const rows = got[m];
  const withJ = rows.filter(s => s.hand.some(isJ));
  const wrong = rows.filter(s => S(s.given) !== S(top(s.hand, s.need, humanKey)));
  const label = m === "engine" ? "자동치기(엔진)" : "대신 내기(흐름)";
  console.log("\n=== " + label + " ===");
  check("카멜레온을 쥐고 1·2등을 한 판이 있다 (이게 없으면 아래 확인은 뜻이 없다)", withJ.length >= 2,
    withJ.length + "번 / 전체 " + rows.length + "번");
  check("내 자리는 카멜레온을 빼고 큰 숫자부터 나간다", rows.length > 0 && wrong.length === 0,
    wrong.slice(0, 2).map(s => "손 " + JSON.stringify(s.hand) + " 나감 " + JSON.stringify(s.given)).join(" · "));
}
console.log("\n=== 봇 ===");
const bw = got.bot.filter(s => S(s.given) !== S(top(s.hand, s.need, botKey)));
check("봇은 예전대로 (카멜레온부터)", got.bot.length > 0 && bw.length === 0,
  got.bot.length + "번" + (bw.length ? " · " + JSON.stringify(bw[0]) : ""));
check("봇이 카멜레온을 낸 판이 있다", got.bot.some(s => s.given.some(isJ)));

console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
