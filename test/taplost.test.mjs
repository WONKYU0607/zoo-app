/* 손가락을 대고 있는 동안 **화면이 다시 그려지면 누른 것이 사라지는가**.

   `renderSeats()`·`renderHand()` 는 화면이 바뀔 때마다 칸을 통째로 지우고 새로
   만든다. 손가락을 댄 칸이 그 사이에 사라지면 어떻게 되는지 확인한다.
   서버 대전은 봇이 계속 두므로 다시 그리는 일이 잦고, 그래서 폰에서만
   "터치가 안 먹는다" 로 보일 수 있다.

   진짜 크롬에 진짜 손가락 신호를 보낸다(CDP Input.dispatchTouchEvent).
   흉내낸 이벤트로는 브라우저가 손가락을 어떻게 다루는지 알 수 없다.

   쓰는 법:  node test/taplost.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};

ensureBuild();
const srv = await serve(5747);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
});
await page.reload({ waitUntil: "networkidle0" });

/* 이 기기 방으로 판을 세운다. 봇은 아예 안 움직이게 해서 딴 것이 안 끼게 한다 */
await page.evaluate(async n => {
  window.__opts = { cap: n, seated: 1, rounds: 3, tax: true, clear2: false };
  await window.__createRoom();
  await window.__startRound();
}, 4);
await new Promise(r => setTimeout(r, 400));
await page.evaluate(() => { if (window.__toTable) window.__toTable(); });
await new Promise(r => setTimeout(r, 900));


/* 내 차례가 되고 고를 수 있는 카드가 생길 때까지 */
let ready = false;
for (let i = 0; i < 260; i++){
  ready = await page.evaluate(() => {
    const v = window.__eng && window.__eng.view;
    return Boolean(v && v.myTurn && document.querySelector("#table .hand .slot:not(.slot--dead)"));
  });
  if (ready) break;
  await new Promise(r => setTimeout(r, 300));
}
/* 내 차례를 잡은 뒤에 봇을 멈춘다. 먼저 멈추면 내 차례가 영영 안 온다 */
await page.evaluate(() => { window.__eng.botMs = 999999; });
if (!ready){
  /* 다른 검사와 같이 돌 때는 컴퓨터가 느려져 여기까지 못 오기도 한다.
     그건 이 검사가 잡으려는 것이 아니므로 실패로 세지 않고 건너뛴다 */
  console.log("\n판이 준비되지 않아 건너뜁니다 (내 차례가 안 왔습니다)\n");
  shut(srv, browser); process.exit(0);
}

await page.evaluate(() => {
  window.__ev = [];
  ["touchstart","touchend","touchcancel","pointerdown","pointerup","mousedown","mouseup","click"]
    .forEach(n => document.addEventListener(n, e => {
      const t = e.target && e.target.closest ? e.target.closest(".slot") : null;
      window.__ev.push(n + (t ? "@slot" : "@" + (e.target && e.target.className || "?")));
    }, true));
});
const cdp = await page.createCDPSession();
const spot = async () => page.evaluate(() => {
  const s = document.querySelector("#table .hand .slot:not(.slot--dead)");
  if (!s) return null;
  const r = s.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
const chosen = () => page.evaluate(() =>
  document.querySelectorAll("#table .hand .slot--sel").length);
const touch = async (type, p) => cdp.send("Input.dispatchTouchEvent", {
  type, touchPoints: type === "touchEnd" ? [] : [{ x: p.x, y: p.y }],
});
/* **보낸 손가락 신호가 진짜 도착했는지 확인한다.**
   컴퓨터가 바쁘면 CDP 로 보낸 가짜 손가락이 통째로 안 들어오는 일이 있다.
   그걸 "앱이 씹었다" 로 세면 헛다리를 짚는다 — 실제로 그랬다 */
const armHit = () => page.evaluate(() => {
  window.__hit = [];
  if (window.__hitOn) return;
  window.__hitOn = true;
  document.addEventListener("pointerdown", () => { (window.__hit = window.__hit || []).push(1); }, true);
});
const landed = () => page.evaluate(() => (window.__hit || []).length > 0);
const bail = async () => {
  console.log("\n손가락 신호가 안 들어가 건너뜁니다 (컴퓨터가 너무 바쁩니다)\n");
  shut(srv, browser); process.exit(0);
};
async function press(p){
  for (let a = 0; a < 3; a++){
    await armHit();
    await touch("touchStart", p);
    await new Promise(r => setTimeout(r, 60));
    await touch("touchEnd", p);
    await new Promise(r => setTimeout(r, 200));
    if (await landed()) return true;
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
}

/* ---------- 1. 그냥 누르기 (다시 그리기 없음) ---------- */
{
  const p = await spot();
  await touch("touchStart", p);
  await new Promise(r => setTimeout(r, 60));
  await touch("touchEnd", p);
  await new Promise(r => setTimeout(r, 250));
  const got = await chosen();
  console.log("    신호: " + JSON.stringify(await page.evaluate(() => window.__ev.splice(0))));
  check("가만히 있을 때는 눌린다", got > 0, "고른 장수 " + got);
  /* 되돌려 놓는다 */
  await touch("touchStart", p); await new Promise(r => setTimeout(r, 60));
  await touch("touchEnd", p);   await new Promise(r => setTimeout(r, 250));
}

/* ---------- 2. 손가락을 댄 채로 화면을 다시 그리면? ---------- */
{
  const before = await chosen();
  const p = await spot();
  await armHit();
  await touch("touchStart", p);
  await new Promise(r => setTimeout(r, 60));
  /* 손패 칸을 통째로 다시 만든다 — 봇이 한 수 둔 것과 같은 상황 */
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await new Promise(r => setTimeout(r, 60));
  await touch("touchEnd", p);
  await new Promise(r => setTimeout(r, 250));
  if (!(await landed())) await bail();
  const after = await chosen();
  console.log("    신호: " + JSON.stringify(await page.evaluate(() => window.__ev.splice(0))));
  check("다시 그려도 눌린 것이 살아남는다", after !== before,
        "고른 장수 " + before + " → " + after);
}

/* ---------- 3. 손가락이 살짝 미끄러져도 눌리는가 ----------

   짧게 툭 치면 손가락이 20~30px 미끄러진다. 그만큼만 밀려도 크롬이
   **"이건 스크롤이다" 로 보고 탭을 취소**해서 `pointerup` 이 아예 안 왔다.
   그러면 누른 것이 통째로 사라진다 — "짧게 누르면 두 번 눌러야 한다" 가 이것.
   (길게 누르면 스크롤로 안 보여서 잘 먹혔다. 그래서 길이 문제로 보였다)
   `touch-action: none` 으로 제스처를 안 뺏기게 했다 */
{
  const slip = async (dx, dy, ms) => {
    /* 내 차례가 아니면 카드가 안 골린다 — 그건 이 검사가 볼 것이 아니다 */
    const mine = await page.evaluate(() => {
      const v = window.__eng && window.__eng.view;
      return Boolean(v && v.myTurn);
    });
    if (!mine) return null;
    const p = await spot();
    if (!p) return null;
    const was = await chosen();
    await armHit();
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y }] });
    await new Promise(r => setTimeout(r, Math.max(5, ms / 2)));
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + dx, y: p.y + dy }] });
    await new Promise(r => setTimeout(r, Math.max(5, ms / 2)));
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await new Promise(r => setTimeout(r, 350));
    if (!(await landed())) return null;         /* 신호가 안 닿았다 */
    return (await chosen()) !== was;
  };
  const clear = async () => {
    for (let k = 0; k < 6; k++){
      if (!(await chosen())) break;
      const p = await page.evaluate(() => {
        const s2 = document.querySelector("#table .hand .slot--sel");
        if (!s2) return null;
        const r = s2.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (!p) break;
      await touch("touchStart", p); await new Promise(r => setTimeout(r, 60));
      await touch("touchEnd", p);   await new Promise(r => setTimeout(r, 250));
    }
  };
  await clear();
  const got = [];
  for (const [dx, dy] of [[0,0],[6,6],[12,12],[8,16]]){
    const r = await slip(dx, dy, 30);
    if (r === null) continue;                    /* 신호가 안 닿음 — 안 센다 */
    got.push({ d: Math.round(Math.hypot(dx,dy)), ok: r });
    await clear();
  }
  if (got.length)
    check("살짝 미끄러져도 눌린다", got.every(x => x.ok),
          got.map(x => x.d + "px:" + (x.ok ? "먹음" : "**안 먹음**")).join(" "));
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
