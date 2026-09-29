/* 계정 삭제 검사.

   로그인은 **진짜 Firebase Auth 에뮬레이터**(firebase-tools, 자바 필요 없음)로 한다 —
   구글 본인 확인(reauthenticate), 다른 계정을 고른 경우(user-mismatch),
   로그인 계정 삭제가 실제로 되는지를 파이어베이스가 직접 판정한다.

   저장소는 가짜(test/_fake_firestore.js)다. **보안 규칙은 여기서 재지 않는다.**
   여기서 보는 것:
     - 내 흔적이 전부 지워지는가(친구 양쪽, 받은·보낸 신청, 받은·보낸 초대, 접속 상태, 이름 전부, 사용자 문서)
     - 남의 것은 안 건드리는가
     - 중간에 막히면 로그인 계정을 **안** 지우고 멈추는가, 다시 누르면 끝까지 가는가
     - 다른 구글 계정을 고르면 아무것도 안 지우는가 */
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
if (!up){
  console.log("  [실패] Auth 에뮬레이터가 안 떴다\n" + emuLog.slice(-800));
  stop(); process.exit(1);
}

async function authHas(uid){
  const r = await fetch("http://127.0.0.1:" + PORT +
    "/identitytoolkit.googleapis.com/v1/projects/demo-zoo/accounts:lookup", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({ localId: [uid] }),
  });
  const j = await r.json();
  return Boolean(j.users && j.users.length);
}

/* ---------- 묶기 ---------- */
/* 가짜로 바꿔 끼우려면 플러그인이 필요해서 명령줄이 아니라 esbuild 의 JS 함수로 묶는다 */
const esbuild = await import(pathToFileURL(join(ROOT, "node_modules/esbuild/lib/main.js")).href);
const OUT = join(HERE, "_bundle_delacct.mjs");
await (esbuild.default || esbuild).build({
  entryPoints: [join(HERE, "_entry_delacct.js")], bundle: true, format: "esm", platform: "node",
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

/* 브라우저 흉내 — account.js 가 부르는 것만 */
globalThis.__ENV__ = {};
const win = new EventTarget();
win.Capacitor = { isNativePlatform: () => true };   /* 앱 경로(안드로이드 구글 로그인)로 */
globalThis.window = win;
const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null),
  setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
globalThis.localStorage = mem(); globalThis.sessionStorage = mem();

const B = await import(pathToFileURL(OUT).href);
const { A, FR, STORE } = B;
FR.initFriends({ fake: true }, A.account);

const put = (p, v) => STORE.set(p, v);
const has = p => STORE.has(p);

/* 남의 것 — 삭제 뒤에도 그대로 있어야 한다 */
function seedOthers(){
  put("users/uB", { name: "비", score: 10 });
  put("users/uC", { name: "씨", score: 20 });
  put("names/비", { uid: "uB", name: "비" });
  put("friends/uB/list/uC", { name: "씨" });
  put("friends/uC/list/uB", { name: "비" });
  put("freq/uB/from/uC", { name: "씨" });
  put("inv/uC/list/uB", { name: "비", code: "1111" });
  put("pres/uB", { name: "비", state: "lobby" });
}
const OTHERS = ["users/uB", "users/uC", "names/비", "friends/uB/list/uC", "friends/uC/list/uB",
                "freq/uB/from/uC", "inv/uC/list/uB", "pres/uB"];

/* 나를 둘러싼 흔적을 앱 함수로 만든다(보낸 신청·초대는 sent 기록이 같이 남아야 한다) */
async function seedMine(me){
  put("friends/" + me + "/list/uB", { name: "비" });
  put("friends/uB/list/" + me, { name: A.account.name });
  put("freq/" + me + "/from/uC", { name: "씨" });              /* 받은 신청 */
  put("inv/" + me + "/list/uC", { name: "씨", code: "2222" });  /* 받은 초대 */
  put("names/옛이름", { uid: me, name: "옛이름" });              /* 놓아주지 못한 옛 이름 */
  await FR.setPresence("lobby");
  const r1 = await FR.sendRequest("uC", "씨");                   /* 보낸 신청 */
  const r2 = await FR.invite("uB", "3333");                      /* 보낸 초대 */
  return r1.ok && r2;
}
const mineLeft = me => [...STORE.keys()].filter(p =>
  p.includes(me) || (STORE.get(p) && STORE.get(p).uid === me));

/* ============ 1. 구글 계정 ============ */
console.log("\n[구글 계정]");
seedOthers();
globalThis.__pick = { sub: "g-a", email: "a@test.com" };
await A.signInGoogle();
const uA = A.account.uid;
check("구글로 들어옴", Boolean(uA) && !A.account.guest && await authHas(uA));
check("별명 정함", (await A.setNickname("원규")).ok);
check("흔적 심기", await seedMine(uA));
check("보낸 신청·초대가 sent 에 적힘", has("sent/" + uA + "/req/uC") && has("sent/" + uA + "/inv/uB"));
const beforeA = mineLeft(uA).length;

globalThis.__picked = 0; globalThis.__nativeOut = 0;
const rA = await A.deleteAccount();
check("본인 확인 창이 한 번 뜸", globalThis.__picked === 1, "picked=" + globalThis.__picked);
check("삭제 결과 ok, 로그인 계정 남지 않음", rA.ok && rA.authLeft === false);
check("Auth 에뮬레이터에서 계정이 사라짐", !(await authHas(uA)));
const leftA = mineLeft(uA);
check("내 흔적 0개 (전: " + beforeA + "개)", leftA.length === 0, leftA.join(", "));
check("상대 목록의 나(friends/uB/list/나)도 지움", !has("friends/uB/list/" + uA));
check("보낸 신청(freq/uC/from/나) 지움", !has("freq/uC/from/" + uA));
check("보낸 초대(inv/uB/list/나) 지움", !has("inv/uB/list/" + uA));
check("옛 이름까지 지움", !has("names/옛이름") && !has("names/원규"));
const lostO = OTHERS.filter(p => !has(p));
check("남의 것은 그대로", lostO.length === 0, lostO.join(", "));
check("로그아웃됨 (앱 상태·안드로이드 쪽 둘 다)",
  !A.account.signedIn && !A.account.uid && B.auth.currentUser === null && globalThis.__nativeOut >= 1);

/* ============ 2. 다른 구글 계정을 고른 경우 ============ */
console.log("\n[본인 확인에서 다른 계정]");
globalThis.__pick = { sub: "g-m", email: "m@test.com" };
await A.signInGoogle();
const uM = A.account.uid;
await seedMine(uM);
const beforeM = mineLeft(uM).length;
globalThis.__pick = { sub: "g-other", email: "other@test.com" };
let errM = null;
try { await A.deleteAccount(); } catch(e){ errM = e; }
check("auth/user-mismatch 로 거부", errM && errM.code === "auth/user-mismatch", errM && errM.code);
check("아무것도 안 지움", mineLeft(uM).length === beforeM, beforeM + " → " + mineLeft(uM).length);
check("로그인 계정 그대로", await authHas(uM) && A.account.uid === uM);

/* ============ 3. 본인 확인을 취소한 경우 ============ */
globalThis.__pick = null;
let errC = null;
try { await A.deleteAccount(); } catch(e){ errC = e; }
check("취소하면 멈춤 · 아무것도 안 지움", Boolean(errC) && mineLeft(uM).length === beforeM && await authHas(uM));

/* ============ 4. 중간에 막히면 멈추고, 다시 누르면 끝까지 ============ */
console.log("\n[중간에 막힘]");
globalThis.__pick = { sub: "g-m", email: "m@test.com" };
globalThis.__fsFail = (path, op) => op === "delete" && path === "friends/uB/list/" + uM;
let errF = null;
try { await A.deleteAccount(); } catch(e){ errF = e; }
check("막히면 던짐", errF && errF.code === "permission-denied", errF && errF.code);
check("로그인 계정은 안 지움", await authHas(uM));
check("사용자 문서도 안 지움 (다시 시도할 수 있게)", has("users/" + uM));
check("로그인 상태 유지", A.account.uid === uM && B.auth.currentUser && B.auth.currentUser.uid === uM);
globalThis.__fsFail = null;
const rM = await A.deleteAccount();
check("다시 누르면 끝까지", rM.ok && !rM.authLeft && !(await authHas(uM)) && mineLeft(uM).length === 0,
  mineLeft(uM).join(", "));

/* ============ 5. 게스트 ============ */
console.log("\n[게스트]");
await A.signInGuest();
const uG = A.account.uid;
check("게스트로 들어옴", Boolean(uG) && A.account.guest && await authHas(uG), A.account.name);
await seedMine(uG);
globalThis.__picked = 0;
const rG = await A.deleteAccount();
check("게스트는 본인 확인 창 없음", globalThis.__picked === 0);
check("게스트 삭제 결과", rG.ok && rG.guest === true, JSON.stringify(rG));
check("게스트 흔적 0개", mineLeft(uG).length === 0, mineLeft(uG).join(", "));
check("게스트 로그인 계정도 사라짐 (에뮬레이터 기준)", !(await authHas(uG)));
const lostO2 = OTHERS.filter(p => !has(p));
check("끝까지 남의 것은 그대로", lostO2.length === 0, lostO2.join(", "));

/* ============ 6. 게스트 번호 · 별명 바꾸기 ============
   게스트 번호는 들어온 순서대로. 별명을 바꾸면 옛 이름이 풀려야 한다
   (예전에는 uid: null 로 덮으려다 규칙에 막혀 영영 묶여 있었다) */
console.log("\n[게스트 번호 · 별명 바꾸기]");
const numOf = n => Number(String(n).replace(/^게스트/, ""));
await A.signInGuest();
const g1 = A.account.name;
await A.deleteAccount();
await A.signInGuest();
const g2 = A.account.name, uR = A.account.uid;
check("게스트 번호가 순서대로", /^게스트\d+$/.test(g1) && numOf(g2) === numOf(g1) + 1, g1 + " → " + g2);

check("별명 바꾸기", (await A.setNickname("새이름")).ok);
check("옛 이름(게스트 번호)이 풀림", !has("names/" + g2.toLowerCase()), "names/" + g2);
check("새 이름은 내 것", STORE.get("names/새이름") && STORE.get("names/새이름").uid === uR);

put("names/빈이름", { uid: null, name: "빈이름" });    /* 예전 방식으로 놓아준 이름 */
check("주인 없는 이름은 잡을 수 있음", (await A.setNickname("빈이름")).ok);
check("잡은 뒤 내 것", STORE.get("names/빈이름").uid === uR);
check("그 전 이름도 풀림", !has("names/새이름"));

const taken = await A.setNickname("비");
check("남의 이름은 못 잡음", !taken.ok && taken.why === "taken" && STORE.get("names/비").uid === "uB");

const cn = await A.changeName("또이름");
check("changeName 도 옛 이름을 풀어 줌", cn === "또이름" && !has("names/빈이름") && STORE.get("names/또이름").uid === uR);
await A.deleteAccount();
check("정리", mineLeft(uR).length === 0, mineLeft(uR).join(", "));

stop();
console.log("\n계정 삭제: " + pass + "/" + fail);
process.exit(fail ? 1 : 0);
