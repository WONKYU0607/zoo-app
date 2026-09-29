import { scoped } from "../lib/scoped.js";
import { play as snd } from "../lib/sound.js";
import { avtFile } from "../lib/assets.js";
import * as eng from "../lib/engine.js";
import { RINGS as A_RINGS } from "../lib/assets.js";
import { ART_DECK as A_DECK } from "../lib/assets.js";
import "../styles/draw.css";

export function mount(root){

  /* 엔진 자리 → 그 사람이 고른 얼굴. GAME.avatars 가 없으면 첫 번째(생쥐) */
  function avtOf(seat){
    const g = window.GAME || {};
    const a = g.avatars || [];
    return avtFile(Number(a[seat]) || 0);
  }
  /* 화면 자리에 앉은 사람을 찾아 얼굴을 고른다. 표가 없으면 자리 번호 그대로 */
  const faceOf = i => {
    const g = window.GAME || {};
    /* seatFaces = 이 자리에 실제로 앉은 사람(엔진 자리). 이걸 써야 얼굴이 사람을 따라간다 */
    const f = g.seatFaces || g.faces;
    return (f && f[i] != null) ? f[i] : i;
  };

  const document = scoped(root);
  
  const ART = A_DECK;
  const el = id => document.getElementById(id);
  const isJ = c => c >= 13;
  const KO_N = ["사자","호랑이","불곰","코끼리","악어","여우","기린","멧돼지","원숭이","토끼","새","생쥐"];
  const EN_N = ["LION","TIGER","BEAR","ELEPHANT","CROCODILE","FOX","GIRAFFE","BOAR","MONKEY","RABBIT","BIRD","MOUSE"];
  const NAMES_KO = ["나","민지","준호","서연","태윤","하은","지훈","예린"];
  const NAMES_EN = ["You","Minji","Junho","Seoyeon","Taeyun","Haeun","Jihoon","Yerin"];
  
  const T = {
    ko:{ step:"첫 순서 정하기",
         h:"카드를 한 장 뽑으세요",
         s:"숫자가 가장 낮은 분이 먼저 시작합니다. 차례는 거기서 시계 방향으로 돕니다. 카멜레온은 13으로 칩니다.",
         waitH:"뽑는 중",
         waitS:n=>'<b>'+n+'</b>님이 고르고 있습니다.', settling:"뽑은 카드를 맞춰 보는 중입니다.",
         doneH:"순서가 정해졌습니다", first:"선",
         doneS:n=>'<b>'+n+'</b>님이 먼저 시작합니다. 차례는 여기서 시계 방향입니다.',
         note:"첫 판은 계급도 세금도 없습니다.",
         goIn:n=>n+"초 뒤 시작합니다", picking:"고르는 중" },
    en:{ step:"Opening draw",
         h:"Draw one card",
         s:"The lowest number leads. Turn order runs clockwise from that seat. A chameleon counts as 13.",
         waitH:"Drawing",
         waitS:n=>'<b>'+n+'</b> is choosing.', settling:"Comparing the draws.",
         doneH:"Turn order is set", first:"LEAD",
         doneS:n=>'<b>'+n+'</b> leads. Turns run clockwise from there.',
         note:"The first round has no ranks and no tax.",
         goIn:n=>"Starting in "+n, picking:"Choosing" }
  };
  let lang = window.__lang || "ko";
  let online = false;
  let N = 6;
  /* 진짜 이름을 쓴다. 예전에는 아래 붙박이 목록을 자리 번호로 그냥 꺼내 썼는데,
     그 목록의 순서가 실제 자리 순서와 달라서 이름과 얼굴이 서로 어긋났다.
     방을 거치지 않고 이 화면만 열렸을 때만 붙박이 목록으로 되돌아간다 */
  const nameOf = i => {
    const g = window.GAME || {};
    const list = (lang === "ko" ? g.names : (g.namesEn || g.names));
    const v = list && list[i];
    return (v == null || v === "") ? (lang === "ko" ? NAMES_KO : NAMES_EN)[i] : v;
  };
  const art = n => n === 13 ? ART.jokerA : n === 14 ? ART.jokerB : ART[String(n).padStart(2,"0")];
  const val = c => isJ(c) ? 13 : c;
  
  let drawn = Array(N).fill(null);   // 자리별로 뽑은 카드
  let pool = [];                     // 바닥에 깔린 카드
  let takenK = [];                   // 이미 집어간 자리
  let plan = null;                   // 온라인에서 자리별로 나올 숫자
  let waiting = [];                  // 아직 안 뽑은 자리 (순서대로)
  let phase = "pick";                // pick | tie | done
  
  
  /* 배경 그림 속 초록 타원.
     cover 에 맡기면 브라우저가 어디에 놓는지 추측해야 해서 어긋난다.
     크기와 위치를 직접 지정하고, 그 값에서 타원 좌표를 그대로 얻는다. */
  const OV = {iw: 860, ih: 1859, cx: 0.4994, cy: 0.4415, rx: 0.4250, ry: 0.1420};
  function placeTable(sec, cyPct){
    const b = sec.getBoundingClientRect();
    const W = b.width, H = b.height;
    const scale = Math.max(W / OV.iw, H / OV.ih);   /* 화면을 덮는 최소 배율 */
    const dw = OV.iw * scale, dh = OV.ih * scale;
    /* 기본은 세로 가운데 정렬(cover 기본값). 예전 화면이 이 위치였다 */
    const cy = (cyPct == null ? ((H - dh) / 2 + OV.cy * dh) : (cyPct / 100 * H));
    const ox = W / 2 - OV.cx * dw;
    const oy = cy - OV.cy * dh;
    sec.style.backgroundSize = Math.round(dw) + "px " + Math.round(dh) + "px";
    sec.style.backgroundPosition = Math.round(ox) + "px " + Math.round(oy) + "px";
    return {cx: (ox + OV.cx * dw) / W * 100, cy: cy / H * 100,
            rx: (OV.rx * dw) / W * 100, ry: (OV.ry * dh) / H * 100};
  }
  let RING = {cx: 49, cy: 43, rx: 42.5, ry: 14.5};
  function syncRing(){
    const sec = window.document.getElementById("draw");
    if (!sec) return;
    RING = placeTable(sec, null);
    const d = el("deck");
    if (d){ d.style.left = RING.cx + "%"; d.style.top = RING.cy + "%"; }
  }
  
  function seatPos(i){
    const a = (Math.PI / 2) + (i * 2 * Math.PI / N);
    const s = Math.sin(a);
    /* 이름표가 아래로 달려서, 아래쪽 자리는 그만큼 더 바깥으로 빼야 위와 대칭이 된다 */
    const bias = s > 0.25 ? 3.4 * s : 0;
    return {x: RING.cx + Math.cos(a) * -RING.rx, y: RING.cy + s * RING.ry + bias};
  }
  function cardFace(c){
    if (c == null) return '<div class="card"></div>';   /* 아직 아무도 안 집은 카드 */
    const n = isJ(c) ? 13 : c;
    const nm = isJ(c) ? (lang === "ko" ? "카멜레온" : "CHAMELEON")
                      : (lang === "ko" ? KO_N : EN_N)[c - 1];
    return '<div class="card">' +
      '<div class="card__band"><span class="card__num">' + n + '</span>' +
      '<span class="card__name">' + nm + '</span>' +
      '<span class="card__num">' + n + '</span></div>' +
      '<div class="card__art"><img src="' + art(c) + '" alt=""></div>' +
      '<div class="card__band"><span class="card__num">' + n + '</span>' +
      '<span class="card__num">' + n + '</span></div></div>';
  }

  /* 가장 낮은 숫자를 뽑은 사람이 1등. 나머지는 그 자리에서 시계 방향으로 */
  let pickOrder = [];              // 뽑은 순서 (동점이면 먼저 뽑은 쪽이 위)
  function winner(){
    let best = null;
    pickOrder.forEach(i => {
      if (drawn[i] == null) return;
      if (best === null || val(drawn[i]) < val(drawn[best])) best = i;
    });
    return best === null ? 0 : best;
  }
  function ranking(){
    const w = winner();
    return Array.from({length: N}, (_, k) => ({i: (w + k) % N}));
  }
  
  function layout(players){
    /* 바닥은 엔진이 깐다. 아직 아무도 안 집은 카드의 숫자는 엔진이 가려서 준다 */
    const v = eng.engine.view;
    pool = (v && v.draw) ? v.draw.pool.slice() : new Array(players.length).fill(null);
    plan = null;
    /* 예전에는 여기서 "서버가 정한 선이 가장 낮은 수를 갖도록" 숫자를 미리 배정했다.
       누가 무엇을 골라도 결과가 같은 가짜였다. 이제 그런 것은 없다 —
       고른 카드가 곧 결과다 */

    waiting = players.slice();
    const deck = el("deck");
    deck.innerHTML = "";
    const n = pool.length;
    const cols = n <= 4 ? n : Math.min(4, Math.ceil(n / 2));
    const rows = Math.ceil(n / cols);
    const ringEl = el("ring");
    const avail = (ringEl.clientWidth || 360) - 48;
    /* 34px 은 카드 안 글씨가 들어갈 자리가 안 나온다. 상한을 46 으로 올리되
       세로도 같이 본다 — 덱은 판 높이의 44% 를 중심으로 놓이므로
       위로 삐져나가지 않으려면 두 줄 높이가 0.88H 안에 들어와야 한다 */
    const availH = (ringEl.clientHeight || 300) * 0.88 - 16;
    const byW = Math.floor((avail - (cols - 1) * 9) / cols);
    const byH = Math.floor((availH - (rows - 1) * 9) / rows / (390 / 200));
    /* 20% 줄인다 — 자리와 이름표에 견줘 카드가 컸다 */
    const pw = Math.round(Math.max(26, Math.min(46, byW, byH)) * 0.8);
    deck.style.setProperty("--cols", cols);
    deck.style.setProperty("--pw", pw + "px");
    pool.forEach((c, k) => {
      const w = document.createElement("div");
      w.className = "pk";
      w.dataset.k = k;
      w.innerHTML = '<div class="pk__in">' +
        '<div class="pk__f pk__f--b"><img src="' + ART.back + '" alt=""></div>' +
        '<div class="pk__f pk__f--a">' + cardFace(c) + '</div></div>';
      deck.appendChild(w);
    });
    wireDeck();
  }

  /* ---------- 누름은 **바닥 전체**에서 한 번만 받는다 ----------

     예전에는 카드마다 `w.onclick` 을 붙였다. 두 가지로 새어 나갔다.
       (1) 뽑기 화면은 남은 시간 때문에 자주 다시 그린다. 그때 카드 칸이 새로 만들어지면
           앞서 붙여 둔 처리기는 사라진 칸에 남아, 손을 떼는 신호가 갈 곳을 잃는다
       (2) `click` 은 **손을 뗄 때** 나온다. 그 사이에 칸이 바뀌면 통째로 사라진다
     게임 화면(table.js)에서 똑같은 "터치 씹힘" 을 겪고 `onTap` 을 만들었는데,
     뽑기 화면만 그 고침을 안 받고 있었다.

     여기서는 **바닥(#deck)** 에 한 번만 붙인다. 바닥은 다시 그려도 그대로 있으므로
     안에 든 카드가 새로 만들어져도 신호를 놓치지 않는다.
     그리고 `click` 이 아니라 **`pointerdown`(손이 닿는 순간)** 에 처리한다 —
     "한 번 누르면 바로 뽑힌다" 가 되려면 손 떼기를 기다리면 안 된다. */
  let lastTapAt = 0;
  function wireDeck(){
    const deck = el("deck");
    if (!deck || deck.__wired) return;
    deck.__wired = true;
    const fire = (e) => {
      const t = e.target;
      const w = t && t.closest ? t.closest(".pk") : null;
      if (!w || w.classList.contains("taken")) return;
      /* 손가락 하나에 pointerdown 과 click 이 둘 다 온다. 한 번만 친다 */
      if (Date.now() - lastTapAt < 400) return;
      lastTapAt = Date.now();
      if (waiting.indexOf(0) < 0) return;       /* 내가 이미 뽑았다 */
      pick(0, Number(w.dataset.k));
    };
    deck.addEventListener("pointerdown", fire);
    deck.addEventListener("click", fire);       /* 마우스와 검사용 */
  }
  
  /* 뽑기 제한 시간 5초. 안 뽑으면 자동으로 한 장 집는다.
     남들은 나를 기다리지 않고 저마다 뽑는다 */
  const PICK_SEC = 5;
  let pickTimer = null, pickLeft = 0, pickTickId = null, botLoopId = null, offView = null;
  /* **이 화면이 지금 판을 맡고 있는가.**
     판에서 나가면 `eng.stop()` 이 `onGone` 으로 알려 준다. 그때 false 가 되고,
     다음 `boot()` 에서 다시 true 가 된다.
     이게 없을 때는 나간 뒤에도 구독이 살아 있어서, 새 판이 첫 상태를 보내면
     **앞 방의 자리 수 그대로 뽑기판을 한 번 그렸다**(8인 방에서 나온 뒤
     4인 방을 만들었더니 8자리로 그려짐을 재현해 확인).
     그 뒤 boot 이 제대로 다시 그리므로 "잔상이 보였다 돌아온다" 로 보인다 */
  let live = true;
  function standDown(){
    live = false;
    if (offView){ offView(); offView = null; }
    stopPickTimer();
    stopBotLoop();
    if (cdId){ clearInterval(cdId); cdId = null; }
  }
  eng.onGone(standDown);
  function armPickTimer(){
    stopPickTimer();
    if (phase !== "pick") return;
    startBotLoop();
    if (waiting.indexOf(0) < 0) return;              /* 내가 이미 뽑았다 */
    pickLeft = PICK_SEC;
    draw();
    pickTickId = setInterval(() => {
      pickLeft--;
      if (pickLeft < 0) pickLeft = 0;
      draw();
    }, 1000);
    pickTimer = setTimeout(() => {
      if (phase !== "pick" || waiting.indexOf(0) < 0) return;
      const free = el("deck").querySelectorAll('.pk:not(.taken)');
      if (free.length) free[Math.floor(Math.random() * free.length)].click();
    }, PICK_SEC * 1000);
  }
  function stopPickTimer(){
    if (pickTimer){ clearTimeout(pickTimer); pickTimer = null; }
    if (pickTickId){ clearInterval(pickTickId); pickTickId = null; }
    pickLeft = 0;
  }
  /* 나 말고 남은 사람들이 차례로 한 장씩 집는다 */
  /* 남들이 고르는 것은 엔진이 한다. 화면은 결과만 받아 그린다 */
  function startBotLoop(){}
  function stopBotLoop(){ if (botLoopId){ clearInterval(botLoopId); botLoopId = null; } }
  
  /* 내가 한 장 집는다. 결과는 엔진이 정한다 — 여기서 숫자를 만들지 않는다 */
  function pick(seat, k){
    if (seat !== 0) return;                    /* 남의 것을 대신 집지 않는다 */
    if (el("deck").querySelector('.pk[data-k="' + k + '"].taken')) return;
    eng.takeCard(k);
  }

  /* 엔진이 알려 준 대로 바닥을 맞춘다. 뒤집기는 처음 보일 때 한 번만 */
  function syncDeck(d){
    if (!d) return;
    const deck = el("deck");
    d.by.forEach((seat, k) => {
      if (seat == null) return;
      const w = deck.querySelector('.pk[data-k="' + k + '"]');
      if (!w) return;
      /* **숫자를 알기 전에는 뒤집지 않는다.**
         내가 누르면 화면이 먼저 "내가 집었다" 고 쳐 버리는데, 그때는 아직 숫자를 모른다.
         그 상태로 뒤집으면 앞면이 백지가 되고,
         서버가 "그 카드는 남이 먼저 집었다" 고 하면 엉뚱한 카드가 뒤집힌 채로 남는다.
         숫자가 내려온 것 = 서버가 인정한 것이므로, 그때만 뒤집는다 */
      const val = d.pool[k];
      if (val == null) return;
      const face = w.querySelector(".pk__f--a");
      if (face && w.dataset.val !== String(val)){
        face.innerHTML = cardFace(val);
        w.dataset.val = String(val);
      }
      if (w.classList.contains("taken")) return;
      snd("card_play");     /* 카드 한 장 뒤집는 것이니 낼 때와 같은 소리 */
      w.classList.add("flip", "taken");
      w.dataset.seat = seat;
      takenK.push(k);
      drawn[seat] = d.pool[k];
      if (pickOrder.indexOf(seat) < 0) pickOrder.push(seat);
      waiting = waiting.filter(x => x !== seat);
      if (seat === 0) stopPickTimer();
    });
  }
  
  let cd = 5, cdId = null;
  function startCountdown(){
    cd = 5; draw();
    if (cdId) clearInterval(cdId);
    cdId = setInterval(() => {
      /* 이미 이 화면을 떠났으면 멈춘다 (안 그러면 테이블을 다시 시작시킨다) */
      const sec = window.document.getElementById("draw");
      if (sec && !sec.classList.contains("is-on")){ clearInterval(cdId); cdId = null; return; }
      cd--;
      draw();
      if (cd <= 0){
        clearInterval(cdId); cdId = null;
        const g = el("go"); if (g && !g.disabled) g.click();
      }
    }, 1000);
  }
  function settle(){
    phase = "done";
    /* 선은 엔진이 정했다. 판 화면 기준 자리로 받아 둔다 */
    const vv = eng.engine.view;
    if (vv && vv.turn >= 0) window.__leadSeat = vv.turn;
    /* 이름·얼굴을 새 순서로 갈아 끼우는 것은 이 화면을 떠날 때 한다.
       여기서 바꾸면 뽑은 숫자는 방에 앉은 순서로 붙어 있는데
       이름만 등수 순서로 바뀌어 서로 다른 사람을 가리킨다 */
    const w = typeof window.__leadSeat === "number" ? window.__leadSeat : winner();
    window.GAME = window.GAME || {};
    window.GAME.N = N;
    window.GAME.roundNo = 1;
    window.GAME.score = Array(N).fill(0);
    window.GAME.order = Array.from({length: N}, (_, k) => (w + k) % N);  // 선부터 시계 방향
    if (!online){ window.GAME.finish = null; window.GAME.hold = null; }
    draw();
    startCountdown();
  }
  
  
  
  /* 자리 상자가 아니라 '아바타의 중심'이 타원 위에 오도록 보정하고,
     화면이나 아래 UI를 넘으면 그만큼 안으로 당긴다 */
  function anchorSeats(box, limitBottom){
    const root = window.document.documentElement;
    const W = (window.document.getElementById("stage") || root).getBoundingClientRect();
    box.querySelectorAll(".seat").forEach(s => {
      const av = s.querySelector(".seat__av");
      if (!av) return;
      const dy = av.offsetTop + av.offsetHeight / 2;
      s.style.transform = "translate(-50%," + (-dy) + "px)";
      const r = s.getBoundingClientRect();
      let ox = 0, oy = 0;
      if (r.left < W.left + 3) ox = (W.left + 3) - r.left;
      else if (r.right > W.right - 3) ox = (W.right - 3) - r.right;
      if (limitBottom && r.bottom > limitBottom) oy = limitBottom - r.bottom;
      if (ox || oy) s.style.transform = "translate(calc(-50% + " + ox + "px)," + (-dy + oy) + "px)";
    });
  }
  /* ---------- 자리 그리기 ----------

     **매번 지우고 새로 만들면 안 된다.** 예전에는 `box.innerHTML = ""` 로 통째로
     지우고 자리를 새로 만들었다. 뽑기 화면은 남은 시간 때문에 1초마다, 그리고
     엔진이 새 상태를 보낼 때마다 다시 그리는데, 그때마다 얼굴 `<span>` 이 새로
     생기고 브라우저가 배경 그림을 다시 불러오면서 **번쩍였다**
     (2026-09-28 신고: "카드 뽑으러 들어갈 때 나 빼고 7명 프로필이 깜빡인다").
     판 화면(table.js)에서 같은 문제를 먼저 고쳤는데 여기는 그대로였다.

     이제 자리는 **인원이 바뀔 때만** 새로 만들고, 그 뒤로는 바뀐 값만 고쳐 쓴다.
     뽑은 숫자표는 위·아래 두 칸을 미리 만들어 두고 쓰는 쪽만 보여 준다 —
     자리마다 붙는 위치가 달라서, 그때그때 넣었다 뺐다 하면 또 새로 만들게 된다 */
  let seatNodes = [], seatBits = [];
  function setChip(node, v){
    if (node.textContent !== v) node.textContent = v;
    const d = v === "" ? "none" : "";
    if (node.style.display !== d) node.style.display = d;
  }
  function renderSeats(){
    syncRing();
    const box = el("seats");
    if (seatNodes.length !== N || seatNodes.some(d => d.parentNode !== box)){
      box.innerHTML = "";
      seatNodes = []; seatBits = [];
      for (let i = 0; i < N; i++){
        const d = document.createElement("div");
        d.className = "seat";
        d.innerHTML =
          '<span class="seat__r"></span>' +
          '<span class="seat__d" style="display:none"></span>' +
          '<span class="seat__av"></span>' +
          '<span class="seat__n"></span>' +
          '<span class="seat__d" style="display:none"></span>';
        box.appendChild(d);
        const ds = d.querySelectorAll(".seat__d");
        seatNodes.push(d);
        seatBits.push({ r: d.querySelector(".seat__r"), up: ds[0], dn: ds[1],
                        av: d.querySelector(".seat__av"), n: d.querySelector(".seat__n") });
      }
    }
    const fs = (N <= 6 ? 10.5 : 9) + "px";
    for (let i = 0; i < N; i++){
      const d = seatNodes[i], q = seatBits[i];
      const p = seatPos(i);
      const cls = "seat" + (i === 0 ? " seat--me" : "") +
        (waiting[0] === i && phase === "pick" ? " seat--turn" : "");
      if (d.className !== cls) d.className = cls;
      const L = p.x.toFixed(1) + "%", TP = p.y.toFixed(1) + "%";
      if (d.style.left !== L) d.style.left = L;
      if (d.style.top !== TP) d.style.top = TP;
      /* 인원과 무관하게 같은 크기 */
      if (d.style.getPropertyValue("--av") !== "42px") d.style.setProperty("--av", "42px");
      if (d.style.getPropertyValue("--fs") !== fs) d.style.setProperty("--fs", fs);
      const first = phase === "done" && i === winner();
      const rcls = "seat__r" + (first ? " on" : "");
      if (q.r.className !== rcls) q.r.className = rcls;
      if (q.r.textContent !== T[lang].first) q.r.textContent = T[lang].first;
      /* **그림은 주소가 바뀔 때만 손댄다.** 같은 주소를 다시 넣어도 한 번 번쩍인다 */
      const bg = "url(" + A_RINGS.avatar + "),url(" + avtOf(faceOf(i)) + ")";
      if (q.av.__bg !== bg){ q.av.style.backgroundImage = bg; q.av.__bg = bg; }
      const nm = nameOf(i);
      if (q.n.textContent !== nm) q.n.textContent = nm;
      const dv = drawn[i] == null ? "" : String(val(drawn[i]));
      const upper = Math.sin((Math.PI / 2) + (i * 2 * Math.PI / N)) < 0;  /* 위쪽 자리 */
      setChip(q.up, upper ? dv : "");
      setChip(q.dn, upper ? "" : dv);
    }
    const md = el("mid");
    anchorSeats(box, md ? md.getBoundingClientRect().top - 4 : 0);
  }
  
  function draw(){
    const t = T[lang];
    el("step").textContent = t.step;
    renderSeats();
    const m = el("mid");
    if (phase === "done"){
      m.innerHTML = '<div class="mid__h">' + t.doneH + '</div><div class="mid__s">' +
        t.doneS(nameOf(winner())) + '<br>' + t.note + '</div>' +
        '<div class="cd">' + Math.max(cd, 0) + '</div>';
    } else if (!waiting.length){
      m.innerHTML = '<div class="mid__h">' + t.waitH + '</div><div class="mid__s">' + t.settling + '</div>';
    } else if (waiting.indexOf(0) >= 0){
      /* 내가 아직 안 뽑았으면 남은 시간을 보여준다 */
      /* 남은 시간은 제목 옆에 붙인다. 아래에 두면 긴 설명에 묻혀 안 보인다 */
      m.innerHTML = '<div class="mid__h">' + t.h +
        (pickLeft > 0 ? ' <b>(' + pickLeft + ')</b>' : '') + '</div>' +
        '<div class="mid__s">' + t.s + '</div>';
    } else {
      m.innerHTML = '<div class="mid__h">' + t.waitH + '</div><div class="mid__s">' +
        t.waitS(nameOf(waiting[0])) + '</div>';
    }
    const g = el("go");
    g.textContent = phase === "done" ? t.goIn(cd) : t.picking;
    g.disabled = phase !== "done";
    const md = el("mid");
    anchorSeats(el("seats"), md ? md.getBoundingClientRect().top - 4 : 0);
  }
  
  function boot(){
    /* **자리를 여기서 지우지 않는다.**

       예전에는 들어올 때마다 `#seats` 를 통째로 비웠다. 그러면 얼굴 `<span>` 이
       일곱 개 한꺼번에 새로 생기고, 폰은 그때마다 그림을 다시 풀어 그린다
       (대기실은 46px, 뽑기는 42px 이라 크기가 달라 다시 푼다).
       그게 "카드 뽑으러 들어갈 때 나 빼고 프로필이 깜빡인다" 로 보인다.

       지울 이유도 없다 — `boot()` 은 화면을 **보이기 전에** nav 가 부르고
       (`go()` 안에서 `__bootDraw()` 가 먼저다), 아래 `draw()` 가 그 자리에서
       값을 다 맞춘다. 옛 내용이 눈에 보이는 순간은 없다.
       인원이 달라지면 `renderSeats()` 가 알아서 새로 만든다.

       바닥 카드(`#deck`)는 판마다 아예 다른 것이라 `layout()` 이 새로 깐다 */
    /* 온라인이면 인원과 선을 서버 값에서 가져온다. 뽑기 연출은 그대로 보여준다.
       이 판단을 먼저 해야 인원이 잠깐 잘못 그려지지 않는다 */
    online = Boolean(window.__net);
    /* 인원은 **엔진이 깐 카드 수**가 진짜다.
       GAME.N 은 방을 열 때 적어 둔 값이라, 방장이 인원을 바꾼 뒤에는 옛 숫자다.
       그걸 쓰면 옛 인원수만큼 카드를 깔았다가 곧 다시 그리게 된다 */
    const dv = eng.engine.view;
    N = (dv && dv.draw && dv.draw.pool.length)
      || (online ? ((window.GAME && window.GAME.N) || 6)
                 : ((window.__opts && (window.__opts.seated || window.__opts.cap)) || 6));
    if (cdId){ clearInterval(cdId); cdId = null; }
    cd = 5;
    drawn = Array(N).fill(null);
    pickOrder = [];
    takenK = [];
    window.__roundNo = 1;
    window.__myRankIdx = null;
    if (!online){
      window.GAME = {N: N, roundNo: 1, score: Array(N).fill(0), order: null, finish: null, hold: null};
    }
    phase = "pick";
    layout(Array.from({length: N}, (_, i) => i));
    /* 엔진이 바닥을 알려 준다. 남들이 고르는 것도 여기로 들어온다 */
    live = true;
    if (offView) offView();
    offView = eng.onView(v => {
      if (!live) return;          /* 나간 판이다 — 그리지 않는다 */
      if (phase === "done") return;
      syncDeck(v.draw);
      if (v.phase !== "draw"){ stopBotLoop(); stopPickTimer(); setTimeout(settle, 700); }
      draw();
    });
    if (eng.engine.view){ syncDeck(eng.engine.view.draw); }
    draw();
  }
  window.__bootDraw = () => { boot(); armPickTimer(); };
  boot();
  
  document.querySelectorAll("#lang button").forEach(b => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document.documentElement.lang = lang;
      document.querySelectorAll("#lang button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });
  el("go").addEventListener("click", () => {
    if (cdId){ clearInterval(cdId); cdId = null; }
    /* 판으로 넘어가는 순간에 자리가 등수 순서로 바뀐다 */
    const vv = eng.engine.view;
    if (vv && vv.seats){
      window.GAME = window.GAME || {};
      window.GAME.faces = vv.seats.map(x => x.seat);
      window.GAME.seatFaces = vv.seats.map(x => x.seat);
      window.GAME.names = vv.names.slice();
      window.GAME.namesEn = vv.names.slice();
      if (vv.turn >= 0) window.__leadSeat = vv.turn;
    }
  });
  window.addEventListener("resize", draw);
  
  window.addEventListener("langchange", () => { lang = window.__lang; draw(); });
  
}
