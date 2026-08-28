/* 판 화면 **밖**의 단추가 진짜 손가락으로 눌리는가.

   판 화면은 손가락 신호를 직접 다룬다(뒤따르는 마우스 신호를 막는 것 포함).
   그 처리를 실수로 **화면 전체**에 걸었더니 진입창의 게임시작 단추가 죽었다.
   기존 검사들은 전부 `.click()` 으로 눌러서 이걸 하나도 못 잡았다 —
   `.click()` 은 손가락 신호를 안 만들기 때문이다.

   그래서 여기서는 **진짜 손가락 신호**(CDP)로 누른다.

   쓰는 법:  node test/tapscreens.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};

ensureBuild();
const srv = await serve(5789);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
});
await page.reload({ waitUntil: "networkidle0" });
const cdp = await page.createCDPSession();

/* 진짜 손가락으로 누른다 */
async function finger(sel){
  const p = await page.evaluate(s => {
    const b = document.querySelector(s);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    if (!r.width) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, sel);
  if (!p) return false;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y }] });
  await new Promise(r => setTimeout(r, 60));
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await new Promise(r => setTimeout(r, 500));
  return true;
}
const screen = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);

/* ---------- 진입창 ---------- */
{
  const on = await screen();
  check("진입창이 떠 있다", on === "entry" || on === "lobby", "화면 " + on);
  /* 손가락 신호가 화면까지 오는가 — 막혀 있으면 여기서 걸린다 */
  const got = await page.evaluate(async () => {
    window.__hit = 0;
    document.addEventListener("click", () => { window.__hit++; }, true);
    return true;
  });
  void got;
  const btn = await page.evaluate(() =>
    Boolean(document.querySelector("#entry button, #entry [role=button]")));
  if (btn){
    await finger("#entry button");
    check("진입창 단추에 손가락 누름이 닿는다",
          (await page.evaluate(() => window.__hit)) > 0,
          "click 이 " + (await page.evaluate(() => window.__hit)) + "번");
  } else {
    check("진입창에 단추가 있다", false, "못 찾음");
  }
}

/* ---------- 로비 ---------- */
{
  await page.evaluate(() => window.__goto && window.__goto("lobby"));
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => { window.__hit = 0; });
  const ok = await finger("#lobby button");
  if (ok){
    check("로비 단추에도 닿는다", (await page.evaluate(() => window.__hit)) > 0,
          "click 이 " + (await page.evaluate(() => window.__hit)) + "번");
  } else {
    check("로비에 단추가 있다", false, "못 찾음");
  }
}

/* ---------- 판 화면 안에서 `click` 으로 도는 단추들 ----------
   자동·이모티콘 단추와 바닥 펼치기는 `onTap` 이 아니라 `click` 으로 돈다.
   판 화면이 손가락 신호의 기본동작을 **무조건** 막으면 그 click 이 통째로
   사라져 단추가 죽는다. 실제로 자동 단추가 그렇게 죽었다 */
{
  /* 앞의 로비 누름이 남긴 것이 없도록 새로 연다 */
  await page.reload({ waitUntil: "networkidle0" });
  await page.evaluate(async n => {
    window.__opts = { cap: n, seated: 1, rounds: 3, tax: true, clear2: false };
    await window.__createRoom();
    await window.__startRound();
  }, 4);
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => { if (window.__toTable) window.__toTable(); });
  await new Promise(r => setTimeout(r, 900));
  /* 단추가 그려질 때까지 기다린다 — 안 기다리면 허공을 누르고 "안 먹는다" 로 잡는다 */
  for (let i = 0; i < 40; i++){
    const w = await page.evaluate(() => {
      const b = document.querySelector("#table #auto");
      return b ? b.getBoundingClientRect().width : 0;
    });
    if (w > 0) break;
    await new Promise(r => setTimeout(r, 200));
  }
  if (await screen() === "table"){
    const was = await page.evaluate(() => Boolean(window.__eng.auto));
    const hit = await finger("#table #auto");
    console.log("    (자동 단추 눌림: " + hit + " · 화면 " + (await screen()) + ")");
    const now2 = await page.evaluate(() => Boolean(window.__eng.auto));
    check("자동 단추가 손가락으로 눌린다", now2 !== was, was + " → " + now2);
    await finger("#table #emo");
    check("이모티콘 단추가 손가락으로 눌린다",
          await page.evaluate(() => {
            const p = document.querySelector("#table #emopick");
            return Boolean(p && !p.hidden);
          }));
  } else {
    check("판 화면까지 갔다", false, "화면 " + (await screen()));
  }
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
