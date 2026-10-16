/* 진동 — 내 차례가 오면 폰을 짧게 떤다 (2026-10-06 사용자 요청)

   설정 창에서 켬/끔. 처음에는 켬. 이 기기에만 기억한다(localStorage "zk_vib").
   앱에서는 @capacitor/haptics, 웹에서는 브라우저 진동(되는 기기만).
   소리 끄기(음소거)와는 따로다 — 소리를 꺼 둔 사람일수록 진동이 필요하다.

   판 화면을 보고 있을 때를 기준으로 만들었다. 다른 앱으로 넘어가 있을 때는 안드로이드가
   이 앱을 멈춰 둘 수 있어 떨린다고 장담 못 한다(확실히 하려면 푸시 알림이 필요하다) */

const KEY = "zk_vib";

export function vibOn(){
  try { return localStorage.getItem(KEY) !== "0"; } catch(e){ return true; }
}
export function setVib(on){
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch(e){}
}

const isNative = () => Boolean(window.Capacitor && window.Capacitor.isNativePlatform &&
                               window.Capacitor.isNativePlatform());

/* 떤다. 꺼져 있으면 아무것도 안 한다. 실패해도 게임은 그대로 */
export async function buzz(ms = 200){
  if (!vibOn()) return false;
  /* 검사용 기록 — 언제 몇 번 떨었는지 */
  try { (window.__buzzed = window.__buzzed || []).push({ ms, at: Date.now() }); } catch(e){}
  try {
    if (isNative()){
      const { Haptics } = await import("@capacitor/haptics");
      await Haptics.vibrate({ duration: ms });
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.vibrate){ navigator.vibrate(ms); return true; }
  } catch(e){}
  return false;
}
