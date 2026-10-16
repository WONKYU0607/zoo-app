/* 이 앱의 버전 — 안드로이드 빌드의 versionName / versionCode (2026-10-09)
   웹(검사·Vercel)에서는 build 가 없다(null). 검사는 window.__appBuildForTest 로 흉내 낸다 */
let cached = null;
const isNative = () => Boolean(window.Capacitor && window.Capacitor.isNativePlatform &&
                               window.Capacitor.isNativePlatform());

export async function appInfo(){
  if (window.__appBuildForTest != null)
    return { version: String(window.__appVersionForTest || "test"), build: Number(window.__appBuildForTest) };
  if (cached) return cached;
  if (!isNative()) return (cached = { version: "web", build: null });
  try {
    const { App } = await import("@capacitor/app");
    const i = await App.getInfo();
    cached = { version: String(i.version || ""), build: Number(i.build) || null };
  } catch(e){ cached = { version: "?", build: null }; }
  return cached;
}

/* 바깥 앱으로 연다 — 플레이스토어·메일. 캐패시터는 우리 주소가 아닌 곳으로 가면
   안드로이드에 넘겨 해당 앱(플레이스토어·메일 앱)이 열린다. 검사는 window.__openUrlHook 으로 가로챈다 */
export function openExternal(url){
  if (typeof window.__openUrlHook === "function"){ window.__openUrlHook(url); return; }
  window.location.href = url;
}
