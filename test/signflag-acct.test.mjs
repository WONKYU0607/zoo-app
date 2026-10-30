/* **로그인 기록(zk_in) 을 계정 코드가 제때 적고 지우는가** (2026-10-26 — signflag.test 짝)

   첫 화면은 기기에 적힌 "로그인했었다 + 별명" 을 보고 앱을 켜자마자 게임 시작을 그린다.
   그러려면 계정 코드(account.js)가
     1. 로그인에 성공하면(게스트·구글) 적는다 · 별명을 바꾸면 따라 고친다
     2. 로그아웃하면 지운다
     3. 앱을 다시 켜서 로그인이 살아 있으면 그대로 둔다
     4. 앱을 다시 켰는데 로그인이 풀려 있으면 지운다 (적힌 채로 두면 다음에도 잘못 그린다)
   로그인은 진짜 Firebase Auth 에뮬레이터, 저장소는 가짜(acctread.test 와 같은 틀).

   쓰는 법:  node test/signflag-acct.test.mjs */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Auth 에뮬레이터 ---------- */
const PORT = 9300 + Math.floor(Math.random() * 500);
globalThis.__authPort = PORT;
const dir = mkdtempSync(join(tmpdir(), "zoo-auth-"));
writeFileSync(join(dir, "firebase.json"), JSON.stringify({
  emulators: { auth: { port: PORT, host: "127.0.0.1" }, ui: { enabled: false }, singleProjectMode: true },
}));
const emu = spawn(process.execPath, [
  join(ROOT, "node_modules/firebase-tools/lib/bin/firebase.js"),
  "emulators:start", "--only", "auth", "--project", "demo-zoo",
], { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
let emuLog = "";
emu.stdout.on("data", d => { emuLog += d; });
emu.stderr.on("data", d => { emuLog += d; });
const stop = () => { try { emu.kill(); } catch(e){} try { rmSync(dir, { recursive: true, force: true }); } catch(e){} };
process.on("exit", stop);
let up = false;
for (let i = 0; i < 120 && !up; i++){
  try { const r = await fetch("http://127.0.0.1:" + PORT + "/"); up = r.ok; } catch(e){ await wait(500); }
}
if (!up){ console.log("  [실패] Auth 에뮬레이터가 안 떴다\n" + emuLog.slice(-800)); stop(); process.exit(1); }

/* ---------- 묶기 ---------- */
const esbuild = await import(pathToFileURL(join(ROOT, "node_modules/esbuild/lib/main.js")).href);
const OUT = join(HERE, "_bundle_signflagacct.mjs");
writeFileSync(join(HERE, "_entry_signflagacct.js"),
  'export * as A from "../src/lib/account.js";\n' +
  'export { auth } from "./_fake_fb.js";\n' +
  'export { STORE, LOG } from "./_fake_firestore.js";\n');
await (esbuild.default || esbuild).build({
  entryPoints: [join(HERE, "_entry_signflagacct.js")], bundle: true, format: "esm", platform: "node",
  outfile: OUT, logLevel: "warning",
  define: { "import.meta.env": "globalThis.__ENV__" },
  plugins: [{
    name: "fakes",
    setup(b){
      b.onResolve({ filter: /^\.\/firebase\.js$/ }, a =>
        a.importer.replace(/\\/g, "/").includes("/src/lib/") ? { path: join(HERE, "_fake_fb.js") } : null);
      b.onResolve({ filter: /^firebase\/firestore$/ }, () => ({ path: join(HERE, "_fake_firestore.js") }));
      b.onResolve({ filter: /^@capacitor-firebase\/authentication$/ }, () => ({ path: join(HERE, "_fake_capfb.js") }));
    },
  }],
});
globalThis.__ENV__ = {};
const win = new EventTarget();
win.Capacitor = { isNativePlatform: () => true };
globalThis.window = win;
const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null),
  setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
globalThis.localStorage = mem(); globalThis.sessionStorage = mem();

const B = await import(pathToFileURL(OUT).href);
const { A, STORE, LOG } = B;

const flag = () => { const v = localStorage.getItem("zk_in"); return v ? JSON.parse(v) : null; };

console.log("\n[1. 게스트로 들어오면 적는다]");
await A.signInGuest();
check("게스트로 들어왔다", A.account.signedIn && A.account.guest, A.account.name);
check("**로그인 기록이 적혔다 — 별명 그대로**", flag() && flag().name === A.account.name, JSON.stringify(flag()));
check("기록에는 별명만 (계정 번호 등은 안 적음)", flag() && Object.keys(flag()).join(",") === "name", JSON.stringify(flag()));
const nk = await A.setNickname("깃발왕");
check("(준비) 별명을 바꿨다", nk && nk.ok, JSON.stringify(nk));
check("**별명을 바꾸면 기록도 따라 바뀐다**", flag() && flag().name === "깃발왕", JSON.stringify(flag()));

console.log("\n[2. 로그아웃하면 지운다]");
await A.signOutNow();
check("**로그아웃하면 기록이 지워진다**", flag() === null, JSON.stringify(flag()));

console.log("\n[3. 구글 — 다시 켰는데 로그인이 살아 있음]");
globalThis.__pick = { sub: "g-flag", email: "flag@test.com" };
await A.signInGoogle();
await A.setNickname("구글깃발");
check("(준비) 구글로 들어왔다", A.account.signedIn && !A.account.guest, A.account.name);
check("구글도 기록이 적혔다", flag() && flag().name === "구글깃발", JSON.stringify(flag()));
/* 앱을 다시 켠 것처럼 — 화면 쪽 값은 비우고 로그인 확인부터 다시 */
Object.assign(A.account, { signedIn: false, loaded: false, name: "" });
await A.watchAuth();
check("다시 켠 뒤 확인이 끝나면 로그인돼 있다", A.account.signedIn && A.account.name === "구글깃발", A.account.name);
check("**로그인이 살아 있으면 기록은 그대로**", flag() && flag().name === "구글깃발", JSON.stringify(flag()));

console.log("\n[4. 다시 켰는데 로그인이 풀려 있음]");
await A.signOutNow();
localStorage.setItem("zk_in", JSON.stringify({ name: "옛기록" }));   /* 지난번 기록이 남아 있다 */
Object.assign(A.account, { signedIn: false, loaded: false });
await A.watchAuth();
check("(준비) 확인이 끝났고 로그인 안 됨", A.account.loaded && !A.account.signedIn);
check("**로그인이 풀려 있으면 기록을 지운다** — 다음에 켜면 로그인 화면부터", flag() === null, JSON.stringify(flag()));

console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
stop();
process.exit(fail ? 1 : 0);
