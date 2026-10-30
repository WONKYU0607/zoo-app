/* 감정표현 말풍선 글 — 판(table.js)과 상점 미리보기(shop.js)가 같이 쓴다 (2026-10-29)

   말풍선 그림은 크기가 정해져 있다(늘리지 않는다 — table.css). 긴 글("그만!!! 멈춰 !!!")은 띄어쓰기에서 두 줄로 접고,
   그래도 넘치면(띄어쓰기 없는 긴 낱말) 글자를 조금씩 줄여 풍선 안에 넣는다 */

/* 두 줄로 접을 때 느낌표·점만 다음 줄로 떨어지지 않게("그만!!! 멈춰 / !!!" → "그만!!! / 멈춰 !!!") — 그 앞 띄어쓰기는 안 끊는 칸으로 */
export function bubText(t){ return String(t).replace(/ (?=[!?.~^]+( |$))/g, " "); }

export function fitBub(b){
  if (!b) return;
  b.style.fontSize = "";
  let fs = parseFloat(getComputedStyle(b).fontSize) || 9;
  for (let i = 0; i < 12 && (b.scrollWidth > b.clientWidth + 0.5 || b.scrollHeight > b.clientHeight + 0.5); i++){
    fs -= 0.4;
    b.style.fontSize = fs + "px";
  }
}
