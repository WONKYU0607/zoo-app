/* 이 기기 안의 방. 사람은 나 하나, 나머지는 봇.
   방 대기실 화면이 읽는 모양(window.__room)을 만드는 곳도 여기다.
   화면과 main.js 가 같은 함수를 쓰게 해서, 모양이 어긋나는 사고를 막는다. */

import { botLabel, BOT_COUNT } from "./botnames.js";

/* 옛 저장본 호환용. 새로 앉는 봇은 아래 번호 주머니를 쓴다 */
export const BOT_NAMES = ["서연", "준호", "민지", "태윤", "하은", "지훈", "예린"];

/* 봇 이름 번호 주머니 — 서버와 같은 방식이다.
   0~299 를 섞어 줄을 세우고 앞에서부터 꺼낸다. 다 쓰면 **다시 섞어서** 채운다.
   그냥 처음으로 되돌리면 두 바퀴째부터 순서가 똑같아진다.
   줄과 위치는 이 폰에 적어 둔다 */
const BAG_KEY = "zk_botbag";

function shuffled(){
  const a = Array.from({ length: BOT_COUNT }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function readBag(){
  try {
    const v = JSON.parse(localStorage.getItem(BAG_KEY) || "null");
    if (v && Array.isArray(v.order) && v.order.length === BOT_COUNT
        && Number.isInteger(v.at) && v.at >= 0 && v.at <= BOT_COUNT) return v;
  } catch(e){}
  return { order: shuffled(), at: 0 };
}

/* 방금 쓴 것들. 주머니를 새로 섞을 때 맨 앞에 오지 않게 막는다 —
   안 막으면 이음매에서 방금 본 이름이 또 나온다 */
const RECENT = 24;
let recent = [];
function reshuffle(){
  const a = shuffled();
  for (let i = 0; i < Math.min(RECENT, a.length); i++){
    if (!recent.includes(a[i])) continue;
    for (let t = 0; t < 20; t++){
      const j = RECENT + Math.floor(Math.random() * (a.length - RECENT));
      if (!recent.includes(a[j])){ [a[i], a[j]] = [a[j], a[i]]; break; }
    }
  }
  return a;
}

let bag = null;
function nextBotIdx(){
  if (!bag) bag = readBag();
  if (bag.at >= bag.order.length){ bag.order = reshuffle(); bag.at = 0; }
  const n = bag.order[bag.at++];
  recent.push(n);
  if (recent.length > RECENT) recent.shift();
  /* 저장이 막힌 환경(사생활 보호 창 등)에서도 게임은 굴러가야 한다 */
  try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch(e){}
  return n;
}

/* 자리 하나의 보이는 이름.
   봇은 **번호**만 들고 있다가 그릴 때 지금 언어로 바꾼다.
   그래야 게임 도중에 언어를 바꿔도 봇 이름이 같이 따라간다 */
export function seatLabel(s){
  if (!s) return "";
  if (s.bot && s.botIdx != null) return botLabel(s.botIdx, (typeof window !== "undefined" && window.__lang) || "ko");
  return s.name || "";
}

const ME = "me";                       /* 내 자리 uid. 방장도 나다 */

/* 방 번호. 이 기기 안의 방이어도 번호는 붙인다 — 화면이 "----" 로 보이면 고장 같아 보인다 */
const newCode = () => String(Math.floor(1000 + Math.random() * 9000));

/* 얼굴은 처음 열려 있는 다섯(0~4) 중에서 봇이 고른다 */
const botAvatar = () => Math.floor(Math.random() * 5);

export function createRoom({ cap = 4, name = "나", avatar = 0 } = {}){
  return {
    code: newCode(),
    cap: Math.min(8, Math.max(4, cap)),
    phase: "waiting",
    seats: [{ uid: ME, name: String(name || "나"), bot: false, avatar: Number(avatar) || 0 }],
  };
}

export function addBot(room){
  if (!room || room.phase !== "waiting") return false;
  if (room.seats.length >= room.cap) return false;
  /* 한 방 안에서 같은 이름이 두 번 나오지 않게. 주머니에서 순서대로 꺼내면
     사실상 안 겹치지만, 바퀴가 바뀌는 순간을 대비해 한 번 더 본다 */
  const used = room.seats.map(s => s && s.botIdx).filter(v => v != null);
  let idx = nextBotIdx();
  for (let t = 0; t < 5 && used.includes(idx); t++) idx = nextBotIdx();
  room.seats.push({ uid: "bot" + room.seats.length, name: "", botIdx: idx,
                    bot: true, avatar: botAvatar() });
  return true;
}

export function setCap(room, cap){
  if (!room) return;
  room.cap = Math.min(8, Math.max(4, Number(cap) || room.cap));
  while (room.seats.length > room.cap) room.seats.pop();
}

/* 방 대기실 화면이 그대로 읽는 모양.
   room.js 는 seats[me].uid === host 로 방장을 가린다. host 는 사람 uid 여야 한다. */
export function toRoomView(room){
  if (!room) return null;
  return {
    code: room.code,
    cap: room.cap,
    me: 0,
    host: ME,
    phase: room.phase,
    round: null,
    /* 봇 이름은 여기서 지금 언어로 바꿔 넘긴다 */
    seats: room.seats.map(s => (s ? { ...s, name: seatLabel(s) } : s)),
  };
}

export const seatCount = room => (room ? room.seats.length : 0);
