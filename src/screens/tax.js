import { scoped } from "../lib/scoped.js";
import { play as snd } from "../lib/sound.js";
import { avtFile } from "../lib/assets.js";
import { RINGS as A_RINGS } from "../lib/assets.js";
import { ART_DECK as A_DECK } from "../lib/assets.js";
import "../styles/tax.css";

export function mount(root){

  /* 엔진 자리 → 그 사람이 고른 얼굴. GAME.avatars 가 없으면 첫 번째(생쥐) */
  function avtOf(seat){
    const g = window.GAME || {};
    const a = g.avatars || [];
    return avtFile(Number(a[seat]) || 0);
  }
  const document = scoped(root);
  
  const ART = A_DECK;
  const el = id => document.getElementById(id);
  const isJ = c => c >= 13;
  
  const KO_N = ["사자","호랑이","불곰","코끼리","악어","여우","기린","멧돼지","원숭이","토끼","새","생쥐"];
  const EN_N = ["LION","TIGER","BEAR","ELEPHANT","CROCODILE","FOX","GIRAFFE","BOAR","MONKEY","RABBIT","BIRD","MOUSE"];
  const T = {
    ko:{
      steps:["등수 발표","패 나누기","혁명","세금","시작"],
      dealH:"패 나누기", dealS:"80장을 골고루 나눕니다. 이 순간 카멜레온 두 장이 한 사람에게 몰리면 혁명이 열립니다.",
      rankH:"이번 판의 등수", rankS:"지난 판에서 손을 턴 순서가 그대로 이번 판 등수가 됩니다.",
      revH:"혁명", revNone:"카멜레온 두 장을 모두 쥔 사람이 없습니다.",
      revMine:"카멜레온 두 장이 모두 손에 들어왔습니다. 혁명을 선언하면 이번 판 세금이 사라집니다.",
      revOther:n=>n+"님이 카멜레온 두 장을 쥐고 혁명을 선언했습니다. 이번 판 세금은 없습니다.",
      revGreatOther:n=>n+"님이 꼴등으로 대혁명을 선언했습니다. 세금이 사라지고 등수가 통째로 뒤집힙니다.",
      revGreatMine:"꼴등인데 카멜레온 두 장을 모두 쥐었습니다. 대혁명을 선언하면 세금이 사라지고 계급이 통째로 뒤집힙니다.",
      revGreatDone:"대혁명. 계급이 뒤집혔습니다.", revDone:"혁명. 이번 판 세금은 없습니다.",
      taxH:"세금", taxSkip:"혁명으로 이번 판 세금은 걷지 않습니다.",
      taxMineTop:n=>'꼴등 <b>'+n+'</b>님의 가장 좋은 카드 두 장을 가져옵니다. 대신 아무 카드나 두 장을 주세요.',
      taxMineTop2:n=>'뒤에서 두 번째 <b>'+n+'</b>님과 한 장씩 바꿉니다. 줄 카드 한 장을 고르세요.',
      taxMineBot:n=>'1등 <b>'+n+'</b>님이 내 가장 좋은 카드 두 장을 가져갑니다.',
      taxMineBot2:n=>'2등 <b>'+n+'</b>님이 내 가장 좋은 카드 한 장을 가져갑니다.',
      taxMid:"1등과 꼴등이 카드를 주고받습니다.",
      give:n=>n+"장 주기", giveNeed:n=>"줄 카드 "+n+"장을 고르세요",
      take:"가져옴", gave:"줌",
      doneH:"준비 완료", doneS:n=>'<b>'+n+'</b>님이 첫 판을 시작합니다.',
      declare:"혁명 선언", declareG:"대혁명 선언", skip:"넘기기",
      waitSec:n=>n+"초 후 다음으로 넘어갑니다",
      next:"다음", back:"처음부터", start:"판 시작",
      joker:"카멜레온"
    },
    en:{
      steps:["Standings","Deal","Revolution","Tax","Start"],
      dealH:"Dealing", dealS:"All 80 cards go out. If both chameleons land in one hand, a revolution opens up.",
      rankH:"Standings for this round", rankS:"Last round's finishing order becomes this round's standing.",
      revH:"Revolution", revNone:"Nobody holds both chameleons.",
      revMine:"Both chameleons are in your hand. Declare a revolution and this round's tax is cancelled.",
      revOther:n=>n+" holds both chameleons and declared a revolution. No tax this round.",
      revGreatOther:n=>n+" declared a great revolution from last place. Tax is cancelled and every standing reverses.",
      revGreatMine:"You are last and hold both chameleons. A great revolution cancels tax and reverses every rank.",
      revGreatDone:"Great revolution. Every rank is reversed.", revDone:"Revolution. No tax this round.",
      taxH:"Tax", taxSkip:"The revolution cancels tax for this round.",
      taxMineTop:n=>'You take the two best cards from <b>'+n+'</b>, last place. Hand back any two.',
      taxMineTop2:n=>'You swap one card with <b>'+n+'</b>, second from last. Pick one to give.',
      taxMineBot:n=>'<b>'+n+'</b>, in first place, takes your two best cards.',
      taxMineBot2:n=>'<b>'+n+'</b>, in second place, takes your best card.',
      taxMid:"The top and bottom players exchange cards.",
      give:n=>"Give "+n, giveNeed:n=>"Pick "+n+" to give",
      take:"taken", gave:"given",
      doneH:"Ready", doneS:n=>'<b>'+n+'</b> leads the first trick.',
      declare:"Declare", declareG:"Declare great revolution", skip:"Skip",
      waitSec:n=>"Next in "+n+"s",
      next:"Next", back:"Restart", start:"Start round",
      joker:"CHAMELEON"
    }
  };
  let lang = "ko", step = 0, sel = [], selVal = [], declared = false, reversed = false, revSeat = null;
  let N = 6;
  let online = false;   /* 인원. 선언 없이 쓰고 있어서 모듈에서 막혔다 */
  let ranks = [];
  let wasGreat = false;   /* 선언 시점의 대혁명 여부 (뒤집은 뒤엔 다시 계산하면 틀린다) */
  const G = () => (window.GAME = window.GAME || {});
  const holds = () => G().hold || [];
  /* 남의 손패는 온라인에서 원래 모른다. 없으면 빈 것으로 친다 */
  const holdOf = i => { const h = holds()[i]; return Array.isArray(h) ? h : []; };
  const myHand = () => holdOf(0);
  
  const nameOf = i => ((lang === "ko" ? G().names : G().namesEn) || G().names || [])[i] || "";
  
  
  const art = n => n === 13 ? ART.jokerA : n === 14 ? ART.jokerB : ART[String(n).padStart(2,"0")];
  const cardName = n => isJ(n) ? (lang === "ko" ? "카멜레온" : "CHAMELEON")
                               : (lang === "ko" ? KO_N : EN_N)[n - 1];
  function cardHTML(n, w){
    /* 빈 숫자칸을 양쪽에 둬야 이름이 가운데로 온다 */
    if (isJ(n)) return '<div class="card" style="--w:' + w + 'px">' +
      '<div class="card__band"><span class="card__num"></span>' +
      '<span class="card__name">' + cardName(n) + '</span>' +
      '<span class="card__num"></span></div>' +
      '<div class="card__art"><img src="' + art(n) + '" alt=""></div>' +
      '<div class="card__band"></div></div>';
    return '<div class="card" style="--w:' + w + 'px">' +
      '<div class="card__band"><span class="card__num">' + n + '</span>' +
      '<span class="card__name">' + cardName(n) + '</span>' +
      '<span class="card__num">' + n + '</span></div>' +
      '<div class="card__art"><img src="' + art(n) + '" alt=""></div>' +
      '<div class="card__band"><span class="card__num">' + n + '</span>' +
      '<span class="card__num">' + n + '</span></div></div>';
  }
  
  /* 등수 → 자리, 자리 → 등수 */
  function order(){ return reversed ? ranks.slice().reverse() : ranks; }
  function rankOf(seat){ return order().indexOf(seat); }
  /* 계급 호칭 = 덱 순서. 위에서부터 사자·호랑이·…, 아래에서부터 생쥐·새·… */
  function ordEn(n){
    const s = ["th","st","nd","rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function rankLabel(r){ return lang === "ko" ? (r + 1) + "등" : ordEn(r + 1); }
  
  
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
    const sec = window.document.getElementById("tax");
    if (!sec) return;
    RING = placeTable(sec, null);
    const m = el("mid");
    if (m){ m.style.left = RING.cx + "%"; m.style.top = RING.cy + "%"; }
  }
  
  function seatPos(i){
    const a = (Math.PI / 2) + (i * 2 * Math.PI / N);
    const s = Math.sin(a);
    /* 이름표가 아래로 달려서, 아래쪽 자리는 그만큼 더 바깥으로 빼야 위와 대칭이 된다 */
    const bias = s > 0.25 ? 3.4 * s : 0;
    return {x: RING.cx + Math.cos(a) * -RING.rx, y: RING.cy + s * RING.ry + bias};
  }
  
  /* from/to: 자리 번호, -1이면 가운데 */
  function flyCard(from, to, card, delay, faceDown){
    const a = from < 0 ? {x:50,y:50} : seatPos(from);
    const b = to   < 0 ? {x:50,y:50} : seatPos(to);
    const d = document.createElement("div");
    d.className = "fly";
    d.style.left = a.x + "%"; d.style.top = a.y + "%";
    d.style.transform = "translate(-50%,-50%) scale(.7)";
    d.style.opacity = 0;
    d.innerHTML = faceDown ? backHTML(32) : cardHTML(card, 32);
    el("fx").appendChild(d);
    setTimeout(() => {
      d.style.opacity = 1;
      d.style.left = b.x + "%"; d.style.top = b.y + "%";
      d.style.transform = "translate(-50%,-50%) scale(1) rotate(" + (Math.random()*20-10).toFixed(0) + "deg)";
    }, delay + 20);
    setTimeout(() => { d.style.opacity = 0; }, delay + 620);
    setTimeout(() => d.remove(), delay + 950);
  }
  function backHTML(w){
    return '<div class="card" style="--w:' + w + 'px;padding:2px"><div class="card__art" style="border-width:1px">' +
      '<img src="' + ART.back + '" alt=""></div></div>';
  }
  function clearFx(){ el("fx").innerHTML = ""; }
  
  function dealAll(){
    if (online){
      /* 엔진이 이미 나눴다. 손패도 혁명도 엔진이 알려 준 것을 쓴다.
         여기서 다시 나누면 화면과 실제 판이 어긋난다 */
      const rv = window.__revolution;
      revSeat = rv ? rv.seat : null;
      return;
    }
    const d = [];
    for (let n = 1; n <= 12; n++) for (let i = 0; i < n; i++) d.push(n);
    d.push(13, 14);
    for (let i = d.length - 1; i > 0; i--){
      const k = Math.floor(Math.random() * (i + 1));
      [d[i], d[k]] = [d[k], d[i]];
    }
    const hands = Array.from({length: N}, () => []);
    d.forEach((c, i) => hands[i % N].push(c));
    hands.forEach(x => x.sort((a, b) => a - b));
    G().hold = hands;
    const w = hands.findIndex(x => x.filter(c => c >= 13).length === 2);
    revSeat = w < 0 ? null : w;
  }
  
  /* 세금을 실제 손패에 적용 */
  function applyTax(myGive){
    if (online){
      /* 고를 때 이미 보냈다. 그때 못 보낸 경우에만 여기서 보낸다 */
      if (window.__setTaxGive && Array.isArray(myGive) && myGive.length &&
          !(window.__taxGive && window.__taxGive.length)){
        window.__setTaxGive(myGive);
      }
      return;                       /* 실제 교환은 엔진이 한다 */
    }
    const hh = holds(), o = order();
    [[o[0], o[N-1], 2], [o[1], o[N-2], 1]].forEach(([hi, lo, k]) => {
      const best = hh[lo].slice().sort((a, b) => a - b).slice(0, k);
      best.forEach(c => hh[lo].splice(hh[lo].indexOf(c), 1));
      const give = hi === 0 ? myGive.slice(0, k)
                            : hh[hi].slice().sort((a, b) => b - a).slice(0, k);
      give.forEach(c => hh[hi].splice(hh[hi].indexOf(c), 1));
      hh[hi].push(...best); hh[lo].push(...give);
      hh[hi].sort((a, b) => a - b); hh[lo].sort((a, b) => a - b);
    });
  }
  
  /* 새 패 나눠 주기 */
  function runDeal(){
    clearFx();
    snd("card_deal");
    for (let round = 0; round < 3; round++)
      for (let i = 0; i < N; i++)
        flyCard(-1, i, 0, (round * 6 + i) * 55, true);
  }
  
  /* 세금 주고받기 — **소리는 안 낸다.**
     예전에는 패 나누는 소리를 그대로 썼는데, 바로 앞 2단계에서 이미 같은 소리가
     나서 몇 초 사이에 섞는 소리가 두 번 났다. 카드 날아가는 연출만 남긴다 */
  function runTax(){
    window.__myGive = window.__myGive || [];
    clearFx();
    const o = order(), n = N;
    const pairs = [[o[0], o[n-1], 2], [o[1], o[n-2], 1]];
    let t = 0;
    pairs.forEach(([hi, lo, k]) => {
      /* 내가 낀 교환만 앞면. 남들끼리 주고받는 건 원래 안 보이는 정보라 뒷면 */
      const mine = hi === 0 || lo === 0;
      const best = holdOf(lo).slice().sort((a, b) => a - b).slice(0, k);
      for (let j = 0; j < k; j++){ flyCard(lo, hi, best[j], t, !mine); t += 150; }
      for (let j = 0; j < k; j++){
        flyCard(hi, lo, hi === 0 ? window.__myGive[j] : 12, t, !mine); t += 150;
      }
    });
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
    for (let i = 0; i < N; i++){
      const p = seatPos(i), r = rankOf(i), n = N;
      const d = document.createElement("div");
      d.className = "seat" + (i === 0 ? " seat--me" : "") +
        (r <= 1 ? " seat--top" : "") + (r >= n - 2 ? " seat--bot" : "");
      d.style.left = p.x.toFixed(1) + "%"; d.style.top = p.y.toFixed(1) + "%";
      const big = N <= 6;
      d.style.setProperty("--av", 44 + "px");   /* 인원과 무관하게 같은 크기 */
      d.style.setProperty("--fs", (big ? 10.5 : 9) + "px");
      d.innerHTML =
        '<span class="seat__r on">' + rankLabel(r) + '</span>' +
        '<span class="seat__av" style="background-image:url(' + A_RINGS.avatar + '),url(' + avtOf(i) + ')"></span>' +
        '<span class="seat__n">' + nameOf(i) + '</span>';
      box.appendChild(d);
    }
    const hn = el("hint");
    anchorSeats(box, hn ? hn.getBoundingClientRect().top - 4 : 0);
  }
  
  function renderHand(){
    const h = el("hand"); h.innerHTML = "";
    if (hideHand) return;                 /* 나누는 모션 중에는 안 보여 준다 */
    const hand = myHand(), w = 54, n = hand.length;
    const step2 = n > 1 ? Math.min(40, (h.clientWidth - w) / (n - 1)) : 0;
    const total = w + step2 * (n - 1);
    const taken = takenIdx();
    hand.forEach((c, i) => {
      const s = document.createElement("div");
      s.className = "slot" + (sel.includes(i) ? " slot--sel" : "") + (taken.includes(i) ? " slot--take" : "");
      s.style.left = ((h.clientWidth - total) / 2 + i * step2) + "px";
      s.style.zIndex = i;
      s.innerHTML = cardHTML(c, w);
      s.onclick = () => { if (!giveCount()) return;
        const k = sel.indexOf(i);
        if (k >= 0){ sel.splice(k, 1); selVal.splice(k, 1); }
        else if (sel.length < giveCount()){
          sel.push(i);
          /* 고른 **카드 값**도 같이 적어 둔다.
             자리 번호만 두면, 그 사이에 손패가 다시 정렬될 때
             엉뚱한 카드가 나간다(12 를 골랐는데 카멜레온이 가던 문제) */
          selVal.push(c);
          /* 다 골랐으면 **곧바로** 보낸다.
             연출이 끝날 때까지 들고 있으면, 서버가 "안 낸다" 고 보고
             대신 내버린다(카멜레온이 나가던 진짜 이유) */
          if (sel.length === giveCount() && online && window.__setTaxGive){
            window.__setTaxGive(selVal.slice(0, giveCount()));
          }
        }
        draw(); };
      h.appendChild(s);
    });
  }
  
  /* 내가 세금으로 몇 장을 줘야 하나 */
  function giveCount(){
    if (step !== 3 || taxSkipped()) return 0;
    const r = rankOf(0), n = N;
    return r === 0 ? 2 : r === 1 ? 1 : 0;
  }
  /* 내가 뺏기는 카드 (가장 좋은 = 숫자 작은 순) */
  function takenIdx(){
    if (step !== 3 || taxSkipped()) return [];
    const r = rankOf(0), n = N;
    const k = r === n - 1 ? 2 : r === n - 2 ? 1 : 0;
    return myHand().map((c, i) => i).sort((a, b) => myHand()[a] - myHand()[b]).slice(0, k);
  }
  function taxSkipped(){
    /* 엔진이 정한 값이 있으면 그걸 따른다 (선언해야 세금이 사라진다) */
    if (online && window.__taxCancelled !== undefined) return Boolean(window.__taxCancelled);
    return revSeat !== null && declared;
  }
  
  function renderMid(){
    const t = T[lang], m = el("mid"), r = rankOf(0), n = N, o = order();
    let html = "";
    if (step === 0){
      /* 제목만 가운데. 등수는 각자 프로필에 붙는다 */
      html = '<div class="mid__h">' + t.rankH + '</div>';
    } else if (step === 1){
      html = '<div class="mid__h">' + t.dealH + '</div><div class="mid__s">' + t.dealS + '</div>';
    } else if (step === 2){
      const great = revSeat !== null && rankOf(revSeat) === n - 1;
      html = '<div class="mid__h">' + t.revH + '</div><div class="mid__s">' +
        (revSeat === null ? t.revNone
         : declared ? (wasGreat ? t.revGreatDone : t.revDone)
         : revSeat === 0 ? (great ? t.revGreatMine : t.revMine)
         : (great ? t.revGreatOther(nameOf(revSeat)) : t.revOther(nameOf(revSeat)))) + '</div>';
      if (revSeat === 0 && !declared)
        html += '<div class="flow rev"><div class="frow"><span class="frow__c">' +
          cardHTML(13, 40) + cardHTML(14, 40) + '</span></div></div>';
    } else if (step === 3){
      html = '<div class="mid__h">' + t.taxH + '</div><div class="mid__s">' +
        (taxSkipped() ? t.taxSkip
         : r === 0 ? t.taxMineTop(nameOf(o[n-1]))
         : r === 1 ? t.taxMineTop2(nameOf(o[n-2]))
         : r === n-1 ? t.taxMineBot(nameOf(o[0]))
         : r === n-2 ? t.taxMineBot2(nameOf(o[1]))
         : t.taxMid) + '</div>';
      if (!taxSkipped()){
        /* 내가 받는 카드: 상대의 가장 좋은 카드 (실제 손패에서) */
        const partner = r === 0 ? o[n-1] : r === 1 ? o[n-2] : null;
        const inC = partner === null ? []
          : holdOf(partner).slice().sort((a, b) => a - b).slice(0, r === 0 ? 2 : 1);
        const outC = takenIdx().map(i => myHand()[i]);
        let rows = "";
        if (inC.length) rows += '<div class="frow frow--in"><span class="frow__w">' +
          nameOf(partner) + ' \u2192</span><span class="frow__c">' +
          inC.map(c => cardHTML(c, 34)).join("") + '</span></div>';
        if (outC.length) rows += '<div class="frow frow--out"><span class="frow__w">\u2192 ' +
          nameOf(o[r === n-1 ? 0 : 1]) + '</span><span class="frow__c">' +
          outC.map(c => cardHTML(c, 34)).join("") + '</span></div>';
        if (sel.length) rows += '<div class="frow frow--out"><span class="frow__w">\u2192 ' +
          nameOf(partner) + '</span><span class="frow__c">' +
          sel.map(i => cardHTML(myHand()[i], 34)).join("") + '</span></div>';
        if (rows) html += '<div class="flow">' + rows + '</div>';
      }
    } else {
      html = '<div class="mid__h">' + t.doneH + '</div><div class="mid__s">' + t.doneS(nameOf(order()[0])) + '</div>';
    }
    m.innerHTML = html;
  }
  
  function renderBottom(){
    const t = T[lang], great = revSeat !== null && rankOf(revSeat) === N - 1;
    el("step").textContent = (step + 1) + ". " + t.steps[step];
    /* "처음부터"는 혼자 하기 시제품에서 남은 것이라 지금은 뜻이 없다 */
    const bk = el("back");
    if (bk) bk.style.display = "none";
    const g = giveCount();
    const b = el("next");
    if (tickBase) tickBase = "";      /* 글자가 새로 정해지면 초읽기 바탕도 새로 잡는다 */
    /* 누를 것이 있는 사람에게만 단추를 보여준다.
       혁명은 카멜레온 두 장을 쥔 사람, 세금은 주고받는 당사자.
       나머지는 초읽기만 보고 기다린다 */
    const bar = b.parentElement;
    /* 넘기기 단추는 없앤다. 전부 초읽기로 저절로 넘어간다.
       남기는 것은 "고를 것이 있는" 두 가지뿐 — 혁명 선언, 세금 주기 */
    const mine = step === 2 ? (revSeat === 0 && !declared)
      : step === 3 ? (g > 0 && !taxSkipped() && !window.__taxCancelled)
      : false;
    if (bar) bar.style.visibility = mine ? "" : "hidden";
    el("hint").innerHTML = step === 3 && g && mine
      ? (sel.length < g ? t.giveNeed(g - sel.length) : "")
      : (!mine && (step === 2 || step === 3) && tickLeft > 0 ? t.waitSec(tickLeft) : "");
    if (step === 2 && revSeat === 0 && !declared){
      b.className = "bt-rev"; b.textContent = great ? t.declareG : t.declare; b.disabled = false;
    } else {
      b.className = "bt-main";
      b.textContent = step === 4 ? t.start : step === 3 && g ? t.give(g) : t.next;
      b.disabled = step === 3 && g > 0 && sel.length < g;
    }
  }
  
  function draw(){
    renderSeats(); renderMid(); renderHand(); renderBottom();
    const hn = el("hint");
    anchorSeats(el("seats"), hn ? hn.getBoundingClientRect().top - 4 : 0);
    if (step >= 1) window.__myRankIdx = rankOf(0);
  }
  
  function boot(){
    /* 온라인이면 서버가 정산한다. 이 화면은 보여주기와 고르기만 맡는다 */
    if (window.__net){
      online = true;
    }
    const g = G();
    N = g.N || 6;
    ranks = (g.finish && g.finish.length === N) ? g.finish.slice()
          : Array.from({length: N}, (_, i) => i);
    step = 0; sel = []; selVal = []; declared = false; reversed = false; revSeat = null; wasGreat = false;
    /* **처음부터 손패를 감춘다.**
       엔진은 판이 끝나는 즉시 다음 판을 나눠 놓기 때문에, 등수 발표 단계(0)에서
       이미 다음 판의 패가 손에 들어와 있다. 감추지 않으면
       **나누지도 않았는데 받을 패가 미리 보인다.** 나누는 모션이 끝나면 푼다 */
    hideHand = true;
    waitOn = 0;                 /* 기다린 횟수를 되돌린다. 안 하면 다음에 자동 진행이 안 걸린다 */
    clearFx();
    draw();
  }
  window.__bootTax = () => { boot(); autoNext(); };

  /* ---------- 검사용 손잡이 ----------

     세금 화면은 밖에서 상태를 밀어 넣을 길이 없어서 확인이 어려웠다.
     내가 몇 등인지·몇 장 주는지 읽고, 원하는 단계로 바로 세울 수 있게 열어 둔다.
     게임 동작에는 아무 영향이 없다 */
  window.__taxProbe = {
    step: () => step,
    rank: () => rankOf(0),
    giveCount: () => giveCount(),
    hand: () => myHand().slice(),
    sel: () => sel.slice(),
    selVal: () => selVal.slice(),
    /* 고르는 단계(3)로 바로 세운다. ranks 를 주면 등수도 바꾼다 */
    toGive: (order) => {
      if (Array.isArray(order) && order.length === N) ranks = order.slice();
      declared = true; reversed = false; revSeat = null;
      hideHand = false;
      step = 3; sel = []; selVal = [];
      clearFx(); draw();
      return { step, rank: rankOf(0), give: giveCount() };
    },
    /* 카드 값으로 고른다 */
    pick: (vals) => {
      const hand = myHand();
      const out = [];
      (vals || []).forEach(v => {
        const i = hand.indexOf(v);
        if (i < 0 || sel.includes(i) || sel.length >= giveCount()) return;
        sel.push(i); selVal.push(hand[i]); out.push(hand[i]);
      });
      draw();
      return out;
    },
    /* 고른 것을 실제로 넘긴다 */
    submit: () => {
      window.__myGive = selVal.slice(0, giveCount());
      if (online && window.__setTaxGive) window.__setTaxGive(window.__myGive.slice());
      return window.__myGive.slice();
    },
  };
  boot();
  autoNext();
  
  /* 볼 것이 없는 단계는 건너뛴다.
     혁명은 실제로 열린 판에만, 세금은 내가 주고받을 때만 보여준다. */
  /* 다섯 단계를 전부 지나간다.
     혁명이 없으면 "일어나지 않았습니다"를, 세금은 남들끼리 주고받는 것도 보여준다.
     무슨 일이 있었는지 모른 채 다음 판이 시작되면 안 된다 */
  function needStep(k){
    /* 혁명이면(소혁명·대혁명 모두) 세금은 아예 안 걷는다.
       엔진이 이미 취소했는데 화면만 열어 카드를 고르게 하면,
       골라서 줘도 아무 일이 안 일어난다 — 실제로 그렇게 겪었다 */
    if (k === 3) return !taxSkipped() && !declared && !window.__taxCancelled;
    return true;
  }
  
  /* 누를 것이 없는 단계는 저절로 넘어간다 */
  var autoId = null;   /* 선언 전에 부르는 곳이 있어 var 로 둔다 */
  var taxShown = false;  /* 카드가 오가는 연출을 틀었는가 (다음 판으로 넘어갈 때 기다려 준다) */
  var hideHand = false;  /* 나누는 모션이 끝날 때까지 손패를 감춘다 */
  var tickId = null, tickLeft = 0, tickBase = "";
  /* 버튼에 남은 초를 붙여 준다. 먼저 누르면 바로 넘어간다 */
  function stopTick(){
    if (tickId){ clearInterval(tickId); tickId = null; }
    const b = el("next");
    if (b && tickBase) b.textContent = tickBase;
    tickBase = "";
  }
  function startTick(ms){
    stopTick();
    if (step !== 2 && step !== 3) return;      /* 혁명·세금에서만 센다 */
    const b = el("next");
    if (!b) return;
    tickBase = (b.textContent || "").replace(/\s*\(\d+\)$/, "");
    tickLeft = Math.round(ms / 1000);
    const paint = () => {
      const bb = el("next");
      if (!bb) return;
      bb.textContent = tickBase + (tickLeft > 0 ? " (" + tickLeft + ")" : "");
      /* 단추가 숨겨진 사람에게는 안내 문구 자리에 남은 시간을 보여준다 */
      const bar2 = bb.parentElement;
      const h = el("hint");
      if (h && bar2 && bar2.style.visibility === "hidden")
        h.textContent = tickLeft > 0 ? T[lang].waitSec(tickLeft) : "";
    };
    paint();
    tickId = setInterval(() => { tickLeft--; if (tickLeft < 0){ stopTick(); return; } paint(); }, 1000);
  }
  var waitOn = 0;      /* 화면이 켜지기를 기다린 횟수 */
  function autoNext(){
    if (autoId){ clearTimeout(autoId); autoId = null; }
    stopTick();
    if (step >= 4) return;
    const sec = window.document.getElementById("tax");
    /* 화면을 세우는 쪽이 먼저 boot 를 부르고 그다음 화면을 켠다.
       여기서 포기해 버리면 자동 진행이 영영 안 걸린다 — 켜질 때까지 기다린다 */
    if (!sec || !sec.classList.contains("is-on")){
      if (waitOn++ > 40) return;
      autoId = setTimeout(autoNext, 120);
      return;
    }
    waitOn = 0;
    /* 시간은 누가 하느냐와 무관하게 같다.
       한 판 안에서 모두가 같은 화면을 같은 시간 동안 본다.
       봇이 대신 앉아 있을 뿐, 기준은 사람이다 */
    let wait = 0;
    if (step === 0) wait = 3000;        /* 등수 발표 */
    else if (step === 1) wait = 3000;   /* 카드 나누기 */
    /* 혁명: 쥔 사람이 있을 때만 고민할 것이 있다. 아무도 없으면 알리고 5초에 넘긴다 */
    else if (step === 2) wait = (revSeat === null ? 5000 : 10000);
    else if (step === 3) wait = 10000;  /* 세금 */
    if (!wait) return;
    startTick(wait);
    autoId = setTimeout(() => {
      const sec2 = window.document.getElementById("tax");
      if (!sec2 || !sec2.classList.contains("is-on")){ autoNext(); return; }
      /* 혁명은 안 부르고 넘기면 그대로 세금을 걷는다 (쥐고도 안 부르는 것이 전략) */
      if (step === 2 && online && revSeat === 0 && !declared && window.__passRev){
        window.__passRev();
      }
      /* 세금이 사라졌는데 이 단계에 서 있으면 그냥 넘긴다.
         (혁명을 선언한 순간과 화면이 그걸 아는 순간이 어긋날 수 있다) */
      if (step === 3 && taxSkipped()){
        step = 4;
        G().order = order().slice();
        draw();
        setTimeout(() => { if (window.__toTable) window.__toTable(); }, 400);
        return;
      }
      /* 세금에서 안 고르고 시간을 넘기면 가장 나쁜 카드를 자동으로 준다 */
      if (step === 3){
        const g = giveCount();
        if (g > 0 && sel.length < g){
          const mine = myHand();
          const idx = mine.map((c, i) => i)
            .sort((a, b) => (mine[b] >= 13 ? 99 : mine[b]) - (mine[a] >= 13 ? 99 : mine[a]));
          sel = idx.slice(0, g);
          draw();
        }
      }
      const b = el("next");
      if (b && !b.disabled) b.click();
    }, wait);
  }
  
  el("next").onclick = () => {
    const great = revSeat !== null && rankOf(revSeat) === N - 1;
    if (step === 2 && revSeat !== null && !declared){
      declared = true;
      wasGreat = great;
      /* 엔진에 실제로 선언한다. 이걸 안 부르면 세금이 그대로 걷힌다 */
      if (online && revSeat === 0 && window.__declareRev) window.__declareRev();
      if (great){
        reversed = true;
        el("flash").classList.remove("go"); void el("flash").offsetWidth; el("flash").classList.add("go");
        draw();
        document.querySelectorAll(".seat__r").forEach(x => x.classList.add("swap"));
        setTimeout(() => document.querySelectorAll(".seat__r").forEach(x => x.classList.remove("swap")), 750);
        /* 선언하고 나면 단추가 사라진다. 여기서 다시 시간을 걸지 않으면
           아무도 다음으로 넘길 수 없어 화면이 영영 멈춘다 */
        autoNext();
        return;
      }
      draw();
      autoNext();
      return;
    }
    if (step === 3 && !taxSkipped()){
      /* 자리 번호가 아니라 **고를 때 적어 둔 값**을 보낸다 */
      window.__myGive = selVal.slice(0, giveCount());
      taxShown = true;
      runTax();
      applyTax(window.__myGive);
      sel = []; selVal = [];
    }
    if (step < 4) step++;
    while (step < 4 && !needStep(step)) step++;        /* 볼 것 없는 단계는 지나친다 */
    /* 10번: 패는 나누는 모션이 끝난 뒤에 손에 들어온다.
       미리 넣어 두면 나누기 전에 이미 패가 보인다 */
    if (step === 1){ dealAll(); hideHand = true; }
    /* 나누기 단계를 건너뛰는 판이면 여기서 풀어 준다. 안 그러면 손패가 영영 안 보인다 */
    else if (step >= 1) hideHand = false;
    draw();
    if (step === 1){
      runDeal();
      setTimeout(() => { hideHand = false; draw(); }, 2400);
    }
    if (step === 4){
      G().order = order().slice();
      if (autoId){ clearTimeout(autoId); autoId = null; }
      /* 카드가 오가는 연출이 1.9초쯤 걸린다. 400ms 만에 넘어가면
         남들끼리 주고받는 것을 보라고 만든 연출을 아무도 못 본다 */
      setTimeout(() => { if (window.__toTable) window.__toTable(); }, taxShown ? 2100 : 400);
      return;
    }
    autoNext();
  };
  if (el("back")) el("back").onclick = () => { if (window.__toResult) window.__toResult(); };
  
  document.querySelectorAll("#lang button").forEach(b => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document.documentElement.lang = lang;
      document.querySelectorAll("#lang button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });
  window.addEventListener("resize", draw);
  
  window.addEventListener("langchange", () => { lang = window.__lang; draw(); });
  
}
