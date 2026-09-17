/* 게임 서버의 방 창구.

   서버 주소(VITE_GAME_SERVER)가 없으면 서버 대전은 아예 끄고 이 기기 방으로만 논다.
   자리 번호는 서버가 정한 것을 그대로 쓴다 — 여기서 돌리지 않는다. */

/* 주소는 빌드 때 VITE_GAME_SERVER 로 넣는다.
   앱 껍데기(안드로이드)나 검사에서는 globalThis.__ZOO_SERVER 로도 넣을 수 있다.

   **정해져 있으면 빈 값이라도 그것이 답이다.** 빈 값 = "서버 대전 끄고 이 기기 방으로".
   예전에는 `||` 로 이어서, 빈 값을 넣어도 빌드 때 박힌 주소로 넘어가 버렸다.
   그래서 브라우저 검사가 **진짜 배포 서버에 붙으려다** CORS 에 막혀 다 죽었다 */
export const serverUrl = () => {
  if (typeof globalThis !== "undefined" && globalThis.__ZOO_SERVER != null)
    return globalThis.__ZOO_SERVER;
  return (import.meta && import.meta.env && import.meta.env.VITE_GAME_SERVER) || "";
};
export const online = () => Boolean(serverUrl());

async function api(path, body){
  const res = await fetch(serverUrl() + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : {}; } catch(e){ data = {}; }
  if (!res.ok) throw new Error((data && data.error) || ("서버 오류 " + res.status));
  return data;
}

/* 방 만들기 — 만든 사람이 0번 자리 */
export const createRoom = ({ numPlayers, name, rounds, tax, clear2, avatar, friends }) =>
  api("/zoo/rooms", { numPlayers, name, rounds, tax, clear2, avatar, friends });

/* 번호로 참가 — 빈자리 중 앞쪽에 앉는다 */
export const joinRoom = (code, name, avatar) =>
  api(`/zoo/rooms/${code}/join`, { name, avatar });

/* 방 들여다보기 — 참가자·자리비움·이탈 */
/* seat 을 주면 내 새 자리·자격증명도 같이 내려온다.
   방장이 인원을 바꾸면 서버가 판을 새로 만들기 때문에 그때 필요하다 */
export const peekRoom = (code, seat) =>
  api(`/zoo/rooms/${code}` + (seat == null ? "" : `?seat=${seat}`));

/* 방에서 나가기 — 자리를 비운다.
   안 부르면 서버는 아직 앉아 있는 줄 알고, 다시 들어올 때 자리를 하나 더 준다 */
export const leaveRoom = (code, playerID) =>
  api(`/zoo/rooms/${code}/leave`, { playerID: String(playerID) }).catch(() => null);

/* 빠른 참가 — 자리가 남은 방에 넣어 주고, 없으면 새로 만든다 */
export const quickJoin = ({ name, avatar, numPlayers, rounds, tax, clear2 }) =>
  api("/zoo/quick", { name, avatar, numPlayers, rounds, tax, clear2 });

/* 방 인원 바꾸기 — 대기 중, 방장만 */
export const setRoomCap = (code, numPlayers, playerID) =>
  api(`/zoo/rooms/${code}/cap`, { numPlayers, playerID: String(playerID) });

/* 시작 — 빈자리를 봇으로 채우고 서버가 대리인을 붙인다 */
export const startRoom = code => api(`/zoo/rooms/${code}/start`, {});

/* 내가 직접 뒀다고 알린다 — 자리비움 판정을 되돌린다 */
export const keepAlive = (code, seat) =>
  api(`/zoo/rooms/${code}/alive`, { seat }).catch(() => null);

/* ---------- 하던 방 적어 두기 ----------

   방 번호·자리·자리표는 **브라우저 메모리에만** 있었다.
   그래서 새로고침하거나 서버가 껐다 켜지면 진입창으로 돌아가 버렸다.
   서버가 판을 들고 있어도 앱이 어디로 돌아가야 할지 몰랐던 것이다.
   여기에 적어 두고, 앱이 뜰 때 다시 찾아간다 */
const SEAT_KEY = "zk_seat";

export function saveSeat(net){
  try {
    if (!net || net.code == null) return;
    localStorage.setItem(SEAT_KEY, JSON.stringify({
      code: net.code, matchID: net.matchID, playerID: net.playerID,
      credentials: net.credentials, numPlayers: net.numPlayers,
      opts: net.opts || null, at: Date.now(),
    }));
  } catch(e){}
}
export function loadSeat(){
  try {
    const raw = localStorage.getItem(SEAT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.code == null) return null;
    /* 너무 오래된 것은 안 쓴다 — 서버에서도 이미 지워졌을 것이다 */
    if (Date.now() - (s.at || 0) > 6 * 60 * 60 * 1000){ clearSeat(); return null; }
    return s;
  } catch(e){ return null; }
}
export function clearSeat(){ try { localStorage.removeItem(SEAT_KEY); } catch(e){} }

/* 판 화면에 들어섰다고 알린다.
   이 신호가 다 모일 때까지 서버 봇은 새 판에서 한 수도 두지 않는다.
   안 알리면 등수·세금 화면을 보는 동안 봇이 다 둬 버린다 */
export const sayReady = (code, seat) =>
  api(`/zoo/rooms/${code}/ready`, { seat }).catch(() => null);
