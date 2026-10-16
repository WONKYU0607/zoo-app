/* 별명 거르기 — 욕설·성적인 말·운영자 흉내 (2026-10-10 사용자 요청)

   별명은 한글·영문·숫자만, 띄어쓰기 없이 받는다(account.js checkName). 그 안에서 흔히 쓰는
   피해 가기도 잡는다.
     - 사이에 숫자·영문 끼우기     시1발 · 병a신 → 한글만 남겨서 본다
     - 숫자로 글자 바꾸기          sh1t · fvck … 0→o 1→i/l 3→e 4→a 5→s 7→t 8→b
     - 같은 글자 늘이기            fuuuck → fuck
     - 자음만 쓰기 · 섞어 쓰기     ㅅㅂ · ㅅ발 · 시ㅂ → 자음 칸으로 바꿔 본다(자음이 낀 자리만 —
                                    "부산" 을 ㅂㅅ 으로 보면 안 되므로)
     - 영타로 치기                 tlqkf(씨발) · qudtls(병신) …
   **다 막지는 못한다.** 새로 나오는 변형은 아래 목록에 더 넣는다.
   검사가 앱에만 있어서 앱을 뜯어고친 사람은 지나갈 수 있다 */

const KO = [
  /* 욕 */
  "씨발", "시발", "씨빨", "시빨", "씨바", "씨팔", "시팔", "쉬발", "쉬바", "씨벌", "시벌", "씹",
  "십새", "십쌔", "씹새", "개새", "개색", "개섀", "개쉐", "개쌔", "개세끼", "개같", "개년",
  "새끼", "색끼", "쌔끼", "섀끼", "병신", "븅신", "빙신", "병싄", "등신",
  "좆", "좃", "존나", "지랄", "염병", "엠병", "니미", "느금", "니애미", "니앰", "느개비", "니에미",
  "애미", "엄창", "엠창", "미친놈", "미친년", "미틴", "또라이", "닥쳐", "꺼져", "썅", "쌍년", "쌍놈",
  "화냥", "걸레", "창녀", "창년",
  /* 성적인 말 */
  "보지", "자지", "잠지", "섹스", "쎅스", "섹쓰", "쌕스", "야동", "성교", "강간", "자위", "딸딸이",
  "딸치", "오나홀", "포르노", "노콘", "질싸", "정액", "펠라", "애널", "근친", "젖꼭지", "빨통",
  "몸캠", "조건만남", "원나잇", "변태", "후장",
  /* 비하 */
  "한남충", "김치녀", "맘충", "틀딱", "짱깨", "쪽바리", "깜둥이",
];
/* 숫자가 뜻을 갖는 것 — 숫자를 지우기 전에 본다 */
const KO_NUM = ["씨8", "시8", "씨18", "18놈", "18년", "18새", "18련"];
/* 자음으로 쓰는 것. 자음이 하나라도 낀 자리에서만 본다 */
const JAMO = ["ㅅㅂ", "ㅆㅂ", "ㅂㅅ", "ㅄ", "ㅈㄴ", "ㅈㄹ", "ㅅㄲ", "ㅁㅊ", "ㅆㄹㄱ", "ㄲㅈ", "ㄷㅊ",
              "ㅅㅅ", "ㅂㅈ", "ㅈㄲ", "ㄴㄱㅁ", "ㅗ"];
const EN = [
  "fuck", "fuk", "fck", "fuq", "fvck", "fxck", "fcuk", "phuck", "shit", "sht", "bitch", "btch", "cunt", "dick", "cock",
  "pussy", "asshole", "bastard", "slut", "whore", "porn", "sex", "nigger", "nigga", "faggot", "fag",
  "retard", "rape", "penis", "vagina", "boob", "tits", "titty", "cumshot", "jizz", "milf", "horny",
  "nude", "xxx", "hentai", "blowjob", "handjob", "dildo", "wank",
  /* 한국 욕을 소리대로 */
  "ssibal", "sibal", "shibal", "ssibbal", "byungsin", "byeongsin", "gaesaekki", "jotna", "jonna",
  /* 한국 욕을 한글 자판에서 영어로 친 것 */
  "tlqkf", "qudtls", "wlfkf", "whssk", "rotorl", "tprtm", "qhwl", "wkwl",
];
/* 영어 낱말 속에 우연히 들어 있는 것 — 먼저 지우고 본다 */
const EN_OK = ["peacock", "cockatoo", "cockatiel", "hancock", "grape", "drape", "scrape", "therapist",
               "essex", "sussex", "dickens", "cocktail", "sextet", "sexton"];
/* 운영자 흉내 · 게스트 흉내 */
const OFFICIAL_KO = ["운영자", "운영진", "관리자", "개발자", "공식", "어드민", "지엠", "고객센터"];
const OFFICIAL_EN = ["admin", "official", "moderator", "operator"];

const SYL = /[가-힣]/;
const J = /[ㄱ-ㆎ]/;
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

const leet = (s, one) => s.replace(/[0134578]/g, d => ({ 0: "o", 1: one, 3: "e", 4: "a", 5: "s", 7: "t", 8: "b" })[d]);
const squeeze = s => s.replace(/(.)\1+/g, "$1");

/* 자음 칸 — 글자마다 첫 자음, 자음은 그대로. 원래 자음이었는지도 같이 */
function jamoHit(v){
  const red = [], was = [];
  for (const ch of v){
    if (SYL.test(ch)){ red.push(CHO[Math.floor((ch.charCodeAt(0) - 0xAC00) / 588)]); was.push(false); }
    else if (J.test(ch)){ red.push(ch); was.push(true); }
    /* 숫자·영문은 건너뛴다 — ㅅ1ㅂ 도 ㅅㅂ */
  }
  if (!was.some(Boolean)) return false;
  const s = red.join("");
  for (const p of JAMO){
    let k = s.indexOf(p);
    while (k >= 0){
      if (was.slice(k, k + p.length).some(Boolean)) return true;
      k = s.indexOf(p, k + 1);
    }
  }
  return false;
}

/* 쓸 수 없는 별명이면 까닭("bad" | "official"), 괜찮으면 null */
export function badName(str){
  const v = String(str || "").toLowerCase();
  if (!v) return null;

  /* 운영자·게스트 흉내 */
  if (/^게스트/.test(v) || /^guest/.test(v) || /^gm([^a-z]|$)/.test(v)) return "official";
  if (OFFICIAL_KO.some(w => v.includes(w)) || OFFICIAL_EN.some(w => leet(v, "i").includes(w))) return "official";

  /* 한국어 */
  if (KO_NUM.some(w => v.includes(w))) return "bad";
  const ko = v.replace(/[^가-힣ㄱ-ㆎ]/g, "");
  if (KO.some(w => ko.includes(w) || v.includes(w))) return "bad";
  if (jamoHit(v)) return "bad";

  /* 영어 */
  const forms = new Set();
  for (const f of [v, leet(v, "i"), leet(v, "l"), v.replace(/\d/g, "")]){
    const lat = f.replace(/[^a-z]/g, "");
    for (const g of [f, lat]){
      let x = g;
      for (const ok of EN_OK) x = x.split(ok).join("_");     /* 늘이기 풀기 전에 — essex 가 esex 로 줄면 sex 가 된다 */
      forms.add(x); forms.add(squeeze(x));
    }
  }
  for (const f of forms) if (EN.some(w => f.includes(w))) return "bad";
  return null;
}
