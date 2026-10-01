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
/* **진짜로 그 자리를 누른다** — 얼굴 동그라미 가운데 좌표를 마우스로 찍는다.
   예전에는 자리 요소에 click 을 직접 쏴서, CSS 가 손가락을 막고 있는데도(앉은 자리 pointer-events:none)
   통과했다(2026-10-01 폰에서 강퇴가 안 뜸). 좌표로 찍어야 화면이 실제로 받는지 본다 */
const tapSeat = async (p, i) => {
  const at = await p.page.evaluate(i => {
    const s = document.querySelectorAll("#room .seat")[i];
    const av = s && s.querySelector(".seat__av");
    if (!av) return null;
    const r = av.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return { x, y, mine: Boolean(hit && s.contains(hit)) };
  }, i);
  if (!at) return false;
  await p.page.mouse.click(at.x, at.y);
  return at.mine;
};
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

/* 프로필 상자가 떴는가 — 전적·승률·강퇴 단추, 그리고 **어디에** 떴는가(그 얼굴 바로 밑, 화면을 덮지 않음) */
const pfOn = (p, seat) => p.page.evaluate(seat => {
  const b = document.getElementById("pfPop");
  if (!b || !b.classList.contains("on")) return null;
  const k = document.getElementById("pfKick");
  const r = b.getBoundingClientRect();
  const sv = seat != null ? document.querySelectorAll("#room .seat")[seat] : null;
  const av = sv && sv.querySelector(".seat__av").getBoundingClientRect();
  const W = document.getElementById("room").getBoundingClientRect();
  return { rec: document.getElementById("pfRec").textContent, rate: document.getElementById("pfRate").textContent,
           kick: Boolean(k && !k.hidden && k.offsetWidth > 0),
           below: av ? r.top >= av.bottom - 1 : null,
           under: av ? (r.left <= av.left + av.width / 2 && r.right >= av.left + av.width / 2) : null,
           small: r.width < W.width * 0.6 && r.height < W.height * 0.35,
           inside: r.left >= W.left && r.right <= W.right && r.bottom <= W.bottom };
}, seat);
/* 단추도 **좌표로** 누른다 — 화면이 실제로 받는지 본다 */
const press = async (p, sel) => {
  const at = await p.page.evaluate(s => { const e = document.querySelector(s); if (!e) return null;
    const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const h = document.elementFromPoint(x, y); return { x, y, mine: Boolean(h && (h === e || e.contains(h))) }; }, sel);
  if (!at) return false;
  await p.page.mouse.click(at.x, at.y);
  return at.mine;
};
/* 상자 밖(방 번호 줄)을 누르면 닫힌다 */
const closePf = p => press(p, "#room .roomno__n");
/* 손님하나의 전적을 심어 둔다 — 5전 3승 */
await seed("k1", { name: "손님하나", avatar: 1, score: 0, games: 0, tickets: 3, ticketAt: Date.now(), played: 5, wins: 3 });

/* ---------- 프로필 상자 ---------- */
console.log("\n[프로필 상자 — 얼굴 밑에 붙는 작은 상자]");
const reach = await tapSeat(A, sh);
check("앉은 자리 얼굴이 손가락을 받는다 (위에 덮인 것이 없다)", reach);
let pf = null;
await waitFor(async () => { pf = await pfOn(A, sh); return pf && pf.rec !== "\u2026"; }, 4000, 150);
check("손님이 방장 얼굴을 누르면 상자가 뜬다", Boolean(pf), JSON.stringify(pf));
check("상자는 그 얼굴 바로 밑에, 얼굴을 가리키며 붙는다", Boolean(pf) && pf.below && pf.under, JSON.stringify(pf));
check("화면을 덮지 않는 작은 상자다 (화면 안에 다 들어온다)", Boolean(pf) && pf.small && pf.inside, JSON.stringify(pf));
check("처음인 사람은 0승 0패 · 승률 -", Boolean(pf) && pf.rec === "0승 0패" && pf.rate === "-", JSON.stringify(pf));
check("손님 화면에는 강퇴 단추가 없다", Boolean(pf) && !pf.kick);
await closePf(A); await nap(300);
check("상자 밖을 누르면 닫힌다", !(await pfOn(A)));
await tapSeat(A, sb); await nap(500);
pf = await pfOn(A, sb);
check("손님끼리도 본다 (강퇴 단추 없이, 그 얼굴 밑에)", Boolean(pf) && !pf.kick && pf.below, JSON.stringify(pf));
await tapSeat(A, sb); await nap(300);
check("같은 얼굴을 또 누르면 닫힌다", !(await pfOn(A)));
await tapSeat(H, sh); await nap(300);
check("방장이 자기 자리를 누르면 아무 일 없다", !(await pfOn(H)) && !(await askOn(H)));
await waitFor(async () => (await api(srv, "/zoo/rooms/" + code)).body.players.some(x => x.bot), 8000);
await nap(1700);                                      /* 방장 화면이 봇을 그릴 때까지 */
const botSeat = (await api(srv, "/zoo/rooms/" + code)).body.players.find(x => x.bot);
await tapSeat(H, Number(botSeat.id));
await waitFor(async () => { pf = await pfOn(H, Number(botSeat.id)); return pf && pf.rec !== "\u2026"; }, 4000, 150);
check("봇 얼굴도 사람처럼 상자가 뜬다 (전적 · 강퇴 단추)", Boolean(pf) && pf.rec === "0승 0패" && pf.kick, JSON.stringify(pf));
await closePf(H); await nap(200);

/* ---------- 강퇴 — 아니오 ---------- */
console.log("\n[강퇴 — 아니오]");
await tapSeat(H, sa);
await waitFor(async () => { pf = await pfOn(H, sa); return pf && pf.rec !== "\u2026"; }, 4000, 150);
check("방장이 손님 얼굴을 누르면 그 밑에 상자 — 전적·승률", Boolean(pf) && pf.below && pf.rec === "3승 2패" && pf.rate === "60%",
  JSON.stringify(pf));
check("방장 화면에는 그 옆에 강퇴 단추가 있다", Boolean(pf) && pf.kick);
check("강퇴 단추가 손가락을 받는다", await press(H, "#pfKick"));
await nap(300);
let q = await askOn(H);
check("강퇴를 누르면 상자가 닫히고 확인창이 뜬다", !(await pfOn(H)) && Boolean(q) && /손님하나/.test(q.m), q && q.m);
check("남은 횟수를 적는다 (2)", Boolean(q) && /남은 횟수 2/.test(q.m), q && q.m);
await click(H, "#askNo"); await nap(1800);
check("아니오면 그대로 앉아 있다", (await roomNames(code)).includes("손님하나") && (await A.screen()) === "room");

/* ---------- 강퇴 — 예 ---------- */
console.log("\n[강퇴 — 예]");
await tapSeat(H, sa); await nap(400);
await press(H, "#pfKick"); await nap(300);
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

/* ---------- 두 번째(봇) · 세 번째 ---------- */
console.log("\n[한 방에 2번까지 — 봇도 센다]");
const bNow = (await api(srv, "/zoo/rooms/" + code)).body.players.find(x => x.bot);
const bIdx = (await api(srv, "/zoo/test/botidx/" + code)).body.botIdx[bNow.id];
await tapSeat(H, Number(bNow.id)); await nap(400);
await press(H, "#pfKick"); await nap(300);
q = await askOn(H);
check("두 번째(봇)는 남은 횟수 1", Boolean(q) && /남은 횟수 1/.test(q.m), q && q.m);
await click(H, "#askYes"); await nap(800);
const bi = (await api(srv, "/zoo/test/botidx/" + code)).body;
check("봇을 내보냈다 — 그 봇(이름)은 이 방에 다시 안 앉는다", bi.bannedBots.includes(bIdx) && !Object.values(bi.botIdx).includes(bIdx),
  "내보낸 " + bIdx + " · 지금 " + JSON.stringify(bi.botIdx));
await Cq.join(code);
await waitFor(async () => (await H.roomSeats()).includes("손님셋"), 8000);
const sc = await mySeat(Cq);
await tapSeat(H, sc); await nap(400);
await press(H, "#pfKick"); await nap(300);
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
