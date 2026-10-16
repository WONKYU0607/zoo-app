/* 초대 지켜보기 · 접속 판정 · 별명 거르기 — 속을 본다 (2026-10-10)

   저장소는 가짜(test/_fake_firestore.js — 지켜보기는 쓰기·지우기마다 모음 전체를 다시 준다).
   화면에서 실제로 뜨는지는 final1010.test.mjs 가 본다.
   쓰는 법:  node test/invname.test.mjs */
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

const esbuild = await import(pathToFileURL(join(ROOT, "node_modules/esbuild/lib/main.js")).href);
const OUT = join(HERE, "_bundle_invname.mjs");
await (esbuild.default || esbuild).build({
  entryPoints: [join(HERE, "_entry_invname.js")], bundle: true, format: "esm", platform: "node",
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
globalThis.window = win;
const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null),
  setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
globalThis.localStorage = mem(); globalThis.sessionStorage = mem();
const { FR, checkName, badName, STORE, BOT_KO, BOT_EN } = await import(pathToFileURL(OUT).href);

/* ---------- 초대 지켜보기 ---------- */
console.log("\n[초대 지켜보기]");
const me = { uid: "me", name: "나" };
FR.initFriends({ fake: true }, me);
const now = Date.now();
STORE.set("inv/me/list/a", { name: "에이", code: "1111", at: now - 1000 });
STORE.set("inv/me/list/old", { name: "옛날", code: "2222", at: now - 3 * 60 * 1000 });
STORE.set("inv/other/list/a", { name: "남의것", code: "3333", at: now });
const got = [];
const stop = FR.watchInvites(rows => got.push(rows.map(r => r.uid + ":" + r.code)));
await wait(30);
check("처음에 내 초대함을 한 번 준다(남의 초대함은 안 준다)", JSON.stringify(got[0]) === '["a:1111"]', JSON.stringify(got));
check("2분 지난 초대는 빼고, 지운다", !STORE.has("inv/me/list/old"));
const before = got.length;
/* 친구가 보낸 초대 — 친구 쪽에서 적는 것을 흉내 */
const friend = { uid: "f", name: "친구" };
FR.initFriends({ fake: true }, friend);
await FR.invite("me", "4444");
await wait(30);
const last = got[got.length - 1];
check("새 초대가 오면 바로 알려 준다(다시 읽으러 가지 않아도)", got.length > before && last.includes("f:4444") && last.includes("a:1111"), JSON.stringify(last));
check("새 것이 앞에 온다", last[0] === "f:4444", JSON.stringify(last));
FR.initFriends({ fake: true }, me);
await FR.dropInvite("f");
await wait(30);
check("받거나 지우면 목록에서 빠진다", !got[got.length - 1].includes("f:4444"), JSON.stringify(got[got.length - 1]));
stop();
const n = got.length;
FR.initFriends({ fake: true }, friend);
await FR.invite("me", "5555");
await wait(30);
check("그만 보면 더는 안 알려 준다", got.length === n);
FR.initFriends({ fake: true }, { uid: null });
const s2 = FR.watchInvites(() => {});
check("로그인 전에는 지켜보지 않는다(그냥 빈 함수)", typeof s2 === "function");
check("살아 있는 초대 판정 — 2분", FR.inviteFresh({ at: Date.now() - 119000 }) && !FR.inviteFresh({ at: Date.now() - 121000 }));

/* ---------- 접속 판정 ---------- */
console.log("\n[접속 판정]");
const t = Date.now();
check("3분마다 적으니 6분 전 소식도 접속 중", FR.isOnline({ at: t - 6 * 60 * 1000, state: "lobby" }));
check("7분 넘게 소식이 없으면 접속 아님", !FR.isOnline({ at: t - 7 * 60 * 1000 - 1000, state: "lobby" }));
check("판 중도 접속 중", FR.isOnline({ at: t - 1000, state: "game" }));
check("앱을 내렸으면(off) 방금이라도 접속 아님", !FR.isOnline({ at: t - 1000, state: "off" }));
check("기록이 없으면 접속 아님", !FR.isOnline(null) && !FR.isOnline({}));

/* ---------- 별명 거르기 ---------- */
console.log("\n[별명 거르기]");
const BAD = ["씨발", "시1발", "씨8", "18놈", "병a신", "병신", "개새끼", "ㅅㅂ", "ㅅ발", "시ㅂ", "ㅅ1ㅂ", "ㅂㅅ", "ㅄ", "ㅈㄴ", "ㅁㅊ", "ㅗㅗ",
  "존나", "지랄", "느금", "니애미", "보지", "자지", "섹스", "야동", "자위", "강간", "변태", "몸캠",
  "fuck", "FUCK", "fvck", "fuuuck", "f1u2c3k", "sh1t", "b1tch", "s3x", "sexy", "c0ck", "porn", "nigga", "dick",
  "tlqkf", "Tlqkf", "qudtls", "rotoRl", "ssibal"];
const OFF = ["운영자", "관리자1", "공식계정", "개발자", "admin", "Adm1n", "GM", "gm1", "게스트12", "guest7", "official"];
const GOOD = ["철수", "영희", "원규", "사자왕", "호랑이", "코끼리", "카멜레온", "부산", "부산ㅎㅎ", "ㅋㅋ사발", "사발면", "시바견",
  "미친듯이", "게임왕", "ㅎㅇ", "ㅇㅅㅇ", "ㄱㄱ", "gg", "peacock", "grape", "Essex", "sigma", "gmail", "shiba", "assassin",
  "classic", "therapy", "Wonkyu", "lion7", "zoo123"];
const miss = BAD.filter(x => badName(x) !== "bad");
check("욕설·성적인 말 " + BAD.length + "개를 다 잡는다", !miss.length, miss.join(", "));
const missO = OFF.filter(x => badName(x) !== "official");
check("운영자·게스트 흉내 " + OFF.length + "개를 다 잡는다", !missO.length, missO.join(", "));
const wrong = GOOD.filter(x => badName(x));
check("멀쩡한 이름 " + GOOD.length + "개는 안 막는다", !wrong.length, wrong.map(x => x + "=" + badName(x)).join(", "));
const bots = [...BOT_KO, ...BOT_EN].filter(x => badName(x));
check("봇 이름 " + (BOT_KO.length + BOT_EN.length) + "개도 하나도 안 걸린다(멀쩡한 이름 표본)", !bots.length, bots.join(", "));
/* 별명 정하기가 실제로 거르기를 거친다 */
check("별명 검사가 욕설을 막는다", JSON.stringify(checkName("시1발")) === '{"ok":false,"why":"bad"}', JSON.stringify(checkName("시1발")));
check("별명 검사가 운영자 흉내를 막는다", checkName("운영자").why === "official");
check("별명 검사 — 멀쩡한 이름은 통과", checkName("사자왕").ok === true);
check("예전 검사(띄어쓰기·글자·길이)는 그대로", checkName("a b").why === "space" && checkName("a!").why === "char" && checkName("가나다라마바사").why === "long");

console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
