import "./styles/base.css";
import { AVATARS, AVT_FREE } from "./lib/assets.js";
import { sound, setBgm, setSfx, toggleMute, onSound, play as snd, playBgm, stopBgm, warm } from "./lib/sound.js";
import "./state.js";

export const GEAR = "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"><path d=\"M3.5 7h9M17 7h3.5M3.5 12h4M12 12h8.5M3.5 17h8M15.5 17h5\"/><circle cx=\"14.6\" cy=\"7\" r=\"2.1\"/><circle cx=\"9.6\" cy=\"12\" r=\"2.1\"/><circle cx=\"13.2\" cy=\"17\" r=\"2.1\"/></svg>";
export const OPT_HTML = "<div class=\"opts\" id=\"opts\" role=\"dialog\" aria-modal=\"true\"><div class=\"opts__v\" data-optclose></div><div class=\"opts__p\"><div class=\"opts__h\"><span id=\"optT\"></span><button class=\"opts__x\" data-optclose aria-label=\"close\">×</button></div><div class=\"opts__b\" id=\"optBody\"></div><div class=\"opts__f\"><button class=\"opts__go\" id=\"optGo\"></button></div></div></div>";
export const PENCIL = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" '
  + 'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
  + '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z"/></svg>';

export const CROWN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 17h16M4 17 3 7l4.5 3.5L12 5l4.5 5.5L21 7l-1 10"/></svg>';
/* 상단바 사자 프로필을 누르면 열리는 계정 창 */
export const ACCT_HTML =
  '<div class="cfg" id="acctBox" role="dialog" aria-modal="true">' +
  '<div class="cfg__v" data-acctclose></div><div class="cfg__p">' +
  '<div class="cfg__h"><span id="acBoxT"></span>' +
  '<button class="cfg__x" data-acctclose aria-label="close">\u00D7</button></div>' +
  '<div class="cfg__b">' +
  '<div class="ac__name"><span id="acNick"></span>' +
  '<button id="acName" class="ac__edit" aria-label="rename"></button></div>' +
  '<p class="cfg__n" id="acLine"></p>' +
  '<div class="cfg__l" id="acAvtL"></div>' +
  '<div class="avt" id="acAvt"></div>' +

  '<div class="cfg__row" id="acLinkRow" hidden><button id="acLink"></button></div>' +
  '<div class="cfg__row"><button id="acOut"></button></div>' +
  '</div></div></div>';

export const CFG_HTML =
  '<div class="cfg" id="cfg" role="dialog" aria-modal="true">' +
  '<div class="cfg__v" data-cfgclose></div><div class="cfg__p">' +
  '<div class="cfg__h"><span id="cfgT"></span>' +
  '<button class="cfg__x" data-cfgclose aria-label="close">\u00D7</button></div>' +
  '<div class="cfg__b">' +
  '<div class="cfg__l" id="cfgLangL"></div>' +
  '<div class="cfg__row"><button data-l="ko">한국어</button><button data-l="en">English</button></div>' +
  '<p class="cfg__n" id="cfgNote"></p>' +
  /* 음량 — 배경음악과 효과음을 따로 조절한다 */
  '<div class="cfg__l" id="cfgVolL"></div>' +
  '<div class="vol"><span class="vol__n" id="volBgmN"></span>' +
  '<input class="vol__b" id="volBgm" type="range" min="0" max="100" step="5">' +
  '<span class="vol__v" id="volBgmV"></span></div>' +
  '<div class="vol"><span class="vol__n" id="volSfxN"></span>' +
  '<input class="vol__b" id="volSfx" type="range" min="0" max="100" step="5">' +
  '<span class="vol__v" id="volSfxV"></span></div>' +
  '</div></div></div>';

/* 확인창 — 뒤로가기·앱 종료에 쓴다. 설정 창과 같은 틀 */
export const ASK_HTML = "<div class=\"cfg\" id=\"ask\" role=\"dialog\" aria-modal=\"true\">" +
  "<div class=\"cfg__v\" data-askno></div><div class=\"cfg__p\">" +
  "<div class=\"cfg__h\"><span id=\"askT\"></span>" +
  "<button class=\"cfg__x\" data-askno aria-label=\"close\">\u00D7</button></div>" +
  "<div class=\"cfg__b\"><p class=\"cfg__l\" id=\"askM\"></p>" +
  "<div class=\"cfg__row\"><button id=\"askNo\" data-askno></button>" +
  "<button id=\"askYes\"></button></div></div></div></div>";

/* 친구 창 */
export const FRIEND_HTML =
  '<div class="cfg" id="frBox" role="dialog" aria-modal="true">' +
  '<div class="cfg__v" data-frclose></div><div class="cfg__p">' +
  '<div class="cfg__h"><span id="frT"></span>' +
  '<button class="cfg__x" data-frclose aria-label="close">\u00D7</button></div>' +
  '<div class="cfg__b">' +
  '<div class="fr__tabs" id="frTabs">' +
  '<button data-frtab="list" aria-pressed="true"></button>' +
  '<button data-frtab="add"></button>' +
  '<button data-frtab="rank"></button>' +
  '</div>' +
  '<div class="fr__find" id="frFind" hidden>' +
  '<input id="frName" maxlength="12" autocomplete="off">' +
  '<button id="frSearch"></button></div>' +
  '<p class="cfg__n" id="frNote"></p>' +
  '<div class="fr__body" id="frBody"></div>' +
  '</div></div></div>';

export function initNav(){
  
  /* 언어는 앱 전체가 하나로 움직인다 */
  /* 접속 환경에 맞춰 기본 언어를 고르고, 바꾼 값은 기억한다 */
  window.__lang = (function(){
    try { const v = localStorage.getItem("zk_lang"); if (v === "ko" || v === "en") return v; } catch(e){}
    const n = (navigator.language || navigator.userLanguage || "ko").toLowerCase();
    return n.indexOf("ko") === 0 ? "ko" : "en";
  })();
  window.setLang = l => {
    window.__lang = l;
    try { localStorage.setItem("zk_lang", l); } catch(e){}
    document.documentElement.lang = l;
    document.querySelectorAll("[data-l]").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.l === l)));
    window.dispatchEvent(new Event("langchange"));
  };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-l]");
    if (b) window.setLang(b.dataset.l);
    if (e.target.closest("[data-rankopen]")) go("rank");
    if (e.target.closest("[data-cfgopen]")) openCfg();
    if (e.target.closest("[data-cfgclose]")) document.getElementById("cfg").classList.remove("on");
  });
  
  /* ---------- 방 설정 (로비의 방 만들기 / 대기실의 변경) ---------- */
  window.__opts = window.__opts || {cap: 4, rounds: 3, tax: true, clear2: false};
  let optMode = "create";
  const OPT_T = {
    ko:{ create:"방 만들기", edit:"방 설정", goCreate:"방 만들기", goEdit:"확인",
         cap:["방 인원","4명 \u2013 8명"],
         rnd:["플레이 판 수 설정","최소 3판부터 시작"],
         tax:["세금과 혁명","등수에 따라 카드를 교환하고, 조커 두 장으로 순위를 뒤집는 규칙입니다."],
         cut:["2번 컷","2번 카드를 내면 바닥을 비우고 다시 선을 잡습니다."],
         friends:["친구들끼리 하기",""], unit:"판" },
    en:{ create:"Create a room", edit:"Room settings", goCreate:"Create room", goEdit:"Done",
         cap:["Table size","4 \u2013 8 players"],
         rnd:["Number of rounds","Three at least"],
         tax:["Tax and revolution","Cards change hands by standing, and two jokers overturn it."],
         cut:["Two-cut","Playing a 2 clears the pile and you lead again."],
         friends:["Friends only",""], unit:"" }
  };
  function optRow(pair, right){
    return '<div class="mk__row"><div><div class="mk__t">' + pair[0] + '</div>' +
      '<div class="mk__d">' + pair[1] + '</div></div>' + right + '</div>';
  }
  function optStep(k, v, lo, hi, unit){
    return '<div class="mk__st">' +
      '<button data-opt="' + k + '-"' + (v <= lo ? " disabled" : "") + '>\u2212</button>' +
      '<span>' + v + (unit || "") + '</span>' +
      '<button data-opt="' + k + '+"' + (v >= hi ? " disabled" : "") + '>+</button></div>';
  }
  function optSw(k, on){
    return '<button class="mk__sw" data-opt="' + k + '" role="switch" aria-checked="' + on + '"></button>';
  }
  function optRender(){
    const t = OPT_T[window.__lang] || OPT_T.ko, o = window.__opts;
    const mk = optMode === "create";
    document.getElementById("optT").textContent = mk ? t.create : t.edit;
    document.getElementById("optGo").textContent = mk ? t.goCreate : t.goEdit;
    document.getElementById("optBody").innerHTML =
      optRow(t.cap, optStep("cap", o.cap, 4, 8)) +
      optRow(t.rnd, optStep("rnd", o.rounds, 3, 99, t.unit)) +
      optRow(t.tax, optSw("tax", o.tax)) +
      optRow(t.cut, optSw("cut", o.clear2)) +
      optRow(t.friends, optSw("friends", o.friends));
  }
  function openOpts(mode){
    optMode = mode; optRender();
    document.getElementById("opts").classList.add("on");
  }
  document.addEventListener("click", e => {
    const k = e.target.closest("[data-opt]");
    if (k){
      const o = window.__opts, v = k.dataset.opt;
      if (v === "cap-") o.cap = Math.max(4, o.cap - 1);
      if (v === "cap+") o.cap = Math.min(8, o.cap + 1);
      if (v === "rnd-") o.rounds = Math.max(3, o.rounds - 1);
      if (v === "rnd+") o.rounds = o.rounds + 1;
      if (v === "tax") o.tax = !o.tax;
      if (v === "cut") o.clear2 = !o.clear2;
      if (v === "friends") o.friends = !o.friends;
      optRender();
    }
    if (e.target.closest("[data-optclose]")) document.getElementById("opts").classList.remove("on");
    if (e.target.closest("[data-optopen]")) openOpts("edit");
  });
  document.getElementById("optGo").addEventListener("click", () => {
    document.getElementById("opts").classList.remove("on");
    if (optMode === "create"){
      if (window.__createRoom){
        window.__createRoom().then(code => { if (code) go("room"); });
      } else setTimeout(() => go("room"), 80);
    } else {
      window.dispatchEvent(new Event("optschange"));
      if (window.__saveOpts) window.__saveOpts();     /* 방장이면 서버에도 쓴다 */
    }
  });
  window.addEventListener("langchange", () => {
    if (document.getElementById("opts").classList.contains("on")) optRender();
  });
  
  const CFG_T = {
    ko:{ title:"설정", lang:"언어",
         note:"처음 들어오면 기기 언어에 맞춰 자동으로 정해집니다. 여기서 바꾸면 그 선택을 기억합니다." },
    en:{ title:"Settings", lang:"LANGUAGE",
         note:"The game picks your device language on first visit. Changing it here is remembered." }
  };
  function openCfg(){
    const t = CFG_T[window.__lang] || CFG_T.ko;
    document.getElementById("cfgT").textContent = t.title;
    document.getElementById("cfgLangL").textContent = t.lang;
    document.getElementById("cfgNote").textContent = "";   /* 설명글은 없앤다 */
    paintVol();
    document.getElementById("cfg").classList.add("on");
  }

  /* 계정 칸 — 게스트에게는 랭킹 안내와 잇기 단추를 보여준다 */
  /* 프로필 얼굴 고르기.
     앞 다섯은 처음부터, 그 뒤는 점수가 모자라면 잠긴 채로 보여 준다 —
     뭘 모으는 재미가 있어야 계속 하게 된다 */
  /* ---------- 음량 ---------- */
  function paintVol(){
    const ko = (window.__lang || "ko") === "ko";
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("cfgVolL", ko ? "음량" : "Volume");
    set("volBgmN", ko ? "배경음악" : "Music");
    set("volSfxN", ko ? "효과음" : "Effects");
    set("volBgmV", sound.bgm + "");
    set("volSfxV", sound.sfx + "");
    const b = document.getElementById("volBgm"), f = document.getElementById("volSfx");
    if (b) b.value = String(sound.bgm);
    if (f) f.value = String(sound.sfx);
  }

  /* 홈 화면 소리 단추 — 누르면 음소거 */
  function paintMute(){
    const b = document.getElementById("btMute");
    if (!b) return;
    b.setAttribute("aria-pressed", String(!sound.muted));
    b.classList.toggle("is-off", sound.muted);
    b.setAttribute("aria-label", sound.muted ? "소리 켜기" : "소리 끄기");
  }

  document.addEventListener("input", e => {
    if (e.target.id === "volBgm"){ setBgm(e.target.value); paintVol(); }
    if (e.target.id === "volSfx"){ setSfx(e.target.value); paintVol(); }
  });
  document.addEventListener("click", e => {
    if (e.target.closest("#btMute")){ toggleMute(); paintMute(); paintVol(); return; }
    /* 단추 소리 — 누를 수 있는 것에만.
       진입창은 뺀다. 거기서는 아직 소리가 막혀 있기도 하고,
       첫 화면부터 소리가 나는 것이 부담스럽다 */
    const b = e.target.closest("button");
    const now = (document.querySelector(".page.is-on") || {}).id || "entry";
    /* 이모티콘 고르는 판은 제 소리가 없으니 단추 소리도 안 낸다 */
    const quiet = e.target.closest(".emopick") || e.target.closest("#emo");
    if (b && !b.disabled && now !== "entry" && !quiet) snd("button");
  });

  /* 배경음악은 **진입창에서 로비로 들어오는 순간** 시작한다.
     브라우저가 사람이 화면을 만지기 전에는 소리를 막는데,
     시작하기를 누른 뒤라 그 조건도 같이 풀린다 */
  let touched = false;
  onSound(() => { paintMute(); });

  /* 이름에 꺾쇠 같은 것이 들어와도 화면이 안 깨지게 */
  const esc = t => String(t == null ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* ---------- 친구 ---------- */
  const FR_T = {
    ko: { title:"친구", list:"목록", add:"추가", rank:"순위",
          find:"별명으로 찾기", search:"찾기",
          none:"아직 친구가 없습니다", noReq:"", online:"접속 중", inGame:"게임 중", off:"오프라인",
          invite:"초대", del:"삭제", accept:"수락", no:"거절",
          req:"받은 신청", sent:"신청했습니다", already:"이미 친구입니다",
          notFound:"그런 별명이 없습니다", self:"자기 자신은 안 됩니다",
          needRoom:"방에 있을 때만 부를 수 있습니다", invited:"불렀습니다",
          busy:"게임 중이라 못 부릅니다", pts:"점" },
    en: { title:"Friends", list:"List", add:"Add", rank:"Rank",
          find:"Find by name", search:"Find",
          none:"No friends yet", noReq:"", online:"Online", inGame:"In game", off:"Offline",
          invite:"Invite", del:"Remove", accept:"Accept", no:"Decline",
          req:"Requests", sent:"Request sent", already:"Already friends",
          notFound:"No such name", self:"That's you", needRoom:"Open a room first",
          invited:"Invited", busy:"They're in a game", pts:"pts" },
  };
  let frTab = "list";
  const FR = () => window.__friends || {};
  const frT = () => FR_T[window.__lang] || FR_T.ko;

  function frNote(msg){
    const e = document.getElementById("frNote");
    if (e) e.textContent = msg || "";
  }

  async function frPaint(){
    const t = frT();
    const box = document.getElementById("frBody");
    if (!box) return;
    document.getElementById("frT").textContent = frInviteMode
      ? ((window.__lang || "ko") === "ko" ? "친구 부르기" : "Invite a friend") : t.title;
    document.querySelector('[data-frtab="list"]').textContent = t.list;
    document.querySelector('[data-frtab="add"]').textContent = t.add;
    document.querySelector('[data-frtab="rank"]').textContent = t.rank;
    document.querySelectorAll("[data-frtab]").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.frtab === frTab)));
    document.getElementById("frFind").hidden = frTab !== "add";
    document.getElementById("frSearch").textContent = t.search;
    document.getElementById("frName").placeholder = t.find;

    box.innerHTML = "";
    if (frTab === "add"){
      const reqs = await FR().incoming();
      if (!reqs.length) return;
      box.innerHTML = '<div class="fr__h">' + t.req + "</div>" +
        reqs.map(r => '<div class="fr__row"><span class="fr__n">' + esc(r.name || "") + "</span>" +
          '<button class="fr__b" data-fraccept="' + r.uid + '" data-frname="' + esc(r.name || "") + '">' +
          t.accept + "</button>" +
          '<button class="fr__b fr__b--off" data-frno="' + r.uid + '">' + t.no + "</button></div>").join("");
      return;
    }
    if (frTab === "rank"){
      const rows = await FR().friendRank();
      box.innerHTML = rows.map((r, i) =>
        '<div class="fr__row' + (r.mine ? " fr__row--me" : "") + '">' +
        '<span class="fr__k">' + (i + 1) + "</span>" +
        '<span class="fr__n">' + esc(r.name || "") + "</span>" +
        '<span class="fr__s">' + (r.score || 0).toLocaleString() + t.pts + "</span></div>").join("");
      return;
    }
    const rows = await FR().listFriends();
    if (!rows.length){ box.innerHTML = '<p class="cfg__n">' + t.none + "</p>"; return; }
    box.innerHTML = rows.map(r => {
      const where = !r.online ? t.off : (r.state === "game" ? t.inGame : t.online);
      const dot = !r.online ? "off" : (r.state === "game" ? "game" : "on");
      /* 빈자리에서 연 창이면 줄을 누르는 것이 곧 부르기다 */
      if (frInviteMode){
        const busy = r.online && r.state === "game";
        return '<div class="fr__row' + (busy || !r.online ? " fr__row--off" : "") + '"' +
          (busy || !r.online ? "" : ' data-frinv="' + r.uid + '"') + ">" +
          '<i class="fr__dot fr__dot--' + dot + '"></i>' +
          '<span class="fr__n">' + esc(r.name || "") + "</span>" +
          '<span class="fr__w">' + (busy ? t.busy : where) + "</span></div>";
      }
      return '<div class="fr__row">' +
        '<i class="fr__dot fr__dot--' + dot + '"></i>' +
        '<span class="fr__n">' + esc(r.name || "") + "</span>" +
        '<span class="fr__w">' + where + "</span>" +
        '<button class="fr__b fr__b--off" data-frdel="' + r.uid + '">' + t.del + "</button></div>";
    }).join("");
  }

  let frInviteMode = false;
  window.__openFriends = (mode) => {
    frInviteMode = mode === "invite";
    frTab = "list"; frNote("");
    document.getElementById("frBox").classList.add("on");
    frPaint();
  };
  document.addEventListener("click", async e => {
    if (e.target.closest("[data-friendopen]")){ window.__openFriends(); return; }
    if (e.target.closest("[data-frclose]")){
      document.getElementById("frBox").classList.remove("on"); return; }
    const tb = e.target.closest("[data-frtab]");
    if (tb){ frTab = tb.dataset.frtab; frNote(""); frPaint(); return; }
    if (e.target.closest("#frSearch")){
      const t = frT();
      const v = (document.getElementById("frName").value || "").trim();
      const f = await FR().findByName(v);
      if (!f){ frNote(t.notFound); return; }
      if (f.self){ frNote(t.self); return; }
      const r = await FR().sendRequest(f.uid, f.name);
      frNote(r.ok ? t.sent : (r.why === "already" ? t.already : t.notFound));
      return;
    }
    const ac = e.target.closest("[data-fraccept]");
    if (ac){ await FR().accept(ac.dataset.fraccept, ac.dataset.frname); frPaint(); return; }
    const no = e.target.closest("[data-frno]");
    if (no){ await FR().reject(no.dataset.frno); frPaint(); return; }
    const del = e.target.closest("[data-frdel]");
    if (del){ await FR().removeFriend(del.dataset.frdel); frPaint(); return; }
    const inv = e.target.closest("[data-frinv]");
    if (inv){
      const t = frT();
      const code = (window.__room || {}).code;
      if (!code){ frNote(t.needRoom); return; }
      await FR().invite(inv.dataset.frinv, code);
      if (frInviteMode){ document.getElementById("frBox").classList.remove("on"); return; }
      frNote(t.invited);
      return;
    }
  });

  /* ---------- 접속 상태와 초대 알림 ----------

     로비·대기실에 있으면 부를 수 있고, 판에 들어가면 못 부른다.
     초대는 10초마다 확인해 로비·대기실에서만 띄운다 */
  const PLAY = ["table", "draw", "tax", "result"];
  let lastState = "";
  function pushPresence(){
    const now = (document.querySelector(".page.is-on") || {}).id || "entry";
    if (now === "entry") return;
    const st = PLAY.includes(now) ? "game" : "lobby";
    if (st === lastState) return;
    lastState = st;
    if (FR().setPresence) FR().setPresence(st);
  }
  setInterval(() => { lastState = ""; pushPresence(); }, 60000);   /* 살아 있다고 알린다 */

  let invSeen = {};
  async function checkInvites(){
    const now = (document.querySelector(".page.is-on") || {}).id || "entry";
    if (now === "entry" || PLAY.includes(now)) return;   /* 판에서는 안 띄운다 */
    if (!FR().invites) return;
    const rows = await FR().invites();
    const t = frT();
    for (const r of rows){
      if (invSeen[r.uid] === r.code) continue;
      invSeen[r.uid] = r.code;
      const ko = (window.__lang || "ko") === "ko";
      ask(ko ? "초대" : "Invite",
          (r.name || "") + (ko ? " 님이 불렀습니다" : " invited you"),
          ko ? "들어가기" : "Join",
          async () => {
            await FR().dropInvite(r.uid);
            if (window.__joinRoom){
              const seat = await window.__joinRoom(r.code);
              if (seat != null) go("room");
            }
          });
      break;                                             /* 한 번에 하나만 */
    }
  }
  setInterval(checkInvites, 10000);

  function paintAvatars(){
    const wrap = document.getElementById("acAvt");
    const lab = document.getElementById("acAvtL");
    if (!wrap || !lab) return;
    const ko = (window.__lang || "ko") === "ko";
    const a = window.ACCOUNT || {};
    const score = a.score || 0;
    const mine = Number(a.avatar) || 0;
    lab.textContent = ko ? "프로필 설정" : "Profile";
    wrap.innerHTML = AVATARS.map((v, i) => {
      const open = score >= (i < AVT_FREE ? 0 : (i - AVT_FREE + 1) * 5000);
      const need = i < AVT_FREE ? 0 : (i - AVT_FREE + 1) * 5000;
      /* 잠긴 것은 자물쇠 밑에 필요한 점수를 바로 적는다.
         눌러야 알려 주면 뭘 모으는 중인지 한눈에 안 보인다 */
      const lock = open ? "" :
        '<i class="avt__lk"></i><span class="avt__need">' +
        '<b>' + need.toLocaleString() + (ko ? "점" : "") + "</b>" +
        '<i>' + (ko ? "달성 시 해제" : "to unlock") + "</i></span>";
      return '<button class="avt__i' + (open ? "" : " avt__i--lock") +
        (i === mine ? " avt__i--on" : "") + '" data-avt="' + i + '"' +
        ' style="background-image:url(' + v.f + ')" aria-label="' + (ko ? v.ko : v.en) + '">' +
        lock + "</button>";
    }).join("");
  }

  function paintAcct(){
    paintVol();
    const ko = (window.__lang || "ko") === "ko";
    const a = window.ACCOUNT;
    paintAvatars();
    const lab = document.getElementById("acBoxT");
    const line = document.getElementById("acLine");
    const row = document.getElementById("acLinkRow");
    let btn = document.getElementById("acLink");
    if (!lab || !line || !row) return;
    /* 고르는 중이면 그대로 둔다. 안 그러면 다시 그릴 때 선택지가 사라진다 */
    if (conflictOn) return;
    /* 충돌 안내로 바꿔 놨으면 원래 단추로 되돌린다. 그다음에 다시 찾는다 */
    if (!row.querySelector("#acLink")){
      row.innerHTML = '<button id="acLink"></button>';
      btn = document.getElementById("acLink");
    }
    if (!btn) return;
    lab.textContent = ko ? "계정" : "Account";
    if (!a || !a.signedIn){
      line.hidden = false;
      line.textContent = ko ? "로그인하지 않았습니다" : "Not signed in";
      row.hidden = true;
      return;
    }
    if (a.guest){
      line.hidden = false;
      line.textContent = ko ? "게스트 · 랭킹에 오르지 않습니다" : "Guest · not on the leaderboard";
      btn.textContent = ko ? "구글 계정 잇기" : "Link Google account";
      row.hidden = false;
    } else {
      /* 구글 계정이면 안내할 것이 없다. 빈 줄을 남기면 빈 상자로 보인다 */
      line.textContent = "";
      line.hidden = true;
      row.hidden = true;
    }
    /* 로그아웃 — 없으면 한 번 들어간 뒤로 아무것도 못 바꾼다 */
    /* 이름 옆 연필을 눌러 바꾼다. 따로 단추를 두지 않는다 */
    const nick = document.getElementById("acNick");
    const pen = document.getElementById("acName");
    if (nick) nick.textContent = a.name || (ko ? "이름없음" : "No name");
    if (pen){ pen.innerHTML = PENCIL; pen.hidden = false; }
    const outBtn = document.getElementById("acOut");
    if (outBtn){ outBtn.textContent = ko ? "로그아웃" : "Sign out"; outBtn.hidden = false; }
  }
  window.addEventListener("accountchange", () => {
    const b = document.getElementById("acctBox");
    if (b && b.classList.contains("on")) paintAcct();
  });

  /* 이미 있는 구글 계정이라 이을 수 없을 때.
     여기서 window.confirm 을 쓰면 안 된다 — 구글 창이 앞에 있어서
     크롬이 "활성 탭이 아니다"라며 통째로 무시한다(실제로 그래서 아무 일도 안 났다).
     화면 안에서 고르게 한다 */
  let conflictOn = false;
  function showConflict(){
    conflictOn = true;
    const ko = (window.__lang || "ko") === "ko";
    const box = document.getElementById("acLinkRow");
    if (!box) return;
    box.hidden = false;
    box.innerHTML =
      '<p class="cfg__n" style="margin:0 0 8px">' +
      (ko ? "이미 그 구글 계정이 있습니다. 그 계정으로 들어가면 게스트로 쌓은 점수는 사라집니다."
          : "That Google account already exists. Signing in will discard your guest progress.") +
      '</p><button id="acSwitch">' +
      (ko ? "기존 계정으로 들어가기" : "Sign in to that account") +
      '</button><button id="acKeep">' + (ko ? "취소" : "Cancel") + '</button>';
  }
  window.__showLinkConflict = () => { openAcct(); showConflict(); };

  /* ---------- 별명 정하기 ----------
     구글로 처음 들어오면 반드시 정하고 들어간다 */
  let nameBox = null;
  function openName(){
    const ko = (window.__lang || "ko") === "ko";
    if (!nameBox){
      nameBox = document.createElement("div");
      nameBox.className = "cfg";
      nameBox.id = "nkBox";
      document.getElementById("stage").appendChild(nameBox);
    }
    nameBox.innerHTML =
      '<div class="cfg__v" data-nkclose></div><div class="cfg__p">' +
      '<div class="cfg__h"><span>' + (ko ? "별명 정하기" : "Choose a name") + '</span>' +
      '<button class="cfg__x" data-nkclose aria-label="close">\u00D7</button></div>' +
      '<div class="cfg__b">' +
      '<p class="cfg__n">' +
      (ko ? "한글 6자 또는 영문·숫자 8자까지. 다른 사람과 겹칠 수 없습니다."
          : "Up to 6 Korean or 8 Latin characters. Must be unique.") + '</p>' +
      '<input id="nkIn" maxlength="16" autocomplete="off" spellcheck="false" class="nk__in">' +
      '<p class="hint" id="nkMsg"></p>' +
      '<div class="cfg__row"><button id="nkOk">' + (ko ? "정하기" : "Save") + '</button></div>' +
      '</div></div>';
    const inp = nameBox.querySelector("#nkIn");
    if (inp){ inp.value = (window.ACCOUNT && window.ACCOUNT.name) || ""; setTimeout(() => inp.focus(), 60); }
    nameBox.classList.add("on");
  }
  function closeName(){ if (nameBox) nameBox.classList.remove("on"); }
  window.__askName = openName;

  document.addEventListener("click", async e => {
    if (e.target.closest("[data-nkclose]")){ closeName(); return; }
    if (!e.target.closest("#nkOk")) return;
    const ko = (window.__lang || "ko") === "ko";
    const inp = document.getElementById("nkIn");
    const msg = document.getElementById("nkMsg");
    const btn = document.getElementById("nkOk");
    if (!inp || !window.setNickname) return;
    btn.disabled = true;
    msg.className = "hint";
    msg.textContent = ko ? "확인하는 중" : "Checking";
    let r = null;
    try { r = await window.setNickname(inp.value); }
    catch(err){
      msg.className = "hint hint--err";
      msg.textContent = String(err && err.code || err);
      btn.disabled = false; return;
    }
    if (r && r.ok){ closeName(); btn.disabled = false; paintAcct(); return; }
    const why = r && r.why;
    msg.className = "hint hint--err";
    msg.textContent =
      why === "taken" ? (ko ? "이미 쓰는 이름입니다" : "That name is taken") :
      why === "long"  ? (ko ? "너무 깁니다. 한글 6자 또는 영문 8자까지" : "Too long") :
      why === "space" ? (ko ? "띄어쓰기는 넣을 수 없습니다" : "No spaces") :
      why === "char"  ? (ko ? "한글, 영문, 숫자만 됩니다" : "Letters and numbers only") :
                        (ko ? "이름을 넣어 주세요" : "Please enter a name");
    btn.disabled = false;
  });

  /* 상단바 사자 프로필 → 계정 창 */
  function openAcct(){
    let box = document.getElementById("acctBox");
    if (!box){
      const st = document.getElementById("stage");
      if (!st) return;
      st.insertAdjacentHTML("beforeend", ACCT_HTML);
      box = document.getElementById("acctBox");
    }
    paintAcct();
    box.classList.add("on");
  }
  function closeAcct(){
    const b = document.getElementById("acctBox");
    if (b) b.classList.remove("on");
  }
  window.__openAcct = openAcct;

  document.addEventListener("click", e => {
    if (e.target.closest("[data-acctclose]")){ closeAcct(); return; }
    if (e.target.closest("#acctProfile") || e.target.closest("[data-acctopen]")) openAcct();
    if (e.target.closest("#acName") && window.__askName) window.__askName();
  });

  document.addEventListener("click", async e => {
    if (e.target.closest("#acSwitch")){
      conflictOn = false;
      if (window.switchToGoogle) await window.switchToGoogle();
      paintAcct();
      return;
    }
    if (e.target.closest("#acKeep")){ conflictOn = false; paintAcct(); return; }
    if (e.target.closest("#acOut")){
      const ko2 = (window.__lang || "ko") === "ko";
      /* 바로 로그아웃하지 않고 한 번 물어본다. 잘못 눌러 튕기면 다시 들어와야 한다 */
      ask(ko2 ? "로그아웃" : "Sign out",
          ko2 ? "로그아웃을 하시겠습니까?" : "Sign out of this account?",
          ko2 ? "예" : "Sign out",
          async () => {
            conflictOn = false;
            try { if (window.signOutNow) await window.signOutNow(); }
            catch(err){ window.alert((ko2 ? "로그아웃에 실패했습니다\n" : "Sign out failed\n") + String(err && err.code || err)); }
            closeAcct();
            go("entry");
          });
    }
  });

  /* 게스트 → 구글 잇기 */
  document.addEventListener("click", async e => {
    if (!e.target.closest("#acLink")) return;
    const ko = (window.__lang || "ko") === "ko";
    const btn = document.getElementById("acLink");
    btn.disabled = true;
    try {
      const r = window.linkGoogle ? await window.linkGoogle() : null;
      if (r && r.already){
        window.alert(ko ? "이미 구글 계정으로 로그인해 있습니다" : "Already signed in with Google");
      } else if (r && r.redirecting){
        /* 페이지가 넘어간다. 혹시 안 넘어가도 단추가 잠긴 채 남지 않게 둔다 */
      } else if (r && r.conflict){
        showConflict();
      }
    } catch(err){
      /* 조용히 넘어가면 원인을 알 수 없다. 이유를 그대로 보여준다 */
      const code = String(err && err.code || err && err.message || err);
      window.alert((ko ? "잇기에 실패했습니다\n" : "Linking failed\n") + code);
      console.warn(err);
    }
    btn.disabled = false;
    paintAcct();
  });
  window.addEventListener("langchange", () => {
    if (document.getElementById("cfg").classList.contains("on")) openCfg();
  });
  window.setLang(window.__lang);
  
  window.__goto = id => go(id);
  window.__toTable = () => { window.__fresh = false; go("table"); };
  function go(id){
    /* 세금·혁명 화면을 보는 동안에는 다음 판이 굴러가면 안 된다.
       "판 시작"을 눌러 판 화면에 들어설 때 비로소 풀린다 */
    if (id === "tax" && window.__holdPlay) window.__holdPlay(true);
    /* 로비에 들어오는 순간 배경음악을 켠다.
       판에서는 끈다 — 효과음이 많아 겹치면 시끄럽다 */
    if (id === "lobby"){ touched = true; warm(); }   /* 소리를 미리 받아 둔다 */
    setTimeout(pushPresence, 0);
    if (touched){
      /* 로비와 랭킹에서만 배경음악. 방 대기실부터는 끈다 */
      if (id === "lobby" || id === "rank") playBgm("lobby");
      else stopBgm();
    }
    /* 화면을 보이기 전에 먼저 세운다.
       나중에 세우면 옛 내용이 한 번 보였다가 바뀐다 (인원이 8명이었다가 5명이 되는 현상) */
    if (id === "draw"  && window.__bootDraw)  window.__bootDraw();
    if (id === "table" && window.__bootTable){
      window.__bootTable(window.__fresh !== false);
      window.__fresh = false;
      /* 패 나누는 연출이 없으므로 소리도 안 낸다 (세금 화면에서는 낸다) */
    }
    if (id === "tax"   && window.__bootTax)   window.__bootTax();
    if (id === "result" && window.__bootResult) window.__bootResult();
    if (id === "rank"   && window.__bootRank)   window.__bootRank();
  
    document.querySelectorAll(".page").forEach(p => p.classList.remove("is-on"));
    document.getElementById(id).classList.add("is-on");
    window.scrollTo(0,0);
    /* 숨겨져 있는 동안은 폭이 0이라 손패 위치가 어긋난다. 보이는 순간 다시 그린다 */
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }
  document.querySelector("#entry #start").addEventListener("click", () => go("lobby"));
  
  /* 로비 → 대기실 */
  /* 빠른 참가와 번호 참가는 남의 방에 들어가는 것이라 조건을 묻지 않는다.
     방 조건은 들어간 방을 따라간다 */
  /* 빠른 참가 — 지금은 방을 하나 만들고 봇으로 채운다 */
  document.querySelector("#lobby #btQuick").addEventListener("click", async () => {
    /* 빠른 참가는 **자리 남은 방부터** 찾는다. 없으면 새로 만든다 */
    const f = window.__quickJoin || window.__createRoom;
    if (f){
      const code = await f();
      if (!code) return;
    }
    go("room");
  });
  
  /* 번호로 들어가기 */
  document.querySelector("#lobby #btJoin").addEventListener("click", async () => {
    const inp = document.querySelector("#lobby #code");
    const code = (inp && (inp.value || inp.textContent) || "").replace(/[^0-9]/g, "");
    if (code.length !== 4){ alert("네 자리 번호를 넣어 주세요"); return; }
    if (window.__joinRoom){
      const seat = await window.__joinRoom(code);
      if (seat == null) return;
    }
    go("room");
  });
  /* 방 만들기는 설정을 먼저 받는다 */
  document.querySelector("#lobby #btNew").addEventListener("click", () => openOpts("create"));
  /* 대기실 시작 → 세금·혁명 */
  document.querySelector("#room #action").addEventListener("click", e => {
    const b = e.target.closest(".btn-primary");
    if (!b || b.disabled) return;
    go("draw");                     /* 첫 판은 뽑기부터 */
  });
  /* 뽑기 완료 → 1판 시작 (첫 판은 세금 없음) */
  document.querySelector("#draw #go").addEventListener("click", e => {
    if (!e.currentTarget.disabled){ window.__fresh = true; go("table"); }
  });
  /* 한 판이 끝나면 결과 화면 */
  window.__onRoundEnd = () => go("result");
  
  /* 결과 → 다음 판 (세금을 켰으면 세금 단계를 거친다) */
  document.querySelector("#result #next").addEventListener("click", () => {
    const G = window.GAME || {};
    const rounds = (window.__opts && window.__opts.rounds) || 5;
    if ((G.roundNo || 1) >= rounds){          // 마지막 판이었으면
      if (window.__onRestart){ window.__onRestart(); return; }
      window.__fresh = true;
      go("draw");
      return;
    }
    G.roundNo = (G.roundNo || 1) + 1;
    window.__roundNo = G.roundNo;
    if (window.__opts && window.__opts.tax === false){
      window.__fresh = true;                   // 세금이 없으면 그냥 새로 나눈다
      go("table");
    } else {
      go("tax");
    }
  });
  document.querySelector("#result #quit").addEventListener("click", () => go("lobby"));
  window.__toResult = () => go("result");
  
  /* 세금까지 마치면 그 손패 그대로 다음 판을 시작한다 */
  document.querySelector("#tax #next").addEventListener("click", e => {
    const label = e.currentTarget.textContent.trim();
    if (label === "판 시작" || label === "Start round"){
      window.__fresh = false;
      setTimeout(() => go("table"), 140);
    }
  });
  /* ---------- 확인창 ---------- */
  const ASK_T = {
    ko: { quit: "게임 종료", quitM: "게임을 종료할까요?", yes: "종료", no: "취소",
          leave: "판에서 나가기", leaveM: "나가면 완주 실패로 기록됩니다",
          leaveY: "나가기", room: "방 나가기", roomM: "방에서 나갈까요?" },
    en: { quit: "Quit", quitM: "Close the game?", yes: "Quit", no: "Cancel",
          leave: "Leave the game", leaveM: "Leaving counts as a forfeit",
          leaveY: "Leave", room: "Leave room", roomM: "Leave this room?" },
  };
  let askYes = null;
  function ask(title, msg, yesLabel, onYes){
    const t = ASK_T[window.__lang] || ASK_T.ko;
    /* 확인창을 안 심은 화면(검사 등)에서는 묻지 않고 바로 한다 */
    if (!document.getElementById("askT")){ if (onYes) onYes(); return; }
    document.getElementById("askT").textContent = title;
    document.getElementById("askM").textContent = msg;
    document.getElementById("askYes").textContent = yesLabel;
    document.getElementById("askNo").textContent = t.no;
    askYes = onYes;
    document.getElementById("ask").classList.add("on");
  }
  /* 얼굴 누르기 */
  document.addEventListener("click", async e => {
    const b = e.target.closest("[data-avt]");
    if (!b) return;
    const i = Number(b.dataset.avt);
    const ko = (window.__lang || "ko") === "ko";
    const need = i < AVT_FREE ? 0 : (i - AVT_FREE + 1) * 5000;
    const score = (window.ACCOUNT || {}).score || 0;
    if (score < need) return;      /* 필요한 점수는 자물쇠 밑에 이미 적혀 있다 */
    if (window.__setAvatar) await window.__setAvatar(i);
    paintAvatars();
  });

  function askClose(){
    document.getElementById("ask").classList.remove("on");
    askYes = null;
  }
  function askOpen(){ return document.getElementById("ask").classList.contains("on"); }
  document.addEventListener("click", e => {
    if (e.target.closest("[data-askno]")){ askClose(); return; }
    if (e.target.closest("#askYes")){
      const f = askYes; askClose(); if (f) f();
    }
  });

  /* ---------- 폰 하단바 뒤로가기 ----------

     웹에서는 브라우저 뒤로가기(popstate), 안드로이드 껍데기에서는
     Capacitor 의 backButton 이 같은 곳으로 들어온다.
     아무것도 안 걸어 두면 뒤로가기 한 번에 앱 밖으로 나가 버린다.

     열려 있는 창이 있으면 그것부터 닫고, 그다음이 화면별 규칙이다 */
  function onBack(){
    if (askOpen()){ askClose(); return; }
    /* 설정·계정·별명 창이 열려 있으면 그것만 닫는다 */
    const box = document.querySelector(".cfg.on");
    if (box){ box.classList.remove("on"); return; }

    const now = (document.querySelector(".page.is-on") || {}).id || "entry";
    const t = ASK_T[window.__lang] || ASK_T.ko;

    if (now === "lobby" || now === "entry"){
      ask(t.quit, t.quitM, t.yes, quitApp);
      return;
    }
    if (now === "rank"){ go("lobby"); return; }
    if (now === "room"){
      ask(t.room, t.roomM, t.roomY || t.leaveY, () => {
        if (window.__quitGame) window.__quitGame();
        go("lobby");
      });
      return;
    }
    if (now === "table" || now === "tax"){
      ask(t.leave, t.leaveM, t.leaveY, () => {
        if (window.__quitGame) window.__quitGame();
        go("lobby");
      });
      return;
    }
    /* 뽑기·판 결과·최종 결과는 저절로 넘어가는 화면이라 막는다 */
  }
  window.__back = onBack;

  /* 앱 종료. 안드로이드 껍데기에서만 진짜로 꺼진다 —
     웹(브라우저 탭)에서는 끌 방법이 없어 아무 일도 안 일어난다 */
  function quitApp(){
    const cap = window.Capacitor;
    if (cap && cap.Plugins && cap.Plugins.App && cap.Plugins.App.exitApp){
      cap.Plugins.App.exitApp();
      return;
    }
    try { window.close(); } catch(e){}
  }

  /* 브라우저 뒤로가기를 붙잡는다.
     한 칸을 미리 쌓아 두고, 뒤로 갈 때마다 다시 쌓아 앱 밖으로 못 나가게 한다 */
  try {
    history.pushState({ zoo: 1 }, "");
    window.addEventListener("popstate", () => {
      history.pushState({ zoo: 1 }, "");
      onBack();
    });
  } catch(e){}

  /* 안드로이드 껍데기 */
  try {
    const cap = window.Capacitor;
    if (cap && cap.Plugins && cap.Plugins.App && cap.Plugins.App.addListener)
      cap.Plugins.App.addListener("backButton", () => onBack());
  } catch(e){}

  /* 뒤로가기. 게임 도중에 나가면 완주 실패로 기록한다 */
  /* 나중에 그려지는 화면(랭킹 등)도 걸리도록 문서 전체에서 받는다 */
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-back]");
    if (!b) return;
    if (b.closest("#table") && window.__quitGame) window.__quitGame();
    go(b.dataset.back);
  });
  
}
