/* 진짜 브라우저로 화면을 띄우고 재 본다.

   가짜 브라우저(jsdom)는 배치를 계산하지 않는다 — 그래서 "자리가 어디에 그려지는가",
   "단추가 다른 것에 덮여 있는가" 같은 것을 여태 하나도 못 잡았다.
   여기서는 dist 를 띄우고 실제 좌표를 읽는다.

   쓰는 법: node test/shot.mjs [내보낼그림.png] */

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pup from "puppeteer-core";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DIST = join(ROOT, "dist");

const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css",
  ".webp":"image/webp", ".png":"image/png", ".json":"application/json",
  ".woff2":"font/woff2", ".svg":"image/svg+xml" };

/* dist 를 최신으로 맞춘다.

   이 검사는 **빌드된 배포본**을 띄운다. 빌드를 안 했으면 빈 페이지가 뜨고
   "window.__createRoom is not a function" 같은 엉뚱한 소리가 난다.
   낡은 dist 를 띄우면 고친 것을 안 보고 통과시켜 버리므로, src 가 더 새로우면 다시 빌드한다 */
export function ensureBuild(){
  const idx = join(DIST, "index.html");
  let need = !existsSync(idx);
  if (!need){
    const built = statSync(idx).mtimeMs;
    const newest = (dir) => {
      let t = 0;
      for (const e of readdirSync(dir, { withFileTypes: true })){
        if (e.name === "node_modules" || e.name.startsWith(".")) continue;
        const f = join(dir, e.name);
        t = Math.max(t, e.isDirectory() ? newest(f) : statSync(f).mtimeMs);
      }
      return t;
    };
    const src = Math.max(newest(join(ROOT, "src")), newest(join(ROOT, "public")),
                         statSync(join(ROOT, "index.html")).mtimeMs);
    need = src > built;
  }
  if (!need) return;
  console.log("  (dist 를 새로 빌드합니다)");
  execFileSync(process.execPath, [join(ROOT, "node_modules/vite/bin/vite.js"), "build"],
               { cwd: ROOT, stdio: "ignore" });
}

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

/* 쓸 수 있는 크롬을 찾는다.

   1) CHROME_PATH 환경변수
   2) 이 기기에 깔린 크롬 / 엣지 (윈도우·맥·리눅스)
   3) @sparticuz/chromium (**리눅스 전용**. 윈도우에 깔면 못 쓴다 —
      바이너리가 리눅스용이라 "spawn ... chromium ENOENT" 로 죽는다)

   못 찾으면 null. 부르는 쪽에서 검사를 건너뛴다 */
export async function findBrowser(){
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH))
    return { path: process.env.CHROME_PATH, args: [] };

  const LA = process.env.LOCALAPPDATA || "";
  const PF = process.env["ProgramFiles"] || "C:\\Program Files";
  const PF86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const cands = {
    win32: [
      PF + "\\Google\\Chrome\\Application\\chrome.exe",
      PF86 + "\\Google\\Chrome\\Application\\chrome.exe",
      LA + "\\Google\\Chrome\\Application\\chrome.exe",
      PF + "\\Microsoft\\Edge\\Application\\msedge.exe",
      PF86 + "\\Microsoft\\Edge\\Application\\msedge.exe",
    ],
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ],
    linux: [
      "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge",
    ],
  }[process.platform] || [];
  for (const p of cands) if (existsSync(p)) return { path: p, args: [] };

  if (process.platform === "linux"){
    try {
      const m = await import("@sparticuz/chromium");
      const c = m.default || m;
      const p = await c.executablePath();
      if (p && existsSync(p)) return { path: p, args: c.args || [] };
    } catch(e){}
  }
  return null;
}

export async function open({ width = 412, height = 745, port = 5599 } = {}){
  const found = await findBrowser();
  if (!found) throw new Error("NO_BROWSER");
  const browser = await pup.launch({
    args: [...found.args, "--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: found.path,
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
  if (!(await findBrowser())){
    console.log("크롬을 못 찾았습니다. 크롬이나 엣지를 깔거나 CHROME_PATH 를 정해 주세요.");
    process.exit(1);
  }
  ensureBuild();
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
