/* 봇 이름 — 한글 300, 영문 300.

   **번호로 주고받는다.** 서버는 이름이 아니라 번호(0~299)만 내려보내고,
   폰이 그 번호로 자기 언어 목록에서 꺼낸다. 그래야 한국 사람과 외국 사람이
   같은 방에 있어도 **각자 읽을 수 있는 이름**을 본다.

   두 목록은 번역 관계가 아니다. 같은 번호라도 한글과 영문이 전혀 다른 이름이다.
   억지로 짝을 맞추면 어느 한쪽이 어색해진다.

   앱의 별명 규칙(한글 6자 / 영문·숫자 8자, 섞으면 그 사이, 공백·특수문자 불가)을
   전부 통과한 것들이다. 사람이 못 쓰는 이름을 봇이 쓰면 그 자체가 표식이 된다.

   ---------- 2026-09-28 다시 짬 ----------

   예전 목록은 **깔끔한 명사 한 단어가 72%** 였다(음식·꽃·동물). 그래서 한 방에
   여럿이 모이면 "소금빵·백합·크로플·국밥·감자탕" 처럼 **한눈에 봇인 게 티났다.**
   무작위로 뽑는 것은 예전부터 맞았다(botpool.js 의 섞은 주머니) — 문제는 목록의 생김새였다.

   진짜 사람 닉네임 쪽으로 비율을 옮겼다:
     명사 한 단어  78 (26%)   ← 예전 72%. 2~3자 순한글 덩어리는 66% → 38%
     명사+숫자     99 (33%)   숫자 든 것이 44% 로 늘었다 (예전 11%)
     말투·서술형   50 (17%)   "하기싫다", "졌잘싸", "퇴근각"
     자음·초성     22 ( 7%)   "ㅇㅇ", "ㄴㅇㄱ", "ㅎㄷㄷ"
     로마자(+숫자) 36 (12%)   "minji7", "jjune", "Park7"
     수식+명사     15 ( 5%)   "칼든토끼", "강철심장"
   영문도 같은 식으로 나눴다 — 단어 80 / 단어+숫자 102 / 이름 40 / 줄임말 30 / 합성 48.

   욕이 되는 초성(ㅅㅂ·ㅁㅊ 따위)은 넣지 않는다. 스토어에 올리는 게임이다. */

export const BOT_KO = [
  "감자탕", "국밥", "떡볶이", "곱창", "순대국", "마라탕", "탕후루", "붕어빵", "호떡", "김밥",
  "닭강정", "불닭", "슈크림", "크로플", "약과", "제육", "비빔면", "물만두", "군만두", "새우깡",
  "소금빵", "청국장", "된장", "참기름", "자두", "살구", "참외", "수박", "멜론", "석류",
  "솜사탕", "젤리곰", "복숭아", "자몽", "매실", "생강차", "홍시", "곶감", "누룽지", "식혜",
  "나무늘보", "고등어", "두더지", "반달곰", "청설모", "해달", "부엉이", "수달", "다람쥐", "도마뱀",
  "물개", "코뿔소", "알파카", "미어캣", "라쿤", "꿀벌", "살쾡이", "고라니", "너구리", "족제비",
  "눈사람", "밤하늘", "새벽", "노을", "달빛", "별하나", "무지개", "번개", "천둥", "회오리",
  "빙하", "사막", "정글", "초원", "안개", "서리", "이끼", "소나기", "감자1", "고구마2",
  "계란3", "치즈7", "라면9", "김치11", "참치12", "순두부22", "꿀떡24", "약밥27", "달토끼33", "별밤44",
  "구름77", "소나기88", "안개99", "노을00", "바람123", "이슬369", "서리486", "눈꽃1004", "하늘1", "바다2",
  "모래3", "조약돌7", "단풍9", "새싹11", "민들레12", "코스모스22", "해바라기24", "진달래27", "냥이33", "멍멍44",
  "참새77", "두루미88", "고슴도치99", "수달00", "여우비123", "반달369", "은하수486", "오리1004", "졸림1", "배고파2",
  "심심3", "노잼7", "망함9", "운빨11", "대충12", "막가22", "존버24", "각오27", "감자2", "고구마3",
  "계란7", "치즈9", "라면11", "김치12", "참치22", "순두부24", "꿀떡27", "약밥33", "달토끼44", "별밤77",
  "구름88", "소나기99", "안개00", "노을123", "바람369", "이슬486", "서리1004", "눈꽃1", "하늘2", "바다3",
  "모래7", "조약돌9", "단풍11", "새싹12", "민들레22", "코스모스24", "해바라기27", "진달래33", "냥이44", "멍멍77",
  "참새88", "두루미99", "고슴도치00", "수달123", "여우비369", "반달486", "은하수1004", "오리1", "졸림2", "배고파3",
  "심심7", "노잼9", "망함11", "운빨12", "대충22", "막가24", "존버27", "하기싫다", "자는중", "배고픔",
  "심심하다", "어쩌라고", "대충함", "졌잘싸", "다음판에", "그냥해봄", "망했다", "오늘도패배", "지나가던1", "모름",
  "아무나", "한판만더", "자러간다", "눈감고침", "손가락꼬임", "또졌네", "이겼다", "운없음", "운좋음", "각잡고",
  "대충눌럼", "실수였음", "일부러진", "봐준거임", "진심아님", "다시한판", "막판역전", "아까비", "아쉽", "웃참",
  "빡친다", "기분좋다", "졸려요", "배부름", "목마름", "춥다", "덥다", "가보자go", "ㄱㄱ싱", "렛츠고",
  "쉬는중", "퇴근각", "야근중", "출근길", "점심시간", "간식타임", "치킨각", "ㅇㅇ", "ㄴㄴ", "ㅋㅋ",
  "ㅎㅎ", "ㅠㅠ", "ㅜㅜ", "ㅇㅈ", "ㄱㅅ", "ㅅㄱ", "ㅈㅅ", "ㄷㄷ", "ㅇㅋ", "ㄴㅇㄱ",
  "ㅋㅋㅋㅋ", "ㅎㅇ", "ㅂㅂ", "ㄱㄱ", "ㅊㅊ", "ㅇㄷ", "ㅈㅈ", "ㅇㅅㅇ", "ㅋ7", "jjune",
  "minji7", "jiho22", "soo99", "daeun2", "taeho1", "nari", "hana88", "bomi", "kkot", "haru7",
  "dal8", "byul2", "sunny7", "mina3", "ho1", "jjang", "yeon9", "seo7", "Kim99", "Park7",
  "Lee22", "Choi1", "hyun2", "jun77", "woo9", "gyu4", "rin5", "sol3", "ttoki", "gomz",
  "nabi7", "dodo9", "mong2", "zzz9", "kkk7", "칼든토끼", "강철심장", "검은손", "불곰3", "야수파",
  "광전사", "철벽수비", "파괴왕", "무자비", "폭주기관", "피바람", "절대자", "혈투왕", "화염주먹", "폭군님"
];

export const BOT_EN = [
  "moss", "fern", "birch", "cedar", "amber", "onyx", "ivory", "slate", "flint", "ember",
  "dusk", "haze", "frost", "brook", "glade", "ridge", "willow", "thorn", "bramble", "hollow",
  "otter", "heron", "magpie", "badger", "marten", "weasel", "lynx", "raven", "finch", "wren",
  "scone", "crumpet", "biscuit", "waffle", "pretzel", "gravy", "pickle", "tofu", "ramen", "curry",
  "kettle", "lantern", "anvil", "quill", "sundial", "thimble", "satchel", "mitten", "bobbin", "trowel",
  "waltz", "tango", "rumba", "shanty", "ballad", "fugue", "polka", "mambo", "samba", "bolero",
  "prism", "quartz", "copper", "pewter", "bronze", "cinder", "marrow", "hearth", "tether", "gasket",
  "crisp", "murky", "brisk", "stout", "vivid", "gleam", "husky", "plush", "terse", "quiet",
  "wolf1", "fox2", "crow3", "bear7", "hawk9", "moth11", "newt12", "toad21", "carp22", "seal33",
  "moon42", "star44", "rain69", "snow77", "dust88", "iron99", "rust007", "clay101", "salt404", "lime777",
  "dark1", "gray2", "pale3", "bold7", "wild9", "calm11", "slow12", "fast21", "soft22", "hard33",
  "ace42", "kid44", "pro69", "noob77", "zed88", "kiwi99", "mango007", "plum101", "fig404", "yam777",
  "wolf2", "fox3", "crow7", "bear9", "hawk11", "moth12", "newt21", "toad22", "carp33", "seal42",
  "moon44", "star69", "rain77", "snow88", "dust99", "iron007", "rust101", "clay404", "salt777", "lime1",
  "dark2", "gray3", "pale7", "bold9", "wild11", "calm12", "slow21", "fast22", "soft33", "hard42",
  "ace44", "kid69", "pro77", "noob88", "zed99", "kiwi007", "mango101", "plum404", "fig777", "yam1",
  "wolf3", "fox7", "crow9", "bear11", "hawk12", "moth21", "newt22", "toad33", "carp42", "seal44",
  "moon69", "star77", "rain88", "snow99", "dust007", "iron101", "rust404", "clay777", "salt1", "lime2",
  "dark3", "gray7", "Finn", "Mika", "Jae", "Noa", "Elias", "Rhea", "Juno", "Otto",
  "Iris", "Milo", "Nora", "Ezra", "Luca", "Wren", "Kai", "Ines", "Theo", "Ada",
  "Bo", "Sol", "Remy", "Nico", "Cleo", "Vera", "Zane", "Maya", "Dax", "Lia",
  "Gus", "Poe", "Odin", "Freya", "Bram", "Saga", "Tove", "Rune", "Lief", "Eira",
  "Halle", "Nils", "gg", "ez", "afk", "brb", "lol", "idk", "imo", "tbh",
  "fyi", "omg", "nvm", "smh", "ggwp", "noob1", "pro2", "rip3", "lmao", "yolo",
  "meh", "ugh", "zzz", "hmm", "huh", "oof", "yeet", "bruh", "sus", "mid",
  "gge", "wp", "darkfox", "redmoon", "greytide", "saltcrow", "ironnewt", "palehawk", "slowcarp", "wildfig",
  "boldyam", "calmelk", "nightowl", "dayhawk", "softclay", "hardrust", "dustmoth", "limetoad", "plumseal", "kiwibear",
  "mangobat", "figcrow", "darkfox1", "redmoon2", "wildfig1", "boldyam2", "calmelk7", "darkfox2", "redmoon7", "wildfig2",
  "boldyam7", "calmelk9", "darkfox7", "redmoon9", "wildfig7", "boldyam9", "figcrow1", "darkfox9", "wildfig9", "dayhawk1",
  "figcrow2", "dayhawk2", "figcrow7", "calmelk1", "dayhawk7", "figcrow9", "redmoon1", "boldyam1", "calmelk2", "dayhawk9"
];

export const BOT_COUNT = BOT_KO.length;   /* 두 목록의 길이는 같아야 한다 */

/* 번호 → 이름. 번호가 목록보다 크면 돌려서 쓴다 */
export function botLabel(idx, lang){
  const n = Number(idx);
  if (!Number.isFinite(n) || n < 0) return "";
  const list = (lang === "en" ? BOT_EN : BOT_KO);
  return list[n % list.length];
}
