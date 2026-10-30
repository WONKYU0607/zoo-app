/* 기다리는 사이 방을 나가는 경우 (2026-10-28 1.0.8 앱 오류 알림 "reading 'numPlayers'" at __saveOpts) —
   설정 바꾸기 · 내보내기 · 시작을 누르고 답이 오기 전에 로비로 간다. 던짐 · 처리 안 된 약속 · 실패 창이 없어야 한다 */
import { canRun, launch, human, startServer, api, closeAll, nap, waitFor, roomOf } from "./_hum.mjs";
if (!(await canRun())) process.exit(0);
/* ZOO_TEST_REBUILD_HOLD_MS — 서버가 판을 새로 만드는 틈을 1.5초로 넓힌다(배포판에서는 꺼짐). 설정 답이 늦게 오는 가장 나쁜 때를 만든다 */
const srv = await startServer({ ZOO_ACCOUNTS: "memory", ZOO_TEST_TOKENS: "1", NODE_ENV: "test", ZOO_ALERT_URL: "", ZOO_BOT_JOIN_MS: "600000", ZOO_TEST_REBUILD_HOLD_MS: "1500" });
const env = await launch();
for (const u of ["u1", "u2"]) await api(srv, "/zoo/test/acct/" + u, { name: u === "u1" ? "방장" : "손님", avatar: 0, score: 0, coins: 0, owned: [], tickets: 5, ticketAt: Date.now() });
const H = await human(env, srv, "방장", { uid: "u1" });
const G = await human(env, srv, "손님", { uid: "u2" });
const P = H.page;
await H.drv({ on: false }); await G.drv({ on: false });
const errs = [];
P.on("pageerror", e => errs.push("pageerror " + e.message));
P.on("dialog", d => { errs.push("dialog " + d.message()); d.dismiss().catch(() => {}); });
await P.evaluate(() => { window.__rej = []; window.addEventListener("unhandledrejection", e => window.__rej.push(String(e.reason && e.reason.message || e.reason))); });
let fail = 0;
const ok = (c, m) => { console.log((c ? "  통과 " : "  실패 ") + m); if (!c) fail++; };
async function room(){ const code = await H.create({ cap: 4, rounds: 3, tax: true }); await nap(600); await G.join(code); await nap(1500); return code; }
async function race(label, fn){
  const out = await P.evaluate(fn);
  await nap(1500);
  const rej = await P.evaluate(() => window.__rej.splice(0));
  ok(out === "ok" && !rej.length && !errs.length, label + " — " + out + " rej " + JSON.stringify(rej) + " errs " + JSON.stringify(errs.splice(0)) + " 화면 " + await H.screen());
}
await room();
await race("설정 바꾸고 바로 나가기", async () => { window.__opts.cap = 6; const p = window.__saveOpts(); window.__goto("lobby"); try { await p; return "ok"; } catch(e){ return "throw " + e.message; } });
await nap(800); await G.page.evaluate(() => window.__goto && window.__goto("lobby")); await nap(800);
await room();
await race("내보내고 바로 나가기", async () => { const p = window.__kickSeat(1); window.__goto("lobby"); try { await p; return "ok"; } catch(e){ return "throw " + e.message; } });
await nap(800); await G.page.evaluate(() => window.__goto && window.__goto("lobby")); await nap(800);
await room();
await race("시작 누르고 바로 나가기", async () => { const p = window.__startRound(); window.__goto("lobby"); try { await p; return "ok"; } catch(e){ return "throw " + e.message; } });
/* 설정 바꾸고 나가서 **곧바로 새 방** (2026-10-29 사용자 질문). 옛 방 설정 답이 새 방을 만든 뒤에 온다.
   예전 앱: 그 답을 새 방에 적어 새 방(4명)의 설정 창이 6명으로 보였고, 그대로 확인하면 새 방이 6인이 됐다 */
await nap(800); await G.page.evaluate(() => window.__goto && window.__goto("lobby")); await nap(800);
{
  const A = await H.create({ cap: 4, rounds: 3, tax: true }); await nap(1200);
  const B = await P.evaluate(async () => {
    window.__opts.cap = 6; window.__saveOpts();
    await new Promise(r => setTimeout(r, 300));
    window.__goto("lobby");
    await new Promise(r => setTimeout(r, 200));
    window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false };
    await window.__createRoom(); window.__goto("room");
    return window.__roomCode();
  });
  await nap(3500);
  const ra = await roomOf(srv, A), rb = await roomOf(srv, B);
  const shown = await P.evaluate(async () => {
    const op = document.querySelector("#room [data-optopen]"); if (!op) return null;
    op.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise(r => setTimeout(r, 300));
    const v = Number((document.querySelector("#optBody span") || {}).textContent);
    document.getElementById("optGo").click();
    return v;
  });
  await nap(2500);
  const rb2 = await roomOf(srv, B);
  const rej = await P.evaluate(() => window.__rej.splice(0));
  ok(!ra.players && rb.numPlayers === 4 && shown === 4 && rb2.numPlayers === 4 && !rej.length && !errs.length,
     "나가고 곧바로 새 방 — 옛 방 " + (ra.players ? "남음" : "없음") + " · 새 방 " + rb.numPlayers + "인 · 설정 창 " + shown + "명 · 그대로 확인 뒤 " + rb2.numPlayers + "인 · rej " + JSON.stringify(rej) + " errs " + JSON.stringify(errs.splice(0)));
}
console.log(fail ? "=== 실패 " + fail + " ===" : "=== 모두 통과 ===");
await closeAll(env, srv);
process.exit(fail ? 1 : 0);
