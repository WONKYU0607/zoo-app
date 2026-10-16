/* 화면 읽기(TalkBack)용 단추 이름 — 화면에는 안 보이는 글자 (2026-10-10 사용자 요청)

   마크업 곳곳에 한 가지 말로만 적혀 있었다. 영어 화면에서도 "나가기"·"닫기"를 한국어로 읽고,
   한국어 화면에서는 "close"·"settings" 를 영어로 읽었다.
   알려진 이름을 고른 말로 바꿔 둔다. 언어를 바꿀 때, 새 창이 그려질 때, 누가 이름을 바꿔 적을 때 따라 바꾼다.
   새 단추에 이름을 달 때는 아래 표에 한 줄 넣으면 된다 */

const PAIRS = [
  ["나가기", "Leave"],
  ["닫기", "Close"],
  ["뒤로", "Back"],
  ["방 번호", "Room code"],
  ["감정표현", "Emotes"],
  ["소리 끄기", "Mute"],
  ["소리 켜기", "Unmute"],
  ["설정", "Settings"],
  ["프로필", "Profile"],
  ["이름 바꾸기", "Rename"],
];
/* 예전에 영어로만 적어 둔 이름 */
const ALIAS = { close: "닫기", settings: "설정", profile: "프로필", rename: "이름 바꾸기" };

const KEY = new Map();
const EN = {};
for (const [ko, en] of PAIRS){ KEY.set(ko, ko); KEY.set(en.toLowerCase(), ko); EN[ko] = en; }
for (const [a, ko] of Object.entries(ALIAS)) KEY.set(a, ko);

const cur = () => (window.__lang === "en" ? "en" : "ko");

/* 이 말로 된 이름 — 표에 없으면 그대로 */
export function ariaText(ko, lang = cur()){ return lang === "en" ? (EN[ko] || ko) : ko; }

function fix(el, lang){
  if (!el || !el.getAttribute) return;
  const v = el.getAttribute("aria-label");
  if (!v) return;
  const k = KEY.get(v.trim().toLowerCase());
  if (!k) return;                                  /* 표에 없는 이름(얼굴 이름 등)은 손대지 않는다 */
  const want = lang === "en" ? EN[k] : k;
  if (v !== want) el.setAttribute("aria-label", want);
}

export function paintAria(root = document){
  const lang = cur();
  root.querySelectorAll("[aria-label]").forEach(e => fix(e, lang));
}

export function installAria(){
  paintAria();
  window.addEventListener("langchange", () => paintAria());
  /* 새로 붙는 것과 이름이 바뀐 것만 본다 — 판 화면은 자주 바뀌어서 전체를 매번 훑지 않는다 */
  try {
    new MutationObserver(recs => {
      const lang = cur();
      for (const r of recs){
        if (r.type === "attributes"){ fix(r.target, lang); continue; }
        r.addedNodes.forEach(n => {
          if (n.nodeType !== 1) return;
          fix(n, lang);
          if (n.querySelectorAll) n.querySelectorAll("[aria-label]").forEach(e => fix(e, lang));
        });
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label"] });
  } catch(e){}
}
