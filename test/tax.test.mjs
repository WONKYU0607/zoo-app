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

/* ---- 혁명은 **엔진이 정한 대로** 보여야 한다 (2026-09-30) ----
   예전에는 혁명 단계 시간이 다 되면 "다음" 을 눌러 넘겼는데 그 단추가 곧 "혁명 선언" 이라
   쥔 사람은 안 부르고 넘긴 직후 선언까지 보냈고(엔진은 거부), 남들 화면에는
   쥔 사람이 고르기도 전에 "선언했습니다. 세금은 없습니다" 가 떴다 */
await setup([0,1,2,3]);
await page.evaluate(() => { window.__net = { engine: true }; window.__goto("tax"); });
await new Promise(r=>setTimeout(r,300));
await page.evaluate(() => window.__bootTax && window.__bootTax());
const midText = () => page.evaluate(() => (document.querySelector("#tax #mid") || {}).textContent || "");
{
  /* 남(서연)이 쥐고 아직 고르는 중 */
  await page.evaluate(() => { window.__snd = []; window.__revolution = { seat: 1, great: false, mine: false, decided: false, declared: false }; });
  await page.evaluate(() => window.__taxProbe.toRev(1));
  await new Promise(r=>setTimeout(r,500));
  let m = await midText();
  check("남이 쥐고 고르는 중이면 '고르는 중' 이라고 보인다", /고르는 중/.test(m) && !/선언했습니다/.test(m), m);
  check("그동안 혁명 소리가 안 난다", !(await page.evaluate(() => window.__snd.includes("revolution"))));
  /* 안 부르기로 정했다 */
  await page.evaluate(() => { window.__revolution.decided = true; });
  await new Promise(r=>setTimeout(r,500));
  m = await midText();
  check("안 부르면 '선언하지 않았습니다' 로 바뀐다", /선언하지 않았습니다/.test(m), m);
  check("안 불렀으니 혁명 소리가 안 난다", !(await page.evaluate(() => window.__snd.includes("revolution"))));
}
{
  /* 남이 선언했다 */
  await page.evaluate(() => { window.__snd = []; window.__revolution = { seat: 1, great: false, mine: false, decided: false, declared: false }; });
  await page.evaluate(() => window.__taxProbe.toRev(1));
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(() => { window.__revolution.decided = true; window.__revolution.declared = true; });
  await new Promise(r=>setTimeout(r,500));
  const m = await midText();
  check("남이 선언하면 그때 선언으로 보이고 소리가 난다",
    /혁명\. 이번 판 세금은 없습니다/.test(m) && (await page.evaluate(() => window.__snd.includes("revolution"))), m);
}
{
  /* 내가 쥐고 시간이 다 됐다 — 안 부름만 보내고 선언은 안 보낸다 */
  await page.evaluate(() => {
    window.__snd = []; window.__sent = [];
    window.__declareRev = () => window.__sent.push("declare");
    /* 세금까지 저절로 넘어가면 판으로 가려 한다 — 여기엔 판이 없으니 막는다(다음 확인의 세금 화면을 치운다) */
    window.__toTable = () => {};
    window.__passRev = () => { window.__sent.push("pass"); window.__revolution.decided = true; };
    window.__revolution = { seat: 0, great: false, mine: true, decided: false, declared: false };
    window.__taxWaitMs = 400;
  });
  await page.evaluate(() => window.__taxProbe.toRev(0));
  await new Promise(r=>setTimeout(r,1200));
  const sent = await page.evaluate(() => window.__sent.slice());
  check("시간이 다 되면 '안 부름' 만 보낸다 (선언은 안 보낸다)",
    sent.includes("pass") && !sent.includes("declare"), JSON.stringify(sent));
  check("안 불렀으니 혁명 소리가 안 난다 (내 화면)", !(await page.evaluate(() => window.__snd.includes("revolution"))));
  check("다음 단계로 넘어갔다", (await page.evaluate(() => window.__taxProbe.step())) >= 3,
    "단계 " + (await page.evaluate(() => window.__taxProbe.step())));
  await page.evaluate(() => { window.__taxWaitMs = 0; window.__net = null; });
}

/* ---- 2장 낼 차례에 1장만 고르고 시간이 다 되면 (2026-09-30) ----
   예전에는 화면의 고른 자리만 채우고 **보내는 값은 1장 그대로**라 엔진이 거부했다.
   그 뒤로는 "이미 냈다" 로 쳐져 아무도 안 내서 판이 멈췄다(사람 4명 판에서 재현) */
await setup([0,1,2,3]);
/* 앞 확인의 세금 화면 시계가 아직 걸려 있으면 이 화면을 대신 넘겨 버린다 — 먼저 새로 세워 걷어낸다 */
await page.evaluate(() => { window.__net = { engine: true }; if (window.__bootTax) window.__bootTax(); window.__goto("tax"); });
await new Promise(r=>setTimeout(r,300));
await page.evaluate(() => window.__bootTax && window.__bootTax());
{
  await page.evaluate(() => {
    window.__sent = [];
    window.__taxGive = null;
    window.__setTaxGive = c => window.__sent.push(c.slice());
    /* 세금이 끝나면 화면이 판으로 넘어간다. 여기선 판이 없으니 넘어가지 않게 막는다 —
       안 막으면 늦게 걸린 넘어가기가 다음 확인의 세금 화면을 치운다 */
    window.__toTable = () => {};
    window.__passRev = () => { window.__revolution.decided = true; };
    window.__revolution = { seat: 0, great: false, mine: true, decided: false, declared: false };
    window.__taxWaitMs = 400;
    /* 고르는 단계가 되자마자 한 장만 고른다 */
    window.__one = setInterval(() => {
      const p = window.__taxProbe;
      if (p.step() === 3 && !p.sel().length){ p.pick([5]); clearInterval(window.__one); }
    }, 10);
  });
  await page.evaluate(() => window.__taxProbe.toRev(0));
  await new Promise(r=>setTimeout(r,2000));
  const sent = await page.evaluate(() => window.__sent.slice());
  const last = sent[sent.length - 1] || [];
  check("1장만 고르고 시간이 다 되면 2장을 채워 보낸다", last.length === 2, JSON.stringify(sent));
  check("내가 고른 1장은 그대로 들어간다", last.includes(5), JSON.stringify(last));
  const hand = [3,5,7,9,12,13], left = hand.slice();
  check("보낸 카드가 모두 내 손에 있는 서로 다른 카드다",
    last.every(c => { const k = left.indexOf(c); if (k < 0) return false; left.splice(k, 1); return true; }),
    JSON.stringify(last));
  /* 채우는 것은 카멜레온을 빼고 큰 숫자부터 (2026-09-30 결정) */
  check("모자란 1장은 카멜레온이 아니라 가장 큰 숫자(12)로 채운다", JSON.stringify(last) === "[5,12]", JSON.stringify(last));
  await page.evaluate(() => { clearInterval(window.__one); window.__taxWaitMs = 0; window.__net = null; });
}
/* ---- 하나도 안 고르고 시간이 다 되면 — 카멜레온은 빼고 큰 숫자부터 ---- */
await setup([0,1,2,3]);
/* 앞 확인의 세금 화면 시계가 아직 걸려 있으면 이 화면을 대신 넘겨 버린다 — 먼저 새로 세워 걷어낸다 */
await page.evaluate(() => { window.__net = { engine: true }; if (window.__bootTax) window.__bootTax(); window.__goto("tax"); });
await new Promise(r=>setTimeout(r,300));
await page.evaluate(() => window.__bootTax && window.__bootTax());
{
  await page.evaluate(() => {
    window.__sent = [];
    window.__taxGive = null;
    window.__setTaxGive = c => window.__sent.push(c.slice());
    /* 세금이 끝나면 화면이 판으로 넘어간다. 여기선 판이 없으니 넘어가지 않게 막는다 —
       안 막으면 늦게 걸린 넘어가기가 다음 확인의 세금 화면을 치운다 */
    window.__toTable = () => {};
    window.__passRev = () => { window.__revolution.decided = true; };
    window.__revolution = { seat: 0, great: false, mine: true, decided: false, declared: false };
    window.__taxWaitMs = 400;
  });
  await page.evaluate(() => window.__taxProbe.toRev(0));
  await new Promise(r=>setTimeout(r,2000));
  const sent = await page.evaluate(() => window.__sent.slice());
  const last = sent[sent.length - 1] || [];
  check("안 고르고 시간이 다 되면 카멜레온을 빼고 큰 숫자 2장(12·9)이 나간다",
    JSON.stringify(last.slice().sort((a, b) => b - a)) === "[12,9]", JSON.stringify(sent));
  await page.evaluate(() => { window.__taxWaitMs = 0; window.__net = null; });
}
/* 같은 숫자 두 장을 고르면 서로 다른 두 장이 골라진다 (검사 손잡이) */
await setup([0,1,2,3]);
await page.evaluate(() => { window.GAME.hold[0] = [3,3,7,9,12,13]; window.__goto("tax"); });
await new Promise(r=>setTimeout(r,300));
await page.evaluate(() => window.__taxProbe.toGive([0,1,2,3]));
picked = await page.evaluate(() => window.__taxProbe.pick([3, 3]));
check("같은 숫자 두 장도 두 장으로 골라진다", JSON.stringify(picked) === "[3,3]", JSON.stringify(picked));

check("터진 것 없음", logs.filter(l => /^ERROR/.test(l)).length === 0,
  JSON.stringify(logs.filter(l => /^ERROR/.test(l)).slice(0,2)));
console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
shut(srv, browser);
process.exit(fail ? 1 : 0);
