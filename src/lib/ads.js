/* 보상형 광고 — **끝까지 보면** 보상(티켓 1장)을 준다.

   안드로이드 앱에서만 나온다(AdMob, `@capacitor-community/admob`).
   웹에서는 광고를 띄울 방법이 없어 아무 일도 안 한다 — 게임은 앱으로 낸다.

   광고 단위 번호:
     지금은 **구글이 공개한 시험용 번호**를 쓴다. 이걸로는 진짜 돈이 안 벌리고,
     시험 광고라고 적힌 광고가 뜬다. AdMob 에 앱을 등록하고 받은 진짜 번호는
     `.env` 에 `VITE_AD_REWARD_ID=ca-app-pub-...` 로 넣으면 그걸 쓴다.
     (시험용 번호로 진짜 광고를 받거나, 진짜 번호로 개발 중에 광고를 누르면
      AdMob 계정이 정지될 수 있다 — 개발 중에는 시험용을 둘 것) */

const TEST_REWARD_ID = "ca-app-pub-3940256099942544/5224354917";   /* 구글 공식 시험용(안드로이드 보상형) */
export const AD_REWARD_ID =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_AD_REWARD_ID) ||
  TEST_REWARD_ID;
export const AD_IS_TEST = AD_REWARD_ID === TEST_REWARD_ID;

/* 앱(안드로이드) 안에서 도는가 */
export function adsAvailable(){
  const C = typeof window !== "undefined" ? window.Capacitor : null;
  return Boolean(C && typeof C.isNativePlatform === "function" && C.isNativePlatform());
}

/* 전면 광고 — 게임 한 판이 끝나고 **로비로 나갈 때** 한 번.
   보상형과 다른 광고 단위가 필요하다(진짜 번호는 AdMob 에서 따로 만들어 받는다) */
const TEST_INTER_ID = "ca-app-pub-3940256099942544/1033173712";   /* 구글 공식 시험용(안드로이드 전면) */
export const AD_INTER_ID =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_AD_INTER_ID) ||
  TEST_INTER_ID;

let inited = false;
/* 광고가 하나 떠 있는 동안 다른 광고를 띄우지 않는다 */
let showing = false;
export const adBusy = () => showing;

/* 광고를 보여 주고 **끝까지 봤는지**를 알려 준다.
   { ok: true }  — 보상을 받을 자격이 생겼다
   { ok: false, why } — 웹이라 못 띄움 / 못 불러옴 / 중간에 닫음 / 보여 주기 실패 */
export async function showRewardAd(){
  /* 검사용 — 진짜 광고 대신 결과를 흉내낸다 */
  if (import.meta.env.VITE_TEST_HOOKS && globalThis.__ZOO_TEST && typeof window.__adTest === "function") return window.__adTest();
  if (!adsAvailable()) return { ok: false, why: "web" };
  if (showing) return { ok: false, why: "busy" };
  showing = true;
  try { return await rewardInner(); } finally { showing = false; }
}

async function rewardInner(){

  const { AdMob, RewardAdPluginEvents } = await import("@capacitor-community/admob");
  try {
    if (!inited){ await AdMob.initialize({}); inited = true; }
    await AdMob.prepareRewardVideoAd({ adId: AD_REWARD_ID, isTesting: AD_IS_TEST });
  } catch (e){
    return { ok: false, why: "load" };         /* 불러올 광고가 없거나 연결 문제 */
  }

  /* 보상은 **광고가 닫힌 뒤에** 준다. 보는 도중 "보상" 신호가 오고, 닫으면 "닫힘" 이 온다.
     중간에 닫으면 보상 신호 없이 닫힘만 온다 — 그때는 안 준다 */
  return await new Promise(resolve => {
    let done = false, rewarded = false;
    const subs = [];
    const finish = v => {
      if (done) return;
      done = true;
      subs.forEach(h => { try { h.remove(); } catch(e){} });
      resolve(v);
    };
    const on = (ev, fn) => AdMob.addListener(ev, fn).then(h => subs.push(h)).catch(() => {});
    on(RewardAdPluginEvents.Rewarded,     () => { rewarded = true; });
    on(RewardAdPluginEvents.Dismissed,    () => finish({ ok: rewarded, why: rewarded ? "" : "dismissed" }));
    on(RewardAdPluginEvents.FailedToShow, () => finish({ ok: false, why: "show" }));
    AdMob.showRewardVideoAd()
      .then(() => { rewarded = true; })
      .catch(() => finish({ ok: false, why: "show" }));
    /* 닫힘 신호가 끝내 안 오는 경우를 대비 — 단추가 영영 잠기면 안 된다 */
    setTimeout(() => finish({ ok: rewarded, why: rewarded ? "" : "timeout" }), 120000);
  });
}

/* 게임 한 판이 끝나고 로비로 나갈 때 한 번.
   **광고 때문에 화면 이동이 막히면 안 된다** — 못 불러오거나 실패하면 그냥 넘어간다.
   그래서 결과를 기다리지 않는 쪽이 아니라, 끝나면 바로 알려 주는 쪽으로 만든다 */
export async function showInterstitial(){
  if (import.meta.env.VITE_TEST_HOOKS && globalThis.__ZOO_TEST && typeof window.__adInterTest === "function") return window.__adInterTest();
  if (!adsAvailable()) return { ok: false, why: "web" };
  if (showing) return { ok: false, why: "busy" };
  showing = true;
  try {
    const { AdMob, InterstitialAdPluginEvents } = await import("@capacitor-community/admob");
    if (!inited){ await AdMob.initialize({}); inited = true; }
    await AdMob.prepareInterstitial({ adId: AD_INTER_ID, isTesting: AD_INTER_ID === TEST_INTER_ID });
    return await new Promise(resolve => {
      let done = false;
      const subs = [];
      const finish = v => {
        if (done) return;
        done = true;
        subs.forEach(h => { try { h.remove(); } catch(e){} });
        resolve(v);
      };
      const on = (ev, fn) => AdMob.addListener(ev, fn).then(h => subs.push(h)).catch(() => {});
      on(InterstitialAdPluginEvents.Dismissed,    () => finish({ ok: true }));
      on(InterstitialAdPluginEvents.FailedToShow, () => finish({ ok: false, why: "show" }));
      AdMob.showInterstitial().catch(() => finish({ ok: false, why: "show" }));
      setTimeout(() => finish({ ok: false, why: "timeout" }), 60000);
    });
  } catch (e){
    return { ok: false, why: "load" };          /* 못 불러왔다 — 그냥 넘어간다 */
  } finally { showing = false; }
}
