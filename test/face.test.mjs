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
     <section id="draw">${MARKUP.draw}</section>
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
const { mountTable, mountDraw, eng } = B;

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

/* ---------- 카드 안 글씨가 띠 밖으로 나가지 않는가 ----------
   숫자 두 개 + 이름이 한 줄에 들어가야 한다. 예전에는 --w 를 52px 로 박아 두고
   실제 카드는 34px 이라 오른쪽 숫자가 잘렸다. 대충 재는 것이라도 없는 것보다 낫다 */
function bandFits(w, numR, nameR, padR, minR, longest){
  const inner = w - 2 * (w * .042) - 2 * (w * padR);
  const numW  = Math.max(w * minR, 2.2 * (w * numR) * .55);   /* "10" 두 자리 기준 */
  const nameW = longest * (w * nameR);
  return { ok: 2 * numW + nameW <= inner, need: (2*numW + nameW).toFixed(1), inner: inner.toFixed(1) };
}
{
  const dcss = readFileSync(join(ROOT, "src/styles/draw.css"), "utf8");
  const dnum = Number((dcss.match(/#draw \.card__num\{[^}]*font-size:calc\(var\(--w\) \* ([\d.]+)\)/) || [])[1]);
  const dname = Number((dcss.match(/#draw \.card__name\{[^}]*font-size:calc\(var\(--w\) \* ([\d.]+)\)/) || [])[1]);
  check("뽑기 카드가 실제 폭(--pw)을 쓴다", /#draw \.card\{--w:var\(--pw/.test(dcss));
  for (const w of [26, 46]){
    const r = bandFits(w, dnum, dname, .016, .17, 4);      /* 카멜레온 4글자 */
    check("뽑기 카드 " + w + "px 에서 띠 안에 다 들어간다", r.ok, r.need + " / " + r.inner);
  }
  const dsrc = readFileSync(join(ROOT, "src/screens/draw.js"), "utf8");
  check("뽑기 카드 폭을 세로도 보고 잡는다", /Math\.min\(46, byW, byH\)/.test(dsrc));

  /* 사람 수가 늘면 열·줄이 늘어난다. 8명(4열 2줄)에서도 판 밖으로 나가면 안 된다.
     draw.js 의 계산을 그대로 옮겨 와서 잰다 */
  function grid(n, ringW, ringH){
    const cols = n <= 4 ? n : Math.min(4, Math.ceil(n / 2));
    const rows = Math.ceil(n / cols);
    const avail = ringW - 48, availH = ringH * 0.88 - 16;
    const byW = Math.floor((avail - (cols - 1) * 9) / cols);
    const byH = Math.floor((availH - (rows - 1) * 9) / rows / (390 / 200));
    const pw = Math.max(26, Math.min(46, byW, byH));
    return { cols, rows, pw,
             w: cols * pw + (cols - 1) * 9,
             h: rows * pw * (390 / 200) + (rows - 1) * 9 };
  }
  /* 작은 폰(360x640)과 큰 폰(412x915) 두 가지로 */
  for (const [ringW, ringH, tag] of [[336, 400, "작은 폰"], [388, 478, "큰 폰"], [336, 220, "짧은 화면"]]){
    for (const n of [2, 3, 4, 5, 6, 7, 8]){
      const g = grid(n, ringW, ringH);
      const fitsW = g.w <= ringW - 16;
      const fitsH = g.h <= ringH * 0.88;           /* 44% 중심 기준 위아래 */
      const readable = g.pw >= 26;
      check(tag + " " + n + "명 뽑기판이 판 안에 들어간다",
            fitsW && fitsH && readable,
            g.cols + "열 " + g.rows + "줄 · " + g.pw + "px · " +
            g.w.toFixed(0) + "x" + g.h.toFixed(0) + " / " + ringW + "x" + ringH);
    }
  }
}
{
  const tcss = readFileSync(join(ROOT, "src/styles/tax.css"), "utf8");
  const tnum = Number((tcss.match(/#tax \.card__num\{[^}]*font-size:calc\(var\(--w\) \* ([\d.]+)\)/) || [])[1]);
  const tname = Number((tcss.match(/#tax \.card__name\{[^}]*font-size:calc\(var\(--w\) \* ([\d.]+)\)/) || [])[1]);
  const tsrc2 = readFileSync(join(ROOT, "src/screens/tax.js"), "utf8");
  check("세금·혁명 화면 카드가 이름을 그린다", /card__name/.test(tsrc2));
  for (const w of [32, 54]){
    const r = bandFits(w, tnum, tname, .016, .17, 4);
    check("세금 카드 " + w + "px 에서 띠 안에 다 들어간다", r.ok, r.need + " / " + r.inner);
  }
}
{
  const tc = readFileSync(join(ROOT, "src/styles/table.css"), "utf8");
  const num = Number((tc.match(/#table \.card__num\{[^}]*font-size:calc\(var\(--w\) \* ([\d.]+)\)/) || [])[1]);
  const nam = Number((tc.match(/#table \.card__name\{[^}]*font-size:calc\(var\(--w\) \* ([\d.]+)\)/) || [])[1]);
  const r = bandFits(60, num, nam, .016, .145, 4);
  check("게임 화면 손패 60px 에서 띠 안에 다 들어간다", r.ok, r.need + " / " + r.inner);
}

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

/* ---------- 판 화면 단추 크기 (예전의 80%) ---------- */
{
  const tc = readFileSync(join(ROOT, "src/styles/table.css"), "utf8");
  const blk = (tc.match(/#table \.acts button\{[^}]*\}/) || [""])[0];
  const num = re => Number((blk.match(re) || [])[1]);
  const was = { border: 13, biw: 13, padY: 6, padX: 10, minH: 52, font: 16 };
  const now = {
    border: num(/border:([\d.]+)px solid transparent/),
    biw:    num(/border-image-width:([\d.]+)px/),
    padY:   num(/padding:([\d.]+)px [\d.]+px/),
    padX:   num(/padding:[\d.]+px ([\d.]+)px/),
    minH:   num(/min-height:([\d.]+)px/),
    font:   num(/font-size:([\d.]+)px/),
  };
  for (const k of Object.keys(was)){
    const want = +(was[k] * 0.8).toFixed(2);
    check("단추 " + k + " 가 예전의 80%", Math.abs(now[k] - want) < 0.01,
          now[k] + " (원래 " + was[k] + " → " + want + ")");
  }
  const bc = readFileSync(join(ROOT, "src/styles/base.css"), "utf8");
  check("판 단추가 공통 !important 규칙에 안 묶여 있다",
        !/#table \.acts button,/.test(bc));
  check("판 단추가 놋쇠 틀을 그대로 쓴다", /border-image:var\(--fr-btn\)/.test(blk));
}

/* ---------- 완주 표시가 등수로, 프로필 오른쪽 위에 ----------
   누군가 다 낼 때까지 자동으로 돌린 뒤 실제로 붙은 글자를 본다 */
eng.stop();
eng.engine.botMs = 0;
eng.startLocal({ numPlayers: 4, myID: "0", names: ["나","가","나2","다"],
                 opts: { rounds: 3, tax: false, clear2: false } });
if (W.__bootTable) W.__bootTable();
eng.setAuto(true);
let outSeen = false;
for (let i = 0; i < 400 && !outSeen; i++){
  await wait(15);
  const vv = eng.engine.view;
  outSeen = Boolean(vv && vv.seats && vv.seats.some(x => x.c === 0 && x.rank >= 0));
}
check("누군가 다 내고 완주했다", outSeen);
{
  const seat = [...root.querySelectorAll(".seat")]
    .filter(d => d.querySelector(".seat__tag"))[0];
  const tagCss = readFileSync(join(ROOT, "src/styles/table.css"), "utf8");
  check("등수표는 프로필 원 안에 붙는다 (자리 상자가 아니라)",
        /\.seat__avwrap\{[^}]*position:relative/.test(tagCss));
  check("등수표가 프로필 위로 올라온다", /\.seat__tag\{[^}]*z-index:3/.test(tagCss));
  check("등수표가 오른쪽 위에 붙는다",
        /\.seat__tag\{[^}]*left:calc\(var\(--av[^)]*\) \* \.70\)/.test(tagCss));
  check("완주 대신 등수를 쓴다", /rankTag\(s\.r\)/.test(tsrc));
  const tagTxt = seat ? seat.querySelector(".seat__tag").textContent : "";
  check("붙은 글자가 등수 꼴이다 (완주 아님)", /^\d+등$/.test(tagTxt) || tagTxt === "패스", tagTxt || "없음");
  check("등수표가 프로필 원 안에 들어 있다",
        Boolean(seat) && Boolean(seat.querySelector(".seat__avwrap .seat__tag")),
        seat ? seat.innerHTML.slice(0, 80) : "없음");
}
/* 카멜레온 손패 이름이 가운데로 오는가 — 빈 숫자칸이 양쪽에 있어야 한다 */
{
  const jh = [...el("hand").querySelectorAll(".card.is-joker")][0];
  if (jh){
    const kids = [...jh.querySelector(".card__band").children].map(x => x.className);
    check("카멜레온 손패 이름 양쪽에 빈 숫자칸이 있다",
          kids.length === 3 && kids[0].includes("card__num") && kids[2].includes("card__num"),
          JSON.stringify(kids));
  } else {
    check("카멜레온 손패 이름 양쪽에 빈 숫자칸이 있다 (손에 없어 소스로 확인)",
          /card__num as"><\/span>/.test(tsrc));
  }
}

/* ---------- 뽑기 화면과 판 화면이 같은 사람을 그리는가 ----------
   예전에는 뽑기 화면이 붙박이 이름 목록(["나","민지","준호","서연",…])을
   자리 번호로 꺼내 썼는데, 실제 자리 순서와 달라서 이름과 얼굴이 어긋났다.
   얼굴도 뽑기 동안에는 0,1,2… 로 두어 판에 들어가면 얼굴이 바뀌었다.
   두 화면이 같은 자리에 같은 이름·같은 얼굴을 그리는지 본다 */
{
  eng.stop();
  eng.engine.botMs = 999999;
  eng.startLocal({ numPlayers: 6, myID: "0",
                   names: ["아데바요르","서연","준호","민지","태윤","하은"],
                   opts: { rounds: 3, tax: false, clear2: false } });
  await wait(20);
  const vv = eng.engine.view;

  /* flow.js 의 openTable 이 세우는 값과 같은 방식으로 만든다 */
  W.__net = { engine: true };
  W.GAME = {
    N: vv.N,
    /* faces 에 일부러 옛날 값(자리 번호 0,1,2…)을 넣어 둔다.
       뽑기 화면이 seatFaces 를 먼저 봐야만 얼굴이 사람을 따라간다 */
    faces: vv.seats.map((x, k) => k),
    seatFaces: vv.seats.map(x => x.seat),
    names: vv.names.slice(),
    namesEn: vv.names.slice(),
    roundNo: 1, score: new Array(vv.N).fill(0), order: null, finish: null, hold: null,
  };
  W.__leadSeat = vv.turn >= 0 ? vv.turn : 0;
  W.__opts = { cap: 6, seated: 6, rounds: 3, tax: false, clear2: false };

  const drawRoot = W.document.getElementById("draw");
  mountDraw(drawRoot);
  await wait(20);

  const HEADS = ["head_01","head_02","head_04","head_10","head_06","head_09","head_07","head_12"];
  const readSeats = r => [...r.querySelectorAll("#seats .seat")].map(d => {
    const n = d.querySelector(".seat__n");
    const a = d.querySelector(".seat__av");
    const bg = a ? (a.getAttribute("style") || "") : "";
    const hit = HEADS.filter(h => bg.includes(h));
    return { name: n ? n.textContent : "", head: hit[0] || "" };
  });

  const dSeats = readSeats(drawRoot);
  check("뽑기 화면에 사람이 다 그려졌다", dSeats.length === vv.N, String(dSeats.length));
  check("뽑기 화면 이름이 진짜 이름이다",
        dSeats.every((d, i) => d.name === vv.names[i]),
        JSON.stringify(dSeats.map(d => d.name)) + " ← " + JSON.stringify(vv.names));

  /* 판 화면을 같은 판으로 세우고 나란히 비교 */
  if (W.__bootTable) W.__bootTable();
  await wait(20);
  const tSeats = readSeats(root);
  check("판 화면에 사람이 다 그려졌다", tSeats.length === vv.N, String(tSeats.length));
  check("같은 자리에 같은 이름이 온다",
        dSeats.every((d, i) => tSeats[i] && d.name === tSeats[i].name),
        JSON.stringify(dSeats.map(d => d.name)) + " / " + JSON.stringify(tSeats.map(d => d.name)));
  check("같은 자리에 같은 얼굴이 온다 (뽑기에서 판으로 넘어가도 안 바뀐다)",
        dSeats.every((d, i) => tSeats[i] && d.head && d.head === tSeats[i].head),
        JSON.stringify(dSeats.map(d => d.head)) + " / " + JSON.stringify(tSeats.map(d => d.head)));
  check("이름과 얼굴이 같은 사람을 가리킨다",
        dSeats.every((d, i) => d.head === HEADS[vv.seats[i].seat % HEADS.length]),
        JSON.stringify(dSeats.map((d, i) => d.name + ":" + d.head)));

  /* 가장 낮은 카드는 실제 선의 자리에 간다 */
  check("뽑기에서 선의 자리가 판의 선과 같다",
        W.__leadSeat === vv.turn, W.__leadSeat + " / " + vv.turn);

  /* flow 쪽도 같이 못박는다 — 예전에는 뽑기 동안 faces 를 0,1,2… 로 두었다 */
  const flow = readFileSync(join(ROOT, "src/lib/flow.js"), "utf8");
  check("flow 가 처음부터 진짜 자리를 싣는다",
        /faces: v\.seats\.map\(s => s\.seat\)/.test(flow));
  check("뽑기 화면이 seatFaces 를 먼저 본다",
        /const f = g\.seatFaces \|\| g\.faces;/.test(
          readFileSync(join(ROOT, "src/screens/draw.js"), "utf8")));
}

eng.stop();
console.log("\n  통과 " + pass + " / 실패 " + fail);
process.exit(fail ? 1 : 0);
