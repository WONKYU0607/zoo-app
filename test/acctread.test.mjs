/* 계정 — **앱은 점수·티켓을 적지 않는다**(2026-09-30).

   점수·판 수·티켓은 이제 게임 서버가 적는다. 앱이 적던 곳이 하나라도 남아 있으면
   새 보안 규칙에 막혀 **그 자리에서 오류**가 난다(예: 로그인할 때 지난 시간만큼 티켓을 채워
   적던 것 — 그게 막히면 로그인 자체가 실패한다). 그래서 여기서는
   - 새 규칙(firestore.rules 의 users)을 **자바스크립트로 그대로 옮겨** 가짜 저장소에 걸고
   - 로그인·새 계정·별명·얼굴·구글 잇기·게임 끝·광고 보상 기다리기를 앱 함수로 돌려서
   - 규칙에 막히는 쓰기가 **한 번도 없고**, 점수·티켓 칸은 **한 번도 안 적는지** 본다.
   진짜 규칙 엔진이 아니다(에뮬레이터를 받을 수 없다). 앱이 무엇을 적는지를 보는 검사다.

   로그인은 진짜 Firebase Auth 에뮬레이터. 쓰는 법:  node test/acctread.test.mjs */
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
const OUT = join(HERE, "_bundle_acctread.mjs");
writeFileSync(join(HERE, "_entry_acctread.js"),
  'export * as A from "../src/lib/account.js";\n' +
  'export { auth } from "./_fake_fb.js";\n' +
  'export { STORE, LOG } from "./_fake_firestore.js";\n');
await (esbuild.default || esbuild).build({
  entryPoints: [join(HERE, "_entry_acctread.js")], bundle: true, format: "esm", platform: "node",
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

/* ---------- 새 규칙(users) 을 그대로 옮긴 것 ----------
   firestore.rules 의 users 를 바꾸면 여기도 같이 바꾼다 */
const isGoogle = () => Boolean(B.auth.currentUser && B.auth.currentUser.providerData.some(p => p.providerId === "google.com"));
const ownsName = n => typeof n === "string" && n.length > 0 && n.length <= 20 &&
  (STORE.get("names/" + n.toLowerCase()) || {}).uid === (B.auth.currentUser && B.auth.currentUser.uid);
const avatarOk = (a, score) => Number.isInteger(a) && a >= 0 && a <= 14 && (a < 5 || score >= (a - 4) * 5000);
const denials = [];
globalThis.__fsFail = (path, op, data, prev) => {
  const m = /^users\/([^/]+)$/.exec(path);
  if (!m) return false;
  const me = B.auth.currentUser && B.auth.currentUser.uid;
  const deny = why => { denials.push(op + " " + path + " — " + why + " " + JSON.stringify(data)); return true; };
  if (op === "delete") return m[1] === me ? false : deny("남의 문서");
  if (m[1] !== me) return deny("남의 문서");
  if (op === "create" || (op === "set" && !prev)){
    const ok = ["name", "score", "games", "tickets", "ticketAt", "createdAt", "guest", "needName", "avatar"];
    const bad = Object.keys(data).filter(k => !ok.includes(k));
    if (bad.length) return deny("만들 때 안 되는 칸 " + bad);
    if (data.score !== 0 || data.games !== 0 || data.tickets !== 3 || data.avatar !== 0) return deny("처음 값");
    if (typeof data.ticketAt !== "number" || typeof data.needName !== "boolean") return deny("모양");
    if (data.guest !== !isGoogle()) return deny("게스트 표시");
    if (!ownsName(data.name)) return deny("안 잡은 이름");
    return false;
  }
  /* update / set(merge 없이 덮기) — 바뀐 칸만 본다 */
  const next = Object.assign({}, prev || {}, data);
  const changed = Object.keys(next).filter(k => JSON.stringify(next[k]) !== JSON.stringify((prev || {})[k]));
  const allowed = ["name", "avatar", "needName", "guest"];
  const bad = changed.filter(k => !allowed.includes(k));
  if (bad.length) return deny("앱이 못 고치는 칸 " + bad);
  if (changed.includes("name") && !ownsName(next.name)) return deny("안 잡은 이름");
  if (changed.includes("avatar") && !avatarOk(next.avatar, (prev || {}).score || 0)) return deny("잠긴 얼굴");
  if (changed.includes("needName") && typeof next.needName !== "boolean") return deny("모양");
  if (changed.includes("guest") && next.guest !== !isGoogle()) return deny("게스트 표시");
  return false;
};
const userWrites = uid => LOG.filter(([op, p]) => p === "users/" + uid && op !== "delete");
const SERVER_ONLY = ["score", "games", "tickets", "ticketAt", "wk", "mo", "wkKey", "moKey", "aw", "adTx", "lastPlayed"];

/* ============ 1. 게스트 새 계정 ============ */
console.log("\n[게스트 새 계정]");
await A.signInGuest();
const uG = A.account.uid;
check("게스트로 들어왔다", Boolean(uG) && A.account.guest, A.account.name);
check("새 계정 문서가 규칙대로 만들어졌다 (점수 0 · 티켓 3)", STORE.get("users/" + uG) && STORE.get("users/" + uG).tickets === 3 &&
  STORE.get("users/" + uG).score === 0, JSON.stringify(STORE.get("users/" + uG)));
check("규칙에 막힌 쓰기가 없다", denials.length === 0, denials.join(" | "));

/* ============ 2. 다시 들어올 때 티켓을 채워 적지 않는다 ============ */
console.log("\n[다시 들어오기 — 티켓은 화면에만 채운다]");
/* 같은 계정으로 다시 들어오려면 구글이어야 한다(게스트는 로그아웃하면 새 계정) */
await A.signOutNow();
globalThis.__pick = { sub: "g-back", email: "b@test.com" };
await A.signInGoogle();
const uG3 = A.account.uid;
await A.setNickname("돌아옴");
const t45 = Date.now() - 45 * 60000;
STORE.set("users/" + uG3, Object.assign({}, STORE.get("users/" + uG3), { tickets: 0, ticketAt: t45, score: 7000, games: 3 }));
await A.signOutNow();
denials.length = 0; LOG.length = 0;
await A.signInGoogle();                              /* 같은 구글 계정 — 있는 문서를 읽는다 */
check("같은 계정으로 다시 들어왔다", A.account.uid === uG3 && A.account.score === 7000);
check("45분 지난 0장 → 화면에는 1장", A.account.tickets === 1, String(A.account.tickets));
check("문서에는 적지 않는다 (예전에는 여기서 적었다 — 새 규칙이면 로그인이 통째로 실패)",
  userWrites(uG3).length === 0 && denials.length === 0, JSON.stringify(userWrites(uG3)) + " " + denials.join(" | "));
check("시작해도 되는가 = 된다 (1장)", A.hasTicket() === true);
STORE.set("users/" + uG3, Object.assign({}, STORE.get("users/" + uG3), { tickets: 0, ticketAt: Date.now() - 5 * 60000 }));
await A.refreshAccount();
check("0장이면 시작 전에 막는다", A.hasTicket() === false && A.account.tickets === 0);

/* ============ 3. 게임이 끝나도 앱은 점수를 안 적는다 ============ */
console.log("\n[게임 끝 — 점수는 서버가]");
LOG.length = 0;
const g = await A.finishGame(0, 4, 300, false);
check("받을 점수를 계산해 돌려준다 (300)", g === 300);
const gq = await A.finishGame(0, 4, 301, true);
check("도중에 나가면 절반 (301 → 150)", gq === 150);
check("점수·판 수를 적지 않는다", userWrites(uG3).length === 0, JSON.stringify(userWrites(uG3)));
/* 서버가 적었다고 치고 다시 읽는다 */
STORE.set("users/" + uG3, Object.assign({}, STORE.get("users/" + uG3), { score: 7300, games: 4, wk: 300, wkKey: A.periodKeys().wk }));
await A.refreshAccount();
check("서버가 적은 점수를 읽어 화면에 반영한다", A.account.score === 7300 && A.account.games === 4 && A.account.tier === 1,
  A.account.score + " · 티어 " + A.account.tier);
await wait(1700);                                   /* finishGame 이 걸어 둔 다시 읽기(1.5초) */
check("다시 읽기가 오류 없이 돈다", A.account.score === 7300);

/* ============ 4. 광고 보상 기다리기 ============ */
console.log("\n[광고 보상 — 서버가 준 것을 기다린다]");
STORE.set("users/" + uG3, Object.assign({}, STORE.get("users/" + uG3), { tickets: 1, ticketAt: Date.now() - 60000 }));
await A.refreshAccount();
LOG.length = 0;
setTimeout(() => {                                   /* 2초 뒤 서버가 한 장 준다 */
  STORE.set("users/" + uG3, Object.assign({}, STORE.get("users/" + uG3), { tickets: 2 }));
}, 2000);
const t0 = Date.now();
const got = await A.waitReward(1, 8000);
const tookMs = Date.now() - t0;
check("서버가 준 티켓이 들어오면 알아챈다", got === true && A.account.tickets === 2, tookMs + "ms · " + A.account.tickets);
check("적히고 0.6초 안에 화면에 오른다 (0.5초마다 확인 — 예전 1.5초)", tookMs < 2600, tookMs + "ms (서버가 2초에 적음)");
const nog = await A.waitReward(2, 3200);
check("안 들어오면 시간 안에 포기한다 (화면이 안내를 띄운다)", nog === false);
check("기다리는 동안 티켓을 적지 않는다", userWrites(uG3).length === 0, JSON.stringify(userWrites(uG3)));

/* ============ 5. 얼굴·별명 (앱이 적어도 되는 것) ============ */
console.log("\n[얼굴·별명]");
denials.length = 0;
check("열린 얼굴은 바꾼다", (await A.setAvatar(3)).ok && STORE.get("users/" + uG3).avatar === 3);
STORE.set("users/" + uG3, Object.assign({}, STORE.get("users/" + uG3), { score: 7300 }));
A.account.score = 7300;
check("점수로 열린 얼굴(5번, 5,000점)도 바꾼다", (await A.setAvatar(5)).ok && STORE.get("users/" + uG3).avatar === 5);
check("잠긴 얼굴(6번, 10,000점)은 앱이 먼저 막는다", (await A.setAvatar(6)).ok === false && STORE.get("users/" + uG3).avatar === 5);
check("규칙에 막힌 쓰기가 없다", denials.length === 0, denials.join(" | "));

/* ============ 6. 구글 새 계정 · 별명 · 게스트에서 잇기 ============ */
console.log("\n[구글]");
await A.signOutNow();
denials.length = 0;
globalThis.__pick = { sub: "g-read", email: "r@test.com" };
await A.signInGoogle();
const uR = A.account.uid;
check("구글 새 계정이 규칙대로 만들어졌다", Boolean(STORE.get("users/" + uR)) && STORE.get("users/" + uR).guest === false &&
  STORE.get("users/" + uR).needName === true, JSON.stringify(STORE.get("users/" + uR)));
check("별명을 정한다", (await A.setNickname("읽기왕")).ok && STORE.get("users/" + uR).name === "읽기왕");
check("규칙에 막힌 쓰기가 없다", denials.length === 0, denials.join(" | "));
await A.signOutNow();
await A.signInGuest();
const uL = A.account.uid;
denials.length = 0;
globalThis.__pick = { sub: "g-link", email: "l@test.com" };
const lk = await A.linkGoogle();
check("게스트를 구글에 잇는다", lk && lk.linked === true, JSON.stringify(lk));
check("게스트 표시를 끈다 (구글이 이어진 뒤라 규칙이 받아 준다)", STORE.get("users/" + uL).guest === false, denials.join(" | "));
check("규칙에 막힌 쓰기가 없다", denials.length === 0, denials.join(" | "));

/* ============ 7. 규칙 흉내가 제대로 막는가 (검사의 검사) ============ */
console.log("\n[규칙 흉내가 막는 것]");
const { updateDoc, doc } = await import(pathToFileURL(join(HERE, "_fake_firestore.js")).href);
let e1 = null; try { await updateDoc(doc({ fake: true }, "users", uL), { score: 999999 }); } catch(e){ e1 = e; }
check("앱이 점수를 고치면 막힌다", e1 && e1.code === "permission-denied");
let e2 = null; try { await updateDoc(doc({ fake: true }, "users", uL), { tickets: 99 }); } catch(e){ e2 = e; }
check("앱이 티켓을 고치면 막힌다", e2 && e2.code === "permission-denied");
let e2b = null; try { await updateDoc(doc({ fake: true }, "users", uL), { ticketAt: 1 }); } catch(e){ e2b = e; }
check("티켓 시각을 되돌려 채우기를 당기면 막힌다", e2b && e2b.code === "permission-denied");
let e3 = null; try { await updateDoc(doc({ fake: true }, "users", uL), { avatar: 14 }); } catch(e){ e3 = e; }
check("잠긴 얼굴을 직접 적으면 막힌다", e3 && e3.code === "permission-denied");
let e4 = null; try { await updateDoc(doc({ fake: true }, "users", uL), { name: "남의이름" }); } catch(e){ e4 = e; }
check("잡지 않은 이름으로 바꾸면 막힌다", e4 && e4.code === "permission-denied");

/* 앱 코드 안에 점수·티켓을 적는 곳이 남아 있지 않은가 — 글자로 한 번 더 */
const { readFileSync } = await import("node:fs");
const src = readFileSync(join(ROOT, "src/lib/account.js"), "utf8");
const writes = [...src.matchAll(/(updateDoc|setDoc)\(([^;]*)/g)].map(m => m[0]);
const leak = writes.filter(w => SERVER_ONLY.some(k => new RegExp("\\b" + k + "\\s*:").test(w)) && !/fresh/.test(w));
check("account.js 에 점수·티켓을 적는 쓰기가 없다 (새 계정 만들기만 예외)", leak.length === 0, leak.join(" | "));

console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
stop();
process.exit(fail ? 1 : 0);
