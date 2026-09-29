/* 폰의 **최소 글씨 크기 8px** 아래에서도 카드 이름이 카드 밖으로 안 나가는가.

   2026-09-28 사용자 신고: 손패 맨 오른쪽 카멜레온 이름이 오른쪽으로 치우쳐
   카드 밖으로 나간다.

   원인: **안드로이드 웹뷰는 8px 보다 작은 글씨를 안 그린다.**
   (`WebSettings.minimumFontSize`·`minimumLogicalFontSize` 기본값이 8이다)
   CSS 에 4.86px 라고 적어도 폰에서는 8px 로 그려진다. 그러면 긴 영문 이름이
   이름 자리(37.6px)보다 넓어져 옆 카드 위로 흘러나간다.
   가운데 정렬이 깨진 게 아니라 `space-between` 이라 왼쪽에 붙고 오른쪽으로 넘친 것이다.

   **데스크톱 크로미움은 이 바닥이 0이라 그냥 띄우면 절대 재현이 안 된다.**
   그래서 여기서는 `--blink-settings=minimumFontSize=8` 로 띄운다.
   이 검사가 없으면 "내 화면에선 되는데요" 로 또 놓친다.

   보는 것:
     - 어떤 카드 이름도 **카드 밖으로 나가지 않는다** (한글·영문 둘 다)
     - 카멜레온은 **잘리지도 않는다** — 양옆 숫자 칸이 비어 있어 띠를 통째로 쓴다
     - 8px 바닥이 없을 때(데스크톱)도 그대로 들어온다

   쓰는 법:  node test/minfont.test.mjs   */

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

const KO = ["사자","호랑이","불곰","코끼리","악어","여우","기린","멧돼지","원숭이","토끼","새","생쥐","카멜레온"];
const EN = ["LION","TIGER","BEAR","ELEPHANT","CROCODILE","FOX","GIRAFFE","BOAR","MONKEY","RABBIT","BIRD","MOUSE","CHAMELEON"];

ensureBuild();
const srv = await serve(5887);

async function measure(min){
  const browser = await pup.launch({
    args: [...found.args, "--no-sandbox", "--disable-dev-shm-usage",
           "--blink-settings=minimumFontSize=" + min + ",minimumLogicalFontSize=" + min]
      .filter(a => !/^--disable-web-security/.test(a)),
    executablePath: found.path, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => {
    globalThis.__ZOO_TEST = true; globalThis.__ZOO_SERVER = "";
    HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
  });
  await page.goto("http://localhost:" + srv.__port + "/", { waitUntil: "networkidle0" });
  const out = {};
  for (const lang of ["ko", "en"]){
    out[lang] = await page.evaluate((lang, list) => {
      document.body.dataset.lang = lang;
      document.querySelectorAll(".page").forEach(p => p.classList.remove("is-on"));
      document.querySelector("#table").classList.add("is-on");
      let host = document.querySelector("#table .hand");
      if (!host){ host = document.createElement("div"); host.className = "hand";
                  document.querySelector("#table").appendChild(host); }
      const mk = (name, joker) =>
        '<div class="slot"><div class="card' + (joker ? " is-joker" : "") + '" style="--w:60px">' +
        '<div class="card__band">' +
        (joker ? '<span class="card__num as"></span>' : '<span class="card__num">1</span>') +
        '<span class="card__name">' + name + '</span>' +
        (joker ? '<span class="card__num as"></span>' : '<span class="card__num">1</span>') +
        '</div><div class="card__art"></div><div class="card__band"></div></div></div>';
      host.innerHTML = list.map((n, i) => mk(n, i === list.length - 1)).join("");
      return [...host.querySelectorAll(".card")].map((c, i) => {
        const nm = c.querySelector(".card__name");
        const cb = c.getBoundingClientRect(), nb = nm.getBoundingClientRect();
        return {
          name: list[i],
          size: parseFloat(getComputedStyle(nm).fontSize),
          /* 카드 밖으로 얼마나 나갔나 (양수면 나간 것) */
          outR: Math.round(((nb.x + nb.width) - (cb.x + cb.width)) * 10) / 10,
          outL: Math.round((cb.x - nb.x) * 10) / 10,
          /* 글자가 잘렸나 — 실제 글자 너비가 칸보다 넓으면 잘린다 */
          cut: nm.scrollWidth - Math.round(nb.width) > 1,
        };
      });
    }, lang, lang === "ko" ? KO : EN);
  }
  await browser.close();
  return out;
}

console.log("\n=== 폰과 같은 조건 (최소 글씨 8px) ===");
const m8 = await measure(8);
for (const lang of ["ko", "en"]){
  const rows = m8[lang];
  const outs = rows.filter(r => r.outR > 0.5 || r.outL > 0.5);
  check("카드 밖으로 나간 이름이 없다 (" + lang + ")", outs.length === 0,
        outs.length ? outs.map(r => r.name + " +" + Math.max(r.outR, r.outL) + "px").join(", ")
                    : rows.length + "개 다 들어옴 · 글씨 " + rows[0].size + "px");
}
const j8ko = m8.ko[m8.ko.length - 1], j8en = m8.en[m8.en.length - 1];
check("**카멜레온은 잘리지도 않는다 (한글)**", !j8ko.cut, j8ko.name);
check("**카멜레온은 잘리지도 않는다 (영문)**", !j8en.cut, j8en.name);
check("폰에서는 8px 로 그려진다 (이 검사가 진짜 그 조건인지 확인)",
      m8.en[0].size === 8, m8.en[0].size + "px");

console.log("\n=== 바닥이 없을 때 (데스크톱·웹) ===");
const m0 = await measure(0);
for (const lang of ["ko", "en"]){
  const outs = m0[lang].filter(r => r.outR > 0.5 || r.outL > 0.5);
  check("카드 밖으로 나간 이름이 없다 (" + lang + ")", outs.length === 0,
        outs.length ? outs.map(r => r.name).join(", ") : "다 들어옴 · 글씨 " + m0[lang][0].size + "px");
}
const cut0 = m0.ko.concat(m0.en).filter(r => r.cut);
check("잘린 이름이 없다", cut0.length === 0, cut0.map(r => r.name).join(", "));

shut(srv, null);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
