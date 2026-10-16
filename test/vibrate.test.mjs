/* 내 차례 진동 (2026-10-06) — 진짜 서버 판에서 사람처럼 두며 본다.

   - 설정 창 "내 차례 진동" 켬/끔: 좌표로 누르면 바뀌고 기억한다
   - 내 차례가 올 때마다 한 번씩 떤다 (남의 차례에는 안 떤다)
   - 자동치기 중에는 안 떤다 (대신 두니까)
   - 끔이면 안 떤다
   진짜 폰 진동은 여기서 못 본다 — haptic.js 가 남기는 기록(window.__buzzed)으로 센다.
   쓰는 법:  node test/vibrate.test.mjs */
import { canRun, checker, launch, human, startServer, closeAll, nap, waitFor } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;

const srv = await startServer({ ZOO_BOT_JOIN_MS: "500", ZOO_BOT_MS: "350", NODE_ENV: "test" });
const env = await launch();
const H = await human(env, srv, "나");
await H.drv({ on: false, think: [300, 600] });
await H.page.evaluate(() => window.__goto("lobby"));

/* 좌표로 누른다 — 화면이 실제로 받는지 본다 */
const press = async sel => {
  const at = await H.page.evaluate(s => { const e = document.querySelector(s); if (!e) return null;
    const r = e.getBoundingClientRect(); if (!r.width) return null;
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const h = document.elementFromPoint(x, y); return { x, y, mine: Boolean(h && (h === e || e.contains(h))) }; }, sel);
  if (!at) return false;
  await H.page.mouse.click(at.x, at.y);
  return at.mine;
};

/* 설정 창은 아래에서 0.3초 동안 올라온다 — 다 올라온 뒤에 누른다(움직이는 중이면 좌표가 빗나간다) */
const settled = () => waitFor(async () => {
  const a = await H.page.evaluate(() => { const b = document.querySelector('#cfg [data-vib="0"]'); return b ? b.getBoundingClientRect().top : null; });
  await nap(120);
  const b = await H.page.evaluate(() => { const b = document.querySelector('#cfg [data-vib="0"]'); return b ? b.getBoundingClientRect().top : null; });
  const inView = await H.page.evaluate(() => { const b = document.querySelector('#cfg [data-vib="0"]');
    return Boolean(b && document.getElementById("cfg").classList.contains("on") && b.getBoundingClientRect().bottom <= innerHeight); });
  return a != null && a === b && inView;        /* 열리기 전 자리(화면 밖)에 멈춰 있는 것도 "멈춤" 이라 화면 안인지까지 본다 */
}, 3000, 50);
/* ---------- 설정 창 ---------- */
console.log("\n[설정 창]");
check("설정 단추가 손가락을 받는다", await press("#lobby .top__cfg"));
await settled();
const cfg = () => H.page.evaluate(() => {
  const b = [...document.querySelectorAll("#cfg [data-vib]")];
  return {
    label: (document.getElementById("cfgVibL") || {}).textContent,
    btn: b.map(x => ({ t: x.textContent, v: x.dataset.vib, p: x.getAttribute("aria-pressed") })),
    dim: b.map(x => Number(getComputedStyle(x).opacity)),
    inView: b.every(x => x.getBoundingClientRect().bottom <= innerHeight),
    saved: localStorage.getItem("zk_vib") };
});
let c = await cfg();
check("'내 차례 진동' 줄이 있고 처음엔 켬", c.label === "내 차례 진동" &&
  JSON.stringify(c.btn) === JSON.stringify([{ t: "켬", v: "1", p: "true" }, { t: "끔", v: "0", p: "false" }]), JSON.stringify(c));
check("고른 쪽은 또렷하고 안 고른 쪽은 흐리다", c.dim[0] === 1 && c.dim[1] < 0.6, JSON.stringify(c.dim));
check("단추가 화면 안에 다 보인다", c.inView);
check("'끔' 단추가 손가락을 받는다", await press('#cfg [data-vib="0"]'));
await nap(200);
c = await cfg();
check("끔을 누르면 끔으로 바뀌고 기억한다", c.saved === "0" && c.btn[1].p === "true" && c.btn[0].p === "false", JSON.stringify(c));
check("이제 '끔' 이 또렷하다", c.dim[1] === 1 && c.dim[0] < 0.6, JSON.stringify(c.dim));
await H.reload(); await H.drv({ on: false, think: [300, 600] });
await H.page.evaluate(() => window.__goto("lobby")); await nap(300);
await press("#lobby .top__cfg"); await settled();
c = await cfg();
check("다시 켜도(새로고침) 끔 그대로", c.saved === "0" && c.btn[1].p === "true", JSON.stringify(c));
await press('#cfg [data-vib="1"]'); await nap(200);
c = await cfg();
check("켬으로 되돌린다", c.saved === "1" && c.btn[0].p === "true", JSON.stringify(c));
await H.page.evaluate(() => document.getElementById("cfg").classList.remove("on"));

/* ---------- 판 ---------- */
console.log("\n[판에서]");
/* 내 차례가 막 온 순간들을 따로 센다 — 진동 기록과 맞춰 본다 */
await H.page.evaluate(() => {
  window.__arr = []; window.__buzzed = [];
  let was = false;
  setInterval(() => {
    const v = window.__eng && window.__eng.view;
    const on = Boolean(v && v.myTurn) && (document.querySelector(".page.is-on") || {}).id === "table";
    if (on && !was) window.__arr.push(Date.now());
    was = on;
  }, 30);
});
await H.create({ cap: 4, rounds: 3, tax: false });
await waitFor(async () => (await H.seated()) >= 4, 15000);
/* 판에 막 들어선 직후 벨은 0.7초 늦게 울린다(화면이 자리 잡은 뒤). 그 전에 이미 내 버리면
   벨도 진동도 없다 — 사람은 그렇게 빨리 못 둔다. 흉내 사람도 0.8초 넘게 생각하게 한다 */
await H.drv({ on: true, think: [800, 1100] });
await H.pressStart();
await waitFor(async () => (await H.screen()) === "table", 20000);
await waitFor(() => H.page.evaluate(() => window.__arr.length >= 5), 90000, 300);
await nap(1200);
let st = await H.page.evaluate(() => ({ arr: window.__arr.slice(), buzz: window.__buzzed.slice() }));
/* 진동마다 그 직전(1.5초 안)에 내 차례가 왔어야 한다 */
const near = (b, arr) => arr.some(a => b.at >= a - 50 && b.at - a < 1500);
check("내 차례가 몇 번 왔다", st.arr.length >= 5, st.arr.length + "번");
check("내 차례가 올 때마다 한 번씩 떤다", st.buzz.length === st.arr.length, "차례 " + st.arr.length + " · 진동 " + st.buzz.length);
if (st.buzz.length !== st.arr.length){
  const t0 = st.arr[0];
  console.log("    (진단) 차례 " + JSON.stringify(st.arr.map(a => a - t0)) + " · 진동 " + JSON.stringify(st.buzz.map(b => b.at - t0)) +
              " · 판 화면 " + JSON.stringify(await H.page.evaluate(() => (window.__hlog || []).filter(l => /screen|play|pass/.test(l)).slice(0, 14))));
}
check("떤 것은 모두 내 차례가 막 왔을 때다 (남의 차례에는 안 떤다)", st.buzz.every(b => near(b, st.arr)));
check("짧게 (0.2초)", st.buzz.every(b => b.ms === 200));

/* 판 화면에 들어서는 순간이 내 차례 — 세금 화면 → 판, 뽑기 → 판 처럼 화면이 막 켜질 때.
   예전에는 화면이 켜지기 전에 온 상태에서 벨을 삼켜서 **그 판 첫 선이 나이면 벨도 진동도 없었다** */
await H.drv({ on: false });
await nap(1600);
await waitFor(() => H.page.evaluate(() => Boolean(window.__eng.view && window.__eng.view.myTurn)), 30000, 100);
const e0 = await H.page.evaluate(() => window.__buzzed.length);
/* 다른 화면이 켜져 있는 상태에서 판 화면으로 — 세금 화면 → 판과 같은 모양.
   (판 화면에서 판 화면으로 다시 가면 이미 켜져 있어서 이 길을 안 탄다) */
await H.page.evaluate(() => { window.__goto("lobby"); window.__goto("table"); });
await nap(1500);
const e1 = await H.page.evaluate(() => ({ n: window.__buzzed.length, my: Boolean(window.__eng.view && window.__eng.view.myTurn) }));
check("판 화면이 막 켜졌는데 내 차례면 떤다", e1.n === e0 + 1 && e1.my, "진동 +" + (e1.n - e0));
await H.page.evaluate(() => window.__goto("table")); await nap(200);
await H.page.evaluate(() => { window.__fresh = false; });

/* 자동치기 — 대신 두니까 안 떤다.
   흉내 사람을 먼저 멈추고 하던 수가 끝나길 기다린다 — 카드를 만지면 자동치기가 풀리기 때문이다 */
await H.drv({ on: false });
await nap(1600);
check("자동 단추가 손가락을 받는다", await press("#table #auto"));
await nap(300);
const a0 = await H.page.evaluate(() => ({ arr: window.__arr.length, buzz: window.__buzzed.length, auto: window.__eng.auto }));
check("자동치기가 켜졌다", a0.auto === true);
await waitFor(() => H.page.evaluate(n => window.__arr.length >= n + 3 || (document.querySelector(".page.is-on") || {}).id !== "table", a0.arr), 60000, 300);
const a1 = await H.page.evaluate(() => ({ arr: window.__arr.length, buzz: window.__buzzed.length, auto: window.__eng.auto }));
check("그동안 자동치기가 계속 켜져 있었다", a1.auto === true || (await H.screen()) !== "table");
check("자동치기 중에는 내 차례가 와도 안 떤다", a1.arr - a0.arr >= 1 && a1.buzz === a0.buzz,
  "차례 +" + (a1.arr - a0.arr) + " · 진동 +" + (a1.buzz - a0.buzz));

/* 끔 — 자동치기를 풀고 사람처럼 두는데도 안 떤다 */
await H.page.evaluate(() => localStorage.setItem("zk_vib", "0"));
if ((await H.screen()) === "table"){
  await press("#table #auto"); await nap(200);
  await H.drv({ on: true, think: [800, 1100] });
  const b0 = await H.page.evaluate(() => ({ arr: window.__arr.length, buzz: window.__buzzed.length, auto: window.__eng.auto }));
  check("자동치기를 풀었다", b0.auto === false);
  await waitFor(() => H.page.evaluate(n => window.__arr.length >= n + 2 || (document.querySelector(".page.is-on") || {}).id !== "table", b0.arr), 60000, 300);
  const b1 = await H.page.evaluate(() => ({ arr: window.__arr.length, buzz: window.__buzzed.length }));
  check("설정이 끔이면 내 차례에도 안 떤다", b1.arr - b0.arr >= 1 && b1.buzz === b0.buzz,
    "차례 +" + (b1.arr - b0.arr) + " · 진동 +" + (b1.buzz - b0.buzz));
} else check("(판이 먼저 끝나 끔 확인을 못 했다)", false, await H.screen());

check("화면 오류·알림창이 없다", H.errs.length === 0, H.errs.slice(0, 3).join(" | "));
await closeAll(env, srv);
process.exit(C.done());
