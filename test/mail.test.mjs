/* 우편함 — 진짜 앱 화면 + 진짜 게임 서버(메모리 계정) (2026-10-29 사용자: "광고시청 옆에 빈칸에 … 우편함 하나 만들자 누르면 그 주간랭킹보상 같은거 거기서 받을수잇게")
     1. 로비 윗줄 광고 시청 티켓 바로 오른쪽에 봉투 단추 · 소리 단추와 같은 크기 · 같은 줄 · 받을 우편 수(빨간 점)
     2. 서버가 주간 보상을 우편으로 넣는다(코인은 아직 그대로) → 창에 최근 것부터 · "주간 랭킹 N등 보상" · 그 주 날짜 · 코인
     3. 받기 → 서버 코인 + · 상단바 코인 · 줄이 빠짐 · 빨간 점 수 · 빨리 두 번 눌러도 한 번
     4. 모두 받기 · 비면 안내 · 로그인 안 됨 안내 · 뒤로가기로 닫힘 · 영어
     5. 옛 "주간 랭킹 보상" 알림 창은 안 뜬다
     6. 다시 만든 꼴(2026-10-29 사용자: "좀 성의잇게좀 만들어라") — 가운데 상자 · 이름판 · 닫기 · 보상 칸 · 도착 시간
        · 받은 줄이 빠져나감 · "보상 획득" 창(뒤로가기는 그것부터) · 모두 받기는 늘 보이고 비면 꺼짐 · 320px 에서 제목 한 줄
   쓰는 법:  node test/mail.test.mjs */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { canRun, checker, launch, human, startServer, api, closeAll, nap, SERVER_DIR } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;
const { periodKeys } = await import(pathToFileURL(join(SERVER_DIR, "accounts.js")).href);

const srv = await startServer({ ZOO_ACCOUNTS: "memory", ZOO_TEST_TOKENS: "1", NODE_ENV: "test", ZOO_ALERT_URL: "" });
const env = await launch();
const seed = (uid, d) => api(srv, "/zoo/test/acct/" + uid, d);
const acct = async uid => (await api(srv, "/zoo/test/acct/" + uid)).body;
const DAY = 86400e3, now = Date.now();
const k1 = periodKeys(now - 10 * 60e3 - 14 * DAY).wk, k2 = periodKeys(now - 10 * 60e3 - 7 * DAY).wk;

/* 지난지난주 1등(500) · 지난주 2등(300) — 서버의 진짜 주간 보상 길로 넣는다 */
const base = { name: "우편손님", avatar: 0, score: 12000, games: 3, coins: 1000, owned: [], tickets: 3, ticketAt: now };
await seed("u1", Object.assign({}, base, { wkKey: k1, wk: 900 }));
await api(srv, "/zoo/test/weekly/" + k1, {});
let d = await acct("u1");
await seed("u1", Object.assign({}, d, { wkKey: k2, wk: 400 }));
await seed("u2", { name: "일등", coins: 0, owned: [], tickets: 3, ticketAt: now, wkKey: k2, wk: 800 });
await api(srv, "/zoo/test/weekly/" + k2, {});
d = await acct("u1");
check("(준비) 서버가 우편 둘을 넣었다 · 코인은 그대로 1000", (d.mail || []).length === 2 && d.coins === 1000, JSON.stringify(d.mail));

const H = await human(env, srv, "우편손님", { uid: "u1" });
await H.drv({ on: false });
const P = H.page;
const signIn = x => P.evaluate(x => {
  Object.assign(window.ACCOUNT, { signedIn: true, loaded: true, guest: false, uid: "u1", needName: false }, x);
  window.dispatchEvent(new Event("accountchange"));
}, x);
const sync = async () => { const a = await acct("u1"); await signIn({ coins: a.coins, mail: a.mail || [], score: a.score, tickets: a.tickets, ticketAt: a.ticketAt }); return a; };
await sync();
await P.evaluate(() => window.__goto("lobby"));
await nap(900);

const click = sel => P.evaluate(s => { const e = document.querySelector(s); if (e) e.dispatchEvent(new MouseEvent("click", { bubbles: true })); return Boolean(e); }, sel);
const box = () => P.evaluate(() => {
  const b = document.getElementById("mailBox");
  const rows = [...document.querySelectorAll("#mailList .ml__row")].map(r => ({
    t: (r.querySelector(".ml__tx b") || {}).textContent || "", s: (r.querySelector(".ml__tx span") || {}).textContent || "",
    c: (r.querySelector(".ml__c") || {}).textContent || "", id: (r.querySelector("[data-mailget]") || {}).getAttribute?.("data-mailget") }));
  return { on: b.classList.contains("on"), title: document.getElementById("mailT").textContent, rows,
    note: document.getElementById("mailNote").textContent, bad: document.getElementById("mailNote").classList.contains("ml__note--bad"),
    all: !document.getElementById("mailAllRow").hidden && !document.getElementById("mailAll").disabled, allT: document.getElementById("mailAll").textContent,
    got: document.getElementById("mailGot").classList.contains("on"), gotN: document.getElementById("mgN").textContent, gotM: document.getElementById("mgM").textContent,
    empty: (document.querySelector("#mailList .ml__empty") || {}).textContent || "" };
});
const badge = () => P.evaluate(() => { const n = document.querySelector("#btMail .bt-mail__n"); return n && !n.hidden ? n.textContent : ""; });
const coinsTop = () => P.evaluate(() => document.getElementById("acctCoins").textContent);

/* ---------- 1. 단추 자리 ---------- */
console.log("\n[1. 로비 윗줄 — 광고 시청 티켓 옆]");
const pos = await P.evaluate(() => {
  const bar = document.querySelector("#lobby .rankbar");
  const kids = [...bar.children].map(k => k.id || k.className);
  const r = id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { x: b.left, r: b.right, y: b.top, h: b.height, w: b.width }; };
  return { kids, ad: r("btAd"), mail: r("btMail"), mute: r("btMute"), fr: document.querySelector("#lobby .bt-friend").getBoundingClientRect().left,
    vw: innerWidth, label: document.getElementById("btMail").getAttribute("aria-label") };
});
check("**광고 시청 티켓 바로 다음이 우편함**", pos.kids[0] === "btAd" && pos.kids[1] === "btMail", pos.kids.join(","));
check("소리 단추와 같은 크기 · 같은 줄(높이·위치)", Math.abs(pos.mail.w - pos.mute.w) < 0.5 && Math.abs(pos.mail.h - pos.mute.h) < 0.5 && Math.abs(pos.mail.y - pos.mute.y) < 0.5 &&
  Math.abs((pos.mail.y + pos.mail.h / 2) - (pos.ad.y + pos.ad.h / 2)) < 1, JSON.stringify([pos.mail, pos.mute]));
check("광고 단추 바로 옆(줄 간격만큼) · 친구 단추와 겹치지 않는다", pos.mail.x - pos.ad.r > 3 && pos.mail.x - pos.ad.r < 9 && pos.mail.r < pos.fr - 3,
  (pos.mail.x - pos.ad.r).toFixed(1) + " / " + (pos.fr - pos.mail.r).toFixed(1));
check("**받을 우편 수 2 (빨간 점)** · 읽어 주는 이름", (await badge()) === "2" && pos.label === "우편함 2", (await badge()) + " / " + pos.label);
check("옛 \"주간 랭킹 보상\" 알림 창은 안 뜬다", !(await P.evaluate(() => document.getElementById("ask").classList.contains("on"))));

/* ---------- 2. 창 ---------- */
console.log("\n[2. 우편함 창]");
await click("#btMail"); await nap(500);
let b = await box();
const span = k => P.evaluate(k => { const m = /^(\d{4})-W(\d+)$/.exec(k); const j4 = Date.UTC(+m[1], 0, 4);
  const mon = j4 - ((new Date(j4).getUTCDay() + 6) % 7) * 864e5 + (m[2] - 1) * 7 * 864e5; const a = new Date(mon), e = new Date(mon + 6 * 864e5);
  return (a.getUTCMonth() + 1) + "월 " + a.getUTCDate() + "일 ~ " + (a.getUTCMonth() === e.getUTCMonth() ? "" : (e.getUTCMonth() + 1) + "월 ") + e.getUTCDate() + "일"; }, k);
check("**창이 열린다 · 제목 우편함 · 최근 것부터 둘**", b.on && b.title === "우편함" && b.rows.length === 2 && b.rows[0].id === "wk-" + k2 && b.rows[1].id === "wk-" + k1, JSON.stringify(b.rows));
check("**\"주간 랭킹 2등 보상\" 300 · \"주간 랭킹 1등 보상\" 500**", b.rows[0].t === "주간 랭킹 2등 보상" && b.rows[0].c === "300" && b.rows[1].t === "주간 랭킹 1등 보상" && b.rows[1].c === "500");
check("그 주 날짜(월~일)", b.rows[0].s === await span(k2) && b.rows[1].s === await span(k1), b.rows.map(r => r.s).join(" | "));
check("모두 받기 단추 (둘 이상일 때)", b.all && b.allT === "모두 받기");
const look = () => P.evaluate(() => {
  const R = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const row = document.querySelector("#mailList .ml__row");
  const tb = row && row.querySelector(".ml__tx b");
  const lh = tb ? parseFloat(getComputedStyle(tb).lineHeight) : 0;
  return { vw: innerWidth, vh: innerHeight, p: R("#mailBox .ml__p"), rib: R("#mailBox .ml__rib"), x: R("#mailBox .ml__x"),
    slot: R("#mailList .ml__slot"), coin: getComputedStyle(document.querySelector("#mailList .ml__coin")).backgroundImage,
    tierCls: [...document.querySelectorAll("#mailList .ml__slot")].map(e => e.className.replace("ml__slot", "").trim()),
    at: [...document.querySelectorAll("#mailList .ml__tx em")].map(e => e.textContent),
    titleLines: tb ? Math.round(tb.getBoundingClientRect().height / lh) : 0, get: R("#mailList .ml__get"), all: R("#mailAll"),
    over: [...document.querySelectorAll("#mailList .ml__row")].some(r => r.scrollWidth > r.clientWidth + 1) };
});
let L = await look();
check("**가운데 상자** · 이름판이 상자 위 가운데 · 닫기가 오른쪽 위(화면 안)", Math.abs((L.p.x + L.p.r) / 2 - L.vw / 2) < 1.5 && Math.abs((L.rib.x + L.rib.r) / 2 - L.vw / 2) < 1.5 &&
  L.rib.y < L.p.y + 26 && L.rib.y > 0 && L.x.r <= L.vw && L.x.y > 0 && L.x.x > L.p.r - 70, JSON.stringify([L.p, L.rib, L.x]));
check("**보상 칸에 코인 그림** · 2등 은빛 · 1등 금빛", /coin\.webp/.test(L.coin) && L.tierCls[0] === "ml__slot--p2" && L.tierCls[1] === "ml__slot--p1", L.coin + " " + L.tierCls.join(","));
check("도착 시간 — 서버가 방금 넣었다 → \"방금\"", L.at[0] === "방금" && L.at[1] === "방금", L.at.join(" | "));
check("줄 안에서 넘치지 않는다 · 제목 한 줄 (" + L.vw + "px)", !L.over && L.titleLines === 1, L.titleLines + "줄");
for (const w of [320, 412]){
  await P.setViewport({ width: w, height: 720 }); await nap(250);
  L = await look();
  check("**" + w + "px** — 상자·이름판·닫기가 화면 안 · 제목 한 줄 · 넘침 없음", L.p.x >= 0 && L.p.r <= w && L.rib.y > 0 && L.x.r <= w && L.x.y > 0 && L.titleLines === 1 && !L.over,
    JSON.stringify({ p: [L.p.x, L.p.r], x: L.x.r, lines: L.titleLines }));
}
await P.setViewport({ width: 360, height: 760 }); await nap(250);
/* 월~일이 정말 그 주 딱지와 맞는가 — 서버 periodKeys 로 거꾸로 */
const kOf = s => s;
const mon2 = await P.evaluate(k => { const m = /^(\d{4})-W(\d+)$/.exec(k); const j4 = Date.UTC(+m[1], 0, 4);
  return j4 - ((new Date(j4).getUTCDay() + 6) % 7) * 864e5 + (m[2] - 1) * 7 * 864e5; }, k2);
check("날짜 계산이 서버 주 딱지와 맞다 (그 주 월요일·일요일 정오 KST → 같은 딱지)",
  periodKeys(mon2 + 3 * 3600e3).wk === k2 && periodKeys(mon2 + 6 * DAY + 3 * 3600e3).wk === k2 && periodKeys(mon2 - 12 * 3600e3).wk !== k2, kOf(k2));

/* ---------- 3. 받기 ---------- */
console.log("\n[3. 받기]");
await click('[data-mailget="wk-' + k2 + '"]');
/* 받은 줄이 옆으로 빠져나가는가 — 서버 답이 오면 그 줄에 ml__row--out 이 붙는다 */
const slid = await P.evaluate(async id => { for (let i = 0; i < 60; i++){ const r = document.querySelector('[data-mailrow="' + id + '"]');
  if (r && r.classList.contains("ml__row--out")) return true; await new Promise(z => setTimeout(z, 15)); } return false; }, "wk-" + k2);
await nap(900);
b = await box(); d = await acct("u1");
check("**받기 → 서버 코인 1000 → 1300 · 우편 하나 남음**", d.coins === 1300 && d.mail.length === 1, d.coins + " / " + d.mail.length);
check("받은 줄이 옆으로 빠져나간 뒤 목록에서 사라진다", slid && b.rows.length === 1 && b.rows[0].id === "wk-" + k1, String(slid));
check("**\"보상 획득\" 창 — +300 · \"코인 300개를 받았습니다\"** · 아래 글줄은 비어 있음", b.got && b.gotN === "+300" && b.gotM === "코인 300개를 받았습니다" && b.note === "" && !b.bad, JSON.stringify(b));
check("하나 남아도 모두 받기는 보인다(켜짐)", b.all);
await click("#mgOk"); await nap(300);
check("확인 → 획득 창만 닫힘 (우편함은 그대로)", !(await box()).got && (await box()).on);
check("상단바 코인 1,300 · 빨간 점 1", (await coinsTop()) === "1,300" && (await badge()) === "1", (await coinsTop()) + " / " + (await badge()));
/* 빨리 두 번 */
await P.evaluate(id => { const e = document.querySelector('[data-mailget="' + id + '"]'); e.dispatchEvent(new MouseEvent("click", { bubbles: true })); e.dispatchEvent(new MouseEvent("click", { bubbles: true })); }, "wk-" + k1);
await nap(1200);
b = await box(); d = await acct("u1");
check("**빨리 두 번 눌러도 한 번만** (서버 1800 · 우편 0)", d.coins === 1800 && d.mail.length === 0, d.coins + " / " + d.mail.length);
check("비면 안내(봉투 그림) · 빨간 점 없음 · 모두 받기 꺼짐", b.rows.length === 0 && b.empty.indexOf("받을 우편이 없습니다") === 0 && b.empty.indexOf("매주 주간 랭킹 1~10등 보상이 이곳으로 옵니다") > 0 && (await badge()) === "" &&
  b.got && b.gotN === "+500" && !b.all && (await P.evaluate(() => Boolean(document.querySelector("#mailList .ml__empty svg")))), JSON.stringify(b));
check("**뒤로가기는 획득 창부터** 닫는다 (우편함은 그대로)", await P.evaluate(async () => { window.__back(); await new Promise(r => setTimeout(r, 300));
  return !document.getElementById("mailGot").classList.contains("on") && document.getElementById("mailBox").classList.contains("on"); }));
check("한 번 더 뒤로가기 → 우편함이 닫힌다 (로비는 그대로)", await P.evaluate(async () => { window.__back(); await new Promise(r => setTimeout(r, 300));
  return !document.getElementById("mailBox").classList.contains("on") && !document.getElementById("ask").classList.contains("on") && document.querySelector(".page.is-on").id === "lobby"; }));

/* ---------- 4. 모두 받기 · 이미 받음 · 로그인 ---------- */
console.log("\n[4. 모두 받기 · 안내]");
d = await acct("u1");
await seed("u1", Object.assign({}, d, { mail: [{ id: "wk-2026-W40", kind: "weekly", key: "2026-W40", place: 3, coins: 100, at: now - 3 * DAY },
                                               { id: "wk-2026-W41", kind: "weekly", key: "2026-W41", place: 7, coins: 50, at: now - 2 * DAY }] }));
const stale = (await acct("u1")).mail;
await sync();
check("새 우편 둘 → 빨간 점 2", (await badge()) === "2");
await click("#btMail"); await nap(400);
check("도착 시간 — 2일 전 · 3일 전 (최근 것부터)", (await P.evaluate(() => [...document.querySelectorAll("#mailList .ml__tx em")].map(e => e.textContent).join(","))) === "2일 전,3일 전",
  await P.evaluate(() => [...document.querySelectorAll("#mailList .ml__tx em")].map(e => e.textContent).join(",")));
await click("#mailAll"); await nap(900);
b = await box(); d = await acct("u1");
check("**모두 받기 → 150 한 번에** · 창 비움 · 획득 창 +150", d.coins === 1950 && d.mail.length === 0 && b.got && b.gotN === "+150" && b.gotM === "코인 150개를 받았습니다" && b.rows.length === 0, d.coins + " " + b.gotM);
await click("#mgOk"); await nap(300);
await signIn({ mail: stale });                      /* 다른 기기에서 이미 받은 우편이 이 기기에 남아 있었다 */
await nap(200);
await click('[data-mailget="wk-2026-W40"]'); await nap(900);
b = await box();
check("다른 데서 이미 받은 우편 → \"이미 받은 우편입니다\" · 코인 그대로 · 목록을 서버 것으로 · 획득 창 안 뜸", b.note === "이미 받은 우편입니다" && (await acct("u1")).coins === 1950 && b.rows.length === 0 && !b.got, JSON.stringify(b));
await signIn({ mail: stale, signedIn: false });
await nap(200);
await click('[data-mailget="wk-2026-W41"]'); await nap(500);
b = await box();
check("로그인이 안 됐으면 \"로그인이 필요합니다.\"(빨간 글씨) · 코인 그대로 · 획득 창 안 뜸", b.note === "로그인이 필요합니다." && b.bad && !b.got && (await acct("u1")).coins === 1950, b.note);

/* ---------- 5. 영어 ---------- */
console.log("\n[5. 영어]");
await signIn({ mail: [{ id: "wk-2026-W44", kind: "weekly", key: "2026-W44", place: 1, coins: 500, at: now }], signedIn: true });
await P.evaluate(() => window.setLang("en")); await nap(300);
b = await box();
check("영어 — Mailbox · Weekly ranking #1 reward · Oct 26 – Nov 1 · Claim", b.title === "Mailbox" && b.rows[0].t === "Weekly ranking #1 reward" && b.rows[0].s === "Oct 26 – Nov 1" &&
  (await P.evaluate(() => document.querySelector("[data-mailget]").textContent)) === "Claim" && (await P.evaluate(() => document.getElementById("btMail").getAttribute("aria-label"))) === "Mailbox 1" &&
  b.allT === "Claim all" && (await P.evaluate(() => document.querySelector("#mailList .ml__tx em").textContent)) === "Just now",
  JSON.stringify(b.rows));
await P.setViewport({ width: 320, height: 720 }); await nap(250);
L = await look();
check("영어 320px — 상자·닫기 화면 안 · 줄 넘침 없음 (제목은 두 줄까지)", L.p.x >= 0 && L.p.r <= 320 && L.x.r <= 320 && !L.over && L.titleLines <= 2, JSON.stringify({ lines: L.titleLines, over: L.over }));
await P.setViewport({ width: 360, height: 760 });
await P.evaluate(() => window.setLang("ko"));

check("화면 오류 없음", H.errs.length === 0, H.errs.slice(0, 3).join(" | "));
await closeAll(env, srv);
process.exit(C.done());
