/* **앱이 뒤에 있는 동안은 소리를 안 낸다** (2026-10-26 — 광고를 "베스트로" 정리하면서)

   광고가 앱을 덮으면 앱은 뒤로 간다(캐패시터 App pause → nav.js 가 apppause 로 넘긴다). 그때 로비 배경음악이 계속 나오면
   광고 소리와 겹친다. 화면을 끄거나 홈으로 나갔을 때도 같다.
   진짜 브라우저에서 Audio.play / pause 를 가로채 본다:
     1. 로비 배경음악이 나오는 중에 앱이 뒤로 가면(apppause) 배경음악이 멈춘다
     2. 뒤에 있는 동안 효과음(단추 소리 등)이 안 난다
     3. 돌아오면(appresume) 배경음악이 다시 나온다 — 처음부터가 아니라 이어서(같은 소리 요소)
     4. 뒤에 있는 동안 화면이 바뀌어 새 배경음악을 틀어야 해도 안 틀고, 돌아오면 튼다
     5. 소리를 꺼 둔(음소거) 사람은 돌아와도 안 나온다
     6. 화면 숨김(visibilitychange)만 와도 같다

   쓰는 법:  node test/bgsound.test.mjs */
import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); console.log("=== 통과 0 / 실패 0 ===\n"); process.exit(0); }
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++; console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };
const nap = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5976);
const { browser, page, logs } = await open({ srv });
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem("zk_lang", "ko"); localStorage.setItem("zk_mute", "0"); } catch(e){}
  window.__ev = [];
  const name = el => ((el.currentSrc || el.src || "").match(/snd\/([a-z_]+)\.webm/) || [])[1] || "?";
  HTMLMediaElement.prototype.play = function(){ this.__on = true; window.__ev.push("play:" + name(this)); return Promise.resolve(); };
  HTMLMediaElement.prototype.pause = function(){ this.__on = false; window.__ev.push("pause:" + name(this)); };
  /* 지금 배경음악 요소가 켜져 있는가 — 마지막으로 만든 bgm 요소를 기억한다 */
  const A = window.Audio;
  window.Audio = function(src){ const a = new A(src); if (/bgm_/.test(src || "")) window.__bgmEl = a; return a; };
  window.Audio.prototype = A.prototype;
});
await page.reload({ waitUntil: "networkidle0" });
const take = () => page.evaluate(() => { const x = window.__ev.slice(); window.__ev.length = 0; return x; });
const bgmOn = () => page.evaluate(() => Boolean(window.__bgmEl && window.__bgmEl.__on));
const fire = n => page.evaluate(n => window.dispatchEvent(new Event(n)), n);
/* 단추 소리 하나 — 로비의 "규칙 보기" 를 누른다(누르면 단추 소리). 연달아 누르면 메아리로 보고 버리므로(0.35초) 사이를 두고,
   열린 규칙 창은 소리 없이 닫는다 */
const tapSound = async () => {
  await nap(400);
  await page.evaluate(() => { const b = document.querySelector("#lobby #btRules"); if (b) b.click(); });
  await nap(50);
  await page.evaluate(() => document.querySelectorAll("#lobby .sheet.is-open").forEach(s => s.classList.remove("is-open")));
};

await page.evaluate(() => window.__goto("lobby"));
await nap(500);
check("(준비) 로비 배경음악이 나온다", (await take()).includes("play:bgm_lobby") && await bgmOn());
const el0 = await page.evaluate(() => { window.__bgm0 = window.__bgmEl; return true; });

console.log("\n--- 1·2. 앱이 뒤로 감 ---");
await fire("apppause");
await nap(100);
check("**앱이 뒤로 가면 배경음악이 멈춘다** (광고 소리와 안 겹침)", !(await bgmOn()), JSON.stringify(await take()));
await tapSound();
await nap(200);
const quiet = await take();
check("뒤에 있는 동안 효과음이 안 난다", !quiet.some(x => /^play:/.test(x)), JSON.stringify(quiet));

console.log("\n--- 3. 돌아옴 ---");
await fire("appresume");
await nap(100);
const back = await take();
check("**돌아오면 배경음악이 다시 나온다**", await bgmOn() && back.includes("play:bgm_lobby"), JSON.stringify(back));
check("처음부터가 아니라 이어서 (같은 소리 요소)", await page.evaluate(() => window.__bgmEl === window.__bgm0));
await tapSound();
await nap(200);
{ const ev = await take(); check("돌아오면 효과음도 다시 난다", ev.some(x => /^play:/.test(x) && !/bgm/.test(x)), JSON.stringify(ev)); }

console.log("\n--- 4. 뒤에 있는 동안 화면이 바뀜 ---");
await page.evaluate(() => window.__goto("entry"));            /* 배경음악을 끄는 화면 */
await nap(100);
await fire("apppause");
await page.evaluate(() => window.__goto("lobby"));            /* 뒤에 있는 동안 로비로 (예: 광고가 덮은 채 나가기 처리) */
await nap(200);
check("뒤에 있는 동안은 새 배경음악을 안 튼다", !(await bgmOn()), JSON.stringify(await take()));
await fire("appresume");
await nap(100);
check("돌아오면 그때 튼다", await bgmOn(), JSON.stringify(await take()));

console.log("\n--- 5. 음소거한 사람 ---");
await page.evaluate(() => { const b = document.querySelector("#lobby #btMute"); if (b) b.click(); });
await nap(100);
check("(준비) 음소거", !(await bgmOn()));
await fire("apppause"); await nap(50); await fire("appresume"); await nap(100);
check("음소거했으면 돌아와도 안 나온다", !(await bgmOn()), JSON.stringify(await take()));
await page.evaluate(() => { const b = document.querySelector("#lobby #btMute"); if (b) b.click(); });
await nap(100);

console.log("\n--- 6. 화면 숨김만 올 때 ---");
check("(준비) 다시 나온다", await bgmOn());
await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
await nap(100);
check("화면이 숨으면 멈춘다", !(await bgmOn()));
await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
await nap(100);
check("다시 보이면 나온다", await bgmOn());

const bad = logs.filter(l => /^ERROR/.test(l));
check("화면에서 터진 것이 없다", bad.length === 0, JSON.stringify(bad.slice(0, 3)));
shut(srv, browser);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
