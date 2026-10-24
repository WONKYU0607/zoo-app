/* **큰 틀이 폰 하단바(시스템 내비게이션 바)에 안 겹치는가** (2026-10-23 사용자 신고 · 캡처)

   "터치에 영향은 안 주지만 하단바에 큰 틀이 겹쳐 있잖아. 하단바 위치 계산해서 좀 더 위로 올라오게"

   안드로이드 앱(Capacitor 8, 웹뷰 140+)은 화면을 시스템 바 밑까지 그린다. 그 높이는 env(safe-area-inset-bottom) 로 온다.
   크롬 개발 도구(Emulation.setSafeAreaInsetsOverride)로 폰과 같은 값(위 32px · 아래 48px = 3버튼 내비게이션)을 넣고 본다:
     1. 방 만들기 · 설정 · 규칙 창의 틀 아래 끝이 하단바 위에 있다(8px 띄움)
     2. 규칙 창 위 끝은 하단바가 없을 때와 같은 자리 — 위로 더 올라가 상단바를 더 가리지 않는다
     3. Capacitor 가 넣는 --safe-area-inset-bottom 만 있을 때(env 가 0 인 웹뷰)도 같은 높이만큼 올라간다
     4. 하단바가 없는 화면(0)에서는 예전과 똑같다(아래 8px)
     5. 로비·대기실·판 화면의 단추·자리·손패는 하단바 밑으로 안 들어간다

   쓰는 법:  node test/navbar.test.mjs */
import { serve, open, shut, ensureBuild, findBrowser, toTable } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); console.log("=== 통과 0 / 실패 0 ===\n"); process.exit(0); }
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++; console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };
const nap = ms => new Promise(r => setTimeout(r, ms));
const TOP = 32, BOT = 48;

ensureBuild();
const srv = await serve(5963);
/* mode: "env" = 크롬이 env() 를 폰처럼 준다 · "var" = Capacitor 가 넣는 CSS 변수만 · "none" = 하단바 없음 */
async function fresh(mode){
  const o = await open({ srv, width: 412, height: 915 });
  const cdp = await o.page.target().createCDPSession();
  if (mode === "env"){
    try { await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: TOP, bottom: BOT } }); }
    catch(e){ return null; }
  }
  await o.page.evaluateOnNewDocument((mode, TOP, BOT) => {
    try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
    if (mode === "var") document.addEventListener("DOMContentLoaded", () => {
      document.documentElement.style.setProperty("--safe-area-inset-top", TOP + "px");
      document.documentElement.style.setProperty("--safe-area-inset-bottom", BOT + "px");
    });
  }, mode, TOP, BOT);
  await o.page.reload({ waitUntil: "networkidle0" });
  await o.page.evaluate(() => window.__goto && window.__goto("lobby"));
  await nap(500);
  return o;
}
const PANELS = [
  ["방 만들기", () => document.querySelector("#lobby #btNew").dispatchEvent(new MouseEvent("click", { bubbles: true })), "#opts.on .opts__p"],
  ["설정", () => document.querySelector("[data-cfgopen]").dispatchEvent(new MouseEvent("click", { bubbles: true })), "#cfg.on .cfg__p"],
  ["규칙", () => document.getElementById("btRules").click(), "#lobby .sheet.is-open .sheet__panel"],
];
async function panelBox(mode, which){
  const o = await fresh(mode);
  if (!o) return null;
  const [, openIt, sel] = PANELS[which];
  await o.page.evaluate(openIt);
  await nap(700);
  const r = await o.page.evaluate(s => { const p = document.querySelector(s); if (!p) return null; const b = p.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), H: innerHeight }; }, sel);
  const errs = o.logs.filter(l => /^ERROR/.test(l));
  await o.browser.close();
  return Object.assign(r || {}, { errs });
}

console.log("\n--- 1~4. 큰 틀 ---");
const probe = await fresh("env");
if (!probe){
  console.log("  (이 크롬은 safe-area 흉내를 못 냅니다 — 건너뜁니다)");
} else {
  await probe.browser.close();
  for (let i = 0; i < PANELS.length; i++){
    const name = PANELS[i][0];
    const none = await panelBox("none", i), env = await panelBox("env", i), cvar = await panelBox("var", i);
    check("(준비) " + name + " 창이 열렸다", none && env && cvar && none.bottom && env.bottom && cvar.bottom, JSON.stringify({ none, env, cvar }));
    if (!(none && env && cvar)) continue;
    check("**" + name + ": 틀 아래 끝이 하단바 위** (하단바 " + (env.H - BOT) + " · 틀 " + env.bottom + ")", env.bottom <= env.H - BOT - 6 && env.bottom >= env.H - BOT - 10, "띄움 " + (env.H - BOT - env.bottom) + "px");
    check(name + ": Capacitor 변수만 있어도 같은 높이", cvar.bottom === env.bottom, cvar.bottom + " / " + env.bottom);
    check(name + ": 하단바 없는 화면은 예전 그대로 (아래 8px)", none.bottom === none.H - 8, String(none.H - none.bottom) + "px");
    if (name === "규칙") check("**규칙: 위 끝은 하단바가 없을 때와 같은 자리** (상단바를 더 안 가림)", Math.abs(env.top - none.top) <= 1, env.top + " / " + none.top);
    check(name + ": 화면에서 터진 것이 없다", env.errs.length === 0 && none.errs.length === 0, JSON.stringify(env.errs.slice(0, 2)));
  }

  console.log("\n--- 5. 로비·대기실·판 ---");
  const o = await fresh("env");
  const under = () => o.page.evaluate(BOT => {
    const lim = innerHeight - BOT;
    const on = document.querySelector(".page.is-on");
    return [...(on ? on.querySelectorAll("button, .seat, .hand, .acts") : [])]
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden" && r.bottom > lim + 1; })
      .map(e => (e.id || e.className || e.tagName).toString().slice(0, 24) + "@" + Math.round(e.getBoundingClientRect().bottom));
  }, BOT);
  check("로비: 하단바 밑으로 들어간 것이 없다", (await under()).length === 0, JSON.stringify(await under()));
  await o.page.evaluate(async () => { window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false }; await window.__createRoom(); window.__goto("room"); });
  await nap(1200);
  check("대기실: 하단바 밑으로 들어간 것이 없다", (await under()).length === 0, JSON.stringify(await under()));
  await o.page.evaluate(() => window.__leaveRoom && window.__leaveRoom());
  await toTable(o.page, { numPlayers: 2 });
  await nap(1000);
  check("판(1대1 두 줄 손패): 하단바 밑으로 들어간 것이 없다", (await o.page.evaluate(() => (document.querySelector(".page.is-on") || {}).id)) === "table" && (await under()).length === 0, JSON.stringify(await under()));
  await o.browser.close();
}

shut(srv);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
