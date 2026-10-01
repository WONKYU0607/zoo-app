/* 혁명 — 이 기기 방(봇과)에서 **나누는 패를 고정해** 혁명이 나는 판을 일부러 만든다.

   사람끼리 판에서는 혁명이 운으로만 나서(작은 혁명 몇 번, 대혁명 0번) 여기서 따로 못박는다.
   씨앗(__ZOO_SEED)을 고정하면 2판에 누가 카멜레온 두 장을 쥐는지가 늘 같다(아래 표는 seedfind 로 찾음).

     봇이 쥠      봇은 곧바로 선언한다. 세금 화면이 그 결과를 보여 주고 **멈추지 않고** 판으로 간다
                  (2026-09-30: 판이 끝난 순간의 옛 값 "아직 안 정함" 으로 덮어써 영영 기다리던 것)
     내가 쥠·선언  꼴찌로 만들어 대혁명 — 화면에 대혁명, 세금 없음, 다음 판 자리가 등수 거꾸로
     내가 쥠·안 부름  시간이 다 되면 "선언하지 않았습니다" 를 보여 주고 세금을 걷는다

   쓰는 법:  node test/revlocal.test.mjs     (서버 없이 돈다) */
import { canRun, checker, launch, human, closeAll, nap, waitFor } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;

/* 2판에 카멜레온 두 장을 쥐는 엔진 자리 (4명 · 3판 · 세금 · 2번 엎기 없음) */
const SEED_BOT = "zoo8";      /* 1번 자리(봇) */
const SEED_ME  = "zoo22";     /* 0번 자리(나) */

const REC = `(() => {
  window.__revText = []; window.__taxAt = 0; window.__tableAt = 0;
  let on = "";
  setInterval(() => {
    const s = (document.querySelector(".page.is-on") || {}).id;
    const v = window.__eng && window.__eng.view;
    if (s !== on){ on = s;
      if (s === "tax" && !window.__taxAt) window.__taxAt = Date.now();
      if (s === "table" && window.__taxAt && !window.__tableAt) window.__tableAt = Date.now();
    }
    /* 2판 카드 내기가 열린 순간의 차례 = 2판 선 (판 화면이 설 때까지 멈춰 있어 놓치지 않는다) */
    const st = window.__eng && window.__eng.client && window.__eng.client.store && window.__eng.client.store.getState();
    if (st && !window.__lead2 && st.ctx.phase === "play" && st.G.roundNo === 2) window.__lead2 = st.ctx.currentPlayer;
    const p = window.__taxProbe;
    if (s === "tax" && p && p.step() === 2){
      const t = ((document.querySelector("#tax #mid .mid__s") || {}).textContent || "").trim();
      if (t && window.__revText.indexOf(t) < 0) window.__revText.push(t);
    }
  }, 120);
})()`;

async function play(seed, drv){
  const env = await launch();
  const h = await human(env, { url: "" }, "원규");
  await h.drv(Object.assign({ think: [60, 150], tax: "pick" }, drv));
  await h.page.evaluate(REC);
  await h.page.evaluate(async s => {
    window.__ZOO_SEED = s;
    window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false };
    await window.__createRoom(); window.__goto("room");
  }, seed);
  await waitFor(async () => (await h.seated()) >= 4, 20000);
  await h.page.evaluate(async () => { await window.__startRound(); });
  await h.page.evaluate(() => setInterval(() => { if (window.__eng) window.__eng.botMs = 150; }, 200));
  /* 2판 카드 내기가 시작될 때까지 (세금 화면에서 멈추면 여기서 시간이 다 된다) */
  const got = await waitFor(() => h.page.evaluate(() => {
    const st = window.__eng.client && window.__eng.client.store.getState();
    return Boolean(st && st.ctx.phase === "play" && st.G.roundNo === 2 && window.__tableAt);
  }), 240000, 500);
  await nap(1500);
  const r = await h.page.evaluate(() => {
    const st = window.__eng.client.store.getState(), G = st.G, v = window.__eng.view;
    const lr = v.lastRound;
    return {
      rev: G.revolution, declared: G.revDeclared, cancelled: G.taxCancelled, given: G.given,
      taxOrder: G.taxOrder, lastOrder: G.lastOrder, lead: window.__lead2,
      texts: window.__revText, taxMs: window.__tableAt - window.__taxAt,
      rank1: lr && lr.order.map(p => lr.seats[p] && lr.seats[p].name),
      seats: (v.seats || []).map(x => x.name),
      dom: [...document.querySelectorAll("#table #seats .seat")].map(d => ((d.querySelector(".seat__n") || {}).textContent || "").trim()),
    };
  }).catch(e => ({ err: String(e) }));
  const errs = h.errs.slice();
  await closeAll(env, null);
  return { got, r, errs };
}
const rot = (a, f) => { const k = a.indexOf(f); return k < 0 ? a : a.slice(k).concat(a.slice(0, k)); };
const seatCheck = (r, label) => {
  /* 다음 판 자리 = 지난 판 등수 순서 (대혁명 선언이면 거꾸로) — 나를 기준으로 돌려서 본다 */
  const great = r.rev && r.rev.great && r.declared;
  const want = rot(great ? r.rank1.slice().reverse() : r.rank1, "원규");
  check(label + " 2판 자리 = 1판 등수" + (great ? " 거꾸로 (대혁명)" : ""), JSON.stringify(r.seats) === JSON.stringify(want),
    "자리 " + r.seats.join("→") + " · 등수 " + r.rank1.join(">"));
  check(label + " 판 화면 자리 = 엔진 자리", r.dom.length === r.seats.length && r.dom.every((d, i) => d === r.seats[i] || (i === 0 && d)),
    JSON.stringify(r.dom));
};

/* RL_ONLY=1|2|3 이면 그 경우만 (변이 시험용) */
const ONLY = process.env.RL_ONLY || "";
/* ---------- 봇이 쥐고 곧바로 선언 ---------- */
console.log("\n[봇이 혁명을 쥐고 곧바로 선언한다]");
if (!ONLY || ONLY === "1"){
  const { got, r, errs } = await play(SEED_BOT, {});
  check("2판까지 갔다 (세금 화면에서 안 멈춤)", got, JSON.stringify(r).slice(0, 200));
  if (r && !r.err && r.rev){
    check("봇이 쥔 혁명이다", r.rev.seat === 1, JSON.stringify(r.rev));
    check("봇이 선언했다 → 세금이 사라졌다", r.declared && r.cancelled);
    check("내 세금 화면에 선언으로 떴다", r.texts.some(t => /혁명\. /.test(t)), JSON.stringify(r.texts));
    check("세금 화면이 오래 안 걸렸다 (" + Math.round(r.taxMs / 1000) + "초)", r.taxMs > 0 && r.taxMs < 40000);
    seatCheck(r, "봇 혁명");
    const lead = r.taxOrder[0];      /* 대혁명이면 뒤집힌 줄의 맨 앞(1판 꼴찌), 아니면 1판 1등 */
    check("2판 선 = " + (r.rev.great ? "대혁명으로 뒤집힌 줄의 맨 앞(1판 꼴찌)" : "1판 1등"), String(r.lead) === String(lead),
      "선 " + r.lead + " · 기대 " + lead);
  }
  check("오류가 없다", errs.length === 0, errs.slice(0, 2).join(" | "));
}

/* ---------- 내가 쥐고 선언 (일부러 꼴찌 → 대혁명) ---------- */
console.log("\n[내가 혁명을 쥐고 선언한다 — 꼴찌라 대혁명]");
if (!ONLY || ONLY === "2"){
  const { got, r, errs } = await play(SEED_ME, { lose: true, rev: "declare" });
  check("2판까지 갔다", got, JSON.stringify(r).slice(0, 200));
  if (r && !r.err && r.rev){
    check("내가 쥔 혁명이다", r.rev.seat === 0, JSON.stringify(r.rev));
    check("일부러 져서 꼴찌 → 대혁명", r.rev.great === true, "1판 등수 " + (r.rank1 || []).join(">"));
    check("선언했다 → 세금이 사라졌다", r.declared && r.cancelled);
    check("세금 화면에 대혁명으로 떴다", r.texts.some(t => /대혁명\. /.test(t)), JSON.stringify(r.texts));
    seatCheck(r, "대혁명");
    check("대혁명이면 꼴찌였던 내가 2판 선", String(r.lead) === "0", "선 " + r.lead);
  }
  check("오류가 없다", errs.length === 0, errs.slice(0, 2).join(" | "));
}

/* ---------- 내가 쥐고 안 부름 (시간이 다 됨) ---------- */
console.log("\n[내가 혁명을 쥐고 안 부른다 — 시간이 다 됨]");
if (!ONLY || ONLY === "3"){
  const { got, r, errs } = await play(SEED_ME, {});
  check("2판까지 갔다", got, JSON.stringify(r).slice(0, 200));
  if (r && !r.err && r.rev){
    check("내가 쥔 혁명이다", r.rev.seat === 0, JSON.stringify(r.rev));
    check("안 불렀다 → 세금을 걷었다", !r.declared && !r.cancelled && Object.keys(r.given || {}).length === 2, JSON.stringify(r.given));
    check("화면에 '선언하지 않았습니다' 가 떴다", r.texts.some(t => /선언하지 않았습니다/.test(t)), JSON.stringify(r.texts));
    check("선언 문구는 안 떴다", !r.texts.some(t => /혁명\. 이번 판|대혁명\. /.test(t)), JSON.stringify(r.texts));
    seatCheck(r, "안 부름");
  }
  check("오류가 없다", errs.length === 0, errs.slice(0, 2).join(" | "));
}

process.exit(C.done());
