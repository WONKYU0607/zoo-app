/* 출시 전 마지막 손보기 (2026-10-10) — 진짜 빌드를 브라우저로 띄워 좌표로 누르며 본다.

   1. 첫 화면 — 키 작은 폰에서 카드 부채꼴이 동의 글·단추와 안 겹친다. 키 큰 폰은 그대로
   2. 무료 한도 아끼기
      - 초대: 10초마다 읽기 → 지켜보기. 로비·대기실에서만 뜨고, 판 중(첫 화면 포함)에 온 것은
        돌아오면 뜬다. 2분 지난 것·이미 본 것은 안 뜬다. 계정이 바뀌면 지켜보는 곳도 바뀐다
      - 접속 표시: 1분 → 3분마다. 앱이 뒤에 있으면 안 적는다. 내리면 "off", 올리면 다시
   3. 별명 — 욕설·성적인 말·운영자/게스트 흉내는 안 되고 까닭이 보인다
   4. 설정 창 맨 아래 앱 버전
   (랭킹 10분 기억은 rank.test.mjs, 거르기 낱말·초대 지켜보기 속은 invname.test.mjs)
   쓰는 법:  node test/final1010.test.mjs */
import { canRun, checker, launch, human, startServer, closeAll, nap, waitFor } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;

const srv = await startServer({ NODE_ENV: "test" });
const env = await launch();
const H = await human(env, srv, "나");
const P = H.page;

/* 좌표로 누른다 — 그 자리에 실제로 그 단추가 있는지도 돌려준다 */
const press = async sel => {
  const at = await P.evaluate(s => { const e = document.querySelector(s); if (!e) return null;
    const r = e.getBoundingClientRect(); if (!r.width) return null;
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const h = document.elementFromPoint(x, y); return { x, y, mine: Boolean(h && (h === e || e.contains(h))) }; }, sel);
  if (!at) return false;
  await P.mouse.click(at.x, at.y);
  return at.mine;
};

/* ---------- 1. 첫 화면 ---------- */
console.log("\n[1. 첫 화면 부채꼴]");
const fit = () => P.evaluate(() => {
  const vis = e => e && !e.hidden && e.getBoundingClientRect().height > 0;
  const cards = [...document.querySelectorAll("#entry .fan .card")].map(c => c.getBoundingClientRect());
  const fanT = Math.min(...cards.map(c => c.top)), fanB = Math.max(...cards.map(c => c.bottom));
  const sp = document.querySelector("#entry .spacer");
  let ctl = Infinity;
  for (let e = sp.nextElementSibling; e; e = e.nextElementSibling) if (vis(e)) ctl = Math.min(ctl, e.getBoundingClientRect().top);
  const hr = document.querySelector("#entry .hr").getBoundingClientRect().bottom;
  const fan = document.getElementById("fan");
  return { up: Math.round(fanT - hr), down: Math.round(ctl - fanB), w: Number(fan.dataset.w || 0),
           moved: fan.style.top !== "" || [...fan.children].some(c => c.style.getPropertyValue("--w")),
           cardW: Math.round(document.querySelector('#entry .fan .card[data-i="0"]').offsetWidth) };
});
for (const [state, lang] of [["동의 전", "ko"], ["동의 후", "ko"], ["동의 전", "en"]]){
  await P.evaluate((st, lang) => {
    localStorage.setItem("zk_lang", lang);
    if (st === "동의 전") localStorage.removeItem("zk_agree"); else localStorage.setItem("zk_agree", "1");
  }, state, lang);
  const bad = [], tall = [];
  for (const [w, h] of [[360, 600], [360, 640], [412, 640], [360, 680], [412, 720], [360, 740], [412, 800], [360, 854], [412, 915]]){
    await P.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await P.reload({ waitUntil: "networkidle0" }); await nap(1600);    /* 카드 깔리는 움직임이 끝난 뒤 */
    const f = await fit();
    if (f.up < 8 || f.down < 8 || f.w < 52 || f.w > 80 || f.cardW !== f.w) bad.push(w + "x" + h + " " + JSON.stringify(f));
    if (h >= 854 && (f.moved || f.w !== 80)) tall.push(w + "x" + h + " " + JSON.stringify(f));
  }
  check(state + "(" + lang + ") — 어느 폰에서도 위(제목)·아래(동의 글·단추) 모두 8px 넘게 떨어진다", !bad.length, bad.join(" | "));
  check(state + "(" + lang + ") — 키 큰 폰(854·915)은 예전 그대로(자리·크기 안 건드림)", !tall.length, tall.join(" | "));
}
/* 동의하는 순간 단추가 줄어드니 부채꼴이 제자리로 돌아가야 한다(새로 고치지 않고) */
await P.evaluate(() => { localStorage.removeItem("zk_agree"); localStorage.setItem("zk_lang", "ko"); });
await P.setViewport({ width: 360, height: 640, deviceScaleFactor: 1 });
await P.reload({ waitUntil: "networkidle0" }); await nap(1600);
const before = await fit();
check("동의 칸이 손가락을 받는다(부채꼴이 가리지 않는다)", await press("#entry #agTerms") && await press("#entry #agPriv"));
check("'동의하고 시작하기' 가 손가락을 받는다", await press("#entry #agGo"));
await nap(500);
const after = await fit();
check("동의하면 그 자리에서 다시 맞춘다 — 빈자리가 넓어져 카드가 다시 커진다", before.w < 80 && after.w > before.w && after.down >= 8 && after.up >= 8,
  "전 " + JSON.stringify(before) + " → 후 " + JSON.stringify(after));
await P.setViewport({ width: 412, height: 745, deviceScaleFactor: 1 });

/* ---------- 준비: 타이머 기록 · 앱 내림 흉내 ---------- */
await P.evaluateOnNewDocument(() => {
  const si = window.setInterval;
  window.__ivs = [];
  window.setInterval = function(fn, ms, ...a){ window.__ivs.push({ fn, ms }); return si.call(this, fn, ms, ...a); };
  Object.defineProperty(Document.prototype, "hidden", { configurable: true, get(){ return Boolean(window.__hid); } });
});
await H.reload();
await P.evaluate(() => window.__goto("lobby")); await nap(300);

/* ---------- 2. 초대 · 접속 표시 ---------- */
console.log("\n[2. 초대 · 접속 표시]");
const iv = await P.evaluate(() => window.__ivs.map(x => x.ms));
check("접속 표시는 3분마다 (예전 1분)", iv.includes(180000) && !iv.includes(60000), JSON.stringify([...new Set(iv)].sort((a, b) => a - b)));
check("초대 10초마다 읽기가 없어졌다", !iv.includes(10000));

/* 친구 자료는 window.__friends 한 곳으로 온다 — 기록하는 가짜로 바꾼다 */
await P.evaluate(() => {
  const real = window.__friends;
  Object.assign(window, { __presLog: [], __invCb: null, __invSubs: 0, __invUnsubs: 0, __invPolls: 0, __joined: null, __dropped: null });
  window.__friends = Object.assign({}, real, {
    setPresence: async st => { window.__presLog.push(st); },
    watchInvites: cb => { window.__invSubs++; window.__invCb = cb; return () => { window.__invUnsubs++; }; },
    invites: async () => { window.__invPolls++; return []; },
    dropInvite: async uid => { window.__dropped = uid; },
  });
  window.__joinRoom = async code => { window.__joined = code; return 1; };
  window.ACCOUNT.uid = "me1";
  window.dispatchEvent(new Event("accountchange"));
});
await nap(200);
check("로그인하면 내 초대함을 지켜보기 시작한다(한 번)", await P.evaluate(() => window.__invSubs) === 1);
const askOn = () => P.evaluate(() => { const a = document.getElementById("ask");
  return a && a.classList.contains("on") ? document.getElementById("askM").textContent : null; });
const push = rows => P.evaluate(r => window.__invCb(r.map(x => Object.assign({ at: Date.now() }, x))), rows);

await push([{ uid: "f1", name: "친구가", code: "1234" }]);
await nap(300);
check("로비에서 초대가 오면 바로 뜬다", (await askOn()) === "친구가 님이 불렀습니다", String(await askOn()));
check("'들어가기' 가 손가락을 받는다", await press("#askYes"));
await waitFor(() => P.evaluate(() => window.__joined != null), 3000, 50);
const j = await P.evaluate(() => ({ joined: window.__joined, dropped: window.__dropped, scr: (document.querySelector(".page.is-on") || {}).id }));
check("누르면 그 방으로 들어가고 초대는 지운다", j.joined === "1234" && j.dropped === "f1" && j.scr === "room", JSON.stringify(j));

await P.evaluate(() => window.__goto("entry")); await nap(200);
await push([{ uid: "f2", name: "친구나", code: "5678" }]);
await nap(300);
check("판 중(로비·대기실 밖)에는 안 뜬다", (await askOn()) === null, String(await askOn()));
await P.evaluate(() => window.__goto("lobby")); await nap(300);
check("로비로 돌아오면 그때 뜬다", (await askOn()) === "친구나 님이 불렀습니다", String(await askOn()));
check("'취소' 가 손가락을 받는다", await press("#askNo"));
await nap(200);
await push([{ uid: "f2", name: "친구나", code: "5678" }]);
await nap(300);
check("한 번 본(닫은) 초대는 또 안 뜬다", (await askOn()) === null);
await push([{ uid: "f3", name: "친구다", code: "9999", at: Date.now() - 3 * 60 * 1000 }]);
await nap(300);
check("2분 지난 초대는 안 뜬다", (await askOn()) === null);
/* 판 중에 왔다가 2분이 지난 뒤 로비로 돌아온 경우 */
await P.evaluate(() => window.__goto("entry")); await nap(100);
await push([{ uid: "f4", name: "친구라", code: "4444", at: Date.now() - 119500 }]);
await nap(1200);
await P.evaluate(() => window.__goto("lobby")); await nap(300);
check("판 중에 왔어도 돌아올 때 2분이 지났으면 안 뜬다", (await askOn()) === null, String(await askOn()));

await P.evaluate(() => { window.ACCOUNT.uid = "me2"; window.dispatchEvent(new Event("accountchange")); });
await nap(200);
const sw = await P.evaluate(() => ({ s: window.__invSubs, u: window.__invUnsubs }));
check("계정이 바뀌면 옛 초대함은 그만 보고 새 초대함을 본다", sw.s === 2 && sw.u === 1, JSON.stringify(sw));
await P.evaluate(() => { window.ACCOUNT.uid = null; window.dispatchEvent(new Event("accountchange")); });
const sw2 = await P.evaluate(() => ({ s: window.__invSubs, u: window.__invUnsubs }));
check("로그아웃하면 지켜보기를 멈춘다", sw2.s === 2 && sw2.u === 2, JSON.stringify(sw2));

/* 접속 표시 */
const pres = () => P.evaluate(() => window.__presLog.slice());
await P.evaluate(() => { window.__presLog.length = 0; window.__goto("room"); }); await nap(200);
await P.evaluate(() => window.__goto("lobby")); await nap(200);
await P.evaluate(() => { window.__presLog.length = 0; window.__ivs.find(x => x.ms === 180000).fn(); });
check("3분 박자에 '살아 있다'를 적는다", JSON.stringify(await pres()) === '["lobby"]', JSON.stringify(await pres()));
await P.evaluate(() => { window.__presLog.length = 0; window.__hid = true; document.dispatchEvent(new Event("visibilitychange")); });
check("앱을 내리면 바로 'off'", JSON.stringify(await pres()) === '["off"]', JSON.stringify(await pres()));
await P.evaluate(() => { window.__presLog.length = 0; window.__ivs.find(x => x.ms === 180000).fn(); });
check("앱이 뒤에 있는 동안은 3분 박자에도 안 적는다", (await pres()).length === 0, JSON.stringify(await pres()));
await P.evaluate(() => { window.__hid = false; document.dispatchEvent(new Event("visibilitychange")); });
check("다시 올리면 바로 'lobby'", JSON.stringify(await pres()) === '["lobby"]', JSON.stringify(await pres()));
await P.evaluate(() => { window.__presLog.length = 0;
  window.dispatchEvent(new Event("apppause")); window.dispatchEvent(new Event("apppause")); });
check("안드로이드 앱 내림 신호에도 'off' (두 번 와도 한 번만 적는다)", JSON.stringify(await pres()) === '["off"]', JSON.stringify(await pres()));
await P.evaluate(() => { window.__presLog.length = 0; window.dispatchEvent(new Event("appresume")); });
check("앱 올림 신호에 다시 'lobby'", JSON.stringify(await pres()) === '["lobby"]', JSON.stringify(await pres()));
await nap(11000);
check("10초 넘게 지나도 초대함을 다시 읽지 않는다(지켜보기만)", await P.evaluate(() => window.__invPolls) === 0);

/* ---------- 3. 별명 ---------- */
console.log("\n[3. 별명 거르기]");
await P.evaluate(() => window.__askName()); await nap(400);
const tryName = async v => {
  await P.evaluate(v => { const i = document.getElementById("nkIn"); i.value = v; }, v);
  const okBtn = await press("#nkOk");
  await waitFor(() => P.evaluate(() => !/확인하는 중|Checking/.test(document.getElementById("nkMsg").textContent)), 3000, 50);
  return { okBtn, msg: await P.evaluate(() => document.getElementById("nkMsg").textContent) };
};
let r = await tryName("씨발");
check("'정하기' 가 손가락을 받는다", r.okBtn);
check("욕설은 안 되고 까닭이 보인다", r.msg === "쓸 수 없는 말이 들어 있습니다", r.msg);
r = await tryName("시1발");
check("사이에 숫자를 끼워도 잡는다 (시1발)", r.msg === "쓸 수 없는 말이 들어 있습니다", r.msg);
r = await tryName("ㅅㅂ");
check("자음만 써도 잡는다 (ㅅㅂ)", r.msg === "쓸 수 없는 말이 들어 있습니다", r.msg);
r = await tryName("s3x");
check("영어·숫자 바꾸기도 잡는다 (s3x)", r.msg === "쓸 수 없는 말이 들어 있습니다", r.msg);
r = await tryName("운영자");
check("운영자 흉내는 안 된다", /운영자처럼 보이거나/.test(r.msg), r.msg);
r = await tryName("게스트77");
check("'게스트' 로 시작하는 이름은 안 된다", /'게스트'로 시작하는/.test(r.msg), r.msg);
r = await tryName("사자왕");
check("멀쩡한 이름은 거르기를 지나간다(로그인 전이라 그다음에서 멈춘다)", /로그인/.test(r.msg), r.msg);
await P.evaluate(() => { window.__lang = "en"; });
r = await tryName("fuuuck");
check("영어 화면에서는 영어로 알린다", r.msg === "That name isn't allowed", r.msg);
await P.evaluate(() => { window.__lang = "ko"; document.getElementById("nkBox").classList.remove("on"); });

/* ---------- 4. 앱 버전 ---------- */
console.log("\n[4. 설정 창 앱 버전]");
await P.evaluate(() => { window.__appBuildForTest = 7; window.__appVersionForTest = "1.0.5"; window.__goto("lobby"); });
await nap(300);
check("설정 단추가 손가락을 받는다", await press("#lobby .top__cfg"));
await waitFor(() => P.evaluate(() => /1\.0\.5/.test((document.getElementById("cfgVer") || {}).textContent || "")), 3000, 50);
const ver = () => P.evaluate(() => { const e = document.getElementById("cfgVer"); const b = e.getBoundingClientRect();
  const l = document.querySelector("#cfg .cfg__links").getBoundingClientRect();
  return { t: e.textContent, h: b.height, below: b.top >= l.bottom - 1, fs: getComputedStyle(e).fontSize }; });
let v = await ver();
check("맨 아래 '버전 1.0.5 (7)'", v.t === "버전 1.0.5 (7)" && v.h > 0 && v.below, JSON.stringify(v));
/* 설정 창이 다 올라온 뒤 누른다 */
await waitFor(async () => { const a = await P.evaluate(() => document.querySelector('#cfg [data-l="en"]').getBoundingClientRect().top);
  await nap(120); return a === await P.evaluate(() => document.querySelector('#cfg [data-l="en"]').getBoundingClientRect().top); }, 3000, 50);
check("English 단추가 손가락을 받는다", await press('#cfg [data-l="en"]'));
await nap(300);
v = await ver();
check("영어로 바꾸면 'Version 1.0.5 (7)'", v.t === "Version 1.0.5 (7)", JSON.stringify(v));
await press('#cfg [data-l="ko"]'); await nap(300);

/* ---------- 5. 화면 읽기용 단추 이름 ---------- */
console.log("\n[5. 화면 읽기(TalkBack)용 단추 이름]");
const HAN = /[\u3131-\u318E\uAC00-\uD7A3]/;
const KNOWN_EN = /^(close|settings|profile|rename|leave|back|room code|emotes|mute|unmute)$/i;
const labels = () => P.evaluate(() => [...document.querySelectorAll("[aria-label]")].map(e =>
  (e.id || e.className || e.tagName).toString().slice(0, 24) + "=" + e.getAttribute("aria-label")));
/* 나중에 그려지는 창들도 한 번씩 연다 — 친구 창·별명 창·랭킹 */
const openAll = () => P.evaluate(() => {
  document.querySelector("[data-friendopen]") && document.querySelector("[data-friendopen]").click();
  window.__askName && window.__askName();
  document.getElementById("nkBox") && document.getElementById("nkBox").classList.remove("on");
  document.getElementById("frBox") && document.getElementById("frBox").classList.remove("on");
});
await P.evaluate(() => { document.getElementById("cfg").classList.remove("on"); window.__goto("lobby"); }); await nap(500);
await openAll(); await nap(200);
let L = await labels();
check("한국어 화면 — 단추 이름에 영어(close·settings 등)가 안 남는다", !L.some(x => KNOWN_EN.test(x.split("=").slice(1).join("="))),
  L.filter(x => KNOWN_EN.test(x.split("=").slice(1).join("="))).join(", "));
check("한국어 화면 — '나가기'·'닫기'·'설정' 처럼 읽는다", L.some(x => x.endsWith("=나가기")) && L.some(x => x.endsWith("=닫기")) && L.some(x => x.endsWith("=설정")),
  L.slice(0, 8).join(", "));
/* 영어로 — 설정 창 단추를 좌표로 */
await press("#lobby .top__cfg");
await waitFor(async () => { const a = await P.evaluate(() => document.querySelector('#cfg [data-l="en"]').getBoundingClientRect().top);
  await nap(120); return a === await P.evaluate(() => document.querySelector('#cfg [data-l="en"]').getBoundingClientRect().top); }, 3000, 50);
await press('#cfg [data-l="en"]'); await nap(300);
check("영어로 바뀌었다", await P.evaluate(() => window.__lang) === "en");
await P.evaluate(() => document.getElementById("cfg").classList.remove("on")); await nap(400);
await openAll(); await nap(200);
L = await labels();
check("영어 화면 — 단추 이름에 한국어가 하나도 없다", !L.some(x => HAN.test(x.split("=").slice(1).join("="))),
  L.filter(x => HAN.test(x.split("=").slice(1).join("="))).join(", "));
check("영어 화면 — 'Leave'·'Close'·'Settings'·'Room code'·'Emotes'·'Back' 로 읽는다",
  ["Leave", "Close", "Settings", "Room code", "Emotes", "Back"].every(w => L.some(x => x.endsWith("=" + w))), L.join(", ").slice(0, 300));
/* 소리 단추 — 켜짐/꺼짐에 맞는 이름 */
const mute = () => P.evaluate(() => { const b = document.getElementById("btMute"); return { l: b.getAttribute("aria-label"), off: b.classList.contains("is-off") }; });
check("소리 단추가 손가락을 받는다", await press("#btMute"));
await nap(200);
let m = await mute();
check("영어 화면에서 끄면 'Unmute'", m.off && m.l === "Unmute", JSON.stringify(m));
await press("#lobby .top__cfg");
await waitFor(async () => { const a = await P.evaluate(() => document.querySelector('#cfg [data-l="ko"]').getBoundingClientRect().top);
  await nap(120); return a === await P.evaluate(() => document.querySelector('#cfg [data-l="ko"]').getBoundingClientRect().top); }, 3000, 50);
await press('#cfg [data-l="ko"]'); await nap(300);
await P.evaluate(() => document.getElementById("cfg").classList.remove("on")); await nap(200);
m = await mute();
check("꺼진 채 한국어로 바꾸면 '소리 켜기' (예전엔 '소리 끄기' 로 덮였다)", m.off && m.l === "소리 켜기", JSON.stringify(m));
await press("#btMute"); await nap(200);
m = await mute();
check("다시 켜면 '소리 끄기'", !m.off && m.l === "소리 끄기", JSON.stringify(m));
await P.evaluate(() => localStorage.setItem("zk_mute", "1"));
await H.reload(); await P.evaluate(() => window.__goto("lobby")); await nap(400);
m = await mute();
check("꺼 둔 채로 앱을 다시 켜도 단추가 꺼짐 모양·'소리 켜기'", m.off && m.l === "소리 켜기", JSON.stringify(m));
await P.evaluate(() => localStorage.setItem("zk_mute", "0"));

check("화면 오류·알림창이 없다", H.errs.length === 0, H.errs.slice(0, 3).join(" | "));
await closeAll(env, srv);
process.exit(C.done());
