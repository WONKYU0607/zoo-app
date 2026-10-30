/* **임시 이름(새사용자N) 그대로인 구글 계정은 별명을 다시 정하게 한다** (2026-10-26 — mustname.test 짝)

   예전에는 별명 창을 닫거나 미리 채워진 "새사용자3" 을 그대로 정하면 needName 이 꺼진 채 그 이름으로 남았다.
   계정 코드(account.js)가
     1. 구글로 처음 들어오면 임시 이름 + 정해야 함(needName)
     2. 문서에는 needName 이 꺼져 있어도 이름이 임시 이름이면 다시 켜면 정해야 함으로 본다(이미 그렇게 남은 사람들)
     3. 제대로 정하면 꺼지고, 다시 켜도 안 묻는다
     4. 게스트는 묻지 않는다
   로그인은 진짜 Firebase Auth 에뮬레이터, 저장소는 가짜(acctread.test 와 같은 틀).

   쓰는 법:  node test/mustname-acct.test.mjs */
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
const OUT = join(HERE, "_bundle_mustnameacct.mjs");
writeFileSync(join(HERE, "_entry_mustnameacct.js"),
  'export * as A from "../src/lib/account.js";\n' +
  'export { auth } from "./_fake_fb.js";\n' +
  'export { STORE, LOG } from "./_fake_firestore.js";\n');
await (esbuild.default || esbuild).build({
  entryPoints: [join(HERE, "_entry_mustnameacct.js")], bundle: true, format: "esm", platform: "node",
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

const restart = async () => { Object.assign(A.account, { signedIn: false, loaded: false, name: "", needName: false }); await A.watchAuth(); };

console.log("\n[1. 구글로 처음]");
globalThis.__pick = { sub: "g-must", email: "must@test.com" };
await A.signInGoogle();
check("임시 이름이 붙는다", /^새사용자\d*$/.test(A.account.name), A.account.name);
check("**정해야 함(needName)**", A.account.needName === true);

console.log("\n[2. 예전에 임시 이름 그대로 정해 버린 사람]");
const uid = A.account.uid;
STORE.set("users/" + uid, Object.assign({}, STORE.get("users/" + uid), { needName: false }));   /* 예전 앱이 꺼 버린 상태 */
await restart();
check("(준비) 다시 켜서 로그인됨", A.account.signedIn && /^새사용자/.test(A.account.name), A.account.name);
check("**문서에는 꺼져 있어도 이름이 임시 이름이면 다시 정하게 한다**", A.account.needName === true);

console.log("\n[3. 제대로 정함]");
const r = await A.setNickname("깃발장군");
check("(준비) 정했다", r && r.ok, JSON.stringify(r));
check("정하면 꺼진다", A.account.needName === false);
await restart();
check("**다시 켜도 안 묻는다**", A.account.signedIn && A.account.name === "깃발장군" && A.account.needName === false, A.account.name);
const r2 = await A.setNickname("새사용자7");
check("임시 이름 모양으로는 못 바꾼다", r2 && r2.ok === false && r2.why === "official", JSON.stringify(r2));

console.log("\n[4. 게스트]");
await A.signOutNow();
await A.signInGuest();
check("게스트는 묻지 않는다", A.account.guest && A.account.needName === false, A.account.name);

console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
stop();
process.exit(fail ? 1 : 0);
