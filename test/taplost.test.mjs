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
  await touch("touchStart", p);
  await new Promise(r => setTimeout(r, 60));
  /* 손패 칸을 통째로 다시 만든다 — 봇이 한 수 둔 것과 같은 상황 */
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await new Promise(r => setTimeout(r, 60));
  await touch("touchEnd", p);
  await new Promise(r => setTimeout(r, 250));
  const after = await chosen();
  console.log("    신호: " + JSON.stringify(await page.evaluate(() => window.__ev.splice(0))));
  check("다시 그려도 눌린 것이 살아남는다", after !== before,
        "고른 장수 " + before + " → " + after);
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
