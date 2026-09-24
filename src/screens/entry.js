import { scoped } from "../lib/scoped.js";
import { HERO as A_HERO } from "../lib/assets.js";
import "../styles/entry.css";
import { TERMS, PRIVACY } from "../lib/legal.js";

export function mount(root){
  const document = scoped(root);
  
  const IMG = A_HERO;
  /* 배경에 사자 왕이 있어서 부채꼴에서는 사자를 뺐다 */
  const FAN = [
    {key:"10", num:"10", ko:"토끼",   en:"RABBIT"},
    {key:"joker_a", joker:true, ko:"카멜레온", en:"CHAMELEON"},
    {key:"02", num:"2",  ko:"호랑이", en:"TIGER"},
    {key:"05", num:"5",  ko:"악어",   en:"CROCODILE"},
    {key:"04", num:"4",  ko:"코끼리", en:"ELEPHANT"}
  ];
  const T = {
    ko:{eyebrow:"ZOO PRESIDENT", wordmark:"동물의 왕국", sub:"계급 카드게임",
        start:"구글로 시작하기", starting:"들어가는 중", enter:"게임 시작",
        guest:"게스트로 시작하기",
        hintIn:"구글로 로그인하면 랭킹에 오릅니다", hintErr:"로그인에 실패했습니다. 다시 시도해 주세요", hintNet:"인터넷 연결을 확인해 주세요",
        agTerms:"[필수] 이용약관에 동의합니다", agPriv:"[필수] 개인정보처리방침에 동의합니다",
        agView:"보기", agGo:"동의하고 시작하기", agClose:"닫기"},
    en:{eyebrow:"CARD CLASH", wordmark:"Zoo President", sub:"Climbing card game",
        start:"Continue with Google", starting:"Signing in", enter:"Start game",
        guest:"Play as guest",
        hintIn:"Sign in with Google to appear on the leaderboard", hintErr:"Sign-in failed. Please try again", hintNet:"Check your internet connection",
        agTerms:"[Required] I agree to the Terms of Service", agPriv:"[Required] I agree to the Privacy Policy",
        agView:"View", agGo:"Agree and start", agClose:"Close"}
  };
  let lang = window.__lang || "ko";
  
  const fan = document.getElementById("fan");
  function renderFan(){
    fan.innerHTML = "";
    FAN.forEach((c, i) => {
      const d = document.createElement("div");
      d.className = "card" + (c.joker ? " is-joker" : "");
      d.dataset.i = i;
      d.innerHTML = c.joker
        ? '<div class="card__band"><span class="card__name">' + c[lang] + '</span></div>' +
          '<div class="card__art"><img src="' + IMG[c.key] + '" alt=""></div>' +
          '<div class="card__band"><span class="card__mark">JOKER</span></div>'
        : '<div class="card__band">' +
            '<span class="card__num">' + c.num + '</span>' +
            '<span class="card__name">' + c[lang] + '</span>' +
            '<span class="card__num">' + c.num + '</span>' +
          '</div>' +
          '<div class="card__art"><img src="' + IMG[c.key] + '" alt=""></div>' +
          '<div class="card__band">' +
            '<span class="card__num">' + c.num + '</span>' +
            '<span class="card__num">' + c.num + '</span>' +
          '</div>';
      fan.appendChild(d);
    });
  }
  
  function apply(){
    const t = T[lang];
    document.body.dataset.lang = lang;
    document.documentElement.lang = lang;
    document.getElementById("eyebrow").textContent = t.eyebrow;
    document.getElementById("wordmark").textContent = t.wordmark;
    document.getElementById("sub").textContent = t.sub;
    document.getElementById("start").textContent = t.start;
    const g = document.getElementById("testin");
    if (g) g.textContent = t.guest;
    renderFan();
  }
  apply();
  
  document.querySelectorAll("#lang button").forEach(b => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document.querySelectorAll("#lang button").forEach(x =>
        x.setAttribute("aria-pressed", String(x === b)));
      apply();
    });
  });
  
  window.addEventListener("langchange", () => { lang = window.__lang; apply(); });
  
  /* ---------- 로그인 벽 ---------- */
  let busy = false;
  function paintEntry(){
    const t = T[lang];
    const a = window.ACCOUNT;
    const b = document.getElementById("start");
    const hint = document.getElementById("hint");
    if (!b) return;
    if (busy){ b.textContent = t.starting; b.disabled = true; hint.textContent = ""; return; }
    b.disabled = false;
    if (a && a.signedIn){
      b.textContent = t.enter;
      hint.textContent = a.name || "";
      hint.className = "hint";
    } else {
      b.textContent = t.start;
      if (hint.className !== "hint hint--err"){ hint.textContent = t.hintIn; }
    }
  }
  /* ---------- 처음 켤 때 받는 동의 ----------

     이용약관과 개인정보처리방침에 동의해야 로그인 단추가 보인다.
     한 번 동의하면 다시 묻지 않는다(기기에 적어 둔다).
     글이 바뀌면 `AGREE_VER` 를 올려서 다시 받는다.

     화면은 여기서 만들어 넣는다 — 마크업 파일에 넣으면 따옴표가 겹겹이라 손대기 나쁘다 */
  const AGREE_KEY = "zk_agree";
  const AGREE_VER = 1;
  /* 기기에 저장이 막힌 곳이 있다(시크릿 모드, 저장 차단, 일부 껍데기 브라우저).
     거기서는 적어 둬도 다시 읽을 수 없어서, 동의를 눌러도 **화면이 영영 안 넘어갔다.**
     그래서 이번 한 번만이라도 통하도록 **기억해 두는 값**을 따로 둔다 */
  let agreedNow = false;
  const agreed = () => {
    if (agreedNow) return true;
    try { return Number(localStorage.getItem(AGREE_KEY)) >= AGREE_VER; } catch(e){ return false; }
  };
  const setAgreed = () => {
    agreedNow = true;
    try { localStorage.setItem(AGREE_KEY, String(AGREE_VER)); } catch(e){}
  };

  /* 약관 글 보여 주는 창 */
  function showDoc(doc){
    const t = T[lang];
    let box = document.getElementById("docBox");
    if (!box){
      box = window.document.createElement("div");
      box.id = "docBox";
      box.className = "doc";
      box.innerHTML =
        '<div class="doc__veil"></div>' +
        '<div class="doc__panel">' +
          '<div class="doc__head"><span class="doc__title"></span>' +
          '<button class="doc__x"></button></div>' +
          '<pre class="doc__body"></pre>' +
        '</div>';
      root.appendChild(box);
      const close = () => { box.hidden = true; };
      box.querySelector(".doc__veil").addEventListener("click", close);
      box.querySelector(".doc__x").addEventListener("click", close);
    }
    box.querySelector(".doc__title").textContent = doc[lang].title;
    box.querySelector(".doc__body").textContent = doc[lang].body;
    box.querySelector(".doc__x").textContent = t.agClose;
    box.hidden = false;
  }

  let gate = null;
  function buildGate(){
    if (gate) return gate;
    gate = window.document.createElement("div");
    gate.className = "agree";
    gate.innerHTML =
      '<div class="agree__r"><label><input type="checkbox" id="agTerms">' +
      '<span id="agTermsT"></span></label><button class="agree__v" id="agTermsV"></button></div>' +
      '<div class="agree__r"><label><input type="checkbox" id="agPriv">' +
      '<span id="agPrivT"></span></label><button class="agree__v" id="agPrivV"></button></div>' +
      '<button class="btn" id="agGo" disabled></button>';
    const startBtn = document.getElementById("start");
    startBtn.parentNode.insertBefore(gate, startBtn);

    const go = gate.querySelector("#agGo");
    const boxes = [gate.querySelector("#agTerms"), gate.querySelector("#agPriv")];
    const refresh = () => { go.disabled = !boxes.every(b => b.checked); };
    boxes.forEach(b => b.addEventListener("change", refresh));
    gate.querySelector("#agTermsV").addEventListener("click", () => showDoc(TERMS));
    gate.querySelector("#agPrivV").addEventListener("click", () => showDoc(PRIVACY));
    go.addEventListener("click", async () => {
      setAgreed();
      paintGate();
      /* 광고 개인화 동의는 구글이 주는 정식 창으로 따로 받는다(유럽 등) */
      try {
        const { askAdConsent } = await import("../lib/ads.js");
        await askAdConsent();
      } catch(e){}
    });
    return gate;
  }

  /* 동의 전에는 로그인 단추를 감춘다 */
  function paintGate(){
    const need = !agreed();
    if (need) buildGate();
    if (gate){
      gate.hidden = !need;
      const t = T[lang];
      gate.querySelector("#agTermsT").textContent = t.agTerms;
      gate.querySelector("#agPrivT").textContent = t.agPriv;
      gate.querySelector("#agTermsV").textContent = t.agView;
      gate.querySelector("#agPrivV").textContent = t.agView;
      gate.querySelector("#agGo").textContent = t.agGo;
    }
    const st = document.getElementById("start");
    const gb = document.getElementById("testin");
    if (st) st.hidden = need;
    if (gb && need) gb.hidden = true;
    const hint = document.getElementById("hint");
    if (hint && need) hint.textContent = "";
    /* 동의가 끝나면 **로그인 화면을 그 자리에서 다시 그린다.**
       안 그리면 게스트 단추와 안내 문구가 다음 신호가 올 때까지 안 나온다 */
    if (!need){
      try { paintEntry(); } catch(e){}
      try { showTest(); } catch(e){}
    }
  }
  window.__agreeNeeded = () => !agreed();     /* 화면 그릴 때 참고 */
  paintGate();
  window.addEventListener("langchange", paintGate);

  document.getElementById("start").addEventListener("click", async e => {
    const a = window.ACCOUNT;
    if (a && a.signedIn) return;              /* 이미 로그인했으면 통과 */
    e.stopImmediatePropagation();
    const hint = document.getElementById("hint");
    busy = true; paintEntry();
    try {
      await window.signInGoogle();
      hint.className = "hint";
    } catch(err){
      hint.className = "hint hint--err";
      /* 이유를 그대로 보여준다. 조용히 넘어가면 원인을 알 수 없다 */
      const code = String(err && err.code || "");
      hint.textContent = (navigator.onLine ? T[lang].hintErr : T[lang].hintNet) +
                         (code ? " (" + code + ")" : "");
      console.warn(err);
    }
    busy = false; paintEntry();
  }, true);
  /* 게스트로 시작 — 구글 계정 없이 바로 논다.
     점수·티켓은 같지만 랭킹에는 안 오른다. 나중에 구글로 이으면 그대로 따라온다 */
  const tb = document.getElementById("testin");
  if (tb){
    tb.addEventListener("click", async e => {
      e.stopImmediatePropagation();
      busy = true; paintEntry();
      try { await window.signInGuest(); }
      catch(err){
        const hint = document.getElementById("hint");
        hint.className = "hint hint--err";
        hint.textContent = String(err && err.code || err && err.message || err).slice(0, 60);
        console.warn(err);
      }
      busy = false; paintEntry();
    }, true);
  }
  function showTest(){
    if (!tb) return;
    const a = window.ACCOUNT;
    tb.textContent = T[lang].guest;
    /* 동의 전에는 게스트 단추도 안 보인다 */
    tb.hidden = Boolean(a && a.signedIn) || (window.__agreeNeeded && window.__agreeNeeded());
  }
  window.addEventListener("accountready", showTest);
  window.addEventListener("accountchange", showTest);
  setTimeout(showTest, 300);
  
  window.addEventListener("accountready", paintEntry);
  window.addEventListener("accountchange", paintEntry);
  window.addEventListener("langchange", paintEntry);
  paintEntry();
  
}
