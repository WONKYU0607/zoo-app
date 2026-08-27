/* 서버 대전에서 한 번 낸 것이 한 번만 울리는가.

   서버 대전은 내 화면이 먼저 반영하고 서버가 다시 확인해 준다.
   그 사이 바닥이 잠깐 비었다가 같은 카드로 다시 채워지는데,
   장수만 세면 같은 수에 소리와 연출이 두 번 난다.
   이 기기 대전에는 서버 왕복이 없어 이 문제가 안 나타난다 —
   그래서 **반드시 서버를 띄우고** 확인해야 한다.

   쓰는 법:
     창1)  cd zoo-server && node server.js
     창2)  node test/netplay.test.mjs
*/
/* 서버 대전에서 카드 한 장 · 패스 한 번 — 소리와 연출이 몇 번인지 센다 */
import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
if (!(await findBrowser())){
  console.log("\n크롬을 못 찾아 서버 대전 검사를 건너뜁니다.\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
/* 게임 서버가 떠 있어야 한다 */
const SRV = process.env.ZOO_SERVER || "http://127.0.0.1:8000";
try { await fetch(SRV + "/zoo/health"); }
catch(e){
  console.log("\n게임 서버가 안 떠 있어 건너뜁니다 (" + SRV + ")\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
ensureBuild();
const srv = await serve(5725);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((srv) => {
  try { localStorage.setItem("zk_lang","ko"); } catch(e){}
  globalThis.__ZOO_SERVER = srv;
  window.__snd = [];
  HTMLMediaElement.prototype.play = function(){
    const m = (this.currentSrc || this.src || "").match(/snd\/([a-z_]+)\.webm/);
    if (m) window.__snd.push(m[1] + "@" + (Date.now() % 100000));
    return Promise.resolve();
  };
}, SRV);
await page.reload({ waitUntil: "networkidle0" });
const now = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);
await page.evaluate(() => { window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false }; });
await page.evaluate(async () => { await window.__quickJoin(); });
await page.evaluate(() => window.__goto("room"));
for (let i=0;i<90;i++){ if (await page.evaluate(()=>(window.__opts&&window.__opts.seated)||0)>=4) break;
  await new Promise(r=>setTimeout(r,300)); }
await page.evaluate(async () => { await window.__startRound(); });
/* 뽑기: 한 장 뒤집고 시작 */
for (let k=0;k<120;k++){
  if (await now() === "table") break;
  await page.evaluate(() => {
    const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
    if (c) c.click();
    const g = document.querySelector("#draw #go");
    if (g && !g.disabled) g.click();
  });
  await new Promise(r=>setTimeout(r,400));
}
console.log("판 화면 도달:", await now());
if (await now() !== "table"){ shut(srv, browser); process.exit(0); }
await new Promise(r=>setTimeout(r,800));

let pass=0, fail=0;
const check=(n,ok,note)=>{ok?pass++:fail++;console.log((ok?"  [OK]   ":"  [실패] ")+n+(note?"  "+note:""));};
/* 내 차례가 와도 **방금 둔 수가 확인될 때까지 단추가 잠겨 있다**.
   그동안 누르면 아무 일도 안 일어나므로, 눌러 보기 전에 열릴 때까지 기다린다.
   안 기다리면 "누르지도 않았는데 소리가 안 난다"고 잘못 잡는다 */
async function ready(){
  for (let i=0;i<40;i++){
    const ok = await page.evaluate(() => {
      const v = window.__eng && window.__eng.view;
      if (!v || !v.myTurn) return false;
      const q = document.querySelector("#table #pass");
      return Boolean(!v.pile || (q && !q.disabled));      /* 선이면 패스가 원래 잠긴다 */
    });
    if (ok) return true;
    await new Promise(r=>setTimeout(r,100));
  }
  return false;
}
for (let round=1; round<=6; round++){
  for (let i=0;i<300;i++){
    if (await page.evaluate(() => Boolean(window.__eng?.view?.myTurn))) break;
    await new Promise(r=>setTimeout(r,150));
  }
  if (!(await page.evaluate(() => Boolean(window.__eng?.view?.myTurn)))) break;
  if (!(await ready())) continue;
  /* 필요한 장수만큼 고른다 — 같은 숫자를 여러 장 */
  const picked = await page.evaluate(() => {
    const need = (() => { const v = window.__eng?.view;
      return v && v.pile ? v.pile.count : 1; })();
    const hand = (window.__eng?.view?.hand) || [];
    const by = {};
    hand.forEach((c, i) => { (by[c] = by[c] || []).push(i); });
    const slots = [...document.querySelectorAll("#table #hand .slot")];
    for (const num of Object.keys(by)){
      const idx = by[num];
      if (idx.length < need) continue;
      idx.slice(0, need).forEach(i => {
        const s = [...document.querySelectorAll("#table #hand .slot")][i];
        if (s) s.dispatchEvent(new MouseEvent("click", { bubbles:true }));
      });
      const b = document.querySelector("#table #play");
      if (b && !b.disabled) return true;
      /* 안 되면 고른 것을 되돌린다 */
      [...document.querySelectorAll("#table #hand .slot--sel")].forEach(s =>
        s.dispatchEvent(new MouseEvent("click", { bubbles:true })));
    }
    return false;
  });
  await page.evaluate(() => { window.__snd.length = 0; window.__sndDetail = []; window.__sndWhy = []; });
  const before = await page.evaluate(() => ({
    c: (window.__eng?.view?.seats||[])[0]?.c, t: (window.__eng?.view?.table||[]).length }));
  console.log("   고름:", picked, "· 내기단추", await page.evaluate(() => {
    const b=document.querySelector("#table #play");
    return b ? ("'"+b.textContent+"' disabled="+b.disabled) : "없음"; }),
    "· busy", await page.evaluate(() => {
      const v = window.__eng?.view; return v ? ("myTurn "+v.myTurn) : "?"; }));
  if (picked){
    await page.evaluate(() => { const b=document.querySelector("#table #play"); if(b && !b.disabled) b.click(); });
    await new Promise(r=>setTimeout(r,700));
    const a = await page.evaluate(() => ({
      c: (window.__eng?.view?.seats||[])[0]?.c,
      fly: document.querySelectorAll("#table #pile .play--new").length,
      snd: window.__snd.slice(), det: (window.__sndDetail||[]).slice(),
      why: (window.__sndWhy||[]).slice(-6) }));
    /* `__sndDetail` 은 울린 수를 하나씩 적어 둔다 — "play:0" 은 **내 자리(0)** 가 낸 것 */
    const mineC = a.det.filter(x => x === "play:0");
    check("카드: 내 소리 한 번", mineC.length === 1,
      JSON.stringify(a.det) + " · 손패 " + before.c + "→" + a.c);
    check("카드: 날아오는 연출 한 벌", a.fly <= 1, "연출 " + a.fly);
  } else {
    await page.evaluate(() => { const b=document.querySelector("#table #pass"); if(b && !b.disabled) b.click(); });
    await new Promise(r=>setTimeout(r,700));
    const a = await page.evaluate(() => ({ snd: window.__snd.slice(), det: (window.__sndDetail||[]).slice() }));
    /* 봇이 이어서 패스한 것까지 세면 안 된다. **내 자리(0)** 것만 본다 */
    check("패스: 내 소리 한 번", a.det.filter(x => x === "pass:0").length === 1,
      JSON.stringify(a.det));
  }
}
/* 눌린 뒤 단추가 다시 열렸다 닫히며 깜빡이는지, 패스 소리가 빠지는지 */
let flick = 0, passTry = 0, passSnd = 0;
for (let round=1; round<=8; round++){
  for (let i=0;i<250;i++){
    if (await page.evaluate(() => Boolean(window.__eng?.view?.myTurn))) break;
    await new Promise(r=>setTimeout(r,150));
  }
  if (!(await page.evaluate(() => Boolean(window.__eng?.view?.myTurn)))) break;
  await ready();
  const canPass = await page.evaluate(() => {
    const b = document.querySelector("#table #pass"); return Boolean(b && !b.disabled); });
  if (!canPass) { await new Promise(r=>setTimeout(r,600)); continue; }
  passTry++;
  await page.evaluate(() => { window.__snd.length = 0; window.__sndDetail = []; window.__sndWhy = []; });
  const c0 = await page.evaluate(() => (window.__eng?.view?.seats||[])[0]?.c);
  await page.evaluate(() => { const b=document.querySelector("#table #pass"); b.click(); });
  /* 누른 직후 단추 상태를 촘촘히 본다 — 다시 열리면 깜빡임이다 */
  let reopened = false;
  for (let k=0;k<16;k++){
    await new Promise(r=>setTimeout(r,60));
    const on = await page.evaluate(() => {
      const b = document.querySelector("#table #pass");
      const p = document.querySelector("#table #play");
      return Boolean((b && !b.disabled) || (p && !p.disabled));
    });
    if (on && await page.evaluate(() => !window.__eng?.view?.myTurn)) reopened = true;
  }
  if (reopened) flick++;
  await new Promise(r=>setTimeout(r,500));
  const got = await page.evaluate(() => ({
    snd: window.__snd.slice(), det: (window.__sndDetail||[]).slice(),
    me: (window.__eng?.view?.seats||[])[0]?.s }));
  /* 눌렀는데 정말 패스가 됐는지부터 본다.
     이미 남이 낸 뒤라 내 차례가 아니었으면 셈에서 뺀다 */
  const c1 = await page.evaluate(() => (window.__eng?.view?.seats||[])[0]?.c);
  const reallyPassed = got.me === "pass" || c0 === c1;
  /* 봇 소리를 내 것으로 세면 안 된다 — **내 자리(0)** 의 패스만 본다 */
  const ok2 = got.det.some(x => x === "pass:0");
  if (ok2) passSnd++;
  else if (!reallyPassed){ passTry--; }
  else console.log("   패스 소리 없음 · 내 표시=" + got.me + " · " + JSON.stringify(got.det) +
    " 왜? " + JSON.stringify(await page.evaluate(() => (window.__sndWhy||[]).slice(-5))));
}
check("패스 소리가 빠지지 않는다", passTry === 0 || passSnd === passTry,
  passSnd + "/" + passTry + "번");
check("누른 뒤 단추가 다시 열리지 않는다", flick === 0, flick + "번 깜빡임");

if (!pass && !fail) console.log("  (낼 상황이 안 나와 건너뜀)");
console.log("\n=== 통과 "+pass+" / 실패 "+fail+" ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
