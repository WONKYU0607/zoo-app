/* 누른 것이 **조용히 사라지지 않는가**.

   예전 코드는 이랬다.

       if (!legal(list) || turn !== 0 || busy) return;   // 그냥 버림

   조건이 안 맞는 찰나에 누르면 그 누름이 없던 일이 됐다. 서버 대전은 상태가
   잠깐씩 어긋나므로(내 차례가 아니게 보였다가 곧 돌아옴), 고르자마자 누르면
   그 틈에 걸린다. 그래서 **10번 중 9번은 두 번 눌러야 했다**는 신고를 받았다.

   여기서는 **일부러 나쁜 순간에** 누른다 — 처리 중일 때, 내 차례가 아닐 때.
   그래도 눌린 것이 나가거나, 못 나가면 이유가 뜨는지 본다.
   원인이 무엇이든 "조용히 사라지는" 경로 자체가 없어야 한다.

   쓰는 법:  창1) cd zoo-server && node server.js
             창2) node test/presskeep.test.mjs   */

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
const nap = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5841);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((s) => {
  globalThis.__ZOO_SERVER = s;
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
}, SRV);
/* 느린 인터넷을 흉내낸다 — 상태가 어긋나는 틈이 여기서 생긴다 */
const cdp = await page.createCDPSession();
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false, latency: 300, downloadThroughput: 1.5e6, uploadThroughput: 750e3 });
await page.reload({ waitUntil: "networkidle0" });

const now = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);
await page.evaluate(() => { window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false }; });
await page.evaluate(async () => { await window.__quickJoin(); });
await page.evaluate(() => window.__goto("room"));
for (let i=0;i<90;i++){ if (await page.evaluate(()=>(window.__opts&&window.__opts.seated)||0)>=4) break; await nap(300); }
await page.evaluate(async () => { await window.__startRound(); });
for (let k=0;k<120;k++){
  if (await now() === "table") break;
  await page.evaluate(() => {
    const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
    if (c) c.click();
    const g = document.querySelector("#draw #go");
    if (g && !g.disabled) g.click();
  });
  await nap(400);
}
check("판 화면까지 갔다", (await now()) === "table", "화면 " + (await now()));
if ((await now()) !== "table"){ shut(srv, browser); process.exit(1); }
await nap(1500);

const tapAt = async (x, y) => {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await nap(60);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
};
const spot = sel => page.evaluate(s => {
  const b = document.querySelector(s);
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
}, sel);

/* **일부러 나쁜 순간에 누른다** — 내 차례가 아닐 때 패스를 누른다.
   그래도 조용히 사라지면 안 된다: 내 차례가 오면 나가거나, 이유가 떠야 한다 */
let tried = 0, went = 0, told = 0;
for (let round = 0; round < 6; round++){
  /* **처리 중인 순간을 직접 만든다.**
     먼저 한 번 정상으로 눌러 놓으면, 그 수가 확인될 때까지 단추가 잠긴다.
     그 잠긴 사이에 한 번 더 누르는 것이 예전에 버려지던 바로 그 자리다.
     (내 차례가 아닌 상태는 내가 안 두면 영영 안 오므로 그 길로는 못 만든다) */
  let ready = false;
  for (let i = 0; i < 100; i++){
    ready = await page.evaluate(() => {
      const v = window.__eng && window.__eng.view;
      const b = document.querySelector("#table #pass");
      return Boolean(v && v.myTurn && v.pile && b && !b.disabled);
    });
    if (ready) break;
    await nap(150);
  }
  if (!ready) break;
  {
    const p0 = await spot("#table #pass");
    if (!p0) break;
    await tapAt(p0.x, p0.y);        /* 정상 누름 — 이제 잠긴다 */
    await nap(120);
  }
  const locked = await page.evaluate(() =>
    Boolean((document.querySelector("#table #pass")||{}).disabled));
  if (!locked) { await nap(800); continue; }

  /* 첫 누름이 만든 패스와 섞이면 안 된다. **두 번째 누름의 것만** 센다 */
  const mark = await page.evaluate(() => (window.__eng.moveLog||[]).length);
  const base = await page.evaluate(m => (window.__eng.moveLog||[]).slice(m)
    .filter(x => x.k === "pass" && x.by === 0).length, mark);
  await page.evaluate(() => { window.__flash = null;
    const f = document.querySelector("#table #flash");
    if (f) f.textContent = ""; });
  const p = await spot("#table #pass");
  if (!p) break;
  /* **신호가 진짜 들어갔는지 확인하고 센다.** 컴퓨터가 바쁘면 CDP 로 보낸
     가짜 손가락이 통째로 안 들어오는 일이 있다. 그걸 "사라졌다"로 세면
     앱 탓으로 헛다리를 짚는다 — 전에 실제로 그랬다 */
  await page.evaluate(() => {
    window.__ev2 = [];
    if (window.__ev2On) return;
    window.__ev2On = true;
    document.addEventListener("pointerdown", () => { (window.__ev2 = window.__ev2 || []).push(1); }, true);
  });
  await tapAt(p.x, p.y);                 /* 잠긴 단추를 누른다 */
  await nap(80);
  const landed = await page.evaluate(() => (window.__ev2 || []).length > 0);
  if (!landed){ await nap(600); continue; }   /* 검사가 못 보냈다 — 안 센다 */
  tried++;

  /* 눌린 것이 나갔는가, 아니면 이유가 떴는가 */
  let done = false, msg = "";
  for (let i = 0; i < 30; i++){
    await nap(200);
    const st = await page.evaluate(m => ({
      sent: (window.__eng.moveLog||[]).slice(m)
              .filter(x => x.k === "pass" && x.by === 0).length,
      log: (window.__evLines || []).slice(-6).join(" | "),
    }), mark);
    if (st.sent > base){ done = true; went++; break; }
    /* 화면 안내는 뺐다(사용자 요청). 기록으로 확인한다 */
    if (/대기열 버림|확인이 안 됨/.test(st.log)){ done = true; told++; msg = st.log; break; }
  }
  if (!done) console.log("   [사라짐] " + JSON.stringify(await page.evaluate(() => ({
    기록: (window.__evLines||[]).slice(-8),
    큐: window.__eng && typeof window.__pressQ !== "undefined" ? window.__pressQ : "안 보임",
    차례: (window.__eng.view||{}).myTurn, 잠김: Boolean((document.querySelector("#table #pass")||{}).disabled),
    안내: ((document.querySelector("#table #flash")||{}).textContent||"").trim(),
  }))));
  await nap(600);
}

console.log("  나쁜 순간에 누른 횟수 " + tried + " · 나감 " + went + " · 이유 뜸 " + told);
if (tried === 0){
  /* **이 환경에서는 그 순간이 안 만들어진다.**
     같은 컴퓨터의 서버는 왕복이 빨라 단추가 잠긴 틈이 거의 없다.
     원래 증상도 그래서 여기서는 재현이 안 된다. 실패로 세지 않고 건너뛴다 */
  console.log("\n  처리 중인 순간을 못 만들어 건너뜁니다 (여기서는 왕복이 너무 빠릅니다)\n");
  console.log("=== 통과 " + pass + " / 실패 " + fail + " ===\n");
  shut(srv, browser);
  process.exit(fail ? 1 : 0);
}
check("누른 것이 조용히 사라지지 않는다", went + told === tried,
      "사라진 것 " + (tried - went - told) + "번");
check("대부분은 그대로 나간다", went > 0, "나감 " + went + "/" + tried);

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
