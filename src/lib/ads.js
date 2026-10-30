/* 광고 — 보상형(티켓)과 전면(게임이 끝나고 나갈 때).

   안드로이드 앱에서만 나온다(AdMob, `@capacitor-community/admob`).
   웹에서는 광고를 띄울 방법이 없어 아무 일도 안 한다 — 게임은 앱으로 낸다.

   광고 단위 번호:
     지금은 **구글이 공개한 시험용 번호**를 쓴다. 이걸로는 진짜 돈이 안 벌리고,
     시험 광고라고 적힌 광고가 뜬다. AdMob 에 앱을 등록하고 받은 진짜 번호는
     `.env` 에 `VITE_AD_REWARD_ID=ca-app-pub-...` 로 넣으면 그걸 쓴다.
     (시험용 번호로 진짜 광고를 받거나, 진짜 번호로 개발 중에 광고를 누르면
      AdMob 계정이 정지될 수 있다 — 개발 중에는 시험용을 둘 것)

   ---------- 띄우는 방식 (2026-10-26 사용자 "둘 다 베스트로. 광고 때문에 게임이 렉 걸리거나 오류 나면 최악") ----------

   구글 안내(AdMob 안드로이드 전면·보상형 가이드)의 기본 틀을 그대로 따른다:
     - 광고는 **미리 받아 둔다.** 띄울 때 받으면 그만큼 화면이 멈춘다. 받아 둔 광고는 1시간이 지나면 못 쓴다(여기선 45분)
     - 띄울 때가 됐는데 준비가 안 돼 있으면 **기다리지 않고 넘어간다**(구글 예제도 null 이면 그냥 게임을 이어 간다)
     - 흐름은 **광고 SDK 가 주는 신호**로 움직인다 — 떴다(Showed) · 닫혔다(Dismissed) · 못 띄웠다(FailedToShow) · 보상(Rewarded)
     - 한 번 띄운 광고는 다 쓴 것 — 다음 것은 다시 받는다
   그 위에 **신호를 잃어도 앱이 멈추지 않게** 시간 제한을 얹는다. 시간은 **앱이 앞에 있을 때만** 센다
   (화면을 끄거나 광고가 앱을 덮고 있는 동안은 기다리는 게 맞다 — 그 시간까지 세면 떠 있는 광고를 "안 떴다" 로 본다.
    또 화면 끄기로 광고를 건너뛰는 길도 막힌다 — 같은 날 사용자 지적):
     · 받는 중인 광고를 기다리는 것: 전면 1.5초 · 보상형 8초(보상형은 사람이 직접 눌렀으니 조금 더 기다리고, 그동안 안내를 띄운다)
     · 보여 달라고 한 뒤 떴다는 신호: 4초 — 없으면 안 뜬 것
     · 떴으면 닫힐 때까지. 광고가 앱을 덮으면 앱은 pause 되고, 닫히면 앞에 나온다 —
       앞에 나왔는데 1.5초가 지나도 닫힘 신호가 없으면 닫힌 것으로 본다(신호를 잃은 경우)
     · 떴다는데 pause 도 닫힘도 없는 이상한 경우만 남은 마지막 안전장치 60초
     · 앱이 뒤에 있을 때는 띄우지 않는다 — 앞에 나오면 그때 띄운다(뒤에서 띄우면 SDK 가 거절하거나 꼬인다)
   **티켓은 이 시간들과 상관없다** — 끝까지 봤을 때 구글이 게임 서버로 서명해 알려 와야(SSV) 서버가 준다 */

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

/* 광고가 하나 떠 있는 동안 다른 광고를 띄우지 않는다 */
let showing = false;
export const adBusy = () => showing;

/* 시간(ms). 검사는 globalThis.__interMs 로 줄여 본다(검사용 빌드에서만) */
const MS = { interWait: 1500, rewardWait: 8000, show: 4000, back: 1500, cap: 60000 };
const ms = () => Object.assign({}, MS,
  (import.meta.env.VITE_TEST_HOOKS && globalThis.__ZOO_TEST && globalThis.__interMs) || {});
const FRESH_MS = 45 * 60 * 1000;                 /* 구글: 받아 둔 광고는 1시간 뒤 만료 */

/* ---------- SDK 켜기 ----------
   구글은 앱을 켤 때 한 번 켜 두라고 한다. 처음 광고를 받을 때 켜면 그 순간(로비에 막 들어선 때) 한 번 버벅일 수 있다.
   main.js 가 로그인 확인이 끝난 뒤(약관에 동의한 사람만 — 동의 전에는 광고 SDK 를 안 켠다) 미리 부른다.
   여러 곳에서 동시에 불러도 한 번만 켠다 */
let initP = null;
function initAds(AdMob){
  if (!initP) initP = Promise.resolve().then(() => AdMob.initialize({})).catch(e => { initP = null; throw e; });
  return initP;
}
export async function warmAds(){
  if (!adsAvailable()) return false;
  try { const { AdMob } = await import("@capacitor-community/admob"); await initAds(AdMob); return true; }
  catch(e){ return false; }
}

/* ---------- 앱이 앞에 나와 있는가 ----------
   안드로이드에서 앱이 내려가면 캐패시터 App 의 pause/resume 이 오고(nav.js 가 apppause/appresume 으로 넘긴다),
   광고가 앱을 덮을 때도 앱은 pause 된다. 웹뷰가 화면을 숨겼다고 알려 주면(document.hidden) 그것도 본다 */
let fgPaused = false, fgHooked = false;
const fgWatch = new Set();              /* 앞으로 나오는 순간 곧바로 알고 싶은 쪽 (받아 둔 광고를 켜자마자 띄울 때) */
function watchFg(){
  if (fgHooked || typeof window === "undefined" || !window || typeof window.addEventListener !== "function") return;
  fgHooked = true;
  window.addEventListener("apppause",  () => { fgPaused = true; });
  window.addEventListener("appresume", () => { fgPaused = false; fgWatch.forEach(f => { try { f(); } catch(e){} }); });
}
watchFg();
const fgNow = () => !fgPaused && !(typeof document !== "undefined" && document && document.hidden);

/* 앱이 앞에 있는 시간만 세는 시계. step(dt, front) 를 200ms 마다 부른다 */
function fgTicker(step){
  let last = Date.now();
  const id = setInterval(() => { const now = Date.now(); const dt = now - last; last = now; try { step(dt, fgNow()); } catch(e){} }, 200);
  return () => clearInterval(id);
}

/* ---------- 받아 두기 ----------
   slot = { at, id, p: Promise<boolean>, ok: null|true|false } — ok 는 다 받았는지(받는 중이면 null) */
function loadSlot(id, run){
  const mine = { at: Date.now(), id, p: null, ok: null };
  mine.p = (async () => {
    try { await run(); mine.ok = true; return true; }
    catch(e){ mine.ok = false; return false; }
  })();
  return mine;
}
const fresh = s => Boolean(s && s.ok !== false && Date.now() - s.at < FRESH_MS);

/* 보상형 — 광고에는 계정 번호(SSV userId)가 실리므로 **누구 것으로 받아 뒀는지** 기억한다.
   계정이 바뀌었으면 새로 받는다 */
let rewardSlot = null;
function rewardLoad(userId){
  const id = String(userId || "");
  if (fresh(rewardSlot) && rewardSlot.id === id) return rewardSlot;
  rewardSlot = loadSlot(id, async () => {
    const { AdMob } = await import("@capacitor-community/admob");
    await initAds(AdMob);
    const opt = { adId: AD_REWARD_ID, isTesting: AD_IS_TEST };
    if (id) opt.ssv = { userId: id };
    await AdMob.prepareRewardVideoAd(opt);
  });
  return rewardSlot;
}
/* 로비에 있는 동안 미리 받아 둔다(main.js). 광고가 떠 있는 동안에는 안 받는다 */
export function preloadRewardAd(userId){
  if (!adsAvailable() || showing) return Promise.resolve(false);
  return rewardLoad(userId).p;
}
/* 지금 누르면 곧바로 뜨는가 — 아니면 화면에 "불러오는 중" 을 띄운다(main.js) */
export function rewardReady(userId){
  return Boolean(rewardSlot && rewardSlot.ok === true && rewardSlot.id === String(userId || "") && fresh(rewardSlot));
}

/* 전면 */
let interSlot = null;
function interLoad(){
  if (fresh(interSlot)) return interSlot;
  interSlot = loadSlot("", async () => {
    const { AdMob } = await import("@capacitor-community/admob");
    await initAds(AdMob);
    await AdMob.prepareInterstitial({ adId: AD_INTER_ID, isTesting: AD_INTER_ID === TEST_INTER_ID });
  });
  return interSlot;
}
/* 최종 결과 화면이 뜰 때 미리 받아 둔다(nav.js). 광고가 떠 있는 동안에는 안 받는다 */
export function preloadInterstitial(){
  /* 검사용 — 웹에서는 광고가 안 뜨므로 "불렀는가" 만 센다 */
  if (import.meta.env.VITE_TEST_HOOKS && globalThis.__ZOO_TEST) globalThis.__preInter = (globalThis.__preInter || 0) + 1;
  if (!adsAvailable() || showing) return Promise.resolve(false);
  return interLoad().p;
}

/* ---------- 띄우기 (공통) ----------
   slot 이 준비되기를 waitMs 까지(앱이 앞에 있는 시간으로) 기다리고, 앞에 있을 때 띄운 뒤 신호로 끝을 본다.
   돌려주는 값: { ok, why, rewarded }
     why: "" 정상 / "load" 준비 안 됨·못 받음 / "noshow" 떴다는 신호 없음 / "show" 못 띄움 /
          "back" 닫힘 신호 없이 앱이 돌아옴(닫힌 것으로 봄) / "timeout" 마지막 안전장치 */
async function runAd({ slot, waitMs, events, show }){
  const T = ms();
  const ready = await new Promise(resolve => {
    let fg = 0, over = false, stopTick = () => {};
    const look = front => { if (slot.ok === false) fin(false); else if (slot.ok === true && front) fin(true); };
    const onFront = () => look(fgNow());
    const fin = v => { if (!over){ over = true; stopTick(); fgWatch.delete(onFront); resolve(v); } };
    fgWatch.add(onFront);
    stopTick = fgTicker((dt, front) => {
      look(front);
      if (!over && slot.ok === null && front){ fg += dt; if (fg >= waitMs) fin(false); }
    });
    slot.p.then(() => look(fgNow()), () => look(fgNow()));
    look(fgNow());                                  /* 이미 받아 둔 것이면 시계를 기다리지 않고 곧바로 */
  });
  if (!ready) return { ok: false, why: "load", rewarded: false };

  const { AdMob } = await import("@capacitor-community/admob");
  const subs = [];
  let shown = false, rewarded = false, kick = () => {}, result = null;
  const end = v => { if (!result){ result = v; kick(); } };
  const on = (ev, fn) => ev ? AdMob.addListener(ev, fn).then(h => { subs.push(h); }).catch(() => {}) : Promise.resolve();
  /* 신호를 듣기 **시작한 뒤에** 띄운다 — 먼저 띄우면 빨리 온 신호를 놓친다 */
  await Promise.all([
    on(events.Showed,       () => { shown = true; }),
    on(events.Dismissed,    () => end({ ok: true, why: "" })),
    on(events.FailedToShow, () => end({ ok: false, why: "show" })),
    on(events.Rewarded,     () => { rewarded = true; }),
  ]);
  try {
    const r = await new Promise(resolve => {
      let wait = 0, up = 0, back = 0, away = false, stop = () => {};
      /* 닫힘·실패 신호는 오는 즉시 끝낸다(시계를 기다리지 않는다) */
      kick = () => { if (result){ stop(); resolve(result); } };
      stop = fgTicker((dt, front) => {
        if (result) return kick();
        if (!front){ away = true; back = 0; return; }        /* 화면이 꺼졌거나 광고가 앱을 덮고 있다 */
        if (!shown){ wait += dt; if (wait >= T.show) end({ ok: false, why: "noshow" }); return; }
        up += dt;
        if (away){ back += dt; if (back >= T.back){ end({ ok: true, why: "back" }); return; } }
        if (up >= T.cap) end({ ok: false, why: "timeout" });
      });
      kick();
      let p = null;
      try { p = show(); } catch(e){ end({ ok: false, why: "show" }); }
      /* 보상형의 show() 는 **보상을 받았을 때** 끝난다(중간에 닫으면 끝나지 않는다 — 기다리지 않는다) */
      if (p && p.then) p.then(() => { if (events.Rewarded) rewarded = true; }, () => end({ ok: false, why: "show" }));
    });
    return Object.assign({ rewarded }, r);
  } finally {
    subs.forEach(h => { try { h.remove(); } catch(e){} });
  }
}

/* ---------- 보상형 ----------
   { ok: true }  — 끝까지 봤다(보상을 받을 자격). 티켓은 서버가 준다
   { ok: false, why } — 웹 / busy / load(못 불러옴) / dismissed(중간에 닫음) / noshow·show(못 띄움) / timeout

   userId = 내 계정 번호(uid). **서버 측 확인(SSV)** 에 실린다 — 끝까지 보면 AdMob 이
   게임 서버(/zoo/admob/ssv)로 "이 사람이 봤다" 를 서명해서 알려 오고, 서버가 티켓을 준다.
   AdMob 콘솔에서 그 광고 단위에 서버 주소를 넣어 둬야 한다.
   ※ 구글 공개 시험용 광고 단위는 우리 콘솔 것이 아니라 서버로 알림이 오지 않는다 */
export async function showRewardAd(userId){
  /* 검사용 — 진짜 광고 대신 결과를 흉내낸다 */
  if (import.meta.env.VITE_TEST_HOOKS && globalThis.__ZOO_TEST && typeof window.__adTest === "function") return window.__adTest();
  if (!adsAvailable()) return { ok: false, why: "web" };
  if (showing) return { ok: false, why: "busy" };
  showing = true;
  try {
    const { RewardAdPluginEvents: EV, AdMob } = await import("@capacitor-community/admob");
    const slot = rewardLoad(userId);                /* 받아 둔 것(받는 중이면 그것), 없으면 지금 받기 시작 */
    const r = await runAd({ slot, waitMs: ms().rewardWait, events: EV, show: () => AdMob.showRewardVideoAd() });
    if (rewardSlot === slot) rewardSlot = null;     /* 한 번 띄운(또는 포기한) 것은 다 쓴 것 */
    if (r.why === "load" || r.why === "noshow" || r.why === "show" || r.why === "timeout") return { ok: false, why: r.why };
    /* 닫혔다(또는 닫힌 것으로 봄) — 보상 신호가 있었을 때만 끝까지 본 것 */
    return r.rewarded ? { ok: true } : { ok: false, why: "dismissed" };
  } catch (e){
    return { ok: false, why: "load" };
  } finally { showing = false; }
}

/* ---------- 전면 ----------
   **광고 때문에 화면 이동이 막히면 안 된다** — 준비가 안 됐거나 못 띄우면 그냥 로비로 간다.
   2026-10-26 고침 ("광고 안 보고 폰 끄면 렉 걸린다" · "60초는 왜 기다리냐"):
   예전에는 "나가기" 를 누른 **그때** 광고를 받아 왔고(1초 넘게 아무 반응 없음), 받는 동안은 시간 제한이 없었고,
   떴는지는 안 보고 닫힘 신호만 60초까지 기다렸다. 신호가 사라지면 "나가기" 가 60초 동안 안 먹혔다.
   이제는 최종 결과 화면에서 미리 받아 두고(nav.js), 누를 때 준비가 안 돼 있으면(받는 중이면 1.5초까지만) 넘어간다 —
   **누른 그때 새로 받지 않는다** */
export async function showInterstitial(){
  if (import.meta.env.VITE_TEST_HOOKS && globalThis.__ZOO_TEST && typeof window.__adInterTest === "function") return window.__adInterTest();
  if (!adsAvailable()) return { ok: false, why: "web" };
  if (showing) return { ok: false, why: "busy" };
  const slot = fresh(interSlot) ? interSlot : null;
  if (!slot) return { ok: false, why: "load" };     /* 받아 둔 것이 없다 — 기다리지 않는다 */
  showing = true;
  try {
    const { InterstitialAdPluginEvents: EV, AdMob } = await import("@capacitor-community/admob");
    const r = await runAd({ slot, waitMs: ms().interWait, events: { Showed: EV.Showed, Dismissed: EV.Dismissed, FailedToShow: EV.FailedToShow },
                            show: () => AdMob.showInterstitial() });
    if (interSlot === slot) interSlot = null;        /* 한 번 띄운(또는 포기한) 것은 다 쓴 것 */
    return { ok: r.ok, why: r.why };
  } catch (e){
    return { ok: false, why: "load" };
  } finally { showing = false; }
}

/* ---------- 광고 개인화 동의 ----------
   유럽 등에서는 광고를 개인에 맞춰 띄우려면 따로 동의를 받아야 한다.
   그 창은 **구글이 만들어 준다**(UMP). 우리가 체크박스로 흉내내면 규정에 안 맞는다.
   동의가 필요 없는 곳에서는 아무 창도 안 뜬다.

   광고 때문에 앱이 막히면 안 되므로, 실패해도 조용히 넘어간다 */
export async function askAdConsent(){
  if (!adsAvailable()) return { ok: false, why: "web" };
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    const info = await AdMob.requestConsentInfo();
    if (info && info.isConsentFormAvailable && info.status === "REQUIRED"){
      const after = await AdMob.showConsentForm();
      return { ok: true, status: after && after.status };
    }
    return { ok: true, status: info && info.status };
  } catch (e){
    return { ok: false, why: String(e && e.message || e) };
  }
}
