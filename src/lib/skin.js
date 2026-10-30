/* 카드 스킨 · 판 배경 — 상점에서 산 것을 화면에 입힌다 (2026-10-26 상점)

   카드 스킨 = **뒷면 + 앞면 그림 한 벌**(사용자 결정). 번호는 계정 문서의 deck / bg (서버만 적는다 — 상점 장착).
   안 가진 번호가 적혀 있으면 기본(0)으로 본다(shop.js worn).
   그림 자리(사용자가 그림을 주면 넣는다 — 지금은 기본 0번만 있다):
     카드 스킨 N  public/assets/deck_N/back.webp · card_01~12.webp · joker_a.webp · joker_b.webp
     판 배경 N    public/assets/tablebg_N.webp
   **CSS 변수로 입힌다** — 판·뽑기·세금·대기실 CSS 가 var(--skin-back) · var(--skin-table) 을 쓴다.
   <img> 로 그리는 곳(카드 앞면·뽑기/세금의 뒷면)은 cardSrc() · myBack() 으로 주소를 받는다.

   **켤 때 바로 입힌다** — 계정 문서를 받기 전에도 지난번 것이 보이게 이 기기에 적어 둔다(zk_skin).
   이 값은 보이는 것뿐이다. 무엇을 가졌는지는 서버가 정한다 */
import { worn, DECK_PRICE, BG_PRICE } from "./shop.js";

const CARD = n => (n === 13 ? "joker_a" : n === 14 ? "joker_b" : "card_" + String(n).padStart(2, "0"));
export const backSrc = d => (d > 0 ? "assets/deck_" + d + "/back.webp" : "assets/back.webp");
export const bgSrc = n => (n > 0 ? "assets/tablebg_" + n + ".webp" : "assets/tablebg.webp");
/* 카드 앞면 — 1~12 는 숫자, 13·14 는 카멜레온 둘 */
export const cardSrc = (n, d = now.deck) => (d > 0 ? "assets/deck_" + d + "/" : "assets/") + CARD(n) + ".webp";

const now = { deck: 0, bg: 0 };
export const skinNow = () => ({ ...now });
/* 지금 입은 카드 뒷면 그림 주소 — <img> 용 */
export const myBack = () => backSrc(now.deck);

/* ---------- 카드 이름 — 스킨마다 다르다 (2026-10-27 신화 왕국: 동물이 아니라 신화 생물 · 조커는 프리스트) ----------
   이름표가 없는 스킨(얼음 왕국 = 같은 동물)은 기본 이름. 카드 위 이름 · 세금/뽑기 안내 글이 이것을 쓴다.
   규칙 보기(대기실)는 기본 카드 그대로 둔다 */
const BASE_N = {
  ko: ["사자","호랑이","불곰","코끼리","악어","여우","기린","멧돼지","원숭이","토끼","새","생쥐"],
  en: ["LION","TIGER","BEAR","ELEPHANT","CROCODILE","FOX","GIRAFFE","BOAR","MONKEY","RABBIT","BIRD","MOUSE"],
  joker: { ko: "카멜레온", en: "CHAMELEON", one: "chameleon", many: "chameleons" },
};
const DECK_N = {
  2: {
    ko: ["드래곤","피닉스","그리핀","유니콘","크라켄","키메라","메갈로돈","미노타우로스","메두사","구미호","가고일","고블린"],
    en: ["DRAGON","PHOENIX","GRIFFIN","UNICORN","KRAKEN","CHIMERA","MEGALODON","MINOTAUR","MEDUSA","GUMIHO","GARGOYLE","GOBLIN"],
    joker: { ko: "프리스트", en: "PRIEST", one: "priest", many: "priests" },
  },
};
const names = (d = now.deck) => DECK_N[d] || BASE_N;
/* 카드 위 이름 — n 1~12 숫자 카드, 13·14 조커 */
export const cardName = (n, lang, d) => {
  const t = names(d);
  return n >= 13 ? t.joker[lang === "ko" ? "ko" : "en"] : t[lang === "ko" ? "ko" : "en"][n - 1];
};
/* 안내 글 속 조커 이름 — 한국어는 카드와 같은 말, 영어는 소문자(한 장 one · 여러 장 many) */
export const jokerWord = (lang, form = "one", d) => {
  const j = names(d).joker;
  return lang === "ko" ? j.ko : j[form === "many" ? "many" : "one"];
};
/* 한국어 조사 — 받침 있으면 a(은·이·을), 없으면 b(는·가·를). "카멜레온은" · "프리스트는" */
export const josa = (word, a, b) => {
  const c = String(word || "").charCodeAt(String(word || "").length - 1);
  if (!(c >= 0xAC00 && c <= 0xD7A3)) return word + b;
  return word + ((c - 0xAC00) % 28 ? a : b);
};

function paint(deck, bg){
  now.deck = deck; now.bg = bg;
  if (typeof document === "undefined") return;
  const s = document.documentElement.style;
  /* 산 판 배경은 기본 판보다 밝다 — 그 위 글씨를 또렷하게 하는 CSS 가 이 표시를 본다(base.css "판 배경 위 글씨") */
  document.documentElement.dataset.skinBg = String(bg);
  /* 카드 스킨마다 카드 테두리·숫자 색이 다르다(얼음 왕국 = 얼음색) — base.css "카드 스킨 테두리" 가 이 표시를 본다 */
  document.documentElement.dataset.skinDeck = String(deck);
  s.setProperty("--skin-back", "url(/" + backSrc(deck) + ")");
  s.setProperty("--skin-table", "url(/" + bgSrc(bg) + ")");
  /* 미리 받아 둔다 — 판에 들어서는 순간 그림이 늦게 떠 바탕이 한 번 비어 보이지 않게 */
  try { if (typeof Image !== "undefined"){ new Image().src = "/" + bgSrc(bg); new Image().src = "/" + backSrc(deck); } } catch(e){}
  document.querySelectorAll("img[data-skin-back]").forEach(im => { im.src = backSrc(deck); });
}

/* 계정 값으로 입힌다. 계정이 없으면(로그아웃) 기본 */
export function applySkin(acct){
  const a = acct || {};
  if (!a.loaded) return;                     /* 계정을 아직 못 읽었다 — 켤 때 입힌 지난번 것을 그대로 둔다(깜빡이지 않게) */
  const deck = a.signedIn ? worn(a, "deck") : 0;
  const bg = a.signedIn ? worn(a, "bg") : 0;
  if (deck === now.deck && bg === now.bg && document.documentElement.style.getPropertyValue("--skin-back")) return;
  paint(deck, bg);
  try { localStorage.setItem("zk_skin", JSON.stringify({ deck, bg })); } catch(e){}
}

/* 켤 때 — 지난번 것으로 먼저 */
export function bootSkin(){
  let v = null;
  try { v = JSON.parse(localStorage.getItem("zk_skin") || "null"); } catch(e){ v = null; }
  /* 표에 없는 번호(옛 값·고친 값)는 기본 — 없는 그림을 부르지 않게 */
  const n = (x, len) => { const k = Math.max(0, Math.floor(Number(x) || 0)); return k < len ? k : 0; };
  paint(v ? n(v.deck, DECK_PRICE.length) : 0, v ? n(v.bg, BG_PRICE.length) : 0);
}
