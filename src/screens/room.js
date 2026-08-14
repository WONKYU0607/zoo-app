import { scoped } from "../lib/scoped.js";
import { HEADS as A_HEADS } from "../lib/assets.js";
import "../styles/room.css";

export function mount(root){
  const document = scoped(root);
  
  const HEADS = A_HEADS;
  
  const PLAYERS_KO = ["나", "민지", "준호", "서연", "태윤", "하은", "지훈", "예린"];
  const PLAYERS_EN = ["You", "Minji", "Junho", "Seoyeon", "Taeyun", "Haeun", "Jihoon", "Yerin"];
  const L = {
    ko:{ title:"방 대기실", roomL:"방 번호", copy:"번호 복사", host:"방장", guest:"참가자",
         count:(j,c)=>j+" / "+c+"명",
         needMore:"4명부터 시작할 수 있습니다",
         canStart:"지금 시작하거나 더 기다리셔도 됩니다",
         full:"자리가 다 찼습니다", empty:"빈 자리", hostTag:"방장",
         capT:"방 인원", capD:"4명 \u2013 8명", capDG:"방장이 정합니다.",
         rndT:"플레이 판 수 설정", rndD:"최소 3판부터 시작",
         rndDG:"방장이 정합니다.", rndU:n=>n+"판",
         taxT:"세금과 혁명",
         taxD:"등수에 따라 카드를 교환하고, 조커 두 장으로 순위를 뒤집는 규칙입니다.",
         clrT:"2번 컷",
         clrD:"2번 카드를 내면 바닥을 비우고 다시 선을 잡습니다.",
         on:"켜져 있습니다.", off:"꺼져 있습니다.",
         sumP:"명", sumR:"판", sumT:"세금", sumC:"2번 컷", on2:"켬", off2:"끔", edit:"\u203A 변경",
         start:"시작하기", needFour:"4명이 모여야 시작합니다",
         wait:"방장이 시작하기를 기다리는 중입니다" },
    en:{ title:"Waiting room", roomL:"ROOM NUMBER", copy:"Copy", host:"Host", guest:"Guest",
         count:(j,c)=>j+" of "+c,
         needMore:"Four players are needed to start",
         canStart:"Start now, or wait for more",
         full:"The table is full", empty:"Open seat", hostTag:"HOST",
         capT:"Table size", capD:"4 \u2013 8 players", capDG:"The host decides.",
         rndT:"Number of rounds", rndD:"Three at least",
         rndDG:"The host decides.", rndU:n=>n+"",
         taxT:"Tax and revolution",
         taxD:"Cards change hands by standing, and two jokers overturn it.",
         clrT:"Two-cut",
         clrD:"Playing a 2 clears the pile and you lead again.",
         on:"On.", off:"Off.",
         sumP:" players", sumR:" rounds", sumT:"Tax", sumC:"Two-cut", on2:"on", off2:"off", edit:"\u203A Change",
         start:"Start", needFour:"Four players are needed",
         wait:"Waiting for the host to start" }
  };
  let lang = window.__lang || "ko";
  const PLAYERS = PLAYERS_KO;
  let cap = 6;          // 방 인원
  let joined = 4;       // 들어온 사람
  let clear2 = false;   // 2번 판 엎기
  let rounds = 5;       // 몇 판까지
  let taxOn = true;     // 세금·혁명 사용
  let role = "host";
  
  
  /* 배경 그림 속 초록 타원의 실제 화면 좌표(cover 기준) */
  const OV = {iw: 853, ih: 1844, cx: 0.4994, cy: 0.4415, rx: 0.4250, ry: 0.1720};
  function ovalRect(W, H){
    const s = Math.max(W / OV.iw, H / OV.ih);
    const dw = OV.iw * s, dh = OV.ih * s;
    const ox = (W - dw) / 2, oy = (H - dh) / 2;
    return {cx: (ox + OV.cx * dw) / W * 100, cy: (oy + OV.cy * dh) / H * 100,
            rx: (OV.rx * dw) / W * 100,      ry: (OV.ry * dh) / H * 100};
  }
  /* 타원 아래끝이 설정 칸 바로 위에 오도록 배경을 올리고, 자리를 그 테두리에 앉힌다 */
  function ringBox(){
    const sec = window.document.getElementById("room");
    const b = sec ? sec.getBoundingClientRect() : {width: 390, height: 844, top: 0};
    const W = b.width, H = b.height;
    const o = ovalRect(W, H);
    const ctrl = document.getElementById("sum");
    const limit = ctrl ? (ctrl.getBoundingClientRect().top - b.top - 22) : H * 0.72;
    const ryPx = o.ry / 100 * H;
    const wantCy = Math.min(o.cy / 100 * H, limit - ryPx);
    const shift = Math.round(wantCy - o.cy / 100 * H);
    if (sec) sec.style.backgroundPositionY = shift + "px";
    return {cx: o.cx, cy: (wantCy / H) * 100, rx: o.rx, ry: o.ry};
  }
  let RB = {cx: 49, cy: 34, rx: 35, ry: 11.5};
  
  
  
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
    RB = ringBox();
    const box = document.getElementById("seats");
    box.innerHTML = "";
    for (let i = 0; i < cap; i++){
      const a = (Math.PI / 2) + (i * 2 * Math.PI / cap);   // 아래에서 시계 방향
      const sy = Math.sin(a);
      const bias = sy > 0.25 ? 3.4 * sy : 0;   /* 아래쪽은 이름표만큼 더 바깥으로 */
      const left = RB.cx + Math.cos(a) * -RB.rx;
      const top  = RB.cy + sy * RB.ry + bias;
      const filled = i < joined;
      const el = document.createElement("div");
      el.className = "seat" + (filled ? "" : " seat--empty") + (i === 0 ? " seat--me" : "");
      el.style.left = left.toFixed(2) + "%";
      el.style.top  = top.toFixed(2) + "%";
      const big = cap <= 6;
      el.style.setProperty("--av", (big ? 46 : 36) + "px");
      el.style.setProperty("--fs", (big ? 11 : 9.5) + "px");
      el.innerHTML = filled
        ? '<img class="seat__av" src="' + HEADS[i % HEADS.length] + '" alt="">' +
          '<span class="seat__n">' + (lang === "ko" ? PLAYERS_KO : PLAYERS_EN)[i] + '</span>' +
          (i === 0 && role === "host" ? '<span class="seat__b">' + L[lang].hostTag + '</span>' : '')
        : '<div class="seat__av">+</div><span class="seat__n">' + L[lang].empty + '</span>';
      box.appendChild(el);
    }
    const sm = document.getElementById("sum");
    anchorSeats(box, sm ? sm.getBoundingClientRect().top - 6 : 0);
    const t = L[lang];
    document.getElementById("bt").textContent = t.title;
    document.getElementById("rl").textContent = t.roomL;
    document.getElementById("rc").textContent = t.copy;
    document.querySelector('#view [data-v="host"]').textContent = t.host;
    document.querySelector('#view [data-v="guest"]').textContent = t.guest;
    const fc = document.querySelector(".felt__c");
    if (fc) fc.style.top = RB.cy.toFixed(1) + "%";
    document.getElementById("feltN").textContent = t.count(joined, cap);
    document.getElementById("feltS").textContent =
      joined < 4 ? t.needMore : joined < cap ? t.canStart : t.full;
  }
  
  function syncOpts(){
    const o = window.__opts || {};
    cap = o.cap || cap; rounds = o.rounds || rounds;
    taxOn = o.tax !== false; clear2 = !!o.clear2;
    if (joined > cap) joined = cap;
  }
  function renderControls(){
    const t = L[lang];
    const sm = document.getElementById("sum");
    sm.innerHTML =
      '<b>' + cap + '</b>' + t.sumP + ' \u00B7 <b>' + rounds + '</b>' + t.sumR +
      ' \u00B7 ' + t.sumT + ' ' + (taxOn ? t.on2 : t.off2) +
      ' \u00B7 ' + t.sumC + ' ' + (clear2 ? t.on2 : t.off2) +
      (role === "host" ? '  <span style="color:#E3C67C">' + t.edit + '</span>' : '');
    sm.disabled = role !== "host";
    const a = document.getElementById("action");
    if (role === "host"){
      a.innerHTML = '<button class="btn-primary" ' + (joined < 4 ? "disabled" : "") + '>' +
        (joined < 4 ? t.needFour : t.start) + '</button>';
    } else {
      a.innerHTML = '<div class="waiting">' + t.wait + '<span class="dots"></span></div>';
    }
  }
  
  function draw(){ syncOpts(); renderSeats(); renderControls();
    const sm2 = document.getElementById("sum");
    anchorSeats(document.getElementById("seats"), sm2 ? sm2.getBoundingClientRect().top - 6 : 0);
  }
  draw();
  window.addEventListener("resize", draw);
  window.addEventListener("optschange", draw);
  
  /* 시작을 누르는 순간의 실제 인원을 확정한다 (자리를 다 안 채우고 시작할 수 있음) */
  document.getElementById("action").addEventListener("click", e => {
    if (e.target.closest(".btn-primary") && window.__opts) window.__opts.seated = joined;
  });
  
  document.querySelectorAll("#lang button").forEach(b => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document.documentElement.lang = lang;
      document.querySelectorAll("#lang button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });
  
  document.querySelectorAll("#view button").forEach(b => {
    b.addEventListener("click", () => {
      role = b.dataset.v;
      document.querySelectorAll("#view button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });
  
  /* 사람이 한 명씩 들어오는 모습 */
  setInterval(() => {
    joined = joined < cap ? joined + 1 : 2;
    draw();
  }, 3400);
  
  window.addEventListener("langchange", () => { lang = window.__lang; draw(); });
  
}
