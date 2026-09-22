/* 빠른참가 화면 — **이미 있는 방에만 들어가고, 빈방 수를 보여 주는가**.

   - 빈방이 없으면 새 방을 만들지 않고 단추 밑에 "지금 들어갈 방이 없습니다"
     (예전에는 새 방을 만들어 방장으로 앉혀서, 방 만들기와 똑같았다)
   - 빠른참가 단추에 빈방 수가 뜨고, 누가 방을 만들면 늘어난다
   - 빈방이 있으면 거기 들어가고 **방장이 아니다**

   쓰는 법:  창1) cd zoo-server && node server.js
             창2) node test/quickjoin.test.mjs   */

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
const srv = await serve(5921);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((s) => {
  globalThis.__ZOO_SERVER = s;
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
}, SRV);
await page.reload({ waitUntil: "networkidle0" });
/* 로비로 간다 — 진입창에서 로비로 넘어가는 데 잠깐 걸린다. 넘어간 걸 보고 시작한다 */
const toLobby = async () => {
  for (let i = 0; i < 20; i++){
    await page.evaluate(() => window.__goto && window.__goto("lobby"));
    await nap(300);
    if ((await page.evaluate(() => (document.querySelector(".page.is-on")||{}).id)) === "lobby") return true;
  }
  return false;
};
check("로비에 섰다", await toLobby());
await nap(600);

const badge = () => page.evaluate(() => {
  const e = document.getElementById("qOpen");
  return e ? { hidden: e.hidden, text: e.textContent, n: Number(e.dataset.n) } : null;
});
const now = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);

/* ---- 빈방 수가 단추에 뜬다 ---- */
const n0 = (await api("/zoo/open")).count;
let b = await badge();
check("빠른참가 단추에 빈방 수가 뜬다", b && !b.hidden && b.n === n0, b ? b.text : "칸 없음");
check("단추 글자는 그대로 있다",
      await page.evaluate(() => (document.getElementById("btQuickT")||{}).textContent === "빠른 참가"));

/* ---- 빈방이 없을 때 누르면 ---- */
if (n0 === 0){
  await toLobby();
  await page.evaluate(() => document.querySelector("#lobby #btQuick").click());
  await nap(700);
  const hint = await page.evaluate(() => (document.getElementById("hQuick")||{}).textContent || "");
  check("빈방이 없으면 로비에 그대로 있다 (새 방을 안 만든다)", (await now()) === "lobby", "화면 " + (await now()));
  check("단추 밑에 '들어갈 방이 없습니다' 가 뜬다", /들어갈 방이 없습니다/.test(hint), hint);
  check("빈방 수는 여전히 0", (await api("/zoo/open")).count === 0);
} else {
  check("빈방이 없을 때 (다른 방이 열려 있어 건너뜀)", true, "빈방 " + n0);
}

/* ---- 누가 방을 만들면 빈방 수가 늘어난다 ---- */
const other = await api("/zoo/rooms", { name: "남의방장", avatar: 2, numPlayers: 4, rounds: 3, tax: true });
let grew = false;
for (let i = 0; i < 16; i++){
  await nap(500);
  b = await badge();
  if (b && b.n > n0){ grew = true; break; }
}
check("누가 방을 만들면 빈방 수가 늘어난다 (몇 초 안에)", grew, b ? b.text : "");

/* ---- 빈방이 있으면 거기 들어가고 방장이 아니다 ---- */
await toLobby();
await page.evaluate(() => document.querySelector("#lobby #btQuick").click());
for (let i = 0; i < 20; i++){ if ((await now()) === "room") break; await nap(250); }
const seat = await page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem("zk_seat")); } catch(e){ return null; }
});
check("빈방이 있으면 대기실로 들어간다", (await now()) === "room", "화면 " + (await now()));
check("남이 판 그 방에 들어갔다", Boolean(seat && seat.code === other.code),
      "들어간 방 " + (seat && seat.code) + " · 남의 방 " + other.code);
check("빠른참가로 들어가면 방장이 아니다", Boolean(seat && seat.playerID !== "0"),
      "자리 " + (seat && seat.playerID));

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
