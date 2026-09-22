/* 광고 시청 티켓 단추.

   - 프로필 밑(상단바 아래 줄의 **왼쪽 끝**)에 있는가
   - 누르면 광고를 띄우고, **끝까지 봤을 때만** 티켓을 주는가
   - 중간에 닫으면 안 주는가
   - 보유 3장이면 잠기는가, 광고 보는 동안 잠기는가 (두 번 눌러 겹치면 안 된다)

   진짜 광고는 안드로이드 앱에서만 나오므로 여기서는 결과를 흉내낸다
   (`window.__adTest`, `window.__rewardTicket`).

   쓰는 법:  node test/adticket.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5911);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("zk_lang", "ko"); } catch(e){} });
await page.reload({ waitUntil: "networkidle0" });
await page.evaluate(() => window.__goto && window.__goto("lobby"));
await nap(500);

/* ---- 자리 ---- */
const pos = await page.evaluate(() => {
  const ad = document.querySelector("#lobby #btAd");
  const me = document.querySelector("#lobby #acctProfile");
  const rk = document.querySelector("#lobby [data-rankopen]");
  if (!ad || !me || !rk) return null;
  const a = ad.getBoundingClientRect(), m = me.getBoundingClientRect(), k = rk.getBoundingClientRect();
  return { adTop: a.top, meBottom: m.bottom, adLeft: a.left, meLeft: m.left, rkLeft: k.left,
           label: ad.textContent.trim(), w: a.width, h: a.height };
});
check("광고 단추가 있다", Boolean(pos), pos ? pos.label : "없음");
if (pos){
  check("프로필 밑에 있다", pos.adTop >= pos.meBottom - 2, "단추 위 " + Math.round(pos.adTop) + " · 프로필 아래 " + Math.round(pos.meBottom));
  check("줄의 왼쪽 끝이다 (랭킹 단추보다 왼쪽)", pos.adLeft < pos.rkLeft,
        "광고 " + Math.round(pos.adLeft) + " · 랭킹 " + Math.round(pos.rkLeft));
  check("글자가 틀 안에 들어간다", pos.w > 40 && pos.h > 10, Math.round(pos.w) + "x" + Math.round(pos.h));
}

/* 계정 티켓 수를 세팅한다 */
const setTickets = n => page.evaluate(k => {
  window.ACCOUNT.tickets = k;
  window.dispatchEvent(new Event("accountchange"));
}, n);
const disabled = () => page.evaluate(() => document.querySelector("#lobby #btAd").disabled);

/* 광고 결과·보상을 흉내낸다 */
await page.evaluate(() => {
  window.__given = 0;
  window.__rewardTicket = async () => {
    window.__given++;
    window.ACCOUNT.tickets = Math.min(3, (window.ACCOUNT.tickets || 0) + 1);
    window.dispatchEvent(new Event("accountchange"));
    return true;
  };
});

/* ---- 끝까지 보면 1장 ---- */
await setTickets(1);
check("2장 미만이면 눌린다", !(await disabled()));
await page.evaluate(() => { window.__adTest = () => new Promise(r => setTimeout(() => r({ ok: true }), 300)); });
await page.evaluate(() => document.querySelector("#lobby #btAd").click());
await nap(80);
check("광고 보는 동안 단추가 잠긴다 (겹침 방지)", await disabled());
await page.evaluate(() => document.querySelector("#lobby #btAd").click());   /* 한 번 더 눌러 본다 */
await nap(500);
check("끝까지 보면 티켓 1장 (두 번 눌러도 한 장)", (await page.evaluate(() => window.__given)) === 1,
      "준 횟수 " + (await page.evaluate(() => window.__given)));
check("보고 나면 다시 눌린다", !(await disabled()));

/* ---- 중간에 닫으면 안 준다 ---- */
await page.evaluate(() => { window.__given = 0; window.__adTest = async () => ({ ok: false, why: "dismissed" }); });
await setTickets(1);
await page.evaluate(() => document.querySelector("#lobby #btAd").click());
await nap(300);
check("중간에 닫으면 티켓을 안 준다", (await page.evaluate(() => window.__given)) === 0);

/* ---- 3장이면 잠긴다 ---- */
await setTickets(3);
check("보유 3장이면 잠긴다", await disabled());
await page.evaluate(() => { window.__given = 0; window.__adTest = async () => ({ ok: true }); });
await page.evaluate(() => document.querySelector("#lobby #btAd").click());
await nap(300);
check("3장일 때 눌러도 안 준다", (await page.evaluate(() => window.__given)) === 0);

/* ---- 2장에서 받으면 3장 → 잠김 ---- */
await setTickets(2);
await page.evaluate(() => document.querySelector("#lobby #btAd").click());
await nap(300);
check("2장에서 받으면 3장이 되고 잠긴다",
      (await page.evaluate(() => window.ACCOUNT.tickets)) === 3 && await disabled());

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
