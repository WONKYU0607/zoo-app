/* 사람이 누르는 것보다 훨씬 빠르게 돌린다.
   실제 화면은 같은 단추를 0.25초 안에 두 번 누르면 메아리로 보고 무시하므로,
   그 시간만큼은 띄워 준다 */
/* 진짜 화면 코드(table.js)를 가짜 브라우저 안에서 끝까지 돌린다.
   지금까지의 검사는 규칙과 변환만 봤다. 이건 화면이 실제로 그려지고
   버튼이 실제로 동작하는지를 본다.

   쓰는 법:  node test/table.test.mjs [게임수] [인원]  */

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const GAMES = Number(process.argv[2] || 3);
const N     = Number(process.argv[3] || 6);

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + name + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + name + (note ? "  " + note : "")); }
};
const quiet = (name, ok, note) => { if (ok) pass++; else { fail++; console.log("  [실패] " + name + (note ? "  " + note : "")); } };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* 1. 화면 코드를 브라우저용으로 한 덩어리로 묶는다 (css 는 버린다) */
const ENTRY = join(HERE, "_entry.js");
const OUT   = join(HERE, "_bundle.mjs");
execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"),
  ENTRY, "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty", "--outfile=" + OUT, "--log-level=warning",
], { cwd: ROOT, stdio: "inherit" });

/* 2. 가짜 브라우저를 세운다 */
const MARKUP = JSON.parse(
  readFileSync(join(ROOT, "src/screens/_markup.js"), "utf8")
    .replace(/^export const MARKUP = /, "").replace(/;\s*$/, "")
);

const dom = new JSDOM(
  `<!doctype html><html><body><section id="table">${MARKUP.table}</section></body></html>`,
  { pretendToBeVisual: true, url: "http://localhost/" });

const W = dom.window;
global.window = W;
global.document = W.document;
try { Object.defineProperty(global, "navigator", { value: W.navigator, configurable: true }); } catch(e){}
global.HTMLElement = W.HTMLElement;
global.Element = W.Element;
global.Node = W.Node;
global.Event = W.Event;
global.CustomEvent = W.CustomEvent;
global.getComputedStyle = W.getComputedStyle.bind(W);
global.requestAnimationFrame = W.requestAnimationFrame ? W.requestAnimationFrame.bind(W) : (f => setTimeout(f, 0));
W.__lang = "ko";
W.__opts = { cap: N, seated: N, rounds: 3, tax: true, clear2: false };

/* jsdom 은 크기를 0 으로 보고한다. 배치 계산이 죽지 않게 값을 넣어 준다 */
Object.defineProperties(W.HTMLElement.prototype, {
  clientWidth:  { get(){ return 380; } },
  clientHeight: { get(){ return 700; } },
  offsetWidth:  { get(){ return 380; } },
  offsetHeight: { get(){ return 700; } },
});
W.Element.prototype.getBoundingClientRect = function(){
  return { x: 0, y: 0, width: 380, height: 700, top: 0, left: 0, right: 380, bottom: 700, toJSON(){} };
};

const mod = await import("file://" + OUT);
const { mountTable, eng } = mod;

const root = W.document.getElementById("table");
const el = id => root.querySelector('[id="' + id + '"]');

async function playOne(gi){
  eng.stop();
  eng.engine.botMs = 0;                       /* 검사에서는 봇이 바로 둔다 */
  const names = ["나", "가", "나2", "다", "라", "마", "바", "사"].slice(0, N);
  eng.startLocal({ numPlayers: N, myID: "0", names, opts: { rounds: 3, tax: true, clear2: false } });
  eng.autoDraw();   /* 뽑기 단계를 끝내고 판부터 본다 */
  mountTable(root);

  let guard = 0, lastSig = "", stuck = 0;
  while (guard++ < 4000){
    const v = eng.engine.view;
    if (!v) { await wait(5); continue; }
    if (v.over) break;

    const sig = v.phase + "|" + v.turn + "|" + v.seats.map(s => s.c).join(",") + "|" + v.taxGive;
    if (sig === lastSig) stuck++; else { stuck = 0; lastSig = sig; }
    if (stuck > 400){ check("진행", false, "게임 " + gi + " 멈춤 — " + sig); return null; }

    /* 세금 단계: 혁명을 쥐었으면 선언하고, 내가 낼 게 있으면 가장 나쁜 카드를 낸다 */
    if (v.phase === "tax"){
      if (v.canDeclare) eng.declareRev();
      if (v.taxGive > 0){
        const hand = v.hand.slice().sort((a, b) => (b >= 13 ? 99 : b) - (a >= 13 ? 99 : a));
        eng.give(hand.slice(0, v.taxGive));
      }
      await wait(3);
      continue;
    }

    if (!v.myTurn){ await wait(3); continue; }

    /* --- 여기서부터가 진짜 화면 검사: DOM 을 보고 DOM 을 클릭한다 --- */
    const cards = [...el("hand").querySelectorAll(".card")];
    quiet("손패 장수가 화면과 같음", cards.length === v.hand.length,
          "게임 " + gi + " 화면 " + cards.length + " ≠ 상태 " + v.hand.length);
    quiet("자리 수가 화면과 같음",
          el("seats").querySelectorAll(".seat").length === v.N,
          "게임 " + gi);
    /* 선이면 패스 단추가 잠겨 있어야 한다. 규칙상 선은 패스할 수 없다 */
    quiet("선일 때 패스 잠김", v.pile ? true : el("pass").disabled === true,
          "게임 " + gi + " 바닥 없음인데 패스가 열려 있음");
    /* 선이 아니면 패스는 열려 있어야 한다 */
    quiet("팔로우일 때 패스 열림", v.pile ? el("pass").disabled === false : true,
          "게임 " + gi + " 바닥 있는데 패스가 잠김");

    /* 낼 수 있는 조합을 찾아 그 카드들을 실제로 눌러 고른다 */
    const wanted = choose(v);
    if (!wanted){
      await wait(260);
      el("pass").dispatchEvent(new W.MouseEvent("click", { bubbles: true }));
      await wait(3);
      continue;
    }
    const idx = pickIndexes(v.hand, wanted.num, wanted.count);
    idx.forEach(i => cards[i].dispatchEvent(new W.MouseEvent("click", { bubbles: true })));

    const before = v.hand.length;
    const beforeRound = v.roundNo;
    const btn = el("play");
    quiet("고르면 내기 단추가 열림", !btn.disabled, "게임 " + gi + " " + wanted.num + "x" + wanted.count);
    await wait(260);
    btn.dispatchEvent(new W.MouseEvent("click", { bubbles: true }));
    await wait(6);

    const after = eng.engine.view;
    /* 마지막 장을 내면 새 판이 바로 열려 손패가 다시 찬다. 그때는 건너뛴다 */
    if (after.roundNo === beforeRound && !after.over)
      quiet("낸 만큼 손패가 줄어듦",
            after.hand.length === before - wanted.count,
            "게임 " + gi + " " + before + " → " + after.hand.length + " (" + wanted.count + "장 냄)");
  }
  if (guard >= 4000){ check("진행", false, "게임 " + gi + " 4000수 넘김"); return null; }
  return eng.engine.view;
}

/* 낼 수 있는 것 중 하나 고르기 (사람이 하듯) */
function choose(v){
  const hand = v.hand, pile = v.pile;
  const cnt = {}; let jok = 0;
  hand.forEach(c => { if (c >= 13) jok++; else cnt[c] = (cnt[c] || 0) + 1; });
  const opts = [];
  const maxN = pile ? pile.num - 1 : 12;
  for (let num = 1; num <= maxN; num++){
    const same = cnt[num] || 0;
    if (!same) continue;
    if (pile){ if (same + jok >= pile.count) opts.push({ num, count: pile.count }); }
    else opts.push({ num, count: same });
  }
  if (!opts.length){
    /* 선인데 카멜레온만 남았다 — 단독 13 으로 낼 수 있다 */
    if (!pile && jok > 0) return { num: 13, count: 1 };
    return null;
  }
  return opts[opts.length - 1];               /* 가장 약한 것부터 */
}

/* 그 조합을 만들 손패 위치 (모자라면 카멜레온으로 채움) */
function pickIndexes(hand, num, count){
  const out = [];
  hand.forEach((c, i) => { if (c === num && out.length < count) out.push(i); });
  if (out.length < count)
    hand.forEach((c, i) => { if (c >= 13 && out.length < count && !out.includes(i)) out.push(i); });
  return out;
}

console.log("\n=== 화면 통째 시험 (가짜 브라우저) ===  " + GAMES + "게임 / " + N + "명\n");

for (let gi = 1; gi <= GAMES; gi++){
  let over = null;
  try { over = await playOne(gi); }
  catch (e){ check("게임 " + gi, false, String(e && e.message || e)); continue; }
  check("게임 " + gi + " 끝까지 진행", Boolean(over));
  if (!over) continue;
  const sum = over.over.score.reduce((a, b) => a + b, 0);
  const want = [100, 90, 80, 70, 60, 50, 40, 30].slice(0, Math.floor(N / 2))
                 .reduce((a, b) => a + b, 0) * 3;
  check("게임 " + gi + " 점수 합계", sum === want, sum + " (기대 " + want + ")");
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
