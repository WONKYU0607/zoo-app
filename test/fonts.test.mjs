/* **글꼴이 앱 안에서 나오는가.**

   예전에는 구글 서버에서 받아 왔다. 인터넷이 느리거나 끊기면 글꼴이 늦게 뜨거나
   다른 글꼴로 보인다. 앱은 지하철·비행기 모드에서도 돌아야 한다.

   바깥으로 나가는 요청이 하나도 없어야 하고, 글꼴이 실제로 쓰여야 한다.
   쓰는 법:  node test/fonts.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5951);
const { browser, page } = await open({ srv });
/* 바깥으로 나가는 요청을 모두 적어 둔다 */
const outside = [];
page.on("request", r => {
  const u = r.url();
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(u) && !u.startsWith("data:")) outside.push(u);
});
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("zk_lang", "ko"); } catch(e){} });
await page.reload({ waitUntil: "networkidle0" });
await page.evaluate(() => window.__goto && window.__goto("lobby"));
await nap(1200);

const fontReqs = outside.filter(u => /font|gstatic|googleapis/.test(u));
check("글꼴을 바깥에서 받아오지 않는다", fontReqs.length === 0, fontReqs.slice(0, 2).join(" "));
check("바깥으로 나가는 요청이 없다", outside.length === 0, outside.slice(0, 3).join(" "));

/* 글꼴이 진짜 쓰이는가 — 브라우저가 읽어 들인 목록으로 본다 */
const loaded = await page.evaluate(async () => {
  await document.fonts.ready;
  const names = new Set();
  document.fonts.forEach(f => { if (f.status === "loaded") names.add(f.family); });
  return [...names];
});
for (const want of ["Noto Serif KR", "Gowun Batang"]){
  check("'" + want + "' 이 읽혔다", loaded.includes(want), loaded.join(" / ") || "없음");
}

/* ---- 검사용 통로가 배포판에서는 닫혀 있는가 ----
   `__adTest`(광고 흉내), `__taxProbe`(세금 화면 조작), `signInTest`(검사용 로그인) 은
   검사일 때만 열려야 한다. 열어 두면 개발자도구로 광고를 건너뛸 수 있다.
   **이 페이지는 깃발 없이** 연다 — 배포판과 같은 상태 */
{
  const plain = await browser.newPage();
  await plain.goto("http://127.0.0.1:" + (srv.__port || 5951) + "/", { waitUntil: "networkidle0" });
  await nap(800);
  const holes = await plain.evaluate(() => ({
    taxProbe: typeof window.__taxProbe,
    signInTest: typeof window.signInTest,
    watchAd: typeof window.__watchAd,
    isTest: Boolean(globalThis.__ZOO_TEST),
  }));
  check("배포판에는 검사 깃발이 없다", holes.isTest === false, JSON.stringify(holes));
  /* 이 검사는 **검사용 빌드**를 본다. 깃발만 없앤 상태라 통로는 남아 있을 수 있다.
     배포판(`npm run build`)에는 코드째 없다 — 아래에서 따로 확인한다 */
  check("깃발이 없으면 통로가 안 열린다",
        holes.taxProbe === "undefined" && holes.signInTest === "undefined" && holes.watchAd === "undefined",
        JSON.stringify(holes));
  await plain.close();
}

/* ---- **배포판 빌드에는 통로가 코드째 없는가** ----
   검사는 `VITE_TEST_HOOKS=1` 을 주고 빌드하지만, `npm run build` 에는 그 값이 없어
   그 자리를 감싼 코드가 통째로 사라져야 한다. 진짜로 빌드해 보고 글자를 찾는다 */
{
  const { execFileSync } = await import("node:child_process");
  const { readdirSync, readFileSync, mkdtempSync, rmSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const { tmpdir } = await import("node:os");
  const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
  const out = mkdtempSync(join(tmpdir(), "zoo-rel-"));
  try {
    execFileSync(process.execPath,
      [join(ROOT, "node_modules/vite/bin/vite.js"), "build", "--outDir", out, "--emptyOutDir"],
      { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_TEST_HOOKS: "" } });
    const js = readdirSync(join(out, "assets")).filter(f => f.endsWith(".js"))
      .map(f => readFileSync(join(out, "assets", f), "utf8")).join("");
    const holes = ["__taxProbe", "__adTest", "__adInterTest", "__watchAd", "signInTest", "__ZOO_TEST"]
      .filter(k => js.includes(k));
    check("배포판 빌드에는 검사용 통로가 아예 없다", holes.length === 0, holes.join(", ") || "깨끗함");
  } catch (e){
    check("배포판 빌드에는 검사용 통로가 아예 없다", false, "빌드 실패: " + (e && e.message || e));
  } finally { try { rmSync(out, { recursive: true, force: true }); } catch(e){} }
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
