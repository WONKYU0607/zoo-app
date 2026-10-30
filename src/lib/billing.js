/* 구글 플레이 결제 — 코인 묶음 · 광고 제거 · 카드 스킨 · 판 배경 (2026-10-26 사용자 결정 · 2026-10-27 스킨·배경도 현금으로)
   스킨·배경 상품 번호는 shop.js cashOf("deck:1") = "deck_1". 광고 제거처럼 계속 가지는 상품(소모 안 함)

   플러그인: @capgo/native-purchases (Capacitor 8, Google Play Billing 9). 웹에는 결제가 없다(웹판은 막혀 있다 — webgate).
   흐름:
     1) 상품 값 받기(getProducts) — 원화 값은 플레이 콘솔에서 정한 것이 그대로 온다(priceString)
     2) 사기(purchaseProduct) — **스스로 확인·소모하지 않는다**(autoAcknowledgePurchases:false).
        결제에 내 계정 표시(acctTag — uid 를 줄인 값)를 붙여 남이 그 결제를 못 쓰게 한다
     3) 결제 표(purchaseToken)를 서버에 보낸다 → 서버가 구글에 직접 확인하고 계정에 넣은 뒤 소모·확인을 알린다
     4) 켤 때 남은 결제(getPurchases)를 다시 보낸다 — 결제는 됐는데 서버에 못 보낸 것(앱이 꺼짐·끊김)을 살린다.
        3일 안에 서버가 확인을 못 하면 구글이 돌려준다(환불)
   **플러그인 부르기는 한 줄로 세운다(queue)** — 이 플러그인은 부를 때마다 결제 연결을 닫고 새로 연다(안드로이드 소스 initBillingClient).
     결제 창이 떠 있는 동안 값 받기·남은 결제 읽기가 끼어들면 결제 창의 연결이 닫혀 결과를 못 받을 수 있다
     (돈은 냈는데 앱은 계속 기다림 — 상점이 멈춤). 그래서 앞 호출이 끝나야 다음 호출을 한다.
   검사: 검사용 빌드에서는 globalThis.__fakeBilling 으로 가짜 플러그인을 끼울 수 있다(shop.test) */
import { NOADS, pack, PRODUCTS, itemOfCash, owns } from "./shop.js";
import { account, payVerify } from "./account.js";

const isNative = () => Boolean(typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
/* **플러그인 객체를 Promise 로 넘기지 않는다 — 상자({ np })에 담아 넘긴다** (2026-10-30 내부 테스트 1.0.9 에서 터짐)
   Capacitor 플러그인 객체는 아무 이름이나 있는 척하는 대리 객체(Proxy)라 .then 도 함수로 보인다.
   async 함수에서 그대로 return 하거나 .then(m => m.NativePurchases) 처럼 넘기면 자바스크립트가 Promise 로 착각해
   NativePurchases.then() 을 부르고("not implemented on android" 로 거절) **그 Promise 는 영영 안 끝난다** →
   결제 쓸 수 있나·값 받기·사기가 전부 멈춤(상점 가격 "…" · 사기 "처리 중" 그대로 · 스킨에 현금 값 안 붙음).
   상자는 then 이 없는 평범한 객체라 안전하다. 꺼낼 때는 box.np */
let box = null, loading = null;
async function plugin(){
  if (import.meta.env.VITE_TEST_HOOKS && globalThis.__fakeBilling) return { np: globalThis.__fakeBilling };
  if (!isNative()) return null;
  if (box) return box;
  if (!loading) loading = import("@capgo/native-purchases").then(m => { box = { np: m.NativePurchases }; return box; }).catch(() => null);
  return loading;
}
/* 꺼내는 함수를 async 로 만들면 또 같은 일이 난다(async 함수가 대리 객체를 return) — 부르는 곳에서 await plugin() 한 뒤 .np 로 꺼낸다 */
const npOf = b => (b ? b.np : null);

/* 한 줄로 — 앞 호출이 끝나야(성공이든 실패든) 다음 호출을 시작한다 */
let line = Promise.resolve();
function queue(fn){
  const run = line.then(fn, fn);
  line = run.then(() => {}, () => {});
  return run;
}
if (import.meta.env.VITE_TEST_HOOKS && typeof globalThis !== "undefined") globalThis.__billingQueue = queue;   /* 검사용 */

/* 결제에 붙이는 계정 표시 — 서버 play.js acctTag 와 같은 식(sha256("zoo:"+uid) 앞 32자) */
export async function acctTag(uid){
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("zoo:" + String(uid || "")));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

/* 결제를 쓸 수 있는가 (앱 · 구글 플레이 있음) */
export async function billingOn(){
  const p = npOf(await plugin());
  if (!p) return false;
  try { const r = await queue(() => p.isBillingSupported()); return Boolean(r && r.isBillingSupported); } catch(e){ return false; }
}

/* 상품 값 — { 상품번호: { price:"₩1,200", title } }. 한 번 받으면 다시 안 묻는다(못 받았으면 다음에 다시) */
let priceCache = null, priceTried = false;
export async function prices(){
  if (priceCache) return priceCache;
  const p = npOf(await plugin());
  if (!p) return {};
  try {
    const r = await queue(() => p.getProducts({ productIdentifiers: PRODUCTS, productType: "inapp" }));
    const out = {};
    for (const x of (r && r.products) || []) out[x.identifier] = { price: x.priceString || "", title: x.title || "" };
    if (Object.keys(out).length) priceCache = out;
    priceTried = true;
    return out;
  } catch(e){ return {}; }
}
/* 구글이 값을 답했는데 그 상품이 없다 = 플레이 콘솔에 아직 안 만들었거나 꺼 둠 → 상점이 "준비 중" 으로 보이고 결제 창을 안 띄운다.
   값을 못 받았으면(끊김) 모른다 — 그때는 사 보게 둔다(플러그인이 알아서 답한다) */
export const notSold = id => priceTried && !(priceCache && priceCache[id]);

/* 사기. 답: { ok, coins } · { ok:false, why: off·cancel·pending·item·bad·other·owned·late·perm·down·net·auth } */
let busy = false;
export async function buyProduct(id){
  if (busy) return { ok: false, why: "busy" };
  if (!PRODUCTS.includes(id)) return { ok: false, why: "item" };
  if (!account.signedIn || !account.uid) return { ok: false, why: "auth" };
  /* 현금 결제는 구글 계정을 이은 사람만(2026-10-26 사용자 결정 A) — 게스트로 사면 앱을 지울 때 산 것이 사라지고,
     광고 제거는 구글이 "이미 가짐" 으로 막아 다시 살 수도 없다. 상점(shop.js)이 먼저 잇기를 권한다 */
  if (account.guest) return { ok: false, why: "guest" };
  const p = npOf(await plugin());
  if (!p) return { ok: false, why: "off" };
  busy = true;
  try {
    let t;
    const tag = await acctTag(account.uid);
    try {
      t = await queue(() => p.purchaseProduct({ productIdentifier: id, productType: "inapp", quantity: 1,
        isConsumable: Boolean(pack(id)), autoAcknowledgePurchases: false, appAccountToken: tag }));
    } catch(e){
      /* 플러그인은 거절로 알린다(문구·코드에 USER_CANCELED · ITEM_ALREADY_OWNED · Purchase is pending 등).
         사용자가 닫음 = cancel(말 없이) · 결제 대기 = pending · 이미 가짐 = 남은 결제를 다시 보내 보고 그 결과로 답한다
         (광고 제거를 다른 기기에서 샀음 · 코인 묶음을 샀는데 확인 전에 앱이 꺼짐) */
      const m = [e && e.code, e && e.message, e && e.errorMessage].filter(Boolean).join(" ") || String(e || "");
      if (/cancel/i.test(m)) return { ok: false, why: "cancel" };
      if (/pending/i.test(m)) return { ok: false, why: "pending" };
      if (/ALREADY_OWNED/i.test(m)){
        const got = await restoreAll();
        const mine = got.res.filter(x => x.id === id);
        if (id === NOADS) return account.noAds ? { ok: true, coins: 0 } : { ok: false, why: mine.some(x => x.why === "other") ? "other" : "late" };
        if (itemOfCash(id)) return owns(account, itemOfCash(id)) ? { ok: true, coins: 0 } : { ok: false, why: mine.some(x => x.why === "other") ? "other" : "late" };
        if (got.coins > 0) return { ok: true, coins: got.coins };
        return { ok: false, why: mine.some(x => x.why === "other") ? "other" : "late" };
      }
      return { ok: false, why: "fail", msg: m.slice(0, 120) };
    }
    if (!t || !t.purchaseToken) return { ok: false, why: "fail" };
    /* 결제 대기(편의점 결제 등) — 돈이 들어오면 구글이 끝내 주고, 다음에 켤 때 다시 보낸다 */
    if (String(t.purchaseState) === "2" || /pending/i.test(String(t.purchaseState || ""))) return { ok: false, why: "pending" };
    const r = await payVerify(id, t.purchaseToken);
    if (r.ok) return { ok: true, coins: r.coins };
    /* 돈은 냈는데 서버에 못 닿음(off = 서버 주소 없음·끊김) — "앱에서만" 이 아니라 "확인이 늦어짐" 으로(다음에 켤 때·돌아올 때 다시 보낸다) */
    return r.why === "off" ? { ok: false, why: "late" } : r;
  } finally { busy = false; }
}

/* 켤 때(그리고 앱으로 돌아올 때 — main.js) — 남은 결제를 서버에 다시 보낸다.
   restoreAll 답: { n: 새로 넣은 수, coins: 새로 넣은 코인, res: [{ id, ok, why }] } · restorePurchases 는 n 만 */
let restoring = null;
function restoreAll(){
  if (restoring) return restoring;
  restoring = (async () => {
    const out = { n: 0, coins: 0, res: [] };
    if (!account.signedIn || !account.uid) return out;
    const p = npOf(await plugin());
    if (!p) return out;
    let list = [];
    try { const r = await queue(() => p.getPurchases({ productType: "inapp" })); list = (r && r.purchases) || []; } catch(e){ return out; }
    for (const t of list){
      const id = t.productIdentifier;
      if (!t.purchaseToken || !PRODUCTS.includes(id)) continue;
      /* 결제 대기(편의점 결제 등)는 아직 보낼 것이 없다 — 끝나면 다음에 보낸다 */
      if (String(t.purchaseState) === "2") continue;
      /* 광고 제거는 계속 가지는 상품이라 늘 목록에 있다 — 이미 켜져 있고 확인도 끝났으면 보낼 것이 없다 */
      if (id === NOADS && account.noAds && t.isAcknowledged) continue;
      if (itemOfCash(id) && owns(account, itemOfCash(id)) && t.isAcknowledged) continue;     /* 스킨·배경도 같다 */
      const r = await payVerify(id, t.purchaseToken);
      out.res.push({ id, ok: Boolean(r.ok), why: r.ok ? "" : String(r.why || "") });
      if (r.ok && !r.dup){ out.n++; out.coins += Number(r.coins) || 0; }
    }
    return out;
  })().finally(() => { setTimeout(() => { restoring = null; }, 0); });
  return restoring;
}
export const restorePurchases = () => restoreAll().then(x => x.n);
