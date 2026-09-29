/* 대기실에서 보던 사람이 **뽑기 화면에도 그대로 있는가.**

   2026-09-28 사용자 신고: "카드 뽑으러 들어갈 때 프로필이 바뀐다."
   처음엔 깜빡임으로 보고 화면 쪽(자리를 매번 새로 만드는 것)만 고쳤는데,
   **진짜 원인은 사람이 통째로 바뀌는 것**이었다.
     대기실: 나, ㅇㅈ, 운빨11, 솜사탕, ㅈㅈ, 참기름, 두루미99
     뽑기:   나, Park7, 노을00, 안개, 곱창, 노잼9, 닭강정

   8인 방에 7명일 때 시작하면 boardgame.io 판은 인원을 못 바꾸므로 서버가 7인 판을
   새로 만드는데, 그때 봇을 새로 앉히면서 이름 번호를 **주머니에서 새로 뽑았다.**
   (서버 쪽 확인은 zoo-server/startkeeptest.js)

   여기서는 **사람이 보는 것**으로 확인한다 — 대기실과 뽑기의 이름·얼굴·순서가 같은가.

   쓰는 법:  창1) cd zoo-server && node server.js
             창2) node test/keepface.test.mjs
   (서버가 없으면 이 길 자체가 안 생기므로 건너뛴다)  */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
if (!(await findBrowser())){
  console.log("\n크롬이 없어 건너뜁니다\n=== 통과 0 / 실패 0 ===\n"); process.exit(0);
}
const nap = ms => new Promise(r => setTimeout(r, ms));
const SRV = process.env.ZOO_SERVER || "http://127.0.0.1:8000";
let use = SRV; try { await fetch(SRV + "/zoo/health"); } catch(e){ use = ""; }
if (!use){
  console.log("\n게임 서버가 안 떠 있어 건너뜁니다 (" + SRV + ")\n=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
ensureBuild();
const srv = await serve(5891);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument((s) => {
  try { localStorage.setItem("zk_lang","ko"); } catch(e){}
  globalThis.__ZOO_TEST = true; globalThis.__ZOO_SERVER = s;
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
}, use);
await page.reload({ waitUntil: "networkidle0" });
const now = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);

await page.evaluate(() => { window.__opts = { cap: 8, seated: 1, rounds: 3, tax: false, clear2: false }; });
await page.evaluate(async () => { await window.__createRoom(); });
await page.evaluate(() => window.__goto("room"));
for (let i = 0; i < 50; i++){
  if (await page.evaluate(() => (window.__opts && window.__opts.seated) || 0) >= 8) break;
  await nap(400);
}
const seated = await page.evaluate(() => window.__opts.seated);
check("대기실에 사람이 찼다 (자리는 다 안 참 — 판을 새로 만드는 길)", seated >= 4 && seated < 8,
      seated + " / 8");

const snap = sel => page.evaluate(s => [...document.querySelectorAll(s + " .seat")].map(d => {
  const av = d.querySelector(".seat__av"), n = d.querySelector(".seat__n");
  const bg = av ? (av.style.backgroundImage || getComputedStyle(av).backgroundImage) : "";
  const m = bg.match(/av[^"')]*\.(webp|png|jpg)/g) || bg.match(/\/([^\/"')]+\.(webp|png|jpg))/g) || [];
  return { n: (n && n.textContent) || "", av: m.join("|") };
}), sel);

const room = await snap("#room #seats");
console.log("  [대기실] " + room.filter(r => r.n).map(r => r.n).join(", "));

await page.evaluate(async () => { await window.__startRound(); });
/* 뽑기 화면이 켜진 직후부터 3초 동안 100ms 마다 찍는다 */
const trail = [];
for (let i = 0; i < 32; i++){
  await nap(100);
  if (await now() !== "draw") continue;
  trail.push({ t: i * 100, seats: await snap("#draw #seats") });
}

check("뽑기 화면을 잡았다", trail.length > 0, "찍은 횟수 " + trail.length + " · 화면 " + (await now()));
if (!trail.length){ shut(srv, browser); process.exit(1); }
const first = trail[0];
console.log("  [뽑기]   " + first.seats.map(r => r.n).join(", "));
let changes = 0;
for (let k = 1; k < trail.length; k++){
  const a = trail[k-1].seats, b = trail[k].seats;
  if (a.length !== b.length){ console.log("  " + trail[k].t + "ms  자리 수 " + a.length + " → " + b.length); changes++; continue; }
  for (let i = 0; i < a.length; i++){
    if (a[i].av !== b[i].av || a[i].n !== b[i].n){
      console.log("  " + trail[k].t + "ms  " + i + "번 자리: " + a[i].n + "/" + a[i].av + "  →  " + b[i].n + "/" + b[i].av);
      changes++;
    }
  }
}
check("**뽑기 화면 안에서 사람이 안 바뀐다**", changes === 0, changes + "번 바뀜");

/* 대기실 ↔ 뽑기 — 같은 사람들이 같은 얼굴로, 같은 순서로 있어야 한다 */
const roomOn = room.filter(r => r.n && !/초대/.test(r.n));
const drawOn = first.seats.filter(r => r.n);
check("사람 수가 같다", roomOn.length === drawOn.length,
      "대기실 " + roomOn.length + "명 → 뽑기 " + drawOn.length + "명");
const sameOrder = roomOn.length === drawOn.length &&
  roomOn.every((r, i) => r.n === drawOn[i].n && r.av === drawOn[i].av);
check("**대기실에서 보던 사람이 그대로 있다 (이름·얼굴·순서)**", sameOrder,
      sameOrder ? roomOn.length + "명 그대로"
        : roomOn.map(r => r.n).join(",") + "  →  " + drawOn.map(r => r.n).join(","));

shut(srv, browser);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
