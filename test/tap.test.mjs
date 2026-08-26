/* 한 번 터치 = 카드 한 장 = 연출 한 번 = 소리 한 번.

   손가락으로 한 번 눌러도 신호가 여러 번 온다.
     pointerdown:touch → pointerup:touch → click:touch
     그리고 폰이 뒤따라 보내는 마우스 한 벌: pointerdown:mouse → pointerup:mouse
   그중 **손가락 것 하나만** 처리해야 한다.

   진짜 브라우저가 필요하다(크롬이 없으면 건너뛴다). */
/* 한 번 터치 → 카드 한 번 나가고, 연출 한 번, 소리 한 번인지 */
import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
if (!(await findBrowser())){
  console.log("\n크롬을 못 찾아 터치 검사를 건너뜁니다.\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
ensureBuild();
const srv = await serve(5719);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem("zk_lang","ko"); } catch(e){}
  window.__snd = [];
  HTMLMediaElement.prototype.play = function(){
    const m = (this.currentSrc || this.src || "").match(/snd\/([a-z_]+)\.webm/);
    if (m) window.__snd.push(m[1]);
    return Promise.resolve();
  };
});
await page.reload({ waitUntil: "networkidle0" });
const cdp = await page.target().createCDPSession();
await page.evaluate(async () => {
  window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false };
  await window.__createRoom();
});
for (let i=0;i<80;i++){ if (await page.evaluate(()=>(window.__opts&&window.__opts.seated)||0)>=4) break;
  await new Promise(r=>setTimeout(r,300)); }
await page.evaluate(async () => { await window.__startRound(); });
for (let i=0;i<60;i++){ if (await page.evaluate(()=>window.__eng?.view?.phase)==="play") break;
  await new Promise(r=>setTimeout(r,200)); }
await page.evaluate(() => { const b=document.querySelector("#draw #go"); if(b) b.click(); });
for (let i=0;i<40;i++){ if (await page.evaluate(()=>(document.querySelector(".page.is-on")||{}).id)==="table") break;
  await new Promise(r=>setTimeout(r,200)); }
await new Promise(r=>setTimeout(r,900));

let pass=0, fail=0;
const check=(n,ok,note)=>{ok?pass++:fail++;console.log((ok?"  [OK]   ":"  [실패] ")+n+(note?"  "+note:""));};
const phoneTap = async (x, y) => {
  await cdp.send("Input.dispatchTouchEvent", { type:"touchStart", touchPoints:[{x,y}] });
  await new Promise(r=>setTimeout(r,60));
  await cdp.send("Input.dispatchTouchEvent", { type:"touchEnd", touchPoints:[] });
  await new Promise(r=>setTimeout(r,80));
  await cdp.send("Input.dispatchMouseEvent", { type:"mousePressed", x, y, button:"left", clickCount:1 });
  await cdp.send("Input.dispatchMouseEvent", { type:"mouseReleased", x, y, button:"left", clickCount:1 });
};
/* 고를 수 있는 카드를 찾는다. 손가락을 쓴 직후에는 click 이 막히므로 잠깐 띄운다 */
const findCard = async () => { await new Promise(r=>setTimeout(r,950)); return page.evaluate(() => {
  const slots = [...document.querySelectorAll("#table #hand .slot")];
  for (let i = slots.length - 1; i >= 0; i--){
    const r = slots[i].getBoundingClientRect();
    const x = Math.round(r.left + r.width/2), y = Math.round(r.top + r.height*0.5);
    const top = document.elementFromPoint(x, y);
    if (!(top && slots[i].contains(top))) continue;
    slots[i].dispatchEvent(new MouseEvent("click", { bubbles:true }));
    const on = document.querySelectorAll("#table #hand .slot--sel").length;
    if (on){
      [...document.querySelectorAll("#table #hand .slot")][i]
        .dispatchEvent(new MouseEvent("click", { bubbles:true }));
      return { x, y };
    }
  }
  return null;
}); };

let done = 0;
for (let round = 1; round <= 20 && done < 3; round++){
  for (let i=0;i<300;i++){
    if (await page.evaluate(() => Boolean(window.__eng?.view?.myTurn))) break;
    await new Promise(r=>setTimeout(r,100));
  }
  const cb = await findCard();
  if (!cb){
    console.log("  (" + round + "회차: 낼 카드 없음 → 패스)");
    await page.evaluate(() => { const b=document.querySelector("#table #pass");
      if (b && !b.disabled) b.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,pointerType:"touch"})); });
    await new Promise(r=>setTimeout(r,800));
    continue;
  }
  await phoneTap(cb.x, cb.y);
  await new Promise(r=>setTimeout(r,400));
  const sel = await page.evaluate(() => document.querySelectorAll("#table #hand .slot--sel").length);
  const pb = await page.evaluate(() => {
    const b = document.querySelector("#table #play");
    if (!b || b.disabled) return null;
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) };
  });
  if (!pb){ console.log("  (" + round + "회차: 고른 뒤에도 내기 단추가 안 열림 · 고른 수 " + sel + ")"); continue; }
  done++;
  const before = await page.evaluate(() => ({
    c: (window.__eng?.view?.seats||[])[0]?.c,
    t: (window.__eng?.view?.table||[]).length }));
  await page.evaluate(() => { window.__snd.length = 0; });
  await phoneTap(pb.x, pb.y);
  await new Promise(r=>setTimeout(r,1300));
  const after = await page.evaluate(() => ({
    c: (window.__eng?.view?.seats||[])[0]?.c,
    t: (window.__eng?.view?.table||[]).length,
    fly: document.querySelectorAll("#table .pile .play--new").length,
    snd: window.__snd.slice() }));
  check(done + "회 · 고른 만큼만 손패가 줄었다", before.c - after.c === sel,
    before.c + " → " + after.c + " (고른 " + sel + "장)");
  check(done + "회 · 바닥에 한 번만 쌓였다", after.t - before.t <= 1,
    "바닥 " + before.t + " → " + after.t);
  check(done + "회 · 날아오는 연출이 한 벌", after.fly <= 1, "새 연출 " + after.fly + "개");
  check(done + "회 · 카드 소리가 한 번", after.snd.filter(x => x === "card_play").length === 1,
    JSON.stringify(after.snd));
}
if (!done) console.log("  (낼 수 있는 상황이 안 나와 건너뜀)");
/* 패스도 한 번 터치에 한 번, 소리도 한 번 */
for (let i=0;i<300;i++){
  if (await page.evaluate(() => Boolean(window.__eng?.view?.myTurn))) break;
  await new Promise(r=>setTimeout(r,100));
}
const qb = await page.evaluate(() => {
  const b = document.querySelector("#table #pass");
  if (!b || b.disabled) return null;
  const r = b.getBoundingClientRect();
  return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) };
});
if (qb){
  await page.evaluate(() => { window.__snd.length = 0; });
  const t0 = await page.evaluate(() => (window.__eng?.view?.seats||[]).filter(x=>x.s==="pass").length);
  await phoneTap(qb.x, qb.y);
  await new Promise(r=>setTimeout(r,1300));
  const got = await page.evaluate(() => window.__snd.slice());
  check("패스 소리가 한 번", got.filter(x => x === "pass").length <= 1, JSON.stringify(got));
  check("단추 소리도 한 번", got.filter(x => x === "button").length <= 1, JSON.stringify(got));
} else console.log("  (패스가 안 열려 건너뜀)");

console.log("\n=== 통과 "+pass+" / 실패 "+fail+" ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
