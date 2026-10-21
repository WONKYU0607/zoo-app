/* **출시 후에는 웹으로 게임을 못 한다 — 앱으로만.** (2026-10-21)

   [stated] "게임 출시한 후에는 웹으로는 못 들어가야지. 앱을 다운받아서 컴터로 하든 폰으로 하든 상관없는데"
   웹으로 하면 광고가 안 나와서 광고 없이 공짜로 하게 된다.

   **진짜 배포판(`npm run build` 와 같은 빌드)** 을 띄워 본다:
     ① 웹으로 열면 "앱에서만" 화면만 — 게임 코드도 안 불러오고 바깥(파이어베이스·게임 서버)으로 요청이 없다
     ② 같은 빌드를 앱처럼(캐패시터가 심어 두는 값) 열면 게임이 뜬다
     ③ 약관·개인정보처리방침·계정 삭제 안내·app-ads.txt 는 그대로 열린다
     ④ 검사용 빌드(`VITE_TEST_HOOKS=1`)는 막지 않는다 — 다른 화면 검사들이 그걸 띄운다
   쓰는 법:  node test/webgate.test.mjs   */

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { findBrowser } from "./shot.mjs";
import pup from "puppeteer-core";

const found = await findBrowser();
if (!found){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp",
  ".png": "image/png", ".txt": "text/plain; charset=utf-8", ".json": "application/json", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".ogg": "audio/ogg" };

function build(hooks){
  const out = mkdtempSync(join(tmpdir(), "zoo-gate-"));
  execFileSync(process.execPath, [join(ROOT, "node_modules/vite/bin/vite.js"), "build", "--outDir", out, "--emptyOutDir"],
    { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_TEST_HOOKS: hooks ? "1" : "" } });
  return out;
}
function serve(dir, port){
  return new Promise(res => {
    const s = createServer((req, r) => {
      const p = decodeURIComponent(req.url.split("?")[0]);
      let f = join(dir, p);
      if (p === "/" || !existsSync(f)) f = join(dir, "index.html");
      try { r.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" }); r.end(readFileSync(f)); }
      catch(e){ r.writeHead(404); r.end("no"); }
    });
    s.listen(port, "127.0.0.1", () => res(s));
  });
}
const browser = await pup.launch({ executablePath: found.path, args: [...found.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true });
/* **진짜 웹판 주소로 띄운다** — 막는 건 Vercel 주소일 때뿐이라(안전장치) 127.0.0.1 로 띄우면 안 막힌다.
   브라우저가 그 주소로 가는 요청을 가로채 빌드한 웹판 내용으로 답한다 */
const WEBHOST = "http://zoo-app-weld.vercel.app";
const look = async (port, { asApp = false, lang = "ko", base = WEBHOST } = {}) => {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 412, height: 745, isMobile: true, hasTouch: true });
  await page.setRequestInterception(true);
  const outside = [];
  page.on("request", async r => {
    const u = new URL(r.url());
    if (/vercel\.app$/.test(u.hostname)){
      try {
        const res = await fetch(`http://127.0.0.1:${port}${u.pathname}${u.search}`);
        const body = Buffer.from(await res.arrayBuffer());
        await r.respond({ status: res.status, headers: { "content-type": res.headers.get("content-type") || "text/html" }, body });
      } catch(e){ r.abort().catch(() => {}); }
      return;
    }
    const s = r.url();
    if (!s.startsWith(`http://127.0.0.1:${port}`) && !s.startsWith(`http://localhost:${port}`) && !s.startsWith("data:")) outside.push(s);
    r.continue().catch(() => {});
  });
  await page.evaluateOnNewDocument((app, l) => {
    try { localStorage.setItem("zk_lang", l); } catch(e){}
    if (app) window.Capacitor = { isNativePlatform: () => true, getPlatform: () => "android", Plugins: {} };
  }, asApp, lang);
  await page.goto(`${base === WEBHOST ? WEBHOST : base}/`, { waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
  await nap(1200);
  const r = await page.evaluate(() => ({
    gate: !!document.querySelector(".web-only"),
    stage: !!document.getElementById("stage"),
    entry: (document.getElementById("entry")?.innerHTML || "").length,
    txt: document.querySelector(".web-only")?.innerText || "",
    store: document.querySelector(".web-only .wo-go")?.href || "",
  }));
  await ctx.close();
  return { ...r, outside };
};

let rel = null, hook = null, s1 = null, s2 = null;
try {
  console.log("\n① 배포판을 웹으로 열면");
  rel = build(false);
  s1 = await serve(rel, 5961);
  for (const lang of ["ko", "en"]){
    const r = await look(5961, { lang });
    check(`${lang}: "앱에서만" 화면만 뜬다 (게임 화면 없음)`, r.gate && !r.stage);
    check(`${lang}: 안내 문구`, lang === "ko" ? /앱에서만/.test(r.txt) : /app only/i.test(r.txt), r.txt.replace(/\s+/g, " ").slice(0, 50));
    check(`${lang}: 구글 플레이로 간다`, /details\?id=com\.wonkyu\.zoopresident/.test(r.store));
    check(`${lang}: 바깥으로 나가는 요청이 없다 (로그인·서버 접속 안 함)`, r.outside.length === 0, r.outside.slice(0, 2).join(" "));
  }

  console.log("\n② 같은 배포판을 앱처럼 열면");
  {
    const r = await look(5961, { asApp: true });
    check("게임이 뜬다 (첫 화면이 그려진다)", !r.gate && r.stage && r.entry > 0, `첫 화면 ${r.entry}자`);
  }

  /* [stated] 안전장치 (2026-10-21 "걸어놔 그럼") — 웹판 주소가 아니면 앱 표시가 없어도 안 막는다.
     앱 안의 주소는 localhost 다. 앱 표시를 못 읽는 일이 생겨도 앱이 "앱에서만" 에 갇히지 않는다 */
  console.log("\n②-2 안전장치: 앱 표시가 없어도 웹판 주소가 아니면 안 막는다");
  for (const base of ["http://localhost:5961", "http://127.0.0.1:5961"]){
    const r = await look(5961, { base });
    check(`${base.replace(/:\d+$/, "")}: 게임이 뜬다`, !r.gate && r.stage && r.entry > 0);
  }

  console.log("\n③ 안내 페이지는 그대로");
  for (const f of ["privacy.html", "terms.html", "delete.html", "app-ads.txt"]){
    if (!existsSync(join(ROOT, "public", f))) continue;
    const res = await fetch(`http://127.0.0.1:5961/${f}`);
    const body = await res.text();
    check(`${f} 가 열린다`, res.ok && !/web-only/.test(body) && body.length > 20);
  }

  console.log("\n④ 검사용 빌드는 막지 않는다");
  hook = build(true);
  s2 = await serve(hook, 5962);
  {
    const r = await look(5962);
    check("검사용 빌드: 게임이 뜬다", !r.gate && r.stage && r.entry > 0);
  }
} catch(e){
  check("검사 도중 오류", false, String(e && e.message || e));
} finally {
  try { await browser.close(); } catch(e){}
  for (const s of [s1, s2]) try { s && s.close(); } catch(e){}
  for (const d of [rel, hook]) try { d && rmSync(d, { recursive: true, force: true }); } catch(e){}
}
console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
