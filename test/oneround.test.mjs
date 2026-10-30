/* **1판짜리 게임** (2026-10-22 사용자 결정)

   "최소 판수가 3판이라 사람들이 부담을 느낄 수도 있을 거 같아서 1판으로도 가능하게.
    한 판으로 설정된 판은 한 판이 끝나면 그대로 로비로 돌아가고 세금이나 그런 거 없이 바로 끝난다.
    방 만들기에서 1판으로 설정하면 밑에 세금 기능이랑 2카드(2번 컷) 기능은 메뉴에서 빠지게"

   같은 날 덧붙임: "1~10판이 최대로 정해" · "1판만 하고 나가기 해도 광고 재생되는 거지?"

   진짜 브라우저로 본다:
     1. 방 만들기 창: 판 수를 1까지 내릴 수 있고(더는 안 내려감), 1판이면 세금·2번 컷 줄이 사라진다.
        2판으로 올리면 다시 나오고, 전에 고른 값(세금 끔)이 그대로다. 10판까지 올라가고 더는 안 올라간다
     2. 1판으로 만든 방의 대기실 설정 줄: "4명 · 1판" — 세금·2번 컷 글자가 없다
     3. 그 방으로 게임: 엔진이 1판·세금 끔·2번 끔으로 돈다(켜 두고 내려도). 한 판 끝나면 세금 화면 없이
        곧바로 "최종 결과", 다음 판 단추 없음 → 나가기 → **전면 광고 한 번** → 로비
        (2026-10-26 덧붙임: 최종 결과가 뜨는 순간 광고를 미리 받기 시작한다 — 판 사이 결과에서는 안 받는다)
     4. 같은 것을 **서버 대전**으로: 1판 방을 서버에 만들고 끝까지 → 최종 결과 → 나가기 → 광고 한 번 → 로비

   쓰는 법:  node test/oneround.test.mjs   (1~3 은 이 기기 방, 4 는 zoo-server 를 직접 띄운다. 서버 폴더가 없으면 4 만 건너뜀) */
import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
import { SERVER_DIR, startServer } from "./_hum.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); console.log("=== 통과 0 / 실패 0 ===\n"); process.exit(0); }
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++; console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };
const nap = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5937);
const { browser, page, logs } = await open({ srv });
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
});
await page.reload({ waitUntil: "networkidle0" });
await page.evaluate(() => window.__goto && window.__goto("lobby"));
await nap(500);
const now = () => page.evaluate(() => (document.querySelector(".page.is-on") || {}).id);
const sheet = () => page.evaluate(() => {
  const rows = [...document.querySelectorAll("#opts .mk__row")].map(r => (r.querySelector(".mk__t") || {}).textContent || "");
  const rnd = [...document.querySelectorAll("#opts .mk__row")].find(r => /판 수/.test(r.textContent));
  const val = rnd ? rnd.querySelector(".mk__st span").textContent : "";
  const minus = rnd ? rnd.querySelector('[data-opt="rnd-"]') : null;
  const sw = k => { const b = document.querySelector('#opts [data-opt="' + k + '"]'); return b ? b.getAttribute("aria-checked") : null; };
  const plus = rnd ? rnd.querySelector('[data-opt="rnd+"]') : null;
  return { rows, val, minusOff: Boolean(minus && minus.disabled), plusOff: Boolean(plus && plus.disabled), tax: sw("tax"), cut: sw("cut") };
});
const tap = sel => page.evaluate(s => { const e = document.querySelector(s); if (e) e.dispatchEvent(new MouseEvent("click", { bubbles: true })); return Boolean(e); }, sel);

/* ---------- 1. 방 만들기 창 ---------- */
console.log("\n--- 1. 방 만들기 창 ---");
await tap("#lobby #btNew");
await nap(300);
let s = await sheet();
check("(준비) 방 만들기 창이 열렸다", s.rows.length >= 4, JSON.stringify(s.rows));
check("처음은 3판, 세금·2번 컷 줄이 있다", s.val === "3판" && s.rows.some(t => /세금/.test(t)) && s.rows.some(t => /2번 컷/.test(t)), s.val + " " + JSON.stringify(s.rows));
await tap('#opts [data-opt="tax"]');                 /* 세금을 끄고 */
await tap('#opts [data-opt="cut"]');                 /* 2번 컷을 켠 뒤 */
s = await sheet();
check("(준비) 세금 끔·2번 컷 켬", s.tax === "false" && s.cut === "true", s.tax + " " + s.cut);
await tap('#opts [data-opt="rnd-"]'); await tap('#opts [data-opt="rnd-"]');
s = await sheet();
check("**1판까지 내려간다**", s.val === "1판", s.val);
check("**1판이면 세금·2번 컷 줄이 빠진다**", !s.rows.some(t => /세금/.test(t)) && !s.rows.some(t => /2번 컷/.test(t)), JSON.stringify(s.rows));
check("인원·판 수·친구 줄은 그대로", s.rows.some(t => /인원/.test(t)) && s.rows.some(t => /판 수/.test(t)) && s.rows.some(t => /친구/.test(t)), JSON.stringify(s.rows));
check("1판에서 더 못 내린다 (− 단추 꺼짐)", s.minusOff);
await tap('#opts [data-opt="rnd-"]');
check("눌러도 1판 그대로", (await sheet()).val === "1판");
await tap('#opts [data-opt="rnd+"]');
s = await sheet();
check("2판으로 올리면 세금·2번 컷 줄이 다시 나온다", s.val === "2판" && s.tax !== null && s.cut !== null, s.val + " " + JSON.stringify(s.rows));
check("전에 고른 값 그대로 (세금 끔·2번 컷 켬)", s.tax === "false" && s.cut === "true", s.tax + " " + s.cut);
check("설명이 \"1판부터 10판까지\"", await page.evaluate(() => /1판부터 10판까지/.test(document.querySelector("#opts").textContent)));
for (let i = 0; i < 8; i++) await tap('#opts [data-opt="rnd+"]');
s = await sheet();
check("**10판까지 올라간다**", s.val === "10판" && !s.minusOff, s.val);
check("**10판에서 더 못 올린다 (+ 단추 꺼짐)**", s.plusOff);
await tap('#opts [data-opt="rnd+"]');
check("눌러도 10판 그대로", (await sheet()).val === "10판" && await page.evaluate(() => window.__opts.rounds === 10));
for (let i = 0; i < 8; i++) await tap('#opts [data-opt="rnd-"]');
check("(준비) 다시 2판", (await sheet()).val === "2판");
await tap('#opts [data-opt="tax"]');                 /* 세금을 다시 켜 두고 1판으로 — 켜 둔 채 만들어도 1판이면 꺼져야 한다 */
await tap('#opts [data-opt="rnd-"]');
check("(준비) 다시 1판 (세금·2번 컷 켜 둔 채)", (await sheet()).val === "1판" && await page.evaluate(() => window.__opts.tax === true && window.__opts.clear2 === true));

/* ---------- 2. 대기실 설정 줄 ---------- */
console.log("\n--- 2. 대기실 ---");
await tap("#opts #optGo");
for (let i = 0; i < 20 && (await now()) !== "room"; i++) await nap(150);
check("(준비) 대기실로 왔다", (await now()) === "room", await now());
await nap(1700);
const sum = await page.evaluate(() => (document.querySelector("#room #sum") || {}).textContent || "");
check("**설정 줄이 \"4명 · 1판\" — 세금·2번 컷 글자가 없다**", /1판/.test(sum) && !/세금/.test(sum) && !/2번 컷/.test(sum), JSON.stringify(sum));

/* ---------- 3. 1판짜리 게임 ---------- */
console.log("\n--- 3. 게임 ---");
for (let i = 0; i < 60; i++){ if (await page.evaluate(() => (window.__opts && window.__opts.seated) || 0) >= 4) break; await nap(300); }
await page.evaluate(() => { const b = document.querySelector("#room #action .btn-primary"); if (b) b.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
const seen = new Set();
let opts = null;
for (let k = 0; k < 150; k++){
  const on = await now(); seen.add(on);
  if (on === "table") break;
  await page.evaluate(() => {
    const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
    if (c) c.click();
    const g = document.querySelector("#draw #go");
    if (g && !g.disabled) g.click();
  });
  await nap(300);
}
check("(준비) 판 화면까지 갔다", (await now()) === "table", await now());
opts = await page.evaluate(() => { const st = window.__eng.client.store.getState(); return { total: st.G.totalRounds, tax: st.G.opts.tax, clear2: st.G.opts.clear2 }; });
check("**엔진이 1판·세금 끔·2번 컷 끔으로 돈다** (켜 둔 채 만들어도)", opts.total === 1 && opts.tax === false && opts.clear2 === false, JSON.stringify(opts));
/* 빨리 끝나게 — 봇·자동치기 생각 시간을 줄이고 내 자리는 자동치기 */
await page.evaluate(() => { window.__eng.botMs = 40; window.__eng.autoMs = 40; });
await page.evaluate(() => { const a = document.querySelector("#table #auto"); if (a) a.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
await page.evaluate(() => { globalThis.__preInter = 0; });
let final = null;
const kicks = new Set();
for (let k = 0; k < 900; k++){
  const on = await now(); seen.add(on);
  if (on === "result"){
    final = await page.evaluate(() => ({ kick: (document.querySelector("#result #kicker") || {}).textContent || "",
      next: (() => { const b = document.querySelector("#result #next"); return b ? getComputedStyle(b).display !== "none" && !b.hidden : false; })() }));
    kicks.add(final.kick);
    if (/최종/.test(final.kick)) break;
  }
  await nap(150);
}
check("**한 판 끝나면 곧바로 \"최종 결과\"**", final && /최종 결과/.test(final.kick), JSON.stringify(final));
check("**세금 화면을 안 거쳤다**", !seen.has("tax"), [...seen].join(" → "));
check("다음 판 단추가 없다", final && !final.next);
check("\"1판 결과\" 를 따로 거치지 않고 바로 최종 결과다", [...kicks].every(k => /최종/.test(k)), JSON.stringify([...kicks]));
/* 최종 결과가 뜨면 나갈 때 띄울 전면 광고를 미리 받아 둔다 — "나가기" 를 누르자마자 뜨게 (2026-10-26) */
check("**최종 결과가 뜨자 전면 광고를 미리 받기 시작했다** (한 번)", await page.evaluate(() => globalThis.__preInter) === 1, "미리 받기 " + await page.evaluate(() => globalThis.__preInter) + "번");
/* 전면 광고는 앱(안드로이드)에서만 진짜로 뜬다 — 검사에서는 부른 횟수만 센다(adticket.test 와 같은 통로) */
await page.evaluate(() => { window.__interShown = 0; window.__adInterTest = async () => { window.__interShown++; return { ok: true }; }; });
await tap("#result #quit");
for (let i = 0; i < 30 && (await now()) !== "lobby"; i++) await nap(200);
check("**나가기 → 로비**", (await now()) === "lobby", await now());
check("**1판만 하고 나가도 전면 광고가 한 번 뜬다**", await page.evaluate(() => window.__interShown) === 1, "광고 " + await page.evaluate(() => window.__interShown) + "번");
/* 판 사이 결과(남은 판이 있음)에서는 미리 받지 않는다 — 그때 나가면 광고가 없다 */
{
  const mid = await page.evaluate(async () => {
    const keep = window.__opts.rounds;
    globalThis.__preInter = 0;
    window.__opts.rounds = 3; (window.GAME = window.GAME || {}).roundNo = 1;
    window.__goto("result");
    await new Promise(r => setTimeout(r, 200));
    const out = { final: window.__resultFinal, pre: globalThis.__preInter, kick: (document.querySelector("#result #kicker") || {}).textContent || "" };
    window.__goto("lobby");
    window.__opts.rounds = keep;
    return out;
  });
  check("판 사이 결과(1판 결과 · 3판 중)에서는 미리 받지 않는다", mid.final === false && mid.pre === 0 && /1판 결과/.test(mid.kick), JSON.stringify(mid));
}
/* ---------- 4. 서버 대전 1판 ---------- */
console.log("\n--- 4. 서버 대전 ---");
let gs = null;
if (!SERVER_DIR) console.log("  (게임 서버 폴더가 없어 서버 대전은 건너뜁니다)");
else {
  gs = await startServer({ ZOO_BOT_MS: "60", ZOO_BOT_JOIN_MS: "150", ZOO_ALERT_URL: "" });
  await page.evaluate(u => { globalThis.__ZOO_SERVER = u; }, gs.url);
  await page.evaluate(() => { Object.assign(window.__opts, { cap: 4, rounds: 1, tax: true, clear2: true }); });
  await tap("#lobby #btNew");
  await nap(300);
  check("(준비) 방 만들기 창 — 1판, 세금·2번 컷 줄 없음", (await sheet()).val === "1판" && !(await sheet()).rows.some(t => /세금|2번 컷/.test(t)));
  await tap("#opts #optGo");
  for (let i = 0; i < 40 && (await now()) !== "room"; i++) await nap(150);
  check("(준비) 서버 방 대기실", (await now()) === "room", await now());
  const code = await page.evaluate(() => (window.__roomCode && window.__roomCode()) || "");
  let ro = null;
  for (let i = 0; i < 20 && code; i++){
    ro = await (await fetch(gs.url + "/zoo/rooms/" + code)).json().catch(() => null);
    if (ro && ro.opts) break;
    await nap(150);
  }
  check("**서버의 방도 1판·세금 끔·2번 끔** (켜 둔 채 만들어도)", Boolean(ro && ro.opts) && ro.opts.rounds === 1 && ro.opts.tax === false && ro.opts.clear2 === false, code + " " + JSON.stringify(ro && ro.opts));
  for (let i = 0; i < 60; i++){ if (await page.evaluate(() => (window.__opts && window.__opts.seated) || 0) >= 4) break; await nap(300); }
  await page.evaluate(() => { const b = document.querySelector("#room #action .btn-primary"); if (b) b.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
  const seen2 = new Set();
  for (let k = 0; k < 150; k++){
    const on = await now(); seen2.add(on);
    if (on === "table") break;
    await page.evaluate(() => {
      const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
      if (c) c.click();
      const g = document.querySelector("#draw #go");
      if (g && !g.disabled) g.click();
    });
    await nap(300);
  }
  check("(준비) 서버 대전 판 화면", (await now()) === "table", [...seen2].join(" → "));
  const so = await page.evaluate(() => { const st = window.__eng.client.getState(); return st ? { total: st.G.totalRounds, tax: st.G.opts.tax, clear2: st.G.opts.clear2 } : null; });
  check("**서버 엔진도 1판·세금 끔·2번 컷 끔**", so && so.total === 1 && so.tax === false && so.clear2 === false, JSON.stringify(so));
  await page.evaluate(() => { const a = document.querySelector("#table #auto"); if (a) a.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
  await page.evaluate(() => { globalThis.__preInter = 0; });
  let fin = null;
  const kicks2 = new Set();
  for (let k = 0; k < 1600; k++){
    const on = await now(); seen2.add(on);
    if (on === "result"){
      fin = await page.evaluate(() => ({ kick: (document.querySelector("#result #kicker") || {}).textContent || "",
        next: (() => { const b = document.querySelector("#result #next"); return b ? getComputedStyle(b).display !== "none" && !b.hidden : false; })() }));
      kicks2.add(fin.kick);
      if (/최종/.test(fin.kick)) break;
    }
    await nap(150);
  }
  check("**서버 대전도 한 판 끝나면 곧바로 \"최종 결과\"**", fin && /최종 결과/.test(fin.kick) && [...kicks2].every(k => /최종/.test(k)), JSON.stringify([...kicks2]));
  check("서버 대전도 세금 화면을 안 거쳤다", !seen2.has("tax"), [...seen2].join(" → "));
  check("서버 대전도 다음 판 단추가 없다", fin && !fin.next);
  check("**서버 대전도 최종 결과가 뜨자 광고를 미리 받기 시작했다**", await page.evaluate(() => globalThis.__preInter) === 1, "미리 받기 " + await page.evaluate(() => globalThis.__preInter) + "번");
  await page.evaluate(() => { window.__interShown = 0; window.__adInterTest = async () => { window.__interShown++; return { ok: true }; }; });
  await tap("#result #quit");
  for (let i = 0; i < 30 && (await now()) !== "lobby"; i++) await nap(200);
  check("**서버 대전: 나가기 → 로비**", (await now()) === "lobby", await now());
  check("**서버 대전도 1판만 하고 나가면 전면 광고가 한 번 뜬다**", await page.evaluate(() => window.__interShown) === 1, "광고 " + await page.evaluate(() => window.__interShown) + "번");
}

const bad = logs.filter(l => /^ERROR/.test(l));
check("화면에서 터진 것이 없다", bad.length === 0, JSON.stringify(bad.slice(0, 3)));

if (gs) gs.kill();
shut(srv, browser);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
