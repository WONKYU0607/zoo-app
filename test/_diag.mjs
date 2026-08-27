/* "Failed to fetch" 의 진짜 이유를 찍는 도구.

   브라우저가 던지는 그 말만으로는 **어디에 못 붙었는지** 알 수 없다.
   실패한 요청 주소, 실패 사유, 콘솔에 찍힌 것을 전부 그대로 보여 준다.

   쓰는 법:  node test/_diag.mjs        */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("\n=== 1. 설정 파일 ===");
for (const f of [".env", ".env.example"]){
  const p = join(ROOT, f);
  console.log("  " + f + " : " + (existsSync(p) ? "있음" : "**없음**"));
}
if (existsSync(join(ROOT, ".env"))){
  readFileSync(join(ROOT, ".env"), "utf8").split(/\r?\n/).forEach(l => {
    const k = l.split("=")[0];
    if (!k || l.startsWith("#")) return;
    const v = l.slice(k.length + 1);
    /* 열쇠 값은 안 찍는다 — 있는지 없는지만 */
    console.log("  " + k + " = " + (k.includes("SERVER") || k.includes("DOMAIN") || k.includes("PROJECT")
      ? v : (v ? "(값 있음, " + v.length + "자)" : "**비어 있음**")));
  });
}

console.log("\n=== 2. dist ===");
const dist = join(ROOT, "dist");
console.log("  dist 폴더 : " + (existsSync(dist) ? "있음" : "**없음**"));
if (existsSync(join(dist, "assets"))){
  const js = readdirSync(join(dist, "assets")).filter(f => f.endsWith(".js"));
  console.log("  묶음 파일 : " + js.join(", "));
  const body = js.map(f => readFileSync(join(dist, "assets", f), "utf8")).join("");
  console.log("  fly 주소가 들어 있나 : " + (body.includes("fly.dev") ? "예" : "아니오"));
}

console.log("\n=== 3. 브라우저 ===");
const br = await findBrowser();
console.log("  찾은 크롬 : " + (br ? (typeof br === "string" ? br : JSON.stringify(br)) : "**못 찾음**"));
if (!br) process.exit(0);

ensureBuild();
const srv = await serve(5901);
const { browser, page } = await open({ srv });

const fails = [];
page.on("requestfailed", r => fails.push(r.url() + "  ← " + (r.failure() && r.failure().errorText)));
page.on("console", m => console.log("  [콘솔 " + m.type() + "] " + m.text()));
page.on("pageerror", e => console.log("  [페이지 오류] " + e.message));

await page.reload({ waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 1500));

console.log("\n=== 4. 페이지 안에서 직접 붙어 보기 ===");
const targets = [
  "http://127.0.0.1:8000/zoo/health",
  "http://localhost:8000/zoo/health",
  "https://zoo-president.fly.dev/zoo/health",
  "https://www.googleapis.com/generate_204",
];
for (const url of targets){
  const r = await page.evaluate(async (u) => {
    try { const res = await fetch(u); return "ok " + res.status; }
    catch (e){ return "실패 — " + e.name + ": " + e.message; }
  }, url);
  console.log("  " + url + "\n      → " + r);
}

console.log("\n=== 5. 앱이 보는 서버 주소 ===");
console.log("  " + await page.evaluate(() => {
  try { return JSON.stringify({
    online: typeof window.__eng !== "undefined",
    zooServer: (globalThis.__ZOO_SERVER === undefined ? "(안 정해짐)" : globalThis.__ZOO_SERVER),
  }); } catch(e){ return "읽기 실패: " + e.message; }
}));

console.log("\n=== 6. 실패한 요청 ===");
console.log(fails.length ? fails.map(x => "  " + x).join("\n") : "  없음");

console.log("");
shut(srv, browser);
