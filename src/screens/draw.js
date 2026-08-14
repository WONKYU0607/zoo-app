import { scoped } from "../lib/scoped.js";
import { RINGS as A_RINGS } from "../lib/assets.js";
import { ART_DECK as A_DECK, HEADS as A_HEADS } from "../lib/assets.js";
import "../styles/draw.css";

export function mount(root){
  const document = scoped(root);
  
  const ART = A_DECK, HEADS = A_HEADS;
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
  let N = 6;
  const nameOf = i => (lang === "ko" ? NAMES_KO : NAMES_EN)[i];
  const art = n => n === 13 ? ART.jokerA : n === 14 ? ART.jokerB : ART[String(n).padStart(2,"0")];
  const val = c => isJ(c) ? 13 : c;
  
  let drawn = Array(N).fill(null);   // 자리별로 뽑은 카드
  let pool = [];                     // 바닥에 깔린 카드
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
    const n = isJ(c) ? 13 : c;
    return '<div class="card">' +
      '<div class="card__band"><span class="card__num">' + n + '</span>' +
      '<span class="card__num">' + n + '</span></div>' +
      '<div class="card__art"><img src="' + art(c) + '" alt=""></div>' +
      '<div class="card__band"><span class="card__num">' + n + '</span>' +
      '<span class="card__num">' + n + '</span></div></div>';
  }
  function makeDeck(){
    const d = [];
    for (let n = 1; n <= 12; n++) for (let i = 0; i < n; i++) d.push(n);
    d.push(13, 14);
    for (let i = d.length - 1; i > 0; i--){
      const k = Math.floor(Math.random() * (i + 1));
      [d[i], d[k]] = [d[k], d[i]];
    }
    return d;
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
    const d = makeDeck();
    pool = d.slice(0, players.length);
    waiting = players.slice();
    const deck = el("deck");
    deck.innerHTML = "";
    const n = pool.length;
    const cols = n <= 4 ? n : Math.min(4, Math.ceil(n / 2));
    const avail = (el("ring").clientWidth || 360) - 48;
    const pw = Math.max(26, Math.min(34, Math.floor((avail - (cols - 1) * 9) / cols)));
    deck.style.setProperty("--cols", cols);
    deck.style.setProperty("--pw", pw + "px");
    pool.forEach((c, k) => {
      const w = document.createElement("div");
      w.className = "pk";
      w.dataset.k = k;
      w.innerHTML = '<div class="pk__in">' +
        '<div class="pk__f pk__f--b"><img src="' + ART.back + '" alt=""></div>' +
        '<div class="pk__f pk__f--a">' + cardFace(c) + '</div></div>';
      w.onclick = () => { if (waiting[0] === 0) pick(0, k); };
      deck.appendChild(w);
    });
  }
  
  function pick(seat, k){
    const w = el("deck").querySelector('.pk[data-k="' + k + '"]:not(.taken)');
    if (!w) return;
    drawn[seat] = pool[k];
    pickOrder.push(seat);
    waiting = waiting.filter(x => x !== seat);
    w.classList.add("flip", "taken");
    w.dataset.seat = seat;
    draw();
    if (waiting.length) setTimeout(botPick, 900);
    else setTimeout(settle, 1200);
  }
  
  function botPick(){
    const seat = waiting[0];
    const free = pool.map((_, k) => k).filter(k =>
      el("deck").querySelector('.pk[data-k="' + k + '"]:not(.taken)'));
    pick(seat, free[Math.floor(Math.random() * free.length)]);
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
    const w = winner();
    window.GAME = window.GAME || {};
    window.GAME.N = N;
    window.GAME.roundNo = 1;
    window.GAME.score = Array(N).fill(0);
    window.GAME.order = Array.from({length: N}, (_, k) => (w + k) % N);  // 선부터 시계 방향
    window.GAME.finish = null;
    window.GAME.hold = null;
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
  function renderSeats(){
    syncRing();
    const box = el("seats"); box.innerHTML = "";
    const order = phase === "done" ? ranking().map(x => x.i) : [];
    for (let i = 0; i < N; i++){
      const a = (Math.PI / 2) + (i * 2 * Math.PI / N);
      const p = seatPos(i);
      const d = document.createElement("div");
      const r = order.indexOf(i);
      d.className = "seat" + (i === 0 ? " seat--me" : "") +
        (waiting[0] === i && phase === "pick" ? " seat--turn" : "") +
        "";
      d.style.left = p.x.toFixed(1) + "%"; d.style.top = p.y.toFixed(1) + "%";
      const big = N <= 6;
      d.style.setProperty("--av", (big ? 42 : 33) + "px");
      d.style.setProperty("--fs", (big ? 10.5 : 9) + "px");
      const first = phase === "done" && i === winner();
      const dv = drawn[i] == null ? "" : val(drawn[i]);
      const chip = dv === "" ? "" : '<span class="seat__d">' + dv + '</span>';
      const upper = Math.sin((Math.PI / 2) + (i * 2 * Math.PI / N)) < 0;  /* 위쪽 자리 */
      d.innerHTML =
        '<span class="seat__r' + (first ? " on" : "") + '">' + T[lang].first + '</span>' +
        (upper ? chip : "") +
        '<span class="seat__av" style="background-image:url(' + A_RINGS.avatar + '),url(' + HEADS[i] + ')"></span>' +
        '<span class="seat__n">' + nameOf(i) + '</span>' +
        (upper ? "" : chip);
      box.appendChild(d);
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
    } else if (waiting[0] === 0){
      m.innerHTML = '<div class="mid__h">' + t.h + '</div><div class="mid__s">' + t.s + '</div>';
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
    N = (window.__opts && (window.__opts.seated || window.__opts.cap)) || 6;
    if (cdId){ clearInterval(cdId); cdId = null; }
    cd = 5;
    drawn = Array(N).fill(null);
    pickOrder = [];
    window.__roundNo = 1;
    window.__myRankIdx = null;
    window.GAME = {N: N, roundNo: 1, score: Array(N).fill(0), order: null, finish: null, hold: null};
    phase = "pick";
    layout(Array.from({length: N}, (_, i) => i));
    draw();
  }
  window.__bootDraw = boot;
  boot();
  
  document.querySelectorAll("#lang button").forEach(b => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document.documentElement.lang = lang;
      document.querySelectorAll("#lang button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });
  el("go").addEventListener("click", () => { if (cdId){ clearInterval(cdId); cdId = null; } });
  window.addEventListener("resize", draw);
  
  window.addEventListener("langchange", () => { lang = window.__lang; draw(); });
  
}
