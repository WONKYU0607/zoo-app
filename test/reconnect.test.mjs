/* 판 도중 끊겼을 때 앱이 **어디로 가는가** — 진짜 브라우저 + 진짜 서버.

   2026-10-17 사용자 결정: 서버 문제로 끊긴 판은 **이어 하지 않고 그 자리에서 끝낸다.**
   서버가 그 판 사람 전원에게 "끝난 판까지 점수 + 100점 · 1승 · 낸 티켓" 을 준다.
   ("팅긴 판은 그 자리에서 파하면 안 됨? 어차피 티켓이랑 점수 다시 돌려주니까")
   **내 앱만 꺼졌다 켜진 것**(서버는 멀쩡)은 예전처럼 "이어서 하기" 로 돌아간다.

   보는 것:
     1. 내 앱만 새로고침 → 로비에 "이어서 하기" → 누르면 판 화면으로 바로(뽑기 다시 안 함)
     2. 앱을 켜 둔 채 서버가 꺼졌다 켜짐 → 몇 초 안에 "서버 문제로 이 게임이 끝났어요 … 100점 … 1승 … 티켓" 안내 + 로비.
        멈춘 판 화면에 남지 않는다. 하던 방 기록도 지운다. 서버 계정에는 100점 이상·1승·티켓 반환
     3. 앱을 끈 사이 서버가 꺼졌다 켜짐 → 다시 켜면 "이어서 하기" 대신 같은 안내
     4. 게임 도중 "나가기" → 하던 방 기록이 지워지고, 돌아가라고 묻지 않는다
     5. 대기실에 있는데 서버가 빈 디스크로 켜짐(대기 기계로 넘어감 — 대기실도 없어진다) → "방이 없어졌습니다" + 로비

   쓰는 법:  node test/reconnect.test.mjs   (서버는 이 검사가 직접 켜고 끈다) */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

const PORT = Number(process.env.ZOO_TEST_PORT || 8137);
const SRV = "http://127.0.0.1:" + PORT;
const DIR = mkdtempSync(join(tmpdir(), "zoo-recon-"));
/* 게임 서버 폴더. 보통 앱 폴더와 나란히 있다 */
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

/* 계정은 서버 메모리 + 파일(껐다 켜도 남게) · 로그인 표는 검사용("test:r1") */
let proc = null;
const boot = (dir = DIR) => { proc = spawn(process.execPath, ["server.js"], {
  cwd: SERVER_DIR,
  env: { ...process.env, PORT: String(PORT), ZOO_DATA_DIR: dir, ZOO_BOT_MS: "400", ZOO_BOT_JOIN_MS: "300",
         NODE_ENV: "test", ZOO_ACCOUNTS: "memory", ZOO_TEST_TOKENS: "1", ZOO_ACCT_FILE: join(DIR, "acct.json"), ZOO_ALERT_URL: "" },
  stdio: "ignore" }); };
async function up(){
  for (let i = 0; i < 40; i++){
    try { const r = await fetch(SRV + "/zoo/health"); if ((await r.json()).ok) return true; } catch(e){}
    await nap(300);
  }
  return false;
}
const kill = async () => { if (proc){ const p = proc; proc = null; p.kill("SIGKILL"); for (let i = 0; i < 40 && p.exitCode === null && p.signalCode === null; i++) await nap(50); } };
const api = async (p, b) => { const r = await fetch(SRV + p, { method: b ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text(); let j = {}; try { j = t ? JSON.parse(t) : {}; } catch(e){} return Object.assign({ _s: r.status }, j); };
const bye = async code => { await kill(); shut(srv, browser); try { rmSync(DIR, { recursive: true, force: true }); } catch(e){}
  console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n"); process.exit(code); };

console.log("\n=== 판 도중 끊기면 어디로 가는가 ===\n");
boot();
if (!(await up())){ console.log("서버가 안 떴습니다"); await kill(); process.exit(1); }
await api("/zoo/test/acct/r1", { name: "원규", avatar: 1, score: 0, games: 0, played: 0, wins: 0, tickets: 3, ticketAt: Date.now() });

ensureBuild();
const srv = await serve(5811);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((s) => {
  globalThis.__ZOO_SERVER = s;
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
  /* 앱(main.js)이 덮어쓰지 못하게 못박는다 */
  Object.defineProperty(window, "__idToken", { configurable: false, get(){ return async () => "test:r1"; }, set(){} });
}, SRV);
const appUrl = page.url();
await page.reload({ waitUntil: "networkidle0" });

const now = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);
const seatRec = () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem("zk_seat") || "null"); } catch(e){ return "?"; } });
const askOf = () => page.evaluate(() => {
  const a = document.getElementById("ask");
  return a && a.classList.contains("on") ? { t: document.getElementById("askT").textContent, m: document.getElementById("askM").textContent,
    y: document.getElementById("askYes").textContent } : null;
});
const closeAsk = () => page.evaluate(() => { const b = document.getElementById("askYes"); if (b) b.click(); });

/* 방을 만들고 봇으로 채워 시작하고, 뽑기를 지나 판 화면까지 */
async function playToTable(){
  await page.evaluate(() => { window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false }; });
  await page.evaluate(async () => { await window.__createRoom(); });
  await page.evaluate(() => window.__goto("room"));
  for (let i = 0; i < 90; i++){ if (await page.evaluate(() => (window.__opts && window.__opts.seated) || 0) >= 4) break; await nap(300); }
  await page.evaluate(async () => { await window.__startRound(); });
  for (let k = 0; k < 120; k++){
    if (await now() === "table") break;
    await page.evaluate(() => {
      const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
      if (c) c.click();
      const g = document.querySelector("#draw #go");
      if (g && !g.disabled) g.click();
    });
    await nap(400);
  }
  return (await now()) === "table";
}

/* ---------- 1. 내 앱만 새로고침 ---------- */
console.log("--- 1. 내 앱만 꺼졌다 켜짐 (서버는 멀쩡) ---");
check("(준비) 판 화면까지 갔다", await playToTable(), "화면 " + (await now()));
if ((await now()) !== "table") await bye(1);
await nap(2000);
const seat1 = await seatRec();
check("하던 방을 브라우저에 적어 뒀다", Boolean(seat1 && seat1.code), seat1 ? "방 " + seat1.code : "안 적음");
await page.reload({ waitUntil: "networkidle0" });
await nap(1200);
await page.evaluate(() => window.__goto && window.__goto("lobby"));
await nap(2500);
let q = await askOf();
check("**로비에 \"이어서 하기\" 가 뜬다**", Boolean(q) && q.y === "이어서 하기", q ? q.t + " / " + q.m : "안 뜸");
if (q){
  await closeAsk();
  let back = false, sawDraw = false;
  for (let i = 0; i < 40; i++){
    await nap(500);
    const on = await now();
    if (on === "draw") sawDraw = true;
    if (on === "table" || on === "room"){ back = true; break; }
  }
  check("눌러서 하던 판으로 돌아간다", back && (await now()) === "table", "화면 " + (await now()));
  check("뽑기를 다시 하지 않는다", !sawDraw);
}

/* ---------- 2. 앱을 켜 둔 채 서버가 꺼졌다 켜짐 ---------- */
console.log("\n--- 2. 앱을 켜 둔 채 서버가 꺼졌다 켜짐 (배포·Fly 기계 재부팅) ---");
const before = (await api("/zoo/test/acct/r1"));
check("(준비) 시작할 때 티켓 한 장을 냈다 (3 → 2)", before.tickets === 2, String(before.tickets));
await kill(); await nap(1500); boot();
check("(준비) 서버가 다시 떴다", await up());
let gone = null;
const t2 = Date.now();
for (let i = 0; i < 60 && !gone; i++){ await nap(500); const a = await askOf(); if (a && /끝났/.test(a.t)) gone = a; }
check("**몇 초 안에 \"게임이 끝났습니다\" 안내가 뜬다** (멈춘 판 화면에 남지 않는다)", Boolean(gone), gone ? Math.round((Date.now() - t2) / 1000) + "초 · " + gone.t : "안 뜸 · 화면 " + (await now()));
check("안내에 서버 문제 · 100점 · 1승 · 티켓이 적혀 있다", gone && /서버 문제/.test(gone.m) && /100점/.test(gone.m) && /1승/.test(gone.m) && /티켓/.test(gone.m), gone && gone.m);
check("로비로 갔다", (await now()) === "lobby", "화면 " + (await now()));
check("하던 방 기록을 지웠다", !(await seatRec()));
const after = await api("/zoo/test/acct/r1");
check("**서버 계정: 100점 이상 · 1승 · 티켓 돌려받음 (2 → 3)**", after.score >= 100 && after.played === 1 && after.wins === 1 && after.tickets === 3,
  JSON.stringify({ score: after.score, played: after.played, wins: after.wins, tickets: after.tickets }));
await closeAsk();
await nap(400);

/* ---------- 3. 앱을 끈 사이 서버가 꺼졌다 켜짐 ---------- */
console.log("\n--- 3. 앱을 끈 사이 서버가 꺼졌다 켜짐 ---");
check("(준비) 다시 판 화면까지 갔다", await playToTable(), "화면 " + (await now()));
await nap(1500);
check("(준비) 하던 방을 적어 뒀다", Boolean((await seatRec() || {}).code));
await page.goto("about:blank");                         /* 앱을 끈다 */
await kill(); await nap(1200); boot();
check("(준비) 서버가 다시 떴다", await up());
await page.goto(appUrl, { waitUntil: "networkidle0" }); /* 다시 켠다 */
await nap(1200);
await page.evaluate(() => window.__goto && window.__goto("lobby"));
let q3 = null;
for (let i = 0; i < 20 && !q3; i++){ await nap(300); q3 = await askOf(); }
check("**\"이어서 하기\" 대신 \"게임이 끝났습니다\" 안내가 뜬다**", Boolean(q3) && /끝났/.test(q3.t) && q3.y !== "이어서 하기", q3 ? q3.t + " / " + q3.m : "안 뜸");
check("하던 방 기록을 지웠다", !(await seatRec()));
check("돌아갈 곳이 없다고 본다", !(await page.evaluate(async () => { try { return await window.__resumable(); } catch(e){ return "err"; } })));
await closeAsk();
await nap(400);

/* ---------- 4. 게임 도중 나가기 ---------- */
console.log("\n--- 4. 게임 도중 \"나가기\" ---");
check("(준비) 다시 판 화면까지 갔다", await playToTable(), "화면 " + (await now()));
await nap(1000);
await page.evaluate(() => { if (window.__quitGame) window.__quitGame(); });
await nap(600);
check("나간 게임은 기록에서 지워진다", !(await seatRec()));
const again = await page.evaluate(async () => { try { return await window.__resumable(); } catch(e){ return "err"; } });
check("나간 게임으로 돌아가라고 묻지 않는다", !again, again ? JSON.stringify(again).slice(0, 60) : "");
/* 나간 뒤 6초가 넘게 기다려도 "끝났다" 안내가 뜨면 안 된다 (판 지켜보기가 꺼졌는가) */
await nap(7000);
const q4 = await askOf();
check("나간 뒤에는 \"서버 문제로 끝남\" 안내가 안 뜬다", !q4 || !/끝났/.test(q4.t), q4 ? q4.t : "");

/* ---------- 5. 대기실에 있는데 서버가 빈 디스크로 켜짐 ---------- */
console.log("\n--- 5. 대기실에 있는데 서버가 빈 디스크로 켜짐 (대기 기계로 넘어감) ---");
await page.evaluate(() => { window.__opts = { cap: 6, seated: 1, rounds: 3, tax: true, clear2: false }; });
await page.evaluate(async () => { await window.__createRoom(); });
await page.evaluate(() => window.__goto("room"));
await nap(1500);
check("(준비) 대기실에 있다", (await now()) === "room");
const DIR2 = mkdtempSync(join(tmpdir(), "zoo-recon2-"));
await kill(); await nap(800); boot(DIR2);
check("(준비) 서버가 빈 디스크로 다시 떴다", await up());
let q5 = null;
for (let i = 0; i < 30 && !q5; i++){ await nap(400); const a = await askOf(); if (a && /없어졌/.test(a.t)) q5 = a; }
check("**\"방이 없어졌습니다\" 안내가 뜨고 로비로 간다** (없는 대기실에 남지 않는다)", Boolean(q5) && (await now()) === "lobby", q5 ? q5.t + " / " + q5.m : "안 뜸 · 화면 " + (await now()));
check("하던 방 기록을 지웠다", !(await seatRec()));
try { rmSync(DIR2, { recursive: true, force: true }); } catch(e){}

await bye(fail ? 1 : 0);
