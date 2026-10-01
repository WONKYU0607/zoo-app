/* 보상형 광고에 **내 계정 번호(uid)를 실어 보내는가** — 서버 측 확인(SSV).

   광고를 끝까지 보면 AdMob 이 게임 서버로 "누가 봤는지(user_id)" 를 알려 오고,
   서버가 그 계정에 티켓을 준다. 앱이 광고를 준비할 때 ssv.userId 를 안 실으면
   서버가 누구에게 줄지 몰라 **티켓이 영영 안 들어온다.**
   진짜 광고는 안드로이드에서만 나오므로 AdMob 플러그인을 가짜로 바꿔 끼워 본다.

   쓰는 법:  node test/adssv.test.mjs */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};

const FAKE = join(HERE, "_fake_admob.js");
writeFileSync(FAKE, `/* AdMob 플러그인 흉내 — 준비할 때 받은 값을 적어 두고, 보여 주면 끝까지 본 것으로 한다 */
const subs = {};
export const RewardAdPluginEvents = { Rewarded: "r", Dismissed: "d", FailedToShow: "f" };
export const InterstitialAdPluginEvents = { Dismissed: "id", FailedToShow: "if" };
export const AdMob = {
  async initialize(){},
  async prepareRewardVideoAd(o){ (globalThis.__prep = globalThis.__prep || []).push(JSON.parse(JSON.stringify(o))); },
  async addListener(ev, fn){ subs[ev] = fn; return { remove(){ delete subs[ev]; } }; },
  async showRewardVideoAd(){ setTimeout(() => { subs.r && subs.r(); subs.d && subs.d(); }, 20); },
};
`);
const esbuild = await import(pathToFileURL(join(ROOT, "node_modules/esbuild/lib/main.js")).href);
const OUT = join(HERE, "_bundle_adssv.mjs");
await (esbuild.default || esbuild).build({
  entryPoints: [join(ROOT, "src/lib/ads.js")], bundle: true, format: "esm", platform: "node",
  outfile: OUT, logLevel: "warning",
  define: { "import.meta.env": "globalThis.__ENV__" },
  plugins: [{ name: "fake-admob", setup(b){
    b.onResolve({ filter: /^@capacitor-community\/admob$/ }, () => ({ path: FAKE }));
  } }],
});
globalThis.__ENV__ = {};
globalThis.window = { Capacitor: { isNativePlatform: () => true } };
const ads = await import(pathToFileURL(OUT).href);

const r = await ads.showRewardAd("uid-abc123");
const p = (globalThis.__prep || [])[0] || {};
check("끝까지 보면 ok", r && r.ok === true, JSON.stringify(r));
check("광고를 준비할 때 계정 번호를 ssv.userId 로 싣는다", p.ssv && p.ssv.userId === "uid-abc123", JSON.stringify(p));
check("광고 단위 번호도 그대로", typeof p.adId === "string" && p.adId.startsWith("ca-app-pub-"), p.adId);
globalThis.__prep = [];
await ads.showRewardAd("");
check("계정 번호가 없으면 ssv 를 안 싣는다 (빈 값을 보내지 않는다)", globalThis.__prep[0] && !globalThis.__prep[0].ssv,
  JSON.stringify(globalThis.__prep[0]));

/* ---------- 미리 불러오기 (2026-10-01) ----------
   단추를 누른 그때 받아 오면 약 1초 늦게 뜬다. 로비에서 미리 받아 두면 누르자마자 뜬다 */
globalThis.__prep = [];
await ads.preloadRewardAd("uid-pre");
check("미리 받아 둘 때 계정 번호를 싣는다", globalThis.__prep.length === 1 && globalThis.__prep[0].ssv && globalThis.__prep[0].ssv.userId === "uid-pre",
  JSON.stringify(globalThis.__prep));
await ads.preloadRewardAd("uid-pre");
check("이미 받아 둔 게 있으면 또 받지 않는다", globalThis.__prep.length === 1, String(globalThis.__prep.length));
const r2 = await ads.showRewardAd("uid-pre");
check("누르면 받아 둔 것을 바로 보여 준다 (새로 받지 않는다)", r2.ok && globalThis.__prep.length === 1, String(globalThis.__prep.length));
await ads.showRewardAd("uid-pre");
check("한 번 보여 준 것은 다 쓴 것 — 다음엔 새로 받는다", globalThis.__prep.length === 2, String(globalThis.__prep.length));
globalThis.__prep = [];
await ads.preloadRewardAd("uid-old");
await ads.showRewardAd("uid-new");
check("계정이 바뀌었으면 받아 둔 것을 안 쓰고 새 계정 번호로 다시 받는다",
  globalThis.__prep.length === 2 && globalThis.__prep[1].ssv.userId === "uid-new", JSON.stringify(globalThis.__prep.map(x => x.ssv && x.ssv.userId)));

console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
