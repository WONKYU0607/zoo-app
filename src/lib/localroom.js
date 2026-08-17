/* 이 기기 안의 방. 사람은 나 하나, 나머지는 봇.
   방 대기실 화면이 읽는 모양(window.__room)을 만드는 곳도 여기다.
   화면과 main.js 가 같은 함수를 쓰게 해서, 모양이 어긋나는 사고를 막는다. */

export const BOT_NAMES = ["서연", "준호", "민지", "태윤", "하은", "지훈", "예린"];

const ME = "me";                       /* 내 자리 uid. 방장도 나다 */

export function createRoom({ cap = 6, name = "나" } = {}){
  return {
    cap: Math.min(8, Math.max(4, cap)),
    phase: "waiting",
    seats: [{ uid: ME, name: String(name || "나"), bot: false }],
  };
}

export function addBot(room){
  if (!room || room.phase !== "waiting") return false;
  if (room.seats.length >= room.cap) return false;
  const used = room.seats.map(s => s && s.name);
  const name = BOT_NAMES.find(n => !used.includes(n)) || ("봇" + room.seats.length);
  room.seats.push({ uid: "bot" + room.seats.length, name, bot: true });
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
    cap: room.cap,
    me: 0,
    host: ME,
    phase: room.phase,
    round: null,
    seats: room.seats.slice(),
  };
}

export const seatCount = room => (room ? room.seats.length : 0);
