/* 처음 켤 때 받는 동의.

   광고를 넣었고 전 세계에 낼 것이라, 이용약관·개인정보처리방침 동의를 먼저 받아야 한다.
   동의하기 전에는 로그인 단추가 보이면 안 된다.

   쓰는 법:  node test/consent.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5961);
const { browser, page } = await open({ srv });
/* **지우는 것은 처음 한 번만.** 새로 그릴 때마다 지우면 "다시 켜도 안 묻는다" 를
   영영 확인할 수 없다 (실제로 그렇게 짰다가 헛실패했다) */
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("zk_lang", "ko"); } catch(e){} });
await page.reload({ waitUntil: "networkidle0" });
await page.evaluate(() => { try { localStorage.removeItem("zk_agree"); } catch(e){} });
await page.reload({ waitUntil: "networkidle0" });
await nap(700);

const see = () => page.evaluate(() => {
  const g = (id) => document.getElementById(id);
  const gate = document.querySelector("#entry .agree");
  return {
    gate: Boolean(gate) && !gate.hidden,
    go: g("agGo") ? g("agGo").disabled : null,
    start: g("start") ? !g("start").hidden : false,
    guest: g("testin") ? !g("testin").hidden : false,
    saved: (() => { try { return localStorage.getItem("zk_agree"); } catch(e){ return null; } })(),
  };
});

let v = await see();
check("동의 화면이 뜬다", v.gate, JSON.stringify(v));
check("동의 전에는 로그인 단추가 안 보인다", !v.start && !v.guest, JSON.stringify(v));
check("체크 전에는 시작 단추가 잠겨 있다", v.go === true);

/* 하나만 체크하면 아직 잠겨 있어야 한다 */
await page.evaluate(() => { const b = document.getElementById("agTerms"); b.click(); });
await nap(200);
v = await see();
check("하나만 체크하면 아직 잠겨 있다", v.go === true);

/* 글 보기 */
await page.evaluate(() => document.getElementById("agPrivV").click());
await nap(300);
const doc = await page.evaluate(() => {
  const d = document.getElementById("docBox");
  return d && !d.hidden ? {
    title: d.querySelector(".doc__title").textContent,
    len: d.querySelector(".doc__body").textContent.length,
    hasMail: /@/.test(d.querySelector(".doc__body").textContent),
  } : null;
});
check("처리방침 글이 열린다", Boolean(doc && doc.len > 200), doc ? doc.title + " " + doc.len + "자" : "안 열림");
check("문의처가 적혀 있다", Boolean(doc && doc.hasMail));
await page.evaluate(() => document.querySelector("#entry .doc__x").click());

/* 둘 다 체크 → 시작 */
await page.evaluate(() => { document.getElementById("agPriv").click(); });
await nap(200);
v = await see();
check("둘 다 체크하면 시작 단추가 열린다", v.go === false);

await page.evaluate(() => document.getElementById("agGo").click());
await nap(600);
v = await see();
check("동의하면 동의 화면이 사라진다", !v.gate, JSON.stringify(v));
check("동의하면 로그인 단추가 나온다", v.start, JSON.stringify(v));
check("동의를 기기에 적어 둔다", Boolean(v.saved), String(v.saved));

/* 껐다 켜도 다시 안 묻는다 */
await page.reload({ waitUntil: "networkidle0" });
await nap(700);
v = await see();
check("다시 켜도 안 묻는다", !v.gate && v.start, JSON.stringify(v));

/* ---- 기기에 저장이 막혀 있어도 넘어가야 한다 ----
   시크릿 모드나 저장 차단, 일부 껍데기 브라우저에서는 적어 둔 것을 다시 못 읽는다.
   그때 동의를 눌러도 **화면이 영영 안 넘어가면** 게임을 아예 못 한다 */
{
  const p2 = await browser.newPage();
  await p2.evaluateOnNewDocument(() => {
    /* 저장을 통째로 막는다 */
    const boom = () => { throw new Error("저장이 막혔습니다"); };
    try {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get(){ return { getItem: boom, setItem: boom, removeItem: boom }; },
      });
    } catch(e){}
  });
  await p2.goto("http://127.0.0.1:" + (srv.__port || 5961) + "/", { waitUntil: "networkidle0" });
  await nap(700);
  const before = await p2.evaluate(() => {
    const g = document.querySelector("#entry .agree");
    return Boolean(g) && !g.hidden;
  });
  check("저장이 막혀도 동의 화면은 뜬다", before);
  await p2.evaluate(() => {
    document.getElementById("agTerms").click();
    document.getElementById("agPriv").click();
    document.getElementById("agGo").click();
  });
  await nap(600);
  const after = await p2.evaluate(() => {
    const g = document.querySelector("#entry .agree");
    const st = document.getElementById("start");
    return { gate: Boolean(g) && !g.hidden, start: st ? !st.hidden : false };
  });
  check("저장이 막혀도 동의하면 넘어간다", !after.gate && after.start, JSON.stringify(after));
  await p2.close();
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
