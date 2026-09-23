/* 출시용 서명 키를 안드로이드 빌드 설정에 물린다.

   스토어에 올리는 앱은 **내 키로 서명**돼 있어야 한다. 기본값은 디버그 키라
   그대로는 못 올린다.

   비밀번호는 `android/keystore.properties` 에 적어 두고 여기서 읽는다.
   그 파일과 키 파일(`.jks`)은 **깃에 안 올라간다** — 올라가면 남이 내 앱인 척
   만들 수 있다.

   이 설정도 `npx cap add android` 를 다시 하면 사라지므로, 손으로 고치지 않고
   `npm run sync` 때마다 여기서 넣는다.

   혼자 돌려도 된다:  node scripts/android-signing.mjs   */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MARK = "// zoo: 출시 서명";

const HEAD = `${MARK}
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

`;

const SIGNING = `    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
`;

export function patchGradle(text){
  if (text.includes(MARK)) return { text, changed: false, how: "이미 되어 있음" };
  let out = HEAD + text;

  /* android { 바로 뒤에 서명 설정을 끼운다 */
  const at = out.indexOf("android {");
  if (at < 0) return { text, changed: false, how: "android 블록을 못 찾음" };
  const nl = out.indexOf("\n", at) + 1;
  out = out.slice(0, nl) + SIGNING + out.slice(nl);

  /* release 빌드가 그 키를 쓰게 한다 */
  const rel = out.indexOf("release {", out.indexOf("buildTypes {"));
  if (rel < 0) return { text, changed: false, how: "release 블록을 못 찾음" };
  const rnl = out.indexOf("\n", rel) + 1;
  out = out.slice(0, rnl) +
    "            if (keystorePropertiesFile.exists()) signingConfig signingConfigs.release\n" +
    out.slice(rnl);

  return { text: out, changed: true, how: "넣음" };
}

if (process.argv[1] && process.argv[1].endsWith("android-signing.mjs")){
  const gradle = join(ROOT, "android", "app", "build.gradle");
  if (!existsSync(gradle)){
    console.log("[서명] 안드로이드 폴더가 아직 없습니다 — 건너뜁니다");
    process.exit(0);
  }
  const r = patchGradle(readFileSync(gradle, "utf8"));
  if (r.changed) writeFileSync(gradle, r.text);
  const props = join(ROOT, "android", "keystore.properties");
  const have = existsSync(props);
  console.log("[서명] 빌드 설정 — " + r.how +
    (have ? " · 키 정보 있음(출시용으로 서명됩니다)"
          : " · keystore.properties 가 없어 디버그 키로 만들어집니다"));
}
