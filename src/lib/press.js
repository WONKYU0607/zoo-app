/* 네이티브처럼 — **손이 닿는 순간** 눌림 표시 (2026-10-26 사용자 "네이티브처럼 하게 만들어 줘")

   "게임 시작·나가기·알림 상자 버튼 터치가 조금 느려 보이고 네이티브랑 다르게 부자연스럽다".
   폰을 흉내 낸 크롬으로 재 보니 둘이었다:
     1. 버튼을 누르고 있는 동안 아무 반응이 없다 — 눌림 모양을 CSS `:active` 로만 그렸는데,
        안드로이드 크롬·웹뷰는 스크롤인지 탭인지 가리느라 `:active` 를 바로 안 켠다(0.38초 누르는 동안 0, 손을 뗀 뒤에야 켜짐).
     2. 손을 떼면 버튼 위에 웹 기본 터치 강조(파란 반투명 사각형)가 덮인다 → base.css 에서 끈다.
   네이티브 앱은 닿는 순간 눌린다. 그래서 pointerdown 에서 곧바로 `.is-press` 를 단다.
   모양은 원래 `:active` 모양 그대로다(각 CSS 의 :active 규칙 옆에 .is-press 를 같이 적었다).
   자기 눌림 모양이 없던 단추(×, ‹, 랭킹·친구·광고, 판 수 −/+, 스위치 등)는 살짝 어두워진다(base.css).

   - 손가락이 단추 밖으로 벗어나면 뗀다(그대로 떼면 눌리지 않는 것과 같다). 다시 들어와도 다시 안 단다(네이티브와 같음)
   - 스크롤이 시작되면 브라우저가 pointercancel 을 준다 → 뗀다
   - 아주 빨리 톡 친 것도 보이게 최소 110ms 는 남긴다
   - 꺼진 단추(disabled)는 안 눌린다
   - 판의 카드(손패·뽑기 카드)는 손대지 않는다 — 그쪽은 자기 반응(들어 올림·뒤집기)이 따로 있다 */

const PRESS = "button, a[href], [role=button], [data-back], #room .seat--empty";
const MIN_MS = 110;
const SLOP = 10;              /* 단추 밖으로 이만큼은 봐 준다 (손가락은 굵다) */

let cur = null;               /* { el, id, t0, out } */

const pressable = el => el && !el.disabled && el.getAttribute("aria-disabled") !== "true";
function inside(el, x, y){
  const r = el.getBoundingClientRect();
  return x >= r.left - SLOP && x <= r.right + SLOP && y >= r.top - SLOP && y <= r.bottom + SLOP;
}
function drop(now){
  if (!cur) return;
  const c = cur; cur = null;
  const left = MIN_MS - (performance.now() - c.t0);
  if (now || c.out || left <= 0) c.el.classList.remove("is-press");
  else setTimeout(() => { if (!cur || cur.el !== c.el) c.el.classList.remove("is-press"); }, left);
}

export function installPress(root){
  const R = root || document;
  if (R.__pressOn) return;
  R.__pressOn = true;
  R.addEventListener("pointerdown", e => {
    if (e.button != null && e.button > 0) return;          /* 마우스 오른쪽 등 */
    const el = e.target && e.target.closest ? e.target.closest(PRESS) : null;
    if (cur) drop(true);                                    /* 다른 손가락이 먼저 누르고 있던 것 */
    if (!pressable(el)) return;
    cur = { el, id: e.pointerId, t0: performance.now(), out: false };
    el.classList.add("is-press");
  }, { capture: true, passive: true });
  /* 단추 밖으로 나가면 뗀다. **다시 들어와도 다시 달지 않는다** — 안드로이드 네이티브 단추가 그렇다
     (밖으로 나간 순간 그 누름은 취소). 스크롤이 되는 곳에서는 브라우저가 pointercancel 을 먼저 준다 */
  R.addEventListener("pointermove", e => {
    if (!cur || e.pointerId !== cur.id || cur.out) return;
    if (!inside(cur.el, e.clientX, e.clientY)){ cur.out = true; cur.el.classList.remove("is-press"); }
  }, { capture: true, passive: true });
  R.addEventListener("pointerup",     e => { if (cur && e.pointerId === cur.id) drop(false); }, true);
  R.addEventListener("pointercancel", e => { if (cur && e.pointerId === cur.id) drop(true); }, true);
  /* 앱이 내려가면 눌린 채로 남지 않게 */
  window.addEventListener("blur", () => drop(true));
  document.addEventListener("visibilitychange", () => { if (document.hidden) drop(true); });
}
