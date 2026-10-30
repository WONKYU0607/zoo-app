/* **버튼 터치를 네이티브처럼** (2026-10-26 사용자 신고 · "네이티브처럼 하게 만들어 줘")

   "게임 시작·나가기·알림 상자 버튼 터치가 조금 느려 보이고 네이티브랑 다르게 부자연스럽다"
   폰을 흉내 낸 크롬(모바일 화면 + 진짜 터치 신호 — CDP Input.dispatchTouchEvent)으로 본다:
     1. 웹 기본 터치 강조(파란 반투명 사각형)가 꺼져 있다 — 고치기 전에는 rgba(51,181,229,.4)
     2. **손이 닿는 순간** 눌림 표시가 붙는다 — 고치기 전에는 0.38초 누르는 동안 아무 반응이 없었다(손 뗀 뒤에야)
        붉은 버튼(빠른 참가)·놋쇠 버튼(방 만들기)·판의 패스·확인창 단추: 원래 눌림 모양(눌린 틀 그림) 그대로, 어둡게 하지 않음
        자기 눌림 모양이 없던 단추(랭킹·× 등): 살짝 어두워진다
     3. 손을 떼면 눌림 표시가 빠지고 눌린 일(click)이 한 번 일어난다. 아주 빨리 톡 쳐도 눌림이 잠깐(110ms) 보인다
     4. 누른 채 손가락이 단추 밖으로 나가면 눌림이 빠지고(다시 들어와도 안 붙음), 거기서 떼면 눌리지 않는다(네이티브와 같음)
     5. 스크롤을 시작하면(규칙 창) 눌림이 빠진다
     6. 꺼진 단추(disabled)는 눌림 표시가 안 붙는다
     7. 버튼 글자는 길게 눌러도 선택되지 않는다(user-select none), 글 쓰는 칸은 된다
     8. 화면에서 터진 것이 없다

   쓰는 법:  node test/press.test.mjs */
import { serve, open, shut, ensureBuild, findBrowser, toTable } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); console.log("=== 통과 0 / 실패 0 ===\n"); process.exit(0); }
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++; console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };
const nap = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5974);
const o = await open({ srv, width: 412, height: 915 });
const { page } = o;
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
});
await page.emulate({ viewport: { width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36; wv" });
await page.reload({ waitUntil: "networkidle0" });
await page.evaluate(() => window.__goto && window.__goto("lobby"));
await nap(700);
const cdp = await page.target().createCDPSession();
const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" || type === "touchCancel" ? [] : [{ x, y }] });
const center = sel => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, top: r.top, bottom: r.bottom }; }, sel);
/* 그 단추의 지금 모습: 눌림 표시·틀 그림·어둡기, 눌린 횟수 */
const look = sel => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const cs = getComputedStyle(e);
  return { press: e.classList.contains("is-press"), frame: cs.borderImageSource.replace(/^.*\/(fr_[a-z_]+)\.webp.*$/, "$1"), filter: cs.filter, tf: cs.transform, clicks: e.__clicks || 0 }; }, sel);
const countClicks = sel => page.evaluate(s => { const e = document.querySelector(s); if (e && !e.__cc){ e.__cc = true; e.addEventListener("click", ev => { e.__clicks = (e.__clicks || 0) + 1; ev.stopImmediatePropagation(); ev.preventDefault(); }, true); } }, sel);

console.log("\n--- 1. 파란 사각형 ---");
const thc = await page.evaluate(() => ["#lobby #btQuick", "#lobby #btNew", "#lobby .bt-rank"].map(s => getComputedStyle(document.querySelector(s)).webkitTapHighlightColor));
check("**웹 기본 터치 강조가 꺼져 있다** (고치기 전 rgba(51, 181, 229, 0.4))", thc.every(c => c === "rgba(0, 0, 0, 0)"), JSON.stringify(thc));

console.log("\n--- 2·3. 닿는 순간 / 뗄 때 ---");
for (const [name, sel, kind] of [["빠른 참가(붉은 버튼)", "#lobby #btQuick", "frame"], ["방 만들기(놋쇠 버튼)", "#lobby #btNew", "frame"], ["친구(눌림 모양 없던 단추 — 둘째 줄)", "#lobby .bt-friend", "dim"], ["랭킹(하단 고정 탭 — 2026-10-29)", "#tbRank", "dim"]]){
  const c = await center(sel);
  await countClicks(sel);
  const idle = await look(sel);
  await touch("touchStart", c.x, c.y);
  await nap(40);
  const down = await look(sel);
  await nap(300);
  const hold = await look(sel);
  await touch("touchEnd");
  await nap(20);
  const up = await look(sel);
  await nap(250);
  const later = await look(sel);
  check("**" + name + ": 닿고 0.04초 만에 눌림 표시**", down.press === true, JSON.stringify(down));
  if (kind === "frame") check(name + ": 원래 눌림 모양(눌린 틀) 그대로, 어둡게 안 함", /down/.test(down.frame) && !/down/.test(idle.frame) && down.filter === "none", idle.frame + " → " + down.frame + " · filter " + down.filter);
  else check(name + ": 살짝 어두워진다", /brightness\(0\.8\)/.test(down.filter) && idle.filter === "none", idle.filter + " → " + down.filter);
  check(name + ": 누르고 있는 동안 계속 눌려 있다", hold.press === true);
  check(name + ": 떼면 한 번 눌린다", up.clicks === 1, "눌림 " + up.clicks + "번");
  check(name + ": 뗀 뒤 눌림 표시가 빠진다", later.press === false && later.filter === "none" && !/down/.test(later.frame), JSON.stringify(later));
}
{
  /* 아주 빨리 톡 — 닿자마자 뗌 */
  const c = await center("#lobby #btNew");
  await touch("touchStart", c.x, c.y); await touch("touchEnd");
  const t0 = Date.now();
  const right = await look("#lobby #btNew");
  await nap(160);
  const after = await look("#lobby #btNew");
  check("아주 빨리 톡 쳐도 눌림이 잠깐 보인다 (뗀 직후 남아 있다가 빠짐)", right.press === true && after.press === false, (Date.now() - t0) + "ms 뒤 " + JSON.stringify([right.press, after.press]));
}

console.log("\n--- 4. 누른 채 밖으로 ---");
{
  const sel = "#lobby #btNew";
  const c = await center(sel);
  await page.evaluate(s => { document.querySelector(s).__clicks = 0; }, sel);
  await touch("touchStart", c.x, c.y);
  await nap(60);
  await touch("touchMove", c.x, c.y + c.h);        /* 단추 높이만큼 아래로 — 밖 */
  await nap(40);
  const out = await look(sel);
  await touch("touchMove", c.x, c.y);              /* 다시 안으로 */
  await nap(40);
  const back = await look(sel);
  await touch("touchMove", c.x, c.y + c.h);
  await touch("touchEnd");
  await nap(250);
  const end = await look(sel);
  check("**단추 밖으로 나가면 눌림이 빠진다**", out.press === false, JSON.stringify(out));
  check("다시 들어와도 다시 눌리지 않는다 (안드로이드 네이티브 단추와 같음 — 밖으로 나간 순간 그 누름은 취소)", back.press === false);
  check("**밖에서 떼면 눌리지 않는다**", end.clicks === 0 && end.press === false, "눌림 " + end.clicks + "번");
}

console.log("\n--- 5. 스크롤 ---");
{
  await page.evaluate(() => document.getElementById("btRules").click());
  await nap(600);
  /* 규칙 창 안에서 누를 수 있는 것(닫기)을 누른 채 위로 끌어 올린다 — 창이 스크롤되면 브라우저가 터치를 가져간다 */
  const info = await page.evaluate(() => {
    const p = document.querySelector("#lobby .sheet.is-open .sheet__panel");
    const sc = [...(p ? p.querySelectorAll("*") : [])].find(e => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)) || p;
    const r = sc.getBoundingClientRect();
    /* 스크롤되는 칸 안에 시험용 단추를 하나 꽂는다(규칙 글 사이에는 단추가 없다) */
    const b = document.createElement("button"); b.id = "__pt"; b.textContent = "시험"; b.style.cssText = "display:block;width:80%;height:60px;margin:10px auto";
    sc.insertBefore(b, sc.firstChild);
    const br = b.getBoundingClientRect();
    return { can: sc.scrollHeight > sc.clientHeight, x: br.x + br.width / 2, y: br.y + br.height / 2, top0: sc.scrollTop, r: { top: r.top, bottom: r.bottom } };
  });
  await countClicks("#__pt");
  await touch("touchStart", info.x, info.y);
  await nap(60);
  const down = await look("#__pt");
  for (let k = 1; k <= 8; k++){ await touch("touchMove", info.x, info.y - k * 25); await nap(16); }
  const moving = await look("#__pt");
  await touch("touchEnd");
  await nap(250);
  const st = await page.evaluate(() => { const b = document.getElementById("__pt"); let e = b.parentElement; while (e && !(e.scrollHeight > e.clientHeight + 20)) e = e.parentElement; return e ? e.scrollTop : -1; });
  check("(준비) 규칙 창이 스크롤된다", info.can && st > info.top0, "scrollTop " + info.top0 + " → " + st);
  check("(준비) 닿을 때는 눌렸다", down.press === true);
  check("**스크롤이 시작되면 눌림이 빠진다**", moving.press === false, JSON.stringify(moving));
  check("스크롤하고 뗀 것은 눌린 것이 아니다", (await look("#__pt")).clicks === 0);
  await page.evaluate(() => { const b = document.getElementById("__pt"); if (b) b.remove(); document.querySelectorAll(".sheet.is-open").forEach(s => s.classList.remove("is-open")); });
}

console.log("\n--- 6. 꺼진 단추 ---");
{
  await page.evaluate(async () => { window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false, friends: true }; await window.__createRoom(); window.__goto("room"); });
  await nap(1000);
  const sel = "#room #action .btn-primary";
  const dis = await page.evaluate(s => { const b = document.querySelector(s); return b ? b.disabled : null; }, sel);
  const c = await center(sel);
  await touch("touchStart", c.x, c.y);
  await nap(60);
  const l = await look(sel);
  await touch("touchEnd");
  check("(준비) 혼자라 시작 단추가 꺼져 있다", dis === true, String(dis));
  check("**꺼진 단추는 눌림 표시가 안 붙는다**", l && l.press === false && !/down/.test(l.frame), JSON.stringify(l));
  await page.evaluate(() => window.__leaveRoom && window.__leaveRoom());
  await page.evaluate(() => window.__goto("lobby"));
  await nap(400);
}

console.log("\n--- 2 (판·확인창) ---");
{
  await toTable(page, { numPlayers: 4 });
  await nap(1200);
  const sel = "#table #emo";                         /* 패스는 내 차례가 아니면 꺼져 있다 — 늘 켜진 이모티콘(같은 놋쇠 틀)으로 본다 */
  const c = await center(sel);
  const idle = await look(sel);
  await touch("touchStart", c.x, c.y);
  await nap(40);
  const d = await look(sel);
  await touch("touchMove", c.x, c.y + 200);          /* 눌리지 않게 밖에서 뗀다 — 판을 건드리지 않는다 */
  await touch("touchEnd");
  check("**판의 놋쇠 단추(이모티콘·패스 같은 틀): 닿는 순간 원래 눌림 모양(눌린 틀)**", d.press === true && /down/.test(d.frame) && d.filter === "none", idle.frame + " → " + d.frame + " · " + d.filter);
  await page.evaluate(() => window.__ask && window.__ask("시험", "확인창", "예", null, null, false));
  await nap(400);
  const ys = await center("#ask #askYes");
  await touch("touchStart", ys.x, ys.y);
  await nap(40);
  const a = await look("#ask #askYes");
  await touch("touchMove", ys.x, ys.y + 300);
  await touch("touchEnd");
  check("**확인창 단추: 닿는 순간 눌린 틀**", a.press === true && /down/.test(a.frame), JSON.stringify(a));
  const xs = await center("#ask #askNo");
  if (xs){
    await touch("touchStart", xs.x, xs.y);
    await nap(40);
    const n = await page.evaluate(() => { const e = document.querySelector("#ask #askNo"); return { press: e.classList.contains("is-press") }; });
    await touch("touchEnd");
    await nap(300);
    check("확인창 취소를 누르면 닿는 순간 눌리고, 떼면 창이 닫힌다", n.press === true && !(await page.evaluate(() => document.getElementById("ask").classList.contains("on"))), JSON.stringify(n));
  }
}

console.log("\n--- 7. 글자 선택 ---");
{
  const us = await page.evaluate(() => {
    const b = document.querySelector("button");
    const i = document.createElement("input"); document.body.appendChild(i);
    const r = { btn: getComputedStyle(b).userSelect, input: getComputedStyle(i).userSelect };
    i.remove(); return r;
  });
  check("버튼 글자는 선택되지 않는다 · 글 쓰는 칸은 된다", us.btn === "none" && us.input !== "none", JSON.stringify(us));
}

const bad = o.logs.filter(l => /^ERROR/.test(l));
check("화면에서 터진 것이 없다", bad.length === 0, JSON.stringify(bad.slice(0, 3)));
shut(srv, o.browser);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
