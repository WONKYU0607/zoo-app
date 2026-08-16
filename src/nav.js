import "./styles/base.css";
import "./state.js";

export const GEAR = "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"><path d=\"M3.5 7h9M17 7h3.5M3.5 12h4M12 12h8.5M3.5 17h8M15.5 17h5\"/><circle cx=\"14.6\" cy=\"7\" r=\"2.1\"/><circle cx=\"9.6\" cy=\"12\" r=\"2.1\"/><circle cx=\"13.2\" cy=\"17\" r=\"2.1\"/></svg>";
export const OPT_HTML = "<div class=\"opts\" id=\"opts\" role=\"dialog\" aria-modal=\"true\"><div class=\"opts__v\" data-optclose></div><div class=\"opts__p\"><div class=\"opts__h\"><span id=\"optT\"></span><button class=\"opts__x\" data-optclose aria-label=\"close\">×</button></div><div class=\"opts__b\" id=\"optBody\"></div><div class=\"opts__f\"><button class=\"opts__go\" id=\"optGo\"></button></div></div></div>";
export const CFG_HTML = "<div class=\"cfg\" id=\"cfg\" role=\"dialog\" aria-modal=\"true\"><div class=\"cfg__v\" data-cfgclose></div><div class=\"cfg__p\"><div class=\"cfg__h\"><span id=\"cfgT\"></span><button class=\"cfg__x\" data-cfgclose aria-label=\"close\">×</button></div><div class=\"cfg__b\"><div class=\"cfg__l\" id=\"cfgLangL\"></div><div class=\"cfg__row\"><button data-l=\"ko\">한국어</button><button data-l=\"en\">English</button></div><p class=\"cfg__n\" id=\"cfgNote\"></p></div></div></div>";

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
    if (e.target.closest("[data-cfgopen]")) openCfg();
    if (e.target.closest("[data-cfgclose]")) document.getElementById("cfg").classList.remove("on");
  });
  
  /* ---------- 방 설정 (로비의 방 만들기 / 대기실의 변경) ---------- */
  window.__opts = window.__opts || {cap: 6, rounds: 5, tax: true, clear2: false};
  let optMode = "create";
  const OPT_T = {
    ko:{ create:"방 만들기", edit:"방 설정", goCreate:"방 만들기", goEdit:"확인",
         cap:["방 인원","4명 \u2013 8명"],
         rnd:["플레이 판 수 설정","최소 3판부터 시작"],
         tax:["세금과 혁명","등수에 따라 카드를 교환하고, 조커 두 장으로 순위를 뒤집는 규칙입니다."],
         cut:["2번 컷","2번 카드를 내면 바닥을 비우고 다시 선을 잡습니다."], unit:"판" },
    en:{ create:"Create a room", edit:"Room settings", goCreate:"Create room", goEdit:"Done",
         cap:["Table size","4 \u2013 8 players"],
         rnd:["Number of rounds","Three at least"],
         tax:["Tax and revolution","Cards change hands by standing, and two jokers overturn it."],
         cut:["Two-cut","Playing a 2 clears the pile and you lead again."], unit:"" }
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
      optRow(t.cut, optSw("cut", o.clear2));
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
    document.getElementById("cfgNote").textContent = t.note;
    document.getElementById("cfg").classList.add("on");
  }
  window.addEventListener("langchange", () => {
    if (document.getElementById("cfg").classList.contains("on")) openCfg();
  });
  window.setLang(window.__lang);
  
  window.__goto = id => go(id);
  window.__toTable = () => { window.__fresh = false; go("table"); };
  function go(id){
    /* 화면을 보이기 전에 먼저 세운다.
       나중에 세우면 옛 내용이 한 번 보였다가 바뀐다 (인원이 8명이었다가 5명이 되는 현상) */
    if (id === "draw"  && window.__bootDraw)  window.__bootDraw();
    if (id === "table" && window.__bootTable){
      window.__bootTable(window.__fresh !== false);
      window.__fresh = false;
    }
    if (id === "tax"   && window.__bootTax)   window.__bootTax();
    if (id === "result" && window.__bootResult) window.__bootResult();
  
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
    if (window.__createRoom){
      const code = await window.__createRoom();
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
  document.querySelector("#table #endRound").addEventListener("click", () => {
    if (window.__forceEnd) window.__forceEnd();
  });
  
  /* 결과 → 다음 판 (세금을 켰으면 세금 단계를 거친다) */
  document.querySelector("#result #next").addEventListener("click", () => {
    const G = window.GAME || {};
    const rounds = (window.__opts && window.__opts.rounds) || 5;
    if ((G.roundNo || 1) >= rounds){          // 마지막 판이었으면 처음부터
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
  /* 뒤로가기. 게임 도중에 나가면 완주 실패로 기록한다 */
  document.querySelectorAll("[data-back]").forEach(b =>
    b.addEventListener("click", () => {
      if (b.closest("#table") && window.__quitGame) window.__quitGame();
      go(b.dataset.back);
    }));
  
}
