/* 앱이 뜨는가. index.html 의 화면 자리와 코드가 어긋나면 여기서 잡힌다.
   (rank 화면을 넣으면서 index.html 에 자리를 안 만들어 앱 전체가 죽은 적 있음) */
import { JSDOM } from "jsdom";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
  join(HERE, "_entry_boot.js"), "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty", "--outfile=" + join(HERE, "_bundle_boot.mjs"), "--log-level=warning",
  "--define:import.meta.env=globalThis.__ENV__",
], { cwd: ROOT, stdio: "inherit" });

/* 진짜 index.html 을 쓴다 */
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const dom = new JSDOM(html, { pretendToBeVisual: true, url: "http://localhost/" });
global.window = dom.window; global.document = dom.window.document;
global.Element = dom.window.Element; global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.__ENV__ = {};
window.__lang = "ko";

const B = await import("./_bundle_boot.mjs");
const SCREENS = { entry: B.entry, lobby: B.lobby, room: B.room, draw: B.draw,
                  table: B.table, tax: B.tax, result: B.result, rank: B.rank };

/* main.js 의 build() 와 같은 순서로 세운다 */
let boom = null;
try {
  const stageEl = document.getElementById("stage");
  Object.keys(SCREENS).forEach(id => {
    let sec = document.getElementById(id);
    check("index.html 에 " + id + " 자리가 있다", Boolean(sec));
    if (!sec){
      sec = document.createElement("section");
      sec.className = "page"; sec.id = id; stageEl.appendChild(sec);
    }
    let h = B.MARKUP[id] || "";
    const sw = B.BAR_SWAP[id];
    if (sw && h) h = h.replace(sw[0], sw[1]);
    if (h) sec.innerHTML = h;
    sec.querySelectorAll('.lang, .view#lang').forEach(el => {
      if (el.id !== "lang") return;
      const b = document.createElement("button");
      b.className = "cfgbtn"; b.setAttribute("data-cfgopen", ""); b.innerHTML = B.GEAR;
      el.replaceWith(b);
    });
    if (id === "lobby"){
      const gear = sec.querySelector("[data-cfgopen]");
      if (gear && !sec.querySelector("[data-rankopen]")){
        const r = document.createElement("button");
        r.className = gear.className || "top__cfg";
        r.setAttribute("data-rankopen", ""); r.innerHTML = B.CROWN;
        gear.parentNode.insertBefore(r, gear.nextSibling);
      }
    }
  });
  stageEl.insertAdjacentHTML("beforeend", B.OPT_HTML + B.CFG_HTML);
  Object.entries(SCREENS).forEach(([id, mod]) => {
    if (mod.mount) mod.mount(document.getElementById(id));
  });
  B.initNav();
} catch(e){ boom = String(e && e.stack || e).split("\n").slice(0, 3).join(" | "); }

check("앱이 세워진다 (터지지 않는다)", boom === null, boom || "");
await wait(120);

check("로비에 랭킹 단추가 있다", Boolean(document.querySelector("#lobby [data-rankopen]")));
check("랭킹 화면이 그려졌다", Boolean(document.querySelector("#rank #rkTabs")));
const gb = (document.querySelector("#entry #testin") || {}).textContent || "";
check("첫 화면에 게스트 단추가 있다",
      gb.includes("게스트") || gb.toLowerCase().includes("guest"), gb);

/* 랭킹 단추를 누르면 그 화면이 켜진다 */
document.querySelector("#lobby [data-rankopen]").click();
await wait(120);
check("랭킹 단추를 누르면 열린다",
      document.getElementById("rank").classList.contains("is-on"));

/* 랭킹에서 뒤로 나갈 수 있어야 한다 (없어서 튕긴 적 있음) */
const back = document.querySelector("#rank [data-back]");
check("랭킹에 뒤로가기가 있다", Boolean(back), back ? back.dataset.back : "없음");
if (back){
  back.click();
  await wait(120);
  check("뒤로 누르면 로비로 돌아간다",
        document.getElementById("lobby").classList.contains("is-on"));
}

/* 얼굴은 사람을 따라가야 한다. 세 화면 모두 같은 표를 봐야 한다 */
window.GAME = { faces: [3, 1, 0, 2] };
const shots = [];
["draw", "room"].forEach(id => {
  const sec = document.getElementById(id);
  const av = sec ? sec.querySelectorAll(".seat__av") : [];
  shots.push(id + ":" + av.length);
});
check("뽑기·대기실이 얼굴 표를 쓴다",
      /faceOf/.test(String(B.draw.mount)) && /faceOf/.test(String(B.room.mount)),
      shots.join(" "));

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
