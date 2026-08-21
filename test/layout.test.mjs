/* 진짜 브라우저로 배치를 잰다.

   여태 놓친 것들이 전부 이 자리에 있었다 — 가짜 브라우저는 배치를 계산하지 않아
   "자리가 화면 어디에 그려지는가", "단추가 다른 것에 덮여 있는가" 를 볼 수 없었다.
   그래서 CSS 선택자 하나가 통째로 안 걸리는 사고를 검사가 다 통과시켰다.

   여기서는 dist 를 띄우고 실제 좌표와 '그 점을 누르면 누가 받는가'를 본다. */

import { serve, open, toTable, boxes, hit } from "./shot.mjs";

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + name + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + name + (note ? "  " + note : "")); }
};

const srv = await serve(5601);
const { browser, page, logs } = await open({ port: 5601 });
await toTable(page, { numPlayers: 4 });

const vh = 745;

/* ---------- 자리 ---------- */
const seats = await boxes(page, "#table .seat");
check("자리가 인원수만큼 그려졌다", seats.length === 4, String(seats.length));

const mid = s => (s.l + s.r) / 2;
const cy = s => (s.t + s.b) / 2;
const me = seats.find(s => s.txt.includes("나")) || seats[0];
const others = seats.filter(s => s !== me);

check("내 자리가 화면 아래쪽에 있다", me && cy(me) > vh * 0.55,
      me ? "중심 y=" + Math.round(cy(me)) + " / 화면 " + vh : "없음");
check("내 자리가 가운데 세로선 위에 있다", me && Math.abs(mid(me) - 206) < 40,
      me ? "중심 x=" + Math.round(mid(me)) : "없음");
check("남의 자리가 내 자리보다 위에 있다",
      others.every(s => cy(s) < cy(me)),
      JSON.stringify(others.map(s => s.txt + ":" + Math.round(cy(s)))));
check("자리끼리 겹치지 않는다",
      seats.every((a, i) => seats.every((b, j) =>
        i === j || a.r < b.l || b.r < a.l || a.b < b.t || b.b < a.t)),
      JSON.stringify(seats.map(s => s.txt)));

/* ---------- 눌러야 하는 것이 정말 눌리는가 ---------- */
for (const [sel, nm] of [["#table #auto","자동"], ["#table #emo","이모티콘"],
                         ["#table #pass","패스"], ["#table #play","카드내기"]]){
  const who = await hit(page, sel);
  check(nm + " 단추가 안 덮여 있다", who === "자기자신", who);
}

/* 자동 단추가 실제로 켜지는가 — 진짜로 눌러 본다 */
await page.click("#table #auto");
const on = await page.evaluate(() =>
  document.querySelector("#table #auto").getAttribute("aria-pressed"));
check("자동 단추를 누르면 켜진다", on === "true", String(on));
await page.click("#table #auto");

/* ---------- 아래 단추 셋이 나란한가 ---------- */
const acts = await boxes(page, "#table .acts button");
check("아래 단추가 셋이다", acts.length === 3, String(acts.length));
check("셋의 높이가 같다",
      acts.length === 3 && new Set(acts.map(a => a.b - a.t)).size === 1,
      JSON.stringify(acts.map(a => a.b - a.t)));
check("단추 글자가 상자 밖으로 안 나간다",
      await page.evaluate(() => [...document.querySelectorAll("#table .acts button")]
        .every(b => b.scrollWidth <= b.clientWidth + 1 && b.scrollHeight <= b.clientHeight + 1)));

/* ---------- 안내 줄과 자동 단추가 한 줄인가 ---------- */
const nd = (await boxes(page, "#table .need"))[0];
const ab = (await boxes(page, "#table #auto"))[0];
check("자동 단추와 안내 줄이 같은 줄에 있다",
      nd && ab && Math.abs(cy(nd) - cy(ab)) < 12,
      nd && ab ? Math.round(cy(nd)) + " vs " + Math.round(cy(ab)) : "없음");
check("자동 단추가 안내 줄 왼쪽에 있다", nd && ab && ab.r <= nd.l);

/* ---------- 감정표현 판이 화면을 밀지 않는가 ---------- */
const before = (await boxes(page, "#table .hand"))[0];
await page.click("#table #emo");
await new Promise(r => setTimeout(r, 250));
const picks = await boxes(page, "#table .emopick button");
check("감정표현 다섯 개가 올라온다", picks.length === 5, String(picks.length));
const after = (await boxes(page, "#table .hand"))[0];
check("감정표현을 열어도 손패가 안 밀린다",
      before && after && Math.abs(before.t - after.t) < 2,
      before && after ? before.t + " → " + after.t : "없음");
check("감정표현 판이 화면 안에 있다",
      picks.every(p => p.t >= 0 && p.b <= vh),
      JSON.stringify(picks.map(p => p.t + ".." + p.b)));
check("말풍선 글자가 안 잘린다",
      await page.evaluate(() => [...document.querySelectorAll("#table .emopick .emobub")]
        .every(b => b.scrollWidth <= b.clientWidth + 1)),
      JSON.stringify(picks.map(p => p.txt)));

const bad = logs.filter(l => /^ERROR/.test(l));
check("화면에서 터진 것이 없다", bad.length === 0, JSON.stringify(bad.slice(0, 3)));

await page.screenshot({ path: "/tmp/layout.png" });
await browser.close();
srv.close();
console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
