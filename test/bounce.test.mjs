/* 낸 것·패스가 **되돌아갔다 다시 오는가** — 지연이 있는 서버에서.

   증상: 패스·카드를 내면 한 번 먹었다가 깜빡하며 돌아오고, 곧 다시 먹는다.
   원인: 잠금을 "수 번호가 올라갔다" 로 풀었는데, 봇이 둬도 올라간다.
         서버가 **내 수를 처리하기 전 상태**를 보내면 확인된 줄 알고 풀어 버렸다.
   같은 컴퓨터의 서버는 왕복이 0 이라 절대 안 생긴다. 그래서 **지연 장치를
   이 검사 안에 끼웠다** — 브라우저 쪽 흉내(CDP)는 웹소켓까지 늦추지 못했다.

   드물게 나는 현상이라 한 번 통과로는 부족하다. 여러 번 돌려 볼 것.
   쓰는 법:  창1) cd zoo-server && set ZOO_BOT_MS=300 && node server.js
             창2) node test/bounce.test.mjs */
import net from "node:net";
const LAG = Number(process.env.LAG || 120), LPORT = 8110;
const lag = net.createServer(c => {
  const s2 = net.connect(8000, "127.0.0.1");
  const pipe = (a, b) => a.on("data", d => setTimeout(() => { try { b.write(d); } catch(e){} }, LAG));
  pipe(c, s2); pipe(s2, c);
  const end = () => { try { c.destroy(); } catch(e){} try { s2.destroy(); } catch(e){} };
  c.on("error", end); s2.on("error", end); c.on("close", end); s2.on("close", end);
}).listen(LPORT);
import { serve, open, shut, ensureBuild } from "./shot.mjs";
const SRV = "http://127.0.0.1:" + LPORT;
try { await fetch("http://127.0.0.1:8000/zoo/health"); }
catch(e){ console.log("\n게임 서버가 안 떠 있어 건너뜁니다\n"); lag.close(); process.exit(0); }
ensureBuild();
const srv=await serve(5891); const {browser,page}=await open({srv});
await page.evaluateOnNewDocument(s=>{globalThis.__ZOO_SERVER=s;try{localStorage.setItem("zk_lang","ko");}catch(e){}
  HTMLMediaElement.prototype.play=function(){return Promise.resolve();};},SRV);
await page.reload({waitUntil:"networkidle0"});
await page.evaluate(()=>{window.__opts={cap:4,seated:1,rounds:3,tax:true,clear2:false};});
await page.evaluate(async()=>{await window.__createRoom();   /* 빠른참가는 이제 남의 방에만 들어간다 */});
await page.evaluate(()=>window.__goto("room"));
const now=()=>page.evaluate(()=>(document.querySelector(".page.is-on")||{}).id);
for(let i=0;i<90;i++){if(await page.evaluate(()=>(window.__opts&&window.__opts.seated)||0)>=4)break;await new Promise(r=>setTimeout(r,300));}
await page.evaluate(async()=>{await window.__startRound();});
for(let k=0;k<120;k++){if(await now()==="table")break;
  await page.evaluate(()=>{const c=[...document.querySelectorAll("#draw .pk")].find(x=>!x.className.includes("taken"));
    if(c)c.click();const g=document.querySelector("#draw #go");if(g&&!g.disabled)g.click();});
  await new Promise(r=>setTimeout(r,350));}
console.log("판:",await now());
/* 매 순간 내 자리 패스 표시·내 차례·손패 장수를 촘촘히 기록한다 */
await page.evaluate(()=>{ window.__trace=[];
  const t0=Date.now();
  setInterval(()=>{ const v=window.__eng&&window.__eng.view; if(!v)return;
    const s=document.querySelectorAll("#table .seat")[0];
    const pb=document.querySelector("#table #pass");
    window.__trace.push({t:Date.now()-t0, my:v.myTurn?1:0,
      pass:(s&&s.classList.contains("seat--pass"))?1:0,
      turnRing:(s&&s.classList.contains("seat--turn"))?1:0,
      btn:(pb&&!pb.disabled)?1:0,
      /* **화면에 실제로 그려진 카드 수**를 본다. 엔진 값은 확인 전 옛 상태가 섞여
         튀어도, 화면이 붙잡고 있으면 사용자는 못 본다 */
      hand:document.querySelectorAll("#table .hand .slot").length, no:v.moveNo});
    if(window.__trace.length>3000) window.__trace.shift(); },15); });
let bounces=0, tries=0;
for(let round=0;round<12;round++){
  let ok=false;
  for(let i=0;i<200;i++){ ok=await page.evaluate(()=>{const v=window.__eng&&window.__eng.view;
      const b=document.querySelector("#table #pass"); return Boolean(v&&v.myTurn&&v.pile&&b&&!b.disabled);});
    if(ok)break; await new Promise(r=>setTimeout(r,100)); }
  if(!ok) break;
  const mark=await page.evaluate(()=>window.__trace.length);
  const round0=await page.evaluate(()=>window.__eng.view.roundNo);
  /* 번갈아 가며 카드를 내거나 패스한다 */
  const how=await page.evaluate(i=>{
    if(i%2===0){
      for(let k=0;k<5;k++){
        const pb=document.querySelector("#table #play");
        if(pb&&!pb.disabled) break;
        const sl=[...document.querySelectorAll("#table .hand .slot")]
          .find(x=>!x.className.includes("slot--dead")&&!x.className.includes("slot--sel"));
        if(!sl) break; sl.click();
      }
      const pb=document.querySelector("#table #play");
      if(pb&&!pb.disabled){ pb.click(); return "냄"; }
    }
    const b=document.querySelector("#table #pass"); if(b) b.click(); return "패스";
  },round);
  tries++;
  await new Promise(r=>setTimeout(r,1500));
  /* 어느 값이든 **바뀌었다 → 되돌아왔다 → 다시 바뀌었으면** 깜빡인 것이다 */
  const tr=await page.evaluate(m=>window.__trace.slice(m),mark);
  const flick=k=>{ const v=tr.map(x=>x[k]); if(v.length<3) return 0;
    let n=0; for(let i=2;i<v.length;i++){ if(v[i]===v[i-2] && v[i]!==v[i-1]) n++; } return n; };
  const f={ 내차례:flick("my"), 패스표시:flick("pass"), 차례테두리:flick("turnRing"),
            패스단추:flick("btn"), 손패:flick("hand") };
  const any=Object.values(f).some(x=>x>0);
  const round1=await page.evaluate(()=>window.__eng.view.roundNo);
  if(round1!==round0){ tries--; continue; }      /* 판이 넘어가면 손패가 바뀌는 게 당연하다 */
  if(any){ bounces++; console.log("  깜빡임("+how+") "+JSON.stringify(f)); }
}
console.log("낸 것·패스 "+tries+"번 중 되돌아갔다 다시 온 것 "+bounces);

/* ---- 자동치기로 둘 때 ----
   자동치기는 엔진이 직접 둬서, 손으로 둘 때 거치는 붙잡기 장치를 하나도 안 거친다.
   그래서 깜빡임이 **자동치기에서만** 잘 보였다 */
await page.evaluate(()=>{ const b=document.querySelector("#table #auto"); if(b && !window.__eng.auto) b.click(); });
let autoBounce=0, autoTurns=0;
for(let k=0;k<10;k++){
  let mine=false;
  for(let i=0;i<150;i++){ mine=await page.evaluate(()=>Boolean(window.__eng.view&&window.__eng.view.myTurn));
    if(mine)break; await new Promise(r=>setTimeout(r,80)); }
  if(!mine) break;
  const mark=await page.evaluate(()=>window.__trace.length);
  const r0=await page.evaluate(()=>window.__eng.view.roundNo);
  await new Promise(r=>setTimeout(r,2200));      /* 자동이 1초 뒤 두고, 서버가 확인할 때까지 */
  const r1=await page.evaluate(()=>window.__eng.view.roundNo);
  if(r1!==r0) continue;
  autoTurns++;
  const tr=await page.evaluate(m=>window.__trace.slice(m),mark);
  const flick=kk=>{ const v=tr.map(x=>x[kk]); let n=0;
    for(let i=2;i<v.length;i++){ if(v[i]===v[i-2] && v[i]!==v[i-1]) n++; } return n; };
  const f={ 패스표시:flick("pass"), 패스단추:flick("btn"), 손패:flick("hand") };
  if(Object.values(f).some(x=>x>0)){ autoBounce++; console.log("  자동 깜빡임 "+JSON.stringify(f)); }
}
console.log("자동치기 "+autoTurns+"번 중 되돌아갔다 다시 온 것 "+autoBounce);
bounces += autoBounce;
shut(srv,browser); lag.close();
process.exit(bounces ? 1 : 0);
