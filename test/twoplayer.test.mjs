/* **2·3인 방 · 손패 두 줄** (2026-10-23 사용자 결정)

   "최소인원 2명으로도 낮춰라. 1대1 하고 싶은 친구들도 있을 수 있으니까"
   "두 줄로 21장씩 · 3인도 2줄로 · 화면 4인 기준 손패에서 안 깨지게" · "2~3인은 세금·혁명 없음"

   진짜 브라우저로 본다:
     1. 방 만들기 창: 인원이 2명까지 내려가고(더는 안 내려감) 설명은 "2명 – 8명".
        2·3명이면 세금 줄이 빠지고 2번 컷 줄은 남는다. 4명으로 올리면 세금 줄이 고른 값 그대로 돌아온다
     2. 2명 방 대기실: 설정 줄에 세금 글자가 없다 · 2명이 차면 시작 단추가 열린다
     3. 1대1 판: 엔진 2인·세금 끔 · 손패 40장이 **두 줄(20·20)**, 카드 44px · 손패 상자 높이는 4인 판과 같다(126px) ·
        보이는 자리를 누르면 그 카드가 받는다(40장 전부) · 뒷줄을 고르면 10px, 앞줄은 20px 올라간다 ·
        손패가 21장 이하로 줄면 **한 줄(60px)** 로 돌아간다 · 세금 화면 없이 2판 끝 → 최종 결과 → 나가기 → 광고 한 번 → 로비
     4. 3인 판: 27~28장이 두 줄(14·13 또는 14·14), 세금 끔
     5. 4인 판은 예전 그대로 한 줄 60px (두 줄로 바뀌지 않았다)
     6. **서버 대전 1대1** (방장 + 봇): 서버 방 2인·세금 끔, 두 줄 손패, 세금 화면 없이 2판 → 최종 → 광고 → 로비

   쓰는 법:  node test/twoplayer.test.mjs   (서버 없이 이 기기 방으로 돈다) */
import { serve, open, shut, ensureBuild, findBrowser, toTable } from "./shot.mjs";
import { SERVER_DIR, startServer } from "./_hum.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); console.log("=== 통과 0 / 실패 0 ===\n"); process.exit(0); }
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++; console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };
const nap = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5961);
const fresh = async (w = 360, h = 740) => {
  const o = await open({ srv, width: w, height: h });
  await o.page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
    HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
  });
  await o.page.reload({ waitUntil: "networkidle0" });
  await o.page.evaluate(() => window.__goto && window.__goto("lobby"));
  await nap(400);
  return o;
};
const tapSel = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (e) e.dispatchEvent(new MouseEvent("click", { bubbles: true })); return Boolean(e); }, sel);
const now = page => page.evaluate(() => (document.querySelector(".page.is-on") || {}).id);
/* 손패를 잰다 — 줄마다 장수·간격, 카드 크기, 상자 높이, 보이는 자리를 눌렀을 때 그 카드가 받는지 */
const measure = page => page.evaluate(() => {
  const h = document.querySelector("#table #hand");
  const box = h.getBoundingClientRect();
  const slots = [...h.querySelectorAll(".slot")];
  const rs = slots.map(s => s.getBoundingClientRect());
  const tops = [...new Set(rs.map(r => Math.round(r.top)))].sort((a, b) => a - b);
  const rows = tops.map(t => rs.filter(r => Math.round(r.top) === t));
  const step = a => a.length > 1 ? (a[a.length - 1].left - a[0].left) / (a.length - 1) : 0;
  let hit = 0;
  slots.forEach((s, i) => {
    const r = rs[i];
    const right = rs.find((q, k) => k > i && Math.round(q.top) === Math.round(r.top));
    const below = rs.find((q, k) => k > i && Math.round(q.top) > Math.round(r.top));
    const x = (r.left + (right ? right.left : r.right)) / 2;
    const y = (r.top + (below ? Math.min(r.bottom, below.top) : r.bottom)) / 2;
    const e = document.elementFromPoint(x, y);
    if (e && s.contains(e)) hit++;
  });
  return { n: slots.length, rows: rows.map(a => a.length), steps: rows.map(a => Math.round(step(a) * 10) / 10),
    w: Math.round(rs[0] ? rs[0].width : 0), boxH: Math.round(box.height), two: h.classList.contains("hand--two"),
    inBox: rs.every(r => r.top >= box.top - 1 && r.bottom <= box.bottom + 1), hit };
});

/* ---------- 1. 방 만들기 창 ---------- */
console.log("\n--- 1. 방 만들기 창 ---");
let { browser, page, logs } = await fresh();
await tapSel(page, "#lobby #btNew");
await nap(300);
const sheet = () => page.evaluate(() => {
  const rows = [...document.querySelectorAll("#opts .mk__row")];
  const cap = rows.find(r => /방 인원/.test(r.textContent));
  return { rows: rows.map(r => (r.querySelector(".mk__t") || {}).textContent || ""),
    cap: cap ? cap.querySelector(".mk__st span").textContent : "", desc: cap ? (cap.querySelector(".mk__d") || {}).textContent : "",
    minusOff: Boolean(cap && cap.querySelector('[data-opt="cap-"]').disabled),
    tax: (document.querySelector('#opts [data-opt="tax"]') || { getAttribute(){ return null; } }).getAttribute("aria-checked") };
});
let s = await sheet();
check("(준비) 처음은 4명, 세금 줄이 있다", s.cap === "4" && s.rows.some(t => /세금/.test(t)), s.cap + " " + JSON.stringify(s.rows));
check("설명이 \"2명 – 8명\"", /2명\s*–\s*8명/.test(s.desc), JSON.stringify(s.desc));
await tapSel(page, '#opts [data-opt="tax"]');                     /* 세금을 끄고 */
await tapSel(page, '#opts [data-opt="cap-"]');
s = await sheet();
check("**3명으로 내려가고 세금 줄이 빠진다** · 2번 컷 줄은 남는다", s.cap === "3" && !s.rows.some(t => /세금/.test(t)) && s.rows.some(t => /2번 컷/.test(t)), s.cap + " " + JSON.stringify(s.rows));
await tapSel(page, '#opts [data-opt="cap-"]');
s = await sheet();
check("**2명까지 내려간다** · 세금 줄 없음", s.cap === "2" && !s.rows.some(t => /세금/.test(t)), s.cap + " " + JSON.stringify(s.rows));
check("2명에서 − 단추가 꺼진다", s.minusOff);
await tapSel(page, '#opts [data-opt="cap-"]');
check("눌러도 2명 그대로", (await sheet()).cap === "2");
await tapSel(page, '#opts [data-opt="cap+"]'); await tapSel(page, '#opts [data-opt="cap+"]');
s = await sheet();
check("4명으로 올리면 세금 줄이 돌아오고 고른 값(끔) 그대로", s.cap === "4" && s.tax === "false", s.cap + " " + s.tax);
await tapSel(page, '#opts [data-opt="tax"]');                     /* 다시 켜 두고 2명으로 — 켜 둔 채 만들어도 2명이면 세금 없음 */
await tapSel(page, '#opts [data-opt="cap-"]'); await tapSel(page, '#opts [data-opt="cap-"]');
check("(준비) 2명 · 세금 켜 둔 채", (await sheet()).cap === "2" && await page.evaluate(() => window.__opts.tax === true));

/* ---------- 2. 2명 방 대기실 ---------- */
console.log("\n--- 2. 대기실 ---");
await tapSel(page, "#opts #optGo");
for (let i = 0; i < 20 && (await now(page)) !== "room"; i++) await nap(150);
check("(준비) 대기실", (await now(page)) === "room", await now(page));
for (let i = 0; i < 60 && (await page.evaluate(() => (window.__opts && window.__opts.seated) || 0)) < 2; i++) await nap(300);
await nap(600);
const room = await page.evaluate(() => ({ sum: (document.querySelector("#room #sum") || {}).textContent || "", seats: document.querySelectorAll("#room .seat").length,
  btn: (() => { const b = document.querySelector("#room #action .btn-primary"); return b ? { t: b.textContent.trim(), off: b.disabled } : null; })() }));
check("**설정 줄 \"2명 · 3판 · 2번 컷\" — 세금 글자 없음**", /^2명/.test(room.sum.trim()) && !/세금/.test(room.sum) && /2번 컷/.test(room.sum), JSON.stringify(room.sum));
check("대기실 자리 2개", room.seats === 2, String(room.seats));
check("**2명이 차면 시작 단추가 열린다**", room.btn && !room.btn.off && /시작/.test(room.btn.t), JSON.stringify(room.btn));

/* ---------- 3. 1대1 판 ---------- */
console.log("\n--- 3. 1대1 판 ---");
await page.evaluate(() => { const b = document.querySelector("#room #action .btn-primary"); if (b) b.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
for (let k = 0; k < 150 && (await now(page)) !== "table"; k++){
  await page.evaluate(() => {
    const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
    if (c) c.click();
    const g = document.querySelector("#draw #go");
    if (g && !g.disabled) g.click();
  });
  await nap(300);
}
check("(준비) 판 화면", (await now(page)) === "table", await now(page));
const eng = await page.evaluate(() => { const st = window.__eng.client.getState(); return { n: st.ctx.numPlayers, tax: st.G.opts.tax, hand: st.G.hands[0].length }; });
check("**엔진 2인 · 세금 끔** (켜 둔 채 만들어도)", eng.n === 2 && eng.tax === false, JSON.stringify(eng));
await nap(500);
let m = await measure(page);
check("**손패 " + m.n + "장이 두 줄** (20·20)", m.two && m.rows.length === 2 && Math.abs(m.rows[0] - m.rows[1]) <= 1 && m.rows[0] + m.rows[1] === m.n && m.n > 21, JSON.stringify(m.rows));
check("카드 44px · 줄 간격이 4인 판과 비슷 (14~18px)", m.w === 44 && m.steps.every(x => x >= 14 && x <= 18), m.w + "px · " + JSON.stringify(m.steps));
check("**손패 상자 높이는 4인 판과 같다 (126px)** · 카드가 상자 밖으로 안 나간다", m.boxH === 126 && m.inBox, m.boxH + " " + m.inBox);
check("**보이는 자리를 누르면 그 카드가 받는다** (" + m.n + "장 전부)", m.hit === m.n, m.hit + "/" + m.n);
/* 내 차례에 뒷줄·앞줄에서 고를 수 있는 카드를 하나씩 골라 본다.
   **바닥에 깔린 카드 때문에 뒷줄(낮은 숫자)에 낼 것이 하나도 없는 차례가 있다**(2026-10-23 전체 검사에서 한 번 — 그때는 null 로 실패).
   그런 차례면 패스하고 다음 내 차례를 본다(여러 번까지) */
let lift = null, tries = 0;
for (; tries < 8 && !lift; tries++){
  for (let i = 0; i < 200 && !(await page.evaluate(() => Boolean(window.__eng.view && window.__eng.view.myTurn))); i++) await nap(150);
  await nap(400);
  lift = await page.evaluate(async () => {
    const pick = cond => [...document.querySelectorAll("#table #hand .slot")].find(s => cond(s) && !s.classList.contains("slot--dead"));
    const back = pick(s => s.classList.contains("slot--back"));
    const front = pick(s => !s.classList.contains("slot--back"));
    if (!back || !front) return null;
    const y0 = back.getBoundingClientRect().top;
    back.click();
    await new Promise(r => setTimeout(r, 400));
    const y1 = back.getBoundingClientRect().top;
    const picked = back.classList.contains("slot--sel");
    back.click();                                                 /* 되돌린다 */
    await new Promise(r => setTimeout(r, 300));
    const f0 = front.getBoundingClientRect().top;
    front.click();
    await new Promise(r => setTimeout(r, 400));
    const f1 = front.getBoundingClientRect().top;
    front.click();
    return { picked, back: Math.round(y0 - y1), front: Math.round(f0 - f1) };
  });
  if (!lift){
    /* 낼 것이 없는 차례 — 패스하고 내 차례가 끝날 때까지 기다린다 */
    await page.evaluate(() => { const b = document.querySelector("#table #pass"); if (b && !b.disabled) b.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch" })); });
    for (let i = 0; i < 60 && (await page.evaluate(() => Boolean(window.__eng.view && window.__eng.view.myTurn))); i++) await nap(100);
  }
}
check("고르면 뒷줄은 10px · 앞줄은 20px 올라간다", lift && lift.picked && lift.back === 10 && lift.front === 20, JSON.stringify(lift) + " · 내 차례 " + tries + "번째");
/* 빨리 끝나게 — 자동치기 + 봇 빠르게. 손패가 21장 이하로 줄면 한 줄로 돌아오는지 본다 */
await page.evaluate(() => { window.__eng.botMs = 40; window.__eng.autoMs = 40; });
await page.evaluate(() => { const a = document.querySelector("#table #auto"); if (a) a.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
let one = null;
for (let k = 0; k < 400 && !one; k++){
  const c = await page.evaluate(() => (window.__eng.view && window.__eng.view.hand || []).length);
  if ((await now(page)) === "table" && c > 1 && c <= 21){ await nap(120); one = await measure(page); if (one.n > 21) one = null; }
  else await nap(100);
}
check("**21장 이하가 되면 한 줄(60px)로 돌아온다**", one && !one.two && one.rows.length === 1 && one.w === 60, JSON.stringify(one && { n: one.n, rows: one.rows, w: one.w }));
const seen = new Set();
let final = null;
for (let k = 0; k < 1600; k++){
  const on = await now(page); seen.add(on);
  if (on === "result"){
    const kick = await page.evaluate(() => (document.querySelector("#result #kicker") || {}).textContent || "");
    if (/최종/.test(kick)){ final = kick; break; }
    await tapSel(page, "#result #next");                         /* 1판 결과 → 다음 판 */
  }
  await nap(150);
}
check("**세금 화면 없이 2판 끝 → 최종 결과**", final && !seen.has("tax"), [...seen].join(" → "));
await page.evaluate(() => { window.__interShown = 0; window.__adInterTest = async () => { window.__interShown++; return { ok: true }; }; });
await tapSel(page, "#result #quit");
for (let i = 0; i < 30 && (await now(page)) !== "lobby"; i++) await nap(200);
check("나가기 → 광고 한 번 → 로비", (await now(page)) === "lobby" && await page.evaluate(() => window.__interShown) === 1, (await now(page)) + " · 광고 " + await page.evaluate(() => window.__interShown));
check("화면에서 터진 것이 없다 (1대1)", logs.filter(l => /^ERROR/.test(l)).length === 0, JSON.stringify(logs.filter(l => /^ERROR/.test(l)).slice(0, 3)));
await browser.close();

/* ---------- 4·5. 3인 · 4인 ---------- */
for (const [n, wantTwo] of [[3, true], [4, false]]){
  console.log("\n--- " + (n === 3 ? "4. 3인" : "5. 4인 (예전 그대로)") + " ---");
  ({ browser, page, logs } = await fresh());
  await toTable(page, { numPlayers: n });
  await nap(900);
  const e = await page.evaluate(() => { const st = window.__eng.client.getState(); return { n: st.ctx.numPlayers, tax: st.G.opts.tax }; });
  m = await measure(page);
  if (wantTwo){
    check("**3인: 엔진 3인 · 세금 끔**", e.n === 3 && e.tax === false, JSON.stringify(e));
    check("**3인: " + m.n + "장이 두 줄**", m.two && m.rows.length === 2 && Math.abs(m.rows[0] - m.rows[1]) <= 1 && m.w === 44 && m.boxH === 126 && m.inBox, JSON.stringify(m.rows) + " " + m.w + "px");
    check("3인: 보이는 자리를 누르면 그 카드가 받는다", m.hit === m.n, m.hit + "/" + m.n);
  } else {
    check("4인: 엔진 4인 · 세금 켬", e.n === 4 && e.tax === true, JSON.stringify(e));
    check("**4인: 예전 그대로 한 줄 60px**", !m.two && m.rows.length === 1 && m.w === 60 && m.boxH === 126, JSON.stringify(m.rows) + " " + m.w + "px");
  }
  check("화면에서 터진 것이 없다 (" + n + "인)", logs.filter(l => /^ERROR/.test(l)).length === 0, JSON.stringify(logs.filter(l => /^ERROR/.test(l)).slice(0, 3)));
  await browser.close();
}

/* ---------- 6. 서버 대전 1대1 ---------- */
console.log("\n--- 6. 서버 대전 1대1 ---");
if (!SERVER_DIR) console.log("  (게임 서버 폴더가 없어 건너뜁니다)");
else {
  const gs = await startServer({ ZOO_BOT_MS: "60", ZOO_BOT_JOIN_MS: "150", ZOO_ALERT_URL: "" });
  ({ browser, page, logs } = await fresh());
  await page.evaluate(u => { globalThis.__ZOO_SERVER = u; }, gs.url);
  /* 세금을 켜 둔 채 2명 — 서버도 꺼야 한다 */
  await page.evaluate(() => { Object.assign(window.__opts, { cap: 2, rounds: 2, tax: true, clear2: false }); });
  await tapSel(page, "#lobby #btNew");
  await nap(300);
  await tapSel(page, "#opts #optGo");
  for (let i = 0; i < 40 && (await now(page)) !== "room"; i++) await nap(150);
  const code = await page.evaluate(() => (window.__roomCode && window.__roomCode()) || "");
  const ro = await (await fetch(gs.url + "/zoo/rooms/" + code)).json().catch(() => null);
  check("**서버 방 2인 · 세금 끔** (켜 둔 채 만들어도)", ro && ro.numPlayers === 2 && ro.opts && ro.opts.tax === false, code + " " + JSON.stringify(ro && { n: ro.numPlayers, opts: ro.opts }));
  for (let i = 0; i < 60 && (await page.evaluate(() => (window.__opts && window.__opts.seated) || 0)) < 2; i++) await nap(300);
  await page.evaluate(() => { const b = document.querySelector("#room #action .btn-primary"); if (b) b.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
  for (let k = 0; k < 150 && (await now(page)) !== "table"; k++){
    await page.evaluate(() => {
      const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
      if (c) c.click();
      const g = document.querySelector("#draw #go");
      if (g && !g.disabled) g.click();
    });
    await nap(300);
  }
  check("(준비) 서버 대전 판 화면", (await now(page)) === "table", await now(page));
  await nap(800);
  m = await measure(page);
  check("**서버 대전도 두 줄 손패**", m.two && m.rows.length === 2 && m.w === 44 && m.boxH === 126 && m.hit === m.n, JSON.stringify(m.rows) + " " + m.hit + "/" + m.n);
  await page.evaluate(() => { const a = document.querySelector("#table #auto"); if (a) a.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
  const seen2 = new Set();
  let fin = null;
  for (let k = 0; k < 2400; k++){
    const on = await now(page); seen2.add(on);
    if (on === "result"){
      const kick = await page.evaluate(() => (document.querySelector("#result #kicker") || {}).textContent || "");
      if (/최종/.test(kick)){ fin = kick; break; }
    }
    await nap(150);
  }
  check("**서버 대전 1대1: 세금 화면 없이 2판 → 최종 결과**", fin && !seen2.has("tax"), [...seen2].join(" → "));
  await page.evaluate(() => { window.__interShown = 0; window.__adInterTest = async () => { window.__interShown++; return { ok: true }; }; });
  await tapSel(page, "#result #quit");
  for (let i = 0; i < 30 && (await now(page)) !== "lobby"; i++) await nap(200);
  check("서버 대전: 나가기 → 광고 한 번 → 로비", (await now(page)) === "lobby" && await page.evaluate(() => window.__interShown) === 1);
  check("화면에서 터진 것이 없다 (서버 대전)", logs.filter(l => /^ERROR/.test(l)).length === 0, JSON.stringify(logs.filter(l => /^ERROR/.test(l)).slice(0, 3)));
  await browser.close();
  gs.kill();
}

shut(srv);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
