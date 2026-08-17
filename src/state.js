/* 게임 한 판의 상태와 방 조건을 한곳에서 들고 있는다.
   화면 코드가 아직 window 를 통해 읽으므로 양쪽에 걸어 둔다.
   Firebase 를 붙일 때 이 파일만 서버와 맞추면 된다. */

export const opts = { cap: 4, rounds: 3, tax: true, clear2: false, seated: 0 };

export const game = {
  N: 6,
  roundNo: 1,
  names: [], namesEn: [],
  hold: null,        /* 자리별 손패 */
  order: null,       /* 이번 판 순서 (앞이 선) */
  finish: null,      /* 지난 판 완주 순서 */
  score: [],
};

export function resetGame(n){
  game.N = n;
  game.roundNo = 1;
  game.hold = null;
  game.order = null;
  game.finish = null;
  game.score = Array(n).fill(0);
}

/* 화면 코드가 쓰는 전역 (옮기는 동안만 유지) */
if (typeof window !== "undefined"){
  window.__opts = opts;
  window.GAME = game;
}
