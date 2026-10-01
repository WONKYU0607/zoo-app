/* 강퇴 · 서버가 빼는 티켓 — 사람 여럿이 진짜 서버에 붙어서 본다.

   강퇴 (2026-09-30 추가)
     - 방장이 대기실에서 **사람** 자리를 누르면 "OO님을 내보낼까요? (남은 횟수 N)" 한 번 묻는다
     - 아니오면 그대로, 예면 그 사람 화면에 "방장이 방에서 내보냈습니다" + 로비
     - 방장이 아닌 사람·자기 자리·봇 자리는 눌러도 아무 일 없음
     - 내보내진 사람은 번호로 다시 못 들어온다(까닭이 뜬다)
     - 한 방에 2번까지 — 세 번째는 "더 내보낼 수 없습니다" 만 뜨고 아무도 안 나간다
   티켓
     - 방장 계정에 티켓이 없으면 서버가 시작을 거절하고(402) 화면에 까닭이 뜬다 — 앱 숫자가 어긋나 있어도
     - 있으면 시작되고 서버가 한 장 뺀다

   계정은 서버의 메모리 저장소 + 검사용 로그인 표("test:uid") 로 돈다.
   쓰는 법:  node test/kick.test.mjs */
import { canRun, checker, launch, human, startServer, api, closeAll, nap, waitFor } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;

const srv = await startServer({ ZOO_ACCOUNTS: "memory", ZOO_TEST_TOKENS: "1", ZOO_BOT_JOIN_MS: "1500", NODE_ENV: "test" });
const env = await launch();
const seed = (uid, d) => api(srv, "/zoo/test/acct/" + uid, d);
const acct = async uid => (await api(srv, "/zoo/test/acct/" + uid)).body;
for (const [u, n] of [["k0", "방장님"], ["k1", "손님하나"], ["k2", "손님둘"], ["k3", "손님셋"]])
  await seed(u, { name: n, avatar: 1, score: 0, games: 0, tickets: 3, ticketAt: Date.now() });

async function person(uid, name){
  const h = await human(env, srv, name);
  await h.drv({ on: false });                         /* 이 검사는 판을 두지 않는다 */
  await h.page.evaluate(u => { window.__idToken = async () => "test:" + u; }, uid);
  return h;
}
const H = await person("k0", "방장님");
const A = await person("k1", "손님하나");
const Bq = await person("k2", "손님둘");
const Cq = await person("k3", "손님셋");

const askOn = p => p.page.evaluate(() => {
  const a = document.getElementById("ask");
  return a && a.classList.contains("on") ? {
    t: document.getElementById("askT").textContent, m: document.getElementById("askM").textContent,
    no: getComputedStyle(document.getElementById("askNo")).display !== "none" } : null;
});
const click = (p, sel) => p.page.evaluate(s => { const e = document.querySelector(s); if (e) e.dispatchEvent(new MouseEvent("click", { bubbles: true })); return Boolean(e); }, sel);
const tapSeat = (p, i) => p.page.evaluate(i => {
  const s = document.querySelectorAll("#room .seat")[i];
  if (s) s.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  return Boolean(s);
}, i);
const mySeat = async p => Number(((await p.seat()) || {}).playerID);
const roomNames = async code => ((await api(srv, "/zoo/rooms/" + code)).body.players || []).map(x => x.name || "");

/* ---------- 방 ---------- */
console.log("\n[방장 · 손님 셋]");
const code = await H.create({ cap: 6 });
check("방이 만들어졌다", Boolean(code), code);
for (const p of [A, Bq]) await p.join(code);
await waitFor(async () => (await H.roomSeats()).filter(x => /손님/.test(x)).length === 2, 8000);
const sa = await mySeat(A), sb = await mySeat(Bq), sh = await mySeat(H);
check("방장 화면에 손님 둘이 보인다 (이름은 계정의 것)", (await H.roomSeats()).includes("손님하나") && (await H.roomSeats()).includes("손님둘"),
  JSON.stringify(await H.roomSeats()));

/* ---------- 눌러도 아무 일 없어야 하는 곳 ---------- */
console.log("\n[아무 일 없어야 하는 누름]");
await tapSeat(A, sh); await nap(300);
check("손님이 방장 자리를 누르면 아무 일 없다", !(await askOn(A)));
await tapSeat(A, sb); await nap(300);
check("손님이 다른 손님 자리를 눌러도 아무 일 없다", !(await askOn(A)));
await tapSeat(H, sh); await nap(300);
check("방장이 자기 자리를 누르면 아무 일 없다", !(await askOn(H)));
await waitFor(async () => (await api(srv, "/zoo/rooms/" + code)).body.players.some(x => x.bot), 8000);
const botSeat = (await api(srv, "/zoo/rooms/" + code)).body.players.find(x => x.bot);
await nap(1700);                                      /* 방장 화면이 봇을 그릴 때까지 */
if (botSeat){ await tapSeat(H, Number(botSeat.id)); await nap(300); }
check("방장이 봇 자리를 누르면 아무 일 없다", Boolean(botSeat) && !(await askOn(H)));

/* ---------- 아니오 ---------- */
console.log("\n[강퇴 — 아니오]");
await tapSeat(H, sa); await nap(300);
let q = await askOn(H);
check("사람 자리를 누르면 한 번 묻는다", Boolean(q) && /손님하나/.test(q.m), q && q.m);
check("남은 횟수를 적는다 (2)", Boolean(q) && /남은 횟수 2/.test(q.m), q && q.m);
await click(H, "#askNo"); await nap(1800);
check("아니오면 그대로 앉아 있다", (await roomNames(code)).includes("손님하나") && (await A.screen()) === "room");

/* ---------- 예 ---------- */
console.log("\n[강퇴 — 예]");
await tapSeat(H, sa); await nap(300);
await click(H, "#askYes");
const gone = await waitFor(async () => (await A.screen()) === "lobby" && Boolean(await askOn(A)), 8000, 200);
const qa = await askOn(A);
check("내보내진 사람 화면: 로비로 가고 알림이 뜬다", gone && /내보냈습니다/.test(qa && qa.m), qa && qa.m);
check("알림은 확인 단추 하나", Boolean(qa) && !qa.no);
check("하던 방 기록도 지웠다 (돌아가라고 안 묻는다)", (await A.seat()) === null);
check("서버 방에서도 빠졌다", !(await roomNames(code)).includes("손님하나"));
await nap(1700);
check("방장 화면에서도 빠졌다", !(await H.roomSeats()).includes("손님하나"), JSON.stringify(await H.roomSeats()));
await click(A, "#askYes");

/* 번호로 다시 들어가 본다 — 로비의 번호 칸 */
await A.page.evaluate(c => { const i = document.querySelector("#lobby #code"); i.value = c; }, code);
await click(A, "#lobby #btJoin"); await nap(800);
const note = await A.page.evaluate(() => (document.querySelector("#lobby #hQuick") || {}).textContent || "");
check("내보내진 사람은 번호로 다시 못 들어온다 (까닭이 뜬다)", /내보낸/.test(note) && (await A.screen()) === "lobby", note);

/* ---------- 두 번째 · 세 번째 ---------- */
console.log("\n[한 방에 2번까지]");
await tapSeat(H, sb); await nap(300);
q = await askOn(H);
check("두 번째는 남은 횟수 1", Boolean(q) && /남은 횟수 1/.test(q.m), q && q.m);
await click(H, "#askYes");
check("두 번째 강퇴", await waitFor(async () => (await Bq.screen()) === "lobby", 8000, 200));
await Cq.join(code);
await waitFor(async () => (await H.roomSeats()).includes("손님셋"), 8000);
const sc = await mySeat(Cq);
await tapSeat(H, sc); await nap(300);
q = await askOn(H);
check("세 번째는 묻지 않고 '더 내보낼 수 없습니다' (확인 단추 하나)", Boolean(q) && /더 내보낼 수 없습니다/.test(q.m) && !q.no, q && q.m);
await click(H, "#askYes"); await nap(1800);
check("그래서 아무도 안 나갔다", (await roomNames(code)).includes("손님셋") && (await Cq.screen()) === "room");

/* ---------- 티켓 ---------- */
console.log("\n[티켓 — 서버가 뺀다]");
await waitFor(async () => (await H.seated()) >= 4, 12000);
/* 서버 계정에는 0장. 앱이 들고 있는 숫자와 어긋나도 서버가 막아야 한다 */
await seed("k0", { name: "방장님", avatar: 1, score: 0, tickets: 0, ticketAt: Date.now() });
await H.pressStart();
await nap(1500);
const sum = await H.page.evaluate(() => (document.getElementById("sum") || {}).textContent || "");
let rv = (await api(srv, "/zoo/rooms/" + code)).body;
check("티켓 0장이면 서버가 시작을 막는다", !rv.started && (await H.screen()) === "room", "시작 " + rv.started);
check("방장 화면에 까닭이 뜬다", /티켓이 없습니다/.test(sum), sum);
await seed("k0", { name: "방장님", avatar: 1, score: 0, tickets: 1, ticketAt: Date.now() - 60000 });
await nap(1800);                                         /* 단추가 다시 그려질 때까지 */
await H.pressStart();
const started = await waitFor(async () => (await api(srv, "/zoo/rooms/" + code)).body.started, 8000, 300);
check("티켓이 있으면 시작된다", started);
check("서버가 방장 티켓을 한 장 뺐다 (1 → 0)", (await acct("k0")).tickets === 0);
check("손님 티켓은 그대로", (await acct("k3")).tickets === 3);

const errs = [H, A, Bq, Cq].flatMap(p => p.errs.map(e => p.name + ": " + e));
check("화면 오류·알림창이 없다", errs.length === 0, errs.slice(0, 3).join(" | "));

await closeAll(env, srv);
process.exit(C.done());
