/* 안드로이드 설정에 AdMob 앱 번호를 제대로 넣는가.

   광고 SDK 는 앱을 켤 때 이 번호를 찾는다. **없으면 앱이 켜지자마자 죽는다.**
   `npx cap add android` 를 다시 하면 설정 파일이 새로 만들어지므로,
   `npm run sync` 때마다 자동으로 넣어야 한다.

   쓰는 법:  node test/admob.test.mjs   */

import { patchManifest, fromEnv } from "../scripts/android-admob.mjs";

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const KEY = "com.google.android.gms.ads.APPLICATION_ID";
const base = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:label="@string/app_name">
        <activity android:name=".MainActivity" />
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`;

/* ---- 처음 넣을 때 ---- */
{
  const r = patchManifest(base, "ca-app-pub-1111~2222");
  check("없던 곳에 넣는다", r.changed && r.xml.includes(KEY), r.how);
  check("번호가 들어갔다", r.xml.includes('android:value="ca-app-pub-1111~2222"'));
  check("application 안에 들어간다",
        r.xml.indexOf(KEY) < r.xml.lastIndexOf("</application>") &&
        r.xml.indexOf(KEY) > r.xml.indexOf("<application"));
  check("원래 있던 것은 그대로", r.xml.includes(".MainActivity") && r.xml.includes("INTERNET"));
}

/* ---- 이미 있을 때 — 두 번 생기면 안 된다 ---- */
{
  const once = patchManifest(base, "ca-app-pub-1111~2222").xml;
  const twice = patchManifest(once, "ca-app-pub-1111~2222");
  const n = (twice.xml.match(new RegExp(KEY, "g")) || []).length;
  check("다시 돌려도 하나만 남는다", n === 1, n + "개");
  check("같은 값이면 안 건드린다", twice.changed === false || twice.xml === once, twice.how);
}

/* ---- 번호가 바뀌었을 때 (시험용 → 진짜) ---- */
{
  const once = patchManifest(base, "ca-app-pub-3940256099942544~3347511713").xml;
  const real = patchManifest(once, "ca-app-pub-9999~8888");
  const n = (real.xml.match(new RegExp(KEY, "g")) || []).length;
  check("진짜 번호로 갈아 끼운다", real.xml.includes("ca-app-pub-9999~8888") && n === 1, n + "개");
  check("옛 번호가 남지 않는다", !real.xml.includes("3940256099942544~3347511713"));
}

/* ---- .env 읽기 ---- */
{
  const env = 'VITE_FB_API_KEY=abc\nVITE_AD_APP_ID=ca-app-pub-7777~6666\n# 주석\nVITE_GAME_SERVER=https://x\n';
  check(".env 에서 번호를 읽는다", fromEnv(env, "VITE_AD_APP_ID") === "ca-app-pub-7777~6666",
        String(fromEnv(env, "VITE_AD_APP_ID")));
  check("비어 있으면 없다고 한다", fromEnv("VITE_AD_APP_ID=\n", "VITE_AD_APP_ID") === null);
  check("없는 값은 없다고 한다", fromEnv(env, "VITE_AD_INTER_ID") === null);
}

/* ---- google-services.json 이 구글 로그인에 쓸 수 있는 것인가 ----
   앱에서 구글 로그인 창이 **뜨지도 않는** 일이 있었다. 원인이 이런 설정 쪽이라
   눈으로 확인하면 왕복이 길어진다 */
{
  const { checkServices } = await import("../scripts/android-check.mjs");
  const APP = "com.wonkyu.zoopresident";
  const make = (pkg, types) => JSON.stringify({
    client: [{
      client_info: { android_client_info: { package_name: pkg } },
      oauth_client: types.map(t => ({ client_type: t })),
    }],
  });

  check("제대로 된 파일은 통과시킨다", checkServices(make(APP, [1, 3]), APP).length === 0);
  check("다른 앱 파일이면 잡는다",
        checkServices(make("com.wonkyu.zooapp", [1, 3]), APP).some(m => /우리 앱/.test(m)));
  check("웹 클라이언트가 없으면 잡는다",
        checkServices(make(APP, [1]), APP).some(m => /웹 클라이언트/.test(m)));
  check("지문이 없으면 잡는다",
        checkServices(make(APP, [3]), APP).some(m => /지문/.test(m)));
  check("깨진 파일도 잡는다", checkServices("{짜부", APP).length > 0);
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
