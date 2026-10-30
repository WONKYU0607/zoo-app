/* **광고 띄우기 — 전면(나가기)·보상형(티켓)** (2026-10-26 사용자 신고 · 결정)

   "게임 끝났는데 광고 안 보고 폰 끄면 렉 걸리던데" · "60초 기다리는 건 왜 기다리는 거야"
   · "광고를 그럼 악용하는 사례도 생기지 않을까" → "ㅇㅇ"
   · "뭐가 됐든 광고에 대해서 게임이 렉이 걸리거나 오류가 생기면 최악이야. 둘 다 베스트로 고쳐 봐"

   구글 안내의 기본 틀(미리 받아 두기 · 준비 안 됐으면 기다리지 않고 넘어가기 · SDK 신호로 움직이기 · 한 번 띄운 것은 다 쓴 것)에
   신호를 잃어도 멈추지 않는 시간 제한을 얹었다(ads.js 머리말). 진짜 광고는 안드로이드에서만 나오므로 AdMob 플러그인을
   가짜로 바꿔 끼우고, 앱이 내려가고 올라오는 것은 캐패시터가 보내는 apppause / appresume 를 그대로 흉내낸다
   (광고가 앱을 덮을 때도 앱은 pause 된다). 시간은 줄여서 본다 —
     전면 받는 중 기다림 600ms(진짜 1.5초) · 보상형 900ms(8초) · 떴다는 신호 500ms(4초) · 돌아온 뒤 300ms(1.5초) · 안전장치 1500ms(60초)

   [전면]
     1. 보통: 떴다 → 앱이 덮임 → 닫음 → **닫는 즉시** 끝
     2. 미리 받아 둔 것은 누르자마자 뜬다 · **받아 둔 것이 없으면 누른 그때 새로 받지 않고 곧바로 넘어간다**
        · 받는 도중에 누르면 그것을 잠깐(1.5초까지) 기다려 쓴다 · 한 번 띄운 것은 다 쓴 것
     3. 받기 실패 → 곧바로 · 받는 게 안 끝나면 1.5초(600ms)에 넘어간다
     4. 떴다는 신호 없음 → 4초(500ms) · 5. 못 띄웠다는 신호 → 곧바로
     6. 떴는데 닫힘 신호를 잃음 → 앱이 돌아오고 1.5초(300ms)
     7. 누르고 곧바로 화면을 끔 → 꺼 둔 동안은 안 끝난다(건너뛰기 막음) → 켜고 뜨면 닫을 때까지, 끝내 안 뜨면 켠 뒤 4초
     8. 받는 중에 화면 끔 → 꺼 둔 시간은 안 센다 · 뒤에서는 안 띄우고 켜자마자 띄운다
     9. 떴는데 pause·닫힘 둘 다 없음 → 안전장치 · 10. 떠 있는 동안 또 부르면 busy
   [보상형]
    11. 끝까지 봄 → ok · 중간에 닫음 → dismissed · 닫힘 신호를 잃어도 보상 신호가 있었으면 ok
    12. 받아 둔 것이 없으면 누를 때 받는다(8초까지) — 그동안 "준비 안 됨"(rewardReady false) · 받는 게 안 끝나면 넘어간다
    13. 떴다는 신호 없음 · 못 띄움 → 단추가 잠기지 않고 곧바로/4초에 끝
    14. 누르고 곧바로 화면을 끔 → 꺼 둔 동안 안 끝나고, 켜자 뜬 광고를 끝까지 보면 ok
    15. SDK 를 미리 켜 두면(warmAds) 광고를 받을 때 다시 안 켠다 — 여러 번 불러도 한 번

   쓰는 법:  node test/interad.test.mjs */
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
const nap = ms => new Promise(r => setTimeout(r, ms));

/* 가짜 AdMob — 시나리오(globalThis.__sc)대로 움직인다. 이벤트 이름은 진짜 플러그인과 같은 꼴 */
const FAKE = join(HERE, "_fake_admob_inter.js");
writeFileSync(FAKE, `/* 광고 흉내 — interad.test 가 globalThis.__sc 로 움직임을 정한다 */
const subs = {};
export const RewardAdPluginEvents = { Showed: "rs", Rewarded: "rr", Dismissed: "rd", FailedToShow: "rf" };
export const InterstitialAdPluginEvents = { Showed: "is", Dismissed: "id", FailedToShow: "if" };
const fire = ev => { (subs[ev] || []).slice().forEach(fn => fn()); };
globalThis.__fire = fire;
const load = async sc => {
  if (sc.load === "never") return new Promise(() => {});
  if (sc.load === "fail") throw new Error("no fill");
  await new Promise(r => setTimeout(r, sc.loadMs || 30));
};
export const AdMob = {
  async initialize(){ globalThis.__initN = (globalThis.__initN || 0) + 1; await new Promise(r => setTimeout(r, 20)); },
  async addListener(ev, fn){ (subs[ev] = subs[ev] || []).push(fn); return { remove(){ subs[ev] = (subs[ev] || []).filter(f => f !== fn); } }; },
  async prepareInterstitial(o){ globalThis.__prepN = (globalThis.__prepN || 0) + 1; await load(globalThis.__sc || {}); },
  async showInterstitial(){
    globalThis.__showAt = Date.now(); globalThis.__showN = (globalThis.__showN || 0) + 1;
    const sc = globalThis.__sc || {}; if (sc.show) sc.show(fire);
  },
  async prepareRewardVideoAd(o){ globalThis.__rprep = (globalThis.__rprep || []).concat([o]); await load(globalThis.__sc || {}); },
  /* 진짜와 같게 — 보상을 받았을 때만 끝나는 약속을 돌려준다(중간에 닫으면 영영 안 끝난다) */
  showRewardVideoAd(){
    globalThis.__showAt = Date.now(); globalThis.__showN = (globalThis.__showN || 0) + 1;
    const sc = globalThis.__sc || {};
    return new Promise(res => { if (sc.show) sc.show(fire, () => res({ type: "ticket", amount: 1 })); });
  },
};
`);
const esbuild = await import(pathToFileURL(join(ROOT, "node_modules/esbuild/lib/main.js")).href);
const OUT = join(HERE, "_bundle_interad.mjs");
await (esbuild.default || esbuild).build({
  entryPoints: [join(ROOT, "src/lib/ads.js")], bundle: true, format: "esm", platform: "node",
  outfile: OUT, logLevel: "warning",
  define: { "import.meta.env": "globalThis.__ENV__" },
  plugins: [{ name: "fake-admob", setup(b){
    b.onResolve({ filter: /^@capacitor-community\/admob$/ }, () => ({ path: FAKE }));
  } }],
});
globalThis.__ENV__ = { VITE_TEST_HOOKS: "1" };
globalThis.__ZOO_TEST = true;
globalThis.__interMs = { interWait: 600, rewardWait: 900, show: 500, back: 300, cap: 1500 };
const win = new EventTarget();
win.Capacitor = { isNativePlatform: () => true };
globalThis.window = win;
globalThis.document = { hidden: false };
const ads = await import(pathToFileURL(OUT).href);

const pause  = () => win.dispatchEvent(new Event("apppause"));
const resume = () => win.dispatchEvent(new Event("appresume"));
const reset = sc => { globalThis.__sc = sc; globalThis.__prepN = 0; globalThis.__showN = 0; globalThis.__showAt = 0; globalThis.__rprep = []; };
/* 전면: 결과 화면에서 미리 받아 두고(다 받을 때까지) 시작 */
async function primed(sc){ reset(sc); await ads.preloadInterstitial(); }
async function timed(fn){ const t0 = Date.now(); const r = await fn(); return { r, ms: Date.now() - t0 }; }

console.log("\n=== 전면 ===");
console.log("\n--- 1. 보통 ---");
{
  let closedAt = 0;
  await primed({ show: fire => setTimeout(() => { fire("is"); pause();
    setTimeout(() => { resume(); closedAt = Date.now(); fire("id"); }, 400); }, 30) });
  const { r } = await timed(() => ads.showInterstitial());
  const lag = Date.now() - closedAt;
  check("떴다 → 닫음 → ok", r.ok === true && !r.why, JSON.stringify(r));
  check("**닫는 즉시 끝난다** (시계 기다림 없음)", lag < 60, lag + "ms");
}

console.log("\n--- 2. 미리 받기 ---");
{
  await primed({ loadMs: 200, show: fire => setTimeout(() => { fire("is"); fire("id"); }, 10) });
  check("(준비) 결과 화면에서 한 번 받았다", globalThis.__prepN === 1, String(globalThis.__prepN));
  const t0 = Date.now();
  const r = await ads.showInterstitial();
  const wait = globalThis.__showAt - t0;
  check("**누르면 새로 안 받고 곧바로 보여 준다**", r.ok && globalThis.__prepN === 1 && wait < 60, "받은 횟수 " + globalThis.__prepN + " · 누르고 " + wait + "ms 뒤 뜸");
  reset({ show: fire => setTimeout(() => { fire("is"); fire("id"); }, 10) });
  const b = await timed(() => ads.showInterstitial());
  check("한 번 띄운 것은 다 쓴 것 — **받아 둔 것이 없으면 누른 그때 새로 받지 않고 곧바로 넘어간다**",
    b.r.why === "load" && globalThis.__prepN === 0 && globalThis.__showN === 0 && b.ms < 50, JSON.stringify(b.r) + " " + b.ms + "ms · 받기 " + globalThis.__prepN);
  reset({ loadMs: 250, show: fire => setTimeout(() => { fire("is"); fire("id"); }, 10) });
  ads.preloadInterstitial();
  await nap(50);
  const r2 = await ads.showInterstitial();
  check("받는 도중에 누르면 그걸 잠깐 기다려 쓴다 (두 번 안 받는다)", r2.ok && globalThis.__prepN === 1, "받은 횟수 " + globalThis.__prepN);
}

console.log("\n--- 3. 못 받음 ---");
{
  await primed({ load: "fail" });
  const a = await timed(() => ads.showInterstitial());
  check("받기 실패 → 곧바로 넘어간다", a.r.ok === false && a.r.why === "load" && a.ms < 60 && globalThis.__showN === 0, JSON.stringify(a.r) + " " + a.ms + "ms");
  reset({ load: "never" });
  ads.preloadInterstitial();
  const b = await timed(() => ads.showInterstitial());
  check("**받는 게 안 끝나면 1.5초(600ms)에 넘어간다** — 예전엔 끝없이", b.r.why === "load" && b.ms >= 550 && b.ms < 1000, JSON.stringify(b.r) + " " + b.ms + "ms");
}

console.log("\n--- 4·5. 안 뜸 / 보여 주기 실패 ---");
{
  await primed({ show: () => {} });
  const a = await timed(() => ads.showInterstitial());
  check("**떴다는 신호가 없으면 4초(500ms)에 넘어간다** — 예전엔 60초", a.r.ok === false && a.r.why === "noshow" && a.ms >= 450 && a.ms < 900, JSON.stringify(a.r) + " " + a.ms + "ms");
  await primed({ show: fire => setTimeout(() => fire("if"), 20) });
  const b = await timed(() => ads.showInterstitial());
  check("못 띄웠다는 신호 → 곧바로", b.r.why === "show" && b.ms < 150, JSON.stringify(b.r) + " " + b.ms + "ms");
}

console.log("\n--- 6. 닫힘 신호를 잃음 ---");
{
  let backAt = 0;
  await primed({ show: fire => setTimeout(() => { fire("is"); pause();
    setTimeout(() => { resume(); backAt = Date.now(); }, 2000); }, 30) });
  const a = await timed(() => ads.showInterstitial());
  const after = Date.now() - backAt;
  check("**광고가 떠 있는 2초 동안은 안 끝났다** (안전장치 1.5초보다 길어도)", a.ms >= 2000, a.ms + "ms");
  check("**앱이 다시 앞에 나오고 1.5초(300ms) 뒤 끝** — 예전엔 60초", a.r.ok === true && a.r.why === "back" && after >= 250 && after < 700, JSON.stringify(a.r) + " 돌아온 뒤 " + after + "ms");
}

console.log("\n--- 7. 나가기 누르고 곧바로 화면 끔 ---");
{
  let onAt = 0, closedAt = 0;
  await primed({ show: fire => { pause();
    setTimeout(() => { resume(); onAt = Date.now();
      setTimeout(() => { fire("is"); pause();
        setTimeout(() => { resume(); closedAt = Date.now(); fire("id"); }, 300); }, 100); }, 1800); } });
  const a = await timed(() => ads.showInterstitial());
  check("**꺼 둔 1.8초 동안은 안 끝났다** (화면 끄기로 건너뛰지 못함)", a.ms >= 1800 && onAt > 0, a.ms + "ms");
  check("**켜자 뜬 광고를 닫을 때까지 기다렸다**", a.r.ok === true && !a.r.why && closedAt > 0 && Date.now() - closedAt < 60, JSON.stringify(a.r));
  let on2 = 0;
  await primed({ show: () => { pause(); setTimeout(() => { resume(); on2 = Date.now(); }, 1500); } });
  const b = await timed(() => ads.showInterstitial());
  const after = Date.now() - on2;
  check("켜도 끝내 안 뜨면 **켠 뒤** 4초(500ms)에 로비 (켜자마자가 아니다)", b.r.why === "noshow" && on2 > 0 && after >= 450 && after < 900, JSON.stringify(b.r) + " 켠 뒤 " + after + "ms");
}

console.log("\n--- 8. 받는 중에 화면 끔 ---");
{
  let onAt = 0;
  reset({ loadMs: 300, show: fire => setTimeout(() => { fire("is"); fire("id"); }, 10) });
  ads.preloadInterstitial();
  const p = ads.showInterstitial();
  await nap(20); pause();
  await nap(1200);                                  /* 받기 기다림 600ms 를 훨씬 넘겨 꺼 둔다 */
  check("(준비) 꺼 둔 동안 광고를 띄우지 않았다 (뒤에서는 안 띄움)", globalThis.__showN === 0, String(globalThis.__showN));
  resume(); onAt = Date.now();
  const r = await p;
  check("**꺼 둔 시간은 안 센다 — 켜자마자 받아 둔 광고를 띄웠다**", r.ok === true && globalThis.__showN === 1 && globalThis.__showAt - onAt < 60, JSON.stringify(r) + " 켜고 " + (globalThis.__showAt - onAt) + "ms 뒤 뜸");
}

console.log("\n--- 9·10. 안전장치 / 두 번 ---");
{
  await primed({ show: fire => setTimeout(() => fire("is"), 20) });
  const a = await timed(() => ads.showInterstitial());
  check("떴는데 pause·닫힘 둘 다 없음 → 안전장치(1500ms)에 끝 — 영영 잠기지 않는다", a.r.why === "timeout" && a.ms >= 1450 && a.ms < 2100, JSON.stringify(a.r) + " " + a.ms + "ms");
  await primed({ show: fire => setTimeout(() => { fire("is"); fire("id"); }, 200) });
  const p1 = ads.showInterstitial();
  await nap(50);
  const r2 = await ads.showInterstitial();
  const r1 = await p1;
  check("떠 있는 동안 또 부르면 busy — 두 번 안 뜬다", r2.why === "busy" && r1.ok && globalThis.__showN === 1, JSON.stringify(r2) + " 띄운 횟수 " + globalThis.__showN);
  await primed({ show: () => {} });
  const q = ads.showInterstitial(); await nap(20);
  const pre = await ads.preloadInterstitial(); await q;
  check("광고가 떠 있는 동안은 미리 받기도 안 한다", pre === false);
}

console.log("\n=== 보상형 ===");
const UID = "uid-1";
async function rprimed(sc){ reset(sc); await ads.preloadRewardAd(UID); }
console.log("\n--- 11. 끝까지 봄 / 중간에 닫음 / 닫힘 신호 잃음 ---");
{
  let closedAt = 0;
  await rprimed({ show: (fire, reward) => setTimeout(() => { fire("rs"); pause();
    setTimeout(() => { fire("rr"); reward(); resume(); closedAt = Date.now(); fire("rd"); }, 400); }, 30) });
  check("(준비) 미리 받아 둔 것이 있다 — rewardReady", ads.rewardReady(UID) === true);
  check("받아 둘 때 계정 번호(SSV)를 싣는다", globalThis.__rprep[0] && globalThis.__rprep[0].ssv && globalThis.__rprep[0].ssv.userId === UID, JSON.stringify(globalThis.__rprep[0]));
  const a = await timed(() => ads.showRewardAd(UID));
  check("**끝까지 보면 ok**, 닫는 즉시 끝", a.r.ok === true && Date.now() - closedAt < 60, JSON.stringify(a.r));
  check("한 번 띄운 것은 다 쓴 것", ads.rewardReady(UID) === false);
  await rprimed({ show: (fire) => setTimeout(() => { fire("rs"); pause(); setTimeout(() => { resume(); fire("rd"); }, 300); }, 30) });
  const b = await ads.showRewardAd(UID);
  check("**중간에 닫으면 dismissed** (보상 아님)", b.ok === false && b.why === "dismissed", JSON.stringify(b));
  let backAt = 0;
  await rprimed({ show: (fire, reward) => setTimeout(() => { fire("rs"); pause();
    setTimeout(() => { fire("rr"); reward(); resume(); backAt = Date.now(); /* 닫힘 신호 없음 */ }, 300); }, 30) });
  const c = await ads.showRewardAd(UID);
  check("**닫힘 신호를 잃어도 보상 신호가 있었으면 ok** — 돌아오고 1.5초(300ms)에", c.ok === true && Date.now() - backAt >= 250 && Date.now() - backAt < 700, JSON.stringify(c) + " " + (Date.now() - backAt) + "ms");
  await rprimed({ show: (fire) => setTimeout(() => { fire("rs"); pause(); setTimeout(() => { resume(); }, 300); }, 30) });
  const d = await ads.showRewardAd(UID);
  check("닫힘 신호를 잃었고 보상 신호도 없으면 dismissed (멈추지 않는다)", d.ok === false && d.why === "dismissed", JSON.stringify(d));
}

console.log("\n--- 12. 받아 둔 것이 없을 때 ---");
{
  reset({ loadMs: 200, show: (fire, reward) => setTimeout(() => { fire("rs"); fire("rr"); reward(); fire("rd"); }, 10) });
  check("(준비) 받아 둔 것 없음 — rewardReady false (화면에 '불러오는 중')", ads.rewardReady("uid-new") === false);
  const a = await timed(() => ads.showRewardAd("uid-new"));
  check("**누를 때 받아서 띄운다** (사람이 직접 눌렀으니)", a.r.ok === true && globalThis.__rprep.length === 1 && a.ms >= 180, JSON.stringify(a.r) + " " + a.ms + "ms");
  reset({ load: "never" });
  const b = await timed(() => ads.showRewardAd("uid-x"));
  check("**받는 게 안 끝나면 8초(900ms)에 넘어간다** — 단추가 영영 안 잠긴다", b.r.why === "load" && b.ms >= 850 && b.ms < 1400, JSON.stringify(b.r) + " " + b.ms + "ms");
  reset({ load: "fail" });
  const c = await timed(() => ads.showRewardAd("uid-y"));
  check("받기 실패 → 곧바로", c.r.why === "load" && c.ms < 200, JSON.stringify(c.r) + " " + c.ms + "ms");
}

console.log("\n--- 13. 안 뜸 / 못 띄움 ---");
{
  await rprimed({ show: () => {} });
  const a = await timed(() => ads.showRewardAd(UID));
  check("**떴다는 신호가 없으면 4초(500ms)** — 예전엔 2분", a.r.why === "noshow" && a.ms >= 450 && a.ms < 900, JSON.stringify(a.r) + " " + a.ms + "ms");
  await rprimed({ show: fire => setTimeout(() => fire("rf"), 20) });
  const b = await timed(() => ads.showRewardAd(UID));
  check("못 띄웠다는 신호 → 곧바로", b.r.why === "show" && b.ms < 150, JSON.stringify(b.r) + " " + b.ms + "ms");
}

console.log("\n--- 14. 누르고 곧바로 화면 끔 ---");
{
  let onAt = 0;
  await rprimed({ show: (fire, reward) => { pause();
    setTimeout(() => { resume(); onAt = Date.now();
      setTimeout(() => { fire("rs"); pause(); setTimeout(() => { fire("rr"); reward(); resume(); fire("rd"); }, 300); }, 100); }, 1800); } });
  const a = await timed(() => ads.showRewardAd(UID));
  check("**꺼 둔 1.8초 동안은 안 끝났고, 켜자 뜬 광고를 끝까지 보면 ok**", a.ms >= 1800 && onAt > 0 && a.r.ok === true, JSON.stringify(a.r) + " " + a.ms + "ms");
}

console.log("\n--- 15. SDK 미리 켜기 ---");
{
  const before = globalThis.__initN || 0;
  await Promise.all([ads.warmAds(), ads.warmAds(), ads.warmAds()]);
  check("여러 번 불러도 SDK 는 한 번만 켠다 (이미 켜져 있으면 안 켠다)", (globalThis.__initN || 0) - before <= 1 && (globalThis.__initN || 0) === 1, "켠 횟수 " + globalThis.__initN);
}

console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
