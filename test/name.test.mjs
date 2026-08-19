/* 별명 규칙 검사 — 한글 6자 / 영문·숫자 8자, 섞으면 그 사이 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"),
  join(HERE, "_entry_name.js"), "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty", "--outfile=" + join(HERE, "_bundle_name.mjs"), "--log-level=warning",
  "--define:import.meta.env=globalThis.__ENV__",
], { cwd: ROOT, stdio: "inherit" });
/* 별명 규칙 검사 */
globalThis.__ENV__ = {};
const { checkName, nameCost, NAME_MAX } = await import("./_bundle_name.mjs");
let ok=0, bad=0;
const c=(n,v,note)=>{ if(v){ok++;console.log("  [OK]   "+n+(note?"  "+note:""));} else {bad++;console.log("  [실패] "+n+(note?"  "+note:""));} };
c("한글 6자 통과", checkName("가나다라마바").ok, "가나다라마바 = " + nameCost("가나다라마바").toFixed(2));
c("한글 7자 거부", checkName("가나다라마바사").why === "long");
c("영문 8자 통과", checkName("abcdefgh").ok);
c("영문 9자 거부", checkName("abcdefghi").why === "long");
c("숫자 포함 통과", checkName("게임왕123").ok, "게임왕123 = " + nameCost("게임왕123").toFixed(2));
c("한글3+영문4 통과", checkName("고양이abcd").ok, nameCost("고양이abcd").toFixed(2));
c("한글4+영문4 거부", checkName("고양이들abcd").why === "long", nameCost("고양이들abcd").toFixed(2));
c("띄어쓰기 거부", checkName("가 나").why === "space");
c("특수문자 거부", checkName("가나!").why === "char");
c("빈칸 거부", checkName("   ").why === "empty");
c("칸 한도", NAME_MAX === 8);
console.log("\n=== 통과 "+ok+" / 실패 "+bad+" ===\n");
process.exit(bad?1:0);
