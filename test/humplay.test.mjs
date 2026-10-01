/* 사람 여럿이 **판**에서 겪는 일 — 진짜 게임 서버 + 크롬 창 여러 개.
   2026-09-30 전체 점검에서 찾은 것들을 못박는다.

     이모티콘   남이 이모티콘을 보내도 내 15초가 되돌아가지 않는다 (서버가 나를 자리비움으로 안 본다)
     자동복귀   한 번 자리를 비웠다 돌아와 자동으로 두면 이탈로 안 찍힌다
     판사이     판 사이 결과 화면에서 나가면 서버가 곧바로 안다 (남은 사람이 20초씩 안 기다린다)
     아니오     새로고침 뒤 "돌아갈까요?" 에 아니오면 서버에서도 자리를 놓는다
     결과순서   판 사이 결과 화면의 이름·등수가 실제와 같다 (이 기기 방 · 봇과)
     동점       최종 동점이면 모든 기기에 같은 우승자가 뜬다

   쓰는 법:  node test/humplay.test.mjs   (zoo-server 가 zoo-app 옆에 있어야 한다) */
import { canRun, checker, startServer, roomOf, launch, human, closeAll, nap, waitFor } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;

async function setup(names, env2 = {}){
  const srv = await startServer(env2);
  const env = await launch();
  const H = [];
  for (const n of names) H.push(await human(env, srv, n));
  return { srv, env, H };
}
/* 원규(방장)·민수 둘 + 봇 둘로 판을 세운다 */
async function twoHumans(env2){
  const s = await setup(["원규", "민수"], Object.assign({ ZOO_BOT_JOIN_MS: "400", ZOO_BOT_MS: "400" }, env2 || {}));
  for (const h of s.H) await h.drv({ think: [150, 300] });
  const code = await s.H[0].create({ cap: 4, rounds: 3, tax: false });
  await nap(300); await s.H[1].join(code);
  await waitFor(async () => (await s.H[0].seated()) >= 4, 15000);
  await nap(400);
  await s.H[0].pressStart();
  await waitFor(async () => (await Promise.all(s.H.map(h => h.screen()))).every(x => x === "table"), 40000);
  return Object.assign(s, { code });
}
const me = (b, name) => (b.players || []).find(p => p.name === name) || {};

/* ---------- 이모티콘 ---------- */
console.log("\n[남의 이모티콘이 내 시계를 되돌리지 않는다]");
{
  const { srv, env, H, code } = await twoHumans();
  await H[0].drv({ on: false });
  const mine = await waitFor(() => H[0].page.evaluate(() => Boolean(window.__eng.view && window.__eng.view.myTurn)), 60000, 200);
  const secs = [];
  for (let s = 0; mine && s < 12; s++){
    const t = await H[0].page.evaluate(() => { const e = document.querySelector("#table .count"); return e ? parseInt(e.textContent, 10) : null; });
    if (t != null) secs.push(t);
    if (s % 3 === 1) await H[1].page.evaluate(async () => {
      const b = document.querySelector("#table #emo"); if (b) b.click();
      await new Promise(r => setTimeout(r, 150));
      const k = document.querySelector("#table #emopick button"); if (k) k.click();
    });
    await nap(1000);
  }
  const got = await H[0].page.evaluate(() => ((window.__eng.client && window.__eng.client.chatMessages) || []).length);
  check("이모티콘이 실제로 왔다", got >= 3, got + "개");
  const rises = secs.filter((v, i) => i > 0 && v > secs[i - 1]).length;
  check("내 남은 초가 한 번도 되돌아가지 않는다", secs.length >= 8 && rises === 0, JSON.stringify(secs));
  await nap(6000);
  check("서버가 나를 자리비움으로 안 본다 (15초에 내 화면이 스스로 넘김)", !me(await roomOf(srv, code), "원규").away);
  await closeAll(env, srv);
}

/* ---------- 자동으로 돌아옴 ---------- */
console.log("\n[자리를 비웠다 돌아와 자동으로 두면]");
{
  const { srv, env, H, code } = await twoHumans({ ZOO_AWAY_MS: "5000" });
  await H[1].drv({ on: false });
  const covered = await waitFor(async () => me(await roomOf(srv, code), "민수").away, 90000);
  check("손을 놓으면 서버가 대신 두고 자리비움으로 본다", covered);
  await H[1].page.evaluate(() => { const b = document.querySelector("#table #auto"); if (b) b.click(); });
  const back = await waitFor(async () => !me(await roomOf(srv, code), "민수").away, 30000);
  check("자동을 켜면 '여기 있다' 가 서버에 간다", back);
  await waitFor(async () => (await H[1].page.evaluate(() => (window.__eng.view || {}).roundNo || 1)) >= 2, 200000, 1000);
  await nap(3000);
  check("판이 넘어가도 이탈로 안 찍힌다", !me(await roomOf(srv, code), "민수").left, JSON.stringify(me(await roomOf(srv, code), "민수")));
  await closeAll(env, srv);
}

/* ---------- 판 사이에 나가기 ---------- */
console.log("\n[판 사이 결과 화면에서 나가기]");
{
  const { srv, env, H, code } = await twoHumans();
  const r1 = await waitFor(async () => (await H[1].screen()) === "result", 300000, 500);
  check("1판 결과 화면까지 왔다", r1);
  await H[1].page.evaluate(() => { const q = document.querySelector("#result #quit"); if (q) q.click(); });
  await nap(1200);
  check("나간 사람은 로비로 간다", (await H[1].screen()) === "lobby", await H[1].screen());
  check("서버가 곧바로 이탈로 안다 (20초씩 안 기다린다)", me(await roomOf(srv, code), "민수").left === true);
  check("완주 실패로 적었다", await H[1].page.evaluate(() => window.__scored === true));
  check("하던 방 기록도 지웠다", !(await H[1].seat()));
  await closeAll(env, srv);
}

/* ---------- 돌아갈까요? 아니오 ---------- */
console.log("\n[새로고침 뒤 '돌아갈까요?' 에 아니오]");
{
  const { srv, env, H, code } = await twoHumans();
  await H[1].reload();
  await nap(800);
  await H[1].page.evaluate(() => window.__goto && window.__goto("lobby"));
  const asked = await waitFor(() => H[1].page.evaluate(() => document.getElementById("ask").classList.contains("on")), 8000);
  check("돌아갈지 묻는다", asked);
  await H[1].page.evaluate(() => { const b = document.getElementById("askNo"); if (b) b.click(); });
  await nap(1500);
  check("아니오면 서버에서도 자리를 놓는다", me(await roomOf(srv, code), "민수").left === true);
  check("기기의 하던 방 기록도 지운다", !(await H[1].seat()));
  await closeAll(env, srv);
}

/* ---------- 동점 ---------- */
console.log("\n[최종 동점]");
{
  const { srv, env, H } = await setup(["A"]);
  const shown = [];
  for (const who of [0, 1]){
    shown.push(await H[0].page.evaluate(me => {
      /* 엔진 자리 기준 — 가·나 동점, 1등 횟수도 같음, 마지막 판은 나가 1등.
         화면 자리는 늘 내가 0 이므로 view.js 처럼 돌려서 넣는다 */
      const all = ["가", "나", "다", "라"], sc = [300, 300, 100, 0], lions = [1, 1, 1, 0], last = [1, 0, 2, 3];
      const n = 4, rot = a => a.map((_, i) => a[(i + me) % n]);
      window.GAME = { N: n, names: rot(all), score: rot(sc), lions: rot(lions),
        finish: last.map(s => (s - me + n) % n), roundNo: 3, avatars: [0, 0, 0, 0] };
      window.__opts.rounds = 3; window.__scored = true;
      window.__bootResult();
      return (document.querySelector("#result .row__n") || {}).textContent;
    }, who));
  }
  check("동점이어도 두 기기의 우승자가 같다", shown[0] === shown[1] && shown[0] === "나", JSON.stringify(shown));
  await closeAll(env, srv);
}

/* ---------- 이 기기 방(봇과) 결과 순서 ---------- */
console.log("\n[판 사이 결과 화면의 이름·등수 (봇과 하는 판)]");
{
  const srv = { url: "", kill(){} };
  const env = await launch();
  const h = await human(env, srv, "원규");
  await h.drv({ think: [60, 120] });
  await h.page.evaluate(async () => { window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false };
    await window.__createRoom(); window.__goto("room"); });
  await waitFor(async () => (await h.seated()) >= 4, 20000);
  await h.page.evaluate(async () => { await window.__startRound(); });
  await h.page.evaluate(() => setInterval(() => { if (window.__eng) window.__eng.botMs = 120; }, 200));
  let seen = 0, moved = 0;
  for (let k = 0; k < 1500 && seen < 2; k++){
    await nap(300);
    if (await h.screen() !== "result") continue;
    const r = await h.page.evaluate(() => {
      const lr = window.__eng.view && window.__eng.view.lastRound;
      const now = (window.__eng.view.seats || []).map(x => x.name);
      return lr && { round: lr.roundNo, truth: lr.order.map(i => lr.seats[i] && lr.seats[i].name),
        shown: [...document.querySelectorAll("#result .row__n")].map(e => e.textContent),
        /* 이 판 뒤에 자리가 바뀌었나 — 안 바뀐 판에서는 옛 고장이 안 드러난다 */
        moved: JSON.stringify(lr.seats.map(x => x.name)) !== JSON.stringify(now) };
    });
    if (!r || r.round <= seen) continue;
    seen = r.round;
    if (r.moved) moved++;
    check(r.round + "판 결과 화면이 실제 등수와 같다", JSON.stringify(r.truth) === JSON.stringify(r.shown),
      "실제 " + JSON.stringify(r.truth) + " · 화면 " + JSON.stringify(r.shown));
    await nap(6000);
  }
  check("두 판 결과를 봤다", seen >= 2, String(seen));
  check("그중 자리가 바뀐 판이 있었다 (이게 없으면 위 확인은 뜻이 없다)", moved >= 1, moved + "번");
  check("잡히지 않은 오류가 없다", !h.errs.some(e => /pageerror/.test(e)), JSON.stringify(h.errs.slice(0, 2)));
  await closeAll(env, null);
}

process.exit(C.done());
