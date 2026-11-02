/* **친구 부르기 창 — 줄마다 "초대" 단추** (2026-11-01)

   사용자 신고: "방파서 초대하기하는데 친구 목록 옆에 초대하기 버튼이 없고 걍 친구 목록을 눌러야되던데".
   예전에는 줄 전체가 단추라 부르는 방법이 안 보였고, 한 명 부르면 창이 바로 닫혔다.

   진짜 크롬에서
     - 접속 중(로비) 친구만 "초대" 단추가 눌린다. 게임 중·오프라인은 흐린 단추
     - 단추가 줄 오른쪽 안에 보이고, 그 자리를 누르면 단추가 받는다(덮인 것 없음). 긴 이름이어도
     - 누르면 그 친구에게 지금 방 번호로 한 번만 보내고, 단추가 "보냄" 으로 잠긴다. 창은 그대로(여러 명 부르기)
     - 보내기에 실패하면 단추가 다시 풀리고 이유가 뜬다
     - 창을 다시 열면 단추가 처음으로 돌아온다
     - 그냥 친구 창(부르기 아님)에는 초대 단추가 없다

   쓰는 법:  node test/invitebtn.test.mjs   */

import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";

if (!(await findBrowser())){ console.log("\n크롬이 없어 건너뜁니다\n"); process.exit(0); }

let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

ensureBuild();
const srv = await serve(5793);
const { browser, page } = await open({ srv });
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
});
await page.reload({ waitUntil: "networkidle0" });
/* 친구 자료의 유일한 통로 window.__friends — 앱(main.js)이 켜지며 진짜 것을 꽂으므로 **켜진 뒤에** 갈아 끼운다 */
await page.evaluate(() => {
  window.__sent = [];
  window.__failNext = false;
  window.__friends = {
    listFriends: async () => [
      { uid: "a", name: "조프로", online: true, state: "lobby" },
      { uid: "b", name: "상아동", online: true, state: "lobby" },
      { uid: "c", name: "가나다라마바", online: true, state: "lobby" },   /* 긴 이름(한글 6자) */
      { uid: "d", name: "게임중친구", online: true, state: "game" },
      { uid: "e", name: "자는친구", online: false, state: "lobby" },
    ],
    incoming: async () => [],
    friendRank: async () => [],
    invite: async (uid, code) => {
      if (window.__failNext){ window.__failNext = false; return false; }
      window.__sent.push(uid + ":" + code); return true;
    },
    removeFriend: async () => true,
  };
});

const openInvite = async () => {
  await page.evaluate(() => { window.__room = Object.assign({}, window.__room || {}, { code: "4821" }); window.__openFriends("invite"); });
  await wait(700);
};
const rows = () => page.evaluate(() => [...document.querySelectorAll("#frBody .fr__row")].map(r => {
  const b = r.querySelector(".fr__inv");
  const rr = r.getBoundingClientRect();
  let hit = null, inside = false, fits = false;
  if (b){
    const br = b.getBoundingClientRect();
    const el = document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
    hit = el === b || b.contains(el);
    inside = br.left >= rr.left && br.right <= rr.right && br.top >= rr.top && br.bottom <= rr.bottom && br.width > 20;
    fits = b.scrollWidth <= b.clientWidth + 1;
  }
  return { name: r.querySelector(".fr__n").textContent, btn: b ? b.textContent : null, dis: b ? b.disabled : null, hit, inside, fits };
}));

await openInvite();
let R = await rows();
console.log("  " + R.map(r => r.name + "[" + r.btn + (r.dis ? "·잠김" : "") + "]").join(" "));
check("줄마다 초대 단추가 있다", R.length === 5 && R.every(r => r.btn === "초대"), R.map(r => r.btn).join(","));
check("**접속 중(로비) 친구만 눌린다**", R.slice(0, 3).every(r => r.dis === false) && R.slice(3).every(r => r.dis === true));
check("단추가 줄 안 오른쪽에 보인다(긴 이름 포함)", R.every(r => r.inside), R.filter(r => !r.inside).map(r => r.name).join(","));
check("**단추 자리를 누르면 단추가 받는다**(덮인 것 없음)", R.slice(0, 3).every(r => r.hit), R.filter(r => !r.hit).map(r => r.name).join(","));
check("단추 글자가 안 넘친다", R.every(r => r.fits));

/* 보내기 */
const clickBtn = i => page.evaluate(i => { const b = document.querySelectorAll("#frBody .fr__inv")[i]; b.click(); }, i);
await clickBtn(0); await wait(300);
let sent = await page.evaluate(() => window.__sent.slice());
R = await rows();
const open1 = await page.evaluate(() => document.getElementById("frBox").classList.contains("on"));
check("**누르면 그 친구에게 지금 방 번호로 보낸다**", sent.length === 1 && sent[0] === "a:4821", sent.join(","));
check("**단추가 '보냄' 으로 잠긴다**", R[0].btn === "보냄" && R[0].dis === true, R[0].btn);
check("**창은 그대로 열려 있다(여러 명 부르기)**", open1);
await clickBtn(0); await wait(300);
sent = await page.evaluate(() => window.__sent.slice());
check("보낸 단추를 또 눌러도 다시 안 보낸다", sent.length === 1, sent.join(","));
await clickBtn(1); await wait(300);
sent = await page.evaluate(() => window.__sent.slice());
check("다른 친구도 이어서 부를 수 있다", sent.length === 2 && sent[1] === "b:4821", sent.join(","));
const note = await page.evaluate(() => (document.getElementById("frNote") || {}).textContent || "");
check("'불렀습니다' 안내", note.includes("불렀습니다"), note);

/* 실패 */
await page.evaluate(() => { window.__failNext = true; });
await clickBtn(2); await wait(300);
R = await rows();
const note2 = await page.evaluate(() => (document.getElementById("frNote") || {}).textContent || "");
check("**보내기에 실패하면 단추가 다시 풀린다**", R[2].btn === "초대" && R[2].dis === false, R[2].btn + (R[2].dis ? " 잠김" : ""));
check("실패 이유가 뜬다", note2.includes("못 불렀습니다"), note2);

/* 화면 확인용 */
await page.screenshot({ path: (process.env.SHOT_DIR || ".") + "/invitebtn.png" }).catch(() => {});

/* 다시 열기 */
await page.evaluate(() => document.getElementById("frBox").classList.remove("on"));
await openInvite();
R = await rows();
check("창을 다시 열면 단추가 처음으로 돌아온다", R.slice(0, 3).every(r => r.btn === "초대" && r.dis === false), R.map(r => r.btn).join(","));

/* 그냥 친구 창 */
await page.evaluate(() => { document.getElementById("frBox").classList.remove("on"); window.__openFriends(); });
await wait(700);
const plain = await page.evaluate(() => ({
  inv: document.querySelectorAll("#frBody .fr__inv").length,
  del: document.querySelectorAll("#frBody [data-frdel]").length,
}));
check("그냥 친구 창에는 초대 단추가 없고 삭제 단추는 그대로", plain.inv === 0 && plain.del === 5, JSON.stringify(plain));

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
