/* 폰 하단바 뒤로가기 + 앱 종료 확인창.

   웹은 브라우저 뒤로가기(popstate), 안드로이드 껍데기는 Capacitor 의 backButton —
   둘 다 window.__back() 으로 들어온다. 아무것도 안 걸어 두면 한 번에 앱 밖으로 나간다.

   진짜 브라우저가 필요하다(크롬이 없으면 건너뛴다). */
import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
if (!(await findBrowser())){
  console.log("\n크롬을 못 찾아 뒤로가기 검사를 건너뜁니다.\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
ensureBuild();
const srv = await serve(5638);
const { browser, page, logs } = await open({ srv });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("zk_lang","ko"); } catch(e){} });
await page.reload({ waitUntil: "networkidle0" });
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++;
  console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };
const now = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id || "-");
const askOn = () => page.evaluate(() => document.getElementById("ask").classList.contains("on"));
const askTxt = () => page.evaluate(() => (document.getElementById("askM")||{}).textContent || "");
const back = async () => { await page.evaluate(() => window.__back()); await new Promise(r=>setTimeout(r,250)); };

check("확인창이 화면에 심어졌다", await page.evaluate(() => Boolean(document.getElementById("ask"))));
/* 진입창 */
check("진입창이다", await now() === "entry", await now());
await back();
check("진입창에서 뒤로 → 종료 확인", await askOn() && /종료/.test(await askTxt()), await askTxt());
await back();
check("한 번 더 누르면 창만 닫힌다", !(await askOn()));

/* 로비 */
await page.evaluate(() => window.__goto("lobby"));
await new Promise(r=>setTimeout(r,300));
await back();
check("로비에서 뒤로 → 종료 확인", await askOn());
await page.evaluate(() => document.querySelector("#askNo").click());
await new Promise(r=>setTimeout(r,200));
check("취소를 누르면 닫힌다", !(await askOn()));

/* 설정 창이 열려 있으면 그것만 닫힌다 */
await page.evaluate(() => document.getElementById("cfg").classList.add("on"));
await back();
check("설정 창이 열려 있으면 그것만 닫는다",
  !(await page.evaluate(() => document.getElementById("cfg").classList.contains("on"))) && !(await askOn()));
check("그때 종료 확인은 안 뜬다", !(await askOn()));

/* 랭킹 */
await page.evaluate(() => window.__goto("rank"));
await new Promise(r=>setTimeout(r,300));
await back();
check("랭킹에서 뒤로 → 로비", await now() === "lobby", await now());

/* 판 */
await page.evaluate(async () => {
  window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false };
  await window.__createRoom();
});
for (let i = 0; i < 60; i++){
  if (await page.evaluate(() => (window.__opts&&window.__opts.seated)||0) >= 4) break;
  await new Promise(r=>setTimeout(r,300));
}
await page.evaluate(() => window.__goto("room"));
await new Promise(r=>setTimeout(r,300));
await back();
check("방 대기실에서 뒤로 → 방 나가기 확인",
  await askOn() && /방에서 나갈까요/.test(await askTxt()), await askTxt());
await page.evaluate(() => document.querySelector("#askNo").click());
await page.evaluate(async () => { await window.__startRound(); });
for (let i = 0; i < 60; i++){
  if (await page.evaluate(() => window.__eng?.view?.phase) === "play") break;
  await new Promise(r=>setTimeout(r,200));
}
await back();
check("뽑기에서는 뒤로가기가 막힌다", !(await askOn()) && await now() === "draw", await now());
await page.evaluate(() => { const g=document.querySelector("#draw #go"); if(g) g.click(); });
for (let i = 0; i < 40; i++){
  if (await now() === "table") break;
  await new Promise(r=>setTimeout(r,200));
}
await back();
check("판에서 뒤로 → 완주 실패 확인", await askOn() && /완주 실패/.test(await askTxt()), await askTxt());
await page.evaluate(() => document.querySelector("#askYes").click());
await new Promise(r=>setTimeout(r,500));
check("나가기를 누르면 로비로", await now() === "lobby", await now());

check("화면에서 터진 것이 없다", logs.filter(l=>/^ERROR/.test(l)).length === 0,
  JSON.stringify(logs.filter(l=>/^ERROR/.test(l)).slice(0,2)));
console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
