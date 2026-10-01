/* 사람 여러 명이 한 서버에 붙어 노는 것을 흉내 내는 도구 (검사 파일이 아니다 — 앞의 _ 참고).

   지금까지의 검사는 거의 전부 "사람 1명 + 봇" 이었다. 그래서 방장이 나가는 경우,
   사람끼리 세금 주고받기, 판 사이 나가기, 친구 방처럼 **사람이 둘 이상인 경로**의
   고장이 한꺼번에 숨어 있었다(2026-09-30 한 번에 13개).
   여기서는 브라우저 하나에 **따로 떨어진 창(컨텍스트)** 을 사람 수만큼 연다 —
   같은 창을 나눠 쓰면 localStorage(하던 방 기록)가 섞인다.

   게임 서버는 zoo-app 옆의 zoo-server 폴더에서 직접 띄운다(없으면 검사가 건너뛴다).
   다른 곳에 있으면 ZOO_SERVER_DIR 로 알려 준다. */
import { spawn } from "node:child_process";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pup from "puppeteer-core";
import { serve, findBrowser, ensureBuild } from "./shot.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const nap = ms => new Promise(r => setTimeout(r, ms));

export const SERVER_DIR = process.env.ZOO_SERVER_DIR ||
  [join(HERE, "..", "..", "zoo-server")].find(p => existsSync(join(p, "server.js"))) || "";

/* 검사를 돌릴 수 있는가 — 안 되면 이유를 적고 건너뛴다 */
export async function canRun(){
  if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); return false; }
  if (!SERVER_DIR){
    console.log("\n게임 서버 폴더를 못 찾아 건너뜁니다 (zoo-server 가 zoo-app 과 나란히 있어야 합니다)\n");
    return false;
  }
  return true;
}

export function checker(){
  const c = { pass: 0, fail: 0 };
  c.check = (n, ok, note) => {
    if (ok){ c.pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
    else   { c.fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
  };
  c.done = () => { console.log("\n=== 통과 " + c.pass + " / 실패 " + c.fail + " ===\n"); return c.fail ? 1 : 0; };
  return c;
}

/* 빈 게임 서버를 띄운다. 검사마다 새로 — 앞 검사가 남긴 방이 끼어들지 않게 */
export async function startServer(env = {}){
  const port = 8100 + Math.floor(Math.random() * 800);
  const data = mkdtempSync(join(tmpdir(), "zoo-hum-"));
  const p = spawn(process.execPath, ["server.js"], { cwd: SERVER_DIR,
    env: Object.assign({}, process.env, { PORT: String(port), ZOO_DATA_DIR: data }, env),
    stdio: ["ignore", "pipe", "pipe"] });
  const lines = [];
  const eat = d => String(d).split("\n").forEach(l => { if (l.trim()) lines.push(l); });
  p.stdout.on("data", eat); p.stderr.on("data", eat);
  const url = "http://localhost:" + port;
  for (let i = 0; i < 80; i++){
    try { const r = await fetch(url + "/zoo/health"); if (r.ok) break; } catch(e){}
    await nap(250);
  }
  return { url, lines, kill: () => {
    try { p.kill("SIGKILL"); } catch(e){}
    try { rmSync(data, { recursive: true, force: true }); } catch(e){}
  } };
}

export async function api(srv, path, body){
  const r = await fetch(srv.url + path, { method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : {}; } catch(e){ j = { raw: t }; }
  return { status: r.status, body: j };
}
export const roomOf = async (srv, code) => (await api(srv, "/zoo/rooms/" + code)).body;
export const seatsOf = async (srv, code) =>
  ((await roomOf(srv, code)).players || []).map(p => (p.name || "-") + (p.bot ? "(봇)" : ""));

export async function launch(){
  ensureBuild();
  const found = await findBrowser();
  const web = await serve(5100 + Math.floor(Math.random() * 800));   /* 5060·5061 은 크롬이 막는 포트 */
  const browser = await pup.launch({
    args: [...found.args, "--no-sandbox", "--disable-dev-shm-usage"].filter(a => !/^--disable-web-security/.test(a)),
    executablePath: found.path, headless: true, protocolTimeout: 120000,
  });
  return { browser, web, appUrl: "http://localhost:" + web.__port + "/" };
}

/* 페이지 안에서 도는 "사람" — 자기 화면을 보고 사람처럼 누른다.
   window.__drv 로 조절한다: on(손을 놓을지) · think(한 수 고민 시간) · tax("pick" 이면
   세금 단계에서 **가장 좋은 카드**를 골라 준다 — 서버가 대신 주는 "가장 나쁜 카드" 와 구별하려고) */
const DRIVER = `(() => {
  if (window.__drv) return;
  const T0 = performance.now();
  const log = window.__hlog = [];
  const L = (...a) => log.push(Math.round(performance.now() - T0) + " " + a.join(" "));
  window.__drv = { on: true, think: [500, 1200], tax: "timer", draw: true };
  window.__gave = [];
  const scr = () => (document.querySelector(".page.is-on") || {}).id;
  const click = el => el && el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  const nap = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  let last = "", busy = false, turnKey = "", drawAt = 0, taxKey = "", revKey = "";
  setInterval(() => { const s = scr(); if (s !== last){ L("screen", s); last = s; } }, 100);
  async function tick(){
    if (!window.__drv.on || busy) return;
    const s = scr();
    const v = window.__eng && window.__eng.view;
    if (s === "draw" && window.__drv.draw){
      if (Date.now() - drawAt < 1500) return;
      drawAt = Date.now();
      const c = [...document.querySelectorAll("#draw .pk")].find(x => !x.className.includes("taken"));
      if (c){ click(c); L("draw pick"); }
      const g = document.querySelector("#draw #go");
      if (g && !g.disabled) click(g);
      return;
    }
    /* 혁명: rev 가 "declare" 면 쥐었을 때 선언, "mix" 면 반반, 그 밖에는 안 누른다(시간이 다 되면 안 부름) */
    if (s === "tax" && window.__taxProbe && window.__taxProbe.step() === 2 &&
        (window.__drv.rev === "declare" || window.__drv.rev === "mix")){
      const b = document.querySelector("#tax #next");
      const rk = (window.GAME || {}).roundNo + ":rev";
      if (b && b.classList.contains("bt-rev") && !b.disabled && revKey !== rk){
        revKey = rk;
        const go = window.__drv.rev === "declare" || Math.random() < 0.5;
        busy = true;
        try {
          await nap(rnd(800, 2500));
          const b2 = document.querySelector("#tax #next");
          if (go && b2 && b2.classList.contains("bt-rev") && !b2.disabled){ click(b2); L("rev declare"); }
          else L("rev hold");
        } finally { busy = false; }
        return;
      }
    }
    if (s === "tax" && window.__drv.tax === "pick" && window.__taxProbe){
      const p = window.__taxProbe;
      const key = (window.GAME || {}).roundNo + ":" + p.step();
      if (p.step() === 3 && p.giveCount() > 0 && p.sel().length === 0 && key !== taxKey){
        taxKey = key;
        busy = true;
        try {
          await nap(rnd(600, 1500));
          const want = p.hand().filter(c => c < 13).sort((a, b) => a - b).slice(0, p.giveCount());
          const got = p.pick(want);
          const b = document.querySelector("#tax #next");
          if (b && !b.disabled){
            click(b);
            window.__gave.push({ round: (window.GAME || {}).roundNo, cards: got });
            L("tax give", JSON.stringify(got));
          }
        } finally { busy = false; }
      }
      return;
    }
    if (s === "table" && v && v.myTurn){
      const q = document.querySelector("#table #pass");
      if (v.pile && (!q || q.disabled)) return;
      const key = (v.moveNo || 0) + ":" + (v.pile ? v.pile.num + "x" + v.pile.count : "-");
      if (key === turnKey) return;
      busy = true;
      try {
        await nap(rnd(window.__drv.think[0], window.__drv.think[1]));
        const v2 = window.__eng && window.__eng.view;
        if (!v2 || !v2.myTurn || scr() !== "table") return;
        turnKey = key;
        const need = v2.pile ? v2.pile.count : 1;
        const hand = v2.hand || [];
        const by = {};
        hand.forEach((c, i) => { (by[c] = by[c] || []).push(i); });
        let done = false;
        /* lose: 일부러 진다 — 받을 수 있으면 늘 패스, 선이면 가장 약한 한 장만 (꼴찌가 돼 대혁명을 보려고) */
        if (window.__drv.lose){
          const p0 = document.querySelector("#table #pass");
          if (v2.pile && p0 && !p0.disabled){ click(p0); L("pass(lose)"); return; }
          const w = hand.filter(c => c < 13).sort((a, b) => b - a)[0];
          const k = w != null ? hand.indexOf(w) : hand.findIndex(c => c >= 13);
          if (k >= 0){
            click(document.querySelectorAll("#table #hand .slot")[k]);
            const b = document.querySelector("#table #play");
            if (b && !b.disabled){ click(b); L("play(lose)", hand[k] + "x1"); return; }
            click(document.querySelectorAll("#table #hand .slot")[k]);
          }
        }
        for (const num of Object.keys(by).sort((a, b) => b - a)){
          const idx = by[num];
          if (idx.length < need) continue;
          idx.slice(0, need).forEach(i => click(document.querySelectorAll("#table #hand .slot")[i]));
          const b = document.querySelector("#table #play");
          if (b && !b.disabled){ click(b); L("play", num + "x" + need); done = true; break; }
          [...document.querySelectorAll("#table #hand .slot--sel")].forEach(x => click(x));
        }
        if (!done){
          const p = document.querySelector("#table #pass");
          if (p && !p.disabled){ click(p); L("pass"); }
          else L("stuck", JSON.stringify({ pile: v2.pile, hand: hand.length }));
        }
      } finally { busy = false; }
    }
  }
  setInterval(tick, 250);
})()`;

/* uid 를 주면 그 계정의 로그인 표("test:uid")를 보낸다 — 서버를 메모리 계정(ZOO_ACCOUNTS=memory,
   ZOO_TEST_TOKENS=1)으로 띄웠을 때. 앱(main.js)이 __idToken 을 덮어쓰지 못하게 못박아 둔다(새로고침해도 유지) */
export async function human(env, srv, name, { lang = "ko", uid = null } = {}){
  const ctx = await env.browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 412, height: 745, deviceScaleFactor: 1 });
  const errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => {
    const t = m.text();
    /* 서버가 4xx 로 거절한 것을 브라우저가 적는 줄은 앱 오류가 아니다 */
    if (m.type() === "error" && !/Failed to load resource/.test(t)) errs.push("console: " + t.slice(0, 200));
  });
  page.on("dialog", async d => { errs.push("dialog: " + d.message()); await d.dismiss().catch(() => {}); });
  await page.evaluateOnNewDocument((s, lang, uid) => {
    try { localStorage.setItem("zk_lang", lang); } catch(e){}
    globalThis.__ZOO_TEST = true; globalThis.__ZOO_SERVER = s;
    HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
    if (uid) Object.defineProperty(window, "__idToken", { configurable: false,
      get(){ return async () => "test:" + uid; }, set(){} });
  }, srv.url, lang, uid);
  await page.goto(env.appUrl, { waitUntil: "networkidle0" });
  const setName = n => page.evaluate(n => {
    window.spendTicket = async () => { window.__tickets = (window.__tickets || 0) + 1; return true; };
    if (window.ACCOUNT) window.ACCOUNT.name = n;
  }, n);
  await setName(name);
  await page.evaluate(DRIVER);
  const h = {
    name, page, ctx, errs,
    async reload(){ await page.reload({ waitUntil: "networkidle0" }); await setName(name); await page.evaluate(DRIVER); },
    screen: () => page.evaluate(() => (document.querySelector(".page.is-on") || {}).id),
    seat: () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem("zk_seat") || "null"); } catch(e){ return null; } }),
    log: () => page.evaluate(() => window.__hlog || []),
    drv: o => page.evaluate(o => Object.assign(window.__drv, o), o),
    async create(opts){
      await page.evaluate(o => { window.__opts = Object.assign({ cap: 4, seated: 1, rounds: 3, tax: true, clear2: false }, o); }, opts || {});
      await page.evaluate(async () => { await window.__createRoom(); });
      await page.evaluate(() => window.__goto("room"));
      return page.evaluate(() => window.__roomCode());
    },
    async join(code){
      const r = await page.evaluate(async c => {
        try { return { code: await window.__joinRoom(c) }; } catch(e){ return { err: String(e && e.message || e) }; }
      }, code);
      if (r.code) await page.evaluate(() => window.__goto("room"));
      return r;
    },
    roomSeats: () => page.evaluate(() =>
      [...document.querySelectorAll("#room .seat")].map(s => ((s.querySelector(".seat__n") || {}).textContent || "").trim())),
    startBtn: () => page.evaluate(() => {
      const b = document.querySelector("#room #action .btn-primary");
      return b ? { text: b.textContent.trim(), disabled: b.disabled } : null;
    }),
    pressStart: () => page.evaluate(() => {
      const b = document.querySelector("#room #action .btn-primary");
      const could = Boolean(b && !b.disabled);
      if (b) b.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return could;
    }),
    seated: () => page.evaluate(() => (window.__opts && window.__opts.seated) || 0),
  };
  return h;
}

export async function waitFor(fn, ms = 60000, step = 300){
  const end = Date.now() + ms;
  while (Date.now() < end){
    try { if (await fn()) return true; } catch(e){}
    await nap(step);
  }
  return false;
}

export async function closeAll(env, srv){
  try { const pr = env.browser.process(); if (pr) pr.kill("SIGKILL"); } catch(e){}
  try { env.web.closeAllConnections && env.web.closeAllConnections(); env.web.close(); env.web.unref(); } catch(e){}
  if (srv) srv.kill();
}
