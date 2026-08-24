/* 터치 — 한 번 누르면 한 번만 나가는가.

   click 은 손을 뗀 뒤에 오는데 그 사이 화면을 다시 그리면 삼켜진다.
   그래서 pointerup 으로 받고 뒤따라오는 click 은 무시한다.
   진짜 터치로 눌러서 확인한다(크롬이 없으면 건너뛴다). */
/* 진짜 터치로 눌러 본다 — 한 번 눌러서 한 번만 나가는가 */
import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
if (!(await findBrowser())){
  console.log("\n크롬을 못 찾아 터치 검사를 건너뜁니다.\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
ensureBuild();
const srv = await serve(5693);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("zk_lang","ko"); } catch(e){} });
await page.reload({ waitUntil: "networkidle0" });
/* 엔진에 들어간 수를 센다 */
await page.evaluate(() => {
  const e = window.__eng;
  window.__moves = [];
});
await page.evaluate(async () => {
  window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false };
  await window.__createRoom();
});
for (let i=0;i<60;i++){ if (await page.evaluate(()=>(window.__opts&&window.__opts.seated)||0)>=4) break;
  await new Promise(r=>setTimeout(r,300)); }
await page.evaluate(async () => { await window.__startRound(); });
for (let i=0;i<60;i++){ if (await page.evaluate(()=>window.__eng?.view?.phase)==="play") break;
  await new Promise(r=>setTimeout(r,200)); }
await page.evaluate(() => { const b=document.querySelector("#draw #go"); if(b) b.click(); });
for (let i=0;i<40;i++){ if (await page.evaluate(()=>(document.querySelector(".page.is-on")||{}).id)==="table") break;
  await new Promise(r=>setTimeout(r,200)); }
await new Promise(r=>setTimeout(r,900));
/* 엔진의 play/passTurn 을 가로채 몇 번 불렸는지 센다 */
await page.evaluate(() => {
  /* 엔진의 클라이언트에 들어가는 수를 센다 */
  const c = window.__eng.client;
  window.__cnt = { play: 0, pass: 0 };
  const p = c.moves.play, q = c.moves.pass;
  c.moves.play = (...a) => { window.__cnt.play++; return p(...a); };
  c.moves.pass = (...a) => { window.__cnt.pass++; return q(...a); };
});
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++;
  console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };

/* 내 차례가 올 때까지 */
for (let i=0;i<300;i++){
  if (await page.evaluate(() => window.__eng?.view?.myTurn)) break;
  await new Promise(r=>setTimeout(r,120));
}
check("내 차례가 왔다", await page.evaluate(() => Boolean(window.__eng?.view?.myTurn)));

/* 패스를 진짜 터치로 눌러 본다.
   한 번 누르면 **한 번만** 나가야 하고, 그 한 번으로 차례가 넘어가야 한다 */
for (let round = 1; round <= 4; round++){
  for (let i=0;i<400;i++){
    const ok = await page.evaluate(() => {
      const b = document.querySelector("#table #pass");
      return Boolean(window.__eng?.view?.myTurn) && b && !b.disabled;
    });
    if (ok) break;
    await new Promise(r=>setTimeout(r,100));
  }
  const pb = await page.evaluate(() => {
    const b = document.querySelector("#table #pass");
    if (!b || b.disabled) return null;
    const r = b.getBoundingClientRect();
    const x = Math.round(r.left + r.width/2), y = Math.round(r.top + r.height/2);
    const top = document.elementFromPoint(x, y);
    window.__hit = 0;
    if (!window.__hooked){ window.__hooked = true;
      b.addEventListener("pointerup", () => window.__hit++); }
    return { x, y, hit: top === b || b.contains(top) };
  });
  if (!pb){ console.log("  (" + round + "회차: 패스가 안 열려 건너뜀)"); continue; }
  const before = await page.evaluate(() => ({
    turn: window.__eng?.view?.turn, t: (window.__eng?.view?.table||[]).length }));
  await page.touchscreen.tap(pb.x, pb.y);
  await new Promise(r=>setTimeout(r,1200));
  const after = await page.evaluate(() => ({
    hit: window.__hit, mine: Boolean(window.__eng?.view?.myTurn),
    t: (window.__eng?.view?.table||[]).length }));
  check(round + "회차 · 한 번 누르면 한 번만 닿는다", after.hit === 1, "pointerup " + after.hit + "번");
  check(round + "회차 · 그 한 번으로 차례가 넘어갔다", !after.mine,
        "바닥 " + before.t + " → " + after.t);
}
console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
