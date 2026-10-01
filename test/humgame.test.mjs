/* 사람 H명 + 봇 B명이 한 게임을 **끝까지** 한다 — 사람마다 따로 떨어진 크롬 창.

   2026-09-30 사용자 요청: "4·5·6·7·8명이서 봇 없이 사람만으로 한 판씩, 봇과 사람을 섞어서도 돌려 봐."
   이어서: "비공개 테스트는 사람이 안 해 본다. 올리기 전에 모든 오류를 잡아야 한다" —
   그래서 혁명 선언·도중에 나가기/다시 들어오기·느린 인터넷·영어 화면·2번 판 엎기도 넣었다.

   사람마다 보는 화면을 실제(엔진)와, 그리고 **사람끼리** 맞춰 본다.
     대기실    모두 같은 자리표 · 방장에게만 시작 단추
     자리      판마다 모두가 같은 순서로 둘러앉아 있다 · 화면 = 엔진 · 다음 판 자리 = 지난 판 등수(대혁명이면 거꾸로)
     결과      판 사이 결과 화면의 이름·등수 = 실제 · 모두가 같은 등수를 본다
     세금      세금 화면의 등수 = 실제 · 사람이 고른 카드가 그대로 · 시간 넘김은 카멜레온 빼고 큰 숫자 · 40초 안에 끝남
     혁명      선언하면 세금이 사라지고 모두의 화면에 선언으로 뜬다 · 안 부르면 모두의 화면에 "선언하지 않았습니다"
     최종      모두 최종까지 · 같은 순위 · 점수 = 판마다 등수로 계산한 값 · 1등 횟수 합 = 판 수
     멀쩡함    화면 오류 · 엔진이 거부한 수 · 멈춤 · 서버 오류 줄 · 이탈/자리비움 오판 — 모두 없음

   쓰는 법:  node test/humgame.test.mjs 사람수 봇수 [판수] [pick|timer]
   덧붙이는 것(환경 변수):
     HG_REV=declare|mix      혁명을 쥐면 선언한다(mix 는 반반). 없으면 안 누른다(시간이 다 되면 안 부름)
     HG_CHAOS=1              2판에 한 사람이 새로고침 후 "돌아갈까요?" 예 · 다른 한 사람은 뒤로가기로 판에서 나간다
     HG_NET=1                사람마다 느린 연결(한쪽 60~150ms) · 2판에 한 사람의 연결을 8초 끊는다
     HG_EN=1                 둘째 사람은 영어 화면
     HG_CLEAR2=1             2번 카드 판 엎기 켬
     HG_ACCT=1               서버를 계정 켠 채(메모리 계정 + 검사용 로그인 표)로 — 끝나면 **서버가 계정에 적은 점수**를
                             판 기록과 맞춰 본다(끝까지 한 사람 = 전부, 도중에 나간 사람 = 나갈 때 점수의 절반), 방장 티켓 한 장
   (zoo-server 가 zoo-app 옆에 있거나 ZOO_SERVER_DIR 로 알려 줘야 한다) */
import net from "node:net";
import { canRun, checker, startServer, roomOf, api, launch, human, closeAll, nap, waitFor } from "./_hum.mjs";

const H_N = Number(process.argv[2] || 4), B_N = Number(process.argv[3] || 0), ROUNDS = Number(process.argv[4] || 3);
/* 세금을 사람이 고르나(pick), 아무도 안 고르고 화면 시계가 다 돼 저절로 내나(timer).
   timer 면 1·2등 화면이 거의 같은 순간에 저절로 내므로 "동시에 낸 세금" 을 실제 화면으로 본다 */
const TAXMODE = process.argv[5] === "timer" ? "timer" : "pick";
const REV = process.env.HG_REV || "none";
const CHAOS = process.env.HG_CHAOS === "1" && H_N >= 3;
const NET = process.env.HG_NET === "1";
const EN = process.env.HG_EN === "1" && H_N >= 2;
const CLEAR2 = process.env.HG_CLEAR2 === "1";
const ACCT = process.env.HG_ACCT === "1";
const N = H_N + B_N;
if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;
const t0 = Date.now();
const T = () => ((Date.now() - t0) / 1000).toFixed(0) + "s";
console.log("\n=== 사람 " + H_N + " + 봇 " + B_N + " = " + N + "명 · " + ROUNDS + "판 · 세금 " +
  (TAXMODE === "timer" ? "시간 넘김(자동)" : "사람이 고름") + " · 혁명 " + REV +
  (CHAOS ? " · 새로고침/나가기" : "") + (NET ? " · 느린 연결/끊김" : "") + (EN ? " · 영어 1명" : "") + (CLEAR2 ? " · 2번 판 엎기" : "") +
  (ACCT ? " · 계정 켬" : "") + " ===");

const srv = await startServer(Object.assign(B_N
  ? { ZOO_BOT_JOIN_MS: "1200", ZOO_BOT_MIN_MS: "600", ZOO_BOT_MAX_MS: "1500" }
  : { ZOO_BOT_JOIN_MS: "600000" },
  ACCT ? { ZOO_ACCOUNTS: "memory", ZOO_TEST_TOKENS: "1", NODE_ENV: "test" } : {}));

/* 느린 연결 — 사람마다 서버 앞에 지연을 거는 중계기. 앱이 쓰는 모든 통신(방 API·판 소켓)이 지난다.
   cut(ms) 는 그 사람의 연결을 끊고 ms 동안 새 연결도 받지 않는다(폰이 잠깐 끊긴 것처럼) */
function relay(targetUrl, delay){
  const port0 = Number(new URL(targetUrl).port);
  const st = { down: false, socks: new Set() };
  const server = net.createServer(c => {
    if (st.down){ c.destroy(); return; }
    const u = net.connect(port0, "127.0.0.1");
    st.socks.add(c); st.socks.add(u);
    const pipe = (a, b) => a.on("data", d => setTimeout(() => { if (!b.destroyed) b.write(d); }, delay));
    pipe(c, u); pipe(u, c);
    const end = () => { c.destroy(); u.destroy(); st.socks.delete(c); st.socks.delete(u); };
    c.on("error", end); u.on("error", end); c.on("close", end); u.on("close", end);
  });
  return new Promise(res => server.listen(0, "127.0.0.1", () => res({
    url: "http://localhost:" + server.address().port, delay,
    cut(ms){ st.down = true; for (const s of st.socks) s.destroy(); setTimeout(() => { st.down = false; }, ms); },
    close(){ try { server.close(); } catch(e){} for (const s of st.socks) s.destroy(); },
  })));
}

const env = await launch();
const ALL = ["원규", "민수", "지영", "철호", "수진", "태호", "하나", "준서"];
const names = ALL.slice(0, H_N);
const lang = names.map((_, i) => (EN && i === 1 ? "en" : "ko"));
const relays = [];
const H = [];
/* 계정을 켰으면 사람마다 계정 문서를 심는다 — 이름은 서버가 여기서 가져간다 */
if (ACCT) for (let i = 0; i < H_N; i++)
  await api(srv, "/zoo/test/acct/hg" + i, { name: names[i], avatar: 0, score: 0, games: 0, tickets: 3, ticketAt: Date.now() });
for (let i = 0; i < H_N; i++){
  const r = NET ? await relay(srv.url, 60 + Math.round(Math.random() * 90)) : null;
  relays.push(r);
  H.push(await human(env, r ? { url: r.url } : srv, names[i], { lang: lang[i], uid: ACCT ? "hg" + i : null }));
}
if (NET) console.log("  (연결 지연 " + relays.map((r, i) => names[i] + " " + r.delay * 2 + "ms").join(" · ") + " 왕복)");
const DRV = { tax: TAXMODE, think: [300, 800], rev: REV };
for (const h of H) await h.drv(DRV);

/* **판 사이 화면은 페이지 안에서 적어 둔다.** 결과 화면은 5초뿐이라, 사람이 많아 바깥에서 한 바퀴 도는 데
   몇 초 걸리면 놓쳤다(2026-09-30 5명 판에서 2판 결과를 아무도 못 잡음). 페이지 안 시계는 150ms 마다 본다.
   실제 등수(엔진 lastRound)는 화면과 상관없이 판마다 적는다. 혁명 단계 문구도 판마다 모은다 */
const REC = `(() => {
  if (window.__rec) return; window.__rec = true;
  window.__resLog = []; window.__taxLog = []; window.__truth = {}; window.__revText = {};
  let on = "", since = 0;
  setInterval(() => {
    const s = (document.querySelector(".page.is-on") || {}).id;
    if (s !== on){ on = s; since = Date.now(); }
    const v = window.__eng && window.__eng.view;
    const lr = v && v.lastRound;
    if (!lr) return;
    const truth = lr.order.map(p => lr.seats[p] && lr.seats[p].name);
    /* 사람끼리 맞춰 볼 때는 엔진 자리 번호로 — 봇 이름은 언어마다 다르다 */
    if (!window.__truth[lr.roundNo]) window.__truth[lr.roundNo] = lr.order.map(p => lr.seats[p] && lr.seats[p].seat);
    if (s === "result" && !window.__resultFinal && Date.now() - since > 300){
      if (!window.__resLog.some(x => x.round === lr.roundNo)){
        const shown = [...document.querySelectorAll("#result .row__n")].map(e => e.textContent);
        if (shown.length === truth.length) window.__resLog.push({ round: lr.roundNo, truth, shown });
      }
    }
    if (s === "tax" && Date.now() - since > 600){
      if (!window.__taxLog.some(x => x.round === lr.roundNo)){
        const shown = {}; let n = 0;
        document.querySelectorAll("#tax .seat").forEach(el => {
          const nm = (el.querySelector(".seat__n") || {}).textContent, r = (el.querySelector(".seat__r") || {}).textContent;
          if (nm && r){ shown[nm] = r; n++; }
        });
        if (n === truth.length) window.__taxLog.push({ round: lr.roundNo, truth, shown });
      }
      const p = window.__taxProbe;
      if (p && p.step() === 2){
        const t = ((document.querySelector("#tax #mid .mid__s") || {}).textContent || "").trim();
        const k = lr.roundNo + 1;                       /* 이 세금·혁명이 걸린 판 = 엔진 G.roundNo */
        const a = (window.__revText[k] = window.__revText[k] || []);
        if (t && a.indexOf(t) < 0) a.push(t);
      }
    }
  }, 150);
})()`;
for (const h of H) await h.page.evaluate(REC);
const saved = names.map(() => ({ res: [], tax: [], truth: {}, revText: {} }));   /* 새로고침 전에 모아 둔 기록 */
const pullLogs = i => H[i].page.evaluate(() => ({ res: window.__resLog || [], tax: window.__taxLog || [],
  truth: window.__truth || {}, revText: window.__revText || {} })).catch(() => ({ res: [], tax: [], truth: {}, revText: {} }));
const mergeLogs = (a, b) => ({ res: a.res.concat(b.res.filter(x => !a.res.some(y => y.round === x.round))),
  tax: a.tax.concat(b.tax.filter(x => !a.tax.some(y => y.round === x.round))),
  truth: Object.assign({}, b.truth, a.truth),
  revText: Object.fromEntries([...new Set([...Object.keys(a.revText), ...Object.keys(b.revText)])].map(k =>
    [k, [...new Set([...(a.revText[k] || []), ...(b.revText[k] || [])])]])) });

/* ---------- 대기실 ---------- */
const code = await H[0].create({ cap: N, rounds: ROUNDS, tax: true, clear2: CLEAR2 });
for (let i = 1; i < H_N; i++){
  await nap(400);
  const r = await H[i].join(code);
  if (r.err) console.log("  (" + names[i] + " 들어가기 실패: " + r.err + ")");
}
const full = await waitFor(async () => (await H[0].seated()) >= N, 30000);
check("정원(" + N + "명)이 찼다", full, "앉은 " + (await H[0].seated()));
await nap(1500);
const room0 = await Promise.all(H.map(h => h.roomSeats().catch(() => [])));
/* 봇 이름은 언어마다 다르게 보인다(한국어 "막가22" · 영어 "moth12") — 같은 언어끼리 비교하고, 자리 수는 모두 같아야 한다 */
const sameLang = i => room0.filter((_, j) => lang[j] === lang[i]);
check("모두의 대기실 자리표가 같다 (같은 언어끼리 · 자리 수는 모두)",
  room0.every((r, i) => r.length === room0[0].length && sameLang(i).every(x => JSON.stringify(x) === JSON.stringify(r))),
  JSON.stringify(room0[0]) + (EN ? " / 영어 " + JSON.stringify(room0[1]) : ""));
const rb = await roomOf(srv, code);
const bots = (rb.players || []).filter(p => p.bot).length, hum = (rb.players || []).filter(p => p.name && !p.bot).length;
check("사람 " + H_N + " · 봇 " + B_N + " 으로 앉았다", bots === B_N && hum === H_N, "사람 " + hum + " · 봇 " + bots);
const btns = await Promise.all(H.map(h => h.startBtn()));
check("방장에게만 시작 단추가 있다", Boolean(btns[0]) && btns.slice(1).every(b => !b), JSON.stringify(btns.map(b => Boolean(b))));
if ((await H[0].screen()) === "room") await H[0].pressStart();
const inGame = await waitFor(async () => (await Promise.all(H.map(h => h.screen()))).every(s => s === "draw" || s === "table"), 40000);
check("모두 게임에 들어갔다", inGame, JSON.stringify(await Promise.all(H.map(h => h.screen()))));
/* 엔진 자리 번호 ↔ 이름 (방장 원규의 한국어 화면 기준).
   **쓰기 전에 선언해야 한다** — 아래에 두었다가 선언 전 대입(TDZ)으로 조용히 실패했다. 사람끼리 비교는 번호로, 보여 줄 때만 이름으로 */
let seatName = {};
let hostSeat = null;
const HOST_SEAT = () => hostSeat;
const nm = a => (a || []).map(x => seatName[x] != null ? seatName[x] : "#" + x);
await waitFor(async () => {
  const ss = await H[0].page.evaluate(() => (window.__eng.view && window.__eng.view.seats || []).map(x => [x.seat, x.name])).catch(() => []);
  if (ss.length !== N) return false;
  seatName = Object.fromEntries(ss); hostSeat = ss[0][0];
  return true;
}, 30000, 300);
check("자리 번호표를 읽었다", hostSeat != null && Object.keys(seatName).length === N, JSON.stringify(seatName));
const opts0 = await H[1].page.evaluate(() => Object.assign({}, window.__opts)).catch(() => ({}));
if (CLEAR2) check("2번 판 엎기 설정이 다른 사람에게도 갔다", opts0.clear2 === true, JSON.stringify(opts0));

/* ---------- 판을 따라가며 본다 ---------- */
const active = names.map(() => true);        /* 판에서 나간 사람은 그 뒤로 안 본다 */
const seatRows = {};             /* 판 → 사람마다 둘러앉은 이름(원규부터 돌린 것) */
const seatBad = [];
const truthBy = {};              /* 판 → 사람마다 본 실제 등수(이름) */
const bad = [];
const taxChecks = [];
const tableAt = {};
const taxSnap = {};              /* 사람:판 → 세금 단계를 처음 본 때·손패·순서 */
const taxRows = [];              /* 세금 단계가 얼마나 걸렸나 · 내가 낸 것 */
const revBy = {};                /* 판 → 혁명(쥔 사람·대혁명·선언했나·세금 취소) */
const events = [];               /* 새로고침·나가기·끊김 */
let reloadDone = false, quitDone = false, cutDone = false;
const RELOAD_I = 1, QUIT_I = H_N - 1, CUT_I = Math.min(2, H_N - 1);
const rot = (arr, first) => { const k = arr.indexOf(first); return k < 0 ? arr : arr.slice(k).concat(arr.slice(0, k)); };
const viewOf = i => H[i].page.evaluate(() => { const v = window.__eng && window.__eng.view;
  return v ? { rn: v.roundNo, ph: v.phase, mv: v.moveNo || 0, over: Boolean(v.over) } : null; }).catch(() => null);

for (let k = 0; k < 9000; k++){
  await nap(300);
  const scr = await Promise.all(H.map((h, i) => active[i] ? h.screen().catch(() => "?") : "gone"));

  /* ---- 흔들기: 2판 카드 내기 도중 ---- */
  if (CHAOS || NET){
    const v1 = await viewOf(0);
    if (v1 && v1.rn === 2 && v1.ph === "play" && v1.mv >= 4){
      if (CHAOS && !reloadDone){
        reloadDone = true;
        saved[RELOAD_I] = mergeLogs(saved[RELOAD_I], await pullLogs(RELOAD_I));
        const before = await H[RELOAD_I].page.evaluate(() => (window.__eng.view.hand || []).length).catch(() => -1);
        await H[RELOAD_I].reload();
        await nap(800);
        await H[RELOAD_I].page.evaluate(() => window.__goto && window.__goto("lobby"));
        const asked = await waitFor(() => H[RELOAD_I].page.evaluate(() => document.getElementById("ask").classList.contains("on")), 10000, 200);
        await H[RELOAD_I].page.evaluate(() => { const b = document.getElementById("askYes"); if (b) b.click(); });
        await H[RELOAD_I].page.evaluate(REC);
        await H[RELOAD_I].drv(DRV);
        const back = await waitFor(async () => (await H[RELOAD_I].screen()) === "table", 20000, 300);
        const after = await H[RELOAD_I].page.evaluate(() => {
          const c = window.__eng.client, st = c && c.getState();
          return { hand: (window.__eng.view.hand || []).length, eng: st ? (st.G.hands[Number(c.playerID)] || []).length : -1 };
        }).catch(() => ({ hand: -2, eng: -3 }));
        /* 남이 보는 내 장수와 내 손패가 같은가 (한 수 차이로 어긋날 수 있어 몇 초 안에 맞으면 된다) */
        let seenBy0 = null;
        const agree = await waitFor(async () => {
          const mine = await H[RELOAD_I].page.evaluate(() => (window.__eng.view.hand || []).length).catch(() => -1);
          seenBy0 = await H[0].page.evaluate(n => ((window.__eng.view.seats || []).find(x => x.name === n) || {}).c, names[RELOAD_I]).catch(() => -2);
          return mine === seenBy0;
        }, 5000, 250);
        events.push(names[RELOAD_I] + " 새로고침(" + T() + ")");
        check("새로고침 뒤 '돌아갈까요?' 가 떴다", asked);
        check("예 → 판 화면으로 돌아왔다", back, await H[RELOAD_I].screen());
        check("돌아온 손패 = 엔진 손패 (" + before + "장 → " + after.hand + "장)", after.hand === after.eng && after.hand > 0,
          JSON.stringify(after));
        check("돌아온 사람의 장수를 남도 똑같이 본다", agree, "남이 본 장수 " + seenBy0);
      }
      if (NET && !cutDone){
        cutDone = true;
        relays[CUT_I].cut(8000);
        events.push(names[CUT_I] + " 연결 8초 끊김(" + T() + ")");
      }
    }
    if (CHAOS && reloadDone && !quitDone && v1 && v1.rn === 2 && v1.ph === "play" && v1.mv >= 12 && active[QUIT_I]){
      quitDone = true;
      saved[QUIT_I] = mergeLogs(saved[QUIT_I], await pullLogs(QUIT_I));
      await H[QUIT_I].drv({ on: false });
      await H[QUIT_I].page.evaluate(() => window.__back && window.__back());
      await nap(400);
      await H[QUIT_I].page.evaluate(() => { const b = document.getElementById("askYes"); if (b) b.click(); });
      const out = await waitFor(async () => (await H[QUIT_I].screen()) === "lobby", 8000, 200);
      active[QUIT_I] = false;
      events.push(names[QUIT_I] + " 판에서 나감(" + T() + ")");
      check(names[QUIT_I] + " 가 뒤로가기로 판에서 나와 로비로 갔다", out);
      check("나간 사람은 완주 실패로 적혔다", await H[QUIT_I].page.evaluate(() => window.__scored === true).catch(() => false));
      const gone = await waitFor(async () => {
        const p = ((await roomOf(srv, code)).players || []).find(x => x.name === names[QUIT_I]);
        return p && p.left;
      }, 5000, 300);
      check("서버가 곧바로 이탈로 안다", gone);
    }
  }

  for (let i = 0; i < H_N; i++){
    if (!active[i]) continue;
    /* 세금: 다음 판 카드 내기가 시작되면 내가 고른 카드가 판 기록에 들어갔는지 본다 */
    const got = await H[i].page.evaluate(() => {
      const st = window.__eng && window.__eng.client && window.__eng.client.getState();
      if (!st || st.ctx.phase !== "play") return [];
      const out = [];
      for (const e of (window.__gave || [])){
        if (e.checked || st.G.roundNo !== e.round) continue;
        e.checked = true;
        out.push({ round: e.round, picked: e.cards.slice().sort((a, b) => a - b),
          applied: ((st.G.given || {})[window.__eng.client.playerID] || []).slice().sort((a, b) => a - b) });
      }
      return out;
    }).catch(() => []);
    got.forEach(x => taxChecks.push({ who: names[i], ...x }));

    /* 세금 단계 길이와 내가 낸 것, 혁명 (엔진 기록) */
    const ts = await H[i].page.evaluate(() => {
      const c = window.__eng && window.__eng.client, st = c && c.getState();
      if (!st) return null;
      const me = Number(c.playerID);
      const v = window.__eng.view || {};
      const nameOfSeat = s => ((v.seats || []).find(x => x.seat === s) || {}).name;
      const rv = st.G.revolution;
      return { ph: st.ctx.phase, rn: st.G.roundNo, me, hand: (st.G.hands[me] || []).slice(),
        order: (st.G.taxOrder || []).slice(), given: st.G.given || {}, off: Boolean(st.G.taxCancelled) || !st.G.taxOn,
        rev: rv ? { who: nameOfSeat(rv.seat), great: Boolean(rv.great), declared: Boolean(st.G.revDeclared),
          decided: Boolean(st.G.revDecided), cancelled: Boolean(st.G.taxCancelled) } : null };
    }).catch(() => null);
    if (ts){
      const sk = i + ":" + ts.rn;
      if (ts.ph === "tax" && !taxSnap[sk]) taxSnap[sk] = { t: Date.now(), hand: ts.hand, order: ts.order, me: ts.me };
      if (ts.ph === "play" && taxSnap[sk] && !taxSnap[sk].done){
        const sn = taxSnap[sk]; sn.done = true;
        const need = sn.order[0] === sn.me ? 2 : sn.order[1] === sn.me ? 1 : 0;
        taxRows.push({ who: names[i], round: ts.rn, ms: Date.now() - sn.t, need: ts.off ? 0 : need,
          hand: sn.hand, given: (ts.given[sn.me] || []).slice() });
        if (ts.rev && !revBy[ts.rn]) revBy[ts.rn] = ts.rev;
      }
    }

    /* 자리: 판마다 한 번, 판 화면에 들어오고 1.5초 뒤 */
    if (scr[i] === "table"){
      const rn = await H[i].page.evaluate(() => { const v = window.__eng && window.__eng.view;
        return v && v.phase === "play" && !v.over ? v.roundNo : null; }).catch(() => null);
      if (rn != null){
        const tk = i + ":" + rn;
        if (!tableAt[tk]) tableAt[tk] = Date.now();
        else if (tableAt[tk] > 0 && Date.now() - tableAt[tk] > 1500){
          tableAt[tk] = -1;
          const s = await H[i].page.evaluate(() => {
            const v = window.__eng.view;
            return { view: (v.seats || []).map(x => x.name), ids: (v.seats || []).map(x => x.seat),
              dom: [...document.querySelectorAll("#table #seats .seat")].map(d => ((d.querySelector(".seat__n") || {}).textContent || "").trim()) };
          }).catch(() => null);
          if (s){
            if (s.view[0] !== names[i]) seatBad.push(rn + "판 " + names[i] + ": 내 자리(아래)가 내가 아님 " + JSON.stringify(s.view));
            const domOk = s.dom.length === s.view.length && s.dom.every((d, j) => d === s.view[j] || (j === 0 && d));
            if (!domOk) seatBad.push(rn + "판 " + names[i] + ": 화면 " + JSON.stringify(s.dom) + " ≠ 엔진 " + JSON.stringify(s.view));
            (seatRows[rn] = seatRows[rn] || {})[names[i]] = rot(s.ids, HOST_SEAT());
          }
        }
      }
    }
  }
  const fin = await Promise.all(H.map((h, i) => !active[i] ? true : h.page.evaluate(() => Boolean(window.__resultFinal) &&
    (document.querySelector(".page.is-on") || {}).id === "result").catch(() => false)));
  if (fin.every(Boolean)) break;
}
await nap(800);
if (events.length) console.log("  (있었던 일: " + events.join(" · ") + ")");
const logs = [];
for (let i = 0; i < H_N; i++){
  const L = active[i] ? mergeLogs(saved[i], await pullLogs(i)) : saved[i];
  logs.push(L);
  for (const [r, t] of Object.entries(L.truth)) (truthBy[r] = truthBy[r] || {})[names[i]] = t;
  for (const x of L.res) if (JSON.stringify(x.truth) !== JSON.stringify(x.shown))
    bad.push(names[i] + " " + x.round + "판 결과 " + JSON.stringify(x.shown) + " ≠ " + JSON.stringify(x.truth));
  const label = k => lang[i] === "en" ? (n => n + (["th","st","nd","rd"][((n % 100) - 20) % 10] || ["th","st","nd","rd"][n % 100] || "th"))(k + 1) : (k + 1) + "등";
  for (const x of L.tax){
    const want = Object.fromEntries(x.truth.map((n, k2) => [n, label(k2)]));
    if (!Object.keys(want).every(n => x.shown[n] === want[n]))
      bad.push(names[i] + " " + x.round + "판 세금 " + JSON.stringify(x.shown) + " ≠ " + JSON.stringify(want));
  }
}
/* 판 사이 화면을 볼 사람 수: 나간 사람은 나간 판부터 빠지고, 새로고침 사이에 지나간 화면은 못 볼 수 있다 */
const quitRound = quitDone ? 2 : 99;
const expectRes = names.reduce((a, _, i) => a + (i === QUIT_I && quitDone ? Math.min(ROUNDS - 1, quitRound - 1) : ROUNDS - 1), 0);
const resSeen = logs.reduce((a, L) => a + L.res.length, 0), taxSeen = logs.reduce((a, L) => a + L.tax.length, 0);

/* ---------- 판마다 ---------- */
console.log("  -- 판마다 --");
const activeAt = r => names.filter((_, i) => !(quitDone && i === QUIT_I && r >= quitRound + 1));
for (let r = 1; r <= ROUNDS; r++){
  const rows = seatRows[r] || {};
  const who = Object.keys(rows);
  const need = activeAt(r).length;
  const same = who.length >= need - (CHAOS && r === 2 ? 1 : 0) && who.every(n => JSON.stringify(rows[n]) === JSON.stringify(rows[who[0]]));
  check(r + "판 · 모두가 같은 순서로 둘러앉았다 (" + who.length + "명 확인)", same,
    same ? nm(rows[who[0]]).join(" → ") : JSON.stringify(Object.fromEntries(who.map(n => [n, nm(rows[n])]))));
}
check("판 화면의 자리 = 엔진 자리 (모든 판·모든 사람)", seatBad.length === 0, seatBad.slice(0, 3).join(" | "));
/* 다음 판 자리는 지난 판 등수 순서로 둘러앉는다 — 그 판에 대혁명을 선언했으면 거꾸로 */
for (let r = 1; r < ROUNDS; r++){
  const tb = truthBy[r] || {}, w = Object.keys(tb)[0];
  const rows = seatRows[r + 1] || {}, w2 = Object.keys(rows)[0];
  if (!w || !w2) continue;
  const rv = revBy[r + 1];
  const great = rv && rv.declared && rv.great;
  const want = rot(great ? tb[w].slice().reverse() : tb[w], HOST_SEAT());
  const got = rows[w2];
  const ok = JSON.stringify(got) === JSON.stringify(want);
  check((r + 1) + "판 자리 = " + r + "판 등수 순서" + (great ? " 의 거꾸로 (대혁명)" : ""), ok,
    ok ? "" : "등수 " + nm(tb[w]).join(">") + " · 자리 " + nm(got).join("→"));
}
for (let r = 1; r < ROUNDS; r++){
  const tb = truthBy[r] || {};
  const who = Object.keys(tb);
  const same = who.length >= activeAt(r).length - (quitDone ? 1 : 0) && who.every(n => JSON.stringify(tb[n]) === JSON.stringify(tb[who[0]]));
  check(r + "판 결과 · 모두가 같은 등수를 봤다 (" + who.length + "명)", same,
    same ? nm(tb[who[0]]).join(" > ") : JSON.stringify(Object.fromEntries(who.map(n => [n, nm(tb[n])]))));
}
/* 새로고침하는 사이에 지나간 판 사이 화면은 못 볼 수 있다 — 흔들 때는 한 사람 몫까지 봐준다 */
const slack = CHAOS ? 2 : 0;
check("판 사이 결과 화면을 봤다 (" + resSeen + " / " + expectRes + ")", resSeen >= expectRes - slack && resSeen <= expectRes);
check("판 사이 세금 화면을 봤다 (" + taxSeen + " / " + expectRes + ")", taxSeen >= expectRes - slack && taxSeen <= expectRes);
check("판 사이 결과·세금 화면의 이름·등수가 모두 실제와 같다", bad.length === 0, bad.slice(0, 3).join(" | "));

/* ---------- 혁명 ---------- */
const revRounds = Object.entries(revBy).filter(([, v]) => v);
if (!revRounds.length) console.log("  (이번 게임에는 혁명을 쥔 사람이 없었다)");
for (const [r, v] of revRounds){
  const texts = logs.map((L, i) => ({ who: names[i], en: lang[i] === "en", t: (L.revText[r] || []).join(" / ") }))
    .filter((x, i) => activeAt(Number(r)).includes(names[i]) && x.t);
  const kind = (v.great ? "대혁명" : "혁명") + " · " + v.who + " · " + (v.declared ? "선언" : "안 부름");
  check(r + "판 " + kind + " — 엔진이 정했다", v.decided);
  if (v.declared){
    check(r + "판 선언 → 세금이 사라졌다", v.cancelled);
    const seenAll = texts.filter(x => x.en ? /Revolution\. |Great revolution\. /.test(x.t) : /혁명\. /.test(x.t));
    check(r + "판 선언 → 모두의 화면에 선언으로 떴다 (" + seenAll.length + "/" + texts.length + ")", texts.length > 0 && seenAll.length === texts.length,
      texts.filter(x => !seenAll.includes(x)).map(x => x.who + ": " + x.t).join(" | "));
  } else {
    check(r + "판 안 부름 → 세금을 걷었다", !v.cancelled);
    const seenAll = texts.filter(x => x.en ? /did not declare/.test(x.t) : /선언하지 않았습니다/.test(x.t));
    check(r + "판 안 부름 → 모두의 화면에 '선언하지 않았습니다' (" + seenAll.length + "/" + texts.length + ")", texts.length > 0 && seenAll.length === texts.length,
      texts.filter(x => !seenAll.includes(x)).map(x => x.who + ": " + x.t).join(" | "));
  }
  /* 선언 전에 "선언했다" 가 먼저 뜨면 안 된다 — 안 부른 판에 선언 문구가 섞였는지 */
  if (!v.declared){
    const wrongText = texts.filter(x => x.en ? /Revolution\. No tax|Great revolution\./.test(x.t) : /혁명\. 이번 판|대혁명\. /.test(x.t));
    check(r + "판 안 부른 혁명이 누구 화면에도 '선언' 으로 안 떴다", wrongText.length === 0, wrongText.map(x => x.who + ": " + x.t).join(" | "));
  }
}

/* ---------- 세금 ---------- */
const humanTax = taxChecks.length;
const wrong = taxChecks.filter(x => JSON.stringify(x.picked) !== JSON.stringify(x.applied));
check("사람이 고른 세금이 그대로 들어갔다 (" + humanTax + "번 확인)", wrong.length === 0,
  wrong.map(x => x.who + " " + x.round + "판 고름" + JSON.stringify(x.picked) + " 들어감" + JSON.stringify(x.applied)).join(" · "));

/* 세금 단계에서 아무도 멈춰 서 있지 않았다 — 서버가 대신 내는 45초까지 가면 누가 버려진 것이다.
   연결을 일부러 끊은 판에서 그 사람은 빼고 본다 */
const slow = taxRows.filter(r => r.ms > 40000 && !(NET && r.who === names[CUT_I] && r.round === 2));
check("세금 단계가 40초 안에 끝났다 (" + taxRows.length + "번 · 가장 긴 것 " +
  Math.round(Math.max(0, ...taxRows.map(r => r.ms)) / 1000) + "초)", taxRows.length > 0 && slow.length === 0,
  slow.map(r => r.who + " " + r.round + "판 " + Math.round(r.ms / 1000) + "초").join(" · "));
if (TAXMODE === "timer"){
  /* 시간이 다 돼 저절로 낼 때는 카멜레온을 빼고 큰 숫자부터 */
  const key = c => (c >= 13 ? -1 : c);
  const givers = taxRows.filter(r => r.need > 0);
  const bad2 = givers.filter(r => JSON.stringify(r.given.slice().sort((a, b) => a - b)) !==
    JSON.stringify(r.hand.slice().sort((a, b) => key(b) - key(a)).slice(0, r.need).sort((a, b) => a - b)));
  /* 봇이 섞이면 사람이 1·2등을 못 해 낼 일이 없을 수 있다 — 그때는 볼 것이 없다 */
  if (!givers.length) console.log("  (사람이 1·2등을 한 판이 없어 시간 넘김 세금은 이번 판에서 못 봄)");
  else check("시간 넘김으로 낸 세금 = 카멜레온 빼고 큰 숫자 (" + givers.length + "번)", bad2.length === 0,
    bad2.map(r => r.who + " " + r.round + "판 손" + JSON.stringify(r.hand) + " 낸 것" + JSON.stringify(r.given)).join(" · "));
}

/* 세금을 준 뒤 판 화면으로 넘어가기 전에 카드가 오가는 연출(2.1초)을 본다.
   예전에는 0.14초 만에 판으로 넘어가 연출이 잘렸다(nav 의 "판 시작" 처리기가 바뀐 글자를 읽음) */
if (TAXMODE === "pick"){
  const gaps = [];
  for (let i = 0; i < H_N; i++){
    if (!active[i]) continue;
    const lg = await H[i].log().catch(() => []);
    for (let j = 0; j < lg.length; j++){
      if (!/ tax give /.test(lg[j])) continue;
      const tg = Number(lg[j].split(" ")[0]);
      const nx = lg.slice(j + 1).find(l => / screen /.test(l));
      if (nx && / screen table/.test(nx)) gaps.push({ who: names[i], ms: Number(nx.split(" ")[0]) - tg });
    }
  }
  if (gaps.length) check("세금을 준 뒤 연출을 보고 판으로 간다 (" + gaps.length + "번 · 가장 짧은 것 " +
    Math.min(...gaps.map(g => g.ms)) + "ms)", gaps.every(g => g.ms >= 1500),
    gaps.filter(g => g.ms < 1500).map(g => g.who + " " + g.ms + "ms").join(" · "));
}

/* ---------- 최종 ---------- */
const fins = [];
for (let i = 0; i < H_N; i++){
  if (!active[i]) continue;
  fins.push(await H[i].page.evaluate(() => {
    /* 이름 → 엔진 자리 (이 화면의 언어로) — 사람끼리 비교는 자리 번호로 */
    const map = Object.fromEntries((window.__eng.view.seats || []).map(x => [x.name, x.seat]));
    return {
      rows: [...document.querySelectorAll("#result .row")].map(r => {
        const n = (r.querySelector(".row__n") || {}).textContent;
        return { n, id: map[n], t: Number((r.querySelector(".row__t") || {}).textContent) };
      }),
      over: window.__eng.view && window.__eng.view.over,
      final: Boolean(window.__resultFinal) };
  }).catch(() => ({ rows: [], over: null, final: false })));
}
check("남은 사람 모두 최종 결과까지 갔다 (" + fins.length + "명)", fins.every(f => f.over && f.final), fins.map(f => f.final).join(","));
const order0 = JSON.stringify(fins[0].rows.map(x => x.id + ":" + x.t));
check("모두 같은 최종 순위·점수를 본다", fins.every(f => JSON.stringify(f.rows.map(x => x.id + ":" + x.t)) === order0),
  fins[0].rows.map(x => x.n + ":" + x.t).join(" "));
/* 점수 = 판마다 등수로 받은 점수의 합 (상위 절반만 100·90·80 …) */
const exp = {};
const truthOf = r => { const tb = truthBy[r] || {}; const w = Object.keys(tb)[0]; return w ? tb[w] : null; };
let calcOk = true;
for (let r = 1; r <= ROUNDS; r++){
  let order = truthOf(r);
  if (!order && r === ROUNDS){
    order = await H[0].page.evaluate(() => { const lr = window.__eng.view && window.__eng.view.lastRound;
      return lr ? lr.order.map(p => lr.seats[p] && lr.seats[p].seat) : null; }).catch(() => null);
  }
  if (!order){ calcOk = false; continue; }
  order.forEach((id, rank) => { const n = seatName[id]; exp[n] = (exp[n] || 0) + (rank < Math.floor(N / 2) ? 100 - rank * 10 : 0); });
}
const shownScore = Object.fromEntries(fins[0].rows.map(x => [x.n, x.t]));
const scoreOk = calcOk && Object.keys(exp).length === N && Object.keys(exp).every(n => exp[n] === shownScore[n]);
check("최종 점수 = 판마다 등수로 계산한 값", scoreOk, "계산 " + JSON.stringify(exp) + " · 화면 " + JSON.stringify(shownScore));
const lions = fins[0].over && fins[0].over.lions;
check("1등 횟수 합 = 판 수", Array.isArray(lions) && lions.reduce((a, b) => a + b, 0) === ROUNDS, JSON.stringify(lions));

/* ---------- 계정 (서버가 적은 점수·티켓) ---------- */
if (ACCT){
  await nap(2500);                               /* 끝을 본 대리인이 적을 때까지 */
  const pts = (r, name) => { const o = truthOf(r); if (!o) return null;
    const k = o.findIndex(id => seatName[id] === name); return k >= 0 && k < Math.floor(N / 2) ? 100 - k * 10 : 0; };
  const bad = [];
  for (let i = 0; i < H_N; i++){
    const d = (await api(srv, "/zoo/test/acct/hg" + i)).body || {};
    let want = exp[names[i]];
    if (CHAOS && quitDone && i === QUIT_I){ const p1 = pts(1, names[i]); want = p1 == null ? null : Math.floor(p1 / 2); }
    const games = want > 0 ? 1 : 0;
    if (want == null || d.score !== want || (d.games || 0) !== games) bad.push(names[i] + " 계정 " + d.score + "점/" + (d.games || 0) + "판 · 기대 " + want);
  }
  check("서버가 계정에 적은 점수 = 판 기록 (끝까지 = 전부" + (CHAOS && quitDone ? ", 나간 사람 = 나갈 때 점수 절반" : "") + ")",
    bad.length === 0, bad.join(" · "));
  const host = (await api(srv, "/zoo/test/acct/hg0")).body || {};
  check("방장 티켓이 한 장 빠졌다 (3 → 2)", host.tickets === 2, String(host.tickets));
}

/* ---------- 멀쩡함 ---------- */
/* 연결을 일부러 끊은 사람의 "연결 실패" 줄은 빼고 본다 */
const errs = H.flatMap((h, i) => h.errs.filter(e => !(NET && i === CUT_I && /ERR_CONNECTION|WebSocket|socket|net::/i.test(e)))
  .map(e => h.name + ": " + e));
check("화면 오류·엔진이 거부한 수가 없다", errs.length === 0, errs.slice(0, 3).join(" | "));
const stuck = [];
for (let i = 0; i < H_N; i++){ if (active[i] && (await H[i].log()).some(l => l.includes("stuck"))) stuck.push(names[i]); }
check("아무도 멈추지 않았다", stuck.length === 0, stuck.join(","));
const end = await roomOf(srv, code);
const marked = (end.players || []).filter(p => !p.bot && p.name && (p.left || p.away) && !(quitDone && p.name === names[QUIT_I]))
  .map(p => p.name + (p.left ? "(이탈)" : "(자리비움)"));
check("남아 있는 사람이 이탈·자리비움으로 찍히지 않았다", marked.length === 0, marked.join(","));
const drawClash = srv.lines.filter(l => /invalid move: takeCard/.test(l));
const srvErr = srv.lines.filter(l => /error|에러|invalid|실패/i.test(l) && !/invalid move: takeCard/.test(l));
check("서버 오류 줄이 없다" + (drawClash.length ? " (뽑기에서 같은 카드 겹침 " + drawClash.length + "번은 규칙대로 막힌 것)" : ""),
  srvErr.length === 0, srvErr.slice(0, 3).join(" | "));
console.log("   걸린 시간 " + T());
console.log("SUMMARY " + JSON.stringify({ humans: H_N, bots: B_N, rounds: ROUNDS, tax: TAXMODE, rev: REV, chaos: CHAOS, net: NET, en: EN, clear2: CLEAR2,
  pass: C.pass, fail: C.fail, sec: Math.round((Date.now() - t0) / 1000), taxChecked: humanTax,
  revs: revRounds.map(([r, v]) => r + (v.great ? "G" : "S") + (v.declared ? "D" : "P")).join(","),
  srvErr: srvErr.length, drawClash: drawClash.length }));

for (const r of relays) if (r) r.close();
await closeAll(env, srv);
process.exit(C.done());
