/* 낸 소리 · 패스 소리가 **빠지지도 겹치지도 않는가**.

   진짜 판을 굴려서, 엔진이 둔 수와 화면이 울린 소리를 하나씩 맞춰 본다.
   브라우저도 서버도 필요 없다 — 화면이 소리를 고르는 부분(sndkey.js)에
   진짜 판 상태를 그대로 흘려 넣는다.

   여기서 잡으려는 것 두 가지:

   (1) **겹침** — 서버 대전은 내 화면이 먼저 반영하고 서버가 다시 확인해 준다.
       그 사이 옛 상태가 한 번 더 들어오는데, 그때 또 울리면 안 된다.
   (2) **빠짐** — 바퀴를 끝내는 마지막 패스 · 판 엎기(1번) · 마지막 카드는
       바닥과 패스 표시를 즉시 지운다. 그것만 보고 있으면 소리가 통째로 빠진다.
       이것 때문에 패스 단추를 눌러도 아무 소리가 안 나는 경우가 있었다.

   쓰는 법:  node test/passsound.test.mjs  */

import { Client } from "boardgame.io/dist/esm/client.js";
import { ZooPresident } from "../src/lib/game.js";
import { screenView } from "../src/lib/view.js";
import { isJoker } from "../src/lib/deck.js";
import { moveEvents, makeSeen } from "../src/lib/sndkey.js";

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  if (ok) { pass++; console.log("  [OK]   " + name + (note ? "  " + note : "")); }
  else    { fail++; console.log("  [실패] " + name + (note ? "  " + note : "")); }
};

const NAMES = ["나", "서연", "준호", "민지", "태윤", "하은", "지우", "도윤"];

/* 낼 수 있는 것 중 하나 고르기 (검사용 대충 판단) */
function pick(hand, cur){
  const cnt = {}; let jok = 0;
  hand.forEach(c => { if (isJoker(c)) jok++; else cnt[c] = (cnt[c] || 0) + 1; });
  const opts = []; const maxN = cur ? cur.num - 1 : 12;
  for (let num = 1; num <= maxN; num++){
    const same = cnt[num] || 0; if (!same) continue;
    if (cur){ const need = cur.count - same; if (need > jok) continue;
      opts.push({ num, count: cur.count }); }
    else opts.push({ num, count: same });
  }
  if (!opts.length) return (!cur && jok > 0) ? { num: 13, count: 1 } : null;
  return opts[Math.floor(Math.random() * opts.length)];
}

/* 화면이 하는 일을 그대로 흉내낸다 — table.js 의 sounds() 와 같은 판단 */
function makeEar(){
  const seen = makeSeen();
  let primed = false;
  const heard = [];                       /* 울린 소리: {kind, key} */
  return {
    heard,
    hear(v){
      const evs = moveEvents(v).filter(e => seen.add(e.key));
      if (evs.length && primed) evs.forEach(e => heard.push(e));
      primed = true;
    },
  };
}

/* 한 게임을 끝까지 굴리면서, 수를 둘 때마다 화면 상태를 흘려 넣는다.
   feed(v) 를 통해 되돌림 같은 장난도 끼워 넣을 수 있다 */
function playGame(n, hearFn, opts = {}){
  const c = Client({ game: ZooPresident, numPlayers: n, setupData: { rounds: 3, tax: true, clear2: Boolean(opts.clear2) } });
  c.start();
  for (let seat = 0; seat < n; seat++){
    const s0 = c.store.getState();
    if (s0.ctx.phase !== "draw") break;
    const free = s0.G.draw.by.map((v, i) => (v == null ? i : -1)).filter(i => i >= 0);
    c.updatePlayerID(String(seat));
    c.moves.takeCard(free[0]);
  }
  const moves = [];                        /* 엔진이 실제로 둔 수 */
  let guard = 0, lastNo = 0;
  const look = () => {
    const st = c.store.getState();
    if (st.G.moveNo && st.G.moveNo !== lastNo){
      lastNo = st.G.moveNo;
      moves.push({ no: st.G.moveNo, kind: st.G.lastMove.k, by: st.G.lastMove.by });
    }
    hearFn(screenView(st.G, st.ctx, "0", NAMES), st);
  };
  look();
  while (guard++ < 4000){
    const st = c.store.getState();
    if (!st || st.ctx.gameover) break;
    if (st.ctx.phase === "play"){
      const seat = Number(st.ctx.currentPlayer);
      c.updatePlayerID(String(seat));
      const p = pick(st.G.hands[seat], st.G.pile);
      if (p) c.moves.play(p.num, p.count); else c.moves.pass();
    } else if (st.ctx.phase === "tax"){
      /* 혁명·세금은 이 검사의 관심 밖 — 시키는 대로 넘긴다 */
      const G = st.G;
      if (G.revolution && !G.revDecided){
        c.updatePlayerID(String(G.revolution.seat));
        c.moves.passRev();
      } else {
        const need = Object.keys(G.given || {});
        let did = false;
        for (let s = 0; s < n; s++){
          const owe = G.taxOrder && G.taxOrder.find && G.taxOrder.find(t => t.from === s && !G.given[s]);
          if (owe){ c.updatePlayerID(String(s));
            c.moves.give(G.hands[s].slice(0, owe.count)); did = true; break; }
        }
        if (!did) break;
        void need;
      }
    } else break;
    look();
  }
  return moves;
}

console.log("\n=== 낸 소리 · 패스 소리 검사 ===\n");

/* ---------- 1. 빠짐 없는가 ---------- */
{
  let games = 0, allMoves = 0, heardAll = 0, missing = [], extra = 0;
  for (const n of [4, 5, 6, 8]){
    for (let g = 0; g < 3; g++){
      const ear = makeEar();
      const moves = playGame(n, v => ear.hear(v), { clear2: g % 2 === 1 });
      games++;
      /* 게임 처음이라 첫 상태에는 아직 둔 수가 없다 —
         (판 도중에 화면에 들어오면 그때 보이던 수 하나는 일부러 안 울린다) */
      const want = moves;
      allMoves += want.length;
      const got = new Set(ear.heard.map(h => h.key));
      want.forEach(m => { if (!got.has("m" + m.no)) missing.push(n + "인 m" + m.no + " " + m.kind); });
      heardAll += ear.heard.length;
      extra += Math.max(0, ear.heard.length - want.length);
    }
  }
  check("둔 수는 모두 소리가 난다", missing.length === 0,
        games + "게임 · 둔 수 " + allMoves + " · 울린 소리 " + heardAll +
        " · 빠짐 " + missing.length +
        (missing.length ? " " + missing.slice(0, 4).join(", ") : ""));
  check("안 둔 수는 안 울린다", extra === 0, "군더더기 " + extra);
}

/* ---------- 2. 바닥을 치우는 수도 울리는가 ----------
   바퀴를 끝내는 패스 · 판 엎기 · 마지막 카드가 여기 해당한다.
   예전 방식(바닥·패스 표시 보기)은 이것들을 통째로 놓쳤다 */
{
  let clearing = 0, heardClearing = 0;
  for (let g = 0; g < 6; g++){
    const ear = makeEar();
    let prevTrick = null, prevNo = 0;
    const marks = [];
    const moves = playGame(6, (v, st) => {
      /* 이 수가 바닥을 치웠는가 — 바퀴 번호가 올라갔으면 그렇다 */
      if (prevTrick !== null && st.G.trickNo !== prevTrick && st.G.moveNo !== prevNo)
        marks.push(st.G.moveNo);
      prevTrick = st.G.trickNo; prevNo = st.G.moveNo;
      ear.hear(v);
    }, { clear2: true });
    const first = moves.length ? moves[0].no : 0;
    const got = new Set(ear.heard.map(h => h.key));
    marks.forEach(no => {
      if (no <= first) return;
      clearing++;
      if (got.has("m" + no)) heardClearing++;
    });
  }
  check("바닥을 치우는 수도 소리가 난다", clearing > 0 && heardClearing === clearing,
        heardClearing + "/" + clearing + "번");
}

/* ---------- 3. 되돌림이 와도 두 번 안 울리는가 ----------
   서버가 확인해 줄 때 옛 상태가 한 번 더 들어오는 상황을 흉내낸다 */
{
  const ear = makeEar();
  const box = [];
  playGame(4, v => { box.push(v); });
  /* 세 번째 상태마다 **직전 것을 한 번 더** 끼워 넣는다 */
  const stream = [];
  box.forEach((v, i) => {
    stream.push(v);
    if (i > 1 && i % 3 === 0){ stream.push(box[i - 1]); stream.push(v); }
  });
  stream.forEach(v => ear.hear(v));
  const keys = ear.heard.map(h => h.key);
  const dup = keys.length - new Set(keys).size;
  check("되돌림이 와도 두 번 안 울린다", dup === 0,
        "상태 " + stream.length + "개 중 겹침 " + dup);
}

/* ---------- 4. 옛 서버(수 번호를 안 보냄) 대비 ----------
   번호가 없으면 예전처럼 바닥·패스 표시로 알아낸다.
   바닥을 치우는 수는 못 잡지만(원래 그렇다), **겹치지는 않아야** 한다 */
{
  const ear = makeEar();
  const box = [];
  playGame(4, v => {
    const old = Object.assign({}, v);
    delete old.moveNo; delete old.lastMove;      /* 옛 서버 흉내 */
    box.push(old);
  });
  const stream = [];
  box.forEach((v, i) => { stream.push(v); if (i % 3 === 0) stream.push(v); });
  stream.forEach(v => ear.hear(v));
  const keys = ear.heard.map(h => h.key);
  check("옛 서버에서도 소리는 난다", ear.heard.length > 5, ear.heard.length + "번");
  check("옛 서버에서도 두 번 안 울린다", keys.length === new Set(keys).size,
        "겹침 " + (keys.length - new Set(keys).size));
}

/* ---------- 5. 기억이 넘쳐도 되돌림을 놓치지 않는가 ----------
   예전에는 60개가 넘으면 기억을 통째로 비워서, 그 순간 되돌림이 안 걸러졌다 */
{
  const seen = makeSeen(240);
  for (let i = 0; i < 1000; i++) seen.add("m" + i);
  check("오래된 것만 버린다", seen.size === 240 && seen.has("m999") && !seen.has("m1"),
        "기억 " + seen.size + "개");
  check("바로 앞 것은 그대로 기억한다", !seen.add("m999"));
}

console.log("\n=== 통과 " + pass + " / 실패 " + fail + " ===\n");
process.exit(fail ? 1 : 0);
