/* **서버에 못 붙을 때 조용히 먹통이 되면 안 된다.**

   폰이 인터넷이 끊겼거나 서버가 내려가면, 방 만들기·빠른참가를 눌러도
   예전에는 **아무 일도 안 일어났다**(실패를 받는 곳이 없었다).
   사용자는 앱이 먹통이라고 느낀다. 안내 줄에 알려야 한다.

   서버를 일부러 안 띄우고, 있지도 않은 주소를 서버로 준다.
   쓰는 법:  node test/offline.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5941);
const { browser, page } = await open({ srv });
/* 아무도 안 듣는 주소 — 붙으려 하면 실패한다 */
await page.evaluateOnNewDocument(() => {
  globalThis.__ZOO_SERVER = "http://127.0.0.1:9";
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
});
await page.reload({ waitUntil: "networkidle0" });
const now = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);
for (let i = 0; i < 20; i++){
  await page.evaluate(() => window.__goto && window.__goto("lobby"));
  await nap(300);
  if ((await now()) === "lobby") break;
}
check("로비에 섰다", (await now()) === "lobby", "화면 " + (await now()));

const hint = () => page.evaluate(() => (document.getElementById("hQuick")||{}).textContent || "");

/* 빠른참가 */
await page.evaluate(() => document.querySelector("#lobby #btQuick").click());
await nap(900);
check("빠른참가: 서버에 못 붙으면 알려 준다", /연결할 수 없|들어갈 방이 없/.test(await hint()), await hint());
check("빠른참가: 로비에 그대로 있다", (await now()) === "lobby", "화면 " + (await now()));

await nap(2600);
/* 방 만들기 — 설정 창을 열고 시작을 누른다 */
await page.evaluate(() => document.querySelector("#lobby #btNew").click());
await nap(400);
const opened = await page.evaluate(() =>
  Boolean(document.getElementById("opts") && document.getElementById("opts").classList.contains("on")));
check("방 만들기 창이 열린다", opened);
if (opened){
  await page.evaluate(() => { const b = document.getElementById("optGo"); if (b) b.click(); });
  /* 안내는 2.5초 뒤 사라진다. 그 전에 읽어야 한다 */
  await nap(900);
  const dbg = await page.evaluate(() => ({
    hint: (document.getElementById("hQuick")||{}).textContent || "",
    opts: Boolean(document.getElementById("opts") && document.getElementById("opts").classList.contains("on")),
    on: (document.querySelector(".page.is-on")||{}).id,
    hasCreate: typeof window.__createRoom,
  }));
  check("방 만들기: 서버에 못 붙으면 알려 준다", /연결할 수 없/.test(dbg.hint), JSON.stringify(dbg));
  check("방 만들기: 로비에 그대로 있다", (await now()) === "lobby", "화면 " + (await now()));
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
