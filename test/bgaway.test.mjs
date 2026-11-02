/* **판 도중 친구가 폰을 꺼 버리면** — 진짜 게임 서버 + 크롬 창 둘 (2026-11-01 사용자 신고)
   "친구 3이서하다가 한명이 폰을 그냥 껏는데 계속 15초 기다려서 패스하고 그러던데 나간판정이 안난거여 뭐여"

   폰 화면이 꺼지면 앱(안드로이드)은 pause 를 받고 곧 멈춘다. 그 상태를 그대로 흉내 낸다:
     apppause 를 보내고 → 크롬 개발 도구로 그 창을 **얼린다**(Page.setWebLifecycleState frozen — 시계·작업이 다 멈춤)
   확인
     - 앱이 뒤로 가자마자 서버가 그 자리를 자리비움으로 안다 (20초를 안 기다림)
     - 얼어 있는 동안 그 친구 차례를 **서버가 봇 속도로** 대신 둔다 — 판이 안 멈춘다
     - 다시 켜면(appresume) 서버가 손을 돌려준다(자리비움 풀림)
   서버 자리비움 시간은 기본값(20초) 그대로 — 예전 같으면 12초 동안 그 친구 차례가 한 번도 안 넘어간다

   쓰는 법:  node test/bgaway.test.mjs   (zoo-server 가 zoo-app 옆에 있어야 한다) */
import { canRun, checker, startServer, roomOf, launch, human, closeAll, nap, waitFor } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;

const srv = await startServer({ ZOO_BOT_JOIN_MS: "400", ZOO_BOT_MS: "400" });
const env = await launch();
const H = [await human(env, srv, "원규"), await human(env, srv, "민수")];
for (const h of H) await h.drv({ think: [150, 300] });
const code = await H[0].create({ cap: 4, rounds: 3, tax: false });
await nap(300); await H[1].join(code);
await waitFor(async () => (await H[0].seated()) >= 4, 15000);
await nap(400);
await H[0].pressStart();
const inTable = await waitFor(async () => (await Promise.all(H.map(h => h.screen()))).every(x => x === "table"), 40000);
check("(준비) 둘 다 판에 들어왔다", inTable);
/* 첫 판 카드 내기가 굴러가기 시작할 때까지 */
await waitFor(() => H[0].page.evaluate(() => ((window.__eng.moveLog) || []).length >= 2), 30000, 300);

const seat = await H[1].page.evaluate(() => Number(window.__eng.myID));
const awayOf = async () => { const b = await roomOf(srv, code); const p = (b.players || []).find(x => Number(x.id) === seat); return p ? Boolean(p.away) : null; };
check("(준비) 민수는 아직 자리비움이 아니다", (await awayOf()) === false);

/* 폰 화면을 끈다 */
await H[1].drv({ on: false });
await H[1].page.evaluate(() => window.dispatchEvent(new Event("apppause")));
const cdp = await H[1].page.target().createCDPSession();
await cdp.send("Page.setWebLifecycleState", { state: "frozen" });
const t0 = Date.now();
const awayFast = await waitFor(async () => (await awayOf()) === true, 3000, 200);
check("**앱이 뒤로 가자마자 서버가 자리비움으로 안다** (20초를 안 기다림)", awayFast, ((Date.now() - t0) / 1000).toFixed(1) + "초");

const movesBy = () => H[0].page.evaluate(s => ((window.__eng.moveLog) || []).filter(m => m.by === s).length, seat);
const m0 = await movesBy();
await nap(12000);
const m1 = await movesBy();
check("**꺼져 있는 동안 민수 차례를 서버가 봇 속도로 대신 둔다** (12초 동안)", m1 - m0 >= 2, (m1 - m0) + "수");
const still = await H[0].screen();
check("판이 멈추지 않았다", still === "table" || still === "tax" || still === "result", still);

/* 다시 켠다 */
await cdp.send("Page.setWebLifecycleState", { state: "active" });
await H[1].page.evaluate(() => window.dispatchEvent(new Event("appresume")));
const back = await waitFor(async () => (await awayOf()) === false, 4000, 200);
check("**다시 켜면 손을 돌려받는다** (자리비움 풀림)", back);

await closeAll(env, srv);
process.exit(C.done());
