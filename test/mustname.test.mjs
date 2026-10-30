/* **구글로 처음 들어오면 별명을 반드시 정한다** (2026-10-26 사용자 신고)

   "사용자들이 새사용자1 2 이런 식으로 이름이 뜨는데 구글 로그인하면 닉네임 설정 필수로 하게 안 되어 있나"
   있었지만 반드시가 아니었다: 별명 창에 × · 바깥 누르기 · 뒤로가기 닫기가 있었고, 칸에 임시 이름(새사용자3)을 채워 둬서
   그대로 "정하기" 를 누르면 그 이름으로 정해졌다.

   진짜 nav.js·entry.js 를 JSDOM 에 세우고 본다:
     1. 정해야 하는 사람(구글 · needName): × 가 없다 · 바깥을 눌러도 안 닫힌다 · 뒤로가기도 안 닫히고 "게임 종료" 를 묻는다
        · 확인창이 별명 창 **위에** 뜬다 · 칸이 비어 있다(임시 이름을 안 채움) · 이유 한 줄이 있다
     2. 임시 이름(새사용자…)으로는 못 정한다 · 이유가 보인다
     3. 제대로 정하면 닫힌다
     4. 이미 정한 사람이 계정 창에서 이름을 바꿀 때는 예전 그대로(× 있음 · 닫힘 · 지금 이름이 채워짐)
     5. 게스트는 정하라고 막지 않는다
     6. 별명 규칙: 새사용자로 시작하는 이름 거부(official) · 그 밖의 이름은 그대로
     7. 계정 코드: 임시 이름 그대로인 구글 계정은 다시 켜면 정해야 하는 사람으로 본다(PLACEHOLDER)

   쓰는 법:  node test/mustname.test.mjs */
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

const ENTRY = join(HERE, "_entry_mustname.js");
const OUT = join(HERE, "_bundle_mustname.mjs");
writeFileSync(ENTRY,
  'export { mount as mountEntry } from "../src/screens/entry.js";\n' +
  'export { initNav, CFG_HTML, OPT_HTML, ASK_HTML } from "../src/nav.js";\n' +
  'export { BAR_SWAP } from "../src/lib/bar.js";\n' +
  'export { MARKUP } from "../src/screens/_markup.js";\n' +
  'export { checkName } from "../src/lib/account.js";\n' +
  'export { PLACEHOLDER } from "../src/lib/account.js";\n');
execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"), ENTRY, "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty", "--define:import.meta.env.VITE_TEST_HOOKS=\"1\"", "--define:import.meta.env=globalThis.__ENV__",
  "--outfile=" + OUT, "--log-level=warning",
], { cwd: ROOT, stdio: "inherit" });

const IDS = ["entry", "lobby", "room", "draw", "table", "tax", "result"];
const dom = new JSDOM("<!doctype html><html><body><div id='stage'>" +
  IDS.map(id => "<section class='page" + (id === "lobby" ? " is-on" : "") + "' id='" + id + "'></section>").join("") +
  "</div></body></html>", { pretendToBeVisual: true, url: "http://localhost/" });
global.window = dom.window; global.document = dom.window.document;
global.Element = dom.window.Element; global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event; global.localStorage = dom.window.localStorage;
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.__ENV__ = { VITE_TEST_HOOKS: "1" };
window.__lang = "ko";
localStorage.setItem("zk_lang", "ko"); localStorage.setItem("zk_agree", "1");
const B = await import(pathToFileURL(OUT).href);
IDS.forEach(id => {
  let h = B.MARKUP[id] || "";
  const sw = B.BAR_SWAP[id];
  if (sw) h = h.replace(sw[0], sw[1]);
  document.getElementById(id).innerHTML = h;
});
document.getElementById("stage").insertAdjacentHTML("beforeend", B.OPT_HTML + B.CFG_HTML + (B.ASK_HTML || ""));
/* 구글로 처음 들어온 사람 — 임시 이름, 정해야 함 */
window.ACCOUNT = { signedIn: true, guest: false, name: "새사용자3", needName: true };
let tried = [];
window.setNickname = async v => {
  tried.push(v);
  const c = B.checkName(v);
  if (!c.ok) return { ok: false, why: c.why };
  Object.assign(window.ACCOUNT, { name: c.name, needName: false });
  window.dispatchEvent(new Event("accountchange"));
  return { ok: true, name: c.name };
};
B.mountEntry(document.getElementById("entry"));
B.initNav();
window.setLang && window.setLang("ko");
await wait(100);
const q = s => document.querySelector(s);
const click = el => el && el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
const boxOn = () => Boolean(q("#nkBox") && q("#nkBox").classList.contains("on"));
const back = () => window.dispatchEvent(new Event("popstate"));

console.log("\n--- 1. 정해야 하는 사람 ---");
window.__askName();
await wait(100);
check("(준비) 별명 창이 떴다", boxOn());
check("**× 가 없다**", !q("#nkBox .cfg__x"));
check("이유 한 줄이 있다 (정해야 시작할 수 있다)", /정해야 시작할 수 있습니다/.test((q("#nkBox #nkMust") || {}).textContent || ""), (q("#nkBox #nkMust") || {}).textContent);
check("**칸이 비어 있다** (임시 이름을 안 채움)", q("#nkBox #nkIn").value === "" && /별명을 입력/.test(q("#nkBox #nkIn").getAttribute("placeholder") || ""), JSON.stringify(q("#nkBox #nkIn").value));
click(q("#nkBox .cfg__v"));
await wait(50);
check("**바깥을 눌러도 안 닫힌다**", boxOn());
/* 뒤로가기 — 웹에서는 popstate. nav 가 같은 onBack 으로 받는다 */
const ask0 = q("#ask") && q("#ask").classList.contains("on");
if (typeof window.__back === "function") window.__back(); else back();
await wait(80);
const askOn = Boolean(q("#ask") && q("#ask").classList.contains("on"));
check("**뒤로가기로도 안 닫힌다**", boxOn());
check("뒤로가기는 \"게임 종료\" 를 묻는다", !ask0 && askOn && /종료/.test((q("#ask #askT") || {}).textContent || ""), (q("#ask #askT") || {}).textContent);
/* 확인창이 별명 창 위에 뜨는가 — base.css 의 z-index 를 그대로 읽는다(JSDOM 은 CSS 를 안 그린다) */
const css = (await import("node:fs")).readFileSync(join(ROOT, "src/styles/base.css"), "utf8");
const zCfg = Number((css.match(/\.cfg\{[^}]*z-index:(\d+)/) || [])[1]);
const zAsk = Number((css.match(/#ask\{z-index:(\d+)\}/) || [])[1]);
check("확인창이 별명 창 위 (z-index " + zAsk + " > " + zCfg + ")", zAsk > zCfg, zAsk + " / " + zCfg);
click(q("#ask [data-askno]") || q("#ask #askNo"));
await wait(50);
check("확인창에서 취소하면 별명 창은 그대로", boxOn() && !(q("#ask").classList.contains("on")));

console.log("\n--- 2. 임시 이름으로는 못 정한다 ---");
q("#nkBox #nkIn").value = "새사용자3";
click(q("#nkBox #nkOk"));
await wait(100);
check("**새사용자3 으로는 안 정해진다** — 창 그대로", boxOn() && window.ACCOUNT.needName === true, JSON.stringify(tried));
/* 안내 글은 1.0.8 문구 그대로(2026-10-29 사용자: 시키지 않은 문구 되돌림) — "새사용자" 를 따로 적지 않고 "운영자처럼 보이거나 …" 가 뜬다 */
check("이유가 보인다 (1.0.8 문구)", /운영자처럼 보이거나/.test((q("#nkBox #nkMsg") || {}).textContent || ""), (q("#nkBox #nkMsg") || {}).textContent);

console.log("\n--- 3. 제대로 정함 ---");
q("#nkBox #nkIn").value = "사자왕";
click(q("#nkBox #nkOk"));
await wait(150);
check("**정하면 닫힌다**", !boxOn() && window.ACCOUNT.name === "사자왕" && window.ACCOUNT.needName === false, window.ACCOUNT.name);

console.log("\n--- 4. 이미 정한 사람이 이름을 바꿀 때 ---");
window.__askName();
await wait(100);
check("× 가 있다", Boolean(q("#nkBox .cfg__x")));
check("지금 이름이 채워져 있다", q("#nkBox #nkIn").value === "사자왕", q("#nkBox #nkIn").value);
check("이유 줄은 없다", !q("#nkBox #nkMust"));
click(q("#nkBox .cfg__v"));
await wait(50);
check("바깥을 누르면 닫힌다 (예전 그대로)", !boxOn());
window.__askName(); await wait(50);
if (typeof window.__back === "function") window.__back(); else back();
await wait(80);
check("뒤로가기로도 닫힌다 (예전 그대로)", !boxOn() && !(q("#ask") && q("#ask").classList.contains("on")));

console.log("\n--- 5. 게스트 ---");
Object.assign(window.ACCOUNT, { guest: true, needName: true, name: "게스트12" });
window.__askName(); await wait(50);
check("게스트는 막지 않는다 (× 있음)", Boolean(q("#nkBox .cfg__x")));
click(q("#nkBox .cfg__x")); await wait(50);
check("게스트는 닫힌다", !boxOn());

console.log("\n--- 6. 별명 규칙 ---");
for (const n of ["새사용자", "새사용자3", "새사용자12"]) check(n + " 거부 (official)", B.checkName(n).why === "official", JSON.stringify(B.checkName(n)));
for (const n of ["사용자", "새사람", "헌사용자", "사자왕"]) check(n + " 는 된다", B.checkName(n).ok, JSON.stringify(B.checkName(n)));

console.log("\n--- 7. 임시 이름 알아보기 ---");
check("새사용자·새사용자2·새사용자40 은 임시 이름", ["새사용자", "새사용자2", "새사용자40"].every(n => B.PLACEHOLDER.test(n)));
check("사자왕·새사용자a 는 아니다", !B.PLACEHOLDER.test("사자왕") && !B.PLACEHOLDER.test("새사용자a"));

console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
