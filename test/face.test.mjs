/* 화면에 보이는 카드가 실제로 낸 카드와 같은가.

   지금까지의 검사는 "규칙이 맞게 도는가"만 봤다. 그래서
   카멜레온을 섞어 낸 것이 바닥에 숫자 카드 그림으로만 보이는 것을 아무도 못 잡았다.
   여기서는 그림 파일 이름과 글자를 직접 본다. */

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + name + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + name + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"),
  join(HERE, "_entry_face.js"), "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty", "--outfile=" + join(HERE, "_bundle_face.mjs"), "--log-level=warning",
  "--define:import.meta.env=globalThis.__ENV__",
], { cwd: ROOT, stdio: "inherit" });

const MARKUP = JSON.parse(
  readFileSync(join(ROOT, "src/screens/_markup.js"), "utf8")
    .replace(/^export const MARKUP = /, "").replace(/;\s*$/, "")
);

const dom = new JSDOM(
  `<!doctype html><html lang="ko"><body>
     <section id="table">${MARKUP.table}</section>
   </body></html>`,
  { pretendToBeVisual: true, url: "http://localhost/" });

const W = dom.window;
global.window = W; global.document = W.document;
try { Object.defineProperty(global, "navigator", { value: W.navigator, configurable: true }); } catch(e){}
global.HTMLElement = W.HTMLElement; global.Element = W.Element;
global.Node = W.Node; global.Event = W.Event; global.CustomEvent = W.CustomEvent;
global.getComputedStyle = W.getComputedStyle.bind(W);
global.requestAnimationFrame = W.requestAnimationFrame ? W.requestAnimationFrame.bind(W) : (f => setTimeout(f, 0));
globalThis.__ENV__ = {};
W.__lang = "ko";
W.__opts = { cap: 4, seated: 4, rounds: 3, tax: false, clear2: false };

Object.defineProperties(W.HTMLElement.prototype, {
  clientWidth:  { get(){ return 380; } },
  clientHeight: { get(){ return 700; } },
  offsetWidth:  { get(){ return 380; } },
  offsetHeight: { get(){ return 700; } },
});
W.Element.prototype.getBoundingClientRect = function(){
  return { x:0, y:0, width:380, height:700, top:0, left:0, right:380, bottom:700, toJSON(){} };
};

const B = await import("./_bundle_face.mjs");
const { mountTable, eng } = B;

const root = W.document.getElementById("table");
const el = id => root.querySelector('[id="' + id + '"]');
const KO_N = ["사자","호랑이","불곰","코끼리","악어","여우","기린","멧돼지","원숭이","토끼","새","생쥐"];

mountTable(root);

/* 손에 카멜레온이 있고, 어떤 숫자를 한 장 더 얹어 낼 수 있으면
   모자란 한 장을 카멜레온이 채운다 */
function findMix(hand){
  if (!hand.some(c => c >= 13)) return null;
  for (let num = 12; num >= 1; num--){
    const plain = hand.filter(c => c === num).length;
    if (plain >= 1) return { num, count: plain + 1 };
  }
  return null;
}

/* 그런 판이 나올 때까지 새 판을 연다. 내가 선이어야 아무 조합이나 낼 수 있다 */
let want = null, tries = 0;
while (!want && tries++ < 300){
  eng.stop();
  eng.engine.botMs = 0;
  eng.startLocal({ numPlayers: 4, myID: "0", names: ["나","가","나2","다"],
                   opts: { rounds: 3, tax: false, clear2: false } });
  if (W.__bootTable) W.__bootTable();
  await wait(3);
  const v = eng.engine.view;
  if (!v || !v.myTurn || v.pile) continue;
  want = findMix(v.hand);
}
check("카멜레온을 섞어 낼 판을 찾았다", Boolean(want), "시도 " + tries);
if (!want){ console.log("\n  통과 " + pass + " / 실패 " + fail); process.exit(1); }

/* 봇이 뒤이어 두면 바닥에 남의 카드까지 섞여 무엇을 세는지 흐려진다.
   내가 낸 것만 남기려고 여기서부터 봇을 멈춘다 */
eng.engine.botMs = 999999;
const before = eng.engine.view.hand.slice();
eng.play(want.num, want.count);
await wait(40);

/* ---------- 엔진이 실제로 낸 카드를 남기는가 ---------- */
const st = eng.engine.client.store.getState();
const played = st.G.table[0] || {};
check("엔진이 실제로 낸 카드를 남긴다", Array.isArray(played.cards), JSON.stringify(played));
check("낸 카드 안에 카멜레온이 있다",
      (played.cards || []).some(c => c >= 13), JSON.stringify(played.cards));
check("낸 카드 장수가 맞는다",
      (played.cards || []).length === want.count, JSON.stringify(played.cards));
check("낸 카드는 정말 내 손에 있던 것이다",
      (played.cards || []).every(c => before.includes(c)), JSON.stringify(played.cards));

const v = eng.engine.view;
check("화면 몫으로도 그대로 넘어간다",
      JSON.stringify((v.table[0] && v.table[0].cards) || []) === JSON.stringify(played.cards),
      JSON.stringify(v.table[0] && v.table[0].cards));

/* ---------- 바닥 DOM ---------- */
const cards = [...el("pile").querySelectorAll(".card")];
const imgs = cards.map(c => { const i = c.querySelector("img"); return i ? i.getAttribute("src") : ""; });
check("바닥에 낸 만큼 그려졌다", cards.length === want.count, cards.length + " / " + want.count);
check("카멜레온이 카멜레온 그림으로 보인다 (숫자 카드로 거짓말하지 않는다)",
      imgs.some(s => /joker/.test(s)), JSON.stringify(imgs));
check("나머지는 그 숫자 그림으로 보인다",
      imgs.filter(s => !/joker/.test(s))
          .every(s => s.includes("card_" + String(want.num).padStart(2, "0"))),
      JSON.stringify(imgs));

const jokerCard = cards.filter(c => c.classList.contains("is-joker"))[0];
check("카멜레온 카드에 변신한 숫자가 적힌다",
      Boolean(jokerCard) && jokerCard.textContent.includes(String(want.num)),
      jokerCard ? jokerCard.textContent.trim() : "없음");
check("카멜레온 카드에 이름이 적힌다",
      Boolean(jokerCard) && jokerCard.textContent.includes("카멜레온"),
      jokerCard ? jokerCard.textContent.trim() : "없음");

/* ---------- 손패 카드에 이름이 나오는가 ---------- */
const hand = eng.engine.view.hand;
const names = [...el("hand").querySelectorAll(".card")].map(c => {
  const s = c.querySelector(".card__name");
  return s ? s.textContent : "";
});
check("손패 장수만큼 이름칸이 있다", names.length === hand.length, names.length + " / " + hand.length);
check("손패 이름이 그 카드의 숫자와 맞는다",
      hand.every((c, i) => names[i] === (c >= 13 ? "카멜레온" : KO_N[c - 1])),
      JSON.stringify(names.slice(0, 6)) + " ← " + JSON.stringify(hand.slice(0, 6)));

const css = readFileSync(join(ROOT, "src/styles/table.css"), "utf8");
check("손패 이름을 숨기는 규칙이 없다",
      !/\.hand\s+\.card__name\s*\{[^}]*display\s*:\s*none/.test(css));

/* ---------- 뽑기 화면 카드에도 이름이 있는가 ---------- */
const drawSrc = readFileSync(join(ROOT, "src/screens/draw.js"), "utf8");
check("뽑기 카드가 이름을 그린다", /card__name/.test(drawSrc));
const drawCss = readFileSync(join(ROOT, "src/styles/draw.css"), "utf8");
check("뽑기 카드 이름에 글자 크기가 있다", /#draw \.card__name\s*\{/.test(drawCss));

/* ---------- 이번에 없앤 것들 ---------- */
check("게임 화면에 판 종료 단추가 없다", !root.querySelector("#endRound"));
check("게임 화면에 언어 토글 자리가 없다", !root.querySelector("#lang"));
const bar = readFileSync(join(ROOT, "src/lib/bar.js"), "utf8");
check("상단바 붙이기에도 판 종료가 없다", !/endRound/.test(bar));
const nav = readFileSync(join(ROOT, "src/nav.js"), "utf8");
check("계정 창에 랭킹 안내 문구가 없다", !/랭킹에 오릅니다/.test(nav));
check("판 종료 클릭 묶기가 남아 있지 않다", !/endRound/.test(nav));
const base = readFileSync(join(ROOT, "src/styles/base.css"), "utf8");
check("랭킹 탭이 어두운 버튼 틀에 덮이지 않는다", !/#rank #rkTabs button/.test(base));
const tsrc = readFileSync(join(ROOT, "src/screens/table.js"), "utf8");
check("12시 자리를 더 올리는 값이 있다", /s < -0\.85/.test(tsrc));

eng.stop();
console.log("\n  통과 " + pass + " / 실패 " + fail);
process.exit(fail ? 1 : 0);
