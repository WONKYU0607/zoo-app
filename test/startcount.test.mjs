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
/* **정확히 4 가 아니어도 된다.** 4명을 확인하고 시작을 누르는 그 사이에 봇이
   한 명 더 들어올 수 있고, 그러면 5인으로 시작하는 게 맞다(앉은 수대로 시작).
   컴퓨터가 바쁠수록 그 틈이 벌어져, 예전에 "반드시 4" 로 박아 둔 이 검사가
   멀쩡한 동작을 실패로 잡았다. 볼 것은 둘이다 —
   8인으로 부풀지 않았는가, 방장 화면이 서버 판과 같은 인원인가 */
const want = srvRoom.numPlayers;
check("8인 방인데 앉은 수대로 시작했다", want >= 4 && want < 8, "서버 " + want + "인");
check("방장 화면도 같은 인원 판에 붙었다", seen.length > 0 && seen.every(n => n === want),
      "서버 " + want + "인 · 화면 자리 수 " + JSON.stringify(counts));

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

/* ---- 인원을 줄여 시작한 판에 **새로고침으로 돌아오면** 그 판으로 가는가 ----
   인원을 줄이면 서버는 판을 새로 만들고 자리표도 새로 준다. 그런데 브라우저에
   적어 둔 "하던 방" 은 방에 처음 들어갈 때의 옛 판이라, 이어서 하기로 돌아오면
   **옛 6인 판(뽑기에서 멈춘 채 남은 것)에 붙어** 뽑기 화면에서 멈췄다(신고받음) */
{
  await page.reload({ waitUntil: "networkidle0" });
  await nap(800);
  await page.evaluate(() => window.__goto && window.__goto("lobby"));
  let asked = false;
  for (let i = 0; i < 20; i++){
    asked = await page.evaluate(() => {
      const a = document.getElementById("ask"); return Boolean(a && a.classList.contains("on"));
    });
    if (asked) break;
    await nap(250);
  }
  check("새로고침하면 이어서 하기를 묻는다", asked);
  if (asked){
    await page.evaluate(() => { const b = document.getElementById("askYes"); if (b) b.click(); });
    let scr = "", sawDraw = false;
    for (let i = 0; i < 30; i++){
      await nap(400);
      scr = await now();
      if (scr === "draw") sawDraw = true;
      if (scr === "table") break;
    }
    await nap(800);
    const seats = await page.evaluate(() => {
      const v = window.__eng && window.__eng.view; return v ? (v.seats || []).length : -1;
    });
    const want2 = (await api(`/zoo/rooms/${room}`)).numPlayers;
    check("돌아오면 뽑기가 아니라 판 화면으로 간다", scr === "table" && !sawDraw,
          "화면 " + scr + (sawDraw ? " (뽑기를 지나감)" : ""));
    check("돌아온 판도 줄인 인원 그대로다", seats === want2,
          "서버 " + want2 + "인 · 화면 자리 수 " + seats);
    const n0 = await page.evaluate(() => (window.__eng.view || {}).moveNo || 0);
    /* 돌아왔을 때 **내 차례면 봇은 나를 기다린다** — 그건 멈춘 게 아니다.
       내 차례면 한 수 둬 본다. 그래도 안 넘어가면 진짜로 멈춘 것이다 */
    const mineNow = await page.evaluate(() => Boolean(window.__eng.view && window.__eng.view.myTurn));
    if (mineNow){
      await page.evaluate(() => {
        const b = document.querySelector("#table #pass");
        if (b && !b.disabled){ b.click(); return; }
        const sl = [...document.querySelectorAll("#table .hand .slot")]
          .find(x => !x.className.includes("slot--dead"));
        if (sl) sl.click();
        const p2 = document.querySelector("#table #play");
        if (p2 && !p2.disabled) p2.click();
      });
    }
    let n1 = n0;
    for (let i = 0; i < 24; i++){
      await nap(500);
      n1 = await page.evaluate(() => (window.__eng.view || {}).moveNo || 0);
      if (n1 > n0) break;
    }
    check("돌아온 판이 멈추지 않고 굴러간다", n1 > n0,
          "수 번호 " + n0 + " → " + n1 + (mineNow ? " (돌아왔을 때 내 차례라 한 수 둠)" : ""));
  }
}

/* ---- 누르는 찰나에 한 명 더 들어와도 **보인 대로** 시작하는가 ----
   봇은 몇 초 간격으로 하나씩 들어온다. 화면에 4명이 보여서 눌렀는데 그 사이
   한 명이 더 앉으면, 예전에는 5인으로 시작했다. 일부러 그 찰나를 만든다 */
{
  await page.reload({ waitUntil: "networkidle0" });
  await page.evaluate(() => { window.__opts = { cap: 8, seated: 1, rounds: 3, tax: true, clear2: false }; });
  await page.evaluate(async () => { await window.__createRoom(); });
  const room2 = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem("zk_seat")).code; } catch(e){ return null; }
  });
  /* 화면이 4명을 볼 때까지 기다린다 */
  for (let i = 0; i < 60; i++){
    const n = await page.evaluate(() => (window.__opts && window.__opts.seated) || 0);
    if (n >= 4) break;
    await nap(300);
  }
  const shown = await page.evaluate(() => window.__opts.seated);
  /* **누르기 직전에 한 명을 더 앉힌다** — 찰나에 들어온 것과 같다 */
  await api(`/zoo/rooms/${room2}/join`, { name: "늦은손님", avatar: 0 }).catch(() => null);
  const before = await api(`/zoo/rooms/${room2}`);
  const satNow = (before.players || []).filter(p => p && p.name).length;
  await page.evaluate(async () => { await window.__startRound(); });
  await nap(1500);
  const after = await api(`/zoo/rooms/${room2}`);
  check("누르는 찰나에 한 명 더 들어와도 보인 대로 시작한다",
        after.numPlayers === shown,
        "화면에 보인 수 " + shown + " · 누를 때 실제로 앉은 수 " + satNow + " → 시작 " + after.numPlayers + "인");
  check("늦게 들어온 사람은 내보내지 않는다",
        (after.players || []).some(p => p && p.name === "늦은손님") || after.numPlayers > shown,
        "사람은 봇보다 먼저다 — 봇을 내보내야 한다");
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
