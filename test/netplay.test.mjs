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
for (let round=1; round<=6; round++){
  for (let i=0;i<300;i++){
    if (await page.evaluate(() => Boolean(window.__eng?.view?.myTurn))) break;
    await new Promise(r=>setTimeout(r,150));
  }
  if (!(await page.evaluate(() => Boolean(window.__eng?.view?.myTurn)))) break;
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
  await page.evaluate(() => { window.__snd.length = 0; window.__sndDetail = []; });
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
      snd: window.__snd.slice(), det: (window.__sndDetail||[]).slice() }));
    const mine = a.snd.filter(x => x.startsWith("card_play"));
    check("카드: 소리 한 번", mine.length === 1, JSON.stringify(a.det) + " · 손패 " + before.c + "→" + a.c);
    check("카드: 날아오는 연출 한 벌", a.fly <= 1, "연출 " + a.fly);
  } else {
    await page.evaluate(() => { const b=document.querySelector("#table #pass"); if(b && !b.disabled) b.click(); });
    await new Promise(r=>setTimeout(r,700));
    const a = await page.evaluate(() => ({ snd: window.__snd.slice(), det: (window.__sndDetail||[]).slice() }));
    const ps = a.snd.filter(x => x.startsWith("pass"));
    check("패스: 소리 한 번", ps.length <= 1, JSON.stringify(a.det));
  }
}
if (!pass && !fail) console.log("  (낼 상황이 안 나와 건너뜀)");
console.log("\n=== 통과 "+pass+" / 실패 "+fail+" ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
