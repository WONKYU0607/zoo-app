/* 게임 한 판이 흘러가는 순서를 여기서 정한다.

     방 대기실 → 뽑기 → 판
     → (판 끝) 마지막 장면 → 결과(이번 판 등수) → 혁명·세금 → 다음 판
     → … → 마지막 판이면 최종 결과

   화면 전환과 계정은 밖에서 넣어 준다(goto/보고). 그래야 검사에서 이 파일을
   그대로 돌려볼 수 있다. main.js 는 이걸 설치만 한다. */

import * as eng from "./engine.js";
import { createRoom, addBot, setCap, toRoomView, seatCount } from "./localroom.js";

let opt = null;             /* { goto, boot, myName } */
let myRoom = null;
let botTimer = null;

const W = () => window;
const call = (name, ...a) => { const f = W()[name]; if (typeof f === "function") f(...a); };

function emitRoom(){
  W().__room = toRoomView(myRoom);
  W().dispatchEvent(new Event("roomchange"));
}

/* ---------- 방 ---------- */

function botFillStart(){
  if (botTimer) return;
  botTimer = setInterval(() => { if (!addOneBot()) botFillStop(); }, opt.botJoinMs);
}
function botFillStop(){ if (botTimer){ clearInterval(botTimer); botTimer = null; } }

function addOneBot(){
  if (!addBot(myRoom)) return false;
  W().__opts.seated = seatCount(myRoom);
  emitRoom();
  return true;
}

/* ---------- 판 세우기 ---------- */

function startGame(){
  botFillStop();
  while (seatCount(myRoom) < 4) if (!addOneBot()) break;
  const n = seatCount(myRoom);
  if (n < 4) throw new Error("4명이 모여야 시작합니다 (지금 " + n + "명)");

  myRoom.phase = "playing";
  emitRoom();

  const o = W().__opts || {};
  const rounds = Math.max(3, Number(o.rounds) || 3);
  eng.startLocal({
    numPlayers: n,
    myID: "0",
    names: myRoom.seats.map(s => s.name),
    opts: { rounds, tax: o.tax !== false, clear2: Boolean(o.clear2) },
  });

  /* 뽑기 화면을 보는 동안 봇들이 다 둬 버리면, 판에 들어서자마자 내 차례가 된다.
     판 화면이 실제로 설 때(__bootTable)까지 멈춰 둔다 */
  eng.setPaused(true);

  const v = eng.engine.view;
  if (!v) throw new Error("판을 세우지 못했습니다");

  W().__net = { engine: true };            /* 뽑기 화면이 선을 엔진에서 받게 한다 */
  W().GAME = {
    N: n,
    roundNo: v.roundNo,
    names: v.names.slice(),
    namesEn: v.names.slice(),
    hold: null, order: null, finish: null,
    score: v.score.slice(),
    mySeat: 0,
  };
  W().__opts = Object.assign(W().__opts || {}, { seated: n, rounds });
  W().__leadSeat = v.turn >= 0 ? v.turn : 0;
  W().GAME.order = Array.from({ length: n }, (_, k) => (W().__leadSeat + k) % n);
  W().__roundNo = v.roundNo;
  W().__myRankIdx = null;
  W().__scored = null;
  W().__gameOver = null;

  opt.goto("draw");
}

/* ---------- 판이 끝났을 때 ---------- */
/* 순서: 결과(이번 판 등수) → 혁명·세금 → 다음 판.
   결과에서 "다음"을 누르면 nav.js 가 세금으로, 세금에서 "판 시작"을 누르면 판으로 보낸다. */

function onRoundEnd(v){
  const lr = v.lastRound;
  if (!lr){ eng.setPaused(false); return; }
  eng.setPaused(true);                     /* 보는 동안 다음 판은 멈춰 둔다 */

  const G = (W().GAME = W().GAME || {});
  G.N = v.N;
  G.names = v.names.slice();
  G.namesEn = v.names.slice();
  G.finish = lr.order.slice();             /* 이번 판 등수 */
  G.score = v.score.slice();
  /* 화면은 자리마다 손패 배열 하나씩을 기대한다. 남의 것은 원래 모르므로 빈 배열 */
  G.hold = Array.from({ length: v.N }, (_, i) => (i === 0 ? v.hand.slice() : []));
  G.roundNo = lr.roundNo;                  /* 방금 끝난 판 번호 */
  W().__roundNo = lr.roundNo;
  W().__myGive = null;
  W().__taxGive = null;
  W().__revolution = v.revolution ? { seat: v.revolution.seat, great: v.revolution.great } : null;

  opt.goto("result");                      /* 먼저 이번 판 결과 */
}

function onGameOver(over){
  eng.setPaused(true);
  const G = (W().GAME = W().GAME || {});
  G.roundNo = (W().__opts && W().__opts.rounds) || G.roundNo || 3;
  G.finish = over.order.slice();
  G.score = over.score.slice();
  opt.goto("result");                      /* 마지막 판이면 최종 결과가 그려진다 */
}

/* 세금을 아직 안 냈으면 대신 내 준다.
   안 그러면 엔진이 세금 단계에서 영원히 기다린다 — 화면은 판으로 넘어갔는데
   봇들은 아무도 두지 않는 상태가 된다. 실제로 그렇게 멈추는 것을 검사에서 잡았다. */
function ensureTaxGiven(){
  const v = eng.engine.view;
  if (!v || v.phase !== "tax" || !v.taxGive) return;
  const worst = c => (c >= 13 ? 99 : c);
  const hand = (v.hand || []).slice().sort((a, b) => worst(b) - worst(a));
  if (hand.length < v.taxGive) return;
  eng.give(hand.slice(0, v.taxGive));
}

/* ---------- 설치 ---------- */

export function install({ goto, myName = () => "나", botJoinMs = 2500 } = {}){
  opt = { goto, myName, botJoinMs };

  W().__createRoom = async () => {
    const o = W().__opts || {};
    myRoom = createRoom({ cap: o.cap || 4, name: opt.myName() });
    W().__opts = Object.assign(W().__opts || {}, { cap: myRoom.cap, seated: 1 });
    emitRoom();
    botFillStart();
    return "LOCAL";
  };
  W().__joinRoom = async () => {
    alert("서버 대전은 아직 준비 중입니다. 봇과 하기로 시작해 주세요.");
    return null;
  };
  W().__peek = async () => null;
  W().__roomCode = () => (myRoom ? myRoom.code : null);
  W().__leaveRoom = () => { botFillStop(); eng.stop(); myRoom = null; emitRoom(); };
  W().__saveOpts = async () => {
    if (!myRoom) return;
    setCap(myRoom, (W().__opts || {}).cap);
    W().__opts.cap = myRoom.cap;
    W().__opts.seated = seatCount(myRoom);
    emitRoom();
  };
  W().__botFill = on => (on ? botFillStart() : botFillStop());
  W().__addBot = addOneBot;
  W().__startRound = async () => startGame();

  /* 판 화면이 알려 주는 것들 */
  W().__onRoundEnd  = onRoundEnd;
  W().__onGameOver  = () => { const o = W().__gameOver; if (o) onGameOver(o); };
  W().__onTax       = v => { W().__myNeedGive = v.taxGive; };
  W().__setTaxGive  = cards => {
    W().__taxGive = cards;
    if (Array.isArray(cards) && cards.length) eng.give(cards);
  };
  W().__endRoundOnline = async () => {};

  /* 판 화면이 서는 순간 멈춰 둔 것을 푼다.
     세금 화면의 "판 시작"은 __toTable 을 거치지 않고 곧장 판으로 가기 때문에,
     여기(판 화면이 서는 곳)에서 풀어야 빠짐없이 걸린다 */
  const prevBootTable = W().__bootTable;
  W().__bootTable = fresh => {
    ensureTaxGiven();                      /* 안 낸 세금이 있으면 대신 낸다 */
    eng.setPaused(false);
    if (typeof prevBootTable === "function") prevBootTable(fresh);
  };
  const prevToTable = W().__toTable;
  W().__toTable = () => {
    eng.setPaused(false);
    if (typeof prevToTable === "function") prevToTable();
    else opt.goto("table");
  };

  /* 마지막 판 결과에서 "다음"을 누르면 새 게임을 세운다 */
  W().__onRestart = () => {
    eng.stop();
    if (!myRoom) return opt.goto("lobby");
    myRoom.phase = "waiting";
    emitRoom();
    opt.goto("room");
  };

  W().__quitGame = () => { eng.stop(); eng.setPaused(false); };
}

export function teardown(){
  botFillStop();
  eng.stop();
  myRoom = null;
}
