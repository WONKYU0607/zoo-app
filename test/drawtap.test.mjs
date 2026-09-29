/* 뽑기 카드 — **한 번 누르면 바로 뽑히는가.**

   2026-09-28 사용자 신고: 폰에서 뽑기 카드를 터치하면 카드가 살짝 올라오기만 하고
   뒤집히지 않는다. 한 번 더 눌러야 뽑힌다.

   의심한 곳 둘:
     1. 카드마다 `w.onclick` 을 붙이고 있었다. 뽑기 화면은 남은 시간 때문에 자주
        다시 그리는데, 그때 카드 칸이 새로 만들어지면 처리기가 사라진 칸에 남는다.
        게임 화면(table.js)은 같은 "터치 씹힘" 을 겪고 `onTap` 으로 고쳤는데
        뽑기 화면만 그 고침을 안 받았다.
     2. `#draw .pk:hover{transform:translateY(-6px)}` — 폰에는 마우스가 없어서
        첫 터치가 `:hover` 로 처리되어 카드가 올라간 채 남는다. 사용자가 본 그 동작이다.

   여기서 보는 것:
     - 손가락으로 **한 번** 눌러 카드가 뒤집힌다
     - **손을 떼기 전**(pointerdown)에 이미 처리된다 — click 을 기다리지 않는다
     - 누름을 카드가 아니라 **바닥**에서 받는다 (다시 그려도 안 새게)
     - `:hover` 가 마우스 있을 때만 걸린다

   쓰는 법:  node drawtap.test.mjs        (게임 서버 없어도 된다 — 이 기기 방으로 한다) */

import { serve, shut, ensureBuild, findBrowser } from "./shot.mjs";
import pup from "puppeteer-core";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 소스로 확인하는 것 ---------- */
const js = readFileSync(join(ROOT, "src/screens/draw.js"), "utf8");
check("카드마다 onclick 을 붙이지 않는다", !/w\.onclick\s*=/.test(js));
check("누름을 바닥(#deck)에서 받는다", /deck\.addEventListener\(\s*["']pointerdown["']/.test(js));
check("손이 닿는 순간 처리한다 (pointerdown)", /addEventListener\(\s*["']pointerdown["']/.test(js));

const css = readFileSync(join(ROOT, "src/styles/draw.css"), "utf8").replace(/\s+/g, "");
check("들어올리기는 마우스가 있을 때만",
  /@media\(hover:hover\)and\(pointer:fine\)\{#draw\.pk:not\(\.taken\):hover/.test(css),
  /@media/.test(css) ? "" : "hover 규칙이 그냥 열려 있다");

/* ---------- 진짜 브라우저에서 손가락으로 ---------- */
if (!(await findBrowser())){
  console.log("\n크롬이 없어 손가락 검사는 건너뜁니다\n");
  console.log("=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
  process.exit(fail ? 1 : 0);
}
ensureBuild();
const srv = await serve(5851);
const found = await findBrowser();
const browser = await pup.launch({
  args: [...found.args, "--no-sandbox", "--disable-dev-shm-usage"]
    .filter(a => !/^--disable-web-security/.test(a)),
  executablePath: found.path, headless: true });
const page = await browser.newPage();
/* **손가락이 있는 기기로 띄운다.** 이걸 안 하면 폰에서만 나는 것을 못 본다 */
await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2.625,
                         isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => {
  globalThis.__ZOO_TEST = true; globalThis.__ZOO_SERVER = "";
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
});
await page.goto("http://localhost:" + srv.__port + "/", { waitUntil: "networkidle0" });
await page.evaluate(async () => {
  window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false };
  await window.__createRoom(); await window.__startRound();
});
await nap(1500);

const on = () => page.evaluate(() => (document.querySelector(".page.is-on") || {}).id);
check("뽑기 화면에 있다", await on() === "draw", "화면 " + await on());

const flips = () => page.evaluate(() => document.querySelectorAll("#draw .pk.flip").length);
const freeCard = () => page.evaluate(() => {
  const w = document.querySelector("#draw .pk:not(.taken)");
  if (!w) return null;
  const r = w.getBoundingClientRect();
  return { k: w.dataset.k, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
});

/* (1) 손을 떼기 전에 이미 처리되는가 — pointerdown 만 보낸다 */
const before = await flips();
const c1 = await freeCard();
check("뽑을 카드가 있다", Boolean(c1));
if (c1){
  await page.evaluate(k => {
    const w = document.querySelector('#draw .pk[data-k="' + k + '"]');
    w.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 1, clientY: 1 }));
  }, c1.k);
  /* **1.5초 안에, 그리고 내가 누른 바로 그 카드가** 뒤집혀야 한다.
     오래 기다리면 5초짜리 자동 뽑기가 대신 뒤집어 주는데, 그것을 성공으로 읽으면
     처리기가 아예 없어도 검사가 통과한다 — 실제로 한 번 그렇게 통과시켰다 */
  let got = false;
  for (let i = 0; i < 7 && !got; i++){
    await nap(200);
    got = await page.evaluate(k =>
      Boolean(document.querySelector('#draw .pk[data-k="' + k + '"].flip')), c1.k);
  }
  check("**손을 떼기 전에 이미 뽑힌다** (pointerdown 만으로, 1.5초 안에 그 카드가)", got);
}

/* (2) 진짜 손가락 한 번 — 끝까지 */
await nap(600);
const mid = await flips();
const c2 = await freeCard();
if (c2){
  /* 이 판에서는 이미 뽑았으므로, 다음 판을 기다리지 않고 새로 세운다 */
  await page.evaluate(async () => {
    window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false };
    await window.__createRoom(); await window.__startRound();
  });
  await nap(1500);
  const b2 = await flips();
  const c3 = await freeCard();
  void b2;
  if (c3){
    const t0 = Date.now();
    await page.touchscreen.tap(c3.x, c3.y);
    /* 여기도 자동 뽑기(5초)보다 먼저, 누른 그 카드가 뒤집혀야 한다 */
    let got = false;
    for (let i = 0; i < 7 && !got; i++){
      await nap(200);
      got = await page.evaluate(k =>
        Boolean(document.querySelector('#draw .pk[data-k="' + k + '"].flip')), c3.k);
    }
    check("**손가락으로 한 번 눌러 뒤집힌다**", got, got ? (Date.now() - t0) + "ms" : "1.5초 안에 안 뒤집힘");
  } else check("두 번째 판에서 뽑을 카드가 있다", false);
}

/* (3) 다시 그려도 누름이 안 샌다 — 바닥에 붙었으니 카드를 새로 만들어도 살아 있어야 한다 */
const alive = await page.evaluate(() => {
  const deck = document.getElementById("deck");
  if (!deck) return null;
  const had = Boolean(deck.__wired);
  /* 화면이 1초마다 다시 그리는 것과 같은 상황을 만든다 */
  const html = deck.innerHTML;
  deck.innerHTML = html;
  return { had, still: Boolean(deck.__wired) };
});
check("카드를 새로 만들어도 누름 처리기가 살아 있다",
      Boolean(alive && alive.had && alive.still), JSON.stringify(alive));

shut(srv, browser);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
