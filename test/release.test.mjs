/* 출시 전 마지막 묶음 (2026-10-09 요청 A1~A4, B1) — 진짜 브라우저 + 진짜 서버

   A1 업데이트 강제 안내: 내 빌드 < 서버 최소 버전이면 닫을 수 없는 창 → 플레이스토어
   A2 설정 창 개인정보처리방침 · 이용약관 · 문의하기
   A3 앱 오류를 서버로 (/zoo/log)
   A4 설정 창 언어 단추 — 고른 쪽이 보인다
   B1 게임을 끝까지 3번 마치면 별점 창 한 번

   폰에서만 되는 것(진짜 플레이스토어·메일 앱·구글 별점 창)은 여기서 못 본다 —
   가로채는 손잡이(__openUrlHook · __reviewHook)로 무엇을 열려고 했는지 본다.
   쓰는 법:  node test/release.test.mjs */
import { canRun, checker, launch, startServer, api, closeAll, nap, waitFor } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;

const srv = await startServer({ ZOO_MIN_BUILD: "7", NODE_ENV: "test" });
const env = await launch();

/* 앱을 연다. build = 흉내 낼 안드로이드 versionCode (null 이면 웹처럼 모름) */
async function app({ build = null, server = srv.url, lang = "ko", w = 412, h = 745 } = {}){
  const ctx = await env.browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  page.on("dialog", async d => { errs.push("dialog: " + d.message()); await d.dismiss().catch(() => {}); });
  await page.evaluateOnNewDocument((s, b, lang) => {
    try { localStorage.setItem("zk_lang", lang); } catch(e){}
    globalThis.__ZOO_TEST = true; globalThis.__ZOO_SERVER = s;
    HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
    if (b != null){ window.__appBuildForTest = b; window.__appVersionForTest = "1.0." + b; }
    window.__opened = [];
    window.__openUrlHook = u => window.__opened.push(u);
    window.__exited = 0;
    window.__exitHook = () => { window.__exited++; };
  }, server, build, lang);
  await page.goto(env.appUrl, { waitUntil: "networkidle0" });
  const press = async sel => {
    const at = await page.evaluate(s => { const e = document.querySelector(s); if (!e) return null;
      const r = e.getBoundingClientRect(); if (!r.width) return null;
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const hh = document.elementFromPoint(x, y); return { x, y, mine: Boolean(hh && (hh === e || e.contains(hh))) }; }, sel);
    if (!at) return false;
    await page.mouse.click(at.x, at.y);
    return at.mine;
  };
  return { page, ctx, errs, press };
}
const gate = p => p.page.evaluate(() => {
  const g = document.getElementById("updGate");
  if (!g) return null;
  const r = g.querySelector(".cfg__p").getBoundingClientRect();
  const ex = g.querySelector("#updExit");
  const bg = g.querySelector("#updGo").getBoundingClientRect(), be = ex ? ex.getBoundingClientRect() : null;
  return { t: g.querySelector("#updT").textContent, m: g.querySelector("#updM").textContent,
           go: g.querySelector("#updGo").textContent, exit: ex ? ex.textContent : null,
           row: Boolean(be && Math.abs(be.top - bg.top) < 2 && be.right <= bg.left + 1),
           inPanel: Boolean(be && be.left >= r.left && bg.right <= r.right),
           shown: r.width > 0 && getComputedStyle(g).visibility === "visible" };
});

/* ---------- A1 ---------- */
console.log("\n[A1 업데이트 강제 안내 — 서버 최소 버전 7]");
const old = await app({ build: 5 });
await waitFor(async () => Boolean(await gate(old)), 5000, 150);
let g = await gate(old);
check("빌드 5 < 7 이면 안내창이 뜬다", Boolean(g && g.shown), JSON.stringify(g));
check("글: 업데이트가 필요합니다 · 단추 \"앱 종료하기\" · \"업데이트\"", Boolean(g) && g.t === "업데이트가 필요합니다" && g.go === "업데이트" && g.exit === "앱 종료하기" && /업데이트해야 게임을 할 수 있습니다/.test(g.m), JSON.stringify(g));
check("단추 둘이 한 줄로 나란히 (종료 왼쪽 · 업데이트 오른쪽) · 틀 안", g && g.row && g.inPanel, JSON.stringify(g));
check("**'앱 종료하기' 를 누르면 앱이 꺼진다**", await old.press("#updExit") && await old.page.evaluate(() => window.__exited) === 1, "꺼짐 " + await old.page.evaluate(() => window.__exited));
check("'업데이트' 단추가 손가락을 받는다", await old.press("#updGo"));
await nap(200);
check("누르면 플레이스토어를 연다", (await old.page.evaluate(() => window.__opened)).includes(
  "https://play.google.com/store/apps/details?id=com.wonkyu.zoopresident"), JSON.stringify(await old.page.evaluate(() => window.__opened)));
/* 못 닫는다 — 바깥(어두운 곳)을 눌러도, 뒤로가기를 해도 */
await old.page.mouse.click(10, 10); await nap(300);
check("바깥을 눌러도 안 닫힌다", Boolean((await gate(old) || {}).shown));
await old.page.evaluate(() => window.__back && window.__back()); await nap(300);
check("뒤로가기로도 안 닫힌다", Boolean((await gate(old) || {}).shown));
check("안내창이 진입창 단추를 덮는다 (밑의 게임을 못 누른다)", !(await old.press("#entry #start")));
for (const [b, why] of [[7, "같으면"], [9, "높으면"]]){
  const p = await app({ build: b });
  await nap(1500);
  check("빌드 " + b + " — 최소 버전과 " + why + " 안 뜬다", !(await gate(p)));
  await p.ctx.close();
}
const web = await app({ build: null });
await nap(1500);
check("빌드를 모르면(웹) 안 막는다", !(await gate(web)));
await web.ctx.close();
const off = await app({ build: 5, server: "http://127.0.0.1:9" });
await nap(2500);
check("서버에 못 붙으면 안 막는다 (확인 실패로 멀쩡한 사람을 막지 않는다)", !(await gate(off)));
await off.ctx.close();
await old.ctx.close();

/* ---------- A2 · A4 ---------- */
console.log("\n[A2 설정 창 — 개인정보처리방침 · 이용약관 · 문의하기 / A4 언어 단추]");
const P = await app({ build: 9, w: 360, h: 640 });
await P.page.evaluate(() => window.__goto("lobby"));
await nap(400);
await P.press("#lobby .top__cfg");
const settled = () => waitFor(async () => {
  const a = await P.page.evaluate(() => { const b = document.querySelector("#cfg [data-contact]"); return b ? b.getBoundingClientRect().top : null; });
  await nap(120);
  const b = await P.page.evaluate(() => { const b = document.querySelector("#cfg [data-contact]"); return b ? b.getBoundingClientRect().top : null; });
  const vis = await P.page.evaluate(() => document.getElementById("cfg").classList.contains("on"));
  return a != null && a === b && vis;
}, 3000, 50);
await settled();
const links = () => P.page.evaluate(() => [...document.querySelectorAll("#cfg .cfg__links button")].map(b => {
  const r = b.getBoundingClientRect();
  return { t: b.textContent, inView: r.top >= 0 && r.bottom <= innerHeight, h: Math.round(r.height) };
}));
let L = await links();
check("글자 단추 세 개", JSON.stringify(L.map(x => x.t)) === JSON.stringify(["개인정보처리방침", "이용약관", "문의하기"]), JSON.stringify(L));
check("좁은 폰(360x640)에서도 화면 안에 보인다", L.every(x => x.inView), JSON.stringify(L));
check("누를 만한 높이 (28px 이상)", L.every(x => x.h >= 28), JSON.stringify(L.map(x => x.h)));
const lang = () => P.page.evaluate(() => [...document.querySelectorAll("#cfg [data-l]")].map(b =>
  ({ l: b.dataset.l, p: b.getAttribute("aria-pressed"), o: Number(getComputedStyle(b).opacity) })));
let lg = await lang();
check("A4: 고른 언어(한국어)는 또렷하고 다른 쪽은 흐리다",
  lg.length === 2 && lg[0].l === "ko" && lg[0].p === "true" && lg[0].o === 1 && lg[1].o < 0.6, JSON.stringify(lg));

check("'개인정보처리방침' 이 손가락을 받는다", await P.press('#cfg [data-doc="privacy"]'));
await nap(300);
const doc = () => P.page.evaluate(() => {
  const v = document.getElementById("docView");
  return v && v.classList.contains("on") ? { t: document.getElementById("docT").textContent,
    n: document.getElementById("docB").textContent.length,
    top: getComputedStyle(v).zIndex, inView: document.getElementById("docB").getBoundingClientRect().bottom <= innerHeight } : null;
});
let d = await doc();
check("앱 안에서 개인정보처리방침이 열린다", Boolean(d) && /개인정보/.test(d.t) && d.n > 300, JSON.stringify(d));
check("설정 창 위에 뜨고 화면 안에 들어온다", Boolean(d) && Number(d.top) > 60 && d.inView, JSON.stringify(d));
await P.page.evaluate(() => window.__back()); await nap(300);
check("뒤로가기는 문서 창만 닫는다 (설정 창은 그대로)", !(await doc()) &&
  await P.page.evaluate(() => document.getElementById("cfg").classList.contains("on")));
await P.press('#cfg [data-doc="terms"]'); await nap(300);
d = await doc();
check("이용약관도 열린다", Boolean(d) && /약관/.test(d.t) && d.n > 300, JSON.stringify(d));
check("× 단추가 손가락을 받는다", await P.press("#docView .cfg__x"));
await nap(300);
check("× 로 닫힌다", !(await doc()));
check("'문의하기' 가 손가락을 받는다", await P.press("#cfg [data-contact]"));
await nap(400);
const mail = (await P.page.evaluate(() => window.__opened)).find(u => u.startsWith("mailto:")) || "";
const mq = new URLSearchParams(mail.split("?")[1] || "");
check("메일 앱을 우리 문의 주소로 연다", mail.startsWith("mailto:dnjsrb980607@gmail.com?"), mail.slice(0, 60));
check("제목 [동물의 왕국] 문의", mq.get("subject") === "[동물의 왕국] 문의", mq.get("subject"));
check("본문에 앱 버전·계정 번호를 미리 적는다", /앱 버전: 1\.0\.9 \(9\)/.test(mq.get("body") || "") && /계정 번호: /.test(mq.get("body") || ""),
  JSON.stringify(mq.get("body")));
/* 영어로 바꾸면 */
await P.press('#cfg [data-l="en"]'); await nap(400);
L = await links();
check("영어로 바꾸면 Privacy · Terms · Contact", JSON.stringify(L.map(x => x.t)) === JSON.stringify(["Privacy", "Terms", "Contact"]), JSON.stringify(L));
lg = await lang();
check("A4: 이제 English 가 또렷하다", lg[1].p === "true" && lg[1].o === 1 && lg[0].o < 0.6, JSON.stringify(lg));
await P.press('#cfg [data-doc="privacy"]'); await nap(300);
d = await doc();
check("영어 개인정보처리방침", Boolean(d) && /Privacy/i.test(d.t), JSON.stringify(d));
await P.page.evaluate(() => window.__back()); await nap(200);
await P.press('#cfg [data-l="ko"]'); await nap(300);

/* ---------- A3 ---------- */
console.log("\n[A3 앱 오류를 서버로]");
/* 오류는 **앱과 같은 출처의 코드**에서 나야 내용이 보인다. 검사 도구(evaluate)에서 던지면
   브라우저가 다른 출처로 보고 "Script error." 로 가린다 — 그래서 페이지 안에 글로 심어 던진다 */
const throwIn = (p, code) => p.page.evaluate(c => { const s = document.createElement("script"); s.textContent = c; document.body.appendChild(s); }, code);
const h0 = (await api(srv, "/zoo/health")).body.appErr;
await throwIn(P, 'setTimeout(function(){ throw new Error("test-boom-1"); }, 0);');
await waitFor(async () => (await api(srv, "/zoo/health")).body.appErr.n > h0.n, 5000, 150);
let h1 = (await api(srv, "/zoo/health")).body.appErr;
check("처리 못 한 오류가 서버에 닿는다", h1.n === h0.n + 1 && /test-boom-1/.test(h1.last), JSON.stringify(h1));
const s0 = await P.page.evaluate(() => (window.__applogSent || [])[0]);
check("화면·버전·빌드·기기를 같이 보낸다 (개인정보 없이)", Boolean(s0) && s0.scr === "lobby" && s0.ver === "1.0.9" && s0.build === "9" &&
  typeof s0.dev === "string" && !("uid" in s0) && !("name" in s0), JSON.stringify(s0));
await throwIn(P, 'setTimeout(function(){ throw new Error("test-boom-1"); }, 0);');
await nap(800);
check("같은 오류는 한 번만", (await api(srv, "/zoo/health")).body.appErr.n === h1.n);
await throwIn(P, 'Promise.reject(new Error("test-reject"));');
await waitFor(async () => (await api(srv, "/zoo/health")).body.appErr.n > h1.n, 5000, 150);
h1 = (await api(srv, "/zoo/health")).body.appErr;
check("약속 실패(unhandledrejection)도 닿는다", h1.last === "(약속) test-reject", JSON.stringify(h1));
await throwIn(P, 'setTimeout(function(){ throw new Error("ResizeObserver loop limit exceeded"); }, 0);');
await nap(800);
check("우리 탓이 아닌 잡음(ResizeObserver)은 안 보낸다", (await api(srv, "/zoo/health")).body.appErr.n === h1.n);
for (let i = 0; i < 12; i++) await throwIn(P, 'setTimeout(function(){ throw new Error("flood-' + i + '"); }, 0);');
await nap(1500);
const nSent = await P.page.evaluate(() => (window.__applogSent || []).length);
check("한 번 켤 때 최대 8개까지만", nSent === 8, nSent + "개");
await P.ctx.close();

/* ---------- B1 ---------- */
console.log("\n[B1 별점 요청 — 끝까지 마친 게임 3번째에 한 번]");
const R = await app({ build: 9 });
await R.page.evaluate(() => {
  window.__reviewed = 0;
  window.__reviewHook = () => { window.__reviewed++; };
  window.reportGame = () => {};                      /* 계정에 올리지는 않는다 */
});
/* 결과 화면을 그 판 상태로 연다 — last = 마지막 판(최종 결과) */
const showResult = (round, rounds) => R.page.evaluate((round, rounds) => {
  window.__opts = Object.assign(window.__opts || {}, { rounds });
  window.__scored = false;
  window.GAME = { N: 4, names: ["나", "가", "나나", "다"], namesEn: ["Me", "A", "B", "C"],
                  finish: [0, 1, 2, 3], score: [300, 200, 100, 0], lions: [1, 1, 0, 0], roundNo: round };
  window.__goto("result");
}, round, rounds);
const rv = () => R.page.evaluate(() => ({ n: window.__reviewed, done: localStorage.getItem("zk_done"), asked: localStorage.getItem("zk_rv") }));
await showResult(1, 3); await nap(300);
await showResult(2, 3); await nap(300);
check("중간 판 결과는 안 센다", (await rv()).done === null, JSON.stringify(await rv()));
await showResult(3, 3); await nap(300);
await showResult(3, 3); await nap(2000);
let st = await rv();
check("끝까지 마친 게임 2번 — 아직 안 묻는다", st.done === "2" && st.n === 0, JSON.stringify(st));
await showResult(3, 3);
await nap(500);
check("3번째 — 바로가 아니라 잠깐(1.5초) 뒤에", (await rv()).n === 0);
await nap(1500);
st = await rv();
check("3번째 게임을 마치면 별점 창을 한 번 부른다", st.done === "3" && st.n === 1 && st.asked === "1", JSON.stringify(st));
await showResult(3, 3); await nap(2000);
await R.page.reload({ waitUntil: "networkidle0" });
await R.page.evaluate(() => { window.__reviewed = 0; window.__reviewHook = () => { window.__reviewed++; }; window.reportGame = () => {}; });
await showResult(3, 3); await nap(2000);
st = await rv();
check("한 번 물었으면 다시는 안 묻는다 (앱을 다시 켜도)", st.n === 0 && st.asked === "1", JSON.stringify(st));
await R.ctx.close();

await closeAll(env, srv);
process.exit(C.done());
