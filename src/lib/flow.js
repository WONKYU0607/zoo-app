/* 게임 한 판이 흘러가는 순서를 여기서 정한다.

     방 대기실 → 뽑기 → 판
     → (판 끝) 마지막 장면 → 결과(이번 판 등수) → 혁명·세금 → 다음 판
     → … → 마지막 판이면 최종 결과

   화면 전환과 계정은 밖에서 넣어 준다(goto/보고). 그래야 검사에서 이 파일을
   그대로 돌려볼 수 있다. main.js 는 이걸 설치만 한다. */

import * as eng from "./engine.js";
import { createRoom, addBot, setCap, toRoomView, seatCount, seatLabel } from "./localroom.js";
import * as lobby from "./lobby.js";
import { botLabel } from "./botnames.js";

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
  syncGameAvatars();
  W().dispatchEvent(new Event("roomchange"));
}

/* 서버는 봇 이름을 **번호**로 준다. 여기서 지금 언어의 이름으로 바꾼다.
   한 방에 한국 사람과 외국 사람이 같이 있어도 각자 읽을 수 있는 이름을 본다.
   `botName` 이 없는 옛 서버면 서버가 준 글자를 그대로 쓴다 */
function seatName(p){
  if (p && p.bot && p.botName != null) return botLabel(p.botName, W().__lang || "ko");
  return (p && p.name) || "";
}

/* 서버가 알려 준 자리들을 방 대기실이 읽는 모양으로 */
function netRoomView(){
  if (!net) return null;
  const seats = new Array(net.numPlayers).fill(null);
  (net.players || []).forEach(p => {
    const i = Number(p.id);
    if (!p.name) return;
    seats[i] = {
      uid: "s" + i, seat: i, name: seatName(p), bot: Boolean(p.bot),
      avatar: Number(p.avatar) || 0,
      off: Boolean(p.away), left: Boolean(p.left),
    };
  });
  return {
    code: net.code,
    cap: net.numPlayers,
    me: Number(net.playerID),
    online: true,                   /* 서버 방 — 프로필 전적·강퇴가 된다 */
    /* 강퇴 — 이 방에서 몇 번 했고 몇 번까지 되는지(서버가 센다) */
    kicks: Number(net.kicks) || 0,
    kickMax: Number.isInteger(net.kickMax) ? net.kickMax : 2,
    /* 방장은 0번이 아니라 **서버가 알려 준 자리**다. 방장이 나가면 남은 사람에게 넘어간다.
       예전에는 손님 화면에서 이 값이 엉뚱한 글자("host")라 방장 표시도 안 떴다 */
    host: "s" + (Number.isInteger(net.host) ? net.host : 0),
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
  const r = await lobby.peekRoom(net.code, net.key);
  /* **방장이 나를 내보냈다.** 자리도 하던 방 기록도 놓고 로비로 간다(알림은 화면이 띄운다).
     기다리는 동안 들어온 응답이라 net 이 이미 바뀌었을 수 있다 — 같은 방일 때만 */
  if (r && r.kicked && net && String(r.code) === String(net.code)){
    stopRoomCount(); pollStop();
    net = null;
    lobby.clearSeat();
    emitRoom();
    call("__closeProfile");
    call("__onKicked");
    return null;
  }
  net.players = r.players;
  if (Number.isInteger(r.kicks)) net.kicks = r.kicks;
  if (Number.isInteger(r.kickMax)) net.kickMax = r.kickMax;
  if (Number.isInteger(r.host)) net.host = r.host;
  net.started = r.started;
  if (r.numPlayers) net.numPlayers = r.numPlayers;
  if (r.matchID) net.matchID = r.matchID;
  if (r.you && r.you.playerID != null){
    net.playerID = String(r.you.playerID);
    if (r.you.credentials) net.credentials = r.you.credentials;
  }
  /* 새 판 세대를 기억하고, **하던 방 기록도 새 값으로 다시 적는다.**
     예전에는 방에 처음 들어갈 때만 적어서, 인원이 줄어 판이 새로 만들어지면
     기록에는 옛 판 번호·옛 자리표가 남았다. 새로고침으로 돌아오면
     **옛 6인 판(뽑기에서 멈춘 채 남은 것)에 붙었다** */
  if (Number.isInteger(r.gen)) net.gen = r.gen;
  lobby.saveSeat(net);
  W().__opts.seated = (r.players || []).filter(p => p.name).length;
  syncGameAvatars();
  /* 서버 방도 꽉 차면 방장이 안 눌러도 15초 뒤에 시작한다.
     이 기기 방에만 있던 것이라 서버 대전에서는 초읽기가 아예 없었다 */
  if (!r.started && isHost() &&
      W().__opts.seated >= (r.numPlayers || net.numPlayers)) startRoomCount(15);
  /* 방장이 아니게 됐으면(인원 줄이며 넘겨받은 게 아니라 되돌아간 경우 등) 초읽기를 접는다 */
  if (!isHost()) stopRoomCount();
  /* 방 설정의 진짜 값은 서버가 들고 있다 */
  if (r.opts) net.opts = r.opts;
  if (r.friends != null) net.friends = Boolean(r.friends);
  /* 손님 화면은 서버 값을 따른다 — 방장이 바꾼 판 수·세금이 손님에게도 보이게.
     **방장 화면은 덮지 않는다.** 설정 창에서 고르는 도중에 1.5초짜리 확인이 끼어들어
     되돌려 버린다(인원 수에서 겪은 문제, 위 설명 참고) */
  if (!isHost() && r.opts){
    W().__opts.rounds = r.opts.rounds || W().__opts.rounds;
    W().__opts.tax = r.opts.tax !== false;
    W().__opts.clear2 = Boolean(r.opts.clear2);
    W().__opts.friends = Boolean(r.friends);
  }
  /* __opts.cap 은 **방장이 고르고 있는 값**이다. 여기서 서버 값으로 덮으면,
     설정 창에서 숫자를 올려 놓은 사이에 1.5초짜리 확인이 끼어들어 되돌려 버린다.
     그래서 처음 바꿀 때는 안 먹고 두 번째에야 먹혔다.
     서버 값은 __room.cap 으로 내려가고 방 화면은 그걸 본다 */
  emitRoom();
  return r;
}

/* 서버 방에서 내가 방장인가 */
function isHost(){
  return Boolean(net) && String(net.playerID) === String(Number.isInteger(net.host) ? net.host : 0);
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

/* 얼굴 표를 최신으로 유지한다.

   예전에는 판을 열 때 한 번만 적어 두었다. 그런데 그 순간 서버가 알려 준
   사람 목록이 아직 덜 왔으면 다들 기본값(생쥐)이 되고, 1.5초 뒤 목록이 와도
   표는 그대로여서 **뽑기 화면이 한동안 전부 생쥐**로 보였다 */
function syncGameAvatars(){
  const g = W().GAME;
  if (!g || !g.N) return;
  const a = seatAvatars(g.N);
  if (a.some(v => v)) g.avatars = a;      /* 다 0 이면 아직 모르는 것이니 덮지 않는다 */
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
  if (myRoom && myRoom.friends) return;    /* 친구들끼리 하는 방은 봇 없음 */
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
  W().__roomLeft = null;
  if (b) b.textContent = (b.textContent || "").replace(/\s+\d+$/, "");
}
function startRoomCount(sec){
  if (roomCountId) return;
  if (!myRoom && !net) return;          /* 방이 없으면 셀 것도 없다 */
  const page = D().getElementById("room");
  if (!page) return;
  let left = sec;
  const tick = () => {
    const b = D().querySelector("#room #action button");
    const alive = net ? (net && !net.started) : (myRoom && myRoom.phase === "waiting");
    if (!alive || !page.classList.contains("is-on")){
      if (!alive) stopRoomCount();
      return;                                  /* 화면을 잠깐 벗어난 것뿐이면 계속 센다 */
    }
    if (!b || b.disabled) return;
    if (left <= 0){ stopRoomCount(); b.click(); return; }
    /* 남은 초를 여기에 적어 두면 방 화면이 다시 그릴 때도 그대로 붙는다.
       예전에는 단추 글자를 직접 고쳤는데, 1.5초마다 새로 그려지면서
       숫자가 사라졌다 붙었다 해서 **깜빡였다** */
    W().__roomLeft = left;
    const base = (b.textContent || "").replace(/\s+\d+$/, "");
    b.textContent = base + " " + left;
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
  if (!(myRoom && myRoom.friends)) while (seatCount(myRoom) < 4) if (!addOneBot()) break;
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
    names: myRoom.seats.map(seatLabel),
    opts: { rounds, tax: o.tax !== false, clear2: Boolean(o.clear2) },
  });

  /* 뽑기 화면을 보는 동안 봇들이 다 둬 버리면, 판에 들어서자마자 내 차례가 된다.
     판 화면이 실제로 설 때(__bootTable)까지 멈춰 둔다 */
  eng.setPaused(true);

  const v = eng.engine.view;
  if (!v) throw new Error("판을 세우지 못했습니다");
  W().__opts = Object.assign(W().__opts || {}, { rounds });
  openTable(v, n, myRoom.seats.map(seatLabel));
}

/* 서버 대전 시작 — 빈자리는 서버가 봇으로 채운다 */
async function startOnlineGame(){
  stopRoomCount();
  /* 방장 화면에 보이던 인원을 같이 보낸다 — 누르는 찰나 봇이 들어와도 보인 대로 시작 */
  const seen = (W().__opts && W().__opts.seated) || null;
  await lobby.startRoom(net.code, net.key, Number.isInteger(seen) ? seen : undefined);
  /* 서버가 방장 티켓을 한 장 뺐다 — 화면 숫자를 맞춘다 */
  call("__refreshAccount");
  /* **판 번호·자리·자리표를 다시 받아 온다.**
     8인 방에 4명일 때 시작하면 서버는 4인 판을 **새로 만들고 자리표도 새로 준다.**
     예전에는 여기서 사람 목록만 받아서, 방장은 옛 8인 판 번호와 옛 자리표를
     그대로 들고 붙었다 — 그래서 4인으로 뽑기에 들어갔다가 곧바로 8인이 됐다.
     다른 사람들은 `refreshNet()` 으로 들어가서 멀쩡했고 방장만 이랬다 */
  await refreshNet();
  net.started = true;
  emitRoom();
  enterOnlineGame();
}

function enterOnlineGame(){
  if (!net || net.inGame) return;
  net.inGame = true;
  pollStop();
  call("__closeProfile");               /* 대기실에서 열어 둔 프로필 창이 판 위에 남지 않게 */

  eng.startOnline({
    server: lobby.serverUrl(),
    matchID: net.matchID,
    playerID: net.playerID,
    credentials: net.credentials,
    numPlayers: net.numPlayers,
    names: (net.players || []).map(seatName),
  });
  eng.setPaused(true);                    /* 판 화면이 설 때까지 멈춰 둔다 */

  /* 서버에서 첫 상태가 올 때까지 기다렸다가 화면을 세운다 */
  let tries = 0;
  const wait = setInterval(() => {
    const v = eng.engine.view;
    if (!v){ if (tries++ > 120){ clearInterval(wait); } return; }
    clearInterval(wait);
    openTable(v, net.numPlayers, (net.players || []).map(seatName));
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
  /* **이미 굴러가고 있는 판이면 뽑기를 다시 하면 안 된다.**
     하던 방으로 돌아올 때 이 길을 그대로 타는데, 무조건 뽑기로 보내는 바람에
     **패 뽑기와 시작 카운트가 다시 떴다**(사용자 신고).
     아직 뽑는 중이면 뽑기로, 이미 시작했으면 판으로 바로 보낸다 */
  if (v.phase === "draw") opt.goto("draw");
  else { opt.goto("table"); if (W().__bootTable) W().__bootTable(true); }
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
  /* **이름·점수와 같은 자리 줄(지금 자리)의 등수**를 쓴다.
     `lr.order` 는 판 화면 마지막 장면용으로 그 판 자리 줄이라, 자리가 바뀐 판마다
     결과·세금 화면의 이름과 등수가 엇갈렸다(2026-09-30 재현) */
  G.finish = (lr.orderNow || lr.order).slice();   /* 이번 판 등수 */
  /* 화면 자리 → 엔진 자리. 결과·세금 화면이 얼굴을 고를 때 쓴다 */
  G.nowFaces = v.seats.map(s => s.seat);
  G.score = v.score.slice();
  /* 화면은 자리마다 손패 배열 하나씩을 기대한다. 남의 것은 원래 모르므로 빈 배열 */
  G.hold = Array.from({ length: v.N }, (_, i) => (i === 0 ? v.hand.slice() : []));
  G.roundNo = lr.roundNo;                  /* 방금 끝난 판 번호 */
  W().__roundNo = lr.roundNo;
  W().__myGive = null;
  W().__taxGive = null;
  W().__taxPending = null;
  /* **혁명·세금 취소는 지금 값으로.** v 는 판이 끝난 순간(2초 전, 판 화면이 마지막 장면을 보여 주기 전)의
     모습이다. 그 사이 봇이 혁명을 선언했으면 v 는 "아직 안 정함" 이라, 그대로 덮어쓰면 세금 화면이
     결과를 영영 못 보고 기다렸다(2026-09-30 발견 — 세금 화면이 쥔 사람의 결정을 기다리게 바꾸면서 드러남).
     같은 판이면 엔진의 지금 값을 쓴다 */
  const lv = (eng.engine.view && eng.engine.view.roundNo === v.roundNo) ? eng.engine.view : v;
  W().__taxCancelled = lv.taxCancelled;
  W().__revolution = lv.revolution
    ? { seat: lv.revolution.seat, great: lv.revolution.great, mine: lv.revolution.mine,
        /* 쥔 사람이 정했는가·선언했는가 — 세금 화면이 엔진이 정한 대로 보여 주는 데 쓴다 */
        decided: lv.revolution.decided, declared: lv.revolution.declared }
    : null;

  opt.goto("result");                      /* 먼저 이번 판 결과 */
  startCount(5);                           /* 5초 뒤 저절로 다음 단계로 */
}

function onGameOver(over){
  stopCount();                             /* 최종 결과는 저절로 넘어가지 않는다 */
  lobby.clearSeat();                       /* 끝난 게임은 이어서 할 것이 없다 */
  eng.setPaused(true);
  const G = (W().GAME = W().GAME || {});
  G.roundNo = (W().__opts && W().__opts.rounds) || G.roundNo || 3;
  G.finish = over.order.slice();
  G.score = over.score.slice();
  G.lions = (over.lions || []).slice();          /* 동점일 때 가르는 값 */
  const v0 = eng.engine.view;
  if (v0 && v0.seats) G.nowFaces = v0.seats.map(s => s.seat);
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

/* 엔진이 받아 줄 세금인가 — 장수가 맞고, 모두 지금 내 손에 있는 카드 */
function okGive(v, cards){
  if (!v || !Array.isArray(cards) || cards.length !== v.taxGive) return false;
  const left = (v.hand || []).slice();
  for (const c of cards){
    const k = left.indexOf(c);
    if (k < 0) return false;
    left.splice(k, 1);
  }
  return true;
}

/* 내 세금을 대신 낸다 — 세금 화면에서 시간이 다 됐을 때와 같은 기준.
   **카멜레온은 빼고 큰 숫자부터** (2026-09-30 결정). 카멜레온은 숫자 카드가 모자랄 때만 */
function giveAuto(v){
  if (!v || !(v.taxGive > 0)) return;
  const giveKey = c => (c >= 13 ? -1 : c);
  const hand = (v.hand || []).slice().sort((a, b) => giveKey(b) - giveKey(a));
  if (hand.length < v.taxGive) return;
  W().__taxGive = hand.slice(0, v.taxGive);
  eng.give(W().__taxGive.slice());
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
  /* **이미 골라 보냈으면 다시 보내지 않는다.** 보낸 직후에는 내 화면에 아직 안 들어와
     "안 냈다" 로 보일 수 있다. 그때 가장 나쁜 카드를 또 보내면 사람이 고른 것이 바뀌었다 */
  if (W().__taxGive && W().__taxGive.length) return;
  giveAuto(v);
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
      ? { seat: v.revolution.seat, great: v.revolution.great, mine: v.revolution.mine,
          decided: v.revolution.decided, declared: v.revolution.declared }
      : null;
    W().__myNeedGive = v.taxGive;
    W().__canDeclare = v.canDeclare;
    /* 들고 있던 세금 — 엔진이 받을 준비가 되면 보낸다 (__setTaxGive 설명 참고) */
    if (W().__taxPending && v.phase === "tax" && v.taxGive > 0){
      const c = W().__taxPending; W().__taxPending = null;
      if (okGive(v, c)) eng.give(c);
      else giveAuto(v);                  /* 엔진이 거부할 것이면 대신 낸다 (세금 화면 시간 넘김과 같은 기준) */
    }
    if (W().__taxPending && v.phase !== "tax") W().__taxPending = null;   /* 세금이 끝났거나 사라졌다 */
  });

  W().__createRoom = async () => {
    leaveIfSeated();
    const o = W().__opts || {};
    if (lobby.online()){
      const r = await lobby.createRoom({
        numPlayers: o.cap || 4, name: opt.myName(), avatar: myAvatar(),
        rounds: o.rounds || 3, tax: o.tax !== false, clear2: Boolean(o.clear2),
        friends: Boolean(o.friends),
      });
      /* 서버가 참가자 목록을 보내오기 전까지 내 자리만이라도 채워 둔다 */
      /* 얼굴을 안 실으면 서버가 알려 줄 때까지(1.5초) 생쥐로 보였다가 바뀐다 */
      net = Object.assign({ started: false, inGame: false, host: 0, friends: Boolean(o.friends) }, r,
        { players: [{ id: 0, name: opt.myName(), avatar: myAvatar() }] });
      lobby.saveSeat(net);           /* 새로고침·서버 재시작에도 돌아올 수 있게 */
      W().__opts = Object.assign(W().__opts || {}, { cap: r.numPlayers, seated: 1 });
      emitRoom();
      pollStart();
      return r.code;
    }
    myRoom = createRoom({ cap: o.cap || 4, name: opt.myName(), avatar: myAvatar() });
    myRoom.friends = Boolean(o.friends);
    W().__opts = Object.assign(W().__opts || {}, { cap: myRoom.cap, seated: 1 });
    emitRoom();
    botFillStart();
    return myRoom.code;
  };

  /* 빠른 참가 — 서버가 자리 남은 방을 찾아 준다.
     서버가 없으면(이 기기 방) 그냥 새 방을 만든다 */
  /* 새로 들어가기 전에 앉아 있던 자리를 비운다 */
  function leaveIfSeated(){
    if (net && net.code != null){
      lobby.leaveRoom(net.code, net.key);
    }
    botFillStop(); stopRoomCount(); pollStop();
    net = null;
    lobby.clearSeat();               /* 자리를 비웠으니 돌아갈 곳도 없다 */
  }

  W().__quickJoin = async () => {
    const o = W().__opts || {};
    /* 서버가 없으면 들어갈 남의 방도 없다 */
    if (!lobby.online()){ leaveIfSeated(); W().__quickNone = true; return null; }
    /* **먼저 들어가 보고, 된 다음에 앉아 있던 자리를 비운다.**
       예전에는 먼저 비워서, 들어갈 방이 없으면 원래 방 자리만 잃었다 */
    const r = await lobby.quickJoin({
      name: opt.myName(), avatar: myAvatar(),
      numPlayers: o.cap || 4, rounds: o.rounds || 3,
      tax: o.tax !== false, clear2: Boolean(o.clear2),
    });
    /* 들어갈 방이 없다 — 새로 만들지 않는다. 화면이 "방이 없습니다" 를 띄운다 */
    W().__quickNone = Boolean(r && r.none);
    if (!r || r.none || !r.code) return null;
    leaveIfSeated();
    net = Object.assign({ started: false, inGame: false }, r,
      { players: [{ id: Number(r.playerID), name: opt.myName(), avatar: myAvatar() }] });
    lobby.saveSeat(net);
    W().__opts = Object.assign(W().__opts || {},
      { cap: r.numPlayers, rounds: (r.opts && r.opts.rounds) || o.rounds || 3 });
    /* 화면을 열기 **전에** 먼저 방 상태를 받아 온다.
       안 그러면 나 혼자 앉아 있다가 1.5초 뒤에 나머지가 한꺼번에 나타난다 —
       들어가는 사람 입장에서는 이미 앉아 있는 사람들이 보여야 맞다 */
    try { await refreshNet(); } catch(e){ emitRoom(); }
    pollStart();
    return r.code;
  };

  W().__joinRoom = async code => {
    if (!lobby.online()){
      alert("서버 대전을 쓰려면 게임 서버 주소가 필요합니다.");
      return null;
    }
    /* **먼저 들어가 보고, 된 다음에 앉아 있던 자리를 비운다.**
       예전에는 먼저 비워서, 없는 번호를 넣으면 원래 대기실 자리만 잃고
       옛 대기실 화면이 연결 없이 남았다(2026-09-30 재현).
       실패는 그대로 던진다 — 부르는 쪽(nav)이 이유를 화면에 띄운다 */
    const r = await lobby.joinRoom(String(code).trim(), opt.myName(), myAvatar());
    leaveIfSeated();
    net = Object.assign({ started: false, inGame: false }, r,
      { players: [{ id: Number(r.playerID), name: opt.myName(), avatar: myAvatar() }] });
    lobby.saveSeat(net);
    W().__opts = Object.assign(W().__opts || {}, {
      cap: r.numPlayers, rounds: (r.opts && r.opts.rounds) || 3,
      tax: !(r.opts && r.opts.tax === false), clear2: Boolean(r.opts && r.opts.clear2),
      friends: Boolean(r.friends),
    });
    /* 화면을 열기 전에 방 상태를 먼저 받아 온다 — 앉아 있는 사람들이 바로 보이게 */
    try { await refreshNet(); } catch(e){ emitRoom(); }
    pollStart();
    return r.code;
  };

  /* 강퇴 — 방장이 대기실에서 누른다. 규칙(방장만·시작 전·2번까지)은 서버가 가린다.
     실패는 그대로 던진다 — 부르는 쪽(room.js)이 까닭을 알린다 */
  /* 프로필 창 전적 — 누를 때마다 서버에서 새로 받는다. 이 기기 방이면 없음(null) */
  W().__seatRecord = async seat => {
    if (!net || net.code == null) return null;
    try { return await lobby.seatRecord(net.code, seat); } catch(e){ return null; }
  };
  W().__kickSeat = async seat => {
    if (!net || net.code == null) return null;
    const r = await lobby.kickPlayer(net.code, net.key, Number(seat));
    if (r && Number.isInteger(r.kicks)) net.kicks = r.kicks;
    try { await refreshNet(); } catch(e){ emitRoom(); }
    return r;
  };

  W().__peek = async code => {
    if (!lobby.online()) return null;
    try { return await lobby.peekRoom(String(code).trim()); } catch(e){ return null; }
  };
  W().__roomCode = () => (net ? net.code : (myRoom ? myRoom.code : null));
  W().__leaveRoom = () => {
    /* 서버에도 알려 자리를 비운다. 안 그러면 다시 들어올 때 자리를 또 차지한다 */
    if (net && net.code != null){
      lobby.leaveRoom(net.code, net.key);
    }
    botFillStop(); stopRoomCount(); pollStop(); eng.stop();
    myRoom = null; net = null; lobby.clearSeat(); emitRoom();
  };
  W().__saveOpts = async () => {
    /* 서버 방이면 서버가 판을 새로 만들어야 한다 — 인원·판 수·세금은 판을 만들 때 정해진다.
       **인원만이 아니라 설정 전부를 보낸다.** 예전에는 인원만 가서, 방장이 5판·세금 끔으로
       바꿔도 서버는 3판·세금 켬으로 돌았다(2026-09-30 재현) */
    if (net){
      const o = W().__opts || {};
      const cur = net.opts || {};
      const want = {
        numPlayers: o.cap || net.numPlayers,
        rounds: o.rounds, tax: o.tax !== false, clear2: Boolean(o.clear2), friends: Boolean(o.friends),
      };
      const same = want.numPlayers === net.numPlayers && want.rounds === cur.rounds &&
        want.tax === (cur.tax !== false) && want.clear2 === Boolean(cur.clear2) &&
        want.friends === Boolean(net.friends);
      if (same) return;
      try {
        const r = await lobby.setRoomOpts(net.code, net.key, want);
        net.numPlayers = r.numPlayers;
        if (r.matchID) net.matchID = r.matchID;
        if (r.opts) net.opts = r.opts;
        if (r.friends != null) net.friends = Boolean(r.friends);
        if (Number.isInteger(r.host)) net.host = r.host;
        W().__opts.cap = r.numPlayers;
        stopRoomCount();          /* 인원이 바뀌었으니 초읽기는 15초부터 다시 */
        await refreshNet();       /* 새 자리·자리표는 열쇠로 받아 온다 */
      } catch(e){
        /* 못 바꿨으면 화면을 원래대로 되돌린다. 바뀐 척하면 안 된다 */
        W().__opts.cap = net.numPlayers;
        W().__opts.rounds = cur.rounds || W().__opts.rounds;
        W().__opts.tax = cur.tax !== false;
        W().__opts.clear2 = Boolean(cur.clear2);
        W().__opts.friends = Boolean(net.friends);
        emitRoom();
        alert((e && e.message || "").replace(/^\S+ \d+ /, "") || "설정을 바꾸지 못했습니다");
      }
      return;
    }
    if (!myRoom) return;
    setCap(myRoom, (W().__opts || {}).cap);
    W().__opts.cap = myRoom.cap;
    stopRoomCount();          /* 인원이 바뀌었으니 초읽기는 15초부터 다시 */
    W().__opts.seated = seatCount(myRoom);
    emitRoom();
    /* 인원을 늘렸으면 빈자리가 생겼으니 다시 채우고, 초읽기는 접는다 */
    if (seatCount(myRoom) < myRoom.cap){ stopRoomCount(); botFillStart(); }
    else startRoomCount(15);
  };
  /* 카드 내는 단계를 멈춰 둔다 (세금 단계는 그대로 돈다) */
  W().__holdPlay = on => eng.setPaused(Boolean(on));
  W().__botFill = on => (on ? botFillStart() : botFillStop());
  W().__addBot = addOneBot;
  W().__startRound = async () => startGame();

  /* 판 화면이 알려 주는 것들 */
  W().__onRoundEnd  = onRoundEnd;
  W().__onGameOver  = () => { const o = W().__gameOver; if (o) onGameOver(o); };
  W().__onTax       = v => { W().__myNeedGive = v.taxGive; };
  /* 내가 직접 뒀다는 신호. 안 보내면 서버가 자리비움으로 본다 */
  W().__iMoved = () => { if (net) lobby.keepAlive(net.code, net.key); };
  /* **자동치기로 둔 수도 "여기 있다" 는 신호다.**
     예전에는 손으로 둔 수만 알려서, 한 번 자리를 비웠다 돌아와 자동으로 두면
     서버가 끝까지 자리비움으로 보고 판이 끝날 때 **이탈**로 적었다(2026-09-30 재현) */
  eng.engine.onAutoMine = () => { if (net) lobby.keepAlive(net.code, net.key); };

  /* ---------- 하던 방으로 돌아가기 ----------

     새로고침하거나 서버가 껐다 켜지면 앱은 진입창부터 다시 시작한다.
     그런데 **서버는 방을 그대로 들고 있다**(판을 디스크에 적어 두므로).
     적어 둔 자리표로 그 방을 찾아 들어간다.

     `__resumable()` — 돌아갈 방이 아직 살아 있으면 그 정보를, 없으면 null.
       살아 있는지 서버에 직접 물어본다. 지워진 방으로 데려가면 안 되니까.
     `__resume()` — 실제로 들어간다. 시작 전이면 방 화면, 시작했으면 판 화면 */
  W().__resumable = async () => {
    const s = lobby.loadSeat();
    if (!s || !lobby.online()) return null;
    let r = null;
    /* 열쇠가 없는 옛 기록으로는 내 자리를 증명할 수 없다 */
    if (!s.key){ lobby.clearSeat(); return null; }
    try { r = await lobby.peekRoom(s.code, s.key); }
    catch(e){ r = null; }
    /* 방이 없어졌거나 내가 그 자리에 없으면 돌아갈 곳이 아니다.
       내 자리는 서버가 새 판 기준으로 알려 준 번호(you)로 본다 —
       판이 새로 만들어졌으면 적어 둔 번호는 옛 것이다 */
    if (!r || !r.code){ lobby.clearSeat(); return null; }
    if (!r.you || r.you.playerID == null){ lobby.clearSeat(); return null; }
    const myId = Number(r.you.playerID);
    const me = (r.players || []).find(p => p && Number(p.id) === myId);
    if (!me || me.left){ lobby.clearSeat(); return null; }
    return { code: s.code, started: Boolean(r.started), players: r.players || [] };
  };

  /* "돌아갈까요?" 에 **아니오** — 적어 둔 자리를 서버에서도 놓는다.
     예전에는 기기에서도 안 지우고 서버에도 안 알려서, 남은 사람들이 그 자리 차례마다
     20초씩 기다렸다(2026-09-30 재현) */
  W().__dropResume = () => {
    const s = lobby.loadSeat();
    if (s && s.key) lobby.leaveRoom(s.code, s.key);
    lobby.clearSeat();
  };

  W().__resume = async () => {
    const s = lobby.loadSeat();
    if (!s) return false;
    let r = null;
    try { r = s.key ? await lobby.peekRoom(s.code, s.key) : null; }
    catch(e){ r = null; }
    if (!r || !r.code || !r.you){ lobby.clearSeat(); return false; }

    /* **적어 둔 것보다 서버가 지금 알려 주는 것을 믿는다.**
       인원이 줄어 판이 새로 만들어졌으면 판 번호·자리·자리표가 다 바뀌었다.
       적어 둔 옛 값으로 붙으면 옛 판(뽑기에서 멈춘 것)에 들어간다 */
    const you = r.you || {};
    net = Object.assign({ started: Boolean(r.started), inGame: false }, {
      code: s.code,
      matchID: r.matchID || s.matchID,
      playerID: you.playerID != null ? String(you.playerID) : s.playerID,
      credentials: you.credentials || s.credentials,
      numPlayers: r.numPlayers || s.numPlayers,
      gen: Number.isInteger(r.gen) ? r.gen : s.gen,
      opts: r.opts || s.opts || null, players: r.players || [],
      key: s.key, host: Number.isInteger(r.host) ? r.host : 0, friends: Boolean(r.friends),
    });
    lobby.saveSeat(net);
    myRoom = s.code;
    W().__opts = Object.assign(W().__opts || {}, {
      cap: net.numPlayers,
      rounds: (net.opts && net.opts.rounds) || 3,
      tax: !(net.opts && net.opts.tax === false),
      clear2: Boolean(net.opts && net.opts.clear2),
      seated: (r.players || []).filter(Boolean).length,
    });
    emitRoom();
    if (net.started){ enterOnlineGame(); }      /* 이미 시작한 방 — 판으로 */
    else { W().__goto("room"); pollStart(); }   /* 아직 대기 중 — 방으로 */
    return true;
  };
  /* 혁명 선언 — 화면의 단추가 부른다 */
  W().__declareRev = () => eng.declareRev();
  W().__passRev    = () => eng.passRev();
  W().__setTaxGive  = cards => {
    if (!Array.isArray(cards) || !cards.length) return;
    if (W().__taxGive && W().__taxGive.length) return;   /* 한 번만 보낸다 */
    W().__taxGive = cards;
    /* **엔진이 받을 준비가 됐을 때 보낸다.**
       화면마다 세금 화면에 들어선 시각이 1~3초씩 다르다. 내 화면이 먼저 "세금" 단계에
       와도, 혁명을 쥔 사람이 아직 안 정했으면 엔진은 세금을 안 받는다(거부).
       예전에는 그대로 보내 거부당했고, 판 화면에 들어설 때 "아직 안 냈다" 로 보여
       가장 나쁜 카드(카멜레온)가 대신 나갔다(2026-09-30 사람 4명 판에서 재현).
       준비가 안 됐으면 들고 있다가 준비되는 순간 보낸다(아래 onView) */
    const v = eng.engine.view;
    if (v && v.phase === "tax" && v.taxGive > 0){
      /* 엔진이 거부할 것(장수가 틀리거나 손에 없는 카드)은 보내지 않고 대신 낸다(giveAuto).
         그대로 보내면 거부당한 채 "냈다" 로 쳐져, 판에 들어설 때 대신 내 주는 것(ensureTaxGiven)까지
         막혀 판이 멈췄다(2026-09-30 재현: 2장 낼 차례에 1장만 나감) */
      if (!okGive(v, cards)){ giveAuto(v); return; }
      eng.give(cards);
    }
    else W().__taxPending = cards;
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
    /* 서버 봇에게도 "이제 봐도 된다"고 알린다.
       화면 쪽 멈춤은 이 기기 판에만 통하고, 서버 대전의 봇은 서버에서 돈다 */
    if (net) lobby.sayReady(net.code, net.key);
    if (typeof prevBootTable === "function") prevBootTable(fresh);
  };
  const prevToTable = W().__toTable;
  W().__toTable = () => {
    eng.setPaused(false);
    if (net) lobby.sayReady(net.code, net.key);
    if (typeof prevToTable === "function") prevToTable();
    else opt.goto("table");
  };

  /* 마지막 판 결과에서 "다음"을 누르면 새 게임을 세운다 */
  /* 방 초읽기도 같이 멈춘다. 안 끄면 다음 방에서 초읽기가 아예 안 시작한다
     (startRoomCount 가 "이미 세는 중"으로 보고 그냥 돌아간다) */
  /* **판 화면이 붙여 둔 것을 덮어쓰지 않는다.**
     `table.js` 는 mount 할 때 `__quitGame` 에 "완주 실패로 기록"(점수 절반)을 걸어 둔다.
     여기(install)는 그보다 나중에 도므로, 그냥 넣으면 그것을 **통째로 덮어써서**
     나가기를 눌러도 점수가 아예 기록되지 않았다(확인창은 "완주 실패로 기록됩니다"
     라고 하는데 실제로는 0점, 판수도 안 늘었다. 나간 뒤 `__scored` 가 null 로
     남는 것으로 확인). 위의 `__bootTable`·`__toTable` 처럼 앞의 것을 불러 준다.
     **점수부터 적고** 판을 접는다 — 접은 뒤에 적으면 셀 것이 남아 있지 않다 */
  const prevQuitGame = W().__quitGame;
  W().__quitGame = () => {
    if (typeof prevQuitGame === "function"){
      try { prevQuitGame(); } catch(e){ console.error(e); }
    }
    stopCount(); stopRoomCount(); botFillStop(); eng.stop(); eng.setPaused(false);
    /* **나간 게임은 내 손에서 뗀다.**
       예전에는 "하던 방" 기록을 안 지워서, 다른 게임을 하고 로비로 돌아오면
       나간 게임으로 돌아가라고 물었다. 서버에도 나갔다고 알린다 —
       안 알리면 그 자리가 서버에서 계속 내 것으로 잡혀 있다 */
    if (net){ try { lobby.leaveRoom(net.code, net.key); } catch(e){} }
    net = null; myRoom = null; pollStop();
    lobby.clearSeat();
  };

  /* 결과 화면의 "나가기" — 세던 것을 멈추고 판도 접는다.

     **판 사이(아직 남은 판이 있을 때)에 나가면 게임 도중에 나간 것과 같다.**
     예전에는 서버에 아무 말도 안 해서, 남은 사람들이 그 사람 차례마다 20초씩
     기다렸다(2026-09-30 재현: 1판 50초 → 2판 6분 50초). 완주 실패 기록도 빠졌다.
     그래서 판 화면의 나가기(`__quitGame`)와 같은 길로 보낸다 — 점수 절반 기록 + 서버에 알림 */
  const quit = D().querySelector("#result #quit");
  if (quit) quit.addEventListener("click", () => {
    if (!W().__resultFinal && W().__quitGame){ W().__quitGame(); return; }
    stopCount(); eng.stop(); myRoom = null;
    if (net){ try { lobby.leaveRoom(net.code, net.key); } catch(e){} }
    net = null; pollStop();
    lobby.clearSeat();                    /* 끝난 게임도 돌아갈 곳이 아니다 */
  });
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
