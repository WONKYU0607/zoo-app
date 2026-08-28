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

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
