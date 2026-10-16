/* 세금 주고받기 연출에 "undefined" 카드가 날아가던 것 (2026-10-15 신고: 8인 판 2등 화면 캡처)

   원인: 1·2등이 받을 카드(아래 등수의 가장 좋은 카드)를 화면이 **남의 손패**에서 찾았는데,
   온라인에서는 남의 손패가 안 보여 빈 값이 됐다. 그 빈 값을 앞면으로 그려 이름에 "undefined", 그림이 깨졌다.
   꼴찌 쪽은 반대로 위 등수가 준 카드를 늘 "12" 로 그렸다(실제로 준 카드와 다를 수 있다).

   고친 뒤:
     - 모르는 카드는 뒷면
     - 내가 준 카드 = 내가 고른 것, 내가 받은 카드 = **엔진이 실제로 옮긴 것** (앞면일 때)
     - 남들끼리 주고받는 것은 뒷면 그대로
   4인 판(모두가 매 판 세금에 끼인다)과 8인 판을 진짜 서버로 몇 판씩 돌려 본다.
   쓰는 법:  node test/taxfly.test.mjs [4|8] */
import { canRun, checker, launch, human, startServer, closeAll, nap, waitFor } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;

const REC = `(() => {
  if (window.__flyRec) return;
  window.__flyRec = []; window.__taxHands = {};
  const fx = () => document.querySelector("#tax #fx");
  /* 날아가는 카드마다 — 언제 앞면이 정해지는지(날아가는 순간) 다 기록한다 */
  new MutationObserver(recs => {
    for (const r of recs){
      const nodes = r.type === "childList" ? [...r.addedNodes] : [r.target];
      for (const d of nodes){
        if (!d.classList || !d.classList.contains("fly")) continue;
        window.__flyRec.push({ round: (window.__eng.view || {}).roundNo, from: d.dataset.from, to: d.dataset.to,
          card: d.dataset.card || "", html: d.innerHTML, at: Date.now() });
      }
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-card"] });
  /* 엔진 기준 내 손 — 세금 전(세금 단계에 처음 들어선 때) / 후(카드 내기로 넘어간 때) */
  setInterval(() => {
    const c = window.__eng && window.__eng.client, st = c && c.getState();
    if (!st) return;
    const me = Number(c.playerID), r = st.G.roundNo, t = window.__taxHands[r] = window.__taxHands[r] || {};
    if (st.ctx.phase === "tax" && !t.pre) t.pre = (st.G.hands[me] || []).slice();
    if (st.ctx.phase === "play" && t.pre && !t.post){
      t.post = (st.G.hands[me] || []).slice(); t.order = (st.G.taxOrder || []).slice(); t.me = me;
      t.given = JSON.parse(JSON.stringify(st.G.given || {})); t.cancelled = Boolean(st.G.taxCancelled);
    }
  }, 30);
})()`;

async function run(cap, rounds){
  const srv = await startServer({ ZOO_BOT_JOIN_MS: "300", ZOO_BOT_MIN_MS: "250", ZOO_BOT_MAX_MS: "500", NODE_ENV: "test" });
  const env = await launch();
  const H = await human(env, srv, "나");
  /* 판은 **자동치기**에 맡긴다 — 흉내 사람은 약한 수를 먼저 내서 거의 늘 꼴찌라, 1·2등(받는 쪽) 화면이 안 나왔다.
     자동치기는 봇과 같은 수를 둬서 등수가 고루 나온다. 세금은 흉내 사람이 고른다 */
  await H.drv({ on: true, think: [200, 500], tax: "pick", table: false });
  await H.page.evaluate(REC);
  await H.page.evaluate(() => setInterval(() => {
    const on = (document.querySelector(".page.is-on") || {}).id === "table";
    const b = document.querySelector("#table #auto");
    if (on && b && window.__eng && !window.__eng.auto) b.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, 400));
  await H.create({ cap, rounds, tax: true, clear2: false });
  await waitFor(async () => (await H.seated()) >= cap, 30000);
  await nap(800);
  await H.pressStart();
  const over = await waitFor(() => H.page.evaluate(() => Boolean(window.__eng.view && window.__eng.view.over)), 900000, 1000);
  const where = await H.page.evaluate(() => { const st = window.__eng.client && window.__eng.client.getState();
    return { scr: (document.querySelector(".page.is-on") || {}).id, round: st && st.G.roundNo, phase: st && st.ctx.phase,
      cur: st && st.ctx.currentPlayer, log: (window.__hlog || []).slice(-6) }; }).catch(e => String(e));
  check(cap + "인 " + rounds + "판 — 끝까지 갔다", over, over ? "" : JSON.stringify(where));
  const r = await H.page.evaluate(() => ({ fly: window.__flyRec, hands: window.__taxHands, faces: (window.GAME || {}).nowFaces }));
  /* 내가 위(1·2등)였던 판 수 — 받는 쪽 연출이 실제로 돌았는지 */
  r.hiRounds = Object.values(r.hands).filter(t => t.order && t.order.length && !t.cancelled && (t.order[0] === t.me || t.order[1] === t.me)).length;
  r.loRounds = Object.values(r.hands).filter(t => t.order && t.order.length && !t.cancelled && (t.order[t.order.length - 1] === t.me || t.order[t.order.length - 2] === t.me)).length;
  const errs = H.errs.slice();
  await closeAll(env, srv);
  return { r, errs };
}

const sub = (a, b) => { const x = a.slice(); for (const v of b){ const k = x.indexOf(v); if (k >= 0) x.splice(k, 1); } return x; };
/* 인원 하나만: node test/taxfly.test.mjs 4   (전체 검사 묶음은 4인만 돌린다 — 8인은 13분쯤 걸린다) */
const ONLY = process.argv[2] || process.env.TAXFLY_ONLY || "";
for (const [cap, rounds] of [[4, 7], [8, 5]].filter(([c]) => !ONLY || String(c) === ONLY)){
  console.log("\n[" + cap + "인 판]");
  const { r, errs } = await run(cap, rounds);
  /* 4인 판은 매 판 세금에 끼어서 위·아래가 다 나와야 한다. 8인 판은 3~6등이면 안 끼므로 한 번이라도 끼었으면 된다 */
  if (cap === 4) check("1·2등(받는 쪽)인 판과 꼴찌 쪽(주는 쪽)인 판이 다 나왔다", r.hiRounds > 0 && r.loRounds > 0, "위 " + r.hiRounds + "판 · 아래 " + r.loRounds + "판");
  else console.log("  (8인 판에서 세금에 낀 판: 위 " + r.hiRounds + " · 아래 " + r.loRounds + " — 3~6등이면 안 낀다. 위·아래는 4인 판이 꼭 본다)");
  const bad = r.fly.filter(f => /undefined/.test(f.html) || /src="(undefined)?"/.test(f.html));
  check("'undefined'·빈 그림 카드가 한 번도 안 날아갔다 (날아간 카드 " + r.fly.length + "장)", bad.length === 0 && r.fly.length > 0,
    bad.slice(0, 2).map(f => JSON.stringify(f).slice(0, 160)).join(" | "));
  /* 판마다: 내가 받은 카드(앞면이면 실제 받은 것), 내가 준 카드 */
  let inUp = 0, inBack = 0, outOk = 0, wrong = [];
  for (const [rn, t] of Object.entries(r.hands)){
    if (!t.pre || !t.post || t.cancelled) continue;
    const meGave = (t.given[t.me] || []);
    const gotReal = sub(t.post, sub(t.pre, meGave)).sort((a, b) => a - b);
    /* 그 판 세금 연출에서 나에게 온 것 / 내가 보낸 것 (연출은 판 번호 rn 일 때 돈다) */
    /* 가운데(-1)에서 나오는 것은 패 나누기 연출(늘 뒷면)이라 뺀다 */
    const flies = r.fly.filter(f => String(f.round) === String(rn) && f.card && f.from !== "-1");
    const incoming = flies.filter(f => f.to === "0" && f.card !== "back").map(f => Number(f.card));
    const outgoing = flies.filter(f => f.from === "0" && f.card !== "back").map(f => Number(f.card));
    inBack += flies.filter(f => f.to === "0" && f.card === "back").length;
    if (incoming.length){
      inUp += incoming.length;
      if (sub(incoming, gotReal).length) wrong.push(rn + "판 받은 카드 화면 " + JSON.stringify(incoming) + " · 실제 " + JSON.stringify(gotReal));
    }
    if (outgoing.length){
      /* 내가 1·2등이면 내가 고른 것, 꼴찌 쪽이면 엔진이 빼 간 가장 좋은 카드 */
      const lostReal = sub(t.pre, sub(t.post, gotReal)).sort((a, b) => a - b);
      if (sub(outgoing, lostReal).length) wrong.push(rn + "판 준 카드 화면 " + JSON.stringify(outgoing) + " · 실제 " + JSON.stringify(lostReal));
      else outOk += outgoing.length;
    }
  }
  check("앞면으로 날아온 카드 = 내가 실제로 받은 카드 (" + inUp + "장 앞면 · " + inBack + "장 뒷면)", !wrong.some(w => /받은/.test(w)), wrong.filter(w => /받은/.test(w)).join(" | "));
  check("내가 준 카드 = 실제로 빠진 카드 (" + outOk + "장)", (outOk > 0 || r.hiRounds + r.loRounds === 0) && !wrong.some(w => /준/.test(w)), wrong.filter(w => /준/.test(w)).join(" | "));
  check("화면 오류가 없다", errs.length === 0, errs.slice(0, 2).join(" | "));
}
process.exit(C.done());
