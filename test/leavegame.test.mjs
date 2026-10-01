/* 판에서 나가면 **그 판의 화면이 정말로 물러나는가.**

   2026-09-28 사용자 신고:
     "방 하나 파서 게임 시작 → 나감 → 바로 새 방을 파서 게임 시작 →
      전에 있던 게임 소리가 들려온다."
     "카드 뽑기할 때 자꾸 전에 만들었던 방의 카드뽑기 잔상이 그려지고 나서
      다시 이번에 만든 방의 카드뽑기로 돌아온다."

   원인: `eng.stop()` 은 엔진만 접고 **화면에는 아무 말도 안 했다.**
   구독을 푸는 곳이 각 화면의 `boot()` 뿐이라, 다시 들어가기 전까지 아무도 안 풀었다.
   그래서 나간 뒤에도
     - 죽은 판 화면이 150ms 마다 스스로 다시 그리고 (`resetTimer` 의 되풀이)
     - 내 차례 시계가 계속 돌아 **로비에서 재촉 소리가 울리고**
       (손으로 재현함: 내 차례에 나가면 로비에서 `tick@lobby`)
     - 새 판이 첫 상태를 보내면 죽은 화면들이 그것까지 받아 그렸다
       (8인 방에서 나온 뒤 4인 방을 만들면 뽑기판이 8자리로 한 번 그려짐)

   고친 방법: `eng.stop()` 이 `onGone` 으로 화면들에게 알린다.
   화면은 그 자리에서 구독과 시계를 끄고 다음 `boot()` 까지 조용히 있는다.

   여기서 재는 것은 **"나간 판 화면을 손대는가"** 하나다. 소리도 잔상도 뿌리가 같고,
   이것은 내 차례가 언제 오는지와 상관없이 늘 같은 값이 나온다.
   ("내 차례 시계가 돌 때 나가서 소리를 듣는" 방식도 만들어 봤는데, 내 차례가
    언제 오는지가 뽑기 결과에 달려 있어 검사가 흔들려서 걷어냈다)

   쓰는 법:  창1) cd zoo-server && node server.js      (없으면 이 기기 방으로 한다)
             창2) node test/leavegame.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

if (!(await findBrowser())){
  console.log("\n크롬이 없어 건너뜁니다\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));

/* 서버가 있으면 서버 대전으로, 없으면 이 기기 방으로 — 둘 다 같은 자리다 */
let SRV = process.env.ZOO_SERVER || "http://127.0.0.1:8000";
try { await fetch(SRV + "/zoo/health"); } catch(e){ SRV = ""; }

ensureBuild();
const srv = await serve(5876);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((s) => {
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  globalThis.__ZOO_TEST = true; globalThis.__ZOO_SERVER = s;
  window.__snd = [];
  HTMLMediaElement.prototype.play = function(){
    const m = (this.currentSrc || this.src || "").match(/snd\/([a-z_0-9]+)\.webm/);
    window.__snd.push({ k: m ? m[1] : "?", on: (document.querySelector(".page.is-on") || {}).id });
    return Promise.resolve();
  };
}, SRV);
await page.reload({ waitUntil: "networkidle0" });
const now = () => page.evaluate(() => (document.querySelector(".page.is-on") || {}).id);

async function toTable(cap){
  await page.evaluate(c => { window.__opts = { cap: c, seated: 1, rounds: 3, tax: false, clear2: false }; }, cap);
  await page.evaluate(async () => { await window.__createRoom(); });
  await page.evaluate(() => window.__goto("room"));
  await nap(900);
  /* 서버는 4명이 앉기 전에는 시작을 받지 않는다(방장 화면의 단추도 잠겨 있다).
     예전 서버는 이 확인이 빠져 있어서 봇이 덜 앉은 채로도 시작됐다 */
  for (let k = 0; k < 80; k++){
    if (await page.evaluate(() => ((window.__opts || {}).seated || 0) >= 4)) break;
    await nap(250);
  }
  await page.evaluate(async () => { await window.__startRound(); });
  for (let k = 0; k < 60; k++){
    if (await now() === "table") break;
    await page.evaluate(() => {
      const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
      if (c) c.click();
      const g = document.querySelector("#draw #go");
      if (g && !g.disabled) g.click();
    });
    await nap(350);
  }
  return now();
}

console.log("\n=== 첫 게임 → 판까지 ===");
check("판 화면까지 갔다", (await toTable(4)) === "table",
      "화면 " + (await now()) + (SRV ? " (서버 대전)" : " (이 기기 방)"));
if ((await now()) !== "table"){ shut(srv, browser); process.exit(1); }
await nap(1500);                      /* 손패가 깔리고 시계가 걸릴 시간 */

console.log("\n=== 판에서 나가기 ===");
/* **나가면 완주 실패로 기록되는가.**
   `table.js` 가 붙여 둔 `__quitGame`(점수 절반)을 `flow.js` 가 덮어써서
   나가기를 눌러도 아무것도 기록되지 않았다 — 확인창은 "완주 실패로 기록됩니다"
   라고 하는데 실제로는 0점이었고 판수도 안 늘었다.
   진짜로 올리지는 않고(계정 서버를 건드리지 않게) **불렸는지만** 본다.
   절반으로 깎는 계산 자체는 `rank.test.mjs` 가 본다 */
await page.evaluate(() => {
  window.__reported = [];
  window.reportGame = (rank, players, earned, quit) => {
    window.__reported.push({ rank, players, earned, quit });
  };
});
await page.evaluate(() => window.__back());
await nap(300);
await page.evaluate(() => { const y = document.querySelector("#askYes"); if (y) y.click(); });
await nap(700);
check("로비로 나왔다", (await now()) === "lobby", "화면 " + (await now()));
check("엔진이 접혔다", await page.evaluate(() => !window.__eng.client));

const rep = await page.evaluate(() => window.__reported || []);
check("**나가면 완주 실패로 기록된다**", rep.length === 1 && rep[0].quit === true,
      JSON.stringify(rep));

/* 여기서부터 **판 화면과 뽑기 화면을 손대는지** 지켜본다.
   `#table`·`#draw` 자체의 class 는 화면 전환(is-on)이라 세지 않는다 */
await page.evaluate(() => {
  window.__snd = [];
  window.__redraw = 0;
  if (window.__moT) window.__moT.disconnect();
  window.__moT = new MutationObserver(ms => {
    window.__redraw += ms.filter(m =>
      !(m.type === "attributes" && (m.target.id === "table" || m.target.id === "draw"))).length;
  });
  ["#table", "#draw"].forEach(sel => window.__moT.observe(document.querySelector(sel),
    { childList: true, subtree: true, attributes: true }));
});
await nap(3000);
check("**나간 판 화면이 저 혼자 다시 그리지 않는다**",
      (await page.evaluate(() => window.__redraw)) === 0,
      (await page.evaluate(() => window.__redraw)) + "번");
check("로비에서 옛 판 소리가 안 난다",
      (await page.evaluate(() => (window.__snd || []).length)) === 0,
      JSON.stringify(await page.evaluate(() => (window.__snd || []).map(s => s.k + "@" + s.on))));

console.log("\n=== 바로 새 방을 만든다 ===");
/* 새 판이 첫 상태를 보내는 순간이 문제의 자리다.
   그때까지 **죽은 화면들은 한 번도 안 바뀌어야** 한다 — 뽑기 화면은
   자기 `boot()` 에서 비로소 새로 그린다 */
await page.evaluate(() => { window.__redraw = 0; window.__snd = []; });
await page.evaluate(() => { window.__opts = { cap: 4, seated: 1, rounds: 3, tax: false, clear2: false }; });
await page.evaluate(async () => { await window.__createRoom(); });
await page.evaluate(() => window.__goto("room"));
await nap(900);
for (let k = 0; k < 80; k++){                   /* 4명이 앉을 때까지 (위 toTable 설명) */
  if (await page.evaluate(() => ((window.__opts || {}).seated || 0) >= 4)) break;
  await nap(250);
}
const beforeStart = await page.evaluate(() => window.__redraw);
/* **뽑기 화면이 자기 boot 으로 다시 서는 그 순간**의 수를 잡는다.
   서버 방은 시작 뒤 서버 답이 늦게 와서 "시작 직후" 가 곧 boot 전이었다.
   이 기기 방은 시작과 **같은 순간에** 새 뽑기 화면까지 그려 버려서, 시작 직후에 재면
   새 화면이 정상으로 그린 것(95번)까지 죽은 화면이 움직인 것으로 셌다(2026-10-01 발견 —
   앱은 멀쩡, 재는 시점이 틀렸다). 그래서 boot 이 불리는 순간을 걸어 둔다.
   boot 이 아직 안 불렸으면(서버 방) 시작 직후 수를 그대로 쓴다 */
await page.evaluate(() => {
  window.__atBoot = null;
  const ob = window.__bootDraw;
  window.__bootDraw = function(){
    if (window.__atBoot == null) window.__atBoot = window.__redraw;
    return ob.apply(this, arguments);
  };
});
await page.evaluate(async () => { await window.__startRound(); });
const rightAfter = await page.evaluate(() => window.__atBoot != null ? window.__atBoot : window.__redraw);
check("**새 판을 세워도 죽은 화면은 안 움직인다**", rightAfter === beforeStart,
      "세우기 전 " + beforeStart + "번 → 직후 " + rightAfter + "번");

await nap(2500);
check("뽑기 화면에 있다", (await now()) === "draw", "화면 " + (await now()));
check("새 방에서 옛 판의 재촉·벨 소리가 안 난다",
      (await page.evaluate(() =>
        (window.__snd || []).filter(s => s.k === "tick" || s.k === "bell").length)) === 0,
      JSON.stringify(await page.evaluate(() =>
        (window.__snd || []).map(s => s.k + "@" + s.on))));

shut(srv, browser);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
