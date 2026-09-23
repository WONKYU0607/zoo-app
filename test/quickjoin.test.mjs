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
/* **"늘었나" 로 보면 안 된다.** 검사를 여럿 동시에 돌리면 다른 검사도 같은 서버에
   방을 만들고 지운다. 내가 만든 방이 늘어난 순간 남의 방이 사라질 수도 있다.
   볼 것은 **단추에 뜬 수가 서버가 말하는 수와 같은가** 이다 */
let same = false, srvN = 0;
for (let i = 0; i < 16; i++){
  await nap(500);
  srvN = (await api("/zoo/open")).count;
  b = await badge();
  if (b && !b.hidden && b.n === srvN && srvN >= 1){ same = true; break; }
}
check("단추의 빈방 수가 서버와 맞는다 (몇 초 안에)", same,
      "단추 " + (b ? b.text : "-") + " · 서버 " + srvN + "개");

/* ---- 빈방이 있으면 거기 들어가고 방장이 아니다 ---- */
await toLobby();
await page.evaluate(() => document.querySelector("#lobby #btQuick").click());
for (let i = 0; i < 20; i++){ if ((await now()) === "room") break; await nap(250); }
const seat = await page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem("zk_seat")); } catch(e){ return null; }
});
check("빈방이 있으면 대기실로 들어간다", (await now()) === "room", "화면 " + (await now()));
/* **내가 만든 방이 아니어도 된다.** 검사를 여럿 동시에 돌리면 다른 검사가 만든
   방이 먼저 잡힐 수 있다. 볼 것은 "시작 안 한 남의 방에, 방장이 아닌 자리로" 다 */
const joinedRoom = seat && seat.code;
const info = joinedRoom ? await api(`/zoo/rooms/${joinedRoom}`).catch(() => null) : null;
check("시작 안 한 방에 들어갔다", Boolean(info && info.started === false),
      "들어간 방 " + joinedRoom + (joinedRoom === other.code ? " (내가 만든 방)" : " (다른 방)"));
check("빠른참가로 들어가면 방장이 아니다", Boolean(seat && seat.playerID !== "0"),
      "자리 " + (seat && seat.playerID));

/* ---- 나갔다 다시 들어가면 **내가 둘이 되면 안 된다** ----
   대기실에서 나갈 때 서버에 "나갔다" 고 안 알리면 자리가 남는다. 그 상태로
   빠른참가를 다시 누르면 새 자리를 받아 **같은 사람이 두 자리를 차지했다**(신고받음).
   화면 위 `‹` 와 폰 뒤로가기 **둘 다** 확인한다 — 예전에는 `‹` 만 새고 있었다 */
/* **이름이 아니라 "봇이 아닌 사람 수" 로 센다.** 이름은 화면에서 못 읽는 경우가 있고,
   방장 하나 + 나 하나 = 사람 둘이 정답이다. 내가 둘이 되면 셋이 된다 */
/* **들어가 있는 방**의 사람 수를 센다. 내 자리가 남는지는 "나가면 한 명 줄어드는가" 로 본다 —
   이름이나 방 번호를 박아 두면 동시 실행에서 엉뚱하게 실패한다 */
let roomNow = joinedRoom;
const humansIn = async c => {
  if (!c) return 0;
  const r = await api(`/zoo/rooms/${c}`).catch(() => null);
  return r ? (r.players || []).filter(p => p && p.name && !p.bot).length : 0;
};
check("들어간 방에 사람이 둘 이상이다 (방장 + 나)", (await humansIn(roomNow)) >= 2,
      "사람 " + (await humansIn(roomNow)) + "명");

/* ---- 나갔다 다시 들어가면 **내가 둘이 되면 안 된다** ----
   대기실에서 나갈 때 서버에 "나갔다" 고 안 알리면 자리가 남는다. 그 상태로
   빠른참가를 다시 누르면 새 자리를 받아 **같은 사람이 두 자리를 차지했다**(신고받음).
   화면 위 `‹` 와 폰 뒤로가기 **둘 다** 본다 — 예전에는 `‹` 만 새고 있었다.

   서버를 혼자 쓸 때만 본다. 검사를 여럿 동시에 돌리면 다른 검사의 방에
   끼었다 빠졌다 하면서 사람 수가 어긋난다 */
const alone = (await api("/zoo/open")).count <= 1;
if (!alone) console.log("\n  (다른 검사가 같은 서버를 쓰는 중 — 나갔다 들어가기는 건너뜁니다)\n");

const exits = {
  "화면 위 ‹": async () => {
    await page.evaluate(() => { const b = document.querySelector("#room [data-back]"); if (b) b.click(); });
    await nap(300);
    await page.evaluate(() => { const y = document.getElementById("askYes"); if (y) y.click(); });
  },
  "폰 뒤로가기": async () => {
    await page.evaluate(() => window.__back && window.__back());
    await nap(300);
    await page.evaluate(() => { const y = document.getElementById("askYes"); if (y) y.click(); });
  },
};

if (alone) for (const how of Object.keys(exits)){
  /* 1. 방에 들어가 있는 상태로 맞춘다 */
  if ((await now()) !== "room"){
    await toLobby();
    await page.evaluate(() => document.querySelector("#lobby #btQuick").click());
    for (let i = 0; i < 20; i++){ if ((await now()) === "room") break; await nap(250); }
  }
  if ((await now()) !== "room"){ check(how + " · 방에 들어가 있다", false, "화면 " + (await now())); continue; }
  roomNow = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem("zk_seat")).code; } catch(e){ return null; }
  });
  const before = await humansIn(roomNow);

  /* 2. 나간다 */
  await exits[how]();
  await nap(700);
  check(how + " 로 나가면 로비로 간다", (await now()) === "lobby", "화면 " + (await now()));
  const after = await humansIn(roomNow);
  check(how + " 로 나가면 서버에서도 자리가 빠진다", after === before - 1,
        "사람 " + before + "명 → " + after + "명");

  /* 3. 다시 들어간다 — 자리가 하나만 늘어야 한다 (둘이 되면 안 된다) */
  await page.evaluate(() => document.querySelector("#lobby #btQuick").click());
  for (let i = 0; i < 20; i++){ if ((await now()) === "room") break; await nap(250); }
  const backRoom = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem("zk_seat")).code; } catch(e){ return null; }
  });
  if (backRoom === roomNow){
    check(how + " 뒤 다시 들어가도 내 자리는 하나", (await humansIn(roomNow)) === before,
          "사람 " + (await humansIn(roomNow)) + "명 (나가기 전 " + before + "명)");
  } else {
    check(how + " 뒤에도 나온 방에 내 자리가 안 남는다", (await humansIn(roomNow)) === after,
          "다른 방 " + backRoom + " 에 들어감");
  }
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
