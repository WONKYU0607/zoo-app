/* 진짜 브라우저로 화면을 띄우고 재 본다.

   가짜 브라우저(jsdom)는 배치를 계산하지 않는다 — 그래서 "자리가 어디에 그려지는가",
   "단추가 다른 것에 덮여 있는가" 같은 것을 여태 하나도 못 잡았다.
   여기서는 dist 를 띄우고 실제 좌표를 읽는다.

   쓰는 법: node test/shot.mjs [내보낼그림.png] */

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, readdirSync, mkdirSync, rmSync } from "node:fs";
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

  /* **여러 검사가 동시에 돌면 빌드가 겹친다.**
     같은 `dist` 폴더에 vite 가 둘 이상 붙으면 서로 지우고 쓰다가 터지고,
     운 좋게 안 터져도 반쪽짜리 `dist` 가 떠서 "Failed to fetch" 가 난다.
     실제로 소리·얼굴·뒤로가기·배치 네 개가 한꺼번에 실패한 적이 있다.
     폴더 만들기는 원자적이라, 먼저 만든 쪽만 빌드하고 나머지는 기다린다 */
  const lock = join(ROOT, "node_modules", ".zoo-build-lock");
  const nap = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch(e){} };
  /* 앞서 돌던 것이 터져서 남은 자물쇠는 5분 뒤 무시한다 */
  try { if (Date.now() - statSync(lock).mtimeMs > 300000) rmSync(lock, { recursive: true, force: true }); } catch(e){}
  let mine = false;
  try { mkdirSync(lock); mine = true; } catch(e){ mine = false; }
  if (!mine){
    const until = Date.now() + 240000;
    while (existsSync(lock) && Date.now() < until) nap(200);
    if (existsSync(join(DIST, "index.html"))) return;      /* 남이 다 만들어 줬다 */
    try { mkdirSync(lock); } catch(e){}                    /* 그래도 없으면 내가 만든다 */
  }
  try {
    console.log("  (dist 를 새로 빌드합니다)");
    execFileSync(process.execPath, [join(ROOT, "node_modules/vite/bin/vite.js"), "build"],
                 { cwd: ROOT, stdio: "ignore" });
  } finally {
    try { rmSync(lock, { recursive: true, force: true }); } catch(e){}
  }
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
  /* 앞 판이 덜 닫혔으면 그 자리가 아직 물려 있다. 몇 칸 옮겨 가며 잡는다 */
  return new Promise((resolve, reject) => {
    let tries = 0;
    const go = () => {
      s.once("error", err => {
        if (err.code === "EADDRINUSE" && ++tries < 12){ port++; go(); return; }
        reject(err);
      });
      /* **주소를 가리지 말 것.**
         화면을 `localhost` 로 열어야 하는데(아래 goto 참고), 윈도우에서는
         `localhost` 가 `::1`(IPv6) 로 먼저 풀린다. `127.0.0.1` 에만 매어 두면
         크롬이 못 붙는다. 가리지 않고 들으면 둘 다 받는다 */
      s.listen(port, () => { s.__port = port; resolve(s); });
    };
    go();
  });
}

/* 다 쓴 뒤 확실히 닫는다. 안 닫으면 크롬이 남아 돌고 검사가 안 끝난다 */
export function shut(srv, browser){
  try {
    if (browser){
      /* close() 는 비동기라 프로세스가 곧 끝나면 안 끝난다.
         윈도우에서는 그대로 두면 크롬이 남아 돈다 — 실제로 죽인다 */
      const proc = browser.process && browser.process();
      browser.close().catch(() => {});
      if (proc && !proc.killed) proc.kill("SIGKILL");
    }
  } catch(e){}
  try {
    if (srv){
      if (srv.closeAllConnections) srv.closeAllConnections();
      srv.close();
      srv.unref();
    }
  } catch(e){}
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

export async function open({ width = 412, height = 745, port = 5599, srv = null } = {}){
  if (srv && srv.__port) port = srv.__port;
  const found = await findBrowser();
  if (!found) throw new Error("NO_BROWSER");
  const browser = await pup.launch({
    args: [...found.args, "--no-sandbox", "--disable-dev-shm-usage"]
      /* 검사용 크로미움 꾸러미가 `--disable-web-security` 를 달고 뜬다.
         그러면 **진짜 크롬에서는 막히는 것이 여기서만 통과**한다.
         실제로 CORS 문제를 이것 때문에 오래 못 봤다. 그 옵션은 걷어낸다 */
      .filter(a => !/^--disable-web-security/.test(a)),
    executablePath: found.path,
    headless: true,
  });
  const page = await browser.newPage();
  /* 느린 기기에서 30초 기본값은 빠듯하다 */
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  const logs = [];
  page.on("console", m => logs.push(m.type() + ": " + m.text()));
  page.on("pageerror", e => logs.push("ERROR: " + e.message));
  /* **검사는 진짜 배포 서버에 붙으면 안 된다.**
     `.env` 에 fly 주소가 박혀 있으면 브라우저 검사가 거기로 방을 만들러 가는데,
     배포 서버는 `NODE_ENV=production` 이라 localhost 를 안 받아 준다(당연하다).
     그래서 이 기기 방으로 돌린다. 서버 대전 검사는 이 뒤에 자기 주소를 직접 넣는다 */
  await page.evaluateOnNewDocument(() => { globalThis.__ZOO_SERVER = ""; });
  /* **`127.0.0.1` 이 아니라 `localhost` 로 연다.**
     게임 서버(`server.js`)는 붙어도 되는 곳을 boardgame.io 의
     `Origins.LOCALHOST_IN_DEVELOPMENT` 로 정하는데, 그 정규식이 `/localhost:\d+/` 라
     **`127.0.0.1` 은 안 맞는다.** 그러면 서버가 CORS 허가를 안 내주고
     브라우저가 막아서 "Failed to fetch" 만 남는다.
     내 컨테이너의 크로미움은 `--disable-web-security` 로 떠서 이걸 못 보고 지나갔었다 */
  await page.goto("http://localhost:" + port + "/", { waitUntil: "networkidle0" });
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
  const { browser, page, logs } = await open({ srv });
  await toTable(page, { numPlayers: 4 });
  const out = process.argv[2] || join(tmpdir(), "zoo-table.png");
  await page.screenshot({ path: out });
  console.log("찍음:", out);
  console.log("자리:", JSON.stringify(await boxes(page, "#table .seat"), null, 1));
  console.log("자동 단추:", JSON.stringify(await boxes(page, "#table #auto")));
  console.log("자동 단추를 누르면 받는 것:", await hit(page, "#table #auto"));
  console.log("콘솔:", logs.slice(0, 8));
  shut(srv, browser);
}
