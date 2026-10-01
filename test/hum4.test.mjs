/* 사람 4명이 번호로 모여 **3판을 끝까지** 한다 — 봇 없이. (7분쯤 걸린다. `npm run test:all` 에만 들어간다)

   2026-09-30 전체 점검에서 이 판 하나로 드러난 것들:
     - 판 사이 결과·세금 화면의 이름·등수가 자리가 바뀐 판마다 엇갈렸다
     - 1·2등이 줄 카드를 고르기도 전에 서버가 "가장 나쁜 카드" 를 대신 줘 버렸다
     - 혁명을 쥔 사람이 시간이 다 되면 "안 부름" 직후 "선언" 까지 보냈다
   여기서는 사람마다 세금에서 **가장 좋은(작은) 숫자**를 골라 준다 — 서버나 화면이 대신 주면
   큰 숫자(카멜레온 빼고)가 들어가므로 둘이 구별된다.

   쓰는 법:  node test/hum4.test.mjs   (zoo-server 가 zoo-app 옆에 있어야 한다) */
import { canRun, checker, startServer, roomOf, launch, human, closeAll, nap, waitFor } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;
const t0 = Date.now();
const T = () => ((Date.now() - t0) / 1000).toFixed(0) + "s";

const srv = await startServer({});
const env = await launch();
const names = ["원규", "민수", "지영", "철호"];
const H = [];
for (const n of names) H.push(await human(env, srv, n));
for (const h of H) await h.drv({ tax: "pick", think: [300, 800] });

const code = await H[0].create({ cap: 4, rounds: 3, tax: true });
for (let i = 1; i < 4; i++){ await nap(700); await H[i].join(code); }
await waitFor(async () => (await H[0].seated()) >= 4, 15000);
await nap(2000);
const rooms = await Promise.all(H.map(h => h.roomSeats()));
check("넷의 대기실이 같다", rooms.every(r => JSON.stringify(r) === JSON.stringify(names)), JSON.stringify(rooms));
check("방장에게만 시작 단추가 있다", Boolean(await H[0].startBtn()) && !(await H[1].startBtn()));
await H[0].pressStart();

/* 사람마다 판 사이 화면을 잡아 실제와 맞춰 본다 */
const seen = {};
let bad = [];
const taxChecks = [];
for (let k = 0; k < 3000; k++){
  await nap(300);
  const scr = await Promise.all(H.map(h => h.screen().catch(() => "?")));
  /* 세금: 다음 판이 시작되면 판 기록(G.given)에 **내가 고른 카드**가 들어갔는지 본다.
     서버가 먼저 대신 줬으면 큰 숫자가 들어가 있다 */
  for (let i = 0; i < 4; i++){
    const got = await H[i].page.evaluate(() => {
      const st = window.__eng && window.__eng.client && window.__eng.client.getState();
      if (!st || st.ctx.phase !== "play") return [];
      const out = [];
      for (const e of (window.__gave || [])){
        /* 고를 때 적어 둔 판 번호 = 세금을 걷는 그 판(엔진 G.roundNo 와 같다) */
        if (e.checked || st.G.roundNo !== e.round) continue;
        e.checked = true;
        out.push({ round: e.round, picked: e.cards.slice().sort((a, b) => a - b),
          applied: ((st.G.given || {})[window.__eng.client.playerID] || []).slice().sort((a, b) => a - b) });
      }
      return out;
    }).catch(() => []);
    got.forEach(x => taxChecks.push({ who: names[i], ...x }));
  }
  for (let i = 0; i < 4; i++){
    if (scr[i] !== "result" && scr[i] !== "tax") continue;
    const rn = await H[i].page.evaluate(() => (window.GAME || {}).roundNo);
    const key = i + ":" + scr[i] + ":" + rn;
    if (seen[key]) continue;
    seen[key] = true;
    await nap(scr[i] === "tax" ? 600 : 250);
    const r = await H[i].page.evaluate(which => {
      const v = window.__eng && window.__eng.view;
      const lr = v && v.lastRound;
      if (!lr) return null;
      const byName = lr.order.map(p => lr.seats[p] && lr.seats[p].name);       /* 실제 등수(이름) */
      const final = Boolean(window.__resultFinal);
      if (which === "result"){
        return { final, truth: byName,
          shown: [...document.querySelectorAll("#result .row__n")].map(e => e.textContent) };
      }
      const shown = {};
      document.querySelectorAll("#tax .seat").forEach(s => {
        shown[(s.querySelector(".seat__n") || {}).textContent] = (s.querySelector(".seat__r") || {}).textContent; });
      return { final, truth: byName, shown };
    }, scr[i]);
    if (!r) continue;
    if (scr[i] === "result" && !r.final){
      const ok = JSON.stringify(r.truth) === JSON.stringify(r.shown);
      if (!ok) bad.push(T() + " " + names[i] + " 결과 " + JSON.stringify(r.shown) + " ≠ " + JSON.stringify(r.truth));
    }
    if (scr[i] === "tax"){
      const want = Object.fromEntries(r.truth.map((n, k2) => [n, (k2 + 1) + "등"]));
      const ok = Object.keys(want).every(n => r.shown[n] === want[n]);
      if (!ok) bad.push(T() + " " + names[i] + " 세금 " + JSON.stringify(r.shown) + " ≠ " + JSON.stringify(want));
    }
  }
  const fin = await Promise.all(H.map(h => h.page.evaluate(() => Boolean(window.__resultFinal) &&
    (document.querySelector(".page.is-on") || {}).id === "result").catch(() => false)));
  if (fin.every(Boolean)) break;
}
const results = Object.keys(seen).filter(k => /result/.test(k)).length;
check("판 사이 결과·세금 화면을 넷 모두 봤다", results >= 8, results + "번");
check("결과·세금 화면의 이름·등수가 모두 실제와 같다", bad.length === 0, bad.slice(0, 3).join("\n           "));

/* 세금 — 내가 고른 카드가 들어갔나(서버가 대신 준 큰 숫자가 아니라) */
check("세금을 사람이 직접 골라 낸 것을 확인했다 (2·3판, 1·2등)", taxChecks.length >= 4,
  taxChecks.length + "번" + (taxChecks.length < 4 ? " — 혁명으로 세금이 없어진 판이 있으면 줄어든다" : ""));
const wrong = taxChecks.filter(x => JSON.stringify(x.picked) !== JSON.stringify(x.applied));
check("판에 들어간 세금 카드가 사람이 고른 그대로다", wrong.length === 0,
  wrong.map(x => x.who + " " + x.round + "판 고름" + JSON.stringify(x.picked) + " 들어감" + JSON.stringify(x.applied)).join(" · "));

/* 최종 */
const fins = [];
for (const h of H){
  fins.push(await h.page.evaluate(() => ({
    first: (document.querySelector("#result .row__n") || {}).textContent,
    over: window.__eng.view && window.__eng.view.over })));
}
check("넷 모두 최종 결과까지 갔다", fins.every(f => f.over), "");
check("넷 모두 같은 우승자를 본다", new Set(fins.map(f => f.first)).size === 1, JSON.stringify(fins.map(f => f.first)));
const lions = fins[0].over && fins[0].over.lions;
check("1등 횟수가 판 수만큼 적혔다", Array.isArray(lions) && lions.reduce((a, b) => a + b, 0) === 3, JSON.stringify(lions));
const errs = H.flatMap(h => h.errs.map(e => h.name + ": " + e));
check("오류가 없다 (엔진이 거부한 수 포함)", errs.length === 0, errs.slice(0, 3).join(" | "));
const stuck = [];
for (const h of H){ if ((await h.log()).some(l => l.includes("stuck"))) stuck.push(h.name); }
check("아무도 멈추지 않았다", stuck.length === 0, stuck.join(","));
console.log("   걸린 시간 " + T());

await closeAll(env, srv);
process.exit(C.done());
