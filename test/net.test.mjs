/* 서버 대전: 방 만들기 → 다른 사람 참가 → 시작 → 판이 서는가.
   진짜 서버가 필요하다. 검사가 알아서 띄우고 내린다.
   쓰는 법: node test/net.test.mjs */
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SERVER_DIR = process.env.ZOO_SERVER_DIR || join(ROOT, "..", "zoo-server");
const PORT = 8123;
const HOST = "http://127.0.0.1:" + PORT;

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

if (!existsSync(join(SERVER_DIR, "server.js"))){
  console.log("\n게임 서버 폴더를 못 찾았습니다: " + SERVER_DIR);
  console.log("ZOO_SERVER_DIR 로 알려주거나 zoo-app 옆에 zoo-server 를 두세요. 건너뜁니다.\n");
  process.exit(0);
}

console.log("\n=== 서버 대전 검사 ===  " + HOST + "\n");
const srv = spawn(process.execPath, ["server.js"], {
  cwd: SERVER_DIR, env: Object.assign({}, process.env,
    { PORT: String(PORT), ZOO_BOT_MS: "150", ZOO_AWAY_MS: "4000" }),
  stdio: "ignore",
});
const bye = () => { try { srv.kill(); } catch(e){} };
process.on("exit", bye);

await wait(3500);

/* 앱 코드를 그대로 묶어서 쓴다 */
execFileSync(process.execPath, [
  join(ROOT, "node_modules/esbuild/bin/esbuild"),
  /* 브라우저용으로 묶으면 socket.io 가 window/XHR 을 찾는다.
     여기서는 같은 소스를 node 판으로 묶어 접속만 확인한다 */
  join(HERE, "_entry_net.js"), "--bundle", "--format=esm", "--platform=node",
  "--packages=external",
  "--outfile=" + join(HERE, "_bundle_net.mjs"), "--log-level=warning",
], { cwd: ROOT, stdio: "inherit" });

globalThis.__ZOO_SERVER = HOST;

/* 아주 얇은 창 흉내 */
const listeners = {};
global.window = {
  __opts: { cap: 4, rounds: 3, tax: true, clear2: false },
  addEventListener: (k, f) => { (listeners[k] = listeners[k] || []).push(f); },
  removeEventListener: () => {},
  dispatchEvent: e => { (listeners[e.type] || []).forEach(f => f(e)); return true; },
  document: { getElementById: () => null, querySelector: () => null },
  alert: () => {},
  /* socket.io 브라우저판이 window 를 전역처럼 쓴다 */
  setTimeout: (...a) => setTimeout(...a),
  clearTimeout: (...a) => clearTimeout(...a),
  setInterval: (...a) => setInterval(...a),
  clearInterval: (...a) => clearInterval(...a),
  fetch: (...a) => fetch(...a),
  WebSocket: globalThis.WebSocket,
  location: { href: HOST, protocol: "http:", host: "127.0.0.1:" + PORT, hostname: "127.0.0.1", port: String(PORT) },
  navigator: { userAgent: "node" },
};
global.Event = class { constructor(t){ this.type = t; } };
global.document = window.document;

const B = await import("./_bundle_net.mjs");
check("서버 주소가 잡혔다", B.lobby.online(), B.lobby.serverUrl());

let went = [];
B.flow.install({ goto: id => went.push(id), myName: () => "나", botJoinMs: 99999 });

/* 1. 방 만들기 */
const code = await window.__createRoom();
check("방 번호를 받았다", /^[0-9]{4}$/.test(String(code)), String(code));
check("방 대기실 값이 섰다", Boolean(window.__room) && window.__room.cap === 4,
      JSON.stringify(window.__room && window.__room.seats.map(s => s && s.name)));

/* 2. 다른 사람이 번호로 참가 (서버에 직접) */
const j = await fetch(HOST + `/zoo/rooms/${code}/join`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "친구" }),
}).then(r => r.json());
check("다른 사람이 들어왔다", j.playerID === "1", "자리 " + j.playerID);

for (let i = 0; i < 40 && (window.__opts.seated || 0) < 2; i++) await wait(200);
check("방 대기실에 그 사람이 보인다", window.__opts.seated === 2,
      JSON.stringify(window.__room.seats.map(s => s && s.name)));

/* 3. 시작 — 빈자리는 서버가 봇으로 채운다 */
await window.__startRound();
for (let i = 0; i < 60 && !went.includes("draw"); i++) await wait(200);
check("판으로 넘어갔다", went.includes("draw"), went.join(" → "));

let v = B.eng.engine.view;
if (!v){
  const st = B.eng.engine.client && B.eng.engine.client.getState();
  console.log("    (상태 확인) client 있음:", Boolean(B.eng.engine.client),
              "| getState:", st ? "옴" : "없음",
              "| mode:", B.eng.engine.mode, "| myID:", B.eng.engine.myID);
}
check("내 손패가 내려왔다", Boolean(v) && v.hand.length > 0, v ? v.hand.length + "장" : "없음");
check("남의 손패는 안 내려온다", Boolean(v) && v.seats.slice(1).every(s => s.hold === null));
check("네 자리가 다 찼다", Boolean(v) && v.seats.every(s => s.c > 0),
      v ? v.seats.map(s => s.c).join(",") : "");

const seen = await fetch(HOST + `/zoo/rooms/${code}`).then(r => r.json());
check("빈자리가 봇으로 찼다", seen.players.filter(p => p.bot).length === 2,
      seen.players.map(p => p.name + (p.bot ? "(봇)" : "")).join(" "));

/* 4. 내가 손을 놓으면 서버가 대신 두고, 판이 안 멈춘다 */
const before = v ? v.seats.map(s => s.c).join(",") : "";
await wait(12000);
const v2 = B.eng.engine.view;
check("손을 놓아도 판이 굴러간다", Boolean(v2) && v2.seats.map(s => s.c).join(",") !== before,
      before + " → " + (v2 ? v2.seats.map(s => s.c).join(",") : "?"));

B.flow.teardown();
bye();
console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
