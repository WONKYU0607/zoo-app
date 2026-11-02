/* **대신 두다가 그 사람이 앱으로 돌아오면** (2026-11-01 사용자 질문)

   내 차례가 온 상태에서 폰을 끄고(앱이 멈춤) → 서버가 봇 속도로 대신 두는 동안 기다렸다가 → 다시 켠다.
   확인
     - 돌아오면 서버가 손을 돌려준다(자리비움 풀림)
     - **꺼지기 전에 걸어 둔 15초 시계가 뒤늦게 터져 자동치기가 저절로 켜지지 않는다**
       (멈춰 있던 시계는 다시 켜지는 순간 한꺼번에 터진다 — 그 사이 판은 서버가 이미 넘겼다)
     - 돌아온 뒤 내 차례가 오면 내가 직접 둘 수 있다(서버가 먼저 둬 버리지 않는다)
   쓰는 법:  node test/bgback.test.mjs   (zoo-server 가 zoo-app 옆에 있어야 한다) */
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
check("(준비) 둘 다 판에 들어왔다", await waitFor(async () => (await Promise.all(H.map(h => h.screen()))).every(x => x === "table"), 40000));
await H[1].drv({ on: false });
/* 민수 차례가 와서 15초 시계가 걸릴 때까지 */
const myTurn = await waitFor(() => H[1].page.evaluate(() => Boolean(window.__eng.view && window.__eng.view.myTurn)), 90000, 200);
check("(준비) 민수 차례가 왔다", myTurn);
await nap(1500);                          /* 시계가 걸리고 몇 초 지난 뒤에 끈다 */
const seat = await H[1].page.evaluate(() => Number(window.__eng.myID));
const awayOf = async () => { const b = await roomOf(srv, code); const p = (b.players || []).find(x => Number(x.id) === seat); return p ? Boolean(p.away) : null; };

await H[1].page.evaluate(() => window.dispatchEvent(new Event("apppause")));
const cdp = await H[1].page.target().createCDPSession();
await cdp.send("Page.setWebLifecycleState", { state: "frozen" });
await nap(18000);                         /* 15초 시계가 지나고도 남게 */
const movesBy = () => H[0].page.evaluate(s => ((window.__eng.moveLog) || []).filter(m => m.by === s).length, seat);
check("(준비) 꺼져 있는 동안 서버가 대신 뒀다", (await movesBy()) >= 1);

await cdp.send("Page.setWebLifecycleState", { state: "active" });
await H[1].page.evaluate(() => window.dispatchEvent(new Event("appresume")));
await nap(2500);
check("**돌아오면 손을 돌려받는다** (자리비움 풀림)", (await awayOf()) === false);
const auto = await H[1].page.evaluate(() => Boolean(window.__eng.auto));
check("**멈춰 있던 15초 시계가 뒤늦게 터져 자동치기가 켜지지 않는다**", auto === false, "자동 " + (auto ? "켜짐" : "꺼짐"));

/* 돌아온 뒤 내 차례 — 서버가 먼저 두지 않고 기다려 주는가 (서버 기본 20초, 여기서 6초만 지켜본다) */
const turn2 = await waitFor(() => H[1].page.evaluate(() => Boolean(window.__eng.view && window.__eng.view.myTurn)), 90000, 150);
check("(준비) 돌아온 뒤 민수 차례가 다시 왔다", turn2);
const before = await movesBy();
await nap(6000);
const still = await H[1].page.evaluate(() => Boolean(window.__eng.view && window.__eng.view.myTurn));
check("**돌아온 뒤 내 차례는 서버가 먼저 두지 않는다** (6초 동안 그대로 내 차례)", still && (await movesBy()) === before);

await closeAll(env, srv);
process.exit(C.done());
