import { scoped } from "../lib/scoped.js";
import { play as snd } from "../lib/sound.js";
import { avtFile } from "../lib/assets.js";
import { RINGS as A_RINGS } from "../lib/assets.js";
import "../styles/room.css";
import { tierOf, TIER_MAX } from "../lib/tier.js";
/* 시작할 수 있는 최소 인원 — **2명** (2026-10-23 사용자 결정, 예전 4명). 서버(server.js MIN_START)·flow.js MIN_PLAYERS 와 같아야 한다 */
const MIN_START = 2;

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
         needMore:"2명부터 시작할 수 있습니다",
         canStart:"지금 시작하거나 더 기다리셔도 됩니다",
         full:"자리가 다 찼습니다", empty:"빈 자리", hostTag:"방장", inviteHere:"초대하기",
         capT:"방 인원", capD:"2명 \u2013 8명", capDG:"방장이 정합니다.",
         rndT:"플레이 판 수 설정", rndD:"1판부터 10판까지",
         rndDG:"방장이 정합니다.", rndU:n=>n+"판",
         taxT:"세금과 혁명",
         taxD:"등수에 따라 카드를 교환하고, 조커 두 장으로 순위를 뒤집는 규칙입니다.",
         clrT:"2번 컷",
         clrD:"2번 카드를 내면 바닥을 비우고 다시 선을 잡습니다.",
         on:"켜져 있습니다.", off:"꺼져 있습니다.",
         sumP:"명", sumR:"판", sumT:"세금", sumC:"2번 컷", on2:"켬", off2:"끔", edit:"\u203A 변경",
         copied:"복사됨", start:"시작하기", starting:"카드를 나누는 중", needFour:"2명이 모여야 시작합니다", noTicket:"티켓이 없습니다. 30분마다 한 장씩 채워집니다",
         wait:"방장이 시작하기를 기다리는 중입니다",
         /* 방장 연결이 끊김 — 서버가 남은 초를 준다(2026-10-28). 0 이면 다음 조회에서 넘어간다 */
         hostGone:n=>"방장의 연결이 끊어졌습니다<br>"+Math.max(1,n)+"초 뒤 다른 사람에게 방장이 넘어갑니다",
         kickT:"내보내기", kickM:(n,k)=>n+"님을 내보낼까요? (남은 횟수 "+k+")", kickY:"내보내기",
         kickNoneT:"내보내기", kickNone:"이 방에서는 더 내보낼 수 없습니다 (한 방에 2번까지)", ok:"확인",
         kickFail:"내보내지 못했습니다", startFail:"시작하지 못했습니다",
         pfRec:"전적", pfRate:"승률", pfWL:(w,l)=>w+"승 "+l+"패", pfKick:"강퇴",
         pfTier:"티어", pfScore:"점수", pfPts:n=>n.toLocaleString("ko-KR")+"점" },
    en:{ title:"Waiting room", roomL:"ROOM NUMBER", copy:"Copy", host:"Host", guest:"Guest",
         count:(j,c)=>j+" of "+c,
         needMore:"Two players are needed to start",
         canStart:"Start now, or wait for more",
         full:"The table is full", empty:"Open seat", hostTag:"HOST", inviteHere:"Invite",
         capT:"Table size", capD:"2 \u2013 8 players", capDG:"The host decides.",
         rndT:"Number of rounds", rndD:"1 to 10",
         rndDG:"The host decides.", rndU:n=>n+"",
         taxT:"Tax and revolution",
         taxD:"Cards change hands by standing, and two jokers overturn it.",
         clrT:"Two-cut",
         clrD:"Playing a 2 clears the pile and you lead again.",
         on:"On.", off:"Off.",
         sumP:" players", sumR:" rounds", sumT:"Tax", sumC:"Two-cut", on2:"on", off2:"off", edit:"\u203A Change",
         copied:"Copied", start:"Start", starting:"Dealing", needFour:"Two players are needed", noTicket:"No tickets left. One refills every 30 minutes",
         wait:"Waiting for the host to start",
         hostGone:n=>"The host has disconnected<br>Host passes to another player in "+Math.max(1,n)+"s",
         kickT:"Remove player", kickM:(n,k)=>"Remove "+n+" from the room? ("+k+" left)", kickY:"Remove",
         kickNoneT:"Remove player", kickNone:"No more removals in this room (2 per room)", ok:"OK",
         kickFail:"Could not remove the player", startFail:"Could not start",
         pfRec:"Record", pfRate:"Win rate", pfWL:(w,l)=>w+"W "+l+"L", pfKick:"Remove",
         pfTier:"Tier", pfScore:"Score", pfPts:n=>n.toLocaleString("en-US")+" pts" }
  };
  let lang = window.__lang || "ko";
  const PLAYERS = PLAYERS_KO;
  let cap = 6;          // 방 인원
  let joined = 4;       // 들어온 사람
  let clear2 = false;   // 2번 판 엎기
  let rounds = 5;       // 몇 판까지
  let taxOn = true;     // 세금·혁명 사용
  let role = "host";
  /* 방장 연결이 끊김 안내의 1초 셈 (2026-10-28) */
  let goneTick = null;
  const goneLeft = due => Math.max(0, Math.ceil((due - Date.now()) / 1000));
  
  
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
        bot: Boolean(s.bot),
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

  /* 누름을 받는다 — 판 화면과 같은 방식.
     손가락은 touchend 로 받고 기본 동작을 막아, 폰이 뒤따라 보내는
     마우스 신호가 아예 안 생기게 한다. 마우스는 click 으로 받는다 */
  let touchAt = 0;
  function onTap(node, fn){
    if (!node) return;
    let inside = false;
    node.addEventListener("touchstart", () => { inside = true; }, { passive: true });
    node.addEventListener("touchend", e => {
      if (e.cancelable) e.preventDefault();
      touchAt = Date.now();
      if (!inside) return;
      inside = false;
      const t = e.changedTouches && e.changedTouches[0];
      if (t){
        const r = node.getBoundingClientRect();
        if (t.clientX < r.left - 8 || t.clientX > r.right + 8 ||
            t.clientY < r.top - 8 || t.clientY > r.bottom + 8) return;
      }
      fn(e);
    }, { passive: false });
    node.addEventListener("touchcancel", () => { inside = false; }, { passive: true });
    node.onclick = e => {
      if (Date.now() - touchAt < 900) return;
      if (e && e.button != null && e.button !== 0) return;
      fn(e);
    };
  }

  /* ---------- 자리 그리기 ----------

     **매번 지우고 새로 만들면 안 된다.** 예전에는 `box.innerHTML = ""` 로 통째로
     지우고 자리를 새로 만들었다. 대기실은 서버를 계속 물어보느라 자주 다시 그리는데,
     그때마다 얼굴 `<span>` 이 새로 생기고 브라우저가 배경 그림을 다시 불러와
     **번쩍였다**(2026-09-28 신고). 뽑기 화면(draw.js)·판 화면(table.js)도 같았다.

     이제 자리는 **인원이 바뀔 때만** 새로 만들고, 그 뒤로는 바뀐 값만 고쳐 쓴다.
     자리 안의 칸(얼굴·자리비움·이름·방장표)도 미리 만들어 두고 보이고 숨긴다 —
     있을 때만 넣으면 그때그때 새로 만들게 된다.
     빈자리 누름(친구 초대)은 칸을 다시 쓰므로 **한 번만** 붙이고, 지금 빈자리인지는
     누를 때 다시 따진다 */
  let seatNodes = [], seatBits = [];
  const showIf = (node, on, txt) => {
    if (txt != null && node.textContent !== txt) node.textContent = txt;
    const d = on ? "" : "none";
    if (node.style.display !== d) node.style.display = d;
  };
  function renderSeats(){
    RB = ringBox();
    const box = document.getElementById("seats");
    const list = seatList();
    seatSound(list.filter(x => x && x.name).length);
    const R = window.__room;
    if (R) cap = R.cap || cap;
    if (seatNodes.length !== cap || seatNodes.some(d => d.parentNode !== box)){
      box.innerHTML = "";
      seatNodes = []; seatBits = [];
      for (let i = 0; i < cap; i++){
        const el = document.createElement("div");
        el.className = "seat";
        el.innerHTML =
          '<span class="seat__av"></span>' +
          '<span class="seat__off" style="display:none"></span>' +
          '<span class="seat__n"></span>' +
          '<span class="seat__b" style="display:none"></span>';
        el.__i = i;
        onTap(el, () => {
          if (el.classList.contains("seat--empty")){
            if (window.__openFriends) window.__openFriends("invite");
            return;
          }
          openProfile(el.__i);             /* 앉은 자리 — 프로필 창(전적·승률, 방장이면 강퇴 단추) */
        });
        box.appendChild(el);
        seatNodes.push(el);
        seatBits.push({ av: el.querySelector(".seat__av"), off: el.querySelector(".seat__off"),
                        n: el.querySelector(".seat__n"), b: el.querySelector(".seat__b") });
      }
    }
    const fs = (cap <= 6 ? 11 : 9.5) + "px";
    for (let i = 0; i < cap; i++){
      const a0 = (Math.PI / 2) + (i * 2 * Math.PI / cap);   // 아래에서 시계 방향
      /* 7·8명은 판 화면(table.js seatPos)과 같게 좌우 끝 쪽 자리 사이를 넓힌다 (2026-10-26) */
      const a = a0 + (cap >= 7 ? 0.12 : 0) * Math.sin(2 * a0);
      const sy = Math.sin(a);
      const bias = Math.sin(a0) > 0.25 ? 3.4 * sy : 0;   /* 아래쪽은 이름표만큼 더 바깥으로 */
      const left = RB.cx + Math.cos(a) * -RB.rx;
      const top  = RB.cy + sy * RB.ry + bias;
      const p = list[i] || null;
      const filled = Boolean(p);
      const el = seatNodes[i], q = seatBits[i];
      const cls = "seat" + (filled ? "" : " seat--empty")
        + (p && p.me ? " seat--me" : "") + (p && (p.off || p.left) ? " seat--off" : "");
      if (el.className !== cls) el.className = cls;
      const L2 = left.toFixed(2) + "%", T2 = top.toFixed(2) + "%";
      if (el.style.left !== L2) el.style.left = L2;
      if (el.style.top !== T2) el.style.top = T2;
      /* 인원과 무관하게 같은 크기 */
      if (el.style.getPropertyValue("--av") !== "46px") el.style.setProperty("--av", "46px");
      if (el.style.getPropertyValue("--fs") !== fs) el.style.setProperty("--fs", fs);
      /* **그림은 주소가 바뀔 때만 손댄다.** 같은 주소를 다시 넣어도 한 번 번쩍인다 */
      const bg = filled
        ? "url(" + A_RINGS.avatar + "),url(" + avtSeat(p, faceOf(i)) + ")"
        : "url(" + A_RINGS.empty + ")";
      if (q.av.__bg !== bg){ q.av.style.backgroundImage = bg; q.av.__bg = bg; }
      const avCls = "seat__av" + (filled ? "" : " seat__av--empty");
      if (q.av.className !== avCls) q.av.className = avCls;
      showIf(q.off, Boolean(p && (p.off || p.left)), null);
      const nCls = "seat__n" + (filled ? "" : " seat__inv");
      if (q.n.className !== nCls) q.n.className = nCls;
      const nTxt = filled ? p.name : L[lang].inviteHere;
      if (q.n.textContent !== nTxt) q.n.textContent = nTxt;
      showIf(q.b, Boolean(p && p.host), L[lang].hostTag);
    }
    const sm = document.getElementById("sum");
    anchorSeats(box, sm ? sm.getBoundingClientRect().top - 6 : 0);
    /* 열어 둔 프로필 상자: 그 자리가 비었거나 방을 나왔으면 닫고, 아니면 자리에 다시 붙인다 */
    if (pop.classList.contains("on")){
      if (!R || !list[popSeat] || !R.seats) closeProfile(); else placePop(popSeat);
    }
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
      now < MIN_START ? t.needMore : now < cap ? t.canStart : t.full;
  }
  
  /* ---------- 프로필 상자 · 강퇴 ----------
     대기실에서 **남의 얼굴**을 누르면 그 자리 **바로 밑에** 작은 상자가 뜬다(2026-10-01 사용자 지정 —
     화면 전체를 가리는 창이 아니라 그 사람 옆에 붙는 상자). 전적(몇승 몇패)·승률, 방장에게만 강퇴 단추.
     강퇴를 누르면 확인창 → 내보내기. 누구나 열 수 있고, 다른 곳을 누르면 닫힌다.
     자기 얼굴을 누르면 자기 전적만 뜬다(강퇴 단추 없음 — 2026-10-01 추가).
     **봇도 사람과 똑같이** 열리고 내보낼 수 있다(봇도 이름마다 전적을 센다).
     한 방에 2번까지 — 남은 횟수를 확인창에 적는다. 규칙은 서버가 다시 가린다 */
  let kicking = false;
  const pop = window.document.createElement("div");
  pop.className = "pfpop";
  pop.id = "pfPop";
  pop.setAttribute("role", "dialog");          /* 뒤로가기가 열린 창으로 보고 이것부터 닫는다 */
  pop.innerHTML =
    '<i class="pfpop__tip"></i>' +
    /* 티어·점수 (2026-10-06) — 랭킹 화면과 같은 뱃지에 숫자를 얹는다 */
    '<div class="pfpop__row"><span class="pfpop__k" id="pfTierK"></span><span class="pfpop__v" id="pfTier"></span></div>' +
    '<div class="pfpop__row"><span class="pfpop__k" id="pfScoreK"></span><span class="pfpop__v" id="pfScore"></span></div>' +
    '<div class="pfpop__row"><span class="pfpop__k" id="pfRecK"></span><span class="pfpop__v" id="pfRec"></span></div>' +
    '<div class="pfpop__row"><span class="pfpop__k" id="pfRateK"></span><span class="pfpop__v" id="pfRate"></span></div>' +
    '<button class="pfpop__kick" id="pfKick" hidden></button>';
  root.appendChild(pop);
  let popSeat = -1, popSeq = 0;
  function closeProfile(){ pop.classList.remove("on"); popSeat = -1; popSeq++; }
  window.__closeProfile = closeProfile;
  /* 그 자리 밑에 붙인다. 밑에 자리가 모자라면(화면 아래 끝) 위로, 좌우는 화면 안으로 당긴다 */
  function placePop(i){
    const seatEl = seatNodes[i];
    if (!seatEl) return;
    const box = root.getBoundingClientRect();
    const av = (seatEl.querySelector(".seat__av") || seatEl).getBoundingClientRect();
    const s = seatEl.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const cx = av.left + av.width / 2 - box.left;
    let left = Math.round(cx - w / 2);
    left = Math.max(6, Math.min(box.width - w - 6, left));
    let top = Math.round(s.bottom - box.top + 6);
    let up = false;
    if (top + h > box.height - 6){ top = Math.round(av.top - box.top - h - 8); up = true; }
    pop.style.left = left + "px";
    pop.style.top = top + "px";
    pop.classList.toggle("pfpop--up", up);
    const tip = pop.querySelector(".pfpop__tip");
    tip.style.left = Math.max(10, Math.min(w - 10, cx - left)) + "px";
  }
  function openProfile(i){
    const R = window.__room;
    if (!R || !R.seats) return;
    const arr = asArray(R.seats, R.cap || cap);
    const p = arr[i];
    if (!p) return;
    if (pop.classList.contains("on") && popSeat === i){ closeProfile(); return; }   /* 같은 얼굴을 또 누르면 닫는다 */
    const t = L[lang];
    const meSeat = arr[R.me];
    const host = Boolean(meSeat && meSeat.uid === R.host);
    /* 내 얼굴을 누르면 내 전적만 — 나를 내보내는 단추는 없다(2026-10-01 사용자 요청) */
    const canKick = Boolean(i !== R.me && R.online && host && R.phase === "waiting" && window.__kickSeat);
    const my = ++popSeq;
    popSeat = i;
    document.getElementById("pfTierK").textContent = t.pfTier;
    document.getElementById("pfScoreK").textContent = t.pfScore;
    document.getElementById("pfRecK").textContent = t.pfRec;
    document.getElementById("pfRateK").textContent = t.pfRate;
    const rec = document.getElementById("pfRec"), rate = document.getElementById("pfRate");
    const tierEl = document.getElementById("pfTier"), scoreEl = document.getElementById("pfScore");
    rec.textContent = "\u2026"; rate.textContent = "\u2026";
    tierEl.textContent = "\u2026"; scoreEl.textContent = "\u2026";
    const kb = document.getElementById("pfKick");
    kb.textContent = t.pfKick;
    kb.hidden = !canKick;
    kb.onclick = () => { closeProfile(); askKick(i); };
    pop.classList.add("on");
    placePop(i);
    const fill = r => {
      if (my !== popSeq) return;                /* 그사이 다른 사람을 눌렀다 */
      const played = r && Number.isInteger(r.played) ? r.played : null;
      const wins = r && Number.isInteger(r.wins) ? r.wins : null;
      if (played == null || wins == null){ rec.textContent = "-"; rate.textContent = "-"; }
      else {
        rec.textContent = t.pfWL(wins, Math.max(0, played - wins));
        rate.textContent = played ? Math.round(wins / played * 100) + "%" : "-";
      }
      /* 점수가 안 오면(옛 서버·계정 꺼짐) 티어·점수는 "-" */
      const score = r && Number.isFinite(r.score) ? Math.max(0, Math.floor(r.score)) : null;
      if (score == null){ tierEl.textContent = "-"; scoreEl.textContent = "-"; }
      else {
        const tn = Math.max(0, Math.min(TIER_MAX, tierOf(score)));
        tierEl.textContent = "";
        const b = window.document.createElement("span");
        b.className = "pfpop__t";
        b.style.backgroundImage = "url(/assets/tier_" + String(tn).padStart(2, "0") + ".webp)";
        const num = window.document.createElement("b");
        num.textContent = String(tn);
        b.appendChild(num);
        tierEl.appendChild(b);
        scoreEl.textContent = t.pfPts(score);
      }
      placePop(i);                              /* 글자 길이가 바뀌었으니 다시 맞춘다 */
    };
    const f = window.__seatRecord;
    if (typeof f !== "function") fill(null);
    else Promise.resolve(f(i)).then(fill, () => fill(null));
  }
  /* 상자 밖을 누르면 닫는다 — 다른 얼굴을 누른 것은 그쪽 처리기가 새로 연다 */
  window.document.addEventListener("pointerdown", e => {
    if (!pop.classList.contains("on")) return;
    if (pop.contains(e.target)) return;
    if (e.target.closest && e.target.closest("#room .seat:not(.seat--empty) .seat__av")) return;
    closeProfile();
  }, true);
  window.addEventListener("resize", () => { if (pop.classList.contains("on") && popSeat >= 0) placePop(popSeat); });
  function askKick(i){
    const R = window.__room;
    if (!R || !R.seats || !window.__kickSeat || !window.__ask) return;   /* 서버 방에서만 */
    if (R.phase !== "waiting" || starting || kicking) return;
    const arr = asArray(R.seats, R.cap || cap);
    const meSeat = arr[R.me];
    if (!meSeat || meSeat.uid !== R.host) return;                        /* 방장만 */
    const p = arr[i];
    if (!p || i === R.me) return;                                         /* 자기는 안 됨 */
    const t = L[lang];
    const left = Math.max(0, (R.kickMax || 2) - (R.kicks || 0));
    if (left <= 0){ window.__ask(t.kickNoneT, t.kickNone, t.ok, null, null, true); return; }
    const who = p.name || "";
    window.__ask(t.kickT, t.kickM(who, left), t.kickY, async () => {
      /* 묻는 사이에 그 자리가 바뀌었으면(나갔다 딴 사람이 앉음) 내보내지 않는다 */
      const R2 = window.__room;
      const now = R2 && R2.seats ? asArray(R2.seats, R2.cap || cap)[i] : null;
      if (!now || now.name !== who) return;
      kicking = true;
      try { await window.__kickSeat(i); }
      catch (err){
        /* 서버 설명은 한국어라 한국어 화면에서만 덧붙인다 */
        const msg = err && err.why === "limit" ? t.kickNone
          : (t.kickFail + (lang === "ko" && err && err.message ? "\n" + err.message : ""));
        window.__ask(t.kickT, msg, t.ok, null, null, true);
      }
      finally { kicking = false; }
    });
  }

  function syncOpts(){
    const o = window.__opts || {};
    cap = o.cap || cap; rounds = o.rounds || rounds;
    taxOn = o.tax !== false; clear2 = !!o.clear2;
    if (joined > cap) joined = cap;
  }
  /* 시작을 누르고 끝날 때까지. 이 동안은 단추를 다시 그려도 잠가 둔다.
     예전에는 티켓을 쓰는(파이어베이스 왕복) 사이에 한 번 더 누르면
     **티켓이 두 장 나갔다**(2026-09-30 재현). 1.5초마다 다시 그려지는 단추라
     단추의 disabled 만으로는 못 막는다 */
  let starting = false;
  /* 설정 줄에 잠깐 띄우는 알림(티켓 없음). 이 줄은 1.5초마다 다시 그려지므로
     글자만 바꾸면 곧바로 지워졌다 — 몇 초 동안은 다시 그려도 알림을 남긴다 */
  let noteMsg = "", noteUntil = 0;
  function flashNote(msg){
    noteMsg = msg; noteUntil = Date.now() + 4000;
    const sm = document.getElementById("sum");
    if (sm) sm.textContent = msg;
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
      /* 1판이면 세금·2번 컷이 없다 — 설정 줄에서도 뺀다 (2026-10-22). 4명 밑이면 세금만 뺀다 (2026-10-23) */
      (rounds > 1 && cap >= 4 ? ' \u00B7 ' + t.sumT + ' ' + (taxOn ? t.on2 : t.off2) : '') +
      (rounds > 1 ? ' \u00B7 ' + t.sumC + ' ' + (clear2 ? t.on2 : t.off2) : '') +
      (iamHost ? '  <span style="color:#E3C67C">' + t.edit + '</span>' : '');
    if (noteMsg && Date.now() < noteUntil) sm.textContent = noteMsg;
    sm.disabled = !iamHost;
    const a = document.getElementById("action");
    if (iamHost){
      /* 남은 초가 있으면 같이 적는다. 다시 그려도 숫자가 안 사라진다 */
      const lf = window.__roomLeft;
      const lbl = starting ? t.starting
                : now < MIN_START ? t.needFour
                : t.start + (lf != null && lf > 0 ? " " + lf : "");
      a.innerHTML = '<button class="btn-primary" ' + (now < MIN_START || starting ? "disabled" : "") + '>' +
        lbl + '</button>';
    } else {
      /* 방장 연결이 끊겼으면 기다리라는 말 대신 곧 방장이 넘어온다고 알린다 — 앱을 꺼 버린 방장 방에 들어온 사람이
         영영 못 시작하는 줄 알았다(2026-10-28 사용자) */
      const due = R && R.hostDue;
      a.innerHTML = due
        ? '<div class="waiting waiting--gone">' + t.hostGone(goneLeft(due)) + '</div>'
        : '<div class="waiting">' + t.wait + '<span class="dots"></span></div>';
      /* 서버 조회(1.5초)를 기다리지 않고 1초씩 센다 — 안 그러면 9·8·6·5·3 처럼 건너뛴다 */
      if (due && !goneTick) goneTick = setInterval(() => {
        const R2 = window.__room, el = document.querySelector("#room .waiting--gone");
        if (!R2 || !R2.hostDue || !el){ clearInterval(goneTick); goneTick = null; return; }
        el.innerHTML = L[lang].hostGone(goneLeft(R2.hostDue));
      }, 250);
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
    if (!b || b.disabled || starting) return;
    const R = window.__room;
    /* **기다리기 전에** 잠근다 — 아래 await 사이에 두 번째 누름이 들어온다 */
    starting = true;
    b.disabled = true;
    b.textContent = L[lang].starting;
  
    /* 티켓이 있는지 미리 본다. **빼는 것은 서버다** — 시작을 부르면 서버가 앉은 사람
       전원에게서 한 장씩 뺀다(2026-10-17). 여기서는 헛걸음만 줄인다 */
    if (window.spendTicket){
      let ok = false;
      try { ok = await window.spendTicket(); } catch(err){ ok = false; }
      if (!ok){
        starting = false;
        renderControls();
        e.stopImmediatePropagation();
        flashNote(L[lang].noTicket);
        return;
      }
    }
    window.__scored = false;
  
    if (R){
      /* 온라인 — 서버가 카드를 나눈다. 모두는 방 상태를 보고 따라 들어간다 */
      e.stopImmediatePropagation();
      try { await window.__startRound(); }
      catch(err){
        starting = false;
        renderControls();
        /* 서버가 티켓이 없다고 거절했다 — 화면 숫자가 어긋났던 것이니 다시 읽는다 */
        if (err && err.why === "ticket"){
          flashNote(L[lang].noTicket);
          if (window.__refreshAccount) window.__refreshAccount();
          return;
        }
        /* 옛 앱 손님이 있어 4명 밑으로는 못 시작한다 (2026-10-23) — 고장이 아니니 창 대신 설정 줄에 안내만 */
        if (err && err.why === "update"){ flashNote(err.message || ""); return; }
        alert(L[lang].startFail + " : " + (err && (err.message || err.code) || err));
        return;
      }
      starting = false;
      return;
    }
    setTimeout(() => { starting = false; }, 1500);
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
