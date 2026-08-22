/* 프로필 얼굴 — 고르기, 잠금, 그리고 그 얼굴이 실제 판에 나오는가.

   얼굴 15개. 앞 다섯은 처음부터, 그 뒤는 5,000점마다 하나씩.
   봇은 처음 열린 다섯 중에서 고른다.

   진짜 브라우저가 필요하다(크롬이 없으면 건너뛴다). */
import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
if (!(await findBrowser())){
  console.log("\n크롬을 못 찾아 얼굴 검사를 건너뜁니다.\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
ensureBuild();
const srv = await serve(5646);
const { browser, page, logs } = await open({ srv });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("zk_lang","ko"); } catch(e){} });
await page.reload({ waitUntil: "networkidle0" });
let pass=0, fail=0;
const check=(n,ok,note)=>{ok?pass++:fail++;console.log((ok?"  [OK]   ":"  [실패] ")+n+(note?"  "+note:""));};

/* 계정 창 열기 */
await page.evaluate(() => window.__goto("lobby"));
await new Promise(r=>setTimeout(r,400));
await page.evaluate(() => {
  window.ACCOUNT = Object.assign(window.ACCOUNT || {}, { signedIn: true, guest: true, name: "나", score: 12000, avatar: 0 });
  if (window.__openAcct) window.__openAcct();
});
await new Promise(r=>setTimeout(r,500));
const g = await page.evaluate(() => {
  const w = document.getElementById("acAvt");
  if (!w) return null;
  const bs = [...w.querySelectorAll("[data-avt]")];
  return { n: bs.length,
    locked: bs.filter(b => b.className.includes("lock")).map(b => b.dataset.avt),
    on: bs.filter(b => b.className.includes("--on")).map(b => b.dataset.avt) };
});
check("얼굴 15개가 보인다", g && g.n === 15, g ? String(g.n) : "창 없음");
check("12,000점이면 앞 7개가 열린다", g && g.locked[0] === "7",
  g ? "잠긴 첫 번째 " + g.locked[0] : "-");
check("지금 고른 것이 표시된다", g && g.on.length === 1 && g.on[0] === "0", JSON.stringify(g && g.on));

/* 잠긴 것을 누르면 점수 안내 */
await page.evaluate(() => document.querySelector('[data-avt="9"]').click());
await new Promise(r=>setTimeout(r,250));
check("잠긴 것을 누르면 필요한 점수를 알려 준다",
  /25,000점/.test(await page.evaluate(() => document.getElementById("acAvtN").textContent)),
  await page.evaluate(() => document.getElementById("acAvtN").textContent));

/* 열린 것을 고른다 */
await page.evaluate(() => { window.__setAvatar = async i => { window.ACCOUNT.avatar = i; }; });
await page.evaluate(() => document.querySelector('[data-avt="6"]').click());
await new Promise(r=>setTimeout(r,250));
check("열린 것을 고르면 바뀐다",
  await page.evaluate(() => document.querySelector('[data-avt="6"]').className.includes("--on")));

/* 판 화면에서 그 얼굴이 나오는가 */
await page.evaluate(async () => {
  window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true, clear2: false };
  await window.__createRoom();
});
for (let i=0;i<60;i++){ if (await page.evaluate(()=>(window.__opts&&window.__opts.seated)||0)>=4) break;
  await new Promise(r=>setTimeout(r,300)); }
await page.evaluate(async () => { await window.__startRound(); });
for (let i=0;i<60;i++){ if (await page.evaluate(()=>window.__eng?.view?.phase)==="play") break;
  await new Promise(r=>setTimeout(r,200)); }
await page.evaluate(() => { const b=document.querySelector("#draw #go"); if(b) b.click(); });
for (let i=0;i<40;i++){ if (await page.evaluate(()=>(document.querySelector(".page.is-on")||{}).id)==="table") break;
  await new Promise(r=>setTimeout(r,200)); }
const seats = await page.evaluate(() => ({
  avatars: window.GAME && window.GAME.avatars,
  faces: [...document.querySelectorAll("#table #seats .seat__av")].map(e => {
    const m = (e.style.backgroundImage||"").match(/avt_(\d+)/g); return m ? m.join(",") : "?"; }),
}));
check("판에 새 얼굴이 쓰인다", seats.faces.every(f => /avt_/.test(f)), JSON.stringify(seats.faces));
check("내 자리에 내가 고른 얼굴", /avt_07/.test(seats.faces[0]),
  seats.faces[0] + " · GAME.avatars " + JSON.stringify(seats.avatars));
check("봇은 처음 열린 다섯 중에서",
  (seats.avatars || []).slice(1).every(v => v >= 0 && v < 5), JSON.stringify(seats.avatars));
/* 방 대기실 — 게임 전이라 GAME.avatars 가 없다.
   방에 앉은 사람이 들고 있는 얼굴을 봐야 한다. 이걸 안 봐서 전부 생쥐였다 */
await page.evaluate(() => window.__goto("lobby"));
await new Promise(r=>setTimeout(r,300));
await page.evaluate(async () => {
  window.ACCOUNT = Object.assign(window.ACCOUNT||{}, { score: 50000, avatar: 12 });
  window.__opts = { cap: 6, seated: 1, rounds: 3, tax: true, clear2: false };
  await window.__createRoom();
});
for (let i=0;i<60;i++){ if (await page.evaluate(()=>(window.__opts&&window.__opts.seated)||0)>=6) break;
  await new Promise(r=>setTimeout(r,300)); }
await page.evaluate(() => window.__goto("room"));
await new Promise(r=>setTimeout(r,500));
const room = await page.evaluate(() =>
  [...document.querySelectorAll("#room .seat__av")].map(e =>
    ((e.style.backgroundImage||"").match(/avt_\d+/)||["?"])[0]));
check("대기실에 내가 고른 얼굴이 나온다", room[0] === "avt_13", JSON.stringify(room));
check("대기실 봇 얼굴이 다 같지는 않다", new Set(room.slice(1)).size > 1, JSON.stringify(room));
check("대기실 봇은 처음 열린 다섯 중에서",
  room.slice(1).every(f => ["avt_01","avt_02","avt_03","avt_04","avt_05"].includes(f)),
  JSON.stringify(room));

check("터진 것 없음", logs.filter(l=>/^ERROR/.test(l)).length===0,
  JSON.stringify(logs.filter(l=>/^ERROR/.test(l)).slice(0,2)));
console.log("\n=== 통과 "+pass+" / 실패 "+fail+" ===\n");
shut(srv, browser);
process.exit(fail?1:0);
