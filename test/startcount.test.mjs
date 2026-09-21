/* 큰 방을 파 놓고 적은 인원으로 시작하면 **그 인원으로 노는가**.

   8인 방에 4명일 때 시작하면 4인 게임이어야 한다. 서버는 4인 판을 새로 만들고
   자리표도 새로 주는데, 방장이 그걸 안 받아 와서 **옛 8인 판에 붙었다.**
   화면에는 "4인으로 뽑기에 들어갔다가 곧바로 8인이 되는" 것으로 보였다.

   서버 쪽만 보는 검사(roomtest)는 이걸 못 잡았다 — 서버는 제대로 4인이었으니까.
   **방장 화면이 실제로 몇 명짜리 판에 붙었는지**를 본다.

   쓰는 법:  창1) cd zoo-server && node server.js
             창2) node test/startcount.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

const SRV = process.env.ZOO_SERVER || "http://127.0.0.1:8000";
try { await fetch(SRV + "/zoo/health"); }
catch (e){ console.log("\n게임 서버가 안 떠 있어 건너뜁니다 (" + SRV + ")\n"); process.exit(0); }
if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));
const api = async (p, b) => { const r = await fetch(SRV + p, { method: b ? "POST" : "GET",
  headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text(); if (!r.ok) throw new Error(t); return t ? JSON.parse(t) : {}; };

ensureBuild();
const srv = await serve(5881);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((s) => {
  globalThis.__ZOO_SERVER = s;
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
}, SRV);
await page.reload({ waitUntil: "networkidle0" });

/* 방장이 8인 방을 판다 */
await page.evaluate(() => { window.__opts = { cap: 8, seated: 1, rounds: 3, tax: true, clear2: false }; });
await page.evaluate(async () => { await window.__createRoom(); });
const code = await page.evaluate(() => window.__net && window.__net.code || (window.__room && window.__room.code));
const room = code || (await page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem("zk_seat")).code; } catch(e){ return null; }
}));
check("8인 방을 팠다", Boolean(room), "방 " + room);
if (!room){ shut(srv, browser); process.exit(1); }

/* **봇이 채우게 둔다** — 실제로는 혼자 방을 파고 봇이 들어오는 경우가 대부분이다.
   사람만 넣어 보는 검사는 이 경로를 안 지나서 "고쳤다" 고 잘못 말한 적이 있다.
   4명이 될 때까지 기다렸다 시작한다 */
let seated = 0;
for (let i = 0; i < 60; i++){
  const r = await api(`/zoo/rooms/${room}`);
  seated = (r.players || []).filter(p => p && p.name).length;
  if (seated >= 4) break;
  await nap(500);
}
console.log("  시작 직전 앉은 수: " + seated);

/* 방장이 시작 */
await page.evaluate(async () => { await window.__startRound(); });
const now = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);
for (let k = 0; k < 60; k++){
  if (await now() === "table") break;
  await page.evaluate(() => {
    const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
    if (c) c.click();
    const g = document.querySelector("#draw #go");
    if (g && !g.disabled) g.click();
  });
  await nap(400);
}

/* 뽑기부터 판까지 **방장 화면이 몇 명짜리인지** 여러 번 본다.
   곧바로 8인으로 바뀌는지가 관건이다 */
const counts = [];
for (let i = 0; i < 12; i++){
  counts.push(await page.evaluate(() => {
    const v = window.__eng && window.__eng.view;
    return v ? (v.seats || []).length : -1;
  }));
  await nap(400);
}
const seen = counts.filter(n => n > 0);
const srvRoom = await api(`/zoo/rooms/${room}`);
check("서버는 4인 판이다", srvRoom.numPlayers === 4, "서버 " + srvRoom.numPlayers + "인");
check("방장 화면도 4인 판에 붙었다", seen.length > 0 && seen.every(n => n === 4),
      "화면 자리 수 " + JSON.stringify(counts));

/* **판이 실제로 굴러가는가.** 봇 자리가 빈 채로 남으면 아무도 안 둬서 멈추거나,
   봇 대리인이 빈 자리를 두려다 서버가 통째로 죽었다 */
{
  const n0 = await page.evaluate(() => (window.__eng.view || {}).moveNo || 0);
  let n1 = n0;
  for (let i = 0; i < 30; i++){
    await nap(500);
    n1 = await page.evaluate(() => (window.__eng.view || {}).moveNo || 0);
    if (n1 > n0 + 2) break;
  }
  let alive = false;
  try { alive = Boolean((await api("/zoo/health")).ok); } catch(e){}
  check("판이 굴러간다 (봇이 둔다)", n1 > n0, "수 번호 " + n0 + " → " + n1);
  check("서버가 안 죽었다", alive);
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
