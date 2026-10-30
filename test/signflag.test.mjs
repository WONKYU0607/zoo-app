/* **이미 로그인한 사람은 첫 화면이 안 바뀐다** (2026-10-26 사용자 신고)

   "게임 처음에 들어갈 때 구글 로그인이 되어 있는데도 잠시 딜레이가 되어 있다가 게스트로 시작하기가 떴다가
    로그인되면서 게임 시작 버튼이 나온다. 로그인 이미 한 사람은 그 바뀌는 거 안 뜨게."

   앱을 막 켜면 로그인 복원 + 계정 문서 받기가 끝날 때까지(accountready) 잠깐 걸린다. 그사이를 흉내 낸다 —
   첫 화면을 세운 뒤 한참 있다가 계정을 넣고 accountready 를 보낸다. 단추 글자·게스트 단추가 **바뀔 때마다** 적어 둔다.

     A. 지난번에 로그인해 있었고(기록 있음) 확인이 늦게 끝남 → 처음부터 끝까지 "게임 시작" + 별명,
        "구글로 시작하기"·게스트 단추가 **한 번도 안 보인다**. 끝난 뒤 누르면 로비
     B. 확인이 끝나기 전에 "게임 시작" 을 누름 → 구글 로그인 창을 띄우지 않고 "들어가는 중",
        확인이 끝나면 **저절로** 로비
     C. 기록은 있는데 로그인이 풀려 있었음 → 확인이 끝나면 로그인 화면(구글로 시작하기·게스트)으로.
        그 전에 눌렀어도 구글 로그인이 저절로 뜨지 않는다
     D. 기록이 없음(처음 켠 사람·로그아웃한 사람) → 예전처럼 곧바로 로그인 화면
     E. 기록은 별명만 — 깨진 값이면 없는 것으로 본다

   쓰는 법:  node test/signflag.test.mjs */
import { JSDOM } from "jsdom";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

const ENTRY = join(HERE, "_entry_signflag.js");
const OUT = join(HERE, "_bundle_signflag.mjs");
writeFileSync(ENTRY,
  'export { mount as mountEntry } from "../src/screens/entry.js";\n' +
  'export { initNav, CFG_HTML, OPT_HTML } from "../src/nav.js";\n' +
  'export { BAR_SWAP } from "../src/lib/bar.js";\n' +
  'export { MARKUP } from "../src/screens/_markup.js";\n' +
  'export { rememberIn, forgetIn, wasIn } from "../src/lib/signedflag.js";\n');
execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"), ENTRY, "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty", "--define:import.meta.env.VITE_TEST_HOOKS=\"1\"", "--outfile=" + OUT, "--log-level=warning",
], { cwd: ROOT, stdio: "inherit" });

/* 첫 화면을 새로 세운다 — 판마다 새 창(JSDOM)·새 모듈 */
let run = 0;
async function boot({ flag }){
  const IDS = ["entry", "lobby", "room", "draw", "table", "tax", "result"];
  const dom = new JSDOM("<!doctype html><html><body><div id='stage'>" +
    IDS.map(id => "<section class='page" + (id === "entry" ? " is-on" : "") + "' id='" + id + "'></section>").join("") +
    "</div></body></html>", { pretendToBeVisual: true, url: "http://localhost/" });
  global.window = dom.window; global.document = dom.window.document;
  global.Element = dom.window.Element; global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event; global.localStorage = dom.window.localStorage;
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  window.__lang = "ko";
  localStorage.setItem("zk_agree", "1");                     /* 약관은 이미 동의한 사람 */
  localStorage.setItem("zk_lang", "ko");
  if (flag === "bad") localStorage.setItem("zk_in", "{깨짐");
  else if (flag) localStorage.setItem("zk_in", JSON.stringify({ name: flag }));
  const B = await import(pathToFileURL(OUT).href + "?run=" + (++run));
  IDS.forEach(id => {
    let h = B.MARKUP[id] || "";
    const sw = B.BAR_SWAP[id];
    if (sw) h = h.replace(sw[0], sw[1]);
    document.getElementById(id).innerHTML = h;
  });
  document.getElementById("stage").insertAdjacentHTML("beforeend", B.OPT_HTML + B.CFG_HTML);
  /* 가짜 계정 — 아직 확인 전(로그인 안 된 것처럼 보이는 상태) */
  window.ACCOUNT = { signedIn: false, guest: false, name: "", loaded: false };
  const calls = { google: 0, guest: 0 };
  window.signInGoogle = async () => { calls.google++; };
  window.signInGuest = async () => { calls.guest++; };
  /* 단추 글자·게스트 단추가 바뀔 때마다 적는다 — 깜빡임은 한순간이라 끝 모습만 보면 못 잡는다 */
  const seen = [];
  const q = s => document.querySelector(s);
  const note = () => {
    const st = q("#entry #start"), g = q("#entry #testin");
    const s = (st ? st.textContent : "-") + " | 게스트 " + (g && !g.hidden ? "보임" : "숨김");
    if (seen[seen.length - 1] !== s) seen.push(s);
  };
  new dom.window.MutationObserver(note).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
  B.mountEntry(document.getElementById("entry"));
  B.initNav();
  window.setLang && window.setLang("ko");
  note();
  /* 확인이 끝났다 — main.js 가 하는 것과 같은 순서(계정 → accountchange → __authDone → accountready) */
  const settle = async acct => {
    if (acct){ Object.assign(window.ACCOUNT, acct, { loaded: true }); window.dispatchEvent(new Event("accountchange")); }
    window.__authDone = true;
    window.dispatchEvent(new Event("accountready"));
    await wait(50);
  };
  const tap = () => q("#entry #start").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  const page = () => (document.querySelector(".page.is-on") || {}).id;
  return { B, q, seen, calls, settle, tap, page, hint: () => (q("#entry #hint") || {}).textContent || "" };
}
const shown = (seen, re) => seen.some(s => re.test(s));

console.log("\n--- A. 로그인해 있던 사람, 확인이 늦게 끝남 ---");
{
  const e = await boot({ flag: "원규" });
  await wait(900);                                          /* 게스트 단추 타이머(0.3초)를 넉넉히 지나도록 */
  check("**켜자마자 \"게임 시작\"** + 별명", e.q("#entry #start").textContent === "게임 시작" && e.hint() === "원규", e.q("#entry #start").textContent + " · " + e.hint());
  check("확인 전에도 단추는 눌린다(꺼져 있지 않다)", !e.q("#entry #start").disabled);
  await e.settle({ signedIn: true, guest: false, name: "원규" });
  check("**확인이 끝나는 동안 한 번도 안 바뀌었다** — 구글로 시작하기·게스트 단추가 안 보였다",
    !shown(e.seen, /구글로 시작하기|게스트 보임/), JSON.stringify(e.seen));
  e.tap(); await wait(80);
  check("눌러서 로비로", e.page() === "lobby", e.page());
  check("구글 로그인 창은 안 불렸다", e.calls.google === 0);
}

console.log("\n--- B. 확인이 끝나기 전에 누름 ---");
{
  const e = await boot({ flag: "원규" });
  await wait(100);
  e.tap(); await wait(50);
  check("**누르면 \"들어가는 중\"**, 아직 첫 화면", e.q("#entry #start").textContent === "들어가는 중" && e.page() === "entry", e.q("#entry #start").textContent + " · " + e.page());
  check("**구글 로그인 창을 띄우지 않았다**", e.calls.google === 0, e.calls.google + "번");
  await wait(600);
  check("기다리는 동안 게스트 단추가 안 나온다", !shown(e.seen, /게스트 보임/), JSON.stringify(e.seen));
  await e.settle({ signedIn: true, guest: false, name: "원규" });
  await wait(80);
  check("**확인이 끝나자 저절로 로비로**", e.page() === "lobby", e.page());
  check("끝까지 구글로 시작하기가 안 보였다", !shown(e.seen, /구글로 시작하기/), JSON.stringify(e.seen));
}

console.log("\n--- C. 기록은 있는데 로그인이 풀려 있었음 ---");
{
  const e = await boot({ flag: "원규" });
  await wait(200);
  await e.settle(null);                                     /* 로그인 안 됨으로 끝났다 */
  await wait(400);
  check("확인이 끝나면 로그인 화면 (구글로 시작하기 · 게스트)", e.q("#entry #start").textContent === "구글로 시작하기" && !e.q("#entry #testin").hidden,
    e.q("#entry #start").textContent + " · 게스트 " + (e.q("#entry #testin").hidden ? "숨김" : "보임"));
  check("첫 화면 그대로 (로비로 안 감)", e.page() === "entry");
  const f = await boot({ flag: "원규" });
  await wait(100);
  f.tap(); await wait(50);
  await f.settle(null);
  await wait(400);
  check("확인 전에 눌렀어도 **구글 로그인이 저절로 뜨지 않는다** — 로그인 화면으로", f.calls.google === 0 && f.q("#entry #start").textContent === "구글로 시작하기" && !f.q("#entry #start").disabled,
    "구글 " + f.calls.google + "번 · " + f.q("#entry #start").textContent);
  f.tap(); await wait(50);
  check("그다음 누르면 구글 로그인", f.calls.google === 1, f.calls.google + "번");
}

console.log("\n--- D. 기록 없음 (처음·로그아웃한 사람) ---");
{
  const e = await boot({ flag: null });
  check("곧바로 \"구글로 시작하기\"", e.q("#entry #start").textContent === "구글로 시작하기", e.q("#entry #start").textContent);
  await wait(500);
  check("게스트 단추도 예전처럼 나온다", !e.q("#entry #testin").hidden);
  e.tap(); await wait(50);
  check("누르면 구글 로그인 (예전 그대로)", e.calls.google === 1);
}

console.log("\n--- E. 기록 ---");
{
  const e = await boot({ flag: "bad" });
  check("깨진 기록은 없는 것으로 — 로그인 화면", e.q("#entry #start").textContent === "구글로 시작하기", e.q("#entry #start").textContent);
  e.B.rememberIn("사자왕");
  check("적으면 별명만 남는다", localStorage.getItem("zk_in") === JSON.stringify({ name: "사자왕" }) && e.B.wasIn().name === "사자왕", localStorage.getItem("zk_in"));
  e.B.forgetIn();
  check("지우면 없다", e.B.wasIn() === null);
}

console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
