/* 약관·개인정보처리방침 **웹 페이지**를 만든다.

   플레이 스토어에 등록하려면 개인정보처리방침의 **웹 주소**를 내야 한다.
   글은 앱 안에서 보여 주는 것과 같아야 하므로 `src/lib/legal.js` 하나에서 가져온다.
   따로 적어 두면 한쪽만 고치고 다른 쪽은 옛 글이 남는다.

   `npm run build` 전에 돌아간다(package.json 참고).
   만들어지는 곳:  public/privacy.html  ·  public/terms.html   */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TERMS, PRIVACY, UPDATED } from "../src/lib/legal.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function pageHtml(doc){
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(doc.ko.title)} · 동물의 왕국</title>
<style>
  body{margin:0;background:#15110C;color:#D9CCB0;font-family:system-ui,sans-serif;line-height:1.7}
  main{max-width:760px;margin:0 auto;padding:28px 18px 60px}
  h1{color:#E8DCC0;font-size:22px;margin:0 0 4px}
  h2{color:#C69A3C;font-size:17px;margin:34px 0 8px}
  .date{color:#8C7B5C;font-size:13px;margin:0 0 24px}
  pre{white-space:pre-wrap;font-family:inherit;margin:0;font-size:15px}
  a{color:#C69A3C}
</style>
</head>
<body>
<main>
  <h1>${esc(doc.ko.title)}</h1>
  <p class="date">마지막 수정: ${esc(UPDATED)}</p>
  <pre>${esc(doc.ko.body)}</pre>

  <h2>${esc(doc.en.title)} (English)</h2>
  <pre>${esc(doc.en.body)}</pre>
</main>
</body>
</html>
`;
}

if (process.argv[1] && process.argv[1].endsWith("legal-pages.mjs")){
  writeFileSync(join(ROOT, "public", "privacy.html"), pageHtml(PRIVACY));
  writeFileSync(join(ROOT, "public", "terms.html"), pageHtml(TERMS));
  console.log("[약관] public/privacy.html · public/terms.html 만들었습니다");
}
