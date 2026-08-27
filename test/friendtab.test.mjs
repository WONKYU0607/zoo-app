/* 친구 창에서 **탭을 옮길 때 창이 움직이는가**.

   목록 / 추가 / 순위는 줄 수가 다르고, "추가" 탭에는 찾기 칸이 더 붙는다.
   높이를 내용에 맡기면 탭을 옮길 때마다 창이 통째로 내려갔다 올라갔다 해서
   눈이 따라가기 힘들다는 신고가 있었다.

   진짜 크롬에서 창의 좌표를 직접 재서, 탭을 옮겨도 **자리가 그대로인지** 본다.

   쓰는 법:  node test/friendtab.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};

ensureBuild();
const srv = await serve(5761);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  /* 친구 자료는 파이어베이스에서 온다. `window.__friends` 가 유일한 통로라 여기에 물린다., 탭마다 **줄 수가 크게 다른** 가짜 자료를 물린다.
     높이가 바뀌는 상황을 일부러 만들어야 튀는지 알 수 있다 */
  window.__friends = {
    listFriends: async () => Array.from({ length: 8 }, (_, i) =>
      ({ uid: "u" + i, name: "친구" + i, online: i % 2 === 0, state: "lobby" })),
    incoming: async () => [{ uid: "r1", name: "요청" }],
    friendRank: async () => Array.from({ length: 3 }, (_, i) =>
      ({ uid: "u" + i, name: "친구" + i, score: 100 - i, mine: i === 0 })),
  };
});
await page.reload({ waitUntil: "networkidle0" });

const has = await page.evaluate(() => typeof window.__openFriends === "function");
check("친구 창을 열 수 있다", has);
if (!has){ console.log(""); shut(srv, browser); process.exit(1); }

await page.evaluate(() => window.__openFriends());
await new Promise(r => setTimeout(r, 700));

const box = () => page.evaluate(() => {
  const p = document.querySelector("#frBox .cfg__p");
  if (!p) return null;
  const r = p.getBoundingClientRect();
  return { top: Math.round(r.top), h: Math.round(r.height), bottom: Math.round(r.bottom) };
});
const tap = async (name) => {
  await page.evaluate(n => {
    const b = document.querySelector('[data-frtab="' + n + '"]');
    if (b) b.click();
  }, name);
  await new Promise(r => setTimeout(r, 700));
};

const seen = [];
for (const t of ["list", "add", "rank", "list", "add"]){
  await tap(t);
  const b = await box();
  if (b) seen.push({ t, ...b });
}
console.log("  " + seen.map(s => s.t + " 위 " + s.top + " 높이 " + s.h).join(" · "));

const tops = seen.map(s => s.top), hs = seen.map(s => s.h);
const spreadTop = Math.max(...tops) - Math.min(...tops);
const spreadH = Math.max(...hs) - Math.min(...hs);
check("탭을 옮겨도 창이 위아래로 안 움직인다", spreadTop <= 2, "위쪽이 " + spreadTop + "px 움직임");
check("탭을 옮겨도 창 높이가 안 바뀐다", spreadH <= 2, "높이가 " + spreadH + "px 바뀜");

/* 줄이 많아도 창이 커지지 않고 안에서 굴러가야 한다 */
const scrolls = await page.evaluate(() => {
  const b = document.querySelector("#frBody");
  if (!b) return null;
  const cs = getComputedStyle(b);
  return { overflow: cs.overflowY, fits: b.scrollHeight > b.clientHeight };
});
check("줄이 넘치면 창 안에서 굴러간다", Boolean(scrolls && /auto|scroll/.test(scrolls.overflow)),
      scrolls ? "overflow-y: " + scrolls.overflow : "몸통 없음");

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
