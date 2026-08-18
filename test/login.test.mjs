/* 로그인 화면 검사.
   구글 / 게스트 두 갈래가 보이는가, 게스트에게 랭킹 안내와 잇기 단추가 뜨는가.
   실제 구글 로그인은 브라우저에서만 되므로 여기서는 화면만 본다. */
import { JSDOM } from "jsdom";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"),
  join(HERE, "_entry_login.js"), "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty", "--outfile=" + join(HERE, "_bundle_login.mjs"), "--log-level=warning",
], { cwd: ROOT, stdio: "inherit" });

/* nav 는 다른 화면 요소도 찾으므로 껍데기만 같이 세워 둔다 */
const IDS = ["entry","lobby","room","draw","table","tax","result"];
const dom = new JSDOM("<!doctype html><html><body><div id='stage'>" +
  IDS.map(id => "<section class='page" + (id === "entry" ? " is-on" : "") + "' id='" + id + "'></section>").join("") +
  "</div></body></html>",
  { pretendToBeVisual: true, url: "http://localhost/" });
global.window = dom.window; global.document = dom.window.document;
global.Element = dom.window.Element; global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
window.__lang = "ko";

const B = await import("./_bundle_login.mjs");
IDS.forEach(id => {
  let h = B.MARKUP[id] || "";
  const sw = B.BAR_SWAP[id];
  if (sw) h = h.replace(sw[0], sw[1]);
  document.getElementById(id).innerHTML = h;
});
document.getElementById("stage").insertAdjacentHTML("beforeend", B.OPT_HTML + B.CFG_HTML);

/* 가짜 계정 */
let guestCalled = 0, linkCalled = 0, linkResult = { linked: true }, alerted = "";
window.ACCOUNT = { signedIn: false, guest: false, name: "" };
window.signInGoogle = async () => { window.ACCOUNT = { signedIn: true, guest: false, name: "원규" };
  window.dispatchEvent(new Event("accountchange")); };
window.signInGuest = async () => { guestCalled++; window.ACCOUNT = { signedIn: true, guest: true, name: "손님123" };
  window.dispatchEvent(new Event("accountchange")); };
window.linkGoogle = async () => { linkCalled++; return linkResult; };
window.switchToGoogle = async () => {};
window.confirm = () => true;
window.alert = m => { alerted = String(m); };

B.mountEntry(document.getElementById("entry"));
B.initNav();
window.setLang && window.setLang("ko");
await wait(400);

const q = s => document.querySelector(s);
check("구글로 시작 단추가 있다", q("#start") && q("#start").textContent.includes("구글"),
      q("#start") ? q("#start").textContent : "없음");
check("게스트로 시작 단추가 있다", q("#testin") && q("#testin").textContent.includes("게스트"),
      q("#testin") ? q("#testin").textContent : "없음");
check("게스트 단추가 보인다 (localhost 가 아니어도)", q("#testin") && !q("#testin").hidden);
check("안내 문구가 랭킹을 알린다", (q("#hint").textContent || "").includes("랭킹"),
      q("#hint").textContent);

/* 게스트로 들어간다 */
q("#testin").click();
await wait(300);
check("게스트 로그인이 불렸다", guestCalled === 1);
check("들어가면 게스트 단추가 사라진다", q("#testin").hidden);

/* 설정 창의 계정 칸 */
document.body.insertAdjacentHTML("beforeend", "<button data-cfgopen>설정</button>");
document.querySelector("[data-cfgopen]").click();
await wait(100);
check("설정에 계정 칸이 있다", (q("#cfgAcctL").textContent || "") === "계정", q("#cfgAcctL").textContent);
check("게스트에게 랭킹 안내가 뜬다", (q("#cfgAcct").textContent || "").includes("랭킹에 오르지 않습니다"),
      q("#cfgAcct").textContent);
check("잇기 단추가 보인다", !q("#cfgLinkRow").hidden && q("#cfgLink").textContent.includes("구글"),
      q("#cfgLink").textContent);

/* 잇기 성공 */
q("#cfgLink").click();
await wait(200);
check("잇기가 불렸다", linkCalled === 1);

/* 팝업이 막혀 주소 이동으로 넘어가는 경우엔 아무 말도 하지 않는다 */
alerted = ""; linkResult = { redirecting: true };
q("#cfgLink").click(); await wait(150);
check("주소 이동으로 넘어갈 때는 조용하다", alerted === "", alerted);

/* 실패하면 이유를 그대로 보여준다 */
alerted = "";
window.linkGoogle = async () => { const e = new Error("x"); e.code = "auth/popup-blocked"; throw e; };
q("#cfgLink").click(); await wait(150);
check("실패하면 이유를 알려준다", alerted.includes("auth/popup-blocked"), alerted);
window.linkGoogle = async () => { linkCalled++; return { linked: true }; };

/* 구글로 들어온 사람에게는 안 보인다 */
window.ACCOUNT = { signedIn: true, guest: false, name: "원규" };
window.dispatchEvent(new Event("accountchange"));
await wait(100);
check("구글 사용자에게는 잇기 단추가 없다", q("#cfgLinkRow").hidden);
check("구글 사용자에게는 랭킹에 오른다고 알린다",
      (q("#cfgAcct").textContent || "").includes("랭킹에 오릅니다"), q("#cfgAcct").textContent);

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
