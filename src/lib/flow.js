/* 게임 한 판이 흘러가는 순서를 여기서 정한다.

     방 대기실 → 뽑기 → 판
     → (판 끝) 마지막 장면 → 결과(이번 판 등수) → 혁명·세금 → 다음 판
     → … → 마지막 판이면 최종 결과

   화면 전환과 계정은 밖에서 넣어 준다(goto/보고). 그래야 검사에서 이 파일을
   그대로 돌려볼 수 있다. main.js 는 이걸 설치만 한다. */

import * as eng from "./engine.js";
import { createRoom, addBot, setCap, toRoomView, seatCount } from "./localroom.js";
import * as lobby from "./lobby.js";

let opt = null;             /* { goto, boot, myName } */
let myRoom = null;
let botTimer = null;
/* 서버 대전 — 서버가 정한 자리와 자리표를 그대로 들고 있는다 */
let net = null;            /* { code, matchID, playerID, credentials, numPlayers } */
let pollId = null;
let offView = null;        /* 엔진 상태 구독 해제 */

const W = () => window;
const D = () => window.document;
const call = (name, ...a) => { const f = W()[name]; if (typeof f === "function") f(...a); };

function emitRoom(){
  W().__room = net ? netRoomView() : toRoomView(myRoom);
  W().dispatchEvent(new Event("roomchange"));
}

/* 서버가 알려 준 자리들을 방 대기실이 읽는 모양으로 */
function netRoomView(){
  if (!net) return null;
  const seats = new Array(net.numPlayers).fill(null);
  (net.players || []).forEach(p => {
    const i = Number(p.id);
    if (!p.name) return;
    seats[i] = {
      uid: "s" + i, name: p.name, bot: Boolean(p.bot),
      avatar: Number(p.avatar) || 0,
      off: Boolean(p.away), left: Boolean(p.left),
    };
  });
  return {
    code: net.code,
    cap: net.numPlayers,
    me: Number(net.playerID),
    host: net.playerID === "0" ? "s0" : "host",
    phase: net.started ? "playing" : "waiting",
    round: null,
    seats,
  };
}

/* 방 대기실에 있는 동안 서버 상태를 계속 받아 온다 */
/* 방 상태를 한 번 받아 온다.

   방장이 인원을 바꾸면 서버가 **판을 새로 만든다**. 그러면 내 자리 번호와
   자격증명이 달라지므로 그때마다 받아서 갈아 끼워야 한다.
   안 그러면 옛 판에 붙은 채로 남아 게임이 시작돼도 아무것도 안 보인다 */
async function refreshNet(){
  if (!net) return null;
  const r = await lobby.peekRoom(net.code, net.playerID);
  net.players = r.players;
  net.started = r.started;
  if (r.numPlayers) net.numPlayers = r.numPlayers;
  if (r.matchID) net.matchID = r.matchID;
  if (r.you && r.you.playerID != null){
    net.playerID = String(r.you.playerID);
    if (r.you.credentials) net.credentials = r.you.credentials;
  }
  W().__opts.seated = (r.players || []).filter(p => p.name).length;
  /* __opts.cap 은 **방장이 고르고 있는 값**이다. 여기서 서버 값으로 덮으면,
     설정 창에서 숫자를 올려 놓은 사이에 1.5초짜리 확인이 끼어들어 되돌려 버린다.
     그래서 처음 바꿀 때는 안 먹고 두 번째에야 먹혔다.
     서버 값은 __room.cap 으로 내려가고 방 화면은 그걸 본다 */
  emitRoom();
  return r;
}

/* 내가 고른 얼굴 */
function myAvatar(){
  const a = W().ACCOUNT || {};
  return Number(a.avatar) || 0;
}

/* 자리마다 고른 얼굴. 서버 방이면 서버가 알려 준 것, 이 기기 방이면 방이 들고 있다 */
function seatAvatars(n){
  const out = new Array(n).fill(0);
  if (net){
    (net.players || []).forEach(p => {
      const i = Number(p.id);
      if (i >= 0 && i < n) out[i] = Number(p.avatar) || 0;
    });
    return out;
  }
  if (myRoom) myRoom.seats.forEach((s, i) => { if (i < n) out[i] = (s && Number(s.avatar)) || 0; });
  return out;
}

function pollStart(){
  if (pollId || !net) return;
  pollId = setInterval(async () => {
    if (!net){ pollStop(); return; }
    try {
      const r = await refreshNet();
      /* 방장이 시작했으면 따라 들어간다 */
      if (r && r.started && !net.inGame) enterOnlineGame();
    } catch(e){ /* 잠깐 끊긴 것은 넘긴다 */ }
  }, 1500);
}
function pollStop(){ if (pollId){ clearInterval(pollId); pollId = null; } }

/* ---------- 방 ---------- */

function botFillStart(){
  if (botTimer) return;
  /* 빈자리가 있으면 계속 채운다. 꽉 찼다고 꺼버리면
     나중에 인원을 늘려도 아무도 안 들어온다 */
  botTimer = setInterval(() => {
    if (!myRoom || myRoom.phase !== "waiting") return;
    if (seatCount(myRoom) >= myRoom.cap) return;   /* 지금은 자리가 없다. 끄지는 않는다 */
    addOneBot();
  }, opt.botJoinMs);
}
function botFillStop(){ if (botTimer){ clearInterval(botTimer); botTimer = null; } }

function addOneBot(){
  if (!addBot(myRoom)) return false;
  W().__opts.seated = seatCount(myRoom);
  emitRoom();
  if (myRoom && seatCount(myRoom) >= myRoom.cap) startRoomCount(15);
  return true;
}

/* 방이 꽉 차면 방장이 안 눌러도 15초 뒤에 시작한다.
   사람이 안 누르면 아무도 게임을 못 하는 상태로 남는다 */
let roomCountId = null;
function stopRoomCount(){
  if (roomCountId){ clearInterval(roomCountId); roomCountId = null; }
  const b = D().querySelector("#room #action button");
  if (b) b.textContent = (b.textContent || "").replace(/\s*\(\d+\)$/, "");
}
function startRoomCount(sec){
  if (roomCountId) return;
  if (!myRoom) return;          /* 방이 없으면 셀 것도 없다 */
  const page = D().getElementById("room");
  if (!page) return;
  let left = sec;
  const tick = () => {
    const b = D().querySelector("#room #action button");
    if (!myRoom || myRoom.phase !== "waiting" || !page.classList.contains("is-on")){
      if (!myRoom || myRoom.phase !== "waiting"){ stopRoomCount(); }
      return;                                  /* 화면을 잠깐 벗어난 것뿐이면 계속 센다 */
    }
    if (!b || b.disabled) return;
    const base = (b.textContent || "").replace(/\s*\(\d+\)$/, "");
    if (left <= 0){ stopRoomCount(); b.click(); return; }
    b.textContent = base + " (" + left + ")";
    left--;
  };
  tick();
  roomCountId = setInterval(tick, 1000);
}

/* ---------- 판 세우기 ---------- */

function startGame(){
  if (net) return startOnlineGame();
  botFillStop();
  stopRoomCount();
  while (seatCount(myRoom) < 4) if (!addOneBot()) break;
  const n = seatCount(myRoom);
  if (n < 4) throw new Error("4명이 모여야 시작합니다 (지금 " + n + "명)");

  myRoom.phase = "playing";
  emitRoom();
  eng.setAuto(false);                      /* 새 게임은 자동치기 꺼진 채로 시작 */

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
  W().__opts = Object.assign(W().__opts || {}, { rounds });
  openTable(v, n, myRoom.seats.map(s => s.name));
}

/* 서버 대전 시작 — 빈자리는 서버가 봇으로 채운다 */
async function startOnlineGame(){
  stopRoomCount();
  await lobby.startRoom(net.code);
  const r = await lobby.peekRoom(net.code);
  net.players = r.players; net.started = true;
  emitRoom();
  enterOnlineGame();
}

function enterOnlineGame(){
  if (!net || net.inGame) return;
  net.inGame = true;
  pollStop();

  eng.startOnline({
    server: lobby.serverUrl(),
    matchID: net.matchID,
    playerID: net.playerID,
    credentials: net.credentials,
    numPlayers: net.numPlayers,
    names: (net.players || []).map(p => p.name || ""),
  });
  eng.setPaused(true);                    /* 판 화면이 설 때까지 멈춰 둔다 */

  /* 서버에서 첫 상태가 올 때까지 기다렸다가 화면을 세운다 */
  let tries = 0;
  const wait = setInterval(() => {
    const v = eng.engine.view;
    if (!v){ if (tries++ > 120){ clearInterval(wait); } return; }
    clearInterval(wait);
    openTable(v, net.numPlayers, (net.players || []).map(p => p.name || ""));
  }, 100);
}

/* 판 화면에 넘길 값을 세운다 (이 기기 방과 서버 대전이 같이 쓴다) */
function openTable(v, n, names){
  W().__net = { engine: true };
  W().GAME = {
    N: n,
    /* 화면 자리 → 그 자리에 앉은 사람(엔진 자리).
       얼굴 그림을 고를 때 쓴다. 화면 위치로 고르면 판이 바뀔 때 얼굴만 남는다.
       예전에는 뽑기 동안 이것을 자리 번호 그대로(0,1,2…) 두었는데,
       그러면 뽑기 화면에서 이름과 얼굴이 서로 다른 사람을 가리킨다.
       뽑기와 판이 같은 사람을 그리도록 처음부터 진짜 자리를 넣는다 */
    faces: v.seats.map(s => s.seat),
    seatFaces: v.seats.map(s => s.seat),
    /* 엔진 자리 → 그 사람이 고른 얼굴 번호. 방에 앉은 순서가 곧 엔진 자리다 */
    avatars: seatAvatars(n),
    roundNo: v.roundNo,
    names: v.names.slice(),
    namesEn: v.names.slice(),
    hold: null, order: null, finish: null,
    score: v.score.slice(),
    mySeat: 0,
  };
  W().__opts = Object.assign(W().__opts || {}, { seated: n });
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
  W().__taxCancelled = v.taxCancelled;
  W().__revolution = v.revolution
    ? { seat: v.revolution.seat, great: v.revolution.great, mine: v.revolution.mine }
    : null;

  opt.goto("result");                      /* 먼저 이번 판 결과 */
  startCount(5);                           /* 5초 뒤 저절로 다음 단계로 */
}

function onGameOver(over){
  stopCount();                             /* 최종 결과는 저절로 넘어가지 않는다 */
  eng.setPaused(true);
  const G = (W().GAME = W().GAME || {});
  G.roundNo = (W().__opts && W().__opts.rounds) || G.roundNo || 3;
  G.finish = over.order.slice();
  G.score = over.score.slice();
  opt.goto("result");                      /* 마지막 판이면 최종 결과가 그려진다 */
}

/* 판 결과 화면은 5초 뒤에 저절로 다음으로 넘어간다.
   누르지 않으면 게임이 멈춰 있는다는 지적이 있었다 */
let countId = null;
function stopCount(){ if (countId){ clearInterval(countId); countId = null; } }
function startCount(sec){
  stopCount();
  const btn = D().querySelector("#result #next");
  const page = D().getElementById("result");
  if (!btn || !page) return;
  const base = (btn.textContent || "다음").replace(/\s*\(\d+\)$/, "");
  let left = sec;
  const tick = () => {
    if (!page.classList.contains("is-on")){ stopCount(); btn.textContent = base; return; }
    if (left <= 0){ stopCount(); btn.textContent = base; btn.click(); return; }
    btn.textContent = base + " (" + left + ")";
    left--;
  };
  tick();
  countId = setInterval(tick, 1000);
}

/* 세금을 아직 안 냈으면 대신 내 준다.
   안 그러면 엔진이 세금 단계에서 영원히 기다린다 — 화면은 판으로 넘어갔는데
   봇들은 아무도 두지 않는 상태가 된다. 실제로 그렇게 멈추는 것을 검사에서 잡았다. */
function ensureTaxGiven(){
  const v = eng.engine.view;
  if (!v || v.phase !== "tax") return;
  /* 선언을 안 하고 넘어가면 엔진이 계속 기다린다. 안 부른 것으로 처리한다.
     엔진이 대신 정해 주지 않는 것은 일부러다 — 쥐고도 안 부르는 것이 전략이므로,
     푸는 일은 화면(세금 화면 10초)과 여기(판으로 들어설 때)가 맡는다 */
  if (v.canDeclare) eng.passRev();
  if (!v.taxGive) return;
  const worst = c => (c >= 13 ? 99 : c);
  const hand = (v.hand || []).slice().sort((a, b) => worst(b) - worst(a));
  if (hand.length < v.taxGive) return;
  eng.give(hand.slice(0, v.taxGive));
}

/* ---------- 설치 ---------- */

export function install({ goto, myName = () => "나", botJoinMs = 3000 } = {}){
  opt = { goto, myName, botJoinMs };

  /* 화면이 보는 값을 엔진과 붙여 둔다.
     전에는 판이 끝날 때만 갱신해서, 혁명을 선언해 세금이 사라져도
     세금 화면은 한 판 내내 그 사실을 몰랐다 */
  if (offView) offView();
  offView = eng.onView(v => {
    if (!v) return;
    W().__taxCancelled = v.taxCancelled;
    W().__revolution = v.revolution
      ? { seat: v.revolution.seat, great: v.revolution.great, mine: v.revolution.mine }
      : null;
    W().__myNeedGive = v.taxGive;
    W().__canDeclare = v.canDeclare;
  });

  W().__createRoom = async () => {
    const o = W().__opts || {};
    if (lobby.online()){
      const r = await lobby.createRoom({
        numPlayers: o.cap || 4, name: opt.myName(), avatar: myAvatar(),
        rounds: o.rounds || 3, tax: o.tax !== false, clear2: Boolean(o.clear2),
      });
      /* 서버가 참가자 목록을 보내오기 전까지 내 자리만이라도 채워 둔다 */
      net = Object.assign({ started: false, inGame: false }, r,
        { players: [{ id: 0, name: opt.myName() }] });
      W().__opts = Object.assign(W().__opts || {}, { cap: r.numPlayers, seated: 1 });
      emitRoom();
      pollStart();
      return r.code;
    }
    myRoom = createRoom({ cap: o.cap || 4, name: opt.myName(), avatar: myAvatar() });
    W().__opts = Object.assign(W().__opts || {}, { cap: myRoom.cap, seated: 1 });
    emitRoom();
    botFillStart();
    return myRoom.code;
  };

  /* 빠른 참가 — 서버가 자리 남은 방을 찾아 준다.
     서버가 없으면(이 기기 방) 그냥 새 방을 만든다 */
  W().__quickJoin = async () => {
    const o = W().__opts || {};
    if (!lobby.online()) return W().__createRoom();
    const r = await lobby.quickJoin({
      name: opt.myName(), avatar: myAvatar(),
      numPlayers: o.cap || 4, rounds: o.rounds || 3,
      tax: o.tax !== false, clear2: Boolean(o.clear2),
    });
    net = Object.assign({ started: false, inGame: false }, r,
      { players: [{ id: Number(r.playerID), name: opt.myName() }] });
    W().__opts = Object.assign(W().__opts || {},
      { cap: r.numPlayers, seated: 1, rounds: (r.opts && r.opts.rounds) || o.rounds || 3 });
    emitRoom();
    pollStart();
    return r.code;
  };

  W().__joinRoom = async code => {
    if (!lobby.online()){
      alert("서버 대전을 쓰려면 게임 서버 주소가 필요합니다.");
      return null;
    }
    const r = await lobby.joinRoom(String(code).trim(), opt.myName(), myAvatar());
    net = Object.assign({ started: false, inGame: false }, r,
      { players: [{ id: Number(r.playerID), name: opt.myName() }] });
    W().__opts = Object.assign(W().__opts || {}, {
      cap: r.numPlayers, rounds: (r.opts && r.opts.rounds) || 3,
      tax: !(r.opts && r.opts.tax === false), clear2: Boolean(r.opts && r.opts.clear2),
    });
    emitRoom();
    pollStart();
    return r.code;
  };

  W().__peek = async code => {
    if (!lobby.online()) return null;
    try { return await lobby.peekRoom(String(code).trim()); } catch(e){ return null; }
  };
  W().__roomCode = () => (net ? net.code : (myRoom ? myRoom.code : null));
  W().__leaveRoom = () => {
    botFillStop(); stopRoomCount(); pollStop(); eng.stop();
    myRoom = null; net = null; emitRoom();
  };
  W().__saveOpts = async () => {
    /* 서버 방이면 서버가 판을 새로 만들어야 한다 — 인원수는 판을 만들 때 정해진다 */
    if (net){
      const want = (W().__opts || {}).cap;
      if (!want || want === net.numPlayers) return;
      try {
        const r = await lobby.setRoomCap(net.code, want, net.playerID);
        net.numPlayers = r.numPlayers;
        if (r.matchID) net.matchID = r.matchID;
        if (r.seatMap && r.seatMap[Number(net.playerID)] != null)
          net.playerID = String(r.seatMap[Number(net.playerID)]);
        W().__opts.cap = r.numPlayers;
        await refreshNet();
      } catch(e){
        /* 못 바꿨으면 화면을 원래대로 되돌린다. 바뀐 척하면 안 된다 */
        W().__opts.cap = net.numPlayers;
        emitRoom();
        alert((e && e.message || "").replace(/^\S+ \d+ /, "") || "인원을 바꾸지 못했습니다");
      }
      return;
    }
    if (!myRoom) return;
    setCap(myRoom, (W().__opts || {}).cap);
    W().__opts.cap = myRoom.cap;
    W().__opts.seated = seatCount(myRoom);
    emitRoom();
    /* 인원을 늘렸으면 빈자리가 생겼으니 다시 채우고, 초읽기는 접는다 */
    if (seatCount(myRoom) < myRoom.cap){ stopRoomCount(); botFillStart(); }
    else startRoomCount(15);
  };
  W().__botFill = on => (on ? botFillStart() : botFillStop());
  W().__addBot = addOneBot;
  W().__startRound = async () => startGame();

  /* 판 화면이 알려 주는 것들 */
  W().__onRoundEnd  = onRoundEnd;
  W().__onGameOver  = () => { const o = W().__gameOver; if (o) onGameOver(o); };
  W().__onTax       = v => { W().__myNeedGive = v.taxGive; };
  /* 내가 직접 뒀다는 신호. 안 보내면 서버가 자리비움으로 본다 */
  W().__iMoved = () => { if (net) lobby.keepAlive(net.code, Number(net.playerID)); };
  /* 혁명 선언 — 화면의 단추가 부른다 */
  W().__declareRev = () => eng.declareRev();
  W().__passRev    = () => eng.passRev();
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
    stopCount();
    /* 판에 들어설 때 비로소 자리대로 앉힌다 */
    const G0 = W().GAME;
    if (G0 && G0.seatFaces) G0.faces = G0.seatFaces.slice();
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

  /* 방 초읽기도 같이 멈춘다. 안 끄면 다음 방에서 초읽기가 아예 안 시작한다
     (startRoomCount 가 "이미 세는 중"으로 보고 그냥 돌아간다) */
  W().__quitGame = () => {
    stopCount(); stopRoomCount(); botFillStop(); eng.stop(); eng.setPaused(false);
  };

  /* 결과 화면의 "나가기" — 세던 것을 멈추고 판도 접는다 */
  const quit = D().querySelector("#result #quit");
  if (quit) quit.addEventListener("click", () => { stopCount(); eng.stop(); myRoom = null; });
}

export function teardown(){
  botFillStop();
  stopRoomCount();
  stopCount();
  pollStop();
  if (offView){ offView(); offView = null; }
  net = null;
  eng.stop();
  myRoom = null;
}
