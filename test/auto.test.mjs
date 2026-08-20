/* 자동치기 검사.
   "자동" 을 한 번 누르면 손대지 않아도 게임이 끝까지 가야 한다.
   그리고 카드를 직접 만지면 저절로 꺼져야 한다. */
import { JSDOM } from "jsdom";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"),
  join(HERE, "_entry.js"), "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty", "--outfile=" + join(HERE, "_bundle_auto.mjs"), "--log-level=warning",
], { cwd: ROOT, stdio: "inherit" });

const dom = new JSDOM("<!doctype html><html><body><div id='stage'><section class='page is-on' id='table'></section></div></body></html>",
  { pretendToBeVisual: true, url: "http://localhost/" });
global.window = dom.window; global.document = dom.window.document;
global.Element = dom.window.Element; global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
window.__lang = "ko"; window.__opts = { cap: 4, rounds: 3, tax: true, clear2: false };

const B = await import("./_bundle_auto.mjs");
const eng = B.eng;
document.getElementById("table").innerHTML = B.MARKUP.table;
eng.startLocal({ numPlayers: 4, myID: "0", names: ["나","A","B","C"], opts: { rounds: 3, tax: true } });
eng.engine.botMs = 6;
B.mountTable(document.getElementById("table"));
await wait(80);

const q = s => document.querySelector("#table " + s);
check("자동 단추가 있다", Boolean(q("#auto")), q("#auto") ? q("#auto").textContent : "없음");

/* 1. 눌러서 켠다 */
q("#auto").click();
check("누르면 켜진다", eng.engine.auto === true, q("#auto").textContent);

/* 2. 손대지 않고 둔다. 내 손패가 저절로 줄어야 한다 */
const before = eng.engine.view.hand.length;
let moved = 0;
for (let i = 0; i < 600; i++){
  const v = eng.engine.view;
  if (!v) { await wait(10); continue; }
  if (v.phase === "tax"){                    /* 세금은 화면이 맡는 부분이라 대신 내 준다 */
    if (v.canDeclare) eng.declareRev();
    if (v.taxGive > 0){
      const h = v.hand.slice().sort((a,b) => (b>=13?99:b)-(a>=13?99:a));
      eng.give(h.slice(0, v.taxGive));
    }
    await wait(10); continue;
  }
  if (v.hand.length < before) moved++;
  if (v.over) break;
  await wait(10);
}
check("손대지 않아도 내 카드가 나갔다", moved > 0, "줄어든 것을 " + moved + "번 확인");
const v2 = eng.engine.view;
check("게임이 끝까지 갔다", Boolean(v2 && v2.over),
      v2 ? ("판 " + v2.roundNo + " / " + (v2.over ? "끝" : "진행중")) : "상태 없음");
if (v2 && v2.over){
  const sum = v2.over.score.reduce((a,b) => a+b, 0);
  check("점수 합계", sum === 570, sum + " (기대 570)");
}

/* 3. 카드를 만지면 꺼진다 */
eng.stop();
eng.startLocal({ numPlayers: 4, myID: "0", names: ["나","A","B","C"], opts: { rounds: 3, tax: true } });
eng.engine.botMs = 3000;
await wait(60);
eng.setAuto(false);                       /* 앞 판에서 켜 둔 것을 내린다 */
q("#auto").click();
check("다시 켜진다", eng.engine.auto === true);
for (let i = 0; i < 300 && !eng.engine.view.myTurn; i++) await wait(20);
const slot = q("#hand") ? q("#hand").querySelector(".slot") : null;
if (slot) slot.click();
check("카드를 만지면 꺼진다", eng.engine.auto === false, q("#auto").textContent);
eng.stop();

/* 4. 시간이 다 되면 그 턴은 넘기고, 다음 턴부터 자동치기로 */
window.__turnSec = 1;                      /* 검사에서는 1초로 줄인다 */
eng.startLocal({ numPlayers: 4, myID: "0", names: ["나","A","B","C"], opts: { rounds: 3, tax: true } });
eng.engine.botMs = 40;
eng.setAuto(false);
if (window.__bootTable) window.__bootTable();
await wait(60);

let sawMyTurn = false;
for (let i = 0; i < 400; i++){
  const v = eng.engine.view;
  if (v && v.phase === "play" && v.myTurn) sawMyTurn = true;
  if (eng.engine.auto) break;
  await wait(50);
}
check("내 차례가 오긴 했다", sawMyTurn);
check("15초(검사에선 1초)가 지나면 자동치기로 넘어간다", eng.engine.auto === true,
      q("#auto").textContent);

/* 그 뒤로도 게임이 굴러가는지 */
const h0 = eng.engine.view.hand.length;
for (let i = 0; i < 400; i++){
  const v = eng.engine.view;
  if (!v) { await wait(20); continue; }
  if (v.phase === "tax"){
    if (v.canDeclare) eng.declareRev();
    if (v.taxGive > 0){
      const h = v.hand.slice().sort((a,b) => (b>=13?99:b)-(a>=13?99:a));
      eng.give(h.slice(0, v.taxGive));
    }
  }
  if (v.hand.length < h0) break;
  await wait(20);
}
check("넘어간 뒤에도 내 카드가 나간다", eng.engine.view.hand.length < h0,
      h0 + " → " + eng.engine.view.hand.length);
eng.stop();
delete window.__turnSec;

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
