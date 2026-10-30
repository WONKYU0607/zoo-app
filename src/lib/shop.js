/* 상점 — 파는 것·값·코인 받는 법 (2026-10-26 사용자 결정)

   **앱(src/lib/shop.js)과 서버(shop.js)가 똑같은 파일이다** — 값을 바꾸면 둘 다 바꾼다(검사 shoptest 가 같은지 본다).
   값을 정하는 것은 서버다. 앱은 같은 표로 화면에 값을 보여 줄 뿐이고, 사고팔기·코인은 서버만 적는다
   (점수·티켓과 같다 — 앱이 적으면 개발자도구로 숫자를 고쳐 공짜로 다 가진다).

   사용자 결정 (2026-10-26 두 번째):
     코인   한 게임(정한 판 수를 다 마침) 최종 등수 — 1등 100 · 2등 80 · 3등 60 · 4등 40 · 그 아래 20
            그날(한국 시각) 처음 마친 게임은 **누구나** +100
            **도중에 나가면 0** (보너스도 없음). 판 내내 안 뒀어도 끝까지 남아 있었으면 등수대로
     얼굴   지금 얼굴(0~14번)은 예전처럼 처음부터·점수로 연다. **얼굴은 상점에서 팔지 않는다**(2026-10-27 사용자 결정 —
            파는 것은 카드 스킨 · 판 배경 · 티켓 · 광고 제거(+ 코인 묶음)). AVT_SALE 은 비워 둔다(비면 얼굴 탭이 안 보인다)
     카드   카드 스킨 = **뒷면 + 앞면 그림 한 벌**(deck). 그림이 오면 DECK_PRICE 에 값을 넣는다
     판 배경 그림이 오면 BG_PRICE 에 값을 넣는다
     현금   코인 묶음 · 광고 제거 · **카드 스킨·판 배경도 현금으로 살 수 있다**(2026-10-27 사용자 결정 — 코인으로도, 현금으로도).
            스킨·배경 코인 값은 올렸다(A안 15,000 · 10,000 — 하루 10판이면 스킨 3주쯤). 현금 값은 플레이 콘솔에서 정한다(cashOf 의 상품 번호)
     광고 제거 **현금만**. 사면 게임 끝 전면 광고가 안 나오고, 티켓을 광고 없이 하루 5장 받는다
     이모티콘 **묶음으로 판다**(2026-10-29 사용자 결정) — 산 사람만 판에서 감정표현을 두 줄(열 개)로 고른다. 코인으로도 현금으로도
     광고 티켓 광고 보고 받는 티켓은 하루 5장까지

   내가 정한 값(사용자가 아직 숫자를 안 정함 — 바꾸기 쉽게 여기 한곳에): 서버 문제로 끝난 게임은 1등 몫(100)
   사용자 결정 (2026-10-29): 티켓 500코인. 코인 묶음 B안 — 값은 그대로(₩1,200 · ₩5,900 · ₩11,000, 플레이 콘솔에서 정함), 코인을 늘림
     4,500 · 23,000 · 45,000 (1원당 약 3.75 · 3.9 · 4.1코인 — 스킨 ₩3,900 = 15,000코인과 비슷하게, 큰 묶음이 조금 더 이득).
     상품 번호도 코인 수에 맞췄다(coins_4500 · coins_23000 · coins_45000 — 콘솔에 아직 안 만든 때 바꿈) */

export const COIN = { place: [100, 80, 60, 40], rest: 20, daily: 100, comp: 100 };
/* 최종 등수(0 = 1등)로 받는 코인. 등수를 모르면(-1·이상한 값) 가장 적은 몫 — 실수로 1등 몫이 나가지 않게 */
export function coinsFor(place){
  const p = Math.floor(Number(place));
  if (!Number.isFinite(p) || p < 0) return COIN.rest;
  return p < COIN.place.length ? COIN.place[p] : COIN.rest;
}

/* 주간 랭킹 보상 (2026-10-27 사용자 결정) — 한 주(월~일, 한국 시각)가 끝나면 그 주 1~10등에게 코인.
   1등 500 · 2등 300 · 3등 100 · 4~10등 50. 랭킹 화면과 같은 줄 세우기(게스트 빼고 · 그 주 점수 큰 순) — 서버 weeklyTick */
export const WEEK_PRIZE = [500, 300, 100, 50, 50, 50, 50, 50, 50, 50];

/* 하루에 받는 티켓 — 광고를 보고(누구나) · 광고 없이(광고 제거를 산 사람) */
export const AD_TICKET_DAY = 5;
export const FREE_TICKET_DAY = 5;

/* ---------- 얼굴 ----------
   0~14번: 앞 5개는 처음부터, 그 뒤 10개는 5,000점마다 하나씩(팔지 않는다)
   15번부터: 상점 얼굴 자리 — 2026-10-27 결정으로 팔지 않으므로 비워 둔다(계산·검사는 남겨 둠) */
export const AVT_FREE = 5;
export const AVT_SCORE = 15;                   /* 점수로 여는 얼굴까지의 개수(0~14) */
export const AVT_STEP = 5000;                  /* 점수로 열리는 간격 (firestore.rules 와 같다) */
export const AVT_SALE = [];
export const AVT_COUNT = AVT_SCORE + AVT_SALE.length;

/* ---------- 카드 스킨(뒷면 + 앞면 그림 한 벌) · 판 배경 ----------
   0번 = 기본. 1번부터 상점. 그림 자리: public/assets/deck_N/(back · card_01~12 · joker_a · joker_b).webp · tablebg_N.webp */
/* 카드 스킨 1 = 얼음 왕국 · 2 = 신화 왕국 · 3 = 조선 궁중 (2026-10-27 사용자 그림 — 테두리 색은 base.css "카드 스킨 테두리", 카드 이름은 skin.js).
   코인 값 15,000 (2026-10-27 사용자 결정 A안 — 처음 5,000 에서 올림. 현금으로도 산다) */
export const DECK_PRICE = [0, 15000, 15000, 15000];
/* 판 배경 1~3 (2026-10-26 사용자 그림 — 황금 정원 · 얼음 성채 · 용암 동굴). 코인 값 10,000 (2026-10-27 A안 — 처음 3,000 에서 올림) */
export const BG_PRICE = [0, 10000, 10000, 10000];
/* 이모티콘 묶음 — 1번 = 신화 이모티콘 5종(용·고블린·여우·메두사·미노타우로스 · assets.js EMOTES 의 pack 1).
   코인 7,500 · 현금 상품 emote_1(원화 값은 플레이 콘솔 — 1,900원) (2026-10-29 사용자 결정). 장착은 없다 — 가지면 판에서 쓴다.
   0번(기본 다섯 개)은 누구나 가졌고 팔지 않는다 */
export const EMO_PRICE = [0, 7500];
/* 묶음에 든 감정표현 번호(k — 판 쪽지로 오가는 값). **산 사람만 보낸다** — 게임 서버가 쪽지를 받을 때 보낸 사람이 그 묶음을 가졌는지 본다
   (server.js 이모티콘 지킴 · 2026-10-29 사용자 결정 "막아"). 그림·글은 앱 assets.js EMOTES — 거기 pack 과 같아야 한다(shop.test 가 본다) */
export const EMO_PACKS = { 1: ["dragon", "goblin", "fox", "medusa", "minotaur"] };
export function emoPackOf(k){
  for (const [n, ks] of Object.entries(EMO_PACKS)) if (ks.includes(String(k))) return Number(n);
  return 0;
}
export const TICKET_PRICE = 500;

/* ---------- 현금(구글 플레이) ----------
   상품 번호는 플레이 콘솔의 "인앱 상품" 번호와 **똑같아야** 한다. 원화 값은 콘솔에서 정하고, 여기는 몇 코인을 줄지만 */
export const PACKS = [
  { id: "coins_4500", coins: 4500 },
  { id: "coins_23000", coins: 23000 },
  { id: "coins_45000", coins: 45000 },
];
export const NOADS = "noads";                  /* 광고 제거 — 한 번 사면 계속(소모하지 않는다) */
export const pack = id => PACKS.find(p => p.id === String(id || "")) || null;
/* 카드 스킨·판 배경·이모티콘의 현금 상품 번호 — "deck:1" ↔ "deck_1" · "bg:2" ↔ "bg_2" · "emote:1" ↔ "emote_1" (플레이 콘솔 인앱 상품 번호와 같아야 한다).
   광고 제거처럼 **한 번 사면 계속 가지는 상품**(소모하지 않음 — 구글 계정에 남아 다시 깔아도 돌아온다) */
const cashList = (kind, prices) => prices.map((_, n) => ({ id: kind + ":" + n, product: kind + "_" + n })).slice(1);   /* 0번(기본)은 안 판다 */
export const CASH_ITEMS = [...cashList("deck", DECK_PRICE), ...cashList("bg", BG_PRICE), ...cashList("emote", EMO_PRICE)];
export const cashOf = id => (CASH_ITEMS.find(x => x.id === String(id || "")) || {}).product || "";
export const itemOfCash = pid => (CASH_ITEMS.find(x => x.product === String(pid || "")) || {}).id || "";
/* 계속 가지는 현금 상품인가 (광고 제거 · 스킨 · 배경 · 이모티콘) — 코인 묶음만 소모한다 */
export const keeps = pid => String(pid || "") === NOADS || Boolean(itemOfCash(pid));
export const PRODUCTS = [...PACKS.map(p => p.id), NOADS, ...CASH_ITEMS.map(x => x.product)];

/* 파는 것(코인으로). kind: ticket / avatar / deck / bg / emote. n = 그 종류 안의 번호(장착할 때 적는 값). sale = 상점에서 파는가 */
export const ITEMS = [
  { id: "ticket", kind: "ticket", price: TICKET_PRICE, sale: true },
  ...Array.from({ length: AVT_SCORE }, (_, n) => ({ id: "avt:" + n, kind: "avatar", n, price: 0, sale: false })),
  ...AVT_SALE.map((price, i) => ({ id: "avt:" + (AVT_SCORE + i), kind: "avatar", n: AVT_SCORE + i, price, sale: true })),
  ...DECK_PRICE.map((price, n) => ({ id: "deck:" + n, kind: "deck", n, price, sale: n > 0 })),
  ...BG_PRICE.map((price, n) => ({ id: "bg:" + n, kind: "bg", n, price, sale: n > 0 })),
  ...EMO_PRICE.map((price, n) => ({ id: "emote:" + n, kind: "emote", n, price, sale: n > 0 })),
];
const BY_ID = new Map(ITEMS.map(x => [x.id, x]));
export const item = id => BY_ID.get(String(id || "")) || null;
/* 장착하는 칸 — 계정 문서의 avatar / deck / bg (숫자). 이모티콘은 장착이 없다(SLOT 에 없음 — 서버 장착이 "item" 으로 거절) */
export const SLOT = { avatar: "avatar", deck: "deck", bg: "bg" };
const PREFIX = { avatar: "avt:", deck: "deck:", bg: "bg:" };
export const itemId = (kind, n) => PREFIX[kind] + Math.floor(Number(n) || 0);
/* 검사용 — 파는 물건을 잠깐 더한다(그림이 아직 없어 파는 얼굴·카드가 비어 있을 때 계산 검사용). 서버·앱은 부르지 않는다 */
export function _addTestItem(it){ ITEMS.push(it); BY_ID.set(it.id, it); }
/* 지금 상점에 내놓은 것 — 종류별 (비어 있으면 그 탭을 안 보인다) */
export const forSale = kind => ITEMS.filter(x => x.kind === kind && x.sale);

/* 점수로 열린 얼굴인가 (0~14번만) */
export const scoreOpen = (d, n) => n < AVT_FREE || (n < AVT_SCORE && (Number(d && d.score) || 0) >= (n - AVT_FREE + 1) * AVT_STEP);

/* 가졌는가. 기본(값 0)은 누구나 가졌다. 티켓은 "가지는" 물건이 아니다 */
export function owns(d, id){
  const it = item(id);
  if (!it || it.kind === "ticket") return false;
  if (it.kind === "avatar" && it.n < AVT_SCORE) return scoreOpen(d, it.n);
  if (it.price === 0) return true;
  const owned = Array.isArray(d && d.owned) ? d.owned : [];
  return owned.includes(it.id);
}

/* 장착된 번호가 가진 것인지 — 아니면 기본(0)으로 본다(남의 화면에도 이 값으로 보인다) */
export function worn(d, kind){
  const n = Math.floor(Number(d && d[SLOT[kind]]) || 0);
  return owns(d, itemId(kind, n)) ? n : 0;
}

/* 한국 시각 날짜 "2026-10-26" — 하루 첫 판 보너스 · 하루 티켓 */
export function kstDay(at){
  const d = new Date((at ? +new Date(at) : Date.now()) + 9 * 3600 * 1000);
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}
/* 오늘 몇 장 받았나 — {day, n} 이 오늘 것이 아니면 0 */
export const todayCount = (day, n, now) => (day === kstDay(now) ? Math.max(0, Math.floor(Number(n) || 0)) : 0);
