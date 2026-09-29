/* 별명 규칙 검사 — 한글 6자 / 영문·숫자 8자, 섞으면 그 사이 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"),
  join(HERE, "_entry_name.js"), "--bundle", "--format=esm", "--platform=browser",
  "--loader:.css=empty",
  /* 이 검사는 브라우저 없이 묶어 돌린다. `import.meta.env` 가 없어서
     그대로 두면 빌드 깃발을 읽다가 터진다 — 검사용 값으로 채워 준다 */
  "--define:import.meta.env.VITE_TEST_HOOKS=\"1\"", "--outfile=" + join(HERE, "_bundle_name.mjs"), "--log-level=warning",
  "--define:import.meta.env=globalThis.__ENV__",
], { cwd: ROOT, stdio: "inherit" });
/* 별명 규칙 검사 */
globalThis.__ENV__ = {};
const { checkName, nameCost, NAME_MAX, BOT_KO, BOT_EN, BOT_COUNT, botLabel } = await import("./_bundle_name.mjs");
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

/* ---------- 봇 이름 ----------
   **사람이 못 쓰는 이름을 봇이 쓰면 그 자체가 표식이 된다.** 목록 전체가
   별명 규칙을 통과해야 한다.
   그리고 **깔끔한 명사 한 단어만 잔뜩 있으면 한 방에 모였을 때 티가 난다** —
   예전 목록이 72% 가 그랬고 신고를 받았다(2026-09-28). 절반을 넘지 않게 묶어 둔다 */
const badKo = BOT_KO.filter(n => !checkName(n).ok);
const badEn = BOT_EN.filter(n => !checkName(n).ok);
c("봇 이름이 전부 별명 규칙을 통과한다", !badKo.length && !badEn.length,
  JSON.stringify(badKo.concat(badEn).slice(0, 5)));
c("두 목록의 길이가 같다", BOT_KO.length === BOT_EN.length && BOT_COUNT === BOT_KO.length,
  BOT_KO.length + " / " + BOT_EN.length);
c("목록이 300개다", BOT_COUNT === 300, String(BOT_COUNT));
c("같은 이름이 두 번 없다",
  new Set(BOT_KO).size === BOT_KO.length && new Set(BOT_EN).size === BOT_EN.length,
  (BOT_KO.length - new Set(BOT_KO).size) + " / " + (BOT_EN.length - new Set(BOT_EN).size));
/* "짧은 순한글 한 덩어리"(감자탕·백합·국밥 같은 꼴). 이게 많을수록 봇 티가 난다.
   예전 목록은 66% 였다 — 이 검사는 그 목록을 잡는다. 지금은 38% */
const plainKo = BOT_KO.filter(n => /^[\uAC00-\uD7A3]{2,3}$/.test(n)).length;
c("**짧은 순한글 한 덩어리가 45%를 안 넘는다**", plainKo <= BOT_KO.length * 0.45,
  plainKo + "개 (" + Math.round(plainKo / BOT_KO.length * 100) + "%)");
const digKo = BOT_KO.filter(n => /[0-9]/.test(n)).length;
c("**숫자가 든 이름이 4분의 1은 된다 (한글)**", digKo >= BOT_KO.length * 0.25,
  digKo + "개 (" + Math.round(digKo / BOT_KO.length * 100) + "%)");
const digEn = BOT_EN.filter(n => /[0-9]/.test(n)).length;
c("**숫자가 든 이름이 4분의 1은 된다 (영문)**", digEn >= BOT_EN.length * 0.25,
  digEn + "개 (" + Math.round(digEn / BOT_EN.length * 100) + "%)");
c("번호로 이름을 꺼낸다", botLabel(0, "ko") === BOT_KO[0] && botLabel(299, "en") === BOT_EN[299]
  && botLabel(300, "ko") === BOT_KO[0]);
console.log("\n=== 통과 "+ok+" / 실패 "+bad+" ===\n");
process.exit(bad?1:0);
