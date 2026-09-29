/* **뽑기 잔상** — 새 방으로 들어갈 때 앞 방의 뽑기 화면이 보이는가.

   2026-09-29 신고: "방 대기실에 있다가 카드뽑기로 들어갈 때 전에 하던 카드뽑기
   잔상이 0.5초쯤 나왔다가 지금 방 카드뽑기로 바뀐다."

   원인: `nav.js` 의 대기실 시작 단추가 누르는 **즉시** `go("draw")` 를 했다.
   그때는 아직 새 판이 없어서 뽑기 화면이 **앞 판의 `window.GAME`** 으로 그려졌다.
   재현(8인 방 6명 -> 나감 -> 4인 방 시작):
     +5203ms  draw · 자리6 (앞 방 사람들)   <- 잔상
     +5340ms  draw · 자리4 (지금 방 사람들)
   `room.js` 가 `e.stopImmediatePropagation()` 으로 막으려 했지만, 그 앞에
   `await window.spendTicket()` 이 있어 **이벤트가 이미 다 퍼진 뒤**라 소용없었다.

   고친 뒤: 화면 넘기기는 `flow.js` 의 `openTable()` 이 한다 —
   엔진이 새 판의 첫 상태를 받은 뒤에만 `goto("draw")`.

   **이 검사는 진짜 단추를 누른다.** `__startRound()` 를 직접 부르면 nav 의
   단추 처리기가 안 돌아서 사용자가 겪는 길을 안 지나간다 —
   그게 앞선 검사들이 이 버그를 놓친 이유다.

   서버가 있어야 한다 (`ZOO_SERVER`, 기본 http://127.0.0.1:8000).
   쓰는 법:  node test/drawghost.test.mjs   */

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

let SRV = process.env.ZOO_SERVER || "http://127.0.0.1:8000";
try { await fetch(SRV + "/zoo/health"); }
catch(e){
  console.log("\n서버가 없어 건너뜁니다 (" + SRV + ")\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}

ensureBuild();
const srv = await serve(5942);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((s) => {
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  globalThis.__ZOO_TEST = true; globalThis.__ZOO_SERVER = s;
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
}, SRV);
await page.reload({ waitUntil: "networkidle0" });
/* 티켓에 막히지 않게 한다 — 여기서 보려는 것은 화면 전환이다 */
await page.evaluate(() => { window.spendTicket = async () => true; });

const api = async (p, b) => { const r = await fetch(SRV + p, { method: b ? "POST" : "GET",
  headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text(); if (!r.ok) throw new Error(p + " " + t); return t ? JSON.parse(t) : {}; };
const now = () => page.evaluate(() => (document.querySelector(".page.is-on") || {}).id);

/* 프레임마다 뽑기 화면의 모습을 적는다 — 바뀔 때만 한 줄 */
const WATCH = `(() => {
  window.__fr = [];
  const tick = () => {
    const on = (document.querySelector(".page.is-on") || {}).id;
    const seats = [...document.querySelectorAll("#draw #seats .seat")]
      .map(s => (s.querySelector(".seat__n") || {}).textContent || "");
    const cards = document.querySelectorAll("#draw #deck .pk").length;
    const line = on + " | 자리" + seats.length + " " + seats.join(",") + " | 바닥" + cards;
    const last = window.__fr[window.__fr.length - 1];
    if (!last || last.line !== line) window.__fr.push({ t: Math.round(performance.now()), line });
    window.__raf = requestAnimationFrame(tick);
  };
  tick();
})()`;

async function makeAndStart(cap, waitFor){
  await page.evaluate(c => { window.__opts = { cap: c, seated: 1, rounds: 3, tax: false, clear2: false }; }, cap);
  await page.evaluate(async () => { await window.__createRoom(); });
  await page.evaluate(() => window.__goto("room"));
  const code = await page.evaluate(() => window.__roomCode());
  /* **화면의 시작 단추가 열릴 때까지** 기다린다. 서버 인원만 보고 누르면
     화면이 아직 못 따라와 단추가 잠겨 있다 */
  for (let i = 0; i < 120; i++){
    await nap(300);
    const ok = await page.evaluate(() => {
      const b = document.querySelector("#room #action .btn-primary");
      return Boolean(b && !b.disabled);
    });
    const n = (await api(`/zoo/rooms/${code}`)).players.filter(p => p.name).length;
    if (ok && n >= waitFor) break;
  }
  await nap(600);
  /* **진짜 단추를 누른다** */
  await page.evaluate(() => {
    const b = document.querySelector("#room #action .btn-primary");
    if (b) b.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  return code;
}

/* ---- 방 A: 8인으로 만들어 덜 찬 채로 시작 ---- */
const aCode = await makeAndStart(8, 6);
await nap(2500);
check("앞 방(A)이 뽑기 화면까지 갔다", (await now()) === "draw", "화면 " + (await now()));
const aSeats = await page.evaluate(() =>
  [...document.querySelectorAll("#draw #seats .seat")].map(s => (s.querySelector(".seat__n") || {}).textContent || ""));
check("A 뽑기가 진짜 방 사람들로 그려졌다", aSeats.length >= 4 && aSeats[0] === "나",
      aSeats.length + "자리 " + JSON.stringify(aSeats));

/* ---- 나가서 새 방(B)을 만든다 ---- */
await page.evaluate(() => { if (window.__leaveRoom) window.__leaveRoom(); window.__goto("lobby"); });
await nap(1200);
check("나와서 로비로 갔다", (await now()) === "lobby", "화면 " + (await now()));

await page.evaluate(WATCH);
await makeAndStart(4, 4);
await nap(3000);
const fr = await page.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__fr; });
check("새 방(B)도 뽑기 화면까지 갔다", (await now()) === "draw", "화면 " + (await now()));

const aKey = aSeats.filter(Boolean).join(",");
const onDraw = fr.filter(f => f.line.startsWith("draw"));
const ghost = onDraw.filter(f => aKey && f.line.includes(aKey));
const t0 = fr.length ? fr[0].t : 0;
console.log("   뽑기 화면 프레임:");
onDraw.forEach(f => console.log("     +" + String(f.t - t0).padStart(6) + "ms  " + f.line));

check("**앞 방의 뽑기 화면이 한 프레임도 안 보인다**", ghost.length === 0,
      ghost.length ? ghost.length + "프레임 동안 보임 — " + JSON.stringify(aKey)
                   : "A 자리줄 " + JSON.stringify(aKey) + " 안 나옴");
check("들어서자마자 지금 방 사람들이다", onDraw.length > 0 && !onDraw[0].line.includes(aKey),
      onDraw.length ? onDraw[0].line : "뽑기 프레임 없음");

shut(srv, browser);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
