/* 그림 경로. 빌드할 때 public/assets 로 복사된다. */
export const CARDS = {"01": "assets/card_01.webp", "02": "assets/card_02.webp", "03": "assets/card_03.webp", "04": "assets/card_04.webp", "05": "assets/card_05.webp", "06": "assets/card_06.webp", "07": "assets/card_07.webp", "08": "assets/card_08.webp", "09": "assets/card_09.webp", "10": "assets/card_10.webp", "11": "assets/card_11.webp", "12": "assets/card_12.webp"};
export const ART = {"01": "assets/card_01.webp", "02": "assets/card_02.webp", "03": "assets/card_03.webp", "04": "assets/card_04.webp", "05": "assets/card_05.webp", "06": "assets/card_06.webp", "07": "assets/card_07.webp", "08": "assets/card_08.webp", "09": "assets/card_09.webp", "10": "assets/card_10.webp", "11": "assets/card_11.webp", "12": "assets/card_12.webp", "jokerA": "assets/joker_a.webp", "jokerB": "assets/joker_b.webp"};
export const ART_DECK = {"01": "assets/card_01.webp", "02": "assets/card_02.webp", "03": "assets/card_03.webp", "04": "assets/card_04.webp", "05": "assets/card_05.webp", "06": "assets/card_06.webp", "07": "assets/card_07.webp", "08": "assets/card_08.webp", "09": "assets/card_09.webp", "10": "assets/card_10.webp", "11": "assets/card_11.webp", "12": "assets/card_12.webp", "jokerA": "assets/joker_a.webp", "jokerB": "assets/joker_b.webp", "back": "assets/back.webp"};
export const LOBBY_ART = {"01": "assets/card_01.webp", "02": "assets/card_02.webp", "03": "assets/card_03.webp", "04": "assets/card_04.webp", "05": "assets/card_05.webp", "06": "assets/card_06.webp", "07": "assets/card_07.webp", "08": "assets/card_08.webp", "09": "assets/card_09.webp", "10": "assets/card_10.webp", "11": "assets/card_11.webp", "12": "assets/card_12.webp", "joker": "assets/joker_a.webp"};
export const BACK = "assets/back.webp";
export const BG = { entry: "assets/bg.webp", throne: "assets/throne.webp", table: "assets/tablebg.webp" };
/* 프로필 얼굴 15개. 앞 5개는 처음부터, 그 뒤는 점수 5,000점마다 하나씩 열린다.
   순서를 바꾸면 이미 고른 사람들의 얼굴이 바뀌므로 **뒤에만 덧붙일 것** */
/* 진입 화면 부채꼴 카드 그림 (카드 아트와 별개) */
export const HERO = {"02": "assets/hero_02.webp", "04": "assets/hero_04.webp", "05": "assets/hero_05.webp", "10": "assets/hero_10.webp", "joker_a": "assets/hero_joker_a.webp"};

export const AVATARS = [
  { f: "assets/avt_01.webp", ko: "생쥐",   en: "Mouse",    need: 0 },
  { f: "assets/avt_02.webp", ko: "새",     en: "Bird",     need: 0 },
  { f: "assets/avt_03.webp", ko: "토끼",   en: "Rabbit",   need: 0 },
  { f: "assets/avt_04.webp", ko: "원숭이", en: "Monkey",   need: 0 },
  { f: "assets/avt_05.webp", ko: "멧돼지", en: "Boar",     need: 0 },
  { f: "assets/avt_06.webp", ko: "기린",   en: "Giraffe",  need: 5000 },
  { f: "assets/avt_07.webp", ko: "여우",   en: "Fox",      need: 10000 },
  { f: "assets/avt_08.webp", ko: "악어",   en: "Croc",     need: 15000 },
  { f: "assets/avt_09.webp", ko: "코끼리", en: "Elephant", need: 20000 },
  { f: "assets/avt_10.webp", ko: "불곰",   en: "Bear",     need: 25000 },
  { f: "assets/avt_11.webp", ko: "호랑이", en: "Tiger",    need: 30000 },
  { f: "assets/avt_12.webp", ko: "사자",   en: "Lion",     need: 35000 },
  { f: "assets/avt_13.webp", ko: "고양이", en: "Cat",      need: 40000 },
  { f: "assets/avt_14.webp", ko: "용",     en: "Dragon",   need: 45000 },
  { f: "assets/avt_15.webp", ko: "유니콘", en: "Unicorn",  need: 50000 },
];
export const AVT_FREE = 5;                       /* 처음부터 열려 있는 개수 */
export const avtFile = i => (AVATARS[i] || AVATARS[0]).f;
export const avtOpen = (i, score) => (AVATARS[i] ? (score || 0) >= AVATARS[i].need : false);

/* 감정표현 — 동물 5종, 말풍선, 단추 아이콘 */
export const EMOTES = [
  { k: "tiger",  img: "assets/emote_tiger.webp",  ko: "빨리빨리", en: "HURRY UP" },
  { k: "rabbit", img: "assets/emote_rabbit.webp", ko: "감사",     en: "THANKS" },
  { k: "bear",   img: "assets/emote_bear.webp",   ko: "ㅠㅠ",     en: "SO SAD" },
  { k: "monkey", img: "assets/emote_monkey.webp", ko: "풉ㅋㅋ",   en: "LOL" },
  { k: "lion",   img: "assets/emote_lion.webp",   ko: "아오..!",  en: "ARGH...!" },
];
export const EMOTE_BUBBLE = "assets/emote_bubble.webp";
export const EMOTE_BTN = "assets/emote_btn.webp";

export const RINGS = {"avatar": "assets/ring.webp", "empty": "assets/ring_empty.webp"};
export const FRAMES = {"panel": "assets/fr_panel.webp", "row": "assets/fr_row.webp", "btn": "assets/fr_btn.webp", "btn_down": "assets/fr_btn_down.webp", "red": "assets/fr_red.webp", "red_down": "assets/fr_red_down.webp"};
