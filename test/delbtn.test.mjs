/* 계정 창의 **계정 삭제 단추** — 진짜 크롬에서 누른다.

   삭제 자체(파이어베이스)는 delacct.test.mjs 가 본다. 여기서는 화면만 —
   단추가 로그아웃 아래에 보이는가, 눌리는가, 확인창이 한 번 뜨는가,
   취소하면 안 지우는가, 지우는 동안 두 번 안 눌리는가, 끝나면 첫 화면으로 가는가,
   실패하면 이유를 띄우고 단추가 다시 살아나는가.

   쓰는 법:  node test/delbtn.test.mjs   */
import { serve, open, shut, ensureBuild, findBrowser, hit } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));
/* 눈으로 볼 사진 — SHOT_DIR 을 줄 때만 찍는다 */
const shot = name => process.env.SHOT_DIR
  ? page.screenshot({ path: process.env.SHOT_DIR + "/" + name + ".png" }).catch(() => {}) : null;

ensureBuild();
const srv = await serve(5000 + Math.floor(Math.random() * 900));
const { browser, page, logs } = await open({ srv });
const alerts = [];
page.on("dialog", async d => { alerts.push(d.message()); await d.dismiss(); });

/* 로그인한 것처럼 세우고, 삭제 함수는 가짜로 바꾼다(부른 횟수와 걸린 시간을 본다) */
async function setup(lang, behave){
  await page.evaluate((lang, behave) => {
    window.__lang = lang;
    Object.assign(window.ACCOUNT, { signedIn: true, loaded: true, guest: false, uid: "u1", name: "원규" });
    window.__delCalls = 0;
    window.deleteAccount = async () => {
      window.__delCalls++;
      await new Promise(r => setTimeout(r, 800));
      if (behave === "mismatch"){ const e = new Error("x"); e.code = "auth/user-mismatch"; throw e; }
      return { ok: true, authLeft: false, guest: false };
    };
    window.__openAcct();
  }, lang, behave);
  await wait(400);
}
const state = () => page.evaluate(() => {
  const d = document.getElementById("acDel"), o = document.getElementById("acOut");
  const r = e => e && e.getBoundingClientRect();
  const dr = r(d), or = r(o);
  const vis = e => Boolean(e && e.offsetParent !== null && !e.hidden);
  return {
    delText: d && d.textContent, delDis: d && d.disabled, delVis: vis(d),
    below: Boolean(dr && or && dr.top >= or.bottom - 1),
    ask: document.getElementById("ask").classList.contains("on"),
    askT: document.getElementById("askT").textContent,
    askM: document.getElementById("askM").textContent,
    askY: document.getElementById("askYes").textContent,
    acct: document.getElementById("acctBox").classList.contains("on"),
    entry: document.getElementById("entry").classList.contains("is-on"),
    calls: window.__delCalls,
  };
});

/* 진짜 손가락처럼 — 요소 가운데를 누른다 */
async function tap(sel){
  const b = await page.$(sel);
  const r = await b.boundingBox();
  await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2);
  await wait(250);
}

console.log("\n[한국어 · 성공]");
await page.evaluate(() => window.__goto && window.__goto("lobby"));
await wait(300);
await setup("ko", "ok");
let s = await state();
check("단추가 보인다 · 글자 '계정 삭제'", s.delVis && s.delText === "계정 삭제", JSON.stringify(s.delText));
check("로그아웃 아래에 있다", s.below);
check("누르면 단추가 받는다 (안 덮임)", (await hit(page, "#acDel")) === "자기자신", await hit(page, "#acDel"));
await shot("delbtn_ko");

await tap("#acDel");
s = await state();
check("확인창이 뜬다", s.ask && s.askT === "계정 삭제", s.askT + " / " + s.askM);
check("확인창 문구", s.askM === "모든 기록이 지워지고 되돌릴 수 없습니다" && s.askY === "삭제");
check("확인창만 뜨고 아직 안 지움", s.calls === 0);
await shot("delask_ko");

await tap("#askNo");
s = await state();
check("취소하면 창이 닫히고 안 지움", !s.ask && s.calls === 0 && s.acct);

await tap("#acDel");
await tap("#askYes");
s = await state();
check("삭제를 누르면 한 번만 부른다", s.calls === 1, "calls=" + s.calls);
check("지우는 동안 단추가 잠긴다", s.delDis === true && s.delText === "지우는 중...", JSON.stringify(s.delText));
await tap("#acDel");
s = await state();
check("잠긴 동안 다시 눌러도 확인창이 안 뜨고 안 부른다", !s.ask && s.calls === 1);
await wait(1000);
s = await state();
check("끝나면 계정 창이 닫히고 첫 화면으로", !s.acct && s.entry);
check("성공이면 알림 없음", alerts.length === 0, alerts.join(" | "));

console.log("\n[다른 구글 계정을 고른 경우]");
await page.evaluate(() => window.__goto && window.__goto("lobby"));
await wait(300);
await setup("ko", "mismatch");
await tap("#acDel");
await tap("#askYes");
await wait(1100);
s = await state();
check("이유를 띄운다", alerts.length === 1 && alerts[0].includes("지금 로그인한 구글 계정을 골라 주세요"), alerts.join(" | "));
check("계정 창은 그대로", s.acct && !s.entry);
check("단추가 다시 살아난다", s.delDis === false && s.delText === "계정 삭제", JSON.stringify(s.delText));

console.log("\n[영어]");
alerts.length = 0;
await page.evaluate(() => { document.getElementById("acctBox").classList.remove("on"); });
await setup("en", "ok");
s = await state();
check("단추 글자 'Delete account'", s.delText === "Delete account", JSON.stringify(s.delText));
await tap("#acDel");
s = await state();
check("확인창 영어", s.askT === "Delete account" && s.askY === "Delete" &&
  s.askM === "All your records will be erased for good", s.askM);
await tap("#askNo");

/* 확인창 설명은 한 줄 — 좁은 폰(360px)에서도 */
console.log("\n[좁은 화면 360px]");
await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 2 });
for (const lang of ["ko", "en"]){
  await page.evaluate(() => document.getElementById("acctBox").classList.remove("on"));
  await setup(lang, "ok");
  await tap("#acDel");
  const m = await page.evaluate(() => {
    const e = document.getElementById("askM");
    const lh = parseFloat(getComputedStyle(e).lineHeight) || 20;
    const d = document.getElementById("acDel").getBoundingClientRect();
    return { lines: Math.round(e.getBoundingClientRect().height / lh), delIn: d.bottom <= innerHeight };
  });
  check(lang + " 설명 한 줄", m.lines === 1, m.lines + "줄");
  check(lang + " 삭제 단추가 화면 안", m.delIn);
  await tap("#askNo");
}

const errs = logs.filter(l => /^ERROR/.test(l));
check("페이지 오류 없음", errs.length === 0, errs.join(" | ").slice(0, 300));

shut(srv, browser);
console.log("\n계정 삭제 단추: " + pass + "/" + fail);
process.exit(fail ? 1 : 0);
