/* 소리 — 어느 순간에 무엇이 울리는지.

   Audio.play 를 가로채 무엇이 몇 번 울렸는지 센다.
   진짜 브라우저가 필요하다(크롬이 없으면 건너뛴다). */
import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
if (!(await findBrowser())){
  console.log("\n크롬을 못 찾아 소리 검사를 건너뜁니다.\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
ensureBuild();
const srv = await serve(5684);
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
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++;
  console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };
const take = () => page.evaluate(() => { const x = window.__snd.slice(); window.__snd.length = 0; return x; });

await new Promise(r=>setTimeout(r,400));
check("진입창에서는 조용하다", (await take()).length === 0);

/* 진입창 단추는 소리를 안 낸다 */
await page.evaluate(() => { const b = document.querySelector("#entry #start"); if (b) b.click(); });
await new Promise(r=>setTimeout(r,300));
check("진입창 단추는 조용하다", !(await take()).includes("button"));
await page.evaluate(() => window.__goto("entry"));
await new Promise(r=>setTimeout(r,200));
await take();

/* 기본 음량은 둘 다 50 */
check("기본 음량이 50 / 50 이다", await page.evaluate(() => {
  window.__goto("lobby");
  document.querySelector("[data-cfgopen]").click();
  const v = document.getElementById("volBgm").value + "/" + document.getElementById("volSfx").value;
  document.querySelector("[data-cfgclose]").click();
  window.__goto("entry");
  return v;
}) === "50/50");
await new Promise(r=>setTimeout(r,300));
await take();

await page.evaluate(() => window.__goto("lobby"));
await new Promise(r=>setTimeout(r,400));
check("로비에 들어오면 배경음악이 시작된다", (await take()).includes("bgm_lobby"));

/* 방을 만들어 놓고 **로비에 머무르면** 소리가 나면 안 된다.
   방 화면은 안 보일 때도 1.5초마다 다시 그려진다 */
await page.evaluate(async () => {
  window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false };
  await window.__createRoom();
});
await new Promise(r=>setTimeout(r,5000));
check("로비에 있으면 봇이 들어와도 조용하다", (await take()).length === 0);

await page.evaluate(() => window.__goto("room"));
await new Promise(r=>setTimeout(r,400));
check("방 대기실에서는 로비 음악이 꺼진다",
      await page.evaluate(() => window.__bgmOn !== true));
for (let i=0;i<60;i++){ if (await page.evaluate(()=>(window.__opts&&window.__opts.seated)||0)>=4) break;
  await new Promise(r=>setTimeout(r,300)); }
await new Promise(r=>setTimeout(r,400));
check("사람이 들어오면 소리", (await take()).filter(x => x === "join").length >= 2);

await page.evaluate(async () => { await window.__startRound(); });
for (let i=0;i<60;i++){ if (await page.evaluate(()=>window.__eng?.view?.phase)==="play") break;
  await new Promise(r=>setTimeout(r,200)); }
await new Promise(r=>setTimeout(r,400));
const dr = await take();
check("뽑기에서 카드 뒤집는 소리 (카드 낼 때와 같은 소리)",
      dr.filter(x => x === "card_play").length >= 3, JSON.stringify(dr));
check("뽑기에서는 패 나누는 소리가 안 난다", !dr.includes("card_deal"), JSON.stringify(dr));

await page.evaluate(() => { const b=document.querySelector("#draw #go"); if(b) b.click(); });
for (let i=0;i<40;i++){ if (await page.evaluate(()=>(document.querySelector(".page.is-on")||{}).id)==="table") break;
  await new Promise(r=>setTimeout(r,200)); }
await new Promise(r=>setTimeout(r,800));
const tb = await take();
check("판에 들어가도 패 나누는 소리는 안 난다 (연출이 없다)",
      !tb.includes("card_deal"), JSON.stringify(tb));
check("판에서는 배경음악이 꺼진다", !tb.includes("bgm_lobby"));

await page.evaluate(() => { window.__eng.botMs = 80;
  const b = document.querySelector("#table #auto");
  if (b && b.getAttribute("aria-pressed") !== "true") b.click(); });
await new Promise(r=>setTimeout(r,4000));
const g = await take();
check("카드 내는 소리", g.filter(x => x === "card_play").length >= 3, "card_play " + g.filter(x=>x==="card_play").length + "번");
check("패스 소리", g.includes("pass"));
check("내 차례 소리", g.includes("my_turn"));

await page.evaluate(() => document.querySelector("#table #emo").click());
await new Promise(r=>setTimeout(r,300));
await take();
await page.evaluate(() => document.querySelectorAll("#table .emopick button")[0].click());
await new Promise(r=>setTimeout(r,500));
check("감정표현은 소리를 안 낸다", !(await take()).includes("emote"));

/* 음소거하면 아무것도 안 울린다 */
await page.evaluate(() => { window.__goto("lobby"); document.getElementById("btMute").click(); });
await new Promise(r=>setTimeout(r,300));
await take();
await page.evaluate(() => { const b = document.querySelector("#lobby #btNew") || document.querySelector("#lobby button"); if (b) b.click(); });
await new Promise(r=>setTimeout(r,400));
check("음소거하면 소리가 안 난다", (await take()).length === 0);

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
