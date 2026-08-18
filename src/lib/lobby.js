/* 게임 서버의 방 창구.

   서버 주소(VITE_GAME_SERVER)가 없으면 서버 대전은 아예 끄고 이 기기 방으로만 논다.
   자리 번호는 서버가 정한 것을 그대로 쓴다 — 여기서 돌리지 않는다. */

/* 주소는 빌드 때 VITE_GAME_SERVER 로 넣는다.
   앱 껍데기(안드로이드)나 검사에서는 globalThis.__ZOO_SERVER 로도 넣을 수 있다 */
export const serverUrl = () =>
  (typeof globalThis !== "undefined" && globalThis.__ZOO_SERVER) ||
  ((import.meta && import.meta.env && import.meta.env.VITE_GAME_SERVER) || "");
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
export const createRoom = ({ numPlayers, name, rounds, tax, clear2 }) =>
  api("/zoo/rooms", { numPlayers, name, rounds, tax, clear2 });

/* 번호로 참가 — 빈자리 중 앞쪽에 앉는다 */
export const joinRoom = (code, name) =>
  api(`/zoo/rooms/${code}/join`, { name });

/* 방 들여다보기 — 참가자·자리비움·이탈 */
export const peekRoom = code => api(`/zoo/rooms/${code}`);

/* 시작 — 빈자리를 봇으로 채우고 서버가 대리인을 붙인다 */
export const startRoom = code => api(`/zoo/rooms/${code}/start`, {});

/* 내가 직접 뒀다고 알린다 — 자리비움 판정을 되돌린다 */
export const keepAlive = (code, seat) =>
  api(`/zoo/rooms/${code}/alive`, { seat }).catch(() => null);
