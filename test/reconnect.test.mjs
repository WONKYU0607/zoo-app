/* 서버를 껐다 켰을 때 **하던 방으로 돌아갈 수 있는가**.

   `persisttest.js`(서버 쪽)는 방이 살아남는지만 봤다. 그런데 방이 살아남아도
   **앱이 그 방으로 못 돌아가면 아무 소용이 없다.** 실제로 그랬다 —
   서버는 rooms:1 인데 폰은 멈춰 있고, 새로고침하면 진입창으로 갔다.
   방 번호·자리표를 브라우저 어디에도 안 적고 있었기 때문이다.

   여기서는 진짜 브라우저로 방에 들어간 뒤 서버를 죽였다 살리고,
   새로고침해서 **로비에 "이어서 하기" 가 뜨는지, 눌러서 돌아가는지** 본다.

   쓰는 법:  node test/reconnect.test.mjs   (서버는 이 검사가 직접 켜고 끈다) */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

const PORT = Number(process.env.ZOO_TEST_PORT || 8137);
const SRV = "http://127.0.0.1:" + PORT;
const DIR = mkdtempSync(join(tmpdir(), "zoo-recon-"));
/* 게임 서버 폴더. 보통 앱 폴더와 나란히 있다.
   내 컴퓨터 경로를 박아 두면 다른 사람 컴퓨터에서는 못 찾는다 —
   실제로 `spawn ... ENOENT` 로 터졌다 */
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = process.env.ZOO_SERVER_DIR ||
  [join(HERE, "..", "..", "zoo-server"), "/home/claude/zoo-server"]
    .find(p => existsSync(join(p, "server.js"))) || "";
if (!SERVER_DIR){
  console.log("\n게임 서버 폴더를 못 찾아 건너뜁니다 (zoo-server 가 zoo-app 과 나란히 있어야 합니다)\n");
  process.exit(0);
}

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));

let proc = null;
const boot = () => { proc = spawn(process.execPath, ["server.js"], {
  cwd: SERVER_DIR,
  env: { ...process.env, PORT: String(PORT), ZOO_DATA_DIR: DIR, ZOO_BOT_MS: "400" },
  stdio: "ignore" }); };
async function up(){
  for (let i = 0; i < 40; i++){
    try { const r = await fetch(SRV + "/zoo/health"); if ((await r.json()).ok) return true; } catch(e){}
    await nap(300);
  }
  return false;
}
const kill = () => { if (proc){ proc.kill("SIGKILL"); proc = null; } };

console.log("\n=== 껐다 켜도 하던 방으로 돌아가는가 ===\n");

boot();
if (!(await up())){ console.log("서버가 안 떴습니다"); kill(); process.exit(1); }

ensureBuild();
const srv = await serve(5811);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((s) => {
  globalThis.__ZOO_SERVER = s;
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
}, SRV);
await page.reload({ waitUntil: "networkidle0" });

const now = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);
await page.evaluate(() => { window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false }; });
await page.evaluate(async () => { await window.__quickJoin(); });
await page.evaluate(() => window.__goto("room"));
for (let i=0;i<90;i++){ if (await page.evaluate(()=>(window.__opts&&window.__opts.seated)||0)>=4) break;
  await nap(300); }
await page.evaluate(async () => { await window.__startRound(); });
for (let k=0;k<120;k++){
  if (await now() === "table") break;
  await page.evaluate(() => {
    const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
    if (c) c.click();
    const g = document.querySelector("#draw #go");
    if (g && !g.disabled) g.click();
  });
  await nap(400);
}
check("판 화면까지 갔다", (await now()) === "table", "화면 " + (await now()));
if ((await now()) !== "table"){ kill(); shut(srv, browser); process.exit(1); }
await nap(2500);

/* 자리를 적어 뒀는가 — 이게 없으면 돌아갈 방법이 없다 */
const seat = await page.evaluate(() => { try { return localStorage.getItem("zk_seat"); } catch(e){ return null; } });
check("하던 방을 브라우저에 적어 뒀다", Boolean(seat && JSON.parse(seat).code),
      seat ? "방 " + JSON.parse(seat).code : "안 적음");

/* ---- 서버를 죽였다 살린다. 배포할 때와 같은 상황 ---- */
console.log("\n  (서버를 죽였다가 다시 켭니다)\n");
kill(); await nap(1500); boot();
if (!(await up())){ console.log("다시 안 떴습니다"); kill(); shut(srv, browser); process.exit(1); }
/* 살아나자마자 묻지 않는다 — 방 되살리기는 서버가 뜬 **뒤에** 돈다 */
let h = { rooms: 0 };
for (let i = 0; i < 20; i++){
  h = await (await fetch(SRV + "/zoo/health")).json();
  if ((h.rooms || 0) > 0) break;
  await nap(500);
}
check("서버가 방을 들고 있다", (h.rooms || 0) > 0, "방 " + h.rooms + "개");

/* ---- 새로고침. 폰에서 하신 것과 같다 ---- */
await page.reload({ waitUntil: "networkidle0" });
await nap(1200);
await page.evaluate(() => window.__goto && window.__goto("lobby"));
await nap(2500);

const askOn = await page.evaluate(() => {
  const a = document.getElementById("ask");
  return Boolean(a && a.classList.contains("on"));
});
const askMsg = await page.evaluate(() => (document.getElementById("askM")||{}).textContent || "");
check("로비에 이어서 하기 창이 뜬다", askOn, askMsg || "안 뜸");

if (askOn){
  console.log("    (서버가 말하는 방 상태: " + JSON.stringify(await page.evaluate(async () => {
    try { const r = await window.__resumable(); return r; } catch(e){ return "읽기 실패"; }
  })) + ")");
  await page.evaluate(() => { const b = document.getElementById("askYes"); if (b) b.click(); });
  let back = false, sawDraw = false;
  for (let i = 0; i < 40; i++){
    await nap(500);
    const on = await now();
    if (on === "draw") sawDraw = true;          /* 뽑기를 다시 하면 안 된다 */
    if (on === "table" || on === "room"){ back = true; break; }
  }
  check("눌러서 하던 방으로 돌아간다", back, "화면 " + (await now()));
  /* **이미 굴러가던 판이면 판 화면으로 바로 가야 한다.**
     무조건 뽑기 길을 타면 패 뽑기와 시작 카운트가 다시 뜬다 */
  check("뽑기를 다시 하지 않는다", !sawDraw, sawDraw ? "뽑기 화면을 또 지나감" : "");
  check("판 화면으로 바로 간다", (await now()) === "table", "화면 " + (await now()));
}

/* ---- 게임 도중 나가면 **그 게임은 내 손에서 떠나야** 한다 ----
   예전에는 "하던 방" 기록을 안 지워서, 다른 게임을 하고 로비에 오면
   나간 게임으로 돌아가라고 물었다 */
await page.evaluate(() => { if (window.__quitGame) window.__quitGame(); });
await nap(600);
const leftSeat = await page.evaluate(() => { try { return localStorage.getItem("zk_seat"); } catch(e){ return "?"; } });
check("나간 게임은 기록에서 지워진다", !leftSeat, leftSeat ? "남아 있음" : "");
const again = await page.evaluate(async () => {
  try { return await window.__resumable(); } catch(e){ return "err"; }
});
check("나간 게임으로 돌아가라고 묻지 않는다", !again, again ? JSON.stringify(again).slice(0, 60) : "");

kill();
shut(srv, browser);
try { rmSync(DIR, { recursive: true, force: true }); } catch(e){}
console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
