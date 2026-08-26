import { scoped } from "../lib/scoped.js";
import { play as snd, stop as sndStop } from "../lib/sound.js";
import { avtFile } from "../lib/assets.js";
import * as eng from "../lib/engine.js";
import { RINGS as A_RINGS } from "../lib/assets.js";
import { ART as A_ART } from "../lib/assets.js";
import { EMOTES, EMOTE_BTN } from "../lib/assets.js";
import "../styles/table.css";

export function mount(root){

  /* 엔진 자리 → 그 사람이 고른 얼굴. GAME.avatars 가 없으면 첫 번째(생쥐) */
  function avtOf(seat){
    const g = window.GAME || {};
    const a = g.avatars || [];
    return avtFile(Number(a[seat]) || 0);
  }
  const document = scoped(root);
  
  const ART = A_ART;
  const KO_N = ["사자","호랑이","불곰","코끼리","악어","여우","기린","멧돼지","원숭이","토끼","새","생쥐"];
  const EN_N = ["LION","TIGER","BEAR","ELEPHANT","CROCODILE","FOX","GIRAFFE","BOAR","MONKEY","RABBIT","BIRD","MOUSE"];
  const T = {
    ko:{ roundN:n=>"ROUND "+n, joker:"카멜레온",
         myTurn:"내 차례", theirTurn:n=>n+" 차례",
         left:c=>'남은 <b>'+c+'</b>장', tagTurn:"차례", tagPass:"패스", tagOut:"완주",
         lead:"원하는 장수로 시작하세요", top1:'<b>1번</b>이 나왔습니다. 아무도 받을 수 없습니다',
         need:(c,n)=>'<b>'+c+'장</b>을 <b>'+n+'번 이하</b>로 받으세요',
         emptyPile:"바닥이 비었습니다<br>원하는 카드를 내세요",
         pass:"패스", pick:"대기중", play:n=>n+"장 내기",
         notTurn:"대기중", mix:"같은 숫자만 함께 낼 수 있습니다",
         cnt:n=>n+"장을 맞춰 주세요", lower:"더 낮은 숫자를 내세요",
         autoOff:"자동 OFF", autoOn:"자동 ON", emoBtn:"이모티콘",
         autoOnMsg:"자동치기로 넘어갑니다\n카드를 만지면 풀립니다",
         autoPass:"시간이 다 되어 자동으로 넘겼습니다", left2:n=>n+"초", cleared:"판을 비웠습니다 · 다시 선",
         close:"다시 누르면 접힙니다" },
  
    en:{ roundN:n=>"ROUND "+n, joker:"CHAMELEON",
         myTurn:"Your turn", theirTurn:n=>n+"'s turn",
         left:c=>'<b>'+c+'</b> left', tagTurn:"turn", tagPass:"passed", tagOut:"done",
         lead:"Lead with any number of cards", top1:'<b>1</b> is out. Nobody can beat it',
         need:(c,n)=>'Beat with <b>'+c+(c===1?' card':' cards')+'</b> of <b>'+n+' or lower</b>',
         emptyPile:"The pile is empty<br>Play anything you like",
         pass:"Pass", pick:"Waiting", play:n=>"Play "+n,
         notTurn:"Waiting", mix:"Cards must share one number",
         cnt:n=>"Play exactly "+n, lower:"Play a lower number",
         autoOff:"AUTO OFF", autoOn:"AUTO ON", emoBtn:"EMOJI",
         autoOnMsg:"Auto play on\nTap a card to take over",
         autoPass:"Time up \u2014 passed for you", left2:n=>n+"s", cleared:"Pile cleared \u00B7 you lead again",
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
  let offView = null, offEmote = null;
  let lastRound = -1, overSent = false, holdPile = null, ghost = [], ghostSig = "";
  let holdingEnd = false;

  /* ---------- 소리 ----------
     화면이 바뀌는 자리마다 울린다. 소리 파일이 없으면 조용히 넘어간다 */
  let sndTurn = false, sndCount = -1, sndFin = 0, sndRev = 0, sndPass = 0;
  const onScreen = () => {
    const sec = window.document.getElementById("table");
    return Boolean(sec && sec.classList.contains("is-on"));
  };
  function sounds(v){
    /* 세금·혁명·결과 화면을 보는 동안에는 이 화면이 뒤에서 계속 살아 있다.
       그때 소리를 내면 **화면보다 먼저** 벨이 울린다 */
    if (!onScreen()){
      sndCount = (v.table || []).length;
      sndTurn = Boolean(v.myTurn);
      sndFin = (v.finish || []).length;
      sndPass = (v.seats || []).filter(x => x.s === "pass").length;
      return;
    }
    /* 누가 카드를 냈다 / 패스했다 — 바닥에 쌓인 수가 바뀌는 것으로 안다 */
    const n = (v.table || []).length;
    if (sndCount >= 0 && n > sndCount) snd("card_play");
    if (n === 0 && sndCount > 0) { /* 바닥이 치워졌다 — 소리 없음 */ }
    sndCount = n;
    /* 내 차례가 막 왔다 */
    if (v.myTurn && !sndTurn) snd("my_turn");
    sndTurn = Boolean(v.myTurn);
    /* 누가 완주했다 */
    const fin = (v.finish || []).length;
    if (fin > sndFin){
      const who = v.finish[fin - 1];
      snd(who === 0 ? "win" : "card_play");
      /* 내가 꼴등으로 남았다 */
      if (v.seats && fin === v.seats.length - 1 && !v.finish.includes(0)) snd("lose");
    }
    sndFin = fin;
    /* 혁명이 확정되는 순간 한 번 */
    const rev = v.revolution && v.revolution.declared ? 1 : 0;
    if (rev && !sndRev) snd("revolution");
    sndRev = rev;
    /* 패스 — 방금 패스한 사람이 늘었다 */
    const ps = (v.seats || []).filter(x => x.s === "pass").length;
    if (ps > sndPass) snd("pass");
    sndPass = ps;
  }

  function apply(v){
    if (!v) return;
    /* 방금 끝난 판을 세워 두는 동안에는 새 판 상태를 그리지 않는다.
       안 그러면 다음 판이 잠깐 비쳤다가 결과 화면으로 넘어간다 */
    if (holdingEnd && !v.over) return;
    sounds(v);
    SEATS = v.seats.map(x => ({ n: x.name, c: x.c, s: x.s, hold: x.hold || [], av: x.seat, r: x.rank }));
    hand = v.hand.slice();
    if (SEATS[0]) SEATS[0].hold = hand;
    finish = v.finish.slice();
    turn = v.turn;
    busy = !v.myTurn;

    if (v.roundNo !== lastRound){          /* 새 판 */
      const first = lastRound < 0;
      lastRound = v.roundNo;
      sel = []; animated = 0; spread = false;
      sndCount = -1; sndFin = 0; sndTurn = false; sndPass = 0; sndRev = 0;
      /* 패 나누는 소리는 **판 화면에 들어올 때** 낸다.
         여기서 내면 뽑기 화면에 있는 동안 먼저 울리고, 들어와서 또 울린다 */
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
        /* 이미 화면에 있던 것은 다시 날아오면 안 된다.
           전원이 패스해 바닥이 비워질 때 앞서 낸 카드가 또 날아오던 문제 */
        animated = Math.min(animated, ghost.length);
        if (holdPile) clearTimeout(holdPile);
        holdPile = setTimeout(() => { holdPile = null; ghost = []; draw(); }, 2000);
      }
    } else if (v.table.length){
      if (holdPile){ clearTimeout(holdPile); holdPile = null; }
      ghost = []; ghostSig = "";
    }
    if (v.table.length < trick.length){    /* 바닥이 새로 시작됐다 */
      /* 잔상을 보여 주는 중이면 건드리지 않는다.
         여기서 0 으로 되돌리면 **앞서 낸 카드가 다시 날아오는 연출**이 나온다 —
         전원이 패스해 바닥이 비워지고 내 차례로 돌아올 때 그랬다 */
      if (!ghost.length) animated = 0;
      spread = false;
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
    holdingEnd = true;
    const lr = v.lastRound;
    /* 그때의 장수를 그대로 쓴다. 엔진은 판이 끝나자마자 다음 판을 나누므로
       지금 view 의 장수는 이미 새 판 것이다 — 마지막 남은 사람 손이 갑자기 10장이 됐었다 */
    const lc = lr.counts || [];
    SEATS = v.seats.map((x, i) => ({
      n: x.name, c: lc[i] != null ? lc[i] : (i === lr.order[lr.order.length - 1] ? x.c : 0),
      s: "", hold: [], av: x.seat, r: lr.order.indexOf(i),
    }));
    hand = [];
    finish = lr.order.slice();
    turn = -1; busy = true;
    trick = lr.table.map(t => ({ by: t.by, num: t.num, count: t.count, cards: t.cards.slice() }));
    animated = Math.max(0, trick.length - 1);   /* 마지막 한 수만 날아온다 */
    spread = false;
    draw();
    if (timerId) clearTimeout(timerId);
    setTimeout(() => {
      holdingEnd = false;
      window.__onRoundEnd && window.__onRoundEnd(v);
    }, 2000);
  }

  /* 카드를 직접 고르면 자동치기를 끈다 */
  function handTouched(){
    if (eng.engine.auto) setAuto(false);
  }

  function boot(){
    if (offView) offView();
    if (offEmote) offEmote();
    if (el("auto")) setAuto(false);
    eng.setAuto(false);
    if (holdPile){ clearTimeout(holdPile); holdPile = null; }
    ghost = []; ghostSig = ""; holdingEnd = false;
    lastRound = -1; overSent = false;
    trick = []; sel = []; busy = false; animated = 0; spread = false;
    emoUntil = 0; emoPickOpen(false); paintEmoBtn();
    Object.keys(emoNow).forEach(p2 => delete emoNow[p2]);
    if (el("emolayer")) el("emolayer").innerHTML = "";
    offEmote = eng.onEmote(e => showEmote(e.pos, e.k));   /* 감정표현은 소리 없이 */
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
  
  /* as = 카멜레온이 변신한 숫자. 같이 낸 카드가 있으면 그 숫자가 된다.
     혼자 낸 카멜레온(13번)은 as 가 없어 숫자를 안 적는다 */
  function cardHTML(n, w, as){
    if (isJ(n)){
      /* 숫자가 없어도 빈 칸을 양쪽에 둬야 이름이 가운데로 온다.
         한쪽만 있으면 space-between 이 이름을 왼쪽 끝으로 밀어버린다 */
      const num = (as == null || as >= 13) ? '<span class="card__num as"></span>'
                                           : '<span class="card__num as">' + as + '</span>';
      return '<div class="card is-joker" style="--w:' + w + 'px">' +
        '<div class="card__band">' + num +
        '<span class="card__name">' + T[lang].joker + '</span>' + num + '</div>' +
        '<div class="card__art"><img src="' + art(n) + '" alt=""></div>' +
        '<div class="card__band">' + num + num + '</div></div>';
    }
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
    /* 12시 자리는 바닥에 쌓인 카드가 프로필까지 덮는다. 그만큼 더 올린다 */
    const top = s < -0.85;
    const nudge = top ? 22 : (s > 0.9 ? 9 : (side ? 4 : (s > 0.25 ? 2 : 0)));
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
  /* 이 카드를 지금 고를 수 있는가.
     못 내는 카드를 고르게 해 놓고 나중에 단추에 이유를 적는 대신,
     아예 안 골리게 한다 — 고른 것은 언제나 뺄 수 있다 */
  function canPick(i){
    if (sel.includes(i)) return true;
    const card = hand[i];
    if (isDead(card)) return false;              /* 바닥을 이길 수 없는 카드 */
    const c = cur();
    if (c && sel.length >= c.count) return false; /* 장수를 넘길 수 없다 */
    const next = sel.map(k => hand[k]).concat([card]);
    if (effective(next) === null) return false;   /* 숫자가 섞이면 안 된다 */
    /* 카멜레온만으로 장수를 다 채우면 13번이 되어 아무것도 못 이긴다 */
    if (c && next.every(isJ) && next.length >= c.count) return false;
    return true;
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
  /* 1등 · 2등 … / 1st · 2nd … */
  function rankTag(r){
    const k = r + 1;
    if (lang === "ko") return k + "등";
    const t = k % 10, h = k % 100;
    const sfx = (t === 1 && h !== 11) ? "st" : (t === 2 && h !== 12) ? "nd"
              : (t === 3 && h !== 13) ? "rd" : "th";
    return k + sfx;
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
      d.style.setProperty("--av", 44 + "px");   /* 인원과 무관하게 같은 크기 */
      d.style.setProperty("--fs", (big ? 10.5 : 9) + "px");
      d.style.zIndex = 6 + Math.round(p.y);
      const tg = T[lang];
      /* 다 낸 사람은 몇 등으로 끝냈는지 붙인다. 차례는 테두리로 알린다 */
      const tag = s.c === 0 ? (s.r >= 0 ? rankTag(s.r) : tg.tagOut)
                : s.s === "pass" ? tg.tagPass : "";
      /* 12시 자리는 바닥에 깔린 카드에 가린다. 그 자리만 카드·장수를 프로필 위로 */
      const topSeat = i !== 0 && p.y < 22;
      if (topSeat) d.classList.add("seat--above");
      /* 등수표는 프로필 원을 기준으로 붙여야 자리 배치가 바뀌어도 따라간다.
         12시 자리는 카드가 위로 가서, .seat 기준으로 잡으면 엉뚱한 데 붙는다 */
      const av = '<span class="seat__avwrap">' +
        '<span class="seat__av" style="background-image:url(' + A_RINGS.avatar + '),url(' +
          avtOf(s.av == null ? i : s.av) + ')"></span>' +
        (tag ? '<span class="seat__tag">' + tag + '</span>' : '') + '</span>';
      const nm = '<span class="seat__n">' + (s.n || "") + '</span>';
      const fan = i === 0 ? '' : fanHTML(s.c);
      const cnt = '<span class="seat__c">' + T[lang].left(s.c) + '</span>';
      d.innerHTML = topSeat ? (fan + cnt + av + nm) : (av + nm + fan + cnt);
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
      s.className = "slot" + (sel.includes(i) ? " slot--sel" : "") +
        (turn === 0 && !busy && !canPick(i) ? " slot--dead" : "");
      s.style.left = ((h.clientWidth - total) / 2 + i * step) + "px";
      s.style.zIndex = i;
      s.innerHTML = cardHTML(c, w);
      onTap(s, () => { handTouched(); if (turn !== 0 || busy) return;
        const k = sel.indexOf(i);
        if (k >= 0){ sel.splice(k, 1); draw(); return; }
        if (!canPick(i)) return;               /* 못 내는 카드는 아예 안 골린다 */
        sel.push(i); draw(); });
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
    el("pass").textContent = t.pass;
    const list = sel.map(i => hand[i]);
    const ok = legal(list) && turn === 0 && !busy;
    const b = el("play");
    b.disabled = !ok;
    /* 못 누르는 단추에는 안내를 길게 적지 않는다 — 흐려져 있어 어차피 못 누른다.
       고르다 틀린 경우(장수·숫자)만 이유를 알려 준다 */
    /* 못 내는 카드는 아예 안 골리므로, 남는 경우는 "장수가 덜 찼다" 하나뿐이다.
       이유를 길게 적는 대신 목표 장수를 흐리게 보여준다 */
    b.textContent = turn !== 0 ? t.notTurn
      : ok ? t.play(list.length)
      : cur() ? t.play(cur().count)
      : t.pick;
    el("pass").disabled = turn !== 0 || busy || !cur();   /* 선은 패스할 수 없다 */
  }
  
  function draw(){
    /* 아직 판이 없으면 그릴 것도 없다.
       화면들은 앱이 뜰 때 한꺼번에 붙으므로, 게임 전에도 draw 가 불린다 */
    if (!SEATS.length) return;
    renderSeats(); renderPile(); renderHand(); renderBottom();
    paintEmotes();   /* 자리를 새로 그렸으니 떠 있던 감정표현을 다시 붙인다 */
    el("seats").querySelectorAll(".seat__tag").forEach(keepInView);   /* 등수·패스 표도 */
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
  
  let showId = null;
  function resetTimer(){
    if (showId) clearTimeout(showId);
    showId = null;
    el("timer").innerHTML = "<i></i>";
    el("timer").classList.toggle("mine", turn === 0 && !busy);
    if (timerId) clearTimeout(timerId);
    if (tickId) clearInterval(tickId);
    sndStop("tick");                   /* 내 차례가 끝나면 재촉 소리도 그친다 */
    tLeft = 0;
    /* 화면을 세우는 것이 보이기보다 먼저다. 아직 안 보이면 잠깐 뒤에 다시 본다 */
    if (turn === 0 && !busy && !onScreen()){
      showId = setTimeout(resetTimer, 150);
      return;
    }
    if (turn === 0 && !busy){
      tLeft = turnSec();
      renderBottom();
      tickId = setInterval(() => {
        tLeft--;
        if (tLeft === 5) snd("tick");        /* 5초 남았다는 신호 */
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
  /* 누름은 **pointerup** 으로 받는다.

     click 은 손을 떼고 조금 뒤에 오는데, 그 사이에 화면을 다시 그리면
     눌린 것이 사라져 **한 번 눌러서는 안 먹는 일**이 생긴다.
     그래서 손을 떼는 순간 바로 받고, 뒤따라오는 click 은 무시한다 */
  /* 누름을 받는다.

     폰에서는 손가락 하나를 눌러도 신호가 여러 번 온다.
       터치 → pointerdown, pointerup, mousedown, mouseup, click
     그리고 브라우저가 **뒤따라 마우스 신호를 한 벌 더** 보내는 일이 있어서,
     pointerup 이 두 번 오기도 한다. 그게 카드가 두 번 나가던 원인이다.

     그래서 신호 종류로 거르지 않고, **한 번 누른 뒤 잠깐은 무조건 막는다**.
     사람이 0.4초 안에 일부러 두 번 누를 일은 없다 */
  let touchAt = 0;              /* 마지막으로 손가락을 뗀 시각 (화면 전체에서 하나) */
  function onTap(node, fn){
    if (!node) return;
    /* 손가락은 **touchend** 로 받고 그 자리에서 기본 동작을 막는다.
       그러면 폰이 뒤따라 보내는 mousedown·mouseup·click 이 아예 안 생긴다.
       pointer 신호로 거르려 했더니, 손가락 것과 뒤따르는 마우스 것이
       구분이 잘 안 돼 어떤 폰에서는 두 번 먹고 어떤 폰에서는 안 먹었다.
       마우스로 쓸 때는 예전처럼 click 으로 받는다 */
    let startX = 0, startY = 0, inside = false;
    node.addEventListener("touchstart", e => {
      const t = e.touches && e.touches[0];
      startX = t ? t.clientX : 0; startY = t ? t.clientY : 0;
      inside = true;
    }, { passive: true });
    node.addEventListener("touchend", e => {
      if (e.cancelable) e.preventDefault();   /* 뒤따르는 마우스 신호를 막는다 */
      touchAt = Date.now();
      if (!inside) return;
      inside = false;
      /* 손가락이 단추 밖으로 많이 나갔으면 누른 것으로 안 본다 */
      const t = e.changedTouches && e.changedTouches[0];
      if (t){
        const r = node.getBoundingClientRect();
        const x = t.clientX, y = t.clientY;
        if (x < r.left - 8 || x > r.right + 8 || y < r.top - 8 || y > r.bottom + 8) return;
      }
      fn(e);
    }, { passive: false });
    node.addEventListener("touchcancel", () => { inside = false; }, { passive: true });
    node.onclick = e => {
      /* 손가락을 쓴 **직후**의 click 만 버린다. 마우스로 쓸 때는 그대로 받는다 */
      if (Date.now() - touchAt < 900) return;
      if (e && e.button != null && e.button !== 0) return;
      fn(e);
    };
  }

  onTap(el("play"), () => {
    const list = sel.map(i => hand[i]);
    if (!legal(list) || turn !== 0 || busy) return;
    const e = effective(list);
    sel = []; busy = true;
    sndStop("tick");                   /* 다 냈으니 재촉하는 소리도 멈춘다 */
    eng.play(e, list.length);          /* 자리 번호를 붙이지 않는다. 엔진이 나를 안다 */
    iMoved();
    unlockLater();
  });

  /* 수가 거부되면 새 상태가 안 온다. 그때 화면이 굳지 않게 잠금을 풀어 준다.

     예전에는 1.2초만 지나면 무조건 풀었다. 서버까지 갔다 오는 데 그보다 오래 걸리면
     아직 처리 중인데도 풀려서, 한 번 눌러도 반응이 없는 것처럼 보이고
     다시 누르면 **같은 수가 두 번 나갔다**(카드가 티틱 하고 두 장 날아가던 것).
     그래서 **판이 그대로일 때만** 푼다. 조금이라도 움직였으면 처리된 것이다 */
  let unlockId = null;
  function viewSig(v){
    if (!v) return "";
    return v.turn + "|" + (v.table || []).length + "|" +
           (v.seats || []).map(x => x.c + (x.s || "")).join(",");
  }
  function unlockLater(){
    if (unlockId) clearTimeout(unlockId);
    const sent = viewSig(eng.engine.view);
    let tries = 0;
    const look = () => {
      unlockId = null;
      const v = eng.engine.view;
      if (!busy) return;
      if (viewSig(v) !== sent){ return; }        /* 움직였다 — 잘 갔다 */
      if (++tries < 5){ unlockId = setTimeout(look, 1200); return; }
      if (v && v.myTurn){ busy = false; draw(); }  /* 6초가 지나도 그대로면 거부된 것 */
    };
    unlockId = setTimeout(look, 1200);
  }

  /* 내가 직접 뒀다고 서버에 알린다. 안 알리면 자리를 비운 것으로 본다 */
  function iMoved(){ if (window.__iMoved) window.__iMoved(); }

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
    sndStop("tick");
    if (auto) flash(T[lang].autoPass, true);
    if (!auto) iMoved();
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
  onTap(el("pass"), () => doPass(false));

  /* 자동치기 — 잠깐 자리를 비울 때 봇과 같은 판단으로 대신 둔다.
     카드를 직접 고르면 저절로 꺼진다 */
  function setAuto(on){
    eng.setAuto(on);
    const b = el("auto");
    b.setAttribute("aria-pressed", String(Boolean(on)));
    const t = b.querySelector("span");
    if (t) t.textContent = on ? T[lang].autoOn : T[lang].autoOff;
    b.classList.toggle("on", on);
    if (on){ sel = []; renderHand(); renderBottom(); }
  }
  el("auto").onclick = () => setAuto(!eng.engine.auto);
  
  /* ---------- 감정표현 ----------
     단추를 누르면 다섯 개가 올라오고, 하나 고르면 내 프로필 옆에 2초 뜬다.
     남이 보낸 것도 같은 자리에 뜬다. 연타는 2.5초 막는다 */

  const EMO_SHOW = 1000, EMO_COOL = 2500;
  let emoUntil = 0;                 /* 다음에 보낼 수 있는 시각 */
  const emoTimers = {};             /* 화면 자리 → 지우기 예약 */

  function emoText(k){
    const e = EMOTES.find(x => x.k === k);
    return e ? (lang === "ko" ? e.ko : e.en) : "";
  }
  function emoImg(k){
    const e = EMOTES.find(x => x.k === k);
    return e ? e.img : "";
  }
  function esc(x){
    return String(x).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  }

  function emoPickOpen(on){
    const p = el("emopick");
    if (!on){ p.hidden = true; p.innerHTML = ""; return; }
    p.innerHTML = EMOTES.map(e =>
      '<button type="button" data-k="' + esc(e.k) + '">' +
        '<span class="emobub">' + esc(lang === "ko" ? e.ko : e.en) + '</span>' +
        '<span class="emoimg" style="background-image:url(' + e.img + ')"></span>' +
      '</button>').join("");
    p.hidden = false;
    /* 떠 있는 판이라 자리를 직접 잡아 준다 — 손패 바로 위 */
    const h = el("hand");
    if (h && p.offsetParent){
      const ph = p.offsetParent.getBoundingClientRect();
      const hb = h.getBoundingClientRect();
      p.style.bottom = Math.round(ph.bottom - hb.top + 4) + "px";
      p.style.top = "auto";
    }
    p.querySelectorAll("button").forEach(b => {
      b.onclick = () => { emoSend(b.dataset.k); emoPickOpen(false); };
    });
  }

  function emoSend(k){
    const now = Date.now();
    if (now < emoUntil) return;      /* 연타 막기 */
    emoUntil = now + EMO_COOL;
    paintEmoBtn();
    setTimeout(paintEmoBtn, EMO_COOL + 20);
    eng.sendEmote(k);
  }

  function paintEmoBtn(){
    const b = el("emo");
    if (!b) return;
    b.textContent = T[lang].emoBtn;
    b.disabled = Date.now() < emoUntil;
  }

  /* 지금 떠 있는 것. 자리를 다시 그려도 살아남아야 한다 —
     봇이 카드를 낼 때마다 자리를 새로 그리므로, 붙여 두기만 하면 바로 지워진다 */
  const emoNow = {};

  function paintEmote(pos){
    const layer = el("emolayer");
    const seats = el("seats");
    const d = seats && seats.children[pos];
    if (!layer || !d) return;
    const old = layer.querySelector('[data-pos="' + pos + '"]');
    if (old) old.remove();
    const cur2 = emoNow[pos];
    const wrap = d.querySelector(".seat__avwrap");
    const tag = wrap && wrap.querySelector(".seat__tag");
    if (!cur2 || Date.now() >= cur2.until){
      if (tag) tag.style.visibility = "";
      return;
    }
    if (tag) tag.style.visibility = "hidden";   /* 등수표와 자리가 겹친다 */
    const av = d.querySelector(".seat__av");
    if (!av) return;
    const box = document.createElement("span");
    box.className = "seat__emo";
    box.dataset.pos = String(pos);
    box.innerHTML = '<span class="emobub">' + esc(emoText(cur2.k)) + '</span>' +
                    '<span class="emoimg" style="background-image:url(' + emoImg(cur2.k) + ')"></span>';
    /* 자리를 다시 그릴 때마다 이 상자도 새로 만든다.
       그때마다 떠오르는 연출을 다시 틀면 깜빡깜빡 끊겨 보인다 —
       처음 뜰 때만 틀고, 다시 붙일 때는 끄고 그대로 놔둔다 */
    if (cur2.shown) box.style.animation = "none";
    else cur2.shown = true;
    layer.appendChild(box);
    /* 프로필 자리를 재서 그 위에 얹는다. 판 바깥의 층이라 좌표를 직접 잡아야 한다 */
    const lb = layer.getBoundingClientRect(), ab = av.getBoundingClientRect();
    box.style.left = Math.round((ab.left + ab.right) / 2 - lb.left) + "px";
    box.style.bottom = Math.round(lb.bottom - ab.bottom - 10) + "px";
    keepInView(box);
  }

  /* 프로필에 매달린 것(말풍선·등수표)은 자리 상자 밖으로 튀어나와 있어서
     anchorSeats 의 화면 맞춤에 안 잡힌다. 좌우 끝자리에서 잘려 나가므로
     나간 만큼 직접 당겨 준다 */
  function keepInView(box){
    if (!box) return;
    const stage = window.document.getElementById("stage") || window.document.documentElement;
    const W = stage.getBoundingClientRect();
    const r = box.getBoundingClientRect();
    if (!r.width) return;
    let dx = 0;
    if (r.left < W.left + 2) dx = (W.left + 2) - r.left;
    else if (r.right > W.right - 2) dx = (W.right - 2) - r.right;
    box.style.marginLeft = dx ? Math.round(dx) + "px" : "";
  }

  /* 자리를 다시 그린 뒤 붙여 준다 */
  function paintEmotes(){
    Object.keys(emoNow).forEach(p => paintEmote(Number(p)));
  }

  function showEmote(pos, k){
    emoNow[pos] = { k, until: Date.now() + EMO_SHOW, shown: false };
    paintEmote(pos);
    if (emoTimers[pos]) clearTimeout(emoTimers[pos]);
    emoTimers[pos] = setTimeout(() => {
      delete emoNow[pos];
      emoTimers[pos] = null;
      paintEmote(pos);
    }, EMO_SHOW);
  }

  el("emo").onclick = () => {
    if (Date.now() < emoUntil) return;
    emoPickOpen(el("emopick").hidden);
  };

  /* 줄바꿈은 \n 으로 넘긴다. 한 줄로 길게 늘어놓으면 화면을 가로지른다 */
  function flash(msg, msLong){
    const f = el("flash");
    f.innerHTML = String(msg).split("\n")
      .map(x => x.replace(/[&<>]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;" }[ch])))
      .join("<br>");
    f.style.opacity = 1;
    setTimeout(() => f.style.opacity = 0, msLong ? 2200 : 1200);
  }
  
  el("ring").addEventListener("click", e => {
    if (!trick.length) return;
    if (e.target.closest(".play, .spread")) { spread = !spread; renderPile(); }
  });
  
  boot();
  window.addEventListener("resize", draw);
  
  window.addEventListener("langchange", () => { lang = window.__lang; draw(); });
  
}
