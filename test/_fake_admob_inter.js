/* 광고 흉내 — interad.test 가 globalThis.__sc 로 움직임을 정한다 */
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
