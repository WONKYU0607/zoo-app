/* 세금 — 내가 고른 카드가 **그대로** 나가는가.

   예전에는 고른 자리 번호만 기억해서, 그 사이 손패가 다시 정렬되면
   엉뚱한 카드가 나갔다(12 를 골랐는데 카멜레온이 가던 문제).
   이제 고를 때의 **카드 값**을 적어 두고 그걸 보낸다.

   세금 화면은 밖에서 상태를 넣을 길이 없어서 __taxProbe 로 세운다.
   진짜 브라우저가 필요하다(크롬이 없으면 건너뛴다). */
import { serve, open, shut, ensureBuild, findBrowser } from "./shot.mjs";
if (!(await findBrowser())){
  console.log("\n크롬을 못 찾아 세금 검사를 건너뜁니다.\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
ensureBuild();
const srv = await serve(5699);
const { browser, page, logs } = await open({ srv });
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem("zk_lang","ko"); } catch(e){}
  /* 어떤 소리가 언제 났는지 적어 둔다 — 소리 시점을 보는 검사에 쓴다 */
  window.__snd = [];
  HTMLMediaElement.prototype.play = function(){
    const m = (this.currentSrc || this.src || "").match(/snd\/([a-z_]+)\.webm/);
    if (m) window.__snd.push(m[1]);
    return Promise.resolve();
  };
});
await page.reload({ waitUntil: "networkidle0" });
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++;
  console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };

/* 판을 세운다. 13·14 가 카멜레온 */
const setup = async order => page.evaluate(o => {
  const G = (window.GAME = window.GAME || {});
  G.N = 4;
  G.names = ["나","서연","준호","민지"]; G.namesEn = G.names;
  G.avatars = [0,1,2,3];
  G.finish = o.slice();
  G.hold = [[3,5,7,9,12,13], [2,4,6,8,10,11], [2,3,4,5,6,7], [8,9,10,11,12,14]];
  G.roundNo = 2;
  window.__opts = { cap: 4, seated: 4, rounds: 3, tax: true, clear2: false };
  window.__myGive = null;
}, order);

/* ---- 1등(2장 주기) ---- */
await setup([0,1,2,3]);
await page.evaluate(() => window.__goto("tax"));
await new Promise(r=>setTimeout(r,400));
let st = await page.evaluate(() => window.__taxProbe.toGive([0,1,2,3]));
check("1등이면 2장을 준다", st.rank === 0 && st.give === 2, JSON.stringify(st));
check("손패가 내가 세운 그대로다",
  JSON.stringify(await page.evaluate(() => window.__taxProbe.hand())) === JSON.stringify([3,5,7,9,12,13]),
  JSON.stringify(await page.evaluate(() => window.__taxProbe.hand())));

let picked = await page.evaluate(() => window.__taxProbe.pick([12, 9]));
check("12 와 9 를 골랐다", JSON.stringify(picked) === JSON.stringify([12,9]), JSON.stringify(picked));

/* 고른 뒤 손패를 거꾸로 정렬한다 — 예전에 엉뚱한 카드가 나가던 상황 */
await page.evaluate(() => { window.GAME.hold[0] = window.GAME.hold[0].slice().sort((a,b)=>b-a); });
let gave = await page.evaluate(() => window.__taxProbe.submit());
check("손패가 뒤집혀도 고른 그대로 나간다", JSON.stringify(gave) === JSON.stringify([12,9]), JSON.stringify(gave));
check("카멜레온(13)이 안 끼어들었다", !gave.some(c => c >= 13), JSON.stringify(gave));

/* ---- 카멜레온을 일부러 고르면 그것도 그대로 나가야 한다 ---- */
await setup([0,1,2,3]);
await page.evaluate(() => window.__goto("tax"));
await new Promise(r=>setTimeout(r,300));
await page.evaluate(() => window.__taxProbe.toGive([0,1,2,3]));
picked = await page.evaluate(() => window.__taxProbe.pick([13, 3]));
await page.evaluate(() => { window.GAME.hold[0] = window.GAME.hold[0].slice().sort((a,b)=>b-a); });
gave = await page.evaluate(() => window.__taxProbe.submit());
check("카멜레온을 골랐으면 카멜레온이 나간다",
  JSON.stringify(gave) === JSON.stringify([13,3]), JSON.stringify(gave) + " vs " + JSON.stringify(picked));

/* ---- 2등(1장 주기) ---- */
await setup([1,0,2,3]);
await page.evaluate(() => window.__goto("tax"));
await new Promise(r=>setTimeout(r,300));
st = await page.evaluate(() => window.__taxProbe.toGive([1,0,2,3]));
check("2등이면 1장을 준다", st.rank === 1 && st.give === 1, JSON.stringify(st));
picked = await page.evaluate(() => window.__taxProbe.pick([12, 9]));
check("한 장만 골린다", picked.length === 1 && picked[0] === 12, JSON.stringify(picked));
await page.evaluate(() => { window.GAME.hold[0] = window.GAME.hold[0].slice().sort((a,b)=>b-a); });
gave = await page.evaluate(() => window.__taxProbe.submit());
check("2등도 고른 그대로 나간다", JSON.stringify(gave) === JSON.stringify([12]), JSON.stringify(gave));

/* ---- 3등(안 주는 자리) ---- */
await setup([1,2,0,3]);
await page.evaluate(() => window.__goto("tax"));
await new Promise(r=>setTimeout(r,300));
st = await page.evaluate(() => window.__taxProbe.toGive([1,2,0,3]));
check("3등은 안 준다", st.give === 0, JSON.stringify(st));
picked = await page.evaluate(() => window.__taxProbe.pick([12]));
check("안 주는 자리는 안 골린다", picked.length === 0, JSON.stringify(picked));

/* ---- 등수 발표 단계에서는 손패가 안 보여야 한다 ----
   엔진은 판이 끝나는 즉시 다음 판을 나눠 놓는다. 감추지 않으면
   **나누지도 않았는데 받을 패가 미리 보인다** */
await setup([0,1,2,3]);
await page.evaluate(() => window.__goto("tax"));
await new Promise(r=>setTimeout(r,400));
await page.evaluate(() => window.__bootTax && window.__bootTax());
await new Promise(r=>setTimeout(r,300));
{
  const st0 = await page.evaluate(() => window.__taxProbe.step());
  const shown = await page.evaluate(() =>
    document.querySelectorAll("#tax .hand .slot, #tax .hand > *").length);
  check("등수 발표 단계에서는 손패가 안 보인다", st0 !== 1 ? shown === 0 : true,
        "단계 " + st0 + " · 보이는 칸 " + shown);
}

/* ---- 혁명 소리는 **선언하는 그 순간** 나야 한다 ----
   판 화면에서 내면, 선언할 때는 그 화면이 안 보여 소리가 삼켜지고
   판이 시작될 때 뒤늦게 울린다. 실제로 그런 신고를 받았다 */
await setup([0,1,2,3]);
await page.evaluate(() => window.__goto("tax"));
await new Promise(r=>setTimeout(r,300));
{
  await page.evaluate(() => { window.__snd = []; });
  const st2 = await page.evaluate(() => window.__taxProbe.toRev(0));
  await new Promise(r=>setTimeout(r,200));
  const before = await page.evaluate(() => window.__snd.slice());
  await page.evaluate(() => { const b = document.querySelector("#tax #next"); if (b) b.click(); });
  await new Promise(r=>setTimeout(r,400));
  const after = await page.evaluate(() => window.__snd.slice());
  check("혁명 선언 전에는 혁명 소리가 안 난다", !before.includes("revolution"),
        JSON.stringify(before));
  check("혁명을 선언하면 그 자리에서 소리가 난다", after.includes("revolution"),
        "단계 " + st2.step + " · 울린 것 " + JSON.stringify(after));
}

check("터진 것 없음", logs.filter(l => /^ERROR/.test(l)).length === 0,
  JSON.stringify(logs.filter(l => /^ERROR/.test(l)).slice(0,2)));
console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
