/* 상점 화면 (2026-10-26 사용자 결정)

   탭: 얼굴 · 카드 · 판 배경 · 이모티콘 · 티켓 · 코인 · 광고 제거
     이모티콘 — **묶음**(2026-10-29 사용자 결정 — 신화 이모티콘 5종). 카드·판 배경처럼 미리보기 창에서 보고 코인/현금으로 산다.
                장착은 없다 — 사면 판의 감정표현이 두 줄(열 개)이 된다(table.js emoList)
     얼굴·카드·판 배경 — **새 그림이 오면 넣는 자리**(사용자가 그림을 만들어 준다). 파는 것이 없으면 그 탭은 안 보인다.
                        카드 = 뒷면 + 앞면 그림 한 벌. 안 가진 것을 누르면 "N코인에 살까요?" → 사면 바로 장착. 가진 것은 누르면 장착
                        **카드·판 배경은 현금으로도 산다**(2026-10-27) — 칸에 코인 값과 구글 값을 같이 적고, 누르면 "코인으로 / ₩…" 를 고른다.
                        현금을 못 쓰는 때(웹 · 콘솔에 아직 없는 상품 · 값을 못 받음)는 예전처럼 코인으로만
     티켓 — 코인으로 한 장
     코인 — **현금(구글 플레이)으로 코인 묶음**. 원화 값은 플레이 콘솔의 값이 그대로 보인다(billing.js)
     광고 제거 — **현금만**. 사면 게임 끝 광고가 안 나오고, 티켓을 광고 없이 하루 5장 받는다
   값은 shop.js(서버와 똑같은 표)에서 읽어 보여 줄 뿐이고, **사기·장착·코인은 서버가 한다**(account.js → 서버 /zoo/shop/* · /zoo/pay/verify).
   프로필 창의 잠긴 상점 얼굴도 같은 길(window.__shopTap)로 산다 */
import "../styles/lobby.css";
import "../styles/shop.css";
import { account, buyItem, equipItem, TICKET_MAX } from "../lib/account.js";
import { item, owns, worn, forSale, PACKS, NOADS, FREE_TICKET_DAY, cashOf } from "../lib/shop.js";
import { AVATARS, EMOTES } from "../lib/assets.js";
import { bubText, fitBub } from "../lib/emobub.js";
import { backSrc, bgSrc, cardSrc, cardName } from "../lib/skin.js";
import { prices, buyProduct, billingOn, notSold } from "../lib/billing.js";

export const T = {
  ko: {
    title: "상점",
    tabs: { avatar: "얼굴", deck: "카드", bg: "판 배경", emote: "이모티콘", ticket: "티켓", coins: "코인", noads: "광고 제거" },
    emote: n => ["기본 이모티콘", "신화 이모티콘"][n] || "이모티콘 " + n,
    deck: n => ["기본 카드", "얼음 왕국", "신화 왕국", "조선 궁중"][n] || "카드 " + n, bg: n => ["기본 판", "황금 정원", "얼음 성채", "용암 동굴"][n] || "판 " + n, ticket: "티켓 1장",
    pack: n => "코인 " + n.toLocaleString(),
    noadsName: "광고 제거",
    noadsWhat: ["게임이 끝날 때 광고 제거", "광고 없이 티켓 하루 " + FREE_TICKET_DAY + "장"],
    bought: "구매함", appOnly: "앱에서 살 수 있습니다", priceWait: "…", soon: "준비 중",
    have: "보유", on: "장착 중", base: "기본", wait: "처리 중",
    tickets: n => "보유 " + n + "/" + TICKET_MAX,
    full: "가득",
    linkT: "구글 계정 잇기",
    linkM: "현금 결제는 구글 계정을 이은 뒤에 가능합니다.",
    linkY: "구글 계정 잇기",
    signin: "로그인이 필요합니다.",
    buyT: "구매",
    buyM: (name, p) => name + " — " + p.toLocaleString() + "코인에 살까요?",
    buyWear: "사면 바로 장착합니다.",
    buyY: "구매",
    buyBoth: (name, p, cash) => name + " — " + p.toLocaleString() + "코인 또는 " + cash + "에 살 수 있습니다.",
    byCoin: p => p.toLocaleString() + "코인", byCash: c => c, orCash: c => "또는 " + c,
    tkM: p => "티켓 1장을 " + p.toLocaleString() + "코인에 살까요?",
    pvWear: "장착", pvOn: "장착 중", pvBase: "기본", pvOff: "해제",
    poorT: "코인이 모자랍니다",
    poorM: n => n.toLocaleString() + "코인이 부족합니다. 게임을 끝까지 마치면 등수에 따라 코인을 받습니다.",
    fullT: "티켓이 가득 찼습니다",
    fullM: "티켓은 최대 " + TICKET_MAX + "장까지입니다.",
    ok: "확인",
    done: { wear: "장착했습니다", ticket: "티켓 1장을 구매했습니다", coins: n => "코인 +" + n.toLocaleString(), noads: "광고 제거를 구매했습니다", emote: "구매했습니다", off: "해제했습니다" },
    pay: {
      pending: "결제가 아직 끝나지 않았습니다. 결제가 끝나면 자동으로 들어옵니다.",
      late: "결제는 됐지만 확인이 늦어지고 있습니다. 앱을 다시 켜면 들어옵니다. 3일 안에 확인되지 않으면 자동으로 환불됩니다.",
      fail: "결제를 하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      bad: "이 결제를 확인하지 못했습니다. 계속되면 문의해 주세요.",
      off: "결제는 앱에서만 할 수 있습니다.",
      owned: "이미 산 상품입니다.",
      soon: "아직 준비 중인 상품입니다.",
      guest: "현금 결제는 구글 계정을 이은 뒤에 가능합니다.",
    },
    err: {
      auth: "로그인이 필요합니다. 다시 로그인해 주세요.",
      off: "지금은 상점을 사용할 수 없습니다.",
      down: "지금은 살 수 없습니다. 잠시 뒤 다시 시도해 주세요.",
      net: "서버에 닿지 못했습니다. 인터넷 연결을 확인하고 다시 해 주세요.",
      account: "계정을 찾지 못했습니다. 앱을 다시 켜 주세요.",
    },
    errT: "상점",
  },
  en: {
    title: "Shop",
    tabs: { avatar: "Faces", deck: "Cards", bg: "Tables", emote: "Emotes", ticket: "Tickets", coins: "Coins", noads: "No Ads" },
    emote: n => ["Basic Emotes", "Mythic Emotes"][n] || "Emotes " + n,
    deck: n => ["Classic", "Ice Kingdom", "Mythic Realm", "Joseon Court"][n] || "Deck " + n, bg: n => ["Classic", "Golden Garden", "Ice Citadel", "Lava Cavern"][n] || "Table " + n, ticket: "1 ticket",
    pack: n => n.toLocaleString() + " coins",
    noadsName: "No Ads",
    noadsWhat: ["No ad when a game ends", "Get " + FREE_TICKET_DAY + " tickets a day without watching ads"],
    bought: "Purchased", appOnly: "Available in the app", priceWait: "…", soon: "Coming soon",
    have: "Owned", on: "Equipped", base: "Default", wait: "Working",
    tickets: n => "Have " + n + "/" + TICKET_MAX,
    full: "Full",
    linkT: "Link Google account",
    linkM: "Link a Google account to buy with real money.",
    linkY: "Link Google",
    signin: "Please sign in.",
    buyT: "Buy",
    buyM: (name, p) => "Buy " + name + " for " + p.toLocaleString() + " coins?",
    buyWear: "It will be equipped right away.",
    buyY: "Buy",
    buyBoth: (name, p, cash) => "Get " + name + " for " + p.toLocaleString() + " coins or " + cash + ".",
    byCoin: p => p.toLocaleString() + " coins", byCash: c => c, orCash: c => "or " + c,
    tkM: p => "Buy 1 ticket for " + p.toLocaleString() + " coins?",
    pvWear: "Equip", pvOn: "Equipped", pvBase: "Default", pvOff: "Unequip",
    poorT: "Not enough coins",
    poorM: n => "You need " + n.toLocaleString() + " more coins. Finish games to earn coins by place.",
    fullT: "Tickets full",
    fullM: "You can hold up to " + TICKET_MAX + " tickets.",
    ok: "OK",
    done: { wear: "Equipped", ticket: "Bought 1 ticket", coins: n => "+" + n.toLocaleString() + " coins", noads: "No Ads purchased", emote: "Purchased", off: "Unequipped" },
    pay: {
      pending: "Your payment isn't finished yet. It will arrive automatically once it completes.",
      late: "Your payment went through but confirmation is delayed. Reopen the app to receive it. It is refunded automatically if it isn't confirmed within 3 days.",
      fail: "The payment didn't go through. Please try again shortly.",
      bad: "We couldn't verify this payment. Contact us if it keeps happening.",
      off: "Payments are available in the app only.",
      owned: "You already own this.",
      soon: "This item isn't available yet.",
      guest: "Link a Google account to buy with real money.",
    },
    err: {
      auth: "Please sign in again.",
      off: "The shop isn't available right now.",
      down: "Can't buy right now. Please try again shortly.",
      net: "Couldn't reach the server. Check your connection and try again.",
      account: "Couldn't find your account. Please restart the app.",
    },
    errT: "Shop",
  },
};

/* 꾸미기 탭은 파는 것이 있을 때만 (그림이 오면 저절로 보인다) */
const ALL_TABS = ["avatar", "deck", "bg", "emote", "ticket", "coins", "noads"];
const LOOKS = ["avatar", "deck", "bg", "emote"];                   /* 파는 것이 있을 때만 보이는 탭 */
const tabsNow = () => ALL_TABS.filter(k => !LOOKS.includes(k) || forSale(k).length > 0);
/* 미리보기 창에서 보고 사는 것 · 장착이 없는 것(이모티콘 — 사면 끝) */
const PV_KIND = k => k === "deck" || k === "bg" || k === "emote";
const NO_WEAR = k => k === "emote";
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const L = () => T[window.__lang] || T.ko;
const coinsOf = () => Math.max(0, Math.floor(Number(account.coins) || 0));

/* 물건 이름 */
export function nameOf(id){
  const t = L();
  if (id === NOADS) return t.noadsName;
  const pk = PACKS.find(p => p.id === id);
  if (pk) return t.pack(pk.coins);
  const it = item(id);
  if (!it) return "";
  if (it.kind === "avatar"){ const a = AVATARS[it.n] || {}; return (window.__lang === "en" ? a.en : a.ko) || ""; }
  if (it.kind === "deck") return t.deck(it.n);
  if (it.kind === "bg") return t.bg(it.n);
  if (it.kind === "emote") return t.emote(it.n);
  return t.ticket;
}

/* ---------- 사기 · 장착 (상점 화면과 프로필 창이 같이 쓴다) ---------- */
let busy = "";                                   /* 지금 처리 중인 물건 — 두 번 누르기 막기 */
let flash = null, flashTimer = null;             /* 잠깐 보이는 알림 { id, text } */
const listeners = new Set();
const repaint = () => listeners.forEach(f => { try { f(); } catch(e){} });
function say(id, text){
  flash = { id, text };
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flash = null; repaint(); }, 1800);
  repaint();
}
const ask = (...a) => { if (window.__ask) window.__ask(...a); };
const tell = (title, msg) => ask(title, msg, L().ok, null, null, true);

async function run(id, fn, okText, cash){
  busy = id; repaint();
  let r;
  try { r = await fn(); } catch(e){ r = { ok: false, why: "net" }; }
  busy = ""; repaint();
  if (r && r.ok){ if (okText) say(id, typeof okText === "function" ? okText(r) : okText); return true; }
  const t = L();
  const why = (r && r.why) || "down";
  if (why === "cancel" || why === "busy") return false;                                /* 결제 창을 닫았다 — 말 없이 */
  if (why === "coins") tell(t.poorT, t.poorM(Math.max(1, Number(r.need) || 1)));
  else if (why === "full") tell(t.fullT, t.fullM);
  else if (PAY.has(id) || cash) tell(t.errT, why === "pending" ? t.pay.pending : why === "fail" ? t.pay.fail : why === "off" ? t.pay.off :
    why === "owned" ? t.pay.owned : why === "guest" ? t.pay.guest : why === "bad" || why === "other" || why === "item" || why === "canceled" ? t.pay.bad : t.pay.late);
  else tell(t.errT, t.err[why] || t.err.down);
  return false;
}
const PAY = new Set([...PACKS.map(p => p.id), NOADS]);

/* 누름 — 상태에 따라 사기 / 장착 / 안내 */
export function tap(id){
  const t = L();
  if (busy) return;
  if (!account.signedIn){ tell(t.errT, t.signin); return; }
  /* 현금 — 구글 플레이 결제 창이 값을 다시 보여 주므로 따로 묻지 않는다 */
  if (PAY.has(id)){
    if (id === NOADS && account.noAds) return;
    /* 게스트는 먼저 구글 계정을 잇게 한다 (2026-10-26 사용자 결정 A) */
    if (account.guest){ ask(t.linkT, t.linkM, t.linkY, () => { if (window.__linkFlow) window.__linkFlow(); }); return; }
    if (notSold(id)){ tell(t.errT, t.pay.soon); return; }
    run(id, () => buyProduct(id), r => (id === NOADS ? t.done.noads : t.done.coins(r.coins || 0)));
    return;
  }
  const it = item(id);
  if (!it) return;
  const coins = coinsOf();
  if (it.kind === "ticket"){
    if ((Number(account.tickets) || 0) >= TICKET_MAX){ tell(t.fullT, t.fullM); return; }
    if (coins < it.price){ tell(t.poorT, t.poorM(it.price - coins)); return; }
    ask(t.buyT, t.tkM(it.price), t.buyY, () => { run(id, () => buyItem(id), t.done.ticket); });
    return;
  }
  if (owns(account, id)){
    if (PV_KIND(it.kind) && preview){ preview(id); return; }   /* 가진 것도 미리보기(그 안에 장착) */
    if (NO_WEAR(it.kind)) return;
    if (worn(account, it.kind) === it.n) return;                       /* 이미 장착 중 */
    run(id, () => equipItem(id), t.done.wear);
    return;
  }
  if (!it.sale) return;
  /* 카드·판 배경·이모티콘은 미리보기 창에서 보고 산다(2026-10-27) — 상점 화면이 떠 있으면 그 창으로 */
  if (PV_KIND(it.kind) && preview){ preview(id); return; }
  const byCoins = async () => {
    if (NO_WEAR(it.kind)){ await run(id, () => buyItem(id), t.done.emote); return; }
    const ok = await run(id, () => buyItem(id), "");
    if (ok) await run(id, () => equipItem(id), t.done.wear);
  };
  const wearNote = NO_WEAR(it.kind) ? "" : " " + t.buyWear;
  /* 현금으로도 살 수 있으면(구글 값을 받음) 둘 중 고른다 — 오른쪽(눈에 띄는 단추)이 현금, 왼쪽이 코인 */
  const pid = cashOf(id), cp = cashPrice(pid);
  if (cp){
    ask(t.buyT, t.buyBoth(nameOf(id), it.price, cp) + wearNote, t.byCash(cp), () => {
      if (account.guest){ ask(t.linkT, t.linkM, t.linkY, () => { if (window.__linkFlow) window.__linkFlow(); }); return; }
      (async () => { const ok = await run(id, () => buyProduct(pid), NO_WEAR(it.kind) ? t.done.emote : "", true); if (ok && !NO_WEAR(it.kind)) await run(id, () => equipItem(id), t.done.wear); })();
    }, null, false, { label: t.byCoin(it.price), fn: () => {
      if (coinsOf() < it.price){ tell(t.poorT, t.poorM(it.price - coinsOf())); return; }
      byCoins();
    } });
    return;
  }
  if (coins < it.price){ tell(t.poorT, t.poorM(it.price - coins)); return; }
  ask(t.buyT, t.buyM(nameOf(id), it.price) + wearNote, t.buyY, byCoins);
}
/* 미리보기 창의 단추가 부르는 것 — 코인으로 · 현금으로 · 장착 (산 뒤에는 바로 장착) */
let preview = null;                              /* 상점 화면이 붙인 "미리보기 열기" */
function coinBuy(id){
  const t = L(), it = item(id);
  if (!it || busy) return;
  if (coinsOf() < it.price){ tell(t.poorT, t.poorM(it.price - coinsOf())); return; }
  const nw = NO_WEAR(it.kind);
  ask(t.buyT, t.buyM(nameOf(id), it.price) + (nw ? "" : " " + t.buyWear), t.buyY, async () => {
    const ok = await run(id, () => buyItem(id), nw ? t.done.emote : "");
    if (ok && !nw) await run(id, () => equipItem(id), t.done.wear);
  });
}
function cashBuy(id){
  const t = L(), pid = cashOf(id);
  if (!pid || busy) return;
  if (account.guest){ ask(t.linkT, t.linkM, t.linkY, () => { if (window.__linkFlow) window.__linkFlow(); }); return; }
  const nw = NO_WEAR((item(id) || {}).kind);
  (async () => { const ok = await run(id, () => buyProduct(pid), nw ? t.done.emote : "", true); if (ok && !nw) await run(id, () => equipItem(id), t.done.wear); })();
}
function wearIt(id){ if (!busy) run(id, () => equipItem(id), L().done.wear); }
/* 해제 — 기본(0번)으로 되돌린다. 기본 카드·기본 판 칸은 상점에서 뺐다(2026-10-29 사용자: "기본카드랑 기본판은 빼" — 되돌리기는 "해제" 단추로) */
function unwear(id){
  const it = item(id);
  if (!it || busy) return;
  run(id, () => equipItem(it.kind + ":0"), L().done.off);
}

/* 스킨·배경의 구글 값 — 받은 값이 있고 팔고 있는 상품일 때만(없으면 "" → 코인으로만) */
let cashPrices = {};
function cashPrice(pid){
  if (!pid || notSold(pid)) return "";
  return (cashPrices[pid] && cashPrices[pid].price) || "";
}

/* ---------- 화면 ---------- */
const HTML = `
<div class="veil"></div>
<main class="screen">
  <div class="bar">
    <button class="navback" data-back="lobby" aria-label="뒤로">‹</button>
    <div class="bar__t" id="spBar"></div>
    <span class="sp__wallet" id="spWallet"><i class="coin-ic"></i><b id="spCoins">0</b></span>
  </div>
  <div class="body">
    <div class="cfg__row" id="spTabs"></div>
    <div class="sp__grid" id="spGrid"></div>
  </div>
</main>
<div class="cfg pv" id="spPv" role="dialog" aria-modal="true">
  <div class="cfg__v" data-pvclose></div>
  <div class="cfg__p pv__p">
    <div class="cfg__h"><span id="pvT"></span><button class="cfg__x" data-pvclose aria-label="close">\u00D7</button></div>
    <div class="pv__b" id="pvB"></div>
    <div class="pv__acts" id="pvA"></div>
  </div>
</div>`;

/* 상점 바탕 그림(shopbg.webp 852x1846 — 사용자 그림, 사바나 장터) 속 흙마당(타원) 자리.
   위쪽 장터는 그대로 보이게 두고 **탭·칸은 마당 안에** 놓는다. 그림은 cover 로 깔리므로 화면 비율에 따라
   위아래가 잘리는 만큼 마당 자리도 움직인다 → 그때그때 재서 CSS 변수로 넘긴다(table.js placeTable 과 같은 셈) */
const SB = { iw: 852, ih: 1846, top: 640, bot: 1650 };
function placeBg(root){
  const b = root.getBoundingClientRect();
  if (!b.width || !b.height) return;
  const sc = Math.max(b.width / SB.iw, b.height / SB.ih);
  const oy = (b.height - SB.ih * sc) / 2;
  root.style.setProperty("--ov-top", Math.round(oy + SB.top * sc) + "px");
  root.style.setProperty("--ov-bot", Math.max(0, Math.round(b.height - (oy + SB.bot * sc))) + "px");
}

export function mount(root){
  if (!root) return;
  root.innerHTML = HTML;
  const el = id => root.querySelector("#" + id);
  let tab = "";
  let price = {}, payOn = null;                  /* 구글 플레이 값 · 결제를 쓸 수 있는가(모르면 null) */

  async function loadPrices(){
    if (payOn === null) payOn = await billingOn();
    if (payOn) price = await prices();
    cashPrices = price;
    draw();
  }
  function idsOf(k){
    /* 파는 것만 — 기본 카드·기본 판(0번)은 2026-10-29 사용자 결정으로 뺐다. 기본으로 되돌리기는 장착 중인 것의 미리보기 "해제" */
    if (LOOKS.includes(k)) return forSale(k).map(x => x.id);
    if (k === "coins") return PACKS.map(p => p.id);
    if (k === "noads") return [NOADS];
    return ["ticket"];
  }
  function pic(id){
    if (id === NOADS) return '<span class="sp__pic sp__pic--noads"></span>';
    if (PAY.has(id)) return '<span class="sp__pic sp__pic--coins"><i class="coin-ic"></i></span>';
    const it = item(id);
    if (it.kind === "avatar") return '<span class="sp__pic sp__pic--avt" style="background-image:url(/' + (AVATARS[it.n] || AVATARS[0]).f + ')"></span>';
    if (it.kind === "deck") return '<span class="sp__pic sp__pic--deck"><i style="background-image:url(/' + backSrc(it.n) + ')"></i>' +
      '<i style="background-image:url(/' + cardSrc(1, it.n) + ')"></i></span>';
    if (it.kind === "bg") return '<span class="sp__pic sp__pic--bg" style="background-image:url(/' + bgSrc(it.n) + ')"></span>';
    if (it.kind === "emote") return '<span class="sp__pic sp__pic--emo">' +
      EMOTES.filter(e => e.pack === it.n).map(e => '<i style="background-image:url(/' + e.img + ')"></i>').join("") + '</span>';
    return '<span class="sp__pic sp__pic--tk"></span>';
  }
  function payCell(id){
    const t = L();
    const owned = id === NOADS && account.noAds;
    let st;
    if (busy === id) st = '<span class="sp__st sp__st--wait">' + t.wait + '</span>';
    else if (flash && flash.id === id) st = '<span class="sp__st sp__st--done">' + esc(flash.text) + '</span>';
    else if (owned) st = '<span class="sp__st sp__st--on">' + t.bought + '</span>';
    else if (payOn === false) st = '<span class="sp__st sp__st--have">' + t.appOnly + '</span>';
    else if (notSold(id)) st = '<span class="sp__st sp__st--have">' + t.soon + '</span>';
    else st = '<span class="sp__st sp__st--price">' + esc((price[id] && price[id].price) || t.priceWait) + '</span>';
    const what = id === NOADS ? '<span class="sp__what">' + t.noadsWhat.map(x => "<b>" + esc(x) + "</b>").join("") + '</span>' : "";
    return '<button class="sp__i sp__i--pay' + (id === NOADS ? " sp__i--noads" : "") + (owned ? " is-on" : "") + (busy === id ? " is-busy" : "") +
      '" data-item="' + id + '" aria-label="' + esc(nameOf(id)) + '">' + pic(id) + '<span class="sp__nm">' + esc(nameOf(id)) + '</span>' + what + st + '</button>';
  }
  function cell(id){
    if (PAY.has(id)) return payCell(id);
    const it = item(id); const t = L();
    const have = it.kind !== "ticket" && owns(account, id);
    const on = have && worn(account, it.kind) === it.n;
    const poor = !have && coinsOf() < it.price;
    const full = it.kind === "ticket" && (Number(account.tickets) || 0) >= TICKET_MAX;
    let st;
    if (busy === id) st = '<span class="sp__st sp__st--wait">' + t.wait + '</span>';
    else if (flash && flash.id === id) st = '<span class="sp__st sp__st--done">' + esc(flash.text) + '</span>';
    else if (on) st = '<span class="sp__st sp__st--on">' + t.on + '</span>';
    else if (have && NO_WEAR(it.kind)) st = '<span class="sp__st sp__st--on">' + t.bought + '</span>';   /* 이모티콘 — 장착 없이 "구매함" */
    else if (have) st = '<span class="sp__st sp__st--have">' + (it.price === 0 ? t.base : t.have) + '</span>';
    else st = '<span class="sp__st sp__st--price"><i class="coin-ic"></i>' + it.price.toLocaleString() + '</span>';
    const cp = !have && it.kind !== "ticket" && it.sale ? cashPrice(cashOf(id)) : "";
    const sub = it.kind === "ticket" ? '<span class="sp__sub">' + (full ? t.full + " · " : "") + t.tickets(Number(account.tickets) || 0) + '</span>'
      : cp && busy !== id && !(flash && flash.id === id) ? '<span class="sp__sub sp__sub--cash">' + esc(t.orCash(cp)) + '</span>' : "";
    return '<button class="sp__i sp__i--' + it.kind + (on ? " is-on" : "") + (have ? " is-have" : "") + (poor ? " is-poor" : "") +
      (full ? " is-full" : "") + (busy === id ? " is-busy" : "") + '" data-item="' + id + '" aria-label="' + esc(nameOf(id)) + '">' +
      pic(id) + '<span class="sp__nm">' + esc(nameOf(id)) + '</span>' + st + sub + '</button>';
  }
  function draw(){
    placeBg(root);
    const t = L();
    const tabs = tabsNow();
    if (!tabs.includes(tab)) tab = tabs[0];
    el("spBar").textContent = t.title;
    el("spCoins").textContent = coinsOf().toLocaleString();
    const row = el("spTabs");
    const want = tabs.join(",");
    if (row.dataset.tabs !== want){
      row.innerHTML = tabs.map(k => '<button data-k="' + k + '"></button>').join("");
      row.dataset.tabs = want;
    }
    row.querySelectorAll("button").forEach(b => {
      b.textContent = t.tabs[b.dataset.k];
      b.setAttribute("aria-pressed", String(b.dataset.k === tab));
    });
    const g = el("spGrid");
    g.className = "sp__grid sp__grid--" + tab;
    g.innerHTML = account.signedIn ? idsOf(tab).map(cell).join("") : '<p class="hint">' + t.signin + "</p>";
  }

  el("spTabs").addEventListener("click", e => {
    const b = e.target.closest("button[data-k]");
    if (!b || b.dataset.k === tab) return;
    tab = b.dataset.k;
    draw();
    el("spGrid").scrollTop = 0;
    if (tab !== "ticket" && !Object.keys(price).length) loadPrices();
  });
  el("spGrid").addEventListener("click", e => {
    const b = e.target.closest("[data-item]");
    if (b) tap(b.dataset.item);
  });
  /* ---------- 미리보기 (2026-10-27 사용자 요청) ----------
     카드 스킨: 뒷면 · 카멜레온(조커) 둘 · 1~12 열두 장을 그 스킨의 테두리 색으로 · 판 배경: 그림 전체.
     아래 단추: 안 가졌으면 현금(구글 값을 받았을 때) · 코인 / 가졌으면 장착하기 · 장착 중 */
  const pvBox = el("spPv");
  let pv = "";
  const mini = (d, n, w) => {
    const j = n >= 13;
    const num = j ? "" : String(n);
    const band = '<span class="pc__band"><b>' + num + '</b>' + (j ? '<i>' + esc(cardName(13, window.__lang, d)) + '</i>' : "") + '<b>' + num + '</b></span>';
    return '<span class="pc' + (j ? " pc--j" : "") + '" style="--w:' + w + 'px">' + band +
      '<span class="pc__art"><img src="/' + cardSrc(n, d) + '" alt="" loading="lazy"></span>' +
      '<span class="pc__band"><b>' + num + '</b><b>' + num + '</b></span></span>';
  };
  function pvDraw(){
    if (!pv) return;
    const t = L(), it = item(pv);
    if (!it) return;
    el("pvT").textContent = nameOf(pv);
    const b = el("pvB");
    if (b.dataset.id !== pv){
      b.dataset.id = pv;
      if (it.kind === "deck"){
        b.className = "pv__b pv__b--deck skin-d" + it.n;
        b.innerHTML = '<div class="pv__top"><span class="pv__back" style="background-image:url(/' + backSrc(it.n) + ')"></span>' +
          mini(it.n, 13, 66) + mini(it.n, 14, 66) + '</div>' +
          '<div class="pv__cards">' + Array.from({ length: 12 }, (_, i) => mini(it.n, i + 1, 40)).join("") + '</div>';
      } else if (it.kind === "emote"){
        /* 이모티콘 — 묶음 다섯 개를 판에서 뜨는 모습(말풍선 + 그림)으로 */
        const en = window.__lang === "en";
        b.className = "pv__b pv__b--emo";
        b.innerHTML = '<div class="pv__emos">' + EMOTES.filter(e => e.pack === it.n).map(e =>
          '<span class="pv__emo"><span class="pv__bub">' + esc(bubText(en ? e.en : e.ko)) + '</span>' +
          '<span class="pv__eimg" style="background-image:url(/' + e.img + ')"></span></span>').join("") + '</div>';
        requestAnimationFrame(() => b.querySelectorAll(".pv__bub").forEach(fitBub));
      } else {
        b.className = "pv__b pv__b--bg";
        b.innerHTML = '<span class="pv__table" style="background-image:url(/' + bgSrc(it.n) + ')"></span>';
      }
    }
    const have = owns(account, pv), on = have && worn(account, it.kind) === it.n;
    const cp = !have && it.sale ? cashPrice(cashOf(pv)) : "";
    const A = el("pvA");
    let h;
    if (busy === pv) h = '<button class="pv__btn" disabled>' + t.wait + '</button>';
    else if (have && NO_WEAR(it.kind)) h = '<button class="pv__btn" disabled>' + t.bought + '</button>';
    else if (on) h = '<button class="pv__btn" disabled>' + t.pvOn + '</button>' +
      (it.n > 0 ? '<button class="pv__btn" data-pv="off">' + t.pvOff + '</button>' : "");
    else if (have) h = '<button class="pv__btn pv__btn--main" data-pv="wear">' + t.pvWear + '</button>';
    else h = (cp ? '<button class="pv__btn pv__btn--main" data-pv="cash">' + esc(t.byCash(cp)) + '</button>' : "") +
      '<button class="pv__btn' + (cp ? "" : " pv__btn--main") + '" data-pv="coin"><i class="coin-ic"></i>' + it.price.toLocaleString() + '</button>';
    if (A.innerHTML !== h) A.innerHTML = h;
  }
  preview = id => { pv = id; el("pvB").dataset.id = ""; pvDraw(); pvBox.classList.add("on"); };
  const pvClose = () => { pvBox.classList.remove("on"); pv = ""; };
  pvBox.addEventListener("click", e => {
    if (e.target.closest("[data-pvclose]")){ pvClose(); return; }
    const b = e.target.closest("[data-pv]");
    if (!b || !pv) return;
    const k = b.dataset.pv;
    if (k === "coin") coinBuy(pv); else if (k === "cash") cashBuy(pv); else if (k === "wear") wearIt(pv); else if (k === "off") unwear(pv);
  });
  listeners.add(pvDraw);
  window.addEventListener("accountchange", pvDraw);
  window.addEventListener("langchange", () => { if (pv){ el("pvB").dataset.id = ""; pvDraw(); } });

  listeners.add(draw);
  window.addEventListener("accountchange", draw);
  window.addEventListener("langchange", draw);
  window.addEventListener("resize", () => placeBg(root));
  /* 화면에 들어올 때 — 탭은 그대로, 내용만 새로 */
  window.__bootShop = k => { if (k && tabsNow().includes(k)) tab = k; draw(); loadPrices(); };
  draw();
}

/* 프로필 창의 잠긴 상점 얼굴 등 — 상점 화면을 안 거치고 바로 사기 */
if (typeof window !== "undefined"){
  window.__shopTap = id => tap(id);
  window.__shopSub = f => { listeners.add(f); return () => listeners.delete(f); };
}
