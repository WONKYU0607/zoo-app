/* 별점 요청 (2026-10-09 요청 B1)

   게임을 **끝까지** 3번 마친 사람에게 구글 공식 별점 창을 한 번 띄운다(최종 결과 화면, 1.5초 뒤).
   도중에 나간 게임은 안 센다. 한 번 띄웠으면 다시는 안 띄운다(이 기기 기준).
   구글이 창을 실제로 보여 줄지는 구글이 정한다(횟수 제한) — 안 떠도 오류가 아니다.
   플레이스토어로 깐 앱에서만 뜬다(안드로이드 스튜디오로 바로 깐 것은 안 뜰 수 있다) */
const K_DONE = "zk_done", K_ASK = "zk_rv";
export const REVIEW_AFTER = 3;

const get = k => { try { return localStorage.getItem(k); } catch(e){ return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch(e){} };
const isNative = () => Boolean(window.Capacitor && window.Capacitor.isNativePlatform &&
                               window.Capacitor.isNativePlatform());

async function requestReview(){
  if (typeof window.__reviewHook === "function"){ window.__reviewHook(); return; }    /* 검사용 */
  if (!isNative()) return;
  try {
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
  } catch(e){}
}

/* 게임을 끝까지 마쳤을 때 부른다. 돌려주는 값: 이번에 별점 창을 부르는가 */
export function noteGameDone(){
  const n = (Number(get(K_DONE)) || 0) + 1;
  set(K_DONE, String(n));
  if (n < REVIEW_AFTER || get(K_ASK) === "1") return false;
  set(K_ASK, "1");
  setTimeout(requestReview, 1500);
  return true;
}
