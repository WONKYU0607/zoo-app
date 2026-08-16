import { scoped } from "../lib/scoped.js";
import { RINGS as A_RINGS } from "../lib/assets.js";
import { ART as A_ART, HEADS as A_HEADS } from "../lib/assets.js";
import "../styles/table.css";

export function mount(root){
  const document = scoped(root);
  
  const HEADS = A_HEADS, ART = A_ART;
  const KO_N = ["사자","호랑이","불곰","코끼리","악어","여우","기린","멧돼지","원숭이","토끼","새","생쥐"];
  const EN_N = ["LION","TIGER","BEAR","ELEPHANT","CROCODILE","FOX","GIRAFFE","BOAR","MONKEY","RABBIT","BIRD","MOUSE"];
  const T = {
    ko:{ roundN:n=>"ROUND "+n, joker:"카멜레온",
         myTurn:"내 차례", theirTurn:n=>n+" 차례",
         left:c=>'남은 <b>'+c+'</b>장', tagTurn:"차례", tagPass:"패스", tagOut:"완주",
         lead:"원하는 장수로 시작하세요", top1:'<b>1번</b>이 나왔습니다. 아무도 받을 수 없습니다',
         need:(c,n)=>'<b>'+c+'장</b>을 <b>'+n+'번 이하</b>로 받으세요',
         emptyPile:"바닥이 비었습니다<br>원하는 카드를 내세요",
         pass:"패스", pick:"카드를 고르세요", play:n=>n+"장 내기",
         notTurn:"상대 차례입니다", mix:"같은 숫자만 함께 낼 수 있습니다",
         cnt:n=>n+"장을 맞춰 주세요", lower:"더 낮은 숫자를 내세요",
         autoPass:"시간이 다 되어 자동으로 넘겼습니다", left2:n=>n+"초", cleared:"판을 비웠습니다 · 다시 선", endR:"판 종료",
         close:"다시 누르면 접힙니다" },
  
    en:{ roundN:n=>"ROUND "+n, joker:"CHAMELEON",
         myTurn:"Your turn", theirTurn:n=>n+"'s turn",
         left:c=>'<b>'+c+'</b> left', tagTurn:"turn", tagPass:"passed", tagOut:"done",
         lead:"Lead with any number of cards", top1:'<b>1</b> is out. Nobody can beat it',
         need:(c,n)=>'Beat with <b>'+c+(c===1?' card':' cards')+'</b> of <b>'+n+' or lower</b>',
         emptyPile:"The pile is empty<br>Play anything you like",
         pass:"Pass", pick:"Select cards", play:n=>"Play "+n,
         notTurn:"Opponent's turn", mix:"Cards must share one number",
         cnt:n=>"Play exactly "+n, lower:"Play a lower number",
         autoPass:"Time up \u2014 passed for you", left2:n=>n+"s", cleared:"Pile cleared \u00B7 you lead again", endR:"End round",
         close:"Tap again to close" }
  };
  let lang = window.__lang || "ko";
  const NAMES = KO_N;
  const el = id => document.getElementById(id);
  const isJ = c => c >= 13;   // 카멜레온 2장: 13=광대, 14=신사
  
  /* 0번이 나. 시계 방향으로 상대 */
  const ALL = ["나","민지","준호","서연","태윤","하은","지훈","예린"];
  const ALL_EN = ["You","Minji","Junho","Seoyeon","Taeyun","Haeun","Jihoon","Yerin"];
  let SEATS = ALL.slice(0, 6).map(n => ({n: n, c: 0, s: ""}));
  
  /* 80장 덱: 1번 1장 ~ 12번 12장 + 카멜레온 2장 */
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
  function dealAll(){
    const d = makeDeck(), n = SEATS.length;
    SEATS.forEach(s => s.hold = []);
    d.forEach((c, i) => SEATS[i % n].hold.push(c));
    SEATS.forEach(s => { s.hold.sort((a,b) => a-b); s.c = s.hold.length; });
  }
  dealAll();
  let hand = SEATS[0].hold;
  let finish = [];                 // 이번 판에 손을 턴 순서 (자리 번호)
  
  /* 온라인에서 서버가 준 값으로 판을 세운다 */
  function bootOnline(){
    const R = window.__room, G = window.GAME || {};
    const n = G.N || 6;
    if (!G.names || !G.names.length) return;      /* 아직 준비가 안 됐다 */
    SEATS = (G.names || []).slice(0, n).map((nm, i) => ({
      n: nm, c: (R && R.round && R.round.counts ? R.round.counts[i] : 0), s: "", hold: []
    }));
    const me = G.mySeat || 0;
    /* 내 자리가 화면 아래로 오도록 돌린다 */
    if (me > 0){
      SEATS = SEATS.slice(me).concat(SEATS.slice(0, me));
    }
    hand = (window.__hand || []).slice();
    SEATS[0].hold = hand;
    SEATS[0].c = hand.length;
    turn = R && R.round ? ((R.round.turn - me + n) % n) : 0;
    trick = []; finish = []; sel = []; busy = false; lastPlayer = null;
    spread = false; animated = 0;
    myGen++;
    syncRing(); draw(); resetTimer();
  }
  
  function boot(fresh){
    if (window.__net){ bootOnline(); return; }
    const G = window.GAME;
    const n = (G && G.N) || (window.__opts && (window.__opts.seated || window.__opts.cap)) || 6;
    if (fresh !== false || !G || !G.hold){
      SEATS = ALL.slice(0, n).map(x => ({n: x, c: 0, s: ""}));
      dealAll();
    } else {
      /* 세금 단계를 거쳐 온 경우: 그때 손패를 그대로 이어받는다 */
      SEATS = ALL.slice(0, n).map((x, i) => ({n: x, c: G.hold[i].length, s: "", hold: G.hold[i].slice()}));
    }
    hand = SEATS[0].hold;
    finish = [];
    myGen++;                                /* 이전 판의 예약된 봇 호출을 모두 무효화 */
    if (timerId) clearTimeout(timerId);
    if (tickId) clearInterval(tickId);
    sel = []; trick = []; busy = false; animated = 0; spread = false;
    lastPlayer = null;
    turn = (G && G.order && G.order.length) ? G.order[0] : 0;
    syncGame();
    draw(); resetTimer();
    if (turn !== 0) laterBot(900);
  }
  function syncGame(){
    window.GAME = window.GAME || {};
    window.GAME.N = SEATS.length;
    window.GAME.names = ALL.slice(0, SEATS.length);
    window.GAME.namesEn = ALL_EN.slice(0, SEATS.length);
    window.GAME.hold = SEATS.map(s => s.hold.slice());
  }
  window.__bootTable = boot;
  /* 미리보기용: 남은 사람을 남은 장수 순으로 채워 판을 끝낸다 */
  window.__forceEnd = () => {
    const left = SEATS.map((s, i) => i).filter(i => !finish.includes(i));
    left.sort((a, b) => SEATS[a].c - SEATS[b].c);
    finish = finish.concat(left);
    endRound();
  };
  let sel = [];
  let trick = [];              // 이번 판에 나온 것들
  let turn = 0;                // 지금 차례
  let lastPlayer = null;
  let busy = false;
  let animated = 0;   // 이미 날아온 카드 수
  let spread = false; // 바닥 펼침 여부
  
  const cur = () => trick.length ? trick[trick.length - 1] : null;
  const label = n => isJ(n) ? T[lang].joker : (lang === "ko" ? KO_N : EN_N)[n-1];
  const art = n => n === 13 ? ART.jokerA : n === 14 ? ART.jokerB : ART[String(n).padStart(2,"0")];
  
  function cardHTML(n, w){
    if (isJ(n)) return '<div class="card is-joker" style="--w:' + w + 'px">' +
      '<div class="card__band"><span class="card__name">카멜레온</span></div>' +
      '<div class="card__art"><img src="' + art(n) + '" alt=""></div>' +
      '<div class="card__band"></div></div>';
    return '<div class="card" style="--w:' + w + 'px">' +
      '<div class="card__band"><span class="card__num">' + n + '</span>' +
      '<span class="card__name">' + label(n) + '</span>' +
      '<span class="card__num">' + n + '</span></div>' +
      '<div class="card__art"><img src="' + art(n) + '" alt=""></div>' +
      '<div class="card__band"><span class="card__num">' + n + '</span>' +
      '<span class="card__num">' + n + '</span></div></div>';
  }
  
  
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
    const sec = window.document.getElementById("table");
    if (!sec) return;
    RING = placeTable(sec, null);
    const p = el("pile");
    if (p){ p.style.left = RING.cx + "%"; p.style.top = RING.cy + "%"; }
    const ph = el("ring") && el("ring").querySelector(".pile__hint");
    if (ph){ ph.style.left = RING.cx + "%"; ph.style.top = RING.cy + "%"; }
  }
  
  function seatPos(i){
    const a = (Math.PI / 2) + (i * 2 * Math.PI / SEATS.length);
    const s = Math.sin(a);
    /* 이름표가 아래로 달려서, 아래쪽 자리는 그만큼 더 바깥으로 빼야 위와 대칭이 된다 */
    const bias = 0;   /* 아래쪽만 밀어내면 원에서 떨어져 보인다 */
    /* 눈으로 본 미세 보정 */
    const side = Math.abs(s) < 0.05;                    // 좌우 끝자리
    const nudge = s > 0.9 ? 9 : (side ? 4 : (s > 0.25 ? 2 : 0));
    const nudgeX = side ? (Math.cos(a) < 0 ? 2 : -2) : 0;   // 좌우 끝은 바깥으로
    return {x: RING.cx + Math.cos(a) * -RING.rx, y: RING.cy + s * RING.ry + bias,
            nudge: nudge, nudgeX: nudgeX};
  }
  
  function maxCount(n){
    const j = hand.filter(isJ).length;
    return isJ(n) ? j : hand.filter(x => x === n).length + j;
  }
  function isDead(n){
    const c = cur(); if (!c) return false;
    if (isJ(n)) return !KO_N.some((_, i) => i + 1 < c.num && maxCount(i + 1) >= c.count);
    return !(n < c.num && maxCount(n) >= c.count);
  }
  function effective(l){
    const r = l.filter(x => !isJ(x));
    if (!r.length) return 13;
    return r.every(x => x === r[0]) ? r[0] : null;
  }
  function legal(l){
    if (!l.length) return false;
    const e = effective(l); if (e === null) return false;
    const c = cur(); if (!c) return true;
    return l.length === c.count && e < c.num;
  }
  
  function fanHTML(c){
    if (!c) return '<div class="fan"></div>';
    const shown = Math.min(c, 7), step = 5;
    const w = 13 + (shown - 1) * step;
    let s = '<div class="fan" style="width:' + w + 'px">';
    for (let i = 0; i < shown; i++)
      s += '<i style="left:' + (i * step) + 'px;z-index:' + i + '"></i>';
    return s + '</div>';
  }
  
  
  
  /* 자리 상자가 아니라 '아바타의 중심'이 타원 위에 오도록 보정하고,
     화면이나 아래 UI를 넘으면 그만큼 안으로 당긴다 */
  function anchorSeats(box, limitBottom){
    const root = window.document.documentElement;
    const W = (window.document.getElementById("stage") || root).getBoundingClientRect();
    box.querySelectorAll(".seat").forEach(s => {
      const av = s.querySelector(".seat__av");
      if (!av) return;
      const nudge = +(s.dataset.nudge || 0), nx = +(s.dataset.nudgex || 0);
      const dy = av.offsetTop + av.offsetHeight / 2 + nudge;
      s.style.transform = "translate(calc(-50% + " + nx + "px)," + (-dy) + "px)";
      const r = s.getBoundingClientRect();
      let ox = nx, oy = 0;
      if (r.left < W.left + 1) ox = nx + ((W.left + 1) - r.left);
      else if (r.right > W.right - 1) ox = nx + ((W.right - 1) - r.right);
      if (limitBottom && r.bottom > limitBottom) oy = limitBottom - r.bottom;
      if (ox !== nx || oy) s.style.transform = "translate(calc(-50% + " + ox + "px)," + (-dy + oy) + "px)";
    });
  }
  function renderSeats(){
    syncRing();
    const box = el("seats"); box.innerHTML = "";
    SEATS.forEach((s, i) => {
      const p = seatPos(i);
      const d = document.createElement("div");
      d.className = "seat" + (i === 0 ? " seat--me" : "") +
        (turn === i && SEATS[i].c > 0 ? " seat--turn" : "") +   /* 봇 차례에도 표시 */
        (s.s === "pass" ? " seat--pass" : "") + (s.c === 0 ? " seat--out" : "");
      d.style.left = p.x.toFixed(1) + "%"; d.style.top = p.y.toFixed(1) + "%";
      d.dataset.nudge = p.nudge || 0;
      d.dataset.nudgex = p.nudgeX || 0;
      const big = SEATS.length <= 6;
      d.style.setProperty("--av", (big ? 44 : 34) + "px");
      d.style.setProperty("--fs", (big ? 10.5 : 9) + "px");
      d.style.zIndex = 6 + Math.round(p.y);
      const tg = T[lang];
      const tag = s.c === 0 ? tg.tagOut : s.s === "pass" ? tg.tagPass : "";   /* 차례는 테두리로 알린다 */
      d.innerHTML = (tag ? '<span class="seat__tag">' + tag + '</span>' : '') +
        '<span class="seat__av" style="background-image:url(' + A_RINGS.avatar + '),url(' + HEADS[i] + ')"></span>' +
        '<span class="seat__n">' + (lang === "ko" ? ALL : ALL_EN)[i] + '</span>' +
        (i === 0 ? '' : fanHTML(s.c)) +
        '<span class="seat__c">' + T[lang].left(s.c) + '</span>';
      box.appendChild(d);
    });
    const nd = el("need");
    anchorSeats(box, nd ? nd.getBoundingClientRect().top - 4 : 0);
  }
  
  function renderPile(){
    const p = el("pile"); p.innerHTML = "";
    if (spread && trick.length){
      const t = T[lang];
      const maxC = Math.min(6, Math.max(...trick.map(x => x.count)));
      const cw = Math.max(18, Math.min(32, Math.floor((196 - (maxC - 1) * 3) / maxC)));
      p.innerHTML = '<div class="spread">' + trick.slice().reverse().map((x, idx) =>
        '<div class="srow' + (idx === 0 ? ' srow--new' : '') + '">' +
          '<span class="srow__w">' + (lang === "ko" ? ALL : ALL_EN)[x.by] + '</span>' +
          '<span class="srow__c">' +
            (x.cards || Array.from({length: x.count}, () => x.num))
              .slice(0, 6).map(cc => cardHTML(cc, cw, isJ(cc) ? x.num : null)).join("") +
            (x.count > 6 ? '<span class="srow__p">+' + (x.count - 6) + '</span>' : '') +
          '</span>' +
        '</div>').join("") + '<div class="spread__t">' + t.close + '</div></div>';
      return;
    }
    if (!trick.length){
      p.innerHTML = '<div class="pile__hint">' + T[lang].emptyPile + '</div>';
      animated = 0;
      return;
    }
    const rect = el("ring").getBoundingClientRect();
    trick.slice(-4).forEach((t, kk) => {
      const k = trick.length - Math.min(trick.length, 4) + kk;
      const from = seatPos(t.by);
      const g = document.createElement("div");
      g.className = "play" + (k < trick.length - 1 ? " play--old" : "") +
        (k >= animated ? " play--new" : "");
      const d = trick.length - 1 - k;
      g.style.setProperty("--r", d === 0 ? "0deg" : (((k * 37) % 19) - 9 - d * 3) + "deg");
      g.style.setProperty("--dy", (-Math.min(d, 3) * 6) + "px");
      g.style.setProperty("--sc", (1 - Math.min(d, 3) * 0.05).toFixed(3));
      g.style.setProperty("--fx", ((from.x - 50) / 100 * rect.width).toFixed(0) + "px");
      g.style.setProperty("--fy", ((from.y - 50) / 100 * rect.height).toFixed(0) + "px");
      g.style.zIndex = k;
      const cw = Math.max(18, Math.min(44, Math.floor((rect.width * 0.44 - (t.count - 1) * 4) / t.count)));
      g.innerHTML = (t.cards || Array.from({length: t.count}, () => t.num))
        .map(cc => cardHTML(cc, cw, isJ(cc) ? t.num : null)).join("");
      p.appendChild(g);
    });
    animated = trick.length;
  }
  
  function renderHand(){
    const h = el("hand"); h.innerHTML = "";
    const w = 60, n = hand.length;
    const step = n > 1 ? Math.min(36, (h.clientWidth - w) / (n - 1)) : 0;
    const total = w + step * (n - 1);
    hand.forEach((c, i) => {
      const s = document.createElement("div");
      s.className = "slot" + (sel.includes(i) ? " slot--sel" : "") + (isDead(c) ? " slot--dead" : "");
      s.style.left = ((h.clientWidth - total) / 2 + i * step) + "px";
      s.style.zIndex = i;
      s.innerHTML = cardHTML(c, w);
      s.onclick = () => { if (turn !== 0 || busy) return;
        const k = sel.indexOf(i); if (k >= 0) sel.splice(k,1); else sel.push(i); draw(); };
      h.appendChild(s);
    });
    SEATS[0].c = hand.length;
  }
  
  function renderBottom(){
    const c = cur();
    const t = T[lang];
    const mine = turn === 0 && !busy;
    const who = turn === 0 ? "" : t.theirTurn((lang === "ko" ? ALL : ALL_EN)[turn]) + " \u00B7 ";
    const left = mine && tLeft > 0
      ? ' \u00B7 <span class="count' + (tLeft <= 5 ? " warn" : "") + '">' + t.left2(tLeft) + '</span>'
      : "";
    el("need").innerHTML = who + (c
      ? (c.num === 1 ? t.top1 : t.need(c.count, c.num - 1))
      : (turn === 0 ? t.lead : "")) + left;
  
    const rn = window.__roundNo || 1;
    const NM = lang === "ko" ? KO_N : EN_N;
    const ri = window.__myRankIdx;
    const ord = x => { const s = ["th","st","nd","rd"], v = x % 100; return x + (s[(v-20)%10] || s[v] || s[0]); };
    const rname = (ri == null) ? "" : (lang === "ko" ? (ri + 1) + "등" : ord(ri + 1));
    el("round").textContent = t.roundN(rn) + (rname ? " · " + rname : "");
    const eb = el("endRound"); if (eb) eb.textContent = t.endR;
    el("pass").textContent = t.pass;
    const list = sel.map(i => hand[i]);
    const ok = legal(list) && turn === 0 && !busy;
    const b = el("play");
    b.disabled = !ok;
    b.textContent = turn !== 0 ? t.notTurn
      : !list.length ? t.pick
      : ok ? t.play(list.length)
      : effective(list) === null ? t.mix
      : (cur() && list.length !== cur().count) ? t.cnt(cur().count)
      : t.lower;
    el("pass").disabled = turn !== 0 || busy;
  }
  
  function draw(){
    renderSeats(); renderPile(); renderHand(); renderBottom();
    const nd = el("need");
    anchorSeats(el("seats"), nd ? nd.getBoundingClientRect().top - 4 : 0);
  }
  
  let timerId = null, tickId = null, tLeft = 0;
  let myGen = 0, botGen = 0;               /* 판이 바뀌면 세대를 올려 이전 예약을 무효화 */
  function laterBot(ms){
    const g = myGen;
    setTimeout(() => { botGen = g; if (g === myGen) botTurn(); }, ms);
  }
  const TURN_SEC = 15;
  /* 온라인: 남의 차례가 시간을 넘기면 다음 사람이 대신 패스를 적는다.
     내가 다음 차례면 바로, 아니면 순서만큼 늦게 나선다. 앞사람이 적으면 취소된다. */
  let watchId = null;
  function watchDeadline(){
    if (watchId){ clearTimeout(watchId); watchId = null; }
    if (!window.__net) return;
    const R = window.__room;
    if (!R || !R.round || turn === 0) return;
    const left = (R.round.deadline || 0) - Date.now();
    const gap = ((turn - 0 + SEATS.length) % SEATS.length);   /* 내가 몇 번째 뒤인가 */
    const wait = Math.max(0, left) + 800 + gap * 5000;        /* 받침: 5초씩 늦게 */
    watchId = setTimeout(() => {
      const R2 = window.__room;
      if (!R2 || !R2.round) return;
      if ((R2.round.deadline || 0) > Date.now()) return;      /* 그새 누가 뒀다 */
      if (turn === 0 || busy) return;
      submit(turn + ",p");                                    /* 대신 패스 */
    }, wait);
  }
  
  function resetTimer(){
    el("timer").innerHTML = "<i></i>";
    el("timer").classList.toggle("mine", turn === 0 && !busy);
    if (timerId) clearTimeout(timerId);
    if (tickId) clearInterval(tickId);
    tLeft = 0;
    if (turn === 0 && !busy){
      tLeft = TURN_SEC;
      renderBottom();
      tickId = setInterval(() => {
        tLeft--;
        if (tLeft <= 0){ clearInterval(tickId); tickId = null; }
        renderBottom();
      }, 1000);
      timerId = setTimeout(() => { if (turn === 0 && !busy) doPass(true); }, TURN_SEC * 1000);
    }
  }
  
  function clearTrick(){
    trick = []; spread = false; SEATS.forEach(s => s.s = "");
    if (checkFinish()) return;
    /* 마지막에 낸 사람이 이미 완주했으면 다음 순번 생존자가 선을 잡는다 */
    turn = lastPlayer == null ? 0 : lastPlayer;
    let guard = 0;
    while (SEATS[turn].c === 0){
      turn = (turn + 1) % SEATS.length;
      if (++guard > SEATS.length){ endRound(); return; }
    }
    busy = false; draw(); resetTimer();
    if (turn !== 0) laterBot(900);
  }
  
  /* 카드를 다 턴 사람을 완주 목록에 올린다 */
  function checkFinish(){
    SEATS.forEach((s, i) => { if (s.c === 0 && !finish.includes(i)) finish.push(i); });
    const left = SEATS.map((s, i) => i).filter(i => SEATS[i].c > 0);
    if (left.length <= 1){
      if (left.length === 1) finish.push(left[0]);   // 마지막 한 명이 꼴등
      if (window.__net){
        /* 온라인 — 방장 기기가 서버에 정산을 맡긴다. 결과는 방 상태로 모두에게 온다 */
        busy = true;
        if (timerId) clearTimeout(timerId);
        if (tickId) clearInterval(tickId);
        if (window.__endRoundOnline) window.__endRoundOnline(finish.slice());
        return true;
      }
      endRound();
      return true;
    }
    return false;
  }
  /* 게임 도중에 나가면 완주 실패로 기록한다 (점수 절반) */
  function quitGame(){
    if (window.__scored) return;
    window.__scored = true;
    const G = window.GAME || {};
    const sc = G.score || [];
    const order = sc.map((_, i) => i).sort((a, b) => (sc[b] || 0) - (sc[a] || 0));
    if (window.reportGame) window.reportGame(order.indexOf(0), sc.length || SEATS.length, sc[0] || 0, true);
  }
  window.__quitGame = quitGame;
  
  /* ---------- 한 수를 적용한다 ----------
     내 수든 남의 수든 봇 수든 전부 이 길로 들어온다.
     온라인에서 각자 화면이 어긋나지 않게 하는 핵심이다.
     move 는 "자리,숫자,장수" 또는 "자리,p" */
  function applyMove(str){
    const a = String(str).split(",");
    const seat = +a[0];
    if (!SEATS[seat]) return false;
  
    if (a[1] === "p"){                       /* 패스 */
      SEATS[seat].s = "pass";
      afterMove(seat, null);
      return true;
    }
  
    const num = +a[1], count = +a[2];
    const s = SEATS[seat];
  
    /* 손패에서 실제로 뺀다. 내 자리는 진짜 카드, 남의 자리는 장수만 맞춘다 */
    let cards;
    if (s.hold && s.hold.length){
      cards = takeFrom(s.hold, num, count);
      s.c = s.hold.length;
    } else {
      s.c = Math.max(0, s.c - count);
      cards = Array(count).fill(num);
    }
    if (seat === 0) hand = SEATS[0].hold;
  
    trick.push({by: seat, num: num, count: count, cards: cards.slice().sort((x, y) => x - y)});
    lastPlayer = seat;
    if (s.c === 0 && !finish.includes(seat)) finish.push(seat);
    afterMove(seat, num);
    return true;
  }
  
  /* 수를 적용한 뒤 차례를 옮긴다 */
  function afterMove(seat, num){
    /* 1번(과 2번 컷)은 바닥을 비우고 낸 사람이 다시 선 */
    if (num != null && clearsPile(num)){
      trick = []; spread = false; animated = 0;
      SEATS.forEach(x => x.s = "");
      if (SEATS[seat].c > 0){ turn = seat; return; }
    }
    /* 낼 수 있는 사람이 하나 이하면 바닥을 치우고 마지막에 낸 사람이 선.
       바닥이 비어 있어도 정리해야 한다. 안 그러면 아무도 못 두고 판이 멈춘다 */
    const still = SEATS.filter((x, i) => x.c > 0 && x.s !== "pass").length;
    if (still <= 1){
      const last = (lastPlayer != null && SEATS[lastPlayer] && SEATS[lastPlayer].c > 0)
        ? lastPlayer : SEATS.findIndex(x => x.c > 0);
      trick = []; spread = false; animated = 0;
      SEATS.forEach(x => x.s = "");
      if (last >= 0) turn = last;
      return;
    }
    let g = 0, t = seat;
    do { t = (t + 1) % SEATS.length; }
    while ((SEATS[t].c === 0 || SEATS[t].s === "pass") && g++ < SEATS.length * 2);
    turn = t;
  }
  
  function endRound(){
    busy = true;
    syncGame();
    const G = window.GAME;
    G.finish = finish.slice();
    G.order = finish.slice();                       // 다음 판 순서 = 이번 판 등수
    G.score = G.score || SEATS.map(() => 0);
    /* 판마다 상위 절반만 점수를 받는다. 6명이면 1·2·3등만 */
    const win = Math.floor(SEATS.length / 2);
    finish.forEach((seat, rank) => {
      if (rank < win) G.score[seat] += 100 - rank * 10;
    });
    draw();
    if (window.__onRoundEnd) setTimeout(window.__onRoundEnd, 900);
  }
  
  function advance(){
    if (checkFinish()) return;
    const alive = SEATS.filter(s => s.c > 0 && s.s !== "pass").length;
    if (alive <= 1 && trick.length){ setTimeout(clearTrick, 950); return; }
    let guard = 0;
    do {
      turn = (turn + 1) % SEATS.length;
      if (++guard > SEATS.length * 2){ endRound(); return; }   // 돌 사람이 없으면 종료
    } while (SEATS[turn].c === 0 || SEATS[turn].s === "pass");
    busy = false; draw(); resetTimer();
    if (turn !== 0) laterBot(950);
  }
  
  /* 손패에서 낼 수 있는 조합 중 가장 약한(숫자 큰) 것 */
  /* ---------- 상대 판단 ----------
     봇끼리 1200판을 붙여 고른 규칙이다.
     - 약한 카드(숫자가 큰 쪽)부터 털어낸다. 이 게임은 먼저 비우는 쪽이 이긴다
     - 짝이 맞는 조합은 깨지 않는다. 이게 가장 크게 이겼다
     - 카멜레온은 채워야 할 만큼만 쓴다
     - 가끔 최선이 아닌 수를 둬서 사람처럼 보이게 한다
     막기(상대가 곧 끝날 때 강한 카드로 끊기)와 1·2번 아끼기는
     실제로 붙여 보니 오히려 지는 쪽이라 넣지 않았다 */
  function botPick(hold, c, seat){
    const jok = hold.filter(isJ).length;
    const cnt = {};
    hold.forEach(x => { if (!isJ(x)) cnt[x] = (cnt[x] || 0) + 1; });
  
    const opts = [];
    const maxN = c ? c.num - 1 : 12;
    for (let n = 1; n <= maxN; n++){
      const same = cnt[n] || 0;
      if (!same) continue;
      if (c){
        const need = c.count - same;              /* 카멜레온으로 채울 장수 */
        if (need > jok) continue;
        opts.push({num: n, count: c.count, useJok: Math.max(0, need), own: same});
      } else {
        opts.push({num: n, count: same, useJok: 0, own: same});
      }
    }
    if (!opts.length){
      /* 손에 카멜레온만 남은 경우. 혼자 내면 13번으로 칠 수 있다 (선일 때만) */
      if (!c && jok > 0) return {num: 13, count: 1, useJok: 1, own: 0};
      return null;
    }
  
    opts.forEach(o => {
      let s = o.num * 2;                          /* 약한 카드부터 */
      s -= o.useJok * 10;                         /* 카멜레온은 아깝다 */
      if (c && o.own > o.count) s -= 24;          /* 남는 짝을 깨면 크게 감점 */
      o.score = s;
    });
    opts.sort((a, b) => b.score - a.score);
    if (opts.length > 1 && Math.random() < .1) return opts[1];
    return opts[0];
  }
  function takeFrom(hold, num, count){
    let left = count; const out = [];
    for (let i = hold.length - 1; i >= 0 && left; i--)
      if (hold[i] === num){ hold.splice(i, 1); out.push(num); left--; }
    for (let i = hold.length - 1; i >= 0 && left; i--)
      if (isJ(hold[i])){ out.push(hold[i]); hold.splice(i, 1); left--; }
    return out.sort((a, b) => a - b);
  }
  function botTurn(){
    /* 내 자리에서는 절대 자동으로 내지 않는다.
       판이 다시 시작되면 이전 판에서 예약된 호출이 남아 내 카드를 내던 버그가 있었다 */
    if (turn === 0){ busy = false; draw(); resetTimer(); return; }
    if (botGen !== myGen) return;          /* 지난 판에서 예약된 것 */
    busy = true;
    const s = SEATS[turn], pick = botPick(s.hold, cur(), turn);
    submit(pick ? (turn + "," + pick.num + "," + pick.count) : (turn + ",p"));
  }
  
  /* 1번은 아무도 못 받으니 즉시 정리하고 낸 사람이 다시 선.
     2번 컷을 켠 방이면 2번도 같다 */
  function clearsPile(numValue){
    if (numValue === 1) return true;
    return numValue === 2 && window.__opts && window.__opts.clear2;
  }
  el("play").onclick = () => {
    const list = sel.map(i => hand[i]); if (!legal(list)) return;
    const e = effective(list);
    sel = []; busy = true;
    submit(0 + "," + e + "," + list.length);
  };
  
  /* 수를 내보낸다. 온라인이면 서버로, 아니면 바로 적용한다 */
  let unlockId = null;
  function submit(mv){
    if (window.__net && window.__net.send){
      window.__net.send(mv);
      if (unlockId) clearTimeout(unlockId);
      unlockId = setTimeout(() => { busy = false; draw(); }, 6000);   /* 응답이 없으면 풀어 준다 */
      return;
    }
    const cleared = clearsPile(+mv.split(",")[1]);
    applyMove(mv);
    draw();
    if (cleared){
      flash(T[lang].cleared);
      setTimeout(() => { busy = false; afterApply(); }, 900);
      return;
    }
    setTimeout(() => { busy = false; afterApply(); }, 620);
  }
  
  /* 수를 적용한 뒤 다음으로 넘긴다 */
  function afterApply(){
    if (checkFinish()) return;
    draw(); resetTimer(); watchDeadline();
    if (turn !== 0 && !window.__net) laterBot(620);
  }
  
  /* 밖에서 들어온 수 (온라인) */
  window.__applyMove = mv => {
    busy = false;                       /* 수가 반영됐으니 잠금을 푼다 */
    applyMove(mv);
    draw();
    if (checkFinish()) return;
    resetTimer();
    watchDeadline();
  };
  function doPass(auto){
    if (turn !== 0 || busy) return;
    if (timerId) clearTimeout(timerId);
    sel = []; busy = true;
    if (auto) flash(T[lang].autoPass, true);
    submit("0,p");
  }
  el("pass").onclick = () => doPass(false);
  
  function flash(msg, msLong){
    const f = el("flash"); f.textContent = msg; f.style.opacity = 1;
    setTimeout(() => f.style.opacity = 0, msLong ? 2200 : 1200);
  }
  
  el("ring").addEventListener("click", e => {
    if (!trick.length) return;
    if (e.target.closest(".play, .spread")) { spread = !spread; renderPile(); }
  });
  
  document.querySelectorAll("#lang button").forEach(b => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document.documentElement.lang = lang;
      document.querySelectorAll("#lang button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });
  
  draw(); resetTimer();
  /* 서버에서 내 손패가 오면 다시 그린다 */
  window.addEventListener("handchange", () => {
    if (!window.__net) return;
    hand = (window.__hand || []).slice();
    if (SEATS[0]){ SEATS[0].hold = hand; SEATS[0].c = hand.length; }
    draw();
  });
  window.addEventListener("resize", draw);
  
  window.addEventListener("langchange", () => { lang = window.__lang; draw(); });
  
}
