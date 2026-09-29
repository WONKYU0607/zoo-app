/* 한 차례에 **두 번 낼 수 있는가** (서버 대전).

   2026-09-28 사용자 신고:
     "내 손패에 6,6,7,7 이 있을 때 77 을 내고 바로 66 도 내졌다.
      77 을 냈으면 그 뒤로는 못 내게 막혀야 하는데 66 도 나갔다.
      둘 다 손에서 떠나 바닥에 내려갔고, 다음 턴이 오니 66 이 손에 도로 들어왔다."

   원인: boardgame.io 는 서버 대전에서 **내가 둔 수만 내 화면에 먼저 반영하고,
   차례를 넘기는 일은 서버가 한다.** 라이브러리 소스에 그렇게 적혀 있다 —
     "If we're on the client, just process the move and no triggers in multiplayer
      mode. These will be processed on the server, which will send back a state update."
   그래서 내가 두고 나서 서버가 답할 때까지 `ctx.currentPlayer` 는 **아직 나**다.
   그동안 화면이 "내 차례" 로 읽어서 단추가 열려 있었다.

   여기서 보는 것:
     1. **판 규칙이 남에게 차례를 넘겼는데 단추가 열려 있으면 안 된다.**
        누구 차례인지는 판 상태의 `G.next` 가 들고 있고, 이것은 내 수를
        내 화면에서 처리할 때 같이 계산되므로 곧바로 맞는 값이다.
        (1번으로 바닥을 엎어 내가 다시 선이 되면 `G.next` 도 나를 가리키므로
         바로 또 내는 것이 맞다 — 그건 고장이 아니다. 그래서 장수만 세면 안 된다)
     2. **사람이 보는 증상** — 한 판이 도는 동안 내 손패 장수가 늘어나면 안 된다.
        늘어났다면 나갔던 카드가 되돌아온 것이고, 서버가 거부했다는 뜻이다.

   느린 인터넷을 흉내 낸다(300ms). 내 화면이 먼저 반영하고 서버가 뒤늦게
   확인해 주는 그 틈이 문제의 자리라서, 빠른 연결에서는 잘 안 나타난다.

   쓰는 법:  창1) cd zoo-server && node server.js
             창2) node test/doubleplay.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

const SRV = process.env.ZOO_SERVER || "http://127.0.0.1:8000";
try { await fetch(SRV + "/zoo/health"); }
catch (e){ console.log("\n게임 서버가 안 떠 있어 건너뜁니다 (" + SRV + ")\n");
           console.log("=== 통과 0 / 실패 0 ===\n"); process.exit(0); }
if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n");
           console.log("=== 통과 0 / 실패 0 ===\n"); process.exit(0); }

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5861);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((s) => {
  globalThis.__ZOO_SERVER = s;
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
}, SRV);
const cdp = await page.createCDPSession();
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false, latency: 300, downloadThroughput: 1.5e6, uploadThroughput: 750e3 });
await page.reload({ waitUntil: "networkidle0" });

const now = () => page.evaluate(() => (document.querySelector(".page.is-on") || {}).id);
await page.evaluate(() => { window.__opts = { cap: 4, seated: 1, rounds: 3, tax: false, clear2: false }; });
await page.evaluate(async () => { await window.__createRoom(); });
await page.evaluate(() => window.__goto("room"));
for (let i = 0; i < 90; i++){
  if (await page.evaluate(() => (window.__opts && window.__opts.seated) || 0) >= 4) break;
  await nap(300);
}
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
check("판 화면까지 갔다", (await now()) === "table", "화면 " + (await now()));
if ((await now()) !== "table"){ shut(srv, browser); process.exit(1); }
await nap(1200);

/* ---------- 손패 장수를 계속 적어 둔다 ----------
   한 판 안에서 **늘어나는 순간**이 곧 "나갔던 카드가 되돌아온" 순간이다.
   판이 바뀌면(새로 나눠 준다) 다시 센다 */
await page.evaluate(() => {
  window.__grew = [];
  if (window.__hsTimer) clearInterval(window.__hsTimer);
  let last = -1, lastR = -1;
  window.__hsTimer = setInterval(() => {
    if ((document.querySelector(".page.is-on") || {}).id !== "table") return;
    const n = document.querySelectorAll("#table #hand .slot").length;
    const r = window.__roundNo || 0;
    if (r !== lastR){ lastR = r; last = n; return; }
    if (last > 0 && n > last) window.__grew.push({ from: last, to: n, r });
    last = n;
  }, 25);
});

/* 손패에서 낼 수 있는 한 벌을 고른다. 골라졌으면 true.
   진짜 누름과 같은 길로 간다 — `#table` 이 click 을 받아 좌표/대상으로 찾는다.
   **잠겨 있으면 아무것도 안 골린다** — 그게 여기서 보려는 것이다 */
const SELECT = `(() => {
  const slots = () => [...document.querySelectorAll("#table #hand .slot")];
  const play = document.querySelector("#table #play");
  if (!play) return false;
  slots().filter(s => s.className.includes("slot--sel")).forEach(s => s.click());
  const by = new Map();
  slots().forEach(s => {
    if (s.className.includes("slot--dead")) return;
    const k = s.__card;
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(s);
  });
  for (const g of [...by.entries()].sort((a, b) => b[1].length - a[1].length)){
    for (const s of g[1]){
      s.click();
      if (!play.disabled) return true;
    }
    slots().filter(s => s.className.includes("slot--sel")).forEach(s => s.click());
  }
  return !play.disabled;
})()`;
const trySelect = () => page.evaluate(SELECT);
const unselect = () => page.evaluate(() => {
  [...document.querySelectorAll("#table #hand .slot--sel")].forEach(s => s.click());
});
const tapPlay = () => page.evaluate(() => {
  const b = document.querySelector("#table #play");
  if (!b || b.disabled) return false;
  b.click();
  return true;
});
/* **낼 수 있는 조합이 손에 없어도 잠겼는지 알 수 있어야 한다.**
   처음에는 "한 벌 골라서 내기 단추가 열리나" 만 봤는데, 바닥보다 낮은 조합이
   손에 없는 차례에는 열려 있어도 못 골라서 **고장을 놓쳤다**(14번 중 1번만 잡힘).
   패스 단추는 조합과 상관없이 `차례 + 처리중` 만 보므로, 바닥에 카드가 있으면
   이것만으로 잠금 상태를 그대로 읽을 수 있다 */
const passOpen = () => page.evaluate(() => {
  const b = document.querySelector("#table #pass");
  return Boolean(b && !b.disabled);
});
/* 판 규칙이 말하는 "다음에 둘 사람" 이 나인가 */
const dueMine = () => page.evaluate(() => {
  try {
    const E = window.__eng, st = E.client.getState();
    const n = st.G.counts.length;
    const due = Number.isInteger(st.G.next) && st.G.next >= 0 && st.G.next < n
      ? st.G.next : Number(st.ctx.currentPlayer);
    return due === Number(E.myID);
  } catch(e){ return true; }
});
const mine = () => page.evaluate(() => {
  const v = window.__eng && window.__eng.view;
  return Boolean(v && v.myTurn);
});

/* ---------- 한 차례에 두 번 내 본다 ---------- */
let turns = 0, bad = 0, okAgain = 0;
const notes = [];
const T0 = Date.now();
while (turns < 14 && Date.now() - T0 < 160000){
  if (await now() !== "table"){ await nap(400); continue; }
  if (await page.evaluate(() => Boolean(window.__gameOver))) break;
  if (!(await mine())){ await nap(100); continue; }

  if (!(await trySelect())){
    await page.evaluate(() => {
      const p = document.querySelector("#table #pass");
      if (p && !p.disabled) p.click();
    });
    await nap(450);
    continue;
  }
  if (!(await tapPlay())){ await nap(200); continue; }
  turns++;

  /* **낸 바로 그 순간부터** 0.8초 동안,
     차례가 남에게 넘어갔는데도 또 낼 수 있는지 본다.

     첫 번째는 **기다리지 않고** 본다. 이것이 핵심이다 —
     검사 기계는 서버가 같은 컴퓨터에 있어서 확인이 몇 ms 만에 돌아온다.
     (CDP 로 건 지연은 http 에만 걸리고 소켓에는 안 걸린다.)
     그래서 40ms 만 기다려도 이미 서버 상태로 덮여 고장이 안 보인다 —
     실제로 그렇게 재서 14번 중 1번만 잡혔다. 폰에서는 이 틈이 몇백 ms 다 */
  for (let i = 0; i < 20; i++){
    if (i) await nap(40);
    if (await now() !== "table") break;
    const open2 = (await passOpen()) || (await trySelect());
    if (!open2) continue;
    if (await dueMine()){
      /* 규칙상 내가 다시 선이다 (1번으로 엎었거나 나만 남았다) — 열려 있는 게 맞다 */
      okAgain++;
      await unselect();
      break;
    }
    /* 여기가 고장이다. 진짜로 내 본다 — 서버가 거부하고 카드가 되돌아온다 */
    await tapPlay();
    bad++;
    notes.push("남의 차례인데 " + (i * 40) + "ms 뒤 단추가 열려 있었다");
    break;
  }
  await nap(600);
}

await nap(2500);   /* 되돌아오는 것까지 본다 */
const grew = await page.evaluate(() => window.__grew || []);

console.log("\n  내 차례 " + turns + "번 · 규칙상 다시 선이라 또 낸 것 " + okAgain + "번");
notes.slice(0, 6).forEach(n => console.log("    " + n));
if (grew.length) console.log("    손패가 늘어난 순간: " +
  grew.slice(0, 6).map(g => g.from + "→" + g.to + "(" + g.r + "판)").join(", "));

check("**차례가 넘어갔으면 더 못 낸다**", bad === 0,
      bad ? bad + "/" + turns + "번 차례에서 또 낼 수 있었다" : turns + "번 차례를 다 막았다");
check("**나갔던 카드가 손으로 되돌아오지 않는다**", grew.length === 0,
      grew.length ? grew.length + "번 늘어났다" : "한 판 안에서 손패는 줄기만 했다");
check("내 차례를 실제로 여러 번 겪었다", turns >= 5, turns + "번");

shut(srv, browser);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
