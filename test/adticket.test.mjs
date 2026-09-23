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

/* ---- 전면 광고: **게임 한 판이 끝나고 로비로 나갈 때만** 한 번 ----
   판(라운드)이 끝날 때마다가 아니다. 그리고 **광고가 안 돼도 로비로 나가야** 한다 —
   광고 때문에 화면이 막히면 안 된다 */
{
  /* **화면을 먼저 세우고 그 다음에 깃발을 세운다.**
     결과 화면은 그려질 때 스스로 `__resultFinal` 을 다시 정한다 —
     먼저 세우면 덮어써진다 */
  const toResult = async (final) => {
    await page.evaluate(() => { if (window.__goto) window.__goto("result"); });
    await nap(300);
    await page.evaluate(f => { window.__resultFinal = f; }, final);
  };
  const scr = () => page.evaluate(() => (document.querySelector(".page.is-on")||{}).id);
  await page.evaluate(() => {
    window.__interShown = 0;
    window.__adInterTest = async () => { window.__interShown++; return { ok: true }; };
  });

  /* 라운드 결과에서 나가기 → 광고 없음 */
  await toResult(false);
  await page.evaluate(() => document.querySelector("#result #quit").click());
  await nap(500);
  check("라운드 결과에서 나갈 때는 전면 광고가 없다",
        (await page.evaluate(() => window.__interShown)) === 0,
        "뜬 횟수 " + (await page.evaluate(() => window.__interShown)));

  /* 게임이 끝난 결과에서 나가기 → 광고 한 번 */
  await toResult(true);
  await page.evaluate(() => document.querySelector("#result #quit").click());
  for (let i = 0; i < 20; i++){ if ((await scr()) === "lobby") break; await nap(200); }
  check("게임이 끝나고 나갈 때 전면 광고가 한 번 뜬다",
        (await page.evaluate(() => window.__interShown)) === 1,
        "뜬 횟수 " + (await page.evaluate(() => window.__interShown)));
  check("광고 뒤 로비로 간다", (await scr()) === "lobby", "화면 " + (await scr()));

  /* 같은 게임에서 또 나가도 두 번은 안 뜬다 */
  await toResult(true);
  await page.evaluate(() => document.querySelector("#result #quit").click());
  await nap(600);
  check("같은 게임에서 두 번은 안 뜬다",
        (await page.evaluate(() => window.__interShown)) === 1,
        "뜬 횟수 " + (await page.evaluate(() => window.__interShown)));

  /* 새 게임(뽑기 화면을 지나면) 다시 한 번 뜬다 */
  await page.evaluate(() => window.__goto && window.__goto("draw"));
  await nap(200);
  await toResult(true);
  await page.evaluate(() => document.querySelector("#result #quit").click());
  for (let i = 0; i < 20; i++){ if ((await scr()) === "lobby") break; await nap(200); }
  check("새 게임에서는 다시 한 번 뜬다",
        (await page.evaluate(() => window.__interShown)) === 2,
        "뜬 횟수 " + (await page.evaluate(() => window.__interShown)));

  /* 광고가 실패해도 로비로 나간다 */
  await page.evaluate(() => { window.__adInterTest = async () => { throw new Error("실패"); }; });
  await page.evaluate(() => window.__goto && window.__goto("draw"));
  await nap(200);
  await toResult(true);
  await page.evaluate(() => document.querySelector("#result #quit").click());
  let ok = false;
  for (let i = 0; i < 25; i++){ if ((await scr()) === "lobby"){ ok = true; break; } await nap(200); }
  check("광고가 실패해도 로비로 나간다", ok, "화면 " + (await scr()));
}

/* ---- 상단바 아래 단추 글자가 언어를 따라가는가 ----
   예전에는 한국어로 박혀 있어서 영어로 바꿔도 그대로였다 */
{
  const labels = () => page.evaluate(() => ({
    ad: (document.getElementById("adLabel")||{}).textContent || "",
    rank: (document.getElementById("rankLabel")||{}).textContent || "",
    friend: (document.getElementById("friendLabel")||{}).textContent || "",
  }));
  await page.evaluate(() => window.__goto && window.__goto("lobby"));
  await nap(400);
  const ko = await labels();
  check("한국어일 때 한국어로 뜬다", ko.ad === "광고 시청 티켓" && ko.rank === "랭킹",
        JSON.stringify(ko));
  await page.evaluate(() => {
    window.__lang = "en";
    try { localStorage.setItem("zk_lang", "en"); } catch(e){}
    window.dispatchEvent(new Event("langchange"));
  });
  await nap(400);
  const en = await labels();
  check("영어로 바꾸면 영어로 바뀐다",
        /[A-Za-z]/.test(en.ad) && /[A-Za-z]/.test(en.rank) && /[A-Za-z]/.test(en.friend),
        JSON.stringify(en));
}

/* ---- 게임이 끝나면 **"다시 하기" 가 없어야** 한다 ----
   예전에는 있었는데, 누르면 원래 방 대기실로 돌아갔다. 온라인에서는 같이 하던
   사람들이 따라올 리가 없어 말이 안 되는 흐름이었다. 게다가 그 길로는
   **티켓 없이 계속 게임**할 수 있었고, 전면 광고도 한 번도 안 뜰 수 있었다 */
{
  const setResult = async (roundNo, rounds) => {
    await page.evaluate((r, n) => {
      window.GAME = { roundNo: r, finish: [], score: [] };
      window.__opts = Object.assign(window.__opts || {}, { rounds: n });
      if (window.__goto) window.__goto("result");
      if (window.__bootResult) window.__bootResult();
    }, roundNo, rounds);
    await nap(350);
  };
  const nextBtn = () => page.evaluate(() => {
    const b = document.querySelector("#result #next");
    return b ? { hidden: b.hidden, text: b.textContent } : null;
  });

  await setResult(1, 3);            /* 판이 남았을 때 */
  let b = await nextBtn();
  check("판이 남았으면 '다음 판' 이 있다", b && !b.hidden && /다음 판|Next/.test(b.text),
        JSON.stringify(b));

  await setResult(3, 3);            /* 게임이 다 끝났을 때 */
  b = await nextBtn();
  check("게임이 끝나면 단추가 안 보인다", b && b.hidden === true, JSON.stringify(b));
  check("'다시 하기' 글자가 아예 없다", !/다시 하기|Play again/.test((b && b.text) || ""),
        (b && b.text) || "");

  /* 눌러도 아무 데도 안 간다 */
  await page.evaluate(() => { const x = document.querySelector("#result #next"); if (x) x.click(); });
  await nap(400);
  check("눌러도 화면이 안 바뀐다",
        (await page.evaluate(() => (document.querySelector(".page.is-on")||{}).id)) === "result");
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
