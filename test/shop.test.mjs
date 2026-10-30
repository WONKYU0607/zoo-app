/* 코인 · 상점 · 현금 결제 · 광고 제거 — 진짜 앱 화면 + 진짜 게임 서버(메모리 계정) + 가짜 구글 (2026-10-26 사용자 결정)

   결정: 코인 1등 100 · 2등 80 · 3등 60 · 4등 40 · 그 밖 20 · 그날 첫 게임 누구나 +100 · "나가기" 만 0 ·
         얼굴(15번부터)·카드 스킨·판 배경은 그림이 오면 넣는 **자리만** · 현금은 코인 묶음만 · 광고 제거는 현금만 ·
         광고 보고 받는 티켓 하루 5장 · 광고 제거를 사면 게임 끝 광고 없음 + 광고 없이 하루 5장
     0. 앱 src/lib/shop.js 와 서버 shop.js 가 똑같은가
     1. 상단 줄 랭킹 옆 상점 단추(같은 틀 · 코인은 상점 안) · 상점 탭은 판 배경 · 티켓 · 코인 · 광고 제거 (파는 얼굴·카드가 없으면 그 탭은 없다)
     6b. 판 배경(사용자 그림 3개) — 이름·값 · 사면 바로 장착 · 판 화면 배경이 바뀌고 펠트 타원 자리는 기본 판과 같다
     2. 티켓: 가득이면 안 판다 · 1장이면 500코인에 산다(2026-10-29 200 → 500)
     3. 코인 묶음: 구글 값(원화)이 보인다 · 사면 서버가 구글에 확인하고 코인을 넣는다 · 플러그인에 넘기는 값(소모형·스스로 확인 안 함·계정 표시)
        창을 닫으면 말 없음 · 결제 대기면 안내 · 남은 결제는 다음에 켤 때 다시 넣는다
     4. 광고 제거: 사면 "구매함" · 로비 단추가 "무료 티켓 받기" · 광고 없이 하루 5장 · 게임 끝 전면 광고를 안 받는다
     5. 광고 보고 받는 티켓 하루 5장 — 다 받았으면 광고를 안 띄우고 안내
     6. 프로필 창: 0~14번 얼굴은 예전처럼 점수로(코인 값 없음, 눌러도 사기 창 없음)
     7. 게임을 끝까지 하면 결과 화면에 "코인 +N"(서버가 적은 만큼, 그날 첫 게임 +100 포함) · 카드 뒷면·앞면은 기본 그림 그대로
   쓰는 법:  node test/shop.test.mjs   (zoo-server 를 ZOO_SERVER_DIR 또는 옆 폴더에서 직접 띄운다) */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createServer as httpServer } from "node:http";
import { generateKeyPairSync, createHash } from "node:crypto";
import { canRun, checker, launch, human, startServer, api, closeAll, nap, waitFor, SERVER_DIR } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* ---------- 0. 표가 같은가 ---------- */
console.log("\n[0. 앱과 서버의 상점 표]");
check("**앱 src/lib/shop.js 와 서버 shop.js 가 똑같다**", readFileSync(join(ROOT, "src/lib/shop.js"), "utf8") === readFileSync(join(SERVER_DIR, "shop.js"), "utf8"));
const S = await import(pathToFileURL(join(ROOT, "src/lib/shop.js")).href);

/* ---------- 가짜 구글 (토큰 주소 + 결제 확인 API) ---------- */
const kp = generateKeyPairSync("rsa", { modulusLength: 2048 });
const SA = { client_email: "pay@demo.iam.gserviceaccount.com", private_key: kp.privateKey.export({ type: "pkcs8", format: "pem" }), project_id: "demo" };
const buys = new Map();
const gport = 8900 + Math.floor(Math.random() * 90);
const gsrv = httpServer(async (req, res) => {
  let body = ""; for await (const ch of req) body += ch;
  const send = (c, o) => { res.writeHead(c, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
  if (req.url === "/token") return send(200, { access_token: "tok", expires_in: 3600 });
  if (/\/purchases\/voidedpurchases/.test(req.url)) return send(200, {});      /* 환불·취소 목록 (서버가 주기적으로 묻는다) — 없음 */
  const m = /\/purchases\/products\/([^/]+)\/tokens\/([^/:]+)(?::(consume|acknowledge))?$/.exec(req.url);
  const b = m && buys.get(decodeURIComponent(m[2]));
  if (!b || b.product !== decodeURIComponent(m[1])) return send(400, { error: { message: "Invalid Value" } });
  if (m[3] === "consume"){ b.consumed = true; return send(200, {}); }
  if (m[3] === "acknowledge"){ b.acked = true; return send(200, {}); }
  return send(200, { purchaseState: b.state, consumptionState: b.consumed ? 1 : 0, acknowledgementState: b.acked ? 1 : 0, orderId: b.orderId,
                     ...(b.tag ? { obfuscatedExternalAccountId: b.tag } : {}) });
});
await new Promise(r => gsrv.listen(gport, "127.0.0.1", r));
const G = "http://127.0.0.1:" + gport;
const tagOf = uid => createHash("sha256").update("zoo:" + uid).digest("hex").slice(0, 32);

const srv = await startServer({ ZOO_ACCOUNTS: "memory", ZOO_TEST_TOKENS: "1", NODE_ENV: "test", ZOO_ALERT_URL: "",
  ZOO_BOT_JOIN_MS: "300", ZOO_BOT_MS: "60", ZOO_PLAY_API: G, ZOO_PLAY_TOKEN_URL: G + "/token",
  PLAY_SA_B64: Buffer.from(JSON.stringify(SA)).toString("base64") });
const env = await launch();
const seed = (uid, d) => api(srv, "/zoo/test/acct/" + uid, d);
const acct = async uid => (await api(srv, "/zoo/test/acct/" + uid)).body;
await seed("u1", { name: "상점손님", avatar: 0, score: 12000, games: 0, coins: 1000, owned: [], tickets: 3, ticketAt: Date.now() });

const H = await human(env, srv, "상점손님", { uid: "u1" });
await H.drv({ on: false });
const P = H.page;
/* 가짜 결제 플러그인 — 진짜 플러그인과 같은 이름의 함수들. 사면 가짜 구글에 그 결제를 올려 둔다(진짜는 구글이 갖고 있다) */
let tokSeq = 0;
await P.exposeFunction("__googleBuy", (product, tag, state) => { const t = "tok" + (++tokSeq); buys.set(t, { product, state, orderId: "GPA." + tokSeq, tag }); return t; });
await P.evaluateOnNewDocument(() => {
  /* log = 부른 순서(시작·끝) · active/maxActive = 동시에 몇 개가 돌았나. 진짜 플러그인은 부를 때마다 결제 연결을 닫고 새로 열어서
     결제 창이 떠 있는 동안 다른 것을 부르면 결제 결과를 잃을 수 있다 — 앱이 한 줄로 세우는지 본다 */
  window.__fb = { next: "ok", calls: [], purchases: [], slow: 0, log: [], active: 0, maxActive: 0, gp: 0 };
  const W = (name, fn) => async o => {
    const f = window.__fb;
    f.active++; f.maxActive = Math.max(f.maxActive, f.active); f.log.push("+" + name);
    try { return await fn(o); } finally { f.active--; f.log.push("-" + name); }
  };
  /* 진짜 플러그인 객체(@capacitor/core registerPlugin)는 **아무 이름이나 있는 척하는 대리 객체(Proxy)** 다 — .then 도 함수로 보이고,
     부르면 "NativePurchases.then() is not implemented on android" 로 거절한다. 그래서 Promise 로 넘기면(async 함수의 return 등)
     자바스크립트가 Promise 로 착각해 then 을 불러 **영영 안 끝난다**(2026-10-30 내부 테스트 1.0.9: 가격 "…" · 사기 "처리 중" 멈춤).
     평범한 객체로 흉내 내면 이걸 못 잡아서 놓쳤다 — 가짜도 같은 대리 객체로 감싼다 */
  const capProxy = (name, impl) => new Proxy({}, { get(_, prop){
    if (prop === "$$typeof") return undefined;
    if (prop === "toJSON") return () => ({});
    if (typeof impl[prop] === "function") return impl[prop];
    return () => Promise.resolve().then(() => { throw new Error('"' + name + "." + String(prop) + '()" is not implemented on android'); });
  } });
  globalThis.__fakeBilling = capProxy("NativePurchases", {
    isBillingSupported: W("sup", async () => ({ isBillingSupported: true })),
    /* 45,000 코인 묶음은 플레이 콘솔에 아직 안 만든 척 — 구글이 답에서 뺀다 */
    /* 판 배경 bg_3 도 콘솔에 아직 없는 척 — 그 칸은 코인으로만 */
    getProducts: W("prod", async o => ({ products: o.productIdentifiers.filter(id => id !== "coins_45000" && id !== "bg_3").map(id => ({ identifier: id, title: id,
      priceString: { coins_4500: "₩1,200", coins_23000: "₩5,900", noads: "₩3,900" }[id] || (/^deck_/.test(id) ? "₩4,900" : /^bg_/.test(id) ? "₩2,900" : /^emote_/.test(id) ? "₩1,900" : "₩0") })) })),
    purchaseProduct: W("buy", async o => {
      window.__fb.calls.push(o);
      const how = window.__fb.next; window.__fb.next = "ok";
      if (window.__fb.slow) await new Promise(r => setTimeout(r, window.__fb.slow));     /* 결제 창이 떠 있는 동안 */
      if (how === "cancel"){ const e = new Error("USER_CANCELED"); e.code = "USER_CANCELED"; throw e; }
      if (how === "pending") throw new Error("Purchase is pending");
      if (how === "owned"){ const e = new Error("Item already owned"); e.code = "ITEM_ALREADY_OWNED"; throw e; }
      const token = await window.__googleBuy(o.productIdentifier, o.appAccountToken, 0);
      return { purchaseToken: token, productIdentifier: o.productIdentifier, purchaseState: "1", orderId: "x" };
    }),
    getPurchases: W("list", async () => { window.__fb.gp++; return { purchases: window.__fb.purchases }; }),
  });
  window.__adShown = 0;
  window.__adTest = async () => { window.__adShown++; return { ok: false, why: "dismissed" }; };
});
await H.reload();
await H.drv({ on: false });
const signIn = d => P.evaluate(d => {
  Object.assign(window.ACCOUNT, { signedIn: true, loaded: true, guest: false, uid: "u1", needName: false }, d);
  window.dispatchEvent(new Event("accountchange"));
}, d);
const syncFromServer = async (uid = "u1") => { const d = await acct(uid);
  await signIn({ uid, coins: d.coins || 0, owned: d.owned || [], avatar: d.avatar || 0, deck: d.deck || 0, bg: d.bg || 0, noAds: Boolean(d.noAds),
                 tickets: d.tickets, ticketAt: d.ticketAt, coinDay: d.coinDay || "", score: d.score || 0, adDay: d.adDay || "", adN: d.adN || 0,
                 freeDay: d.freeDay || "", freeN: d.freeN || 0 }); return d; };
await syncFromServer();
await P.evaluate(() => window.__goto("lobby"));
await nap(500);

const q = (sel, f) => P.evaluate((s, f) => { const e = document.querySelector(s); return e ? (f === "t" ? e.textContent.trim() : f === "c" ? e.className : true) : null; }, sel, f);
const click = sel => P.evaluate(s => { const e = document.querySelector(s); if (e) e.dispatchEvent(new MouseEvent("click", { bubbles: true })); return Boolean(e); }, sel);
const askOn = () => P.evaluate(() => {
  const a = document.getElementById("ask");
  return a && a.classList.contains("on") ? { t: document.getElementById("askT").textContent, m: document.getElementById("askM").textContent,
    one: getComputedStyle(document.getElementById("askNo")).display === "none" } : null;
});
const yes = () => click("#askYes");
const no = () => P.evaluate(() => { const n = document.getElementById("askNo"); const y = document.getElementById("askYes");
  (getComputedStyle(n).display === "none" ? y : n).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
const cell = id => P.evaluate(id => { const e = document.querySelector('#spGrid [data-item="' + id + '"]');
  return e ? { c: e.className, st: (e.querySelector(".sp__st") || {}).textContent || "", t: e.textContent.replace(/\s+/g, " ").trim() } : null; }, id);
const tab = k => click('#spTabs [data-k="' + k + '"]');
const acc = () => P.evaluate(() => ({ coins: window.ACCOUNT.coins, noAds: window.ACCOUNT.noAds, tickets: window.ACCOUNT.tickets }));
const lobbyHint = () => q("#lobby #hQuick", "t");

/* ---------- 1. 로비 · 탭 ---------- */
console.log("\n[1. 로비 · 상점 탭]");
/* 2026-10-29 사용자: 하단 고정 탭 — 프로필 · 랭킹 · 홈 · 상점 · 설정. 상점은 랭킹과 같은 탭 모양(그 사이 홈) · 코인은 상점 안에서 */
const topRow = await P.evaluate(() => {
  const bar = document.querySelector("#tabbar");
  const sh = bar && bar.querySelector("#tbShop"), rk = bar && bar.querySelector("[data-rankopen]");
  const order = bar ? [...bar.children].map(k => k.id).join(",") : "";
  if (!sh || !rk) return null;
  const kids = [...bar.children];
  const cs = getComputedStyle(sh), cr = getComputedStyle(rk);
  const a = sh.getBoundingClientRect(), b = rk.getBoundingClientRect();
  return { text: sh.textContent.trim(), next: kids.indexOf(rk) - kids.indexOf(sh),
           order, inRow: Boolean(document.querySelector("#lobby .rankbar [data-shopopen], #lobby .rankbar [data-rankopen]")),
           sameFrame: cs.fontSize === cr.fontSize && cs.color === getComputedStyle(bar.querySelector("#tbCfg")).color,
           sameH: Math.abs(a.height - b.height) < 1, sameTop: Math.abs(a.top - b.top) < 1,
           inside: kids.every(k => { const r = k.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }),
           oldFoot: Boolean(document.querySelector("#lobby .lb-foot, #lobby #shopCoins")) };
});
check("**하단 탭: 프로필 · 랭킹 · 홈 · 상점 · 설정 차례**", topRow && topRow.order === "tbProfile,tbRank,tbHome,tbShop,tbCfg" && topRow.text === "상점" && topRow.next === -2, JSON.stringify(topRow));
check("**상점 탭이 랭킹 탭과 같은 모양** (글자 크기·색·높이·줄) · 위 줄에는 상점·랭킹 단추 없음", topRow && topRow.sameFrame && topRow.sameH && topRow.sameTop && !topRow.inRow, JSON.stringify(topRow));
check("로비에는 코인 수가 없다 (상점 안에서 보인다) · 아래 줄 옛 상점 단추 없음 · 탭이 화면 안", topRow && !topRow.oldFoot && topRow.inside && !/\d/.test(topRow.text));
await click("#tbShop"); await nap(500);
check("상점 화면", (await H.screen()) === "shop");
check("상점 안 위에 가진 코인 (1,000)", (await q("#shop #spCoins", "t")) === "1,000", await q("#shop #spCoins", "t"));
const tabs = await P.evaluate(() => [...document.querySelectorAll("#spTabs [data-k]")].map(b => b.dataset.k + "=" + b.textContent));
check("**탭은 카드 · 판 배경 · 이모티콘 · 티켓 · 코인 · 광고 제거** (파는 얼굴은 아직 없어 그 탭은 없다 · 이모티콘은 2026-10-29)", tabs.join(" ") === "deck=카드 bg=판 배경 emote=이모티콘 ticket=티켓 coins=코인 noads=광고 제거", tabs.join(" "));
{ const tb = await P.evaluate(() => [...document.querySelectorAll("#spTabs [data-k]")].map(b => ({ k: b.dataset.k, sw: b.scrollWidth, cw: b.clientWidth })));
  check("탭 글자가 안 잘린다 (탭 여섯 개)", tb.every(x => x.sw <= x.cw + 1), JSON.stringify(tb)); }

/* ---------- 2. 티켓 ---------- */
console.log("\n[2. 티켓]");
await tab("ticket"); await nap(400);
check("티켓 칸: 500코인 · 보유 3/3", /500/.test(((await cell("ticket")) || {}).st || "") && /3\/3/.test(((await cell("ticket")) || {}).t || ""), ((await cell("ticket")) || {}).t);
await click('#spGrid [data-item="ticket"]'); await nap(150);
check("가득이면 안 판다", /가득/.test(((await askOn()) || {}).t || ""));
await no(); await nap(100);
await seed("u1", Object.assign({}, await acct("u1"), { tickets: 1, ticketAt: Date.now() }));
await syncFromServer();
await click('#spGrid [data-item="ticket"]'); await nap(150);
check("1장이면 500코인에 살지 묻는다", /500코인/.test(((await askOn()) || {}).m || ""));
await yes();
await waitFor(async () => (await acct("u1")).tickets === 2, 8000, 150);
check("**티켓을 산다 (1 → 2장, 코인 1,000 → 500)**", (await acct("u1")).tickets === 2 && (await acct("u1")).coins === 500 && (await acc()).coins === 500);

/* ---------- 3. 코인 묶음 (현금) ---------- */
console.log("\n[3. 코인 묶음]");
await tab("coins"); await nap(700);
const packs = await P.evaluate(() => [...document.querySelectorAll("#spGrid [data-item]")].map(e => e.dataset.item + "=" + e.textContent.replace(/\s+/g, " ").trim()));
check("**코인 묶음 3개 · 구글 값(원화)이 보인다**", packs.length === 3 && /coins_4500=코인 4,500\s*₩1,200/.test(packs[0]) && /₩5,900/.test(packs[1]), packs.join(" | "));
check("플레이 콘솔에 아직 없는 상품(구글 답에 없음)은 '준비 중'", /준비 중/.test(packs[2]) && !/₩/.test(packs[2]), packs[2]);
{ const n0 = await P.evaluate(() => window.__fb.calls.length);
  await click('#spGrid [data-item="coins_45000"]'); await nap(300);
  check("누르면 결제 창을 안 띄우고 '준비 중' 안내", /준비 중/.test(((await askOn()) || {}).m || "") && (await P.evaluate(() => window.__fb.calls.length)) === n0, JSON.stringify(await askOn()));
  await no(); await nap(100); }
await click('#spGrid [data-item="coins_4500"]');
await waitFor(async () => (await acct("u1")).coins === 5000, 10000, 150);
await nap(300);
const call0 = await P.evaluate(() => window.__fb.calls[0]);
check("**사면 서버가 구글에 확인하고 코인을 넣는다 (500 → 5,000)**", (await acct("u1")).coins === 5000 && (await acc()).coins === 5000, String((await acct("u1")).coins));
check("구글에 소모를 알렸다 (다시 살 수 있게)", buys.get("tok1") && buys.get("tok1").consumed === true);
check("**플러그인에 넘기는 값**: 인앱 · 소모형 · 스스로 확인 안 함(서버가 함) · 계정 표시 = 서버와 같은 식",
  call0 && call0.productType === "inapp" && call0.isConsumable === true && call0.autoAcknowledgePurchases === false && call0.appAccountToken === tagOf("u1"), JSON.stringify(call0));
check("칸에 '코인 +4,500' 이 잠깐 뜬다", /코인 \+4,500/.test(((await cell("coins_4500")) || {}).st || ""), ((await cell("coins_4500")) || {}).st);
await nap(1900);
await P.evaluate(() => { window.__fb.next = "cancel"; });
await click('#spGrid [data-item="coins_23000"]'); await nap(600);
check("결제 창을 닫으면(취소) 아무 말 없이 그대로", !(await askOn()) && (await acct("u1")).coins === 5000);
await P.evaluate(() => { window.__fb.next = "pending"; });
await click('#spGrid [data-item="coins_23000"]'); await nap(600);
check("결제 대기면 안내 (끝나면 저절로 들어온다)", /아직 끝나지 않았습니다/.test(((await askOn()) || {}).m || ""), JSON.stringify(await askOn()));
await no(); await nap(100);

/* 남은 결제 — 결제는 됐는데 서버에 못 넣은 것(앱이 꺼짐·끊김). 켤 때(계정이 들어올 때) 다시 보내는 길을 그대로 부른다 */
const cR = (await acct("u1")).coins;
buys.set("tokR", { product: "coins_23000", state: 0, orderId: "GPA.R", tag: tagOf("u1") });
await P.evaluate(() => { window.__fb.purchases = [{ productIdentifier: "coins_23000", purchaseToken: "tokR", purchaseState: "1", isAcknowledged: false }]; });
const nR = await P.evaluate(() => window.__restorePurchases());
check("**남은 결제를 다시 넣는다** (+23,000 · 구글에 소모)", nR === 1 && (await acct("u1")).coins === cR + 23000 && buys.get("tokR").consumed === true, nR + " · " + (await acct("u1")).coins);
const nR2 = await P.evaluate(() => window.__restorePurchases());
check("또 불러도 두 번 안 넣는다", nR2 === 0 && (await acct("u1")).coins === cR + 23000);
await P.evaluate(() => { window.__fb.purchases = []; });
await syncFromServer("u1");
await nap(300);

/* 결제 창이 떠 있는 동안 남은 결제 읽기가 끼어들면(앱으로 돌아옴 · 켤 때) — 한 줄로 서서 결제가 끝난 뒤에 읽는가 */
await nap(1900);
const cQ = (await acct("u1")).coins;
await P.evaluate(() => { const f = window.__fb; f.slow = 900; f.log = []; f.maxActive = 0; });
await click('#spGrid [data-item="coins_4500"]');
await nap(150);
const nQ = P.evaluate(() => window.__restorePurchases());
await waitFor(async () => (await acct("u1")).coins === cQ + 4500, 10000, 150);
await nQ;
const qlog = await P.evaluate(() => ({ log: window.__fb.log.join(" "), max: window.__fb.maxActive }));
check("**결제 창이 떠 있는 동안 다른 플러그인 부르기가 끼어들지 않는다** (한 줄로 — 결제가 끝난 뒤에 남은 결제를 읽음)",
  qlog.max === 1 && /^\+buy -buy \+list -list$/.test(qlog.log) && (await acct("u1")).coins === cQ + 4500, JSON.stringify(qlog));
await P.evaluate(() => { window.__fb.slow = 0; });
await nap(1900);

/* 이미 가짐(ITEM_ALREADY_OWNED) — 산 코인 묶음이 확인 전에 앱이 꺼져 소모가 안 된 채 남아 있으면 다시 사려 할 때 구글이 막는다 */
const cO = (await acct("u1")).coins;
buys.set("tokO", { product: "coins_4500", state: 0, orderId: "GPA.O", tag: tagOf("u1") });
await P.evaluate(() => { window.__fb.next = "owned"; window.__fb.purchases = [{ productIdentifier: "coins_4500", purchaseToken: "tokO", purchaseState: "1", isAcknowledged: false }]; });
await click('#spGrid [data-item="coins_4500"]');
await waitFor(async () => (await acct("u1")).coins === cO + 4500, 8000, 150);
await nap(400);
check("**'이미 가짐' 이면 남은 결제를 넣고 '코인 +4,500' 으로 답한다** (오류 창 아님)", (await acct("u1")).coins === cO + 4500 && buys.get("tokO").consumed === true &&
  !(await askOn()) && /코인 \+4,500/.test(((await cell("coins_4500")) || {}).st || ""), JSON.stringify([await askOn(), ((await cell("coins_4500")) || {}).st]));
await nap(1900);
/* 남의 게임 계정에 붙은 결제 */
buys.set("tokOt", { product: "coins_23000", state: 0, orderId: "GPA.Ot", tag: tagOf("u9") });
await P.evaluate(() => { window.__fb.next = "owned"; window.__fb.purchases = [{ productIdentifier: "coins_23000", purchaseToken: "tokOt", purchaseState: "1", isAcknowledged: false }]; });
const cOt = (await acct("u1")).coins;
await click('#spGrid [data-item="coins_23000"]');
await waitFor(async () => Boolean(await askOn()), 8000, 150);
/* 2026-10-29 사용자가 "다른 게임 계정" 안내를 지웠다 — "확인하지 못했습니다" 로 알린다 */
check("다른 게임 계정에 붙은 결제면 확인 못 함으로 알린다 · 코인 그대로", /이 결제를 확인하지 못했습니다/.test(((await askOn()) || {}).m || "") && (await acct("u1")).coins === cOt, JSON.stringify(await askOn()));
await no(); await nap(100);
await P.evaluate(() => { window.__fb.purchases = []; });

/* 앱으로 돌아올 때 — 결제 대기가 끝났거나 결제 직후 앱이 내려가 못 보낸 것 (10분에 한 번까지) */
buys.set("tokW", { product: "coins_4500", state: 0, orderId: "GPA.W", tag: tagOf("u1") });
const cW = (await acct("u1")).coins;
await P.evaluate(() => { window.__fb.purchases = [{ productIdentifier: "coins_4500", purchaseToken: "tokW", purchaseState: "1", isAcknowledged: false }];
  window.__fb.gp = 0; window.dispatchEvent(new Event("appresume")); });
await nap(2500);
check("돌아와도 10분이 안 지났으면 다시 안 읽는다", (await P.evaluate(() => window.__fb.gp)) === 0 && (await acct("u1")).coins === cW);
await P.evaluate(() => { window.__restoreGapMs = 1; window.dispatchEvent(new Event("appresume")); });
await waitFor(async () => (await acct("u1")).coins === cW + 4500, 8000, 150);
check("**앱으로 돌아오면 남은 결제를 다시 보낸다** (+4,500 · 소모)", (await acct("u1")).coins === cW + 4500 && buys.get("tokW").consumed === true && (await P.evaluate(() => window.__fb.gp)) === 1);
await P.evaluate(() => { window.__fb.purchases = []; delete window.__restoreGapMs; });
await syncFromServer("u1");
await nap(300);

/* 게스트 — 현금 결제는 구글 계정을 이은 사람만 (2026-10-26 사용자 결정 A) */
await nap(1900);
await signIn({ guest: true }); await nap(300);
/* 설명 줄은 없앴다(2026-10-27 사용자 "검정 배경에 설명문구 다 없애") — 게스트에게는 누를 때 잇기 창으로 알린다 */
check("상점에 설명 줄(검은 바탕 글)이 없다", !(await P.evaluate(() => Boolean(document.querySelector("#shop .sp__lead, #shop .sp__earn, #shop #spLead, #shop #spEarn")))));
{ const n0 = await P.evaluate(() => { window.__linked = 0; window.linkGoogle = async () => { window.__linked++; return {}; }; return window.__fb.calls.length; });
  await click('#spGrid [data-item="coins_4500"]'); await nap(300);
  const a = await askOn();
  check("**게스트가 현금 상품을 누르면 결제 창 대신 구글 계정 잇기를 권한다**", a && a.t === "구글 계정 잇기" && /^현금 결제는 구글 계정을 이은 뒤에 가능합니다\.$/.test(a.m) && !a.one &&
    (await P.evaluate(() => window.__fb.calls.length)) === n0, JSON.stringify(a));
  await yes(); await nap(400);
  check("'구글 계정 잇기' 를 누르면 잇기를 시작한다 (계정 창과 같은 길)", (await P.evaluate(() => window.__linked)) === 1);
}
await signIn({ guest: false }); await syncFromServer("u1"); await nap(300);

/* ---------- 4. 광고 제거 ---------- */
console.log("\n[4. 광고 제거]");
await tab("noads"); await nap(500);
const na = await cell("noads");
check("광고 제거 칸: 하는 일 두 줄 · 구글 값", na && /게임이 끝날 때 광고 제거/.test(na.t) && /하루 5장/.test(na.t) && /₩3,900/.test(na.st), na && na.t);
await click('#spGrid [data-item="noads"]');
await waitFor(async () => (await acct("u1")).noAds === true, 10000, 150);
await nap(400);
const call1 = await P.evaluate(() => window.__fb.calls[window.__fb.calls.length - 1]);
check("**광고 제거를 사면 서버 noAds 켜짐 · 구글에 확인(소모 아님)**", (await acct("u1")).noAds === true && (await acc()).noAds === true &&
  [...buys.values()].some(b => b.product === "noads" && b.acked && !b.consumed) && call1.isConsumable === false, JSON.stringify(call1));
await nap(1900);
check("칸이 '구매함'", /구매함/.test(((await cell("noads")) || {}).st || ""));
await P.evaluate(() => window.__goto("lobby")); await nap(300);
check("**로비 단추가 '무료 티켓 받기'**", (await q("#lobby #adLabel", "t")) === "무료 티켓 받기", await q("#lobby #adLabel", "t"));
await seed("u1", Object.assign({}, await acct("u1"), { tickets: 0, ticketAt: Date.now() }));
await syncFromServer();
const shown0 = await P.evaluate(() => window.__adShown);
await click("#lobby #btAd");
await waitFor(async () => (await acct("u1")).tickets === 1, 8000, 150);
await nap(200);
check("**누르면 광고 없이 티켓 1장** (0 → 1 · 광고 안 띄움)", (await acct("u1")).tickets === 1 && (await P.evaluate(() => window.__adShown)) === shown0);
check("받은 뒤 남은 장수 안내 (오늘 4장 남음)", /4장 남음/.test((await lobbyHint()) || ""), await lobbyHint());
await seed("u1", Object.assign({}, await acct("u1"), { tickets: 0, ticketAt: Date.now(), freeN: 5, freeDay: S.kstDay(Date.now()) }));
await syncFromServer();
await nap(2600);
await click("#lobby #btAd"); await nap(500);
check("**하루 5장을 다 받으면 안내만** (서버에 안 묻고 티켓 그대로)", /무료 티켓 5장을 다 받았습니다/.test((await lobbyHint()) || "") && (await acct("u1")).tickets === 0, await lobbyHint());

/* ---------- 5. 광고 티켓 하루 5장 ---------- */
console.log("\n[5. 광고 보고 받는 티켓 하루 5장]");
await seed("u1", Object.assign({}, await acct("u1"), { noAds: false, tickets: 0, ticketAt: Date.now(), adN: 5, adDay: S.kstDay(Date.now()) }));
await syncFromServer();
await nap(2600);
check("광고 제거가 없으면 단추는 '광고 시청 티켓'", (await q("#lobby #adLabel", "t")) === "광고 시청 티켓");
const s1 = await P.evaluate(() => window.__adShown);
await click("#lobby #btAd"); await nap(500);
check("**오늘 5장을 다 받았으면 광고를 안 띄우고 안내**", (await P.evaluate(() => window.__adShown)) === s1 && /5장을 다 받았습니다/.test((await lobbyHint()) || ""), await lobbyHint());
await seed("u1", Object.assign({}, await acct("u1"), { adN: 4 }));
await syncFromServer();
await nap(2600);
await click("#lobby #btAd"); await nap(500);
check("4장까지 받았으면 광고를 띄운다", (await P.evaluate(() => window.__adShown)) === s1 + 1);

/* ---------- 6. 프로필 창 ---------- */
console.log("\n[6. 프로필 창 — 0~14번 얼굴은 점수로]");
await nap(2600);
await click("#tbProfile"); await nap(400);
const lk = await q('#acAvt [data-avt="9"] .avt__need', "t");
check("잠긴 얼굴(9번)에 점수만 — 코인 값 없음 (25,000점 달성 시 해제)", /25,000점/.test(lk || "") && /달성 시 해제/.test(lk || "") && !(await q('#acAvt [data-avt="9"] .coin-ic')), lk);
await click('#acAvt [data-avt="9"]'); await nap(200);
check("눌러도 사기 창이 안 뜬다", !(await askOn()));
check("12,000점이면 5·6번 얼굴은 열려 있다", !/lock/.test((await q('#acAvt [data-avt="6"]', "c")) || "lock"));
await click("#acctBox [data-acctclose]"); await nap(200);

/* ---------- 7. 게임 끝 → 코인 ---------- */
console.log("\n[6b. 판 배경]");
await P.evaluate(() => window.__goto("shop")); await nap(500);
await tab("bg"); await nap(500);
const bgCells = await P.evaluate(() => [...document.querySelectorAll("#spGrid [data-item]")].map(e => e.dataset.item + "=" + e.textContent.replace(/\s+/g, " ").trim()));
{ const P1 = S.BG_PRICE[1].toLocaleString();
  /* 기본 판 칸은 뺐다(2026-10-29 사용자: "기본카드랑 기본판은 빼") — 되돌리기는 장착 중인 판 미리보기의 "해제" */
  check("**판 배경 3칸: 황금 정원 · 얼음 성채 · 용암 동굴 (각 " + P1 + "코인 · 현금 값도) — 기본 판 칸 없음**", bgCells.length === 3 &&
    new RegExp("bg:1=황금 정원\\s*" + P1 + "\\s*또는 ₩2,900").test(bgCells[0]) && new RegExp("bg:2=얼음 성채\\s*" + P1 + "\\s*또는 ₩2,900").test(bgCells[1]) &&
    new RegExp("bg:3=용암 동굴\\s*" + P1 + "$").test(bgCells[2]), bgCells.join(" | "));
  check("코인 값 올림 (2026-10-27 A안): 카드 스킨 15,000 · 판 배경 10,000", S.DECK_PRICE.slice(1).every(x => x === 15000) && S.BG_PRICE.slice(1).every(x => x === 10000)); }
const pics = await P.evaluate(() => [...document.querySelectorAll("#spGrid .sp__pic--bg")].map(e => getComputedStyle(e).backgroundImage));
check("칸마다 그 판 그림 미리보기", pics.length === 3 && [1, 2, 3].every(k => new RegExp("tablebg_" + k + "\\.webp").test(pics[k - 1])), pics.map(x => x.slice(-22)).join(" "));
await seed("u1", Object.assign({}, await acct("u1"), { coins: S.BG_PRICE[1] + 250 }));
await syncFromServer(); await nap(300);
const pvState = () => P.evaluate(() => { const b = document.getElementById("spPv");
  return { on: b.classList.contains("on"), t: document.getElementById("pvT").textContent,
    acts: [...document.querySelectorAll("#pvA button")].map(x => (x.dataset.pv || "") + "=" + x.textContent.trim() + (x.disabled ? "(x)" : "")),
    imgs: [...document.querySelectorAll("#pvB img")].map(i => i.getAttribute("src")), table: (document.querySelector("#pvB .pv__table") || { style: {} }).style.backgroundImage || "" }; });
await click('#spGrid [data-item="bg:1"]'); await nap(400);
{ const v = await pvState();
  check("**판 배경을 누르면 미리보기 창** (그림 전체 · 아래에 현금 ₩2,900 · 코인 " + S.BG_PRICE[1].toLocaleString() + ")", v.on && v.t === "황금 정원" && /tablebg_1\.webp/.test(v.table) &&
    v.acts.join(" | ") === "cash=₩2,900 | coin=" + S.BG_PRICE[1].toLocaleString(), JSON.stringify(v)); }
const fbBuy0 = await P.evaluate(() => window.__fb.calls.length);
await click('#pvA [data-pv="coin"]'); await nap(300);
check("코인 단추 → 한 번 더 묻는다 (이름 · 값 · 바로 장착)", new RegExp("황금 정원 — " + S.BG_PRICE[1].toLocaleString() + "코인에 살까요\\? 사면 바로 장착합니다").test(((await askOn()) || {}).m || ""), ((await askOn()) || {}).m);
await yes();
await waitFor(async () => (await acct("u1")).bg === 1, 8000, 150);
await nap(400);
{ const d6 = await acct("u1");
  const sk = await P.evaluate(() => document.documentElement.style.getPropertyValue("--skin-table"));
  check("**코인으로 사면 " + (S.BG_PRICE[1] + 250).toLocaleString() + " → 250 · 가진 것에 bg:1 · 바로 장착 · 판 배경 그림이 바뀜 · 결제 창은 안 뜸**", d6.coins === 250 && (d6.owned || []).includes("bg:1") && d6.bg === 1 &&
    /tablebg_1\.webp/.test(sk) && (await acc()).coins === 250 && (await P.evaluate(() => window.__fb.calls.length)) === fbBuy0, JSON.stringify([d6.coins, d6.owned, d6.bg, sk])); }
check("산 뒤 미리보기 단추가 '장착 중' + '해제'", (await pvState()).acts.join("|") === "=장착 중(x)|off=해제", JSON.stringify((await pvState()).acts));
await click("#spPv .cfg__x"); await nap(300);
await click('#spGrid [data-item="bg:3"]'); await nap(400);
check("현금 값을 못 받은 판 배경(콘솔에 아직 없음)은 코인 단추만", (await pvState()).acts.join("|") === "coin=" + S.BG_PRICE[3].toLocaleString(), JSON.stringify((await pvState()).acts));
await click('#pvA [data-pv="coin"]'); await nap(300);
check("코인이 모자라면 모자란다고", ((await askOn()) || {}).t === "코인이 모자랍니다", JSON.stringify(await askOn()));
await yes(); await nap(200);
await click("#spPv .cfg__x"); await nap(300);
check("X 로 미리보기를 닫는다", !(await pvState()).on);
await click('#spGrid [data-item="bg:2"]'); await nap(400);
await P.evaluate(() => window.__back()); await nap(300);
check("**폰 뒤로가기는 미리보기만 닫는다** (상점은 그대로)", !(await pvState()).on && (await H.screen()) === "shop", await H.screen());

console.log("\n[6c. 카드 스킨 — 얼음 왕국]");
await tab("deck"); await nap(500);
const dkCells = await P.evaluate(() => [...document.querySelectorAll("#spGrid [data-item]")].map(e => e.dataset.item + "=" + e.textContent.replace(/\s+/g, " ").trim()));
check("**카드 3칸: 얼음 왕국 · 신화 왕국 · 조선 궁중 (각 " + S.DECK_PRICE[1].toLocaleString() + "코인) — 기본 카드 칸 없음**", dkCells.length === 3 &&
  new RegExp("deck:3=조선 궁중\\s*" + S.DECK_PRICE[3].toLocaleString()).test(dkCells[2]) &&
  new RegExp("deck:1=얼음 왕국\\s*" + S.DECK_PRICE[1].toLocaleString()).test(dkCells[0]) &&
  new RegExp("deck:2=신화 왕국\\s*" + S.DECK_PRICE[2].toLocaleString()).test(dkCells[1]), dkCells.join(" | "));
{ const K = await import(pathToFileURL(join(ROOT, "src/lib/skin.js")).href);
  check("**카드 이름은 스킨마다** — 신화 왕국 12 고블린 · 8 MINOTAUR · 조커 프리스트 / 기본·얼음은 동물 · 카멜레온",
    K.cardName(12, "ko", 2) === "고블린" && K.cardName(8, "en", 2) === "MINOTAUR" && K.cardName(13, "ko", 2) === "프리스트" && K.cardName(14, "en", 2) === "PRIEST" &&
    K.cardName(1, "ko", 0) === "사자" && K.cardName(12, "ko", 1) === "생쥐" && K.cardName(13, "en", 1) === "CHAMELEON" &&
    K.jokerWord("en", "many", 2) === "priests" && K.jokerWord("ko", "one", 0) === "카멜레온",
    [K.cardName(12, "ko", 2), K.cardName(8, "en", 2), K.cardName(13, "ko", 2), K.cardName(12, "ko", 1)].join(" "));
  check("조사가 받침을 따른다 (카멜레온은 · 프리스트는)", K.josa("카멜레온", "은", "는") === "카멜레온은" && K.josa("프리스트", "은", "는") === "프리스트는"); }
const dkPics = await P.evaluate(() => [...document.querySelectorAll('#spGrid [data-item="deck:1"] .sp__pic--deck i')].map(e => getComputedStyle(e).backgroundImage));
check("얼음 왕국 칸 그림 = 그 스킨 뒷면 + 1번 앞면", dkPics.length === 2 && /deck_1\/back\.webp/.test(dkPics[0]) && /deck_1\/card_01\.webp/.test(dkPics[1]), dkPics.map(x => x.slice(-28)).join(" "));
await seed("u1", Object.assign({}, await acct("u1"), { coins: S.DECK_PRICE[1] + 40 }));
await syncFromServer(); await nap(300);
await click('#spGrid [data-item="deck:1"]'); await nap(500);
{ const v = await pvState();
  const want = ["deck_1/joker_a", "deck_1/joker_b", ...Array.from({ length: 12 }, (_, i) => "deck_1/card_" + String(i + 1).padStart(2, "0"))];
  const fr = await P.evaluate(() => { const c = document.querySelector("#pvB .pc"); return c ? getComputedStyle(c).getPropertyValue("--p1").trim().toUpperCase() : ""; });
  check("**카드 스킨을 누르면 미리보기 창 — 뒷면 · 조커 둘 · 1~12 열두 장 (그 스킨 그림 · 그 스킨 테두리 색)**", v.on && v.t === "얼음 왕국" &&
    want.every((w, i) => (v.imgs[i] || "").includes(w)) && v.imgs.length === 14 && fr === "#F1F8FF" && v.acts.join(" | ") === "cash=₩4,900 | coin=" + S.DECK_PRICE[1].toLocaleString(),
    JSON.stringify([v.imgs.length, fr, v.acts])); }
await click('#pvA [data-pv="cash"]');                       /* 현금으로 — 구글 결제 창이 값을 보여 주므로 더 묻지 않는다 */
await waitFor(async () => (await acct("u1")).deck === 1, 8000, 150);
await nap(400);
{ const d7 = await acct("u1");
  const sk = await P.evaluate(() => [document.documentElement.style.getPropertyValue("--skin-back"), document.documentElement.dataset.skinDeck]);
  const call = await P.evaluate(() => window.__fb.calls[window.__fb.calls.length - 1]);
  const gb = [...buys.values()].find(b => b.product === "deck_1");
  check("**현금으로 사면 코인은 그대로 · 가진 것에 deck:1 · 바로 장착 · 뒷면 그림과 테두리 표시가 바뀜**", d7.coins === S.DECK_PRICE[1] + 40 && (d7.owned || []).includes("deck:1") && d7.deck === 1 &&
    /deck_1\/back\.webp/.test(sk[0]) && sk[1] === "1", JSON.stringify([d7.coins, d7.owned, d7.deck, sk]));
  check("플러그인에 넘긴 값: 상품 deck_1 · 계속 가지는 상품(소모 안 함) · 스스로 확인 안 함 · 서버가 구글에 확인(acknowledge)",
    call && call.productIdentifier === "deck_1" && call.isConsumable === false && call.autoAcknowledgePurchases === false && gb && gb.acked && !gb.consumed, JSON.stringify(call)); }
check("산 뒤 미리보기 단추가 '장착 중' + '해제'", (await pvState()).acts.join("|") === "=장착 중(x)|off=해제", JSON.stringify((await pvState()).acts));
await click('#pvA [data-pv="off"]');
await waitFor(async () => (await acct("u1")).deck === 0, 8000, 150);
await nap(300);
check("**해제 → 기본 카드로 (deck 0)** · 미리보기 단추가 '장착'으로", (await acct("u1")).deck === 0 && (await pvState()).acts.join("|") === "wear=장착", JSON.stringify((await pvState()).acts));
await click('#pvA [data-pv="wear"]');
await waitFor(async () => (await acct("u1")).deck === 1, 8000, 150);
await click("#spPv .cfg__x"); await nap(2000);              /* "장착했습니다" 알림(1.8초)이 지나간 뒤 */
check("현금으로 산 스킨 칸은 '장착 중'", /장착 중/.test(((await cell("deck:1")) || {}).st || ""));
await P.evaluate(() => window.__goto("lobby")); await nap(300);

console.log("\n[6d. 이모티콘 묶음 (2026-10-29) — 코인 7,500 · 현금 emote_1 · 장착 없음]");
await tab("emote"); await nap(500);
{ const cs = await P.evaluate(() => [...document.querySelectorAll("#spGrid [data-item]")].map(e => e.dataset.item + "=" + e.textContent.replace(/\s+/g, " ").trim()));
  const ims = await P.evaluate(() => [...document.querySelectorAll('#spGrid [data-item="emote:1"] .sp__pic--emo i')].map(e => getComputedStyle(e).backgroundImage));
  check("**이모티콘 칸 하나: 신화 이모티콘 · 7,500 · 또는 ₩1,900** (기본 다섯 개 칸은 없다)", cs.length === 1 && /^emote:1=신화 이모티콘\s*7,500\s*또는 ₩1,900$/.test(cs[0]), cs.join(" | "));
  check("칸 그림 = 묶음 다섯(용·고블린·여우·메두사·미노타우로스)", ims.length === 5 && ["dragon", "goblin", "fox", "medusa", "minotaur"].every((k, i) => new RegExp("emote_" + k + "\\.webp").test(ims[i])), ims.map(x => x.slice(-26)).join(" "));
  check("값: 코인 7,500 · 현금 상품 emote_1 (계속 가지는 상품)", S.EMO_PRICE[1] === 7500 && S.cashOf("emote:1") === "emote_1" && S.keeps("emote_1") && S.PRODUCTS.includes("emote_1"));
  /* 서버가 "산 사람만 보낸다" 를 볼 때 쓰는 묶음 표(shop.js EMO_PACKS)와 앱 그림 표(assets.js EMOTES 의 pack)가 같아야 한다 */
  const AS = await import(pathToFileURL(join(ROOT, "src/lib/assets.js")).href);
  const fromAssets = AS.EMOTES.filter(e => e.pack === 1).map(e => e.k).join(",");
  check("묶음 표가 앱 그림 표와 같다 (서버 이모티콘 지킴)", fromAssets === S.EMO_PACKS[1].join(",") && AS.EMOTES.filter(e => !e.pack).every(e => S.emoPackOf(e.k) === 0),
    fromAssets + " / " + S.EMO_PACKS[1].join(",")); }
await seed("u1", Object.assign({}, await acct("u1"), { coins: 7500 + 30 }));
await syncFromServer(); await nap(300);
await click('#spGrid [data-item="emote:1"]'); await nap(500);
{ const v = await pvState();
  const em = await P.evaluate(() => [...document.querySelectorAll("#pvB .pv__emo")].map(e => ({ t: e.querySelector(".pv__bub").textContent.replace(/ /g, " "),
    img: (e.querySelector(".pv__eimg").getAttribute("style") || "").replace(/.*emote_(\w+)\.webp.*/, "$1"),
    fit: (b => b.scrollWidth <= b.clientWidth + 1 && b.scrollHeight <= b.clientHeight + 1)(e.querySelector(".pv__bub")) })));
  check("**누르면 미리보기 — 다섯 개를 판에서 뜨는 모습(말풍선 + 그림)으로 · 아래에 현금 ₩1,900 · 코인 7,500**", v.on && v.t === "신화 이모티콘" &&
    em.map(x => x.t).join("|") === "까불지 말어잉|배꼽 빠져잇|귀여워^^|아 줴줴이야..|그만!!! 멈춰 !!!" && em.map(x => x.img).join(",") === "dragon,goblin,fox,medusa,minotaur" &&
    v.acts.join(" | ") === "cash=₩1,900 | coin=7,500", JSON.stringify([v.t, em, v.acts]));
  check("미리보기 말풍선 글자가 안 잘린다", em.every(x => x.fit), JSON.stringify(em.map(x => x.fit))); }
await click('#pvA [data-pv="coin"]'); await nap(300);
check("코인 단추 → 한 번 더 묻는다 (이름 · 값 — **장착 말은 없다**)", ((await askOn()) || {}).m === "신화 이모티콘 — 7,500코인에 살까요?", ((await askOn()) || {}).m);
await yes();
await waitFor(async () => ((await acct("u1")).owned || []).includes("emote:1"), 8000, 150);
await nap(600);
{ const d8 = await acct("u1");
  check("**코인으로 사면 7,530 → 30 · 가진 것에 emote:1 · 장착 요청이 없다(오류 창 없음)**", d8.coins === 30 && (d8.owned || []).includes("emote:1") && !(await askOn()),
    JSON.stringify([d8.coins, d8.owned, await askOn()]));
  check("산 뒤 미리보기 단추가 '구매함'", (await pvState()).acts.join("|") === "=구매함(x)", JSON.stringify((await pvState()).acts)); }
await click("#spPv .cfg__x"); await nap(2000);
check("칸은 '구매함'", /구매함/.test(((await cell("emote:1")) || {}).st || ""), JSON.stringify(await cell("emote:1")));
/* 현금으로 — 가진 것을 비우고 다시(같은 사람) */
await seed("u1", Object.assign({}, await acct("u1"), { owned: ((await acct("u1")).owned || []).filter(x => x !== "emote:1") }));
await syncFromServer(); await nap(300);
const fbE = await P.evaluate(() => window.__fb.calls.length);
await click('#spGrid [data-item="emote:1"]'); await nap(400);
await click('#pvA [data-pv="cash"]');
await waitFor(async () => ((await acct("u1")).owned || []).includes("emote:1"), 8000, 150);
await nap(600);
{ const d9 = await acct("u1");
  const call = await P.evaluate(() => window.__fb.calls[window.__fb.calls.length - 1]);
  const gb = [...buys.values()].find(b => b.product === "emote_1");
  check("**현금으로 사면 코인 그대로(30) · 가진 것에 emote:1 · 오류 창 없음**", d9.coins === 30 && (d9.owned || []).includes("emote:1") && !(await askOn()) &&
    (await P.evaluate(() => window.__fb.calls.length)) === fbE + 1, JSON.stringify([d9.coins, d9.owned, await askOn()]));
  check("플러그인에 넘긴 값: 상품 emote_1 · 계속 가지는 상품(소모 안 함) · 서버가 구글에 확인(acknowledge)",
    call && call.productIdentifier === "emote_1" && call.isConsumable === false && gb && gb.acked && !gb.consumed, JSON.stringify(call)); }
await click("#spPv .cfg__x"); await nap(300);
await P.evaluate(() => window.__goto("lobby")); await nap(300);

console.log("\n[7. 게임을 끝까지 하면 코인]");
await seed("u1", Object.assign({}, await acct("u1"), { noAds: true, tickets: 3, ticketAt: Date.now() }));   /* 광고 제거 — 게임 끝 광고를 안 받는가도 본다 */
await syncFromServer();
const before = (await acct("u1")).coins;
await P.evaluate(() => { globalThis.__preInter = 0; });
await H.drv({ on: true, think: [80, 200] });
const code = await H.create({ cap: 4, rounds: 1, tax: false });
check("(준비) 1판짜리 방", Boolean(code), code);
await waitFor(async () => (await H.seated()) >= 4, 20000, 300);
await H.pressStart();
const drew = await waitFor(async () => (await H.screen()) === "draw", 20000, 150);
const drawBack = drew ? await P.evaluate(() => [...document.querySelectorAll("#draw .pk__f--b img")].map(i => i.getAttribute("src"))) : [];
check("**뽑기 카드 뒷면 = 산 카드 스킨(얼음 왕국)**", drawBack.length > 0 && drawBack.every(s => s === "assets/deck_1/back.webp"), drawBack.slice(0, 2).join(" "));
await waitFor(async () => (await H.screen()) === "table", 30000, 200);
await nap(1500);
const faces = await P.evaluate(() => [...document.querySelectorAll("#table img")].map(i => i.getAttribute("src")).filter(s => /card_|joker_/.test(s || "")));
{ /* 이모티콘 묶음을 산 사람 — 판의 감정표현 고르는 판이 열 개(두 줄) */
  const n = await P.evaluate(async () => { document.getElementById("emo").click(); await new Promise(r => setTimeout(r, 300));
    const k = [...document.querySelectorAll("#table .emopick button")].map(b => b.dataset.k);
    document.getElementById("emo").click(); return k; });
  check("**판에서 감정표현 열 개 (산 묶음 다섯 포함)**", n.length === 10 && n.slice(5).join(",") === "dragon,goblin,fox,medusa,minotaur", n.join(",")); }
{ const tb = await P.evaluate(() => getComputedStyle(document.getElementById("table")).backgroundImage);
  check("**판 화면 배경이 산 판(황금 정원)**", /tablebg_1\.webp/.test(tb), tb.slice(-40)); }
check("**판 카드 앞면 = 얼음 왕국 그림 (assets/deck_1/card_NN · joker_a·b)**", faces.length > 0 && faces.every(s => /^assets\/deck_1\/(card_\d\d|joker_[ab])\.webp$/.test(s)), faces.slice(0, 3).join(" "));
{ const fr = await P.evaluate(() => { const c = document.querySelector("#table .hand .card"); if (!c) return null;
    const cs = getComputedStyle(c), num = c.querySelector(".card__num");
    return [cs.getPropertyValue("--p1").trim(), num ? getComputedStyle(num).color : ""]; });
  check("**손패 카드 테두리·숫자가 얼음색 (B안)** — 테두리 #F1F8FF · 숫자 남색", fr && fr[0].toUpperCase() === "#F1F8FF" && fr[1] === "rgb(18, 48, 90)", JSON.stringify(fr)); }
const ended = await waitFor(async () => (await H.screen()) === "result" && await P.evaluate(() => Boolean(window.__resultFinal)), 240000, 500);
check("(준비) 게임이 끝났다", ended, await H.screen());
await nap(1500);
const d = await acct("u1");
const got = (d.coins || 0) - before;
check("서버가 코인을 줬다 (등수 몫 + 그날 첫 게임 100)", S.COIN.place.concat([S.COIN.rest]).map(x => x + S.COIN.daily).includes(got), before + " → " + d.coins);
await syncFromServer();
await nap(300);
const line = await P.evaluate(() => { const e = document.getElementById("coinLine"); return e && !e.hidden ? e.textContent.replace(/\s+/g, " ").trim() : ""; });
check("**결과 화면에 '코인 +" + got + "' (오늘 첫 게임 +100 포함)**", line.includes("+" + got) && /오늘 첫 게임 \+100/.test(line), line);
check("**광고 제거를 산 사람은 게임 끝 전면 광고를 받지도 않는다**", (await P.evaluate(() => globalThis.__preInter || 0)) === 0);

check("화면 오류가 없다", H.errs.filter(e => !/Failed to load|net::ERR/.test(e)).length === 0, H.errs.slice(0, 4).join(" | "));
try { gsrv.close(); } catch(e){}
await closeAll(env, srv);
process.exit(C.done());
