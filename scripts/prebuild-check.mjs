/* 앱에 넣기 전, **망가진 APK 가 나가지 않게** 막는다.

   `npm run sync` 가 이걸 먼저 돌린다. 하나라도 어긋나면 거기서 멈춘다.

   실제로 겪은 두 가지:
     1. `npm test` 를 돌리면 `dist` 가 **검사용 빌드**로 바뀐다. 그대로 앱에 넣으면
        개발자도구로 광고를 건너뛸 수 있는 통로가 들어간 채 나간다.
     2. `.env` 의 `VITE_GAME_SERVER` 가 비어 있으면 **온라인 대전이 아예 안 되는**
        앱이 나온다. 값은 빌드하는 순간 코드에 박히므로, 나중에 고치려면 다시 빌드해야 한다.

   혼자 돌려도 된다:  node scripts/prebuild-check.mjs   */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, "dist");

/* 검사용 통로 흔적. 배포판 빌드에는 하나도 없어야 한다 */
export const HOOK_MARKS = ["__taxProbe", "__adTest", "__adInterTest", "__watchAd", "__ZOO_TEST"];

export function checkBundle(js){
  return HOOK_MARKS.filter(k => js.includes(k));
}
export function checkEnv(text){
  const out = [];
  const get = name => {
    for (const line of String(text || "").split(/\r?\n/)){
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && m[1] === name) return m[2].trim().replace(/^["']|["']$/g, "");
    }
    return "";
  };
  if (!get("VITE_GAME_SERVER")) out.push("VITE_GAME_SERVER 가 비어 있습니다 — 온라인 대전이 안 됩니다");
  if (!get("VITE_FB_API_KEY")) out.push("VITE_FB_API_KEY 가 비어 있습니다 — 로그인·랭킹이 안 됩니다");
  return out;
}

if (process.argv[1] && process.argv[1].endsWith("prebuild-check.mjs")){
  const bad = [];

  let envText = "";
  try { envText = readFileSync(join(ROOT, ".env"), "utf8"); } catch(e){ bad.push(".env 파일이 없습니다"); }
  bad.push(...checkEnv(envText));

  if (!existsSync(join(DIST, "assets"))) bad.push("dist 가 없습니다 — npm run build 부터");
  else {
    const js = readdirSync(join(DIST, "assets")).filter(f => f.endsWith(".js"))
      .map(f => readFileSync(join(DIST, "assets", f), "utf8")).join("");
    const holes = checkBundle(js);
    if (holes.length)
      bad.push("dist 가 **검사용 빌드**입니다(" + holes.join(", ") + ") — npm run build 로 다시 만드세요");
  }

  if (bad.length){
    console.log("\n[빌드 전 점검] 이대로는 앱을 만들면 안 됩니다\n");
    for (const b of bad) console.log("  - " + b);
    console.log("");
    process.exit(1);
  }
  console.log("[빌드 전 점검] 이상 없습니다");
}
