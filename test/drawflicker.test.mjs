/* 대기실·뽑기 화면에서 **프로필이 깜빡이는가**.

   2026-09-28 사용자 신고: 방에 8명이 앉아 있다가 시작하면, 카드 뽑으러 들어갈 때
   나 빼고 7명 프로필이 깜빡인다.

   원인: `draw.js` 의 `renderSeats()` 가 **매번 `box.innerHTML = ""` 로 자리를 통째로
   지우고 새로 만든다.** 뽑기 화면은 남은 시간 때문에 1초마다, 그리고 엔진이 새 상태를
   보낼 때마다 다시 그린다. 그때마다 얼굴 `<span>` 이 새로 생기고 브라우저가
   배경 그림을 다시 불러오면서 **번쩍인다.**
   판 화면(table.js)에서 같은 문제를 먼저 고쳤는데 뽑기 화면은 그대로였다.

   여기서 보는 것:
     - 자리를 처음 세운 뒤로는 **얼굴 요소를 다시 만들지 않는다**
     - 자리 요소 자체도 다시 만들지 않는다
     - 그러면서도 뽑은 카드 숫자·차례 표시는 제대로 바뀐다

   쓰는 법:  node test/drawflicker.test.mjs   */

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

ensureBuild();
const srv = await serve(5889);
const { browser, page } = await open({ srv });
/* 서버가 있으면 8인으로, 없으면 이 기기 방(4인)으로 — 자리 수만 다르고 자리는 같다 */
let SRV = process.env.ZOO_SERVER || "http://127.0.0.1:8000";
try { await fetch(SRV + "/zoo/health"); } catch(e){ SRV = ""; }
await page.evaluateOnNewDocument((s) => {
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  globalThis.__ZOO_TEST = true; globalThis.__ZOO_SERVER = s;
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
}, SRV);
await page.reload({ waitUntil: "networkidle0" });
const now = () => page.evaluate(() => (document.querySelector(".page.is-on") || {}).id);

/* 8인 방을 만들고 자리를 다 채운 뒤 시작한다 — 사용자가 본 상황 그대로 */
await page.evaluate(() => { window.__opts = { cap: 8, seated: 1, rounds: 3, tax: false, clear2: false }; });
await page.evaluate(async () => { await window.__createRoom(); });
await page.evaluate(() => window.__goto("room"));
await nap(600);                       /* 첫 그리기는 끝났다 — 여기서부터 다시 만드는지 본다 */
const WATCH = `(() => {
  window.__avNew = 0; window.__seatNew = 0;
  if (window.__moD) window.__moD.disconnect();
  window.__moD = new MutationObserver(ms => {
    ms.forEach(m => m.addedNodes && m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      const cl = n.classList;
      if (cl && cl.contains("seat__av")) window.__avNew++;
      else if (n.querySelector && n.querySelector(".seat__av")) window.__avNew++;
      if (cl && cl.contains("seat")) window.__seatNew++;
    }));
  });
  window.__moD.observe(document.querySelector(SEL), { childList: true, subtree: true });
})()`;
await page.evaluate(WATCH.replace("SEL", '"#room #seats"'));
for (let i = 0; i < 80; i++){
  /* **자리를 다 채우고 시작한다.** 4명일 때 시작하면 뽑기 화면 자리가 4개뿐이라
     8자리에서만 나는 것을 못 본다 (실제로 4자리로만 재고 있었다) */
  if (await page.evaluate(() => (window.__opts && window.__opts.seated) || 0) >= (SRV ? 8 : 4)) break;
  await nap(300);
}
await nap(800);
const roomGot = await page.evaluate(() => ({ av: window.__avNew, seat: window.__seatNew,
  n: document.querySelectorAll("#room #seats .seat").length }));
check("**대기실에서 얼굴 그림을 다시 붙이지 않는다**", roomGot.av === 0,
      "사람이 들어오는 동안 " + roomGot.av + "번 새로 생김 (자리 " + roomGot.n + ")");
check("**대기실 자리 자체를 다시 만들지 않는다**", roomGot.seat === 0,
      roomGot.seat + "번 새로 생김");
await page.evaluate(async () => { await window.__startRound(); });
await nap(900);
check("뽑기 화면에 들어왔다", (await now()) === "draw", "화면 " + (await now()));
if ((await now()) !== "draw"){ shut(srv, browser); process.exit(1); }

const seatCount = await page.evaluate(() => document.querySelectorAll("#draw #seats .seat").length);
check("자리가 그려졌다", seatCount >= (SRV ? 8 : 4), seatCount + "자리" + (SRV ? " (서버 대전)" : " (이 기기 방)"));

/* 여기서부터 **다시 만드는지** 지켜본다.
   자리를 처음 세우는 것은 이미 끝났다 — 지금부터 새로 생기면 그게 깜빡임이다 */
await page.evaluate(WATCH.replace("SEL", '"#draw #seats"'));

/* 다시 안 그린다고 화면이 멈춰 있으면 안 된다 — 가운데 안내(남은 시간)는 바뀌어야 한다 */
const mid0 = await page.evaluate(() => (document.querySelector("#draw #mid") || {}).textContent || "");
/* 3초 — 남은 시간이 세 번 줄고 봇들이 카드를 집는다. 그때마다 다시 그린다 */
await nap(3200);
const mid1 = await page.evaluate(() => (document.querySelector("#draw #mid") || {}).textContent || "");
const got = await page.evaluate(() => ({ av: window.__avNew, seat: window.__seatNew,
  taken: document.querySelectorAll("#draw .pk.taken").length,
  chips: document.querySelectorAll("#draw #seats .seat__d").length }));

check("**얼굴 그림을 다시 붙이지 않는다**", got.av === 0, "3.2초 동안 " + got.av + "번 새로 생김");
check("**자리 자체를 다시 만들지 않는다**", got.seat === 0, "3.2초 동안 " + got.seat + "번 새로 생김");
check("그래도 화면은 계속 갱신된다", mid0 !== mid1 || got.taken > 0,
      JSON.stringify(mid0.slice(0, 24)) + " → " + JSON.stringify(mid1.slice(0, 24)));

shut(srv, browser);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
