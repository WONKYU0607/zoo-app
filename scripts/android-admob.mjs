/* 안드로이드 설정(AndroidManifest.xml)에 **AdMob 앱 번호**를 넣는다.

   광고 SDK 는 앱을 켤 때 이 번호를 찾는다. 없으면 **앱이 켜지자마자 죽는다.**
   그런데 이 파일은 `npx cap add android` 가 만들어 주는 것이라 저장소에
   미리 적어 둘 수 없고, 손으로 넣으면 다시 만들 때마다 잊는다.
   그래서 `npm run sync` 가 끝날 때 이 스크립트가 알아서 넣는다.

   번호는 `.env` 의 `VITE_AD_APP_ID` 에서 읽는다. 없으면 **구글 시험용 번호**를 쓴다
   (시험 광고만 뜨고 돈은 안 된다. 진짜 번호는 AdMob 에서 앱을 등록하면 나온다).

   혼자 돌려도 된다:  node scripts/android-admob.mjs   */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713";   /* 구글 공식 시험용 */
const KEY = "com.google.android.gms.ads.APPLICATION_ID";

/* .env 에서 값 하나 읽기 (없으면 null) */
export function fromEnv(text, name){
  for (const line of String(text || "").split(/\r?\n/)){
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && m[1] === name){
      const v = m[2].trim().replace(/^["']|["']$/g, "");
      return v || null;
    }
  }
  return null;
}

/* 설정 글에 번호를 넣거나 고친다. 이미 같은 값이면 그대로 둔다 */
export function patchManifest(xml, appId){
  const line = `        <meta-data android:name="${KEY}" android:value="${appId}" />`;
  if (xml.includes(KEY)){
    /* 이미 있으면 **값만** 갈아 끼운다. 줄 모양을 그대로 두어야
       같은 번호일 때 "고쳤다" 고 헛말하지 않는다 */
    const re = new RegExp(`(<meta-data[^>]*android:name="${KEY}"[^>]*android:value=")[^"]*(")`);
    const next = xml.replace(re, `$1${appId}$2`);
    return { xml: next, changed: next !== xml, how: next !== xml ? "고침" : "이미 맞음" };
  }
  /* </application> 바로 앞에 넣는다 */
  const at = xml.lastIndexOf("</application>");
  if (at < 0) return { xml, changed: false, how: "자리를 못 찾음" };
  return {
    xml: xml.slice(0, at) + line + "\n    " + xml.slice(at),
    changed: true, how: "넣음",
  };
}

/* 직접 실행했을 때만 파일을 건드린다 */
if (process.argv[1] && process.argv[1].endsWith("android-admob.mjs")){
  const mf = join(ROOT, "android", "app", "src", "main", "AndroidManifest.xml");
  if (!existsSync(mf)){
    console.log("[admob] 안드로이드 폴더가 아직 없습니다 — 건너뜁니다 (npx cap add android 먼저)");
    process.exit(0);
  }
  let envText = "";
  try { envText = readFileSync(join(ROOT, ".env"), "utf8"); } catch(e){}
  const appId = fromEnv(envText, "VITE_AD_APP_ID") || TEST_APP_ID;
  const r = patchManifest(readFileSync(mf, "utf8"), appId);
  if (r.changed) writeFileSync(mf, r.xml);
  console.log("[admob] 앱 번호 " + appId + " — " + r.how +
    (appId === TEST_APP_ID ? "  (시험용 번호입니다. 출시 전에 .env 의 VITE_AD_APP_ID 를 진짜 번호로)" : ""));
}
