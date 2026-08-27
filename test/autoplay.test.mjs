/* 자동치기가 **서버 대전에서 카드를 내는가**.

   "자동 ON 을 켰는데 계속 패스만 한다" 는 신고가 있었다.
   이 기기 판에서는 판 상태가 다 보이지만, 서버 대전은 남의 손패가 가려져
   들어온다. 그 가려진 상태를 잘못 읽으면 낼 수 있는데도 못 찾아 패스한다.

   엔진이 실제로 둔 수(`engine.moveLog`)를 정답으로 삼는다. 소리나 화면이 아니라
   **엔진이 뭘 뒀는지**를 봐야 "자동이 정말 카드를 냈나" 를 알 수 있다.

   쓰는 법:  창1) cd zoo-server && node server.js
             창2) node test/autoplay.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

const SRV = process.env.ZOO_SERVER || "http://127.0.0.1:8000";
try { await fetch(SRV + "/zoo/health"); }
catch (e){ console.log("\n게임 서버가 안 떠 있어 건너뜁니다 (" + SRV + ")\n"); process.exit(0); }
if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};

ensureBuild();
const srv = await serve(5753);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((s) => {
  globalThis.__ZOO_SERVER = s;
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
}, SRV);
await page.reload({ waitUntil: "networkidle0" });

await page.evaluate(() => { window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false }; });
await page.evaluate(async () => { await window.__quickJoin(); });
await page.evaluate(() => window.__goto("room"));
const now = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);
for (let i=0;i<90;i++){ if (await page.evaluate(()=>(window.__opts&&window.__opts.seated)||0)>=4) break;
  await new Promise(r=>setTimeout(r,300)); }
await page.evaluate(async () => { await window.__startRound(); });
for (let k=0;k<120;k++){
  if (await now() === "table") break;
  await page.evaluate(() => {
    const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
    if (c) c.click();
    const g = document.querySelector("#draw #go");
    if (g && !g.disabled) g.click();
  });
  await new Promise(r=>setTimeout(r,400));
}
if (await now() !== "table"){ console.log("\n판 화면까지 못 갔습니다\n"); shut(srv, browser); process.exit(1); }
await new Promise(r=>setTimeout(r,800));

/* 자동치기를 켠다 */
await page.evaluate(() => {
  const b = document.querySelector("#table #auto");
  if (b && b.getAttribute("aria-pressed") !== "true") b.click();
});
check("자동치기가 켜졌다", await page.evaluate(() => Boolean(window.__eng.auto)));
await page.evaluate(() => { window.__mark = (window.__eng.moveLog||[]).length; });

/* 내가 카드를 낼 수 있었던 적이 몇 번이고, 그때 실제로 냈는가.
   "낼 수 있었다" 는 판단은 화면이 아니라 **내 손패와 바닥**으로 직접 한다 */
/* **내 차례인데 아무도 안 두고 흘러간 시간**을 잰다.
   "카드를 냈는가" 만 보면, 어쩌다 한 번 두고 나머지는 멈춰 있어도 통과한다.
   실제 고장은 "안 둔다" 였다 — 자동을 켜도 예약이 다시 안 잡혀 멈춰 있었고,
   15초 시간 넘김으로 패스만 되니 "패스만 한다" 로 보였다 */
let stuck = 0, worstStuck = 0, lastNo = -1;
for (let i = 0; i < 90; i++){
  await new Promise(r => setTimeout(r, 500));
  if (await now() !== "table") break;
  const st = await page.evaluate(() => {
    const v = window.__eng && window.__eng.view;
    return { myTurn: Boolean(v && v.myTurn), no: v ? v.moveNo : -1 };
  });
  if (st.myTurn && st.no === lastNo) stuck++; else stuck = 0;
  lastNo = st.no;
  if (stuck > worstStuck) worstStuck = stuck;
}
const log = await page.evaluate(() => (window.__eng.moveLog||[]).slice(window.__mark));
const mine = log.filter(m => m.by === 0);
const played = mine.filter(m => m.k === "play").length;
const passed = mine.filter(m => m.k === "pass").length;

console.log("  내가 둔 수: 냄 " + played + " · 패스 " + passed);
check("자동치기가 수를 두기는 한다", mine.length > 0, mine.length + "수");
check("자동치기가 카드도 낸다 (패스만 하지 않는다)", played > 0,
      "냄 " + played + " / 패스 " + passed);
/* 봇 생각 시간이 3초이므로 정상이면 6칸(3초) 안팎이다. 멈춰 있으면 계속 늘어난다 */
check("내 차례에서 멈춰 있지 않는다", worstStuck <= 10,
      "가장 오래 멈춘 것 " + (worstStuck * 0.5) + "초");

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
