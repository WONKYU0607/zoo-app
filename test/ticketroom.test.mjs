/* **티켓이 없으면 방을 못 만든다.**

   2026-09-29 신고: "티켓이 없는데 방만들기가 가능함."
   예전에는 방을 다 만들고 친구에게 번호까지 알려 준 뒤, 시작을 누르는 순간에야
   "티켓이 없습니다" 가 떴다. 들어가기 전에 막아야 한다.

   보는 것:
     - 티켓 0이면 "방 만들기" 단추가 잠기고, 왜 막혔는지 설명 줄에 적힌다
     - 그 상태로 눌러도 방 만들기 창이 안 열린다
     - 티켓이 생기면 다시 풀리고 설명 줄도 원래대로 돌아온다
     - 시간이 지나 티켓이 차면(30분에 한 장) 화면이 저절로 풀린다
     - 빠른 참가·번호로 들어가기는 안 막는다 (티켓은 방을 여는 쪽이 낸다)

   쓰는 법:  node test/ticketroom.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

if (!(await findBrowser())){
  console.log("\n크롬이 없어 건너뜁니다\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5912);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("zk_lang", "ko"); } catch(e){} });
await page.reload({ waitUntil: "networkidle0" });
await page.evaluate(() => window.__goto && window.__goto("lobby"));
await nap(500);

const setTickets = (n, at) => page.evaluate((k, a) => {
  window.ACCOUNT.loaded = true;
  window.ACCOUNT.tickets = k;
  if (a != null) window.ACCOUNT.ticketAt = a;
  window.dispatchEvent(new Event("accountchange"));
}, n, at);
const look = () => page.evaluate(() => {
  const b = document.querySelector("#lobby #btNew");
  const h = document.querySelector("#lobby #hNew");
  const o = document.querySelector("#opts");
  return { dis: Boolean(b && b.disabled),
           hint: h ? h.textContent.trim() : "",
           warn: Boolean(h && h.classList.contains("hint--warn")),
           optOpen: Boolean(o && (o.classList.contains("is-open") || o.classList.contains("is-on"))),
           quick: Boolean(document.querySelector("#lobby #btQuick").disabled),
           join: Boolean(document.querySelector("#lobby #btJoin").disabled) };
});

/* ---- 티켓이 있을 때 ---- */
await setTickets(2);
let v = await look();
const hintFull = v.hint;
check("티켓이 있으면 방 만들기가 눌린다", !v.dis);
check("설명 줄은 원래 안내다", !v.warn && /번호/.test(v.hint), JSON.stringify(v.hint.slice(0, 20)));

/* ---- 티켓이 0일 때 ---- */
await setTickets(0);
v = await look();
check("**티켓이 0이면 방 만들기가 잠긴다**", v.dis);
check("**왜 막혔는지 알려 준다**", v.warn && /티켓/.test(v.hint), JSON.stringify(v.hint));
check("빠른 참가는 안 막는다 (티켓은 방을 여는 쪽이 낸다)", !v.quick);
check("번호로 들어가기도 안 막는다", !v.join);

/* 잠긴 단추를 눌러도 창이 안 열린다.
   `disabled` 라 진짜 누름은 안 들어가므로, 처리기를 직접 때려 본다 —
   계정을 늦게 읽어 단추가 아직 안 잠긴 경우까지 같이 본다 */
await page.evaluate(() => {
  const b = document.querySelector("#lobby #btNew");
  b.disabled = false;                       /* 아직 안 잠긴 척 */
  b.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await nap(300);
v = await look();
check("**잠긴 채로 눌러도 방 만들기 창이 안 열린다**", !v.optOpen);
check("눌러 보면 단추가 다시 잠긴다", (await look()).dis);

/* ---- 티켓이 생기면 풀린다 ---- */
await setTickets(1);
v = await look();
check("티켓이 생기면 다시 풀린다", !v.dis);
check("설명 줄도 원래대로", !v.warn && v.hint === hintFull);

/* ---- 시간이 지나 저절로 차는 경우 ----
   30분에 한 장이므로, 마지막 기록 시각을 31분 전으로 돌려 놓으면
   1초 뒤 초읽기가 돌 때 화면이 스스로 풀려야 한다 */
await setTickets(0, Date.now());
check("(준비) 0장이라 잠겼다", (await look()).dis);
/* **알림 없이 시각만 되돌린다.** 이래야 "아무 일도 안 일어났는데 화면이 스스로
   풀리는가" 를 본다 — accountchange 를 같이 쏘면 그 힘으로 풀려 버려서 뜻이 없다 */
await page.evaluate(() => { window.ACCOUNT.ticketAt = Date.now() - 31 * 60 * 1000; });
await nap(1600);
v = await look();
const got = await page.evaluate(() => window.ACCOUNT.tickets);
check("**시간이 지나 찬 티켓이 화면에 반영된다**", got >= 1, "보유 " + got + "장");
check("**저절로 다시 풀린다**", !v.dis);

shut(srv, browser);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
