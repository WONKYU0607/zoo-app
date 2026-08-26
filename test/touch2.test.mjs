/* 터치 모양별 검사 — 짧은 톡, 길게 누름, 흔들림, 끌어서 나가기, 두 번 톡.

   click 은 손을 뗀 뒤에 오는데 그 사이 화면을 다시 그리면 삼켜진다.
   그래서 pointerup 으로 받고 뒤따라오는 click 은 무시한다.
   진짜 브라우저가 필요하다(크롬이 없으면 건너뛴다). */
/* 여러 가지 터치를 CDP 로 직접 만들어 본다 */
import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
if (!(await findBrowser())){
  console.log("\n크롬을 못 찾아 터치 검사를 건너뜁니다.\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
ensureBuild();
const srv = await serve(5696);
const { browser, page } = await open({ srv });
await page.reload({ waitUntil: "networkidle0" });
const cdp = await page.target().createCDPSession();
await page.evaluate(() => {
  const b = document.createElement("button");
  b.id = "probe";
  b.style.cssText = "position:fixed;left:30px;top:280px;width:220px;height:90px;z-index:99999";
  document.body.appendChild(b);
  window.__n = 0;
  let touchAt = 0, inside = false;
  b.addEventListener("touchstart", () => { inside = true; }, { passive: true });
  b.addEventListener("touchend", e => {
    if (e.cancelable) e.preventDefault();
    touchAt = Date.now();
    if (!inside) return;
    inside = false;
    const t = e.changedTouches && e.changedTouches[0];
    if (t){
      const r = b.getBoundingClientRect();
      if (t.clientX < r.left - 8 || t.clientX > r.right + 8 ||
          t.clientY < r.top - 8 || t.clientY > r.bottom + 8) return;
    }
    window.__n++;
  }, { passive: false });
  b.onclick = e => {
    if (Date.now() - touchAt < 900) return;
    if (e && e.button != null && e.button !== 0) return;
    window.__n++;
  };
});
const P = await page.evaluate(() => {
  const r = document.getElementById("probe").getBoundingClientRect();
  return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) };
});
const touch = async (type, x, y) => cdp.send("Input.dispatchTouchEvent", {
  type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
const reset = () => page.evaluate(() => { window.__n = 0; });
const got = () => page.evaluate(() => window.__n);
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++;
  console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };

/* 1. 아주 짧은 톡 */
await reset();
await touch("touchStart", P.x, P.y); await new Promise(r=>setTimeout(r,20));
await touch("touchEnd", P.x, P.y); await new Promise(r=>setTimeout(r,600));
check("아주 짧은 톡 (20ms)", await got() === 1, await got() + "번");

/* 2. 보통 누름 */
await reset();
await touch("touchStart", P.x, P.y); await new Promise(r=>setTimeout(r,120));
await touch("touchEnd", P.x, P.y); await new Promise(r=>setTimeout(r,600));
check("보통 누름 (120ms)", await got() === 1, await got() + "번");

/* 3. 길게 누름 */
await reset();
await touch("touchStart", P.x, P.y); await new Promise(r=>setTimeout(r,700));
await touch("touchEnd", P.x, P.y); await new Promise(r=>setTimeout(r,600));
check("길게 누름 (700ms)", await got() === 1, await got() + "번");

/* 4. 손가락이 조금 흔들림 (5px) — 그래도 눌린 것으로 봐야 한다 */
await reset();
await touch("touchStart", P.x, P.y);
for (const d of [2,4,5,3]) { await touch("touchMove", P.x + d, P.y + d); await new Promise(r=>setTimeout(r,20)); }
await touch("touchEnd", P.x + 3, P.y + 3); await new Promise(r=>setTimeout(r,600));
check("살짝 흔들린 터치 (5px)", await got() === 1, await got() + "번");

/* 5. 단추 밖으로 끌고 나가서 뗌 — 눌리면 안 된다 */
await reset();
await touch("touchStart", P.x, P.y);
for (const d of [20,60,120,200]) { await touch("touchMove", P.x, P.y + d); await new Promise(r=>setTimeout(r,20)); }
await touch("touchEnd", P.x, P.y + 200); await new Promise(r=>setTimeout(r,600));
check("밖으로 끌고 나가 뗌 → 안 눌린다", await got() === 0, await got() + "번");

/* 6. 빠르게 두 번 톡 — 두 번 세어야 한다 (두 배로 세면 안 된다) */
await reset();
for (let i=0;i<2;i++){
  await touch("touchStart", P.x, P.y); await new Promise(r=>setTimeout(r,30));
  await touch("touchEnd", P.x, P.y); await new Promise(r=>setTimeout(r,450));
}
await new Promise(r=>setTimeout(r,700));
check("0.45초 띄워 두 번 톡 → 두 번", await got() === 2, await got() + "번");

/* 7. 마우스 클릭도 여전히 한 번 */
await reset();
await page.mouse.click(P.x, P.y); await new Promise(r=>setTimeout(r,700));
check("마우스 클릭 → 한 번", await got() === 1, await got() + "번");

/* 폰이 터치 뒤에 마우스 신호를 한 벌 더 보내는 경우 — 한 번으로 봐야 한다 */
await reset();
await touch("touchStart", P.x, P.y); await new Promise(r=>setTimeout(r,60));
await touch("touchEnd", P.x, P.y); await new Promise(r=>setTimeout(r,80));
await cdp.send("Input.dispatchMouseEvent", { type:"mousePressed", x:P.x, y:P.y, button:"left", clickCount:1 });
await cdp.send("Input.dispatchMouseEvent", { type:"mouseReleased", x:P.x, y:P.y, button:"left", clickCount:1 });
await new Promise(r=>setTimeout(r,700));
check("터치 뒤 마우스 신호가 또 와도 한 번", await got() === 1, await got() + "번");

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
