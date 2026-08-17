import { scoped } from "../lib/scoped.js";
import * as eng from "../lib/engine.js";
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
         autoOff:"자동", autoOn:"자동 끄기",
         autoOnMsg:"자동치기로 넘어갑니다 · 카드를 만지면 풀립니다",
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
         autoOff:"Auto", autoOn:"Auto off",
         autoOnMsg:"Auto play on \u00B7 tap a card to take over",
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
  let SEATS = [];
  let hand = [];
  let finish = [];                 // 이번 판에 손을 턴 순서 (화면 자리)

  /* ---------- 엔진이 준 것으로 판을 세운다 ----------
     규칙 판단은 여기서 하지 않는다. 엔진이 정한 결과를 그대로 그린다.
     자리 번호를 돌리는 일은 view.js 안에서 이미 끝나 있다. */
  let offView = null;
  let lastRound = -1, overSent = false, holdPile = null, ghost = [], ghostSig = "";

  function apply(v){
    if (!v) return;
    SEATS = v.seats.map(x => ({ n: x.name, c: x.c, s: x.s, hold: x.hold || [] }));
    hand = v.hand.slice();
    if (SEATS[0]) SEATS[0].hold = hand;
    finish = v.finish.slice();
    turn = v.turn;
    busy = !v.myTurn;

    if (v.roundNo !== lastRound){          /* 새 판 */
      const first = lastRound < 0;
      lastRound = v.roundNo;
      sel = []; animated = 0; spread = false;
      window.__roundNo = v.roundNo;
      /* 첫 판이 아니고 게임이 안 끝났으면 방금 끝난 판을 보여주고 넘긴다.
         마지막 판이면 판 결과를 건너뛰고 최종 결과로 간다 */
      if (!first && !v.over && v.lastRound && window.__onRoundEnd){
        showLastRound(v);
        return;                            /* 새 판은 결과를 본 뒤에 그린다 */
      }
    }
    /* 바닥이 비워지면 잔상만 1.2초 남긴다 — 마지막 카드로 판을 끝낸 사람의 카드가
       눈에 띄지도 않고 사라지는 것을 막는다.
       잔상은 그리기 전용이다. 낼 수 있는지·패스가 되는지 판단에는 쓰지 않는다 */
    if (v.table.length === 0 && !v.over && (v.lastTable.length || trick.length)){
      /* 엔진이 준 "치우기 직전 모습"을 먼저 쓴다. 그게 없으면 화면에 있던 것을 쓴다 */
      const gsig = v.lastTable.map(t => t.by + ":" + t.num + "x" + t.count).join("|");
      if (gsig !== ghostSig){
        ghostSig = gsig;
        ghost = (v.lastTable.length ? v.lastTable : trick).map(t => ({
          by: t.by, num: t.num, count: t.count, cards: t.cards.slice(),
        }));
        animated = 0;
        if (holdPile) clearTimeout(holdPile);
        holdPile = setTimeout(() => { holdPile = null; ghost = []; draw(); }, 1400);
      }
    } else if (v.table.length){
      if (holdPile){ clearTimeout(holdPile); holdPile = null; }
      ghost = []; ghostSig = "";
    }
    if (v.table.length < trick.length){    /* 바닥이 새로 시작됐다 */
      animated = 0; spread = false;
    }
    trick = v.table.map(t => ({ by: t.by, num: t.num, count: t.count, cards: t.cards.slice() }));
    sel = sel.filter(i => i < hand.length);

    const me = finish.indexOf(0);
    window.__myRankIdx = me >= 0 ? me : null;

    if (v.over && !overSent){              /* 게임 끝 */
      overSent = true;
      window.__gameOver = v.over;
      window.GAME = window.GAME || {};
      window.GAME.score = v.over.score.slice();
      window.GAME.finish = v.over.order.slice();
      window.GAME.names = SEATS.map(x => x.n);
      if (window.__onGameOver) setTimeout(window.__onGameOver, 900);
    }
    if (v.phase === "tax" && window.__onTax) window.__onTax(v);

    draw();
    resetTimer();
  }

  /* 방금 끝난 판의 마지막 장면을 그대로 세워 두고, 잠시 뒤 결과 화면으로 */
  function showLastRound(v){
    const lr = v.lastRound;
    SEATS = v.seats.map((x, i) => ({
      n: x.name, c: i === lr.order[lr.order.length - 1] ? x.c : 0, s: "", hold: [],
    }));
    hand = [];
    finish = lr.order.slice();
    turn = -1; busy = true;
    trick = lr.table.map(t => ({ by: t.by, num: t.num, count: t.count, cards: t.cards.slice() }));
    animated = 0; spread = false;
    draw();
    if (timerId) clearTimeout(timerId);
    setTimeout(() => { window.__onRoundEnd && window.__onRoundEnd(v); }, 1600);
  }

  /* 카드를 직접 고르면 자동치기를 끈다 */
  function handTouched(){
    if (eng.engine.auto) setAuto(false);
  }

  function boot(){
    if (offView) offView();
    if (el("auto")){
      el("auto").textContent = T[lang].autoOff;
      el("auto").classList.remove("on");
    }
    eng.setAuto(false);
    if (holdPile){ clearTimeout(holdPile); holdPile = null; }
    ghost = []; ghostSig = "";
    lastRound = -1; overSent = false;
    trick = []; sel = []; busy = false; animated = 0; spread = false;
    offView = eng.onView(apply);
    if (eng.engine.view) apply(eng.engine.view);
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
        '<span class="seat__n">' + (s.n || "") + '</span>' +
        (i === 0 ? '' : fanHTML(s.c)) +
        '<span class="seat__c">' + T[lang].left(s.c) + '</span>';
      box.appendChild(d);
    });
    const nd = el("need");
    anchorSeats(box, nd ? nd.getBoundingClientRect().top - 4 : 0);
  }
  
  const outerTrick = () => trick;
  function renderPile(){
    const p = el("pile"); p.innerHTML = "";
    /* 바닥이 비었으면 잔상을 잠깐 대신 보여준다. 여기서만 쓴다 */
    const shown = outerTrick().length ? outerTrick() : ghost;
    const trick = shown;
    if (spread && trick.length){
      const t = T[lang];
      const maxC = Math.min(6, Math.max(...trick.map(x => x.count)));
      const cw = Math.max(18, Math.min(32, Math.floor((196 - (maxC - 1) * 3) / maxC)));
      p.innerHTML = '<div class="spread">' + trick.slice().reverse().map((x, idx) =>
        '<div class="srow' + (idx === 0 ? ' srow--new' : '') + '">' +
          '<span class="srow__w">' + ((SEATS[x.by] && SEATS[x.by].n) || "") + '</span>' +
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
      s.onclick = () => { handTouched(); if (turn !== 0 || busy) return;
        const k = sel.indexOf(i); if (k >= 0) sel.splice(k,1); else sel.push(i); draw(); };
      h.appendChild(s);
    });
    if (SEATS[0]) SEATS[0].c = hand.length;
  }
  
  function renderBottom(){
    const c = cur();
    const t = T[lang];
    const mine = turn === 0 && !busy;
    const who = turn === 0 ? "" : t.theirTurn((SEATS[turn] && SEATS[turn].n) || "") + " \u00B7 ";
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
    el("pass").disabled = turn !== 0 || busy || !cur();   /* 선은 패스할 수 없다 */
  }
  
  function draw(){
    /* 아직 판이 없으면 그릴 것도 없다.
       화면들은 앱이 뜰 때 한꺼번에 붙으므로, 게임 전에도 draw 가 불린다 */
    if (!SEATS.length) return;
    renderSeats(); renderPile(); renderHand(); renderBottom();
    const nd = el("need");
    anchorSeats(el("seats"), nd ? nd.getBoundingClientRect().top - 4 : 0);
  }
  
  let timerId = null, tickId = null, tLeft = 0;
  let myGen = 0, botGen = 0;               /* 판이 바뀌면 세대를 올려 이전 예약을 무효화 */
const TURN_SEC = 15;
  /* 검사에서 짧게 돌려볼 수 있게 열어 둔다. 평소에는 15초 */
  const turnSec = () => Number(window.__turnSec) || TURN_SEC;
  /* 온라인: 남의 차례가 시간을 넘기면 다음 사람이 대신 패스를 적는다.
     내가 다음 차례면 바로, 아니면 순서만큼 늦게 나선다. 앞사람이 적으면 취소된다. */
  function watchDeadline(){ /* 엔진이 차례를 관리한다. 제한 시간은 뒤에 서버 쪽에 붙인다 */ }
  
  function resetTimer(){
    el("timer").innerHTML = "<i></i>";
    el("timer").classList.toggle("mine", turn === 0 && !busy);
    if (timerId) clearTimeout(timerId);
    if (tickId) clearInterval(tickId);
    tLeft = 0;
    if (turn === 0 && !busy){
      tLeft = turnSec();
      renderBottom();
      tickId = setInterval(() => {
        tLeft--;
        if (tLeft <= 0){ clearInterval(tickId); tickId = null; }
        renderBottom();
      }, 1000);
      timerId = setTimeout(() => { if (turn === 0 && !busy) doPass(true); }, turnSec() * 1000);
    }
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
  
  /* 손패에서 낼 수 있는 조합 중 가장 약한(숫자 큰) 것 */
  /* 1번은 아무도 못 받으니 즉시 정리하고 낸 사람이 다시 선.
     2번 컷을 켠 방이면 2번도 같다 */
  function clearsPile(numValue){
    if (numValue === 1) return true;
    return numValue === 2 && window.__opts && window.__opts.clear2;
  }
  el("play").onclick = () => {
    const list = sel.map(i => hand[i]);
    if (!legal(list) || turn !== 0 || busy) return;
    const e = effective(list);
    sel = []; busy = true;
    eng.play(e, list.length);          /* 자리 번호를 붙이지 않는다. 엔진이 나를 안다 */
    unlockLater();
  };

  /* 수가 거부되면 새 상태가 안 온다. 그때 화면이 굳지 않게 잠금을 풀어 준다 */
  let unlockId = null;
  function unlockLater(){
    if (unlockId) clearTimeout(unlockId);
    unlockId = setTimeout(() => {
      unlockId = null;
      const v = eng.engine.view;
      if (v && v.myTurn && busy){ busy = false; draw(); }
    }, 1200);
  }

  function doPass(auto){
    if (turn !== 0 || busy) return;
    if (timerId) clearTimeout(timerId);
    /* 선은 패스할 수 없다. 시간이 다 됐으면 가장 약한 카드를 대신 낸다 */
    if (!cur()){
      if (!auto) return;
      const w = weakest();
      if (!w) return;
      sel = []; busy = true;
      flash(T[lang].autoPass, true);
      eng.play(w.num, w.count);
      if (auto) toAuto();
      return;
    }
    sel = []; busy = true;
    if (auto) flash(T[lang].autoPass, true);
    eng.passTurn();
    unlockLater();
    if (auto) toAuto();
  }

  /* 시간이 다 되면 이번 턴만 넘기고, 다음 턴부터는 자동치기로 맡긴다.
     자리를 비운 사람 때문에 판 전체가 계속 멈추는 것을 막는다.
     돌아와서 카드를 만지면 저절로 풀린다 */
  function toAuto(){
    if (eng.engine.auto) return;
    setTimeout(() => {
      setAuto(true);
      flash(T[lang].autoOnMsg, true);
    }, 400);
  }

  /* 선일 때 자동으로 낼 것: 가장 약한(숫자가 큰) 카드 한 장. 카멜레온만 남았으면 단독 13 */
  function weakest(){
    let best = null;
    for (const c of hand) if (!isJ(c) && (best === null || c > best)) best = c;
    if (best !== null) return { num: best, count: 1 };
    return hand.some(isJ) ? { num: 13, count: 1 } : null;
  }
  el("pass").onclick = () => doPass(false);

  /* 자동치기 — 잠깐 자리를 비울 때 봇과 같은 판단으로 대신 둔다.
     카드를 직접 고르면 저절로 꺼진다 */
  function setAuto(on){
    eng.setAuto(on);
    const b = el("auto");
    b.textContent = on ? T[lang].autoOn : T[lang].autoOff;
    b.classList.toggle("on", on);
    if (on){ sel = []; renderHand(); renderBottom(); }
  }
  el("auto").onclick = () => setAuto(!eng.engine.auto);
  
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
  
  boot();
  window.addEventListener("resize", draw);
  
  window.addEventListener("langchange", () => { lang = window.__lang; draw(); });
  
}
