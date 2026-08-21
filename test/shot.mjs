/* 진짜 브라우저로 화면을 띄우고 재 본다.

   가짜 브라우저(jsdom)는 배치를 계산하지 않는다 — 그래서 "자리가 어디에 그려지는가",
   "단추가 다른 것에 덮여 있는가" 같은 것을 여태 하나도 못 잡았다.
   여기서는 dist 를 띄우고 실제 좌표를 읽는다.

   쓰는 법: node test/shot.mjs [내보낼그림.png] */

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pup from "puppeteer-core";
import chromiumMod from "@sparticuz/chromium";

const chromium = chromiumMod.default || chromiumMod;
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DIST = join(ROOT, "dist");

const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css",
  ".webp":"image/webp", ".png":"image/png", ".json":"application/json",
  ".woff2":"font/woff2", ".svg":"image/svg+xml" };

export function serve(port = 5599){
  const s = createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    let f = join(DIST, p);
    if (!existsSync(f) || p === "/") f = join(DIST, "index.html");
    try {
      const body = readFileSync(f);
      res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
      res.end(body);
    } catch(e){ res.writeHead(404); res.end("no"); }
  });
  return new Promise(r => s.listen(port, () => r(s)));
}

export async function open({ width = 412, height = 745, port = 5599 } = {}){
  const browser = await pup.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  const logs = [];
  page.on("console", m => logs.push(m.type() + ": " + m.text()));
  page.on("pageerror", e => logs.push("ERROR: " + e.message));
  await page.goto("http://127.0.0.1:" + port + "/", { waitUntil: "networkidle0" });
  return { browser, page, logs };
}

/* 화면 하나를 곧바로 띄운다. 방·로그인을 거치지 않고 판부터 본다 */
export async function toTable(page, { numPlayers = 4 } = {}){
  /* 실제 흐름 그대로 — 이 기기 방을 만들고 봇을 채워 시작한다 */
  await page.evaluate(async n => {
    window.__opts = { cap: n, seated: 1, rounds: 3, tax: true, clear2: false };
    await window.__createRoom();
    await window.__startRound();
  }, numPlayers);
  await new Promise(r => setTimeout(r, 500));
  /* 뽑기 화면을 건너뛰고 판으로 */
  await page.evaluate(() => { if (window.__toTable) window.__toTable(); });
  await new Promise(r => setTimeout(r, 900));
}

/* 재기 — 화면에 실제로 어디 그려졌는지 */
export async function boxes(page, sel){
  return page.evaluate(s => [...document.querySelectorAll(s)].map(e => {
    const r = e.getBoundingClientRect();
    return { t: Math.round(r.top), b: Math.round(r.bottom),
             l: Math.round(r.left), r: Math.round(r.right),
             txt: (e.textContent || "").trim().slice(0, 18) };
  }), sel);
}

/* 이 점을 누르면 실제로 어느 요소가 받는가 — 덮여 있는지 알아내는 용도 */
export async function hit(page, sel){
  return page.evaluate(s => {
    const e = document.querySelector(s);
    if (!e) return "없음";
    const r = e.getBoundingClientRect();
    const top = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    if (!top) return "밖";
    if (top === e || e.contains(top)) return "자기자신";
    return (top.tagName + "." + (top.className || "") + "#" + (top.id || "")).slice(0, 60);
  }, sel);
}

if (process.argv[1] && process.argv[1].endsWith("shot.mjs")){
  const srv = await serve();
  const { browser, page, logs } = await open({});
  await toTable(page, { numPlayers: 4 });
  const out = process.argv[2] || "/tmp/table.png";
  await page.screenshot({ path: out });
  console.log("찍음:", out);
  console.log("자리:", JSON.stringify(await boxes(page, "#table .seat"), null, 1));
  console.log("자동 단추:", JSON.stringify(await boxes(page, "#table #auto")));
  console.log("자동 단추를 누르면 받는 것:", await hit(page, "#table #auto"));
  console.log("콘솔:", logs.slice(0, 8));
  await browser.close(); srv.close();
}
