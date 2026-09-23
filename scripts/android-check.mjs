/* 안드로이드 쪽 파이어베이스 설정이 **구글 로그인에 쓸 수 있는 것인지** 본다.

   구글 로그인이 앱에서 안 되는 이유는 거의 이 셋이다. 하나씩 눈으로 확인하려면
   왕복이 길어져서, `npm run sync` 때 자동으로 본다.

     1. `android/app/google-services.json` 이 없다
        → 파이어베이스 콘솔에서 안드로이드 앱을 등록하고 받아야 한다
     2. 그 파일의 패키지 이름이 우리 앱과 다르다
        → 다른 앱 것을 받은 것이다. 로그인 창이 뜨지도 않는다
     3. 파일에 **웹 클라이언트(client_type 3)** 가 없다
        → 파이어베이스 Authentication 에서 구글 로그인을 켜기 **전에** 받은 파일이다.
          이 값이 없으면 빌드가 `default_web_client_id` 를 못 찾아 터진다

   혼자 돌려도 된다:  node scripts/android-check.mjs   */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/* 설정 글과 우리 앱 이름을 받아 문제를 적어 돌려준다 */
export function checkServices(json, appId){
  const out = [];
  let d = null;
  try { d = JSON.parse(json); } catch (e){ return ["google-services.json 을 읽을 수 없습니다 (파일이 깨졌습니다)"]; }
  const clients = (d && d.client) || [];
  const mine = clients.find(c =>
    c && c.client_info && c.client_info.android_client_info &&
    c.client_info.android_client_info.package_name === appId);
  if (!mine){
    const names = clients
      .map(c => c && c.client_info && c.client_info.android_client_info &&
                c.client_info.android_client_info.package_name)
      .filter(Boolean);
    out.push("이 파일에는 우리 앱(" + appId + ") 이 없습니다" +
             (names.length ? " — 들어 있는 것: " + names.join(", ") : ""));
    return out;
  }
  const web = (mine.oauth_client || []).some(o => Number(o && o.client_type) === 3);
  if (!web)
    out.push("구글 로그인용 웹 클라이언트가 없습니다 — 파이어베이스에서 구글 로그인을 켠 뒤 " +
             "google-services.json 을 다시 받아 덮어쓰세요");
  const sha = (mine.oauth_client || []).some(o => Number(o && o.client_type) === 1);
  if (!sha)
    out.push("SHA-1 지문이 안 들어 있습니다 — 콘솔에서 지문을 넣은 뒤 파일을 다시 받으세요");
  return out;
}

if (process.argv[1] && process.argv[1].endsWith("android-check.mjs")){
  const mf = join(ROOT, "android", "app", "google-services.json");
  if (!existsSync(join(ROOT, "android"))){
    console.log("[안드로이드 점검] 안드로이드 폴더가 없어 건너뜁니다");
    process.exit(0);
  }
  let appId = "";
  try { appId = JSON.parse(readFileSync(join(ROOT, "capacitor.config.json"), "utf8")).appId || ""; } catch(e){}
  if (!existsSync(mf)){
    console.log("\n[안드로이드 점검] google-services.json 이 없습니다");
    console.log("  파이어베이스 콘솔 → 프로젝트 설정 → 내 앱 → 안드로이드 앱(" + appId + ") → 파일 받기");
    console.log("  받은 파일을 android/app/ 에 넣으세요\n");
    process.exit(1);
  }
  const bad = checkServices(readFileSync(mf, "utf8"), appId);
  if (bad.length){
    console.log("\n[안드로이드 점검] 구글 로그인이 안 될 설정입니다\n");
    for (const b of bad) console.log("  - " + b);
    console.log("");
    process.exit(1);
  }
  console.log("[안드로이드 점검] 이상 없습니다 (구글 로그인 설정 확인됨)");
}
