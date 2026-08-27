/* 내가 패스했을 때 **내 프로필이 깜빡이지 않는가**.

   서버 대전은 내 화면이 먼저 반영하고 서버가 다시 확인해 준다.
   그 사이 **패스 표시가 없는 옛 상태가 한 번 더** 들어오는데,
   그대로 그리면 프로필이 어두워졌다 → 밝아졌다 → 다시 어두워진다.
   두 번 눌린 것처럼 보여서 실제로 그런 신고를 받았다.

   진짜 서버를 띄우고, 패스를 누른 뒤 내 자리 표시를 촘촘히 지켜본다.

   쓰는 법:  창1) cd zoo-server && node server.js
             창2) node test/passflicker.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

const SRV = process.env.ZOO_SERVER || "http://127.0.0.1:8000";
try { await fetch(SRV + "/zoo/health"); }
catch (e){
  console.log("\n게임 서버가 안 떠 있어 건너뜁니다 (" + SRV + ")\n");
  process.exit(0);
}
if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};

ensureBuild();
const srv = await serve(5741);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((s) => {
  globalThis.__ZOO_SERVER = s;
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
}, SRV);
/* **느린 인터넷을 흉내낸다.**
   되돌림은 "내 화면이 먼저 → 서버가 확인" 사이의 틈에서만 보인다.
   같은 컴퓨터의 서버는 왕복이 1ms 라 그 틈이 없어서, 빠른 인터넷으로 검사하면
   폰에서 나는 깜빡임을 절대 못 잡는다 (실제로 못 잡았다) */
const cdp = await page.createCDPSession();
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false, latency: 220, downloadThroughput: 1.5e6, uploadThroughput: 750e3,
});
await page.reload({ waitUntil: "networkidle0" });

await page.evaluate(() => { window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false }; });
await page.evaluate(async () => { await window.__quickJoin(); });
await page.evaluate(() => window.__goto("room"));
const now = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);
/* 자리가 다 찰 때까지 기다렸다가 시작한다 */
for (let i=0;i<90;i++){ if (await page.evaluate(()=>(window.__opts&&window.__opts.seated)||0)>=4) break;
  await new Promise(r=>setTimeout(r,300)); }
await page.evaluate(async () => { await window.__startRound(); });
/* 뽑기 화면: 한 장 집고 넘어간다 */
for (let k=0;k<120;k++){
  if (await now() === "table") break;
  await page.evaluate(() => {
    const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
    if (c) c.click();
    const g = document.querySelector("#draw #go");
    if (g && !g.disabled) g.click();
  });
  await new Promise(r=>setTimeout(r,300));
}
if (await now() !== "table"){
  console.log("\n판 화면까지 못 갔습니다\n"); shut(srv, browser); process.exit(1);
}

/* 내 자리(화면 0번)에 패스 표시가 붙어 있는가 */
const mine = () => page.evaluate(() => {
  const s = document.querySelectorAll("#table .seat")[0];
  return Boolean(s && s.classList.contains("seat--pass"));
});
/* 내 차례이고 패스를 누를 수 있을 때까지 기다린다 */
async function ready(){
  for (let i = 0; i < 200; i++){
    const ok = await page.evaluate(() => {
      const v = window.__eng && window.__eng.view;
      const b = document.querySelector("#table #pass");
      return Boolean(v && v.myTurn && v.pile && b && !b.disabled);
    });
    if (ok) return true;
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}

let tried = 0, flicker = 0, never = 0;
const delays = [], rebuilds = [];
for (let round = 1; round <= 12 && tried < 3; round++){
  if (await ready() === false) break;
  /* **진짜 손가락 신호로 눌러야 한다.** `.click()` 은 touchstart 를 안 만들어서
     손가락이 닿아 있는 동안의 처리(그리기 미루기)를 통째로 건너뛴다.
     그것 때문에 폰에서만 나는 지연을 못 잡은 적이 있다 */
  {
    const p = await page.evaluate(() => {
      const b = document.querySelector("#table #pass");
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y }] });
    await new Promise(r => setTimeout(r, 70));
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  tried++;
  /* 누른 직후부터 촘촘히 본다. 되돌림은 서버 왕복 사이에 잠깐 스친다 */
  /* 자리 요소가 몇 번이나 통째로 새로 만들어지는지 센다.
     클래스만 봐서는 안 보이지만, 프로필 그림이 매번 새로 붙으면
     폰에서는 한 번 번쩍이는 것으로 보인다 */
  await page.evaluate(() => {
    window.__rebuilds = 0;
    if (window.__mo) window.__mo.disconnect();
    window.__mo = new MutationObserver(ms => {
      ms.forEach(m => { if (m.removedNodes && m.removedNodes.length) window.__rebuilds++; });
    });
    window.__mo.observe(document.querySelector("#table #seats"), { childList: true });
  });
  const trickAt = await page.evaluate(() => window.__eng?.view?.trickNo);
  const t0 = Date.now();
  const seenOn = [];
  let shownAt = -1;
  for (let i = 0; i < 40; i++){
    const on = await mine();
    if (on && shownAt < 0) shownAt = Date.now() - t0;
    seenOn.push(on);
    await new Promise(r => setTimeout(r, 40));
  }
  delays.push(shownAt);
  rebuilds.push(await page.evaluate(() => window.__rebuilds));
  const first = seenOn.indexOf(true);
  if (first < 0){
    /* **내 패스가 그 바퀴를 끝내 버렸으면** 표시할 것이 없다.
       모두의 패스 표시가 그 자리에서 지워지므로 셈에서 뺀다 */
    const ended = await page.evaluate(t => (window.__eng?.view?.trickNo) !== t, trickAt);
    if (ended){ tried--; continue; }
    never++; continue;
  }
  /* 한 번 붙은 뒤 그 바퀴 안에서 떨어졌다가 다시 붙으면 깜빡인 것이다 */
  const after = seenOn.slice(first);
  const off = after.indexOf(false);
  if (off >= 0 && after.slice(off).includes(true)) flicker++;
  /* 다음 바퀴로 넘어가길 기다린다 */
  await new Promise(r => setTimeout(r, 900));
}

console.log("");
check("패스를 누르면 내 자리에 표시가 뜬다", tried > 0 && never === 0,
      tried + "번 중 안 뜬 것 " + never + " · 뜨기까지 " + delays.join("/") + "ms");
/* 누르자마자 떠야 한다. 늦게 뜨면 "안 먹었나?" 싶어 또 누르게 된다 */
const worst = Math.max(...delays.filter(d => d >= 0), 0);
check("누르면 곧바로 뜬다 (400ms 안)", delays.length > 0 && worst <= 400, "가장 늦은 것 " + worst + "ms");
check("뜬 뒤에 깜빡이지 않는다", flicker === 0, tried + "번 중 깜빡임 " + flicker);

/* **프로필 그림이 다시 붙으면 폰에서 한 번 번쩍인다.**
   클래스만 지켜봐서는 안 보이므로 요소가 다시 만들어졌는지로 본다 */
check("자리 요소를 다시 만들지 않는다", rebuilds.every(n => n === 0),
      "패스 뒤 1.6초 동안 " + rebuilds.join(" / ") + "번");

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
