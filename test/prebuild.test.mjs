/* 빌드 전 점검이 **망가진 APK 를 정말 막는가**.

   실제로 겪었다 — 검사용 빌드가 그대로 앱에 들어갔고, 서버 주소가 빈 채로
   앱이 만들어졌다. 사람이 기억해야 하는 절차는 반드시 틀린다.

   쓰는 법:  node test/prebuild.test.mjs   */
import { checkBundle, checkEnv, HOOK_MARKS } from "../scripts/prebuild-check.mjs";
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};

check("검사용 통로가 있으면 잡는다",
      checkBundle("var a=1;window.__taxProbe={};").length > 0);
check("배포판 묶음은 통과시킨다",
      checkBundle("var a=1;function play(){}").length === 0);
check("찾는 흔적이 빠짐없이 들어 있다",
      ["__taxProbe","__adTest","__adInterTest","__watchAd","__ZOO_TEST"].every(k => HOOK_MARKS.includes(k)),
      HOOK_MARKS.join(", "));

check("서버 주소가 비면 잡는다",
      checkEnv("VITE_GAME_SERVER=\nVITE_FB_API_KEY=abc\n").some(m => /GAME_SERVER/.test(m)));
check("서버 줄이 아예 없어도 잡는다",
      checkEnv("VITE_FB_API_KEY=abc\n").some(m => /GAME_SERVER/.test(m)));
check("로그인 열쇠가 비면 잡는다",
      checkEnv("VITE_GAME_SERVER=https://x\nVITE_FB_API_KEY=\n").some(m => /FB_API_KEY/.test(m)));
check("다 차 있으면 통과시킨다",
      checkEnv("VITE_GAME_SERVER=https://x\nVITE_FB_API_KEY=abc\n").length === 0);
check("따옴표가 있어도 읽는다",
      checkEnv('VITE_GAME_SERVER="https://x"\nVITE_FB_API_KEY=abc\n').length === 0);

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
