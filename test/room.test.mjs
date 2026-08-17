/* 방 대기실 화면 검사.
   화면들이 앱 시작과 함께 한꺼번에 붙기 때문에, 판이 없는 상태에서도
   그리기가 터지지 않아야 한다. 그리고 방장에게는 시작 버튼이 보여야 한다.

   쓰는 법:  node test/room.test.mjs  */

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

/* 화면 코드를 브라우저용으로 묶는다 */
const ENTRY = join(HERE, "_entry_room.js");
const OUT   = join(HERE, "_bundle_room.mjs");
execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"),
  ENTRY, "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty", "--outfile=" + OUT, "--log-level=warning",
], { cwd: ROOT, stdio: "inherit" });

const dom = new JSDOM(
  "<!doctype html><html><body><div id='stage'>" +
  "<section id='room'></section><section id='table'></section></div></body></html>",
  { pretendToBeVisual: true, url: "http://localhost/" });
global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
window.__lang = "ko";
window.__opts = { cap: 6, rounds: 3, tax: true, clear2: false };

const B = await import("./_bundle_room.mjs");
const { createRoom, addBot, toRoomView, seatCount } = B.localroom;

/* 1. 방을 만든다 */
let myRoom = createRoom({ cap: 6, name: "WON KYU KIM" });
window.__room = toRoomView(myRoom);
window.__roomCode = () => "LOCAL";

const roomEl = document.getElementById("room");
roomEl.innerHTML = B.MARKUP.room;
B.mountRoom(roomEl);
window.dispatchEvent(new Event("roomchange"));
await wait(50);

const q = s => roomEl.querySelector(s);
const actionText = () => (q("#action") ? q("#action").textContent : "");

check("방장에게 시작 버튼이 보인다",
      Boolean(q("#action button")) && !actionText().includes("기다리"),
      actionText().trim().slice(0, 30));
check("혼자일 때는 시작 버튼이 잠겨 있다",
      Boolean(q("#action button") && q("#action button").disabled));

/* 2. 봇이 들어온다 */
for (let i = 0; i < 3; i++){
  addBot(myRoom);
  window.__room = toRoomView(myRoom);
  window.__opts.seated = seatCount(myRoom);
  window.dispatchEvent(new Event("roomchange"));
  await wait(20);
}
check("봇 3명이 들어와 4명이 됨", seatCount(myRoom) === 4, seatCount(myRoom) + "명");
check("4명이 되면 시작 버튼이 열린다",
      Boolean(q("#action button") && !q("#action button").disabled),
      actionText().trim().slice(0, 30));

/* 3. 정원까지만 들어온다 */
let guard = 0;
while (addBot(myRoom) && guard++ < 20);
check("정원을 넘지 않는다", seatCount(myRoom) === 6, seatCount(myRoom) + "명");

/* 4. 판이 없는 상태에서 게임 화면을 붙여도 터지지 않아야 한다
      (앱은 시작할 때 모든 화면을 한꺼번에 붙인다) */
let boom = null;
dom.window.addEventListener("error", e => { boom = e.message; });
try {
  const tableEl = document.getElementById("table");
  tableEl.innerHTML = B.MARKUP.table;
  B.mountTable(tableEl);
  window.dispatchEvent(new Event("langchange"));
  window.dispatchEvent(new Event("resize"));
  await wait(60);
} catch (e){ boom = String(e && e.message || e); }
check("판이 없어도 게임 화면이 안 터진다", boom === null, boom || "");

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
