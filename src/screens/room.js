import { scoped } from "../lib/scoped.js";
import { play as snd } from "../lib/sound.js";
import { avtFile } from "../lib/assets.js";
import { RINGS as A_RINGS } from "../lib/assets.js";
import "../styles/room.css";

export function mount(root){

  /* 엔진 자리 → 그 사람이 고른 얼굴. GAME.avatars 가 없으면 첫 번째(생쥐) */
  function avtOf(seat){
    const g = window.GAME || {};
    const a = g.avatars || [];
    return avtFile(Number(a[seat]) || 0);
  }
  /* 방 대기실은 **아직 게임 전**이라 GAME.avatars 가 없다.
     방에 앉은 사람이 들고 있는 얼굴을 그대로 쓴다 —
     이걸 안 봐서 대기실에서 전부 생쥐로 나왔다 */
  function avtSeat(p, seat){
    if (p && p.avatar != null) return avtFile(Number(p.avatar) || 0);
    return avtOf(seat);
  }
  /* 화면 자리에 앉은 사람을 찾아 얼굴을 고른다. 표가 없으면 자리 번호 그대로 */
  const faceOf = i => {
    const f = window.GAME && window.GAME.faces;
    return (f && f[i] != null) ? f[i] : i;
  };

  const document = scoped(root);
  
  
  const PLAYERS_KO = ["나", "민지", "준호", "서연", "태윤", "하은", "지훈", "예린"];
  const PLAYERS_EN = ["You", "Minji", "Junho", "Seoyeon", "Taeyun", "Haeun", "Jihoon", "Yerin"];
  const L = {
    ko:{ title:"방 대기실", roomL:"방 번호", copy:"번호 복사", host:"방장", guest:"참가자",
         count:(j,c)=>j+" / "+c+"명",
         needMore:"4명부터 시작할 수 있습니다",
         canStart:"지금 시작하거나 더 기다리셔도 됩니다",
         full:"자리가 다 찼습니다", empty:"빈 자리", hostTag:"방장", inviteHere:"초대하기",
         capT:"방 인원", capD:"4명 \u2013 8명", capDG:"방장이 정합니다.",
         rndT:"플레이 판 수 설정", rndD:"최소 3판부터 시작",
         rndDG:"방장이 정합니다.", rndU:n=>n+"판",
         taxT:"세금과 혁명",
         taxD:"등수에 따라 카드를 교환하고, 조커 두 장으로 순위를 뒤집는 규칙입니다.",
         clrT:"2번 컷",
         clrD:"2번 카드를 내면 바닥을 비우고 다시 선을 잡습니다.",
         on:"켜져 있습니다.", off:"꺼져 있습니다.",
         sumP:"명", sumR:"판", sumT:"세금", sumC:"2번 컷", on2:"켬", off2:"끔", edit:"\u203A 변경",
         copied:"복사됨", start:"시작하기", starting:"카드를 나누는 중", needFour:"4명이 모여야 시작합니다", noTicket:"티켓이 없습니다. 내일 다시 채워집니다",
         wait:"방장이 시작하기를 기다리는 중입니다" },
    en:{ title:"Waiting room", roomL:"ROOM NUMBER", copy:"Copy", host:"Host", guest:"Guest",
         count:(j,c)=>j+" of "+c,
         needMore:"Four players are needed to start",
         canStart:"Start now, or wait for more",
         full:"The table is full", empty:"Open seat", hostTag:"HOST", inviteHere:"Invite",
         capT:"Table size", capD:"4 \u2013 8 players", capDG:"The host decides.",
         rndT:"Number of rounds", rndD:"Three at least",
         rndDG:"The host decides.", rndU:n=>n+"",
         taxT:"Tax and revolution",
         taxD:"Cards change hands by standing, and two jokers overturn it.",
         clrT:"Two-cut",
         clrD:"Playing a 2 clears the pile and you lead again.",
         on:"On.", off:"Off.",
         sumP:" players", sumR:" rounds", sumT:"Tax", sumC:"Two-cut", on2:"on", off2:"off", edit:"\u203A Change",
         copied:"Copied", start:"Start", starting:"Dealing", needFour:"Four players are needed", noTicket:"No tickets left. They refill tomorrow",
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
  
  /* 타원 아래끝이 설정 칸 바로 위에 오도록 배경을 올리고, 자리를 그 테두리에 앉힌다 */
  function ringBox(){
    const sec = window.document.getElementById("room");
    if (!sec) return RB;
    const b = sec.getBoundingClientRect();
    const H = b.height;
    const base = placeTable(sec, null);            /* 우선 기본 위치로 재본다 */
    const ctrl = document.getElementById("sum");
    const limit = ctrl ? (ctrl.getBoundingClientRect().top - b.top - 22) : H * 0.72;
    const ryPx = base.ry / 100 * H;
    const wantCy = Math.min(base.cy / 100 * H, limit - ryPx);
    return placeTable(sec, (wantCy / H) * 100);    /* 필요하면 위로 올려 다시 놓는다 */
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
  /* 온라인이면 실제 방의 자리를, 아니면 흉내 낸 자리를 쓴다 */
  /* 자리 목록을 항상 배열로 만든다.
     실시간 데이터베이스는 중간이 빈 배열을 객체로 돌려준다 */
  function asArray(raw, n){
    const out = new Array(n).fill(null);
    if (!raw) return out;
    if (Array.isArray(raw)) raw.forEach((v, i) => { if (i < n) out[i] = v || null; });
    else Object.keys(raw).forEach(k => { const i = +k; if (i >= 0 && i < n) out[i] = raw[k] || null; });
    return out;
  }
  
  function seatList(){
    const R = window.__room;
    if (R && R.seats){
      return asArray(R.seats, R.cap || cap).map((s, i) => s ? {
        name: s.name || "",
        avatar: Number(s.avatar) || 0,     /* 이걸 안 실어서 대기실이 전부 생쥐였다 */
        me: i === R.me,
        host: s.uid && s.uid === R.host,
        off: Boolean(s.off),
        left: Boolean(s.left),
      } : null);
    }
    const KO = lang === "ko" ? PLAYERS_KO : PLAYERS_EN;
    return Array.from({length: joined}, (_, i) => ({
      name: KO[i], me: i === 0, host: i === 0 && role === "host", off: false, left: false,
    }));
  }
  
  /* 자리가 늘면 누가 들어온 것이다.
     이 화면은 **안 보일 때도 다시 그려진다**(1.5초마다 방 상태를 받아서).
     보고 있을 때만 울려야 한다 — 안 그러면 로비에 있어도 소리가 난다 */
  let sndSeated = 0;
  function seatSound(n){
    const sec = window.document.getElementById("room");
    const on = sec && sec.classList.contains("is-on");
    if (on && n > sndSeated && sndSeated > 0) snd("join");
    sndSeated = n;
  }

  function renderSeats(){
    RB = ringBox();
    const box = document.getElementById("seats");
    box.innerHTML = "";
    const list = seatList();
    seatSound(list.filter(x => x && x.name).length);
    const R = window.__room;
    if (R) cap = R.cap || cap;
    for (let i = 0; i < cap; i++){
      const a = (Math.PI / 2) + (i * 2 * Math.PI / cap);   // 아래에서 시계 방향
      const sy = Math.sin(a);
      const bias = sy > 0.25 ? 3.4 * sy : 0;   /* 아래쪽은 이름표만큼 더 바깥으로 */
      const left = RB.cx + Math.cos(a) * -RB.rx;
      const top  = RB.cy + sy * RB.ry + bias;
      const p = list[i] || null;
      const filled = Boolean(p);
      const el = document.createElement("div");
      el.className = "seat" + (filled ? "" : " seat--empty")
        + (p && p.me ? " seat--me" : "") + (p && (p.off || p.left) ? " seat--off" : "");
      el.style.left = left.toFixed(2) + "%";
      el.style.top  = top.toFixed(2) + "%";
      const big = cap <= 6;
      el.style.setProperty("--av", 46 + "px");   /* 인원과 무관하게 같은 크기 */
      el.style.setProperty("--fs", (big ? 11 : 9.5) + "px");
      el.innerHTML = filled
        ? '<span class="seat__av" style="background-image:url(' + A_RINGS.avatar + '),url(' +
            avtSeat(p, faceOf(i)) + ')"></span>' +
          (p.off || p.left ? '<span class="seat__off"></span>' : '') +
          '<span class="seat__n">' + p.name + '</span>' +
          (p.host ? '<span class="seat__b">' + L[lang].hostTag + '</span>' : '')
        : '<span class="seat__av seat__av--empty" style="background-image:url(' + A_RINGS.empty + ')"></span>' +
          '<span class="seat__n seat__inv">' + L[lang].inviteHere + '</span>';
      if (!filled) el.onclick = () => { if (window.__openFriends) window.__openFriends(); };
      box.appendChild(el);
    }
    const sm = document.getElementById("sum");
    anchorSeats(box, sm ? sm.getBoundingClientRect().top - 6 : 0);
    const t = L[lang];
    document.getElementById("bt").textContent = t.title;
    document.getElementById("rl").textContent = t.roomL;
    document.getElementById("rc").textContent = t.copy;
    /* 방장·참가자 팻말은 개발용 미리보기였다. 실제 방에서는 아무 일도 안 해서 뺐다 */
    const fc = document.querySelector(".felt__c");
    if (fc) fc.style.top = RB.cy.toFixed(1) + "%";
    const R2 = window.__room;
    const now = R2 && R2.seats
      ? asArray(R2.seats, R2.cap || cap).filter(s => s && !s.left).length : joined;
    document.getElementById("feltN").textContent = t.count(now, cap);
    document.getElementById("feltS").textContent =
      now < 4 ? t.needMore : now < cap ? t.canStart : t.full;
  }
  
  function syncOpts(){
    const o = window.__opts || {};
    cap = o.cap || cap; rounds = o.rounds || rounds;
    taxOn = o.tax !== false; clear2 = !!o.clear2;
    if (joined > cap) joined = cap;
  }
  function renderControls(){
    const t = L[lang];
    const R = window.__room;
    const arr = R ? asArray(R.seats, R.cap || cap) : null;
    const now = arr ? arr.filter(s => s && !s.left).length : joined;
    const iamHost = R ? Boolean(arr && arr[R.me] && arr[R.me].uid === R.host)
                      : (role === "host");
    const sm = document.getElementById("sum");
    sm.innerHTML =
      '<b>' + cap + '</b>' + t.sumP + ' \u00B7 <b>' + rounds + '</b>' + t.sumR +
      ' \u00B7 ' + t.sumT + ' ' + (taxOn ? t.on2 : t.off2) +
      ' \u00B7 ' + t.sumC + ' ' + (clear2 ? t.on2 : t.off2) +
      (iamHost ? '  <span style="color:#E3C67C">' + t.edit + '</span>' : '');
    sm.disabled = !iamHost;
    const a = document.getElementById("action");
    if (iamHost){
      /* 남은 초가 있으면 같이 적는다. 다시 그려도 숫자가 안 사라진다 */
      const lf = window.__roomLeft;
      const lbl = now < 4 ? t.needFour
                : t.start + (lf != null && lf > 0 ? " " + lf : "");
      a.innerHTML = '<button class="btn-primary" ' + (now < 4 ? "disabled" : "") + '>' +
        lbl + '</button>';
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
  window.addEventListener("roomchange", draw);
  
  /* 실제 방 번호를 보여준다 */
  function paintCode(){
    const el2 = document.getElementById("roomNo");
    if (el2 && window.__roomCode) el2.textContent = window.__roomCode() || "----";
  }
  window.addEventListener("roomchange", paintCode);
  paintCode();
  
  /* 번호 복사 */
  const rcBtn = document.getElementById("rc");
  if (rcBtn) rcBtn.addEventListener("click", () => {
    const code = (window.__roomCode && window.__roomCode()) || "";
    if (!code) return;
    try { navigator.clipboard.writeText(code); } catch(e){}
    const old = rcBtn.textContent;
    rcBtn.textContent = L[lang].copied;
    setTimeout(() => { rcBtn.textContent = old; }, 1200);
  });
  
  /* 시작을 누르는 순간의 실제 인원을 확정한다 (자리를 다 안 채우고 시작할 수 있음) */
  document.getElementById("action").addEventListener("click", async e => {
    const b = e.target.closest(".btn-primary");
    if (!b || b.disabled) return;
    const R = window.__room;
  
    /* 티켓 한 장을 쓴다. 없으면 못 들어간다 */
    if (window.spendTicket){
      const ok = await window.spendTicket();
      if (!ok){
        e.stopImmediatePropagation();
        const sm = document.getElementById("sum");
        if (sm) sm.textContent = L[lang].noTicket;
        return;
      }
    }
    window.__scored = false;
  
    if (R){
      /* 온라인 — 서버가 카드를 나눈다. 모두는 방 상태를 보고 따라 들어간다 */
      e.stopImmediatePropagation();
      b.disabled = true;
      b.textContent = L[lang].starting;
      try { await window.__startRound(); }
      catch(err){
        b.disabled = false; b.textContent = L[lang].start;
        alert("시작하지 못했습니다 : " + (err && (err.message || err.code) || err));
      }
      return;
    }
    if (window.__opts) window.__opts.seated = joined;   /* 봇전 */
  }, true);
  
  document.querySelectorAll("#lang button").forEach(b => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document.documentElement.lang = lang;
      document.querySelectorAll("#lang button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });
  

  
  /* 사람이 한 명씩 들어오는 모습 */
  setInterval(() => {
    if (window.__room) return;            /* 온라인에서는 실제 자리를 쓴다 */
    joined = joined < cap ? joined + 1 : 2;
    draw();
  }, 3400);
  
  window.addEventListener("langchange", () => { lang = window.__lang; draw(); });
  
}
