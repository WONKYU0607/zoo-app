/* AdMob 플러그인 흉내 — 준비할 때 받은 값을 적어 두고, 보여 주면 끝까지 본 것으로 한다 */
const subs = {};
export const RewardAdPluginEvents = { Rewarded: "r", Dismissed: "d", FailedToShow: "f" };
export const InterstitialAdPluginEvents = { Dismissed: "id", FailedToShow: "if" };
export const AdMob = {
  async initialize(){},
  async prepareRewardVideoAd(o){ (globalThis.__prep = globalThis.__prep || []).push(JSON.parse(JSON.stringify(o))); },
  async addListener(ev, fn){ subs[ev] = fn; return { remove(){ delete subs[ev]; } }; },
  async showRewardVideoAd(){ setTimeout(() => { subs.r && subs.r(); subs.d && subs.d(); }, 20); },
};
