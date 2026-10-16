/* 업데이트 강제 안내 (2026-10-09 요청 A1)

   앱이 켜질 때·다시 앞으로 나올 때 서버의 /zoo/version 을 보고, 내 빌드(versionCode)가
   최소 버전보다 낮으면 **닫을 수 없는** 안내창을 띄운다 → "업데이트" 를 누르면 플레이스토어.
   서버에 못 붙거나 내 빌드를 모르면 막지 않는다 — 확인 실패로 멀쩡한 사람을 막으면 안 된다.
   최소 버전은 서버의 Fly 비밀값 ZOO_MIN_BUILD (없으면 0) */
import { appInfo, openExternal } from "./appinfo.js";
import { serverUrl } from "./lobby.js";

const T = {
  ko: { t: "업데이트가 필요합니다", m: "새 버전이 나왔습니다. 계속하려면 플레이스토어에서 업데이트해 주세요.", go: "업데이트" },
  en: { t: "Update required", m: "A new version is out. Please update from Google Play to keep playing.", go: "Update" },
};

export function updateOpen(){ return Boolean(document.getElementById("updGate")); }

function showGate(store){
  if (updateOpen()) return;
  const t = T[window.__lang] || T.ko;
  const g = document.createElement("div");
  g.id = "updGate";
  g.className = "cfg on upd";               /* 설정 창과 같은 틀. role=dialog 를 안 달아 뒤로가기로 안 닫힌다 */
  g.innerHTML =
    '<div class="cfg__v"></div><div class="cfg__p">' +
    '<div class="cfg__h"><span id="updT"></span></div>' +
    '<div class="cfg__b"><p class="upd__m" id="updM"></p>' +
    '<div class="cfg__row"><button id="updGo"></button></div></div></div>';
  (document.getElementById("stage") || document.body).appendChild(g);
  g.querySelector("#updT").textContent = t.t;
  g.querySelector("#updM").textContent = t.m;
  g.querySelector("#updGo").textContent = t.go;
  g.querySelector("#updGo").addEventListener("click", () => openExternal(store));
}

/* 돌려주는 값: true = 막았다 */
export async function checkUpdate(){
  const info = await appInfo();
  if (!info || !Number.isFinite(info.build) || !info.build) return false;
  const base = serverUrl();
  if (!base) return false;
  let r = null;
  try {
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    const to = ac ? setTimeout(() => ac.abort(), 5000) : null;
    const res = await fetch(base + "/zoo/version", ac ? { signal: ac.signal } : undefined);
    if (to) clearTimeout(to);
    if (!res.ok) return false;
    r = await res.json();
  } catch(e){ return false; }
  const min = Number(r && r.minBuild) || 0;
  if (info.build < min){
    showGate(String((r && r.store) || "https://play.google.com/store/apps/details?id=com.wonkyu.zoopresident"));
    return true;
  }
  return false;
}
