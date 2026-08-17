/* 게임 한 판을 처음부터 끝까지, 진짜 화면들을 거쳐 돌린다.

     방 대기실 → 뽑기 → 판 → (판 끝) 결과 → 혁명·세금 → 다음 판 → … → 최종 결과

   화면을 실제로 세우고 버튼을 실제로 누른다. 어느 한 곳이라도 연결이 끊기면
   여기서 멈춘다. 사람이 하나하나 짚지 않아도 되도록 하는 것이 목적이다.

   쓰는 법:  node test/sequence.test.mjs [게임수]  */

import { JSDOM } from "jsdom";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const GAMES = Number(process.argv[2] || 2);

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"),
  join(HERE, "_entry_seq.js"), "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty", "--outfile=" + join(HERE, "_bundle_seq.mjs"), "--log-level=warning",
], { cwd: ROOT, stdio: "inherit" });

const SCREENS = ["entry", "lobby", "room", "draw", "table", "tax", "result"];

async function run(gi){
  const html = "<!doctype html><html><body><div id='stage'>" +
    SCREENS.map(id => "<section class='page' id='" + id + "'></section>").join("") +
    "</div></body></html>";
  const dom = new JSDOM(html, { pretendToBeVisual: true, url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  window.__lang = "ko";
  window.__opts = undefined;        /* 기본값을 그대로 쓴다 */
  window.alert = () => {};

  const B = await import("./_bundle_seq.mjs?v=" + gi + "_" + Date.now());

  /* 화면 세우기 — main.js 의 build() 와 같은 순서 */
  SCREENS.forEach(id => {
    const sec = document.getElementById(id);
    let h = B.MARKUP[id];
    const sw = B.BAR_SWAP[id];
    if (sw) h = h.replace(sw[0], sw[1]);
    sec.innerHTML = h;
  });
  document.getElementById("stage").insertAdjacentHTML("beforeend", B.OPT_HTML + B.CFG_HTML);
  SCREENS.forEach(id => {
    const m = B[id];
    if (m && m.mount) m.mount(document.getElementById(id));
  });
  B.initNav();

  const visited = new Set();
  const realGoto = window.__goto;
  window.__goto = id => { visited.add(id); return realGoto(id); };
  B.flow.install({ goto: window.__goto, myName: () => "나", botJoinMs: 5 });
  B.eng.engine.botMs = 3;

  const now = () => {
    const on = SCREENS.find(id => document.getElementById(id).classList.contains("is-on"));
    if (on) visited.add(on);          /* nav 안에서 바로 넘어가는 경우도 잡는다 */
    return on || "?";
  };
  const q = (screen, sel) => document.querySelector("#" + screen + " " + sel);

  /* 1. 기본값 */
  check("기본 인원이 4명", window.__opts.cap === 4, String(window.__opts.cap));
  check("기본 판수가 3판", window.__opts.rounds === 3, String(window.__opts.rounds));

  /* 2. 방 만들기 */
  await window.__createRoom();
  window.__goto("room");
  const code = window.__roomCode();
  check("방 번호가 4자리 숫자", /^[0-9]{4}$/.test(String(code)), String(code));
  check("방 번호가 화면에 뜬다",
        (q("room", "#roomNo") ? q("room", "#roomNo").textContent : "").trim() === String(code),
        q("room", "#roomNo") ? q("room", "#roomNo").textContent.trim() : "없음");
  const want = window.__opts.cap;
  for (let i = 0; i < 400 && (window.__opts.seated || 1) < want; i++) await wait(10);
  check("방이 정원까지 찼다", window.__opts.seated === want, window.__opts.seated + "/" + want + "명");
  check("방 대기실이 켜져 있다", now() === "room", now());

  /* 2. 시작 */
  await window.__startRound();
  check("뽑기 화면으로 갔다", now() === "draw", now());
  check("선을 엔진이 정했다", typeof window.__leadSeat === "number", String(window.__leadSeat));

  /* 3. 뽑기 화면에 머무는 동안 봇이 미리 두면 안 된다 */
  await wait(300);
  const beforeTable = B.eng.engine.view;
  check("판에 들어서기 전에는 아무도 안 뒀다",
        beforeTable.seats.every(s => s.c === beforeTable.seats[0].c),
        beforeTable.seats.map(s => s.c).join(","));

  /* 4. 판으로 */
  window.__goto("table");
  await wait(60);
  check("판 화면에 내 손패가 있다",
        q("table", "#hand").querySelectorAll(".card").length > 0,
        q("table", "#hand").querySelectorAll(".card").length + "장");
  const lead = B.eng.engine.view.turn;
  check("선이 아니면 아직 내 차례가 아니다",
        lead === 0 ? true : B.eng.engine.view.myTurn === false,
        "선 " + lead);

  /* 4. 끝까지. 화면이 바뀌면 그 화면에 맞게 누른다 */
  let guard = 0, sawResultMid = 0, sawTax = 0, sawRevStep = 0, sawTaxStep = 0;
  let lastSig = "", stuck = 0;
  while (guard++ < 20000){
    const screen = now();
    const v = B.eng.engine.view;
    const sig = screen + "|" + (v ? v.phase + v.turn + v.seats.map(s => s.c).join(",") : "") +
                "|" + (q("tax", "#next") ? q("tax", "#next").textContent : "");
    if (sig === lastSig) stuck++; else { stuck = 0; lastSig = sig; }
    if (stuck > 1500){ check("진행", false, "게임 " + gi + " 멈춤 — " + screen); break; }

    if (screen === "result"){
      const kicker = q("result", "#kicker").textContent;
      const rows = q("result", "#list").querySelectorAll(".row").length;
      if (window.__gameOver && (window.GAME.roundNo || 0) >= (window.__opts.rounds || 3)){
        check("최종 결과가 떴다", rows === want, rows + "줄 / " + kicker);
        break;
      }
      sawResultMid++;
      if (sawResultMid === 1) check("판 결과가 떴다", rows === want, rows + "줄 / " + kicker);
      q("result", "#next").click();
      await wait(20);
      continue;
    }

    if (screen === "tax"){
      sawTax++;
      const mid = q("tax", "#mid").textContent;
      if (mid.includes("혁명")) sawRevStep++;
      if (mid.includes("세금")) sawTaxStep++;
      const b = q("tax", "#next");
      if (b && !b.disabled) b.click();
      /* 카드를 골라야 하는 단계면 골라 준다 */
      const need = window.__myNeedGive || 0;
      if (need > 0 && !window.__taxGive){
        const slots = q("tax", "#hand") ? q("tax", "#hand").querySelectorAll(".slot") : [];
        for (let k = 0; k < need && k < slots.length; k++) slots[slots.length - 1 - k].click();
        const b2 = q("tax", "#next");
        if (b2 && !b2.disabled) b2.click();
      }
      await wait(20);
      continue;
    }

    if (screen === "table"){
      if (v && v.myTurn){
        const mv = choose(v.hand, v.pile);
        if (mv){
          clickHand(q("table", "#hand"), v.hand, mv);
          q("table", "#play").click();
        } else q("table", "#pass").click();
      }
      await wait(6);
      continue;
    }
    await wait(10);
  }

  check("판 결과 화면을 판마다 지나갔다", sawResultMid >= 2, sawResultMid + "회");
  check("혁명·세금 화면을 거쳤다", visited.has("tax"), [...visited].join(" → "));
  console.log("         (등수·혁명·세금 화면 " + sawTax + "틱, 혁명 단계 " + sawRevStep +
              "틱, 세금 단계 " + sawTaxStep + "틱)");
  check("거쳐 간 화면", ["room", "draw", "table", "tax", "result"].every(s => visited.has(s)),
        [...visited].join(" → "));
  return { sawRevStep, sawTaxStep };

  B.flow.teardown();
  dom.window.close();
}

function choose(hand, pile){
  const cnt = {}; let jok = 0;
  hand.forEach(c => { if (c >= 13) jok++; else cnt[c] = (cnt[c] || 0) + 1; });
  const opts = []; const maxN = pile ? pile.num - 1 : 12;
  for (let num = 1; num <= maxN; num++){
    const same = cnt[num] || 0; if (!same) continue;
    if (pile){ const need = pile.count - same; if (need > jok) continue;
      opts.push({ num, count: pile.count, useJok: Math.max(0, need), own: same }); }
    else opts.push({ num, count: same, useJok: 0, own: same });
  }
  if (!opts.length) return (!pile && jok > 0) ? { num: 13, count: 1, useJok: 1 } : null;
  opts.forEach(o => { let s = o.num * 2; s -= o.useJok * 10; if (pile && o.own > o.count) s -= 24; o.s = s; });
  opts.sort((a, b) => b.s - a.s);
  return opts[0];
}

function clickHand(h, hand, mv){
  const nodes = h.querySelectorAll(".slot");
  const want = [];
  let need = mv.count, useJok = mv.useJok || 0;
  hand.forEach((c, i) => { if (need - useJok > 0 && c === mv.num){ want.push(i); need--; } });
  hand.forEach((c, i) => { if (useJok > 0 && c >= 13 && !want.includes(i)){ want.push(i); useJok--; need--; } });
  want.forEach(i => { if (nodes[i]) nodes[i].click(); });
}

/* 한 게임마다 새 프로세스로 돌린다.
   같은 프로세스에서 이어 돌리면 앞 게임의 예약된 동작이 다음 게임 창으로 새어 들어온다.
   (실제로 그 때문에 헛 실패가 났다) */
if (process.env.SEQ_ONE){
  console.log("--- 게임 " + process.env.SEQ_ONE + " ---");
  try { await run(Number(process.env.SEQ_ONE)); }
  catch (e){ check("게임", false, String(e && e.stack || e).split("\n").slice(0, 3).join(" | ")); }
  console.log("### " + pass + " " + fail);
  process.exit(fail ? 1 : 0);
}

console.log("\n=== 한 시퀀스 통째 검사 ===  " + GAMES + "게임\n");
let P = 0, F = 0;
for (let gi = 1; gi <= GAMES; gi++){
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
    cwd: ROOT, encoding: "utf8", env: Object.assign({}, process.env, { SEQ_ONE: String(gi) }),
  });
  const out = (r.stdout || "").split("\n")
    .filter(l => !/Not implemented|jsdom\/lib|node:internal|^\s+at /.test(l));
  out.filter(l => l.trim() && !l.startsWith("###")).forEach(l => console.log(l));
  const tail = (r.stdout || "").split("\n").find(l => l.startsWith("### "));
  if (tail){ const [, a, b] = tail.split(" "); P += Number(a); F += Number(b); }
  else F += 1;
}
console.log("\n=== 통과 " + P + " / 실패 " + F + " ===\n");
process.exit(F ? 1 : 0);
