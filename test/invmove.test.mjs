/* 대기실 A 에 앉은 채로 초대(B)를 받아 들어간다 (2026-10-29 한 계정 한 방 전수조사에서 찾음) — 앱은 "먼저 B 에 들어가고 된 다음 A 를 비운다".
   그 사이에도 A 를 1.5초마다 조회한다. 들어가기 답을 2초 늦춰(느린 폰 통신) 그 조회가 끼어들게 만든다.
   서버가 옛 자리를 곧바로 비우면 그 조회가 404 를 받아 "방이 닫혔어요" 창 + 로비로 튕겼다(서버 MOVE_GRACE 로 고침) */
import { canRun, launch, human, startServer, api, closeAll, nap, roomOf } from "./_hum.mjs";
if (!(await canRun())) process.exit(0);
const srv = await startServer({ ZOO_ACCOUNTS: "memory", ZOO_TEST_TOKENS: "1", NODE_ENV: "test", ZOO_ALERT_URL: "", ZOO_BOT_JOIN_MS: "600000", ...(process.env.GRACE ? { ZOO_MOVE_GRACE_MS: process.env.GRACE } : {}) });
const env = await launch();
for (const u of ["a1", "b1", "me"]) await api(srv, "/zoo/test/acct/" + u, { name: u, avatar: 0, score: 0, coins: 0, owned: [], tickets: 3, ticketAt: Date.now() });
const HA = await human(env, srv, "방장A", { uid: "a1" });
const HB = await human(env, srv, "방장B", { uid: "b1" });
const M = await human(env, srv, "나", { uid: "me" });
for (const x of [HA, HB, M]) await x.drv({ on: false });
const A = await HA.create({ cap: 4 }); const B = await HB.create({ cap: 4 });
await M.join(A); await nap(2000);
const seen = [];
M.page.on("dialog", d => { seen.push("dialog " + d.message()); d.dismiss().catch(() => {}); });
await M.page.evaluate(() => {
  window.__trail = [];
  setInterval(() => { const s = (document.querySelector(".page.is-on") || {}).id; if (window.__trail[window.__trail.length - 1] !== s) window.__trail.push(s); }, 50);
  const ask = document.getElementById("ask");
  new MutationObserver(() => { if (ask.classList.contains("on")) window.__trail.push("창:" + (document.getElementById("askM") || {}).textContent); }).observe(ask, { attributes: true });
});
const cdp = await M.page.createCDPSession();
await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*/join*", requestStage: "Response" }] });
cdp.on("Fetch.requestPaused", async ev => { await nap(2000); await cdp.send("Fetch.continueRequest", { requestId: ev.requestId }).catch(() => {}); });
const got = await M.page.evaluate(async c => { try { const s = await window.__joinRoom(c); window.__goto("room"); return s; } catch(e){ return "throw " + e.message; } }, B);
await nap(3000);
const trail = await M.page.evaluate(() => window.__trail);
const ra = await roomOf(srv, A), rb = await roomOf(srv, B);
const names = r => (r.players || []).filter(p => p.name && !p.bot).map(p => p.name).join(",");
console.log("들어간 방", got, "(B " + B + ") · 화면 흐름", JSON.stringify(trail), "· 창", JSON.stringify(seen));
console.log("A 사람:", names(ra), "· B 사람:", names(rb), "· 지금 화면", await M.screen(), "· 앱 방", await M.page.evaluate(() => window.__roomCode()));
const bad = trail.some(x => /^창:/.test(x)) || trail.includes("lobby");
const okB = names(rb).split(",").includes("me") && !names(ra).split(",").includes("me");
console.log(bad || !okB ? "=== 실패: 로비로 튕기거나 창이 뜸 / 자리 틀림 ===" : "=== 통과 ===");
await closeAll(env, srv);
process.exit(bad || !okB ? 1 : 0);
