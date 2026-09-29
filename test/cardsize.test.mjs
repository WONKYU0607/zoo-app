/* 카드 크기와 손패 글씨 크기.

   1) **규칙 화면의 카멜레온 카드가 낱장 카드와 같은 크기인가.**
      2026-09-29 신고: "규칙에 카멜레온 카드 크기만 작음."
      실측(폰 폭 412px)으로 확인한 원인: `.jk` 폭이 `6칸 기준 × 1.17` 로 못박혀 있었다.
        한글(6칸) 카멜레온 53px · 낱장 45.3px → 혼자 컸다
        영문(4칸) 카멜레온 53px · 낱장 70px  → 혼자 작았다

   2) **손패 이름 글씨가 정한 크기로 그려지는가.**
      2026-09-29 요청: 한글 손패 글씨를 9.5px 로.
      같이 찾은 것: `#table .card.is-joker .card__name`(.072) 이 선택자 힘이 더 세서
      한글 손패에서 **카멜레온만 4.32px** 로 그려지고 있었다(다른 카드 7.2px).

   쓰는 법:  node test/cardsize.test.mjs   */

import { serve, shut, ensureBuild, findBrowser } from "./shot.mjs";
import pup from "puppeteer-core";

const found = await findBrowser();
if (!found){
  console.log("\n크롬이 없어 건너뜁니다\n");
  console.log("=== 통과 0 / 실패 0 ===\n");
  process.exit(0);
}
let pass = 0, fail = 0;
const check = (n, ok, note) => {
  if (ok){ pass++; console.log("  [OK]   " + n + (note ? "  " + note : "")); }
  else   { fail++; console.log("  [실패] " + n + (note ? "  " + note : "")); }
};
const nap = ms => new Promise(r => setTimeout(r, ms));

/* 손패 이름이 여기까지는 나와야 한다 (카드 60px 기준) */
const KO_HAND_PX = 7.2;
const EN_HAND_PX = 5.3;    /* 띠 좌우 여백을 없애야 들어간다 — 아래 검사 참고 */

ensureBuild();
const srv = await serve(5913);
/* **폰과 같은 글씨 바닥으로 띄운다.** MainActivity 가 1px 로 내려 놨으므로 1 이다 */
const browser = await pup.launch({
  args: [...found.args, "--no-sandbox", "--disable-dev-shm-usage",
         "--blink-settings=minimumFontSize=1,minimumLogicalFontSize=1"]
    .filter(a => !/^--disable-web-security/.test(a)),
  executablePath: found.path, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem("zk_lang", "ko"); } catch(e){}
  globalThis.__ZOO_TEST = true; globalThis.__ZOO_SERVER = "";
  HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
});
await page.goto("http://localhost:" + srv.__port + "/", { waitUntil: "networkidle0" });

/* ---------- 1. 규칙 화면 카드 크기 ---------- */
console.log("\n--- 규칙 화면 (폰 폭 412px) ---");
await page.evaluate(() => window.__goto("lobby"));
await nap(400);
for (const lang of ["ko", "en"]){
  const m = await page.evaluate(l => {
    const b = document.querySelector('#lobby #lang button[data-l="' + l + '"]');
    if (b) b.click();
    document.body.dataset.lang = l; window.__lang = l;
    const r = document.getElementById("btRules"); if (r) r.click();
    const g = document.querySelector("#lobby .grid .cell .card");
    const j = document.querySelector("#lobby .rule--joker .jk .card");
    const box = e => e ? { w: +e.getBoundingClientRect().width.toFixed(1),
                           h: +e.getBoundingClientRect().height.toFixed(1) } : null;
    const nm = document.querySelector("#lobby .rule--joker .card__name");
    return { grid: box(g), joker: box(j),
             cols: (getComputedStyle(document.querySelector("#lobby .grid")).gridTemplateColumns || "").split(" ").length,
             cut: nm ? nm.scrollWidth - Math.round(nm.getBoundingClientRect().width) > 1 : false };
  }, lang);
  const ok = m.grid && m.joker &&
             Math.abs(m.grid.w - m.joker.w) < 0.8 && Math.abs(m.grid.h - m.joker.h) < 1.5;
  check("**카멜레온 카드가 낱장과 같은 크기다 (" + lang + ", " + m.cols + "칸)**", ok,
        "낱장 " + (m.grid && m.grid.w) + "x" + (m.grid && m.grid.h) +
        " · 카멜레온 " + (m.joker && m.joker.w) + "x" + (m.joker && m.joker.h));
  check("카멜레온 이름이 안 잘린다 (" + lang + ")", !m.cut);
  await page.evaluate(() => {
    const x = document.querySelector("#lobby #sheet [data-close]"); if (x) x.click();
  });
  await nap(200);
}

/* ---------- 2. 손패 글씨 크기 ---------- */
console.log("\n--- 손패 이름 글씨 (카드 60px) ---");
const KO = ["사자","호랑이","불곰","코끼리","악어","여우","기린","멧돼지","원숭이","토끼","새","생쥐","카멜레온"];
const EN = ["LION","TIGER","BEAR","ELEPHANT","CROCODILE","FOX","GIRAFFE","BOAR","MONKEY","RABBIT","BIRD","MOUSE","CHAMELEON"];
for (const lang of ["ko", "en"]){
  const rows = await page.evaluate((lang, list) => {
    document.body.dataset.lang = lang;
    document.querySelectorAll(".page").forEach(p => p.classList.remove("is-on"));
    document.querySelector("#table").classList.add("is-on");
    let host = document.querySelector("#table .hand");
    if (!host){ host = document.createElement("div"); host.className = "hand";
                document.querySelector("#table").appendChild(host); }
    /* 양옆 숫자를 **두 자리(12)** 로 놓아 이름 자리를 가장 빡빡하게 잡는다.
       아래 띠에도 숫자 둘을 넣는다 — 영문에서 위 숫자를 숨겨도 아래는 남아야 한다 */
    const mk = (name, joker) =>
      '<div class="slot"><div class="card' + (joker ? " is-joker" : "") + '" style="--w:60px">' +
      '<div class="card__band">' +
      (joker ? '<span class="card__num as"></span>' : '<span class="card__num">12</span>') +
      '<span class="card__name">' + name + '</span>' +
      (joker ? '<span class="card__num as"></span>' : '<span class="card__num">12</span>') +
      '</div><div class="card__art"></div>' +
      '<div class="card__band">' +
      (joker ? '<span class="card__num as"></span><span class="card__num as"></span>'
             : '<span class="card__num">12</span><span class="card__num">12</span>') +
      '</div></div></div>';
    host.innerHTML = list.map((n, i) => mk(n, i === list.length - 1)).join("");
    const shown = e => e && getComputedStyle(e).display !== "none"
                    && e.getBoundingClientRect().width > 0.5;
    return [...host.querySelectorAll(".card")].map((c, i) => {
      const nm = c.querySelector(".card__name");
      const cb = c.getBoundingClientRect(), nb = nm.getBoundingClientRect();
      const bands = c.querySelectorAll(".card__band");
      return { name: list[i],
               size: Math.round(parseFloat(getComputedStyle(nm).fontSize) * 100) / 100,
               cut: nm.scrollWidth - Math.round(nb.width) > 1,
               out: Math.round(Math.max((nb.x + nb.width) - (cb.x + cb.width), cb.x - nb.x) * 10) / 10,
               topNums: [...bands[0].querySelectorAll(".card__num")].filter(shown).length,
               botNums: [...bands[1].querySelectorAll(".card__num")].filter(shown).length,
               bandPad: parseFloat(getComputedStyle(bands[0]).paddingLeft) };
    });
  }, lang, lang === "ko" ? KO : EN);

  const want = lang === "ko" ? KO_HAND_PX : EN_HAND_PX;
  const sizes = [...new Set(rows.map(r => r.size))];
  check("이름 글씨가 " + want + "px 다 (" + lang + ")",
        rows.every(r => Math.abs(r.size - want) < 0.1),
        JSON.stringify(sizes) + "px");
  const jk = rows[rows.length - 1];
  check("**카멜레온도 같은 크기다 (" + lang + ")**", Math.abs(jk.size - want) < 0.1,
        jk.name + " " + jk.size + "px · 나머지 " + rows[0].size + "px");
  const cut = rows.filter(r => r.cut);
  check("잘린 이름이 없다 (" + lang + ")", cut.length === 0,
        cut.length ? cut.map(r => r.name).join(", ") : rows.length + "개 다 들어옴");
  const out = rows.filter(r => r.out > 0.5);
  check("카드 밖으로 나간 이름이 없다 (" + lang + ")", out.length === 0,
        out.length ? out.map(r => r.name).join(", ") : "다 들어옴");

  /* **숫자는 위아래 그대로 있어야 한다.** 영문은 띠 좌우 여백을 없애 자리를 얻는데,
     그 대신 숫자를 숨기거나 하면 안 된다 — 손패에서 제일 중요한 정보다 */
  const plain = rows[0];                       /* 카멜레온이 아닌 보통 카드 */
  check("위 띠에 숫자 둘이 있다 (" + lang + ")", plain.topNums === 2,
        "위 띠 숫자 " + plain.topNums + "개");
  check("아래 띠에 숫자 둘이 있다 (" + lang + ")", plain.botNums === 2,
        "아래 띠 숫자 " + plain.botNums + "개");
  if (lang === "en")
    check("**영문 손패는 띠 좌우 여백이 0 이다 (이름 자리 31px → 33px)**",
          plain.bandPad === 0, "여백 " + plain.bandPad + "px");
}

await browser.close();
shut(srv, null);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
