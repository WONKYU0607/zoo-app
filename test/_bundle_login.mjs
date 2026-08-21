// src/lib/scoped.js
function scoped(root) {
  return {
    getElementById: (id) => root.querySelector('[id="' + id + '"]'),
    querySelector: (s) => root.querySelector(s),
    querySelectorAll: (s) => root.querySelectorAll(s),
    createElement: (t) => window.document.createElement(t),
    get body() {
      return window.document.body;
    },
    get documentElement() {
      return window.document.documentElement;
    },
    addEventListener: (...a) => window.document.addEventListener(...a)
  };
}

// src/lib/assets.js
var HERO = { "02": "assets/hero_02.webp", "04": "assets/hero_04.webp", "05": "assets/hero_05.webp", "10": "assets/hero_10.webp", "joker_a": "assets/hero_joker_a.webp" };

// src/screens/entry.js
function mount(root) {
  const document2 = scoped(root);
  const IMG = HERO;
  const FAN = [
    { key: "10", num: "10", ko: "\uD1A0\uB07C", en: "RABBIT" },
    { key: "joker_a", joker: true, ko: "\uCE74\uBA5C\uB808\uC628", en: "CHAMELEON" },
    { key: "02", num: "2", ko: "\uD638\uB791\uC774", en: "TIGER" },
    { key: "05", num: "5", ko: "\uC545\uC5B4", en: "CROCODILE" },
    { key: "04", num: "4", ko: "\uCF54\uB07C\uB9AC", en: "ELEPHANT" }
  ];
  const T = {
    ko: {
      eyebrow: "ZOO PRESIDENT",
      wordmark: "\uB3D9\uBB3C\uC758 \uC655\uAD6D",
      sub: "\uACC4\uAE09 \uCE74\uB4DC\uAC8C\uC784",
      start: "\uAD6C\uAE00\uB85C \uC2DC\uC791\uD558\uAE30",
      starting: "\uB4E4\uC5B4\uAC00\uB294 \uC911",
      enter: "\uAC8C\uC784 \uC2DC\uC791",
      guest: "\uAC8C\uC2A4\uD2B8\uB85C \uC2DC\uC791\uD558\uAE30",
      hintIn: "\uAD6C\uAE00\uB85C \uB85C\uADF8\uC778\uD558\uBA74 \uB7AD\uD0B9\uC5D0 \uC624\uB985\uB2C8\uB2E4",
      hintErr: "\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694",
      hintNet: "\uC778\uD130\uB137 \uC5F0\uACB0\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694"
    },
    en: {
      eyebrow: "CARD CLASH",
      wordmark: "Zoo President",
      sub: "Climbing card game",
      start: "Continue with Google",
      starting: "Signing in",
      enter: "Start game",
      guest: "Play as guest",
      hintIn: "Sign in with Google to appear on the leaderboard",
      hintErr: "Sign-in failed. Please try again",
      hintNet: "Check your internet connection"
    }
  };
  let lang = window.__lang || "ko";
  const fan = document2.getElementById("fan");
  function renderFan() {
    fan.innerHTML = "";
    FAN.forEach((c, i) => {
      const d = document2.createElement("div");
      d.className = "card" + (c.joker ? " is-joker" : "");
      d.dataset.i = i;
      d.innerHTML = c.joker ? '<div class="card__band"><span class="card__name">' + c[lang] + '</span></div><div class="card__art"><img src="' + IMG[c.key] + '" alt=""></div><div class="card__band"><span class="card__mark">JOKER</span></div>' : '<div class="card__band"><span class="card__num">' + c.num + '</span><span class="card__name">' + c[lang] + '</span><span class="card__num">' + c.num + '</span></div><div class="card__art"><img src="' + IMG[c.key] + '" alt=""></div><div class="card__band"><span class="card__num">' + c.num + '</span><span class="card__num">' + c.num + "</span></div>";
      fan.appendChild(d);
    });
  }
  function apply() {
    const t = T[lang];
    document2.body.dataset.lang = lang;
    document2.documentElement.lang = lang;
    document2.getElementById("eyebrow").textContent = t.eyebrow;
    document2.getElementById("wordmark").textContent = t.wordmark;
    document2.getElementById("sub").textContent = t.sub;
    document2.getElementById("start").textContent = t.start;
    const g = document2.getElementById("testin");
    if (g) g.textContent = t.guest;
    renderFan();
  }
  apply();
  document2.querySelectorAll("#lang button").forEach((b) => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document2.querySelectorAll("#lang button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      apply();
    });
  });
  window.addEventListener("langchange", () => {
    lang = window.__lang;
    apply();
  });
  let busy = false;
  function paintEntry() {
    const t = T[lang];
    const a = window.ACCOUNT;
    const b = document2.getElementById("start");
    const hint = document2.getElementById("hint");
    if (!b) return;
    if (busy) {
      b.textContent = t.starting;
      b.disabled = true;
      hint.textContent = "";
      return;
    }
    b.disabled = false;
    if (a && a.signedIn) {
      b.textContent = t.enter;
      hint.textContent = a.name || "";
      hint.className = "hint";
    } else {
      b.textContent = t.start;
      if (hint.className !== "hint hint--err") {
        hint.textContent = t.hintIn;
      }
    }
  }
  document2.getElementById("start").addEventListener("click", async (e) => {
    const a = window.ACCOUNT;
    if (a && a.signedIn) return;
    e.stopImmediatePropagation();
    const hint = document2.getElementById("hint");
    busy = true;
    paintEntry();
    try {
      await window.signInGoogle();
      hint.className = "hint";
    } catch (err) {
      hint.className = "hint hint--err";
      const code = String(err && err.code || "");
      hint.textContent = (navigator.onLine ? T[lang].hintErr : T[lang].hintNet) + (code ? " (" + code + ")" : "");
      console.warn(err);
    }
    busy = false;
    paintEntry();
  }, true);
  const tb = document2.getElementById("testin");
  if (tb) {
    tb.addEventListener("click", async (e) => {
      e.stopImmediatePropagation();
      busy = true;
      paintEntry();
      try {
        await window.signInGuest();
      } catch (err) {
        const hint = document2.getElementById("hint");
        hint.className = "hint hint--err";
        hint.textContent = String(err && err.code || err && err.message || err).slice(0, 60);
        console.warn(err);
      }
      busy = false;
      paintEntry();
    }, true);
  }
  function showTest() {
    if (!tb) return;
    const a = window.ACCOUNT;
    tb.textContent = T[lang].guest;
    tb.hidden = Boolean(a && a.signedIn);
  }
  window.addEventListener("accountready", showTest);
  window.addEventListener("accountchange", showTest);
  setTimeout(showTest, 300);
  window.addEventListener("accountready", paintEntry);
  window.addEventListener("accountchange", paintEntry);
  window.addEventListener("langchange", paintEntry);
  paintEntry();
}

// src/state.js
var opts = { cap: 4, rounds: 3, tax: true, clear2: false, seated: 0 };
var game = {
  N: 6,
  roundNo: 1,
  names: [],
  namesEn: [],
  hold: null,
  /* 자리별 손패 */
  order: null,
  /* 이번 판 순서 (앞이 선) */
  finish: null,
  /* 지난 판 완주 순서 */
  score: []
};
if (typeof window !== "undefined") {
  window.__opts = opts;
  window.GAME = game;
}

// src/nav.js
var GEAR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3.5 7h9M17 7h3.5M3.5 12h4M12 12h8.5M3.5 17h8M15.5 17h5"/><circle cx="14.6" cy="7" r="2.1"/><circle cx="9.6" cy="12" r="2.1"/><circle cx="13.2" cy="17" r="2.1"/></svg>';
var OPT_HTML = '<div class="opts" id="opts" role="dialog" aria-modal="true"><div class="opts__v" data-optclose></div><div class="opts__p"><div class="opts__h"><span id="optT"></span><button class="opts__x" data-optclose aria-label="close">\xD7</button></div><div class="opts__b" id="optBody"></div><div class="opts__f"><button class="opts__go" id="optGo"></button></div></div></div>';
var PENCIL = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z"/></svg>';
var ACCT_HTML = '<div class="cfg" id="acctBox" role="dialog" aria-modal="true"><div class="cfg__v" data-acctclose></div><div class="cfg__p"><div class="cfg__h"><span id="acBoxT"></span><button class="cfg__x" data-acctclose aria-label="close">\xD7</button></div><div class="cfg__b"><div class="ac__name"><span id="acNick"></span><button id="acName" class="ac__edit" aria-label="rename"></button></div><p class="cfg__n" id="acLine"></p><div class="cfg__row" id="acLinkRow" hidden><button id="acLink"></button></div><div class="cfg__row"><button id="acOut"></button></div></div></div></div>';
var CFG_HTML = '<div class="cfg" id="cfg" role="dialog" aria-modal="true"><div class="cfg__v" data-cfgclose></div><div class="cfg__p"><div class="cfg__h"><span id="cfgT"></span><button class="cfg__x" data-cfgclose aria-label="close">\xD7</button></div><div class="cfg__b"><div class="cfg__l" id="cfgLangL"></div><div class="cfg__row"><button data-l="ko">\uD55C\uAD6D\uC5B4</button><button data-l="en">English</button></div><p class="cfg__n" id="cfgNote"></p></div></div></div>';
function initNav() {
  window.__lang = function() {
    try {
      const v = localStorage.getItem("zk_lang");
      if (v === "ko" || v === "en") return v;
    } catch (e) {
    }
    const n = (navigator.language || navigator.userLanguage || "ko").toLowerCase();
    return n.indexOf("ko") === 0 ? "ko" : "en";
  }();
  window.setLang = (l) => {
    window.__lang = l;
    try {
      localStorage.setItem("zk_lang", l);
    } catch (e) {
    }
    document.documentElement.lang = l;
    document.querySelectorAll("[data-l]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === l)));
    window.dispatchEvent(new Event("langchange"));
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-l]");
    if (b) window.setLang(b.dataset.l);
    if (e.target.closest("[data-rankopen]")) go("rank");
    if (e.target.closest("[data-cfgopen]")) openCfg();
    if (e.target.closest("[data-cfgclose]")) document.getElementById("cfg").classList.remove("on");
  });
  window.__opts = window.__opts || { cap: 4, rounds: 3, tax: true, clear2: false };
  let optMode = "create";
  const OPT_T = {
    ko: {
      create: "\uBC29 \uB9CC\uB4E4\uAE30",
      edit: "\uBC29 \uC124\uC815",
      goCreate: "\uBC29 \uB9CC\uB4E4\uAE30",
      goEdit: "\uD655\uC778",
      cap: ["\uBC29 \uC778\uC6D0", "4\uBA85 \u2013 8\uBA85"],
      rnd: ["\uD50C\uB808\uC774 \uD310 \uC218 \uC124\uC815", "\uCD5C\uC18C 3\uD310\uBD80\uD130 \uC2DC\uC791"],
      tax: ["\uC138\uAE08\uACFC \uD601\uBA85", "\uB4F1\uC218\uC5D0 \uB530\uB77C \uCE74\uB4DC\uB97C \uAD50\uD658\uD558\uACE0, \uC870\uCEE4 \uB450 \uC7A5\uC73C\uB85C \uC21C\uC704\uB97C \uB4A4\uC9D1\uB294 \uADDC\uCE59\uC785\uB2C8\uB2E4."],
      cut: ["2\uBC88 \uCEF7", "2\uBC88 \uCE74\uB4DC\uB97C \uB0B4\uBA74 \uBC14\uB2E5\uC744 \uBE44\uC6B0\uACE0 \uB2E4\uC2DC \uC120\uC744 \uC7A1\uC2B5\uB2C8\uB2E4."],
      unit: "\uD310"
    },
    en: {
      create: "Create a room",
      edit: "Room settings",
      goCreate: "Create room",
      goEdit: "Done",
      cap: ["Table size", "4 \u2013 8 players"],
      rnd: ["Number of rounds", "Three at least"],
      tax: ["Tax and revolution", "Cards change hands by standing, and two jokers overturn it."],
      cut: ["Two-cut", "Playing a 2 clears the pile and you lead again."],
      unit: ""
    }
  };
  function optRow(pair, right) {
    return '<div class="mk__row"><div><div class="mk__t">' + pair[0] + '</div><div class="mk__d">' + pair[1] + "</div></div>" + right + "</div>";
  }
  function optStep(k, v, lo, hi, unit) {
    return '<div class="mk__st"><button data-opt="' + k + '-"' + (v <= lo ? " disabled" : "") + ">\u2212</button><span>" + v + (unit || "") + '</span><button data-opt="' + k + '+"' + (v >= hi ? " disabled" : "") + ">+</button></div>";
  }
  function optSw(k, on) {
    return '<button class="mk__sw" data-opt="' + k + '" role="switch" aria-checked="' + on + '"></button>';
  }
  function optRender() {
    const t = OPT_T[window.__lang] || OPT_T.ko, o = window.__opts;
    const mk = optMode === "create";
    document.getElementById("optT").textContent = mk ? t.create : t.edit;
    document.getElementById("optGo").textContent = mk ? t.goCreate : t.goEdit;
    document.getElementById("optBody").innerHTML = optRow(t.cap, optStep("cap", o.cap, 4, 8)) + optRow(t.rnd, optStep("rnd", o.rounds, 3, 99, t.unit)) + optRow(t.tax, optSw("tax", o.tax)) + optRow(t.cut, optSw("cut", o.clear2));
  }
  function openOpts(mode) {
    optMode = mode;
    optRender();
    document.getElementById("opts").classList.add("on");
  }
  document.addEventListener("click", (e) => {
    const k = e.target.closest("[data-opt]");
    if (k) {
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
    if (optMode === "create") {
      if (window.__createRoom) {
        window.__createRoom().then((code) => {
          if (code) go("room");
        });
      } else setTimeout(() => go("room"), 80);
    } else {
      window.dispatchEvent(new Event("optschange"));
      if (window.__saveOpts) window.__saveOpts();
    }
  });
  window.addEventListener("langchange", () => {
    if (document.getElementById("opts").classList.contains("on")) optRender();
  });
  const CFG_T = {
    ko: {
      title: "\uC124\uC815",
      lang: "\uC5B8\uC5B4",
      note: "\uCC98\uC74C \uB4E4\uC5B4\uC624\uBA74 \uAE30\uAE30 \uC5B8\uC5B4\uC5D0 \uB9DE\uCDB0 \uC790\uB3D9\uC73C\uB85C \uC815\uD574\uC9D1\uB2C8\uB2E4. \uC5EC\uAE30\uC11C \uBC14\uAFB8\uBA74 \uADF8 \uC120\uD0DD\uC744 \uAE30\uC5B5\uD569\uB2C8\uB2E4."
    },
    en: {
      title: "Settings",
      lang: "LANGUAGE",
      note: "The game picks your device language on first visit. Changing it here is remembered."
    }
  };
  function openCfg() {
    const t = CFG_T[window.__lang] || CFG_T.ko;
    document.getElementById("cfgT").textContent = t.title;
    document.getElementById("cfgLangL").textContent = t.lang;
    document.getElementById("cfgNote").textContent = "";
    document.getElementById("cfg").classList.add("on");
  }
  function paintAcct() {
    const ko = (window.__lang || "ko") === "ko";
    const a = window.ACCOUNT;
    const lab = document.getElementById("acBoxT");
    const line = document.getElementById("acLine");
    const row = document.getElementById("acLinkRow");
    let btn = document.getElementById("acLink");
    if (!lab || !line || !row) return;
    if (conflictOn) return;
    if (!row.querySelector("#acLink")) {
      row.innerHTML = '<button id="acLink"></button>';
      btn = document.getElementById("acLink");
    }
    if (!btn) return;
    lab.textContent = ko ? "\uACC4\uC815" : "Account";
    if (!a || !a.signedIn) {
      line.hidden = false;
      line.textContent = ko ? "\uB85C\uADF8\uC778\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4" : "Not signed in";
      row.hidden = true;
      return;
    }
    if (a.guest) {
      line.hidden = false;
      line.textContent = ko ? "\uAC8C\uC2A4\uD2B8 \xB7 \uB7AD\uD0B9\uC5D0 \uC624\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4" : "Guest \xB7 not on the leaderboard";
      btn.textContent = ko ? "\uAD6C\uAE00 \uACC4\uC815 \uC787\uAE30" : "Link Google account";
      row.hidden = false;
    } else {
      line.textContent = "";
      line.hidden = true;
      row.hidden = true;
    }
    const nick = document.getElementById("acNick");
    const pen = document.getElementById("acName");
    if (nick) nick.textContent = a.name || (ko ? "\uC774\uB984\uC5C6\uC74C" : "No name");
    if (pen) {
      pen.innerHTML = PENCIL;
      pen.hidden = false;
    }
    const outBtn = document.getElementById("acOut");
    if (outBtn) {
      outBtn.textContent = ko ? "\uB85C\uADF8\uC544\uC6C3" : "Sign out";
      outBtn.hidden = false;
    }
  }
  window.addEventListener("accountchange", () => {
    const b = document.getElementById("acctBox");
    if (b && b.classList.contains("on")) paintAcct();
  });
  let conflictOn = false;
  function showConflict() {
    conflictOn = true;
    const ko = (window.__lang || "ko") === "ko";
    const box = document.getElementById("acLinkRow");
    if (!box) return;
    box.hidden = false;
    box.innerHTML = '<p class="cfg__n" style="margin:0 0 8px">' + (ko ? "\uC774\uBBF8 \uADF8 \uAD6C\uAE00 \uACC4\uC815\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uADF8 \uACC4\uC815\uC73C\uB85C \uB4E4\uC5B4\uAC00\uBA74 \uAC8C\uC2A4\uD2B8\uB85C \uC313\uC740 \uC810\uC218\uB294 \uC0AC\uB77C\uC9D1\uB2C8\uB2E4." : "That Google account already exists. Signing in will discard your guest progress.") + '</p><button id="acSwitch">' + (ko ? "\uAE30\uC874 \uACC4\uC815\uC73C\uB85C \uB4E4\uC5B4\uAC00\uAE30" : "Sign in to that account") + '</button><button id="acKeep">' + (ko ? "\uCDE8\uC18C" : "Cancel") + "</button>";
  }
  window.__showLinkConflict = () => {
    openAcct();
    showConflict();
  };
  let nameBox = null;
  function openName() {
    const ko = (window.__lang || "ko") === "ko";
    if (!nameBox) {
      nameBox = document.createElement("div");
      nameBox.className = "cfg";
      nameBox.id = "nkBox";
      document.getElementById("stage").appendChild(nameBox);
    }
    nameBox.innerHTML = '<div class="cfg__v" data-nkclose></div><div class="cfg__p"><div class="cfg__h"><span>' + (ko ? "\uBCC4\uBA85 \uC815\uD558\uAE30" : "Choose a name") + '</span><button class="cfg__x" data-nkclose aria-label="close">\xD7</button></div><div class="cfg__b"><p class="cfg__n">' + (ko ? "\uD55C\uAE00 6\uC790 \uB610\uB294 \uC601\uBB38\xB7\uC22B\uC790 8\uC790\uAE4C\uC9C0. \uB2E4\uB978 \uC0AC\uB78C\uACFC \uACB9\uCE60 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." : "Up to 6 Korean or 8 Latin characters. Must be unique.") + '</p><input id="nkIn" maxlength="16" autocomplete="off" spellcheck="false" class="nk__in"><p class="hint" id="nkMsg"></p><div class="cfg__row"><button id="nkOk">' + (ko ? "\uC815\uD558\uAE30" : "Save") + "</button></div></div></div>";
    const inp = nameBox.querySelector("#nkIn");
    if (inp) {
      inp.value = window.ACCOUNT && window.ACCOUNT.name || "";
      setTimeout(() => inp.focus(), 60);
    }
    nameBox.classList.add("on");
  }
  function closeName() {
    if (nameBox) nameBox.classList.remove("on");
  }
  window.__askName = openName;
  document.addEventListener("click", async (e) => {
    if (e.target.closest("[data-nkclose]")) {
      closeName();
      return;
    }
    if (!e.target.closest("#nkOk")) return;
    const ko = (window.__lang || "ko") === "ko";
    const inp = document.getElementById("nkIn");
    const msg = document.getElementById("nkMsg");
    const btn = document.getElementById("nkOk");
    if (!inp || !window.setNickname) return;
    btn.disabled = true;
    msg.className = "hint";
    msg.textContent = ko ? "\uD655\uC778\uD558\uB294 \uC911" : "Checking";
    let r = null;
    try {
      r = await window.setNickname(inp.value);
    } catch (err) {
      msg.className = "hint hint--err";
      msg.textContent = String(err && err.code || err);
      btn.disabled = false;
      return;
    }
    if (r && r.ok) {
      closeName();
      btn.disabled = false;
      paintAcct();
      return;
    }
    const why = r && r.why;
    msg.className = "hint hint--err";
    msg.textContent = why === "taken" ? ko ? "\uC774\uBBF8 \uC4F0\uB294 \uC774\uB984\uC785\uB2C8\uB2E4" : "That name is taken" : why === "long" ? ko ? "\uB108\uBB34 \uAE41\uB2C8\uB2E4. \uD55C\uAE00 6\uC790 \uB610\uB294 \uC601\uBB38 8\uC790\uAE4C\uC9C0" : "Too long" : why === "space" ? ko ? "\uB744\uC5B4\uC4F0\uAE30\uB294 \uB123\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" : "No spaces" : why === "char" ? ko ? "\uD55C\uAE00, \uC601\uBB38, \uC22B\uC790\uB9CC \uB429\uB2C8\uB2E4" : "Letters and numbers only" : ko ? "\uC774\uB984\uC744 \uB123\uC5B4 \uC8FC\uC138\uC694" : "Please enter a name";
    btn.disabled = false;
  });
  function openAcct() {
    let box = document.getElementById("acctBox");
    if (!box) {
      const st = document.getElementById("stage");
      if (!st) return;
      st.insertAdjacentHTML("beforeend", ACCT_HTML);
      box = document.getElementById("acctBox");
    }
    paintAcct();
    box.classList.add("on");
  }
  function closeAcct() {
    const b = document.getElementById("acctBox");
    if (b) b.classList.remove("on");
  }
  window.__openAcct = openAcct;
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-acctclose]")) {
      closeAcct();
      return;
    }
    if (e.target.closest("#acctProfile") || e.target.closest("[data-acctopen]")) openAcct();
    if (e.target.closest("#acName") && window.__askName) window.__askName();
  });
  document.addEventListener("click", async (e) => {
    if (e.target.closest("#acSwitch")) {
      conflictOn = false;
      if (window.switchToGoogle) await window.switchToGoogle();
      paintAcct();
      return;
    }
    if (e.target.closest("#acKeep")) {
      conflictOn = false;
      paintAcct();
      return;
    }
    if (e.target.closest("#acOut")) {
      const ko2 = (window.__lang || "ko") === "ko";
      conflictOn = false;
      try {
        if (window.signOutNow) await window.signOutNow();
      } catch (err) {
        window.alert((ko2 ? "\uB85C\uADF8\uC544\uC6C3\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4\n" : "Sign out failed\n") + String(err && err.code || err));
      }
      closeAcct();
      go("entry");
    }
  });
  document.addEventListener("click", async (e) => {
    if (!e.target.closest("#acLink")) return;
    const ko = (window.__lang || "ko") === "ko";
    const btn = document.getElementById("acLink");
    btn.disabled = true;
    try {
      const r = window.linkGoogle ? await window.linkGoogle() : null;
      if (r && r.already) {
        window.alert(ko ? "\uC774\uBBF8 \uAD6C\uAE00 \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uD574 \uC788\uC2B5\uB2C8\uB2E4" : "Already signed in with Google");
      } else if (r && r.redirecting) {
      } else if (r && r.conflict) {
        showConflict();
      }
    } catch (err) {
      const code = String(err && err.code || err && err.message || err);
      window.alert((ko ? "\uC787\uAE30\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4\n" : "Linking failed\n") + code);
      console.warn(err);
    }
    btn.disabled = false;
    paintAcct();
  });
  window.addEventListener("langchange", () => {
    if (document.getElementById("cfg").classList.contains("on")) openCfg();
  });
  window.setLang(window.__lang);
  window.__goto = (id) => go(id);
  window.__toTable = () => {
    window.__fresh = false;
    go("table");
  };
  function go(id) {
    if (id === "draw" && window.__bootDraw) window.__bootDraw();
    if (id === "table" && window.__bootTable) {
      window.__bootTable(window.__fresh !== false);
      window.__fresh = false;
    }
    if (id === "tax" && window.__bootTax) window.__bootTax();
    if (id === "result" && window.__bootResult) window.__bootResult();
    if (id === "rank" && window.__bootRank) window.__bootRank();
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("is-on"));
    document.getElementById(id).classList.add("is-on");
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }
  document.querySelector("#entry #start").addEventListener("click", () => go("lobby"));
  document.querySelector("#lobby #btQuick").addEventListener("click", async () => {
    if (window.__createRoom) {
      const code = await window.__createRoom();
      if (!code) return;
    }
    go("room");
  });
  document.querySelector("#lobby #btJoin").addEventListener("click", async () => {
    const inp = document.querySelector("#lobby #code");
    const code = (inp && (inp.value || inp.textContent) || "").replace(/[^0-9]/g, "");
    if (code.length !== 4) {
      alert("\uB124 \uC790\uB9AC \uBC88\uD638\uB97C \uB123\uC5B4 \uC8FC\uC138\uC694");
      return;
    }
    if (window.__joinRoom) {
      const seat = await window.__joinRoom(code);
      if (seat == null) return;
    }
    go("room");
  });
  document.querySelector("#lobby #btNew").addEventListener("click", () => openOpts("create"));
  document.querySelector("#room #action").addEventListener("click", (e) => {
    const b = e.target.closest(".btn-primary");
    if (!b || b.disabled) return;
    go("draw");
  });
  document.querySelector("#draw #go").addEventListener("click", (e) => {
    if (!e.currentTarget.disabled) {
      window.__fresh = true;
      go("table");
    }
  });
  window.__onRoundEnd = () => go("result");
  document.querySelector("#result #next").addEventListener("click", () => {
    const G = window.GAME || {};
    const rounds = window.__opts && window.__opts.rounds || 5;
    if ((G.roundNo || 1) >= rounds) {
      if (window.__onRestart) {
        window.__onRestart();
        return;
      }
      window.__fresh = true;
      go("draw");
      return;
    }
    G.roundNo = (G.roundNo || 1) + 1;
    window.__roundNo = G.roundNo;
    if (window.__opts && window.__opts.tax === false) {
      window.__fresh = true;
      go("table");
    } else {
      go("tax");
    }
  });
  document.querySelector("#result #quit").addEventListener("click", () => go("lobby"));
  window.__toResult = () => go("result");
  document.querySelector("#tax #next").addEventListener("click", (e) => {
    const label = e.currentTarget.textContent.trim();
    if (label === "\uD310 \uC2DC\uC791" || label === "Start round") {
      window.__fresh = false;
      setTimeout(() => go("table"), 140);
    }
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-back]");
    if (!b) return;
    if (b.closest("#table") && window.__quitGame) window.__quitGame();
    go(b.dataset.back);
  });
}

// src/lib/bar.js
var BAR_SWAP = {
  "lobby": [
    '<div class="bar">',
    '<div class="bar">'
  ],
  "room": [
    '<button class="back" aria-label="\uB098\uAC00\uAE30">\u2039</button>',
    '<button class="back" data-back="lobby" aria-label="\uB098\uAC00\uAE30">\u2039</button>'
  ],
  "draw": [
    '<div class="bar__t" id="step"></div>',
    '<div style="display:flex;align-items:center;gap:6px"><button class="navback" data-back="room" aria-label="\uB4A4\uB85C">\u2039</button><div class="bar__t" id="step"></div></div>'
  ],
  "result": [
    '<div class="head__k" id="kicker"></div>',
    '<div class="head__k" id="kicker"></div>'
  ],
  "tax": [
    '<div class="bar__t" id="step"></div>',
    '<div style="display:flex;align-items:center;gap:6px"><button class="navback" data-back="room" aria-label="\uB4A4\uB85C">\u2039</button><div class="bar__t" id="step"></div></div>'
  ],
  "table": [
    '<button class="bar__x" aria-label="\uB098\uAC00\uAE30">\u2715</button>',
    '<button class="bar__x" data-back="lobby" aria-label="\uB098\uAC00\uAE30">\u2715</button>'
  ]
};

// src/screens/_markup.js
var MARKUP = {
  "entry": '<div class="bg">\n  <div class="bg__img"></div>\n  <div class="bg__top"></div>\n  <div class="bg__bot"></div>\n</div>\n\n<div class="lang" id="lang">\n  <button data-l="ko" aria-pressed="true">\uD55C\uAD6D\uC5B4</button>\n  <button data-l="en" aria-pressed="false">EN</button>\n</div>\n\n<div class="fan"><div class="fan__in" id="fan"></div></div>\n\n<main class="screen">\n  <div class="plate">\n    <div class="eyebrow" id="eyebrow"></div>\n    <h1 class="wordmark" id="wordmark"></h1>\n    <p class="sub" id="sub"></p>\n    <div class="hr"></div>\n  </div>\n  <div class="spacer"></div>\n  <button class="btn" id="start"></button>\n  <p class="hint" id="hint"></p>\n  <button class="testin" id="testin" hidden>\uC2DC\uD5D8\uC6A9 \uB85C\uADF8\uC778</button>\n</main>',
  "lobby": '<div class="veil"></div>\n<main class="screen">\n  <div class="bar">\n    <div class="top" id="acct">\n      <button class="top__me" id="acctProfile" aria-label="profile"></button>\n      <span class="top__tier" id="acctTier">0</span>\n      <span class="top__n" id="acctName"></span>\n      <i class="top__d"></i>\n      <span class="top__s" id="acctScore">0</span>\n      <i class="top__d"></i>\n      <span class="top__k" id="acctTick">5</span>\n      <span class="top__t" id="acctTimer"></span>\n      <button class="top__cfg" data-cfgopen aria-label="settings"></button>\n    </div>\n  </div>\n\n  <div class="body">\n    <div>\n      <div class="block__label" id="lbQuick"></div>\n      <button class="btn-primary" id="btQuick"></button>\n      <p class="hint" id="hQuick"></p>\n    </div>\n\n    <div>\n      <div class="block__label" id="lbNew"></div>\n      <button class="btn-second" id="btNew"></button>\n      <p class="hint" id="hNew"></p>\n    </div>\n\n    <div>\n      <div class="block__label" id="lbJoin"></div>\n      <div class="join">\n        <input id="code" inputmode="numeric" maxlength="4" placeholder="0000" aria-label="\uBC29 \uBC88\uD638">\n        <button id="btJoin"></button>\n      </div>\n    </div>\n  </div>\n\n  <button class="btn-rules" id="btRules"></button>\n</main>\n\n<div class="sheet" id="sheet" role="dialog" aria-modal="true">\n  <div class="sheet__veil" data-close></div>\n  <div class="sheet__panel">\n    <div class="sheet__head">\n      <div class="sheet__title" id="shTitle"></div>\n      <button class="sheet__close" data-close aria-label="\uB2EB\uAE30">\xD7</button>\n    </div>\n    <div class="sheet__body">\n      <p class="lead" id="shLead"></p>\n      <div class="grid" id="grid"></div>\n      <div id="rules"></div>\n    </div>\n  </div>\n</div>',
  "room": '<div class="veil"></div>\n<main class="screen">\n  <div class="lowfade"></div>\n  <div class="bar">\n    <button class="back" aria-label="\uB098\uAC00\uAE30">\u2039</button>\n    <div class="bar__t" id="bt"></div>\n    <div style="display:flex;gap:7px">\n      <div class="view" id="lang">\n        <button data-l="ko" aria-pressed="true">\uD55C</button>\n        <button data-l="en" aria-pressed="false">EN</button>\n      </div>\n      <div class="view" id="view">\n        <button data-v="host" aria-pressed="true">\uBC29\uC7A5</button>\n        <button data-v="guest" aria-pressed="false">\uCC38\uAC00\uC790</button>\n      </div>\n    </div>\n  </div>\n\n  <div class="roomno">\n    <span class="roomno__l" id="rl"></span>\n    <span class="roomno__n" id="roomNo">----</span>\n    <button id="rc"></button>\n  </div>\n\n  <div class="tablewrap">\n    <div class="felt">\n      <div class="felt__c">\n        <div class="felt__n" id="feltN"></div>\n        <div class="felt__s" id="feltS"></div>\n      </div>\n    </div>\n    <div id="seats"></div>\n  </div>\n\n  <button class="sum" id="sum" data-optopen></button>\n  <div id="action"></div>\n</main>',
  "draw": '<main class="screen">\n  <div class="bar">\n    <div class="bar__t" id="step"></div>\n    <div class="lang" id="lang">\n      <button data-l="ko" aria-pressed="true">\uD55C</button>\n      <button data-l="en" aria-pressed="false">EN</button>\n    </div>\n  </div>\n\n  <div class="ring" id="ring">\n    <div class="plane" id="plane">\n      <div class="felt"></div>\n      <div id="seats"></div>\n      <div class="deck" id="deck"></div>\n    </div>\n  </div>\n\n  <div class="mid" id="mid"></div>\n  <div class="pad"></div>\n  <div class="acts">\n    <button class="bt-main" id="go" disabled></button>\n  </div>\n</main>',
  "table": `<main class="screen">
  <div class="bar">
    <button class="bar__x" aria-label="\uB098\uAC00\uAE30">\u2715</button>
    <div class="bar__r" id="round"></div>
    <span class="bar__sp"></span>
  </div>

  <div class="ring" id="ring">
    <div class="stage"><div class="plane">
      <div class="felt"></div>
      <div class="pile" id="pile"></div>
      <div id="seats"></div>
    </div></div>
  </div>

  <div class="needrow">
    <button class="autotiny" id="auto" aria-pressed="false"><i></i><span></span></button>
    <div class="need" id="need"></div>
  </div>
  <div class="timer" id="timer"><i></i></div>
  <div class="hand" id="hand"></div>
  <div class="emopick" id="emopick" hidden></div>
  <div class="acts">
    <button class="bt-pass bt-emo" id="emo" aria-label="\uAC10\uC815\uD45C\uD604"></button><button class="bt-pass" id="pass">\uD328\uC2A4</button>
    <button class="bt-play" id="play" disabled>\uCE74\uB4DC\uB97C \uACE0\uB974\uC138\uC694</button>
  </div>
</main>

<div id="flash" style="position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);
  padding:11px 20px;border:1px solid var(--gold);border-radius:3px;background:rgba(10,18,13,.94);
  font-family:'Gowun Batang',serif;font-weight:700;font-size:15px;line-height:1.5;text-align:center;
  max-width:74%;opacity:0;pointer-events:none;
  transition:opacity .2s ease;z-index:50"></div>`,
  "tax": '<main class="screen">\n  <div class="bar">\n    <div class="bar__t" id="step"></div>\n    <div style="display:flex;gap:6px">\n      <div class="lang" id="lang">\n        <button data-l="ko" aria-pressed="true">\uD55C</button>\n        <button data-l="en" aria-pressed="false">EN</button>\n      </div>\n    </div>\n  </div>\n\n  <div class="ring">\n    <div class="plane">\n      <div class="felt"></div>\n      <div id="seats"></div>\n      <div class="fx" id="fx"></div>\n      <div class="flash" id="flash"></div>\n      <div class="mid" id="mid"></div>\n    </div>\n  </div>\n\n  <div class="hint" id="hint"></div>\n  <div class="hand" id="hand"></div>\n  <div class="acts">\n    <button class="bt-ghost" id="back"></button>\n    <button class="bt-main" id="next"></button>\n  </div>\n</main>',
  "result": '<main class="screen">\n  <div class="lang" id="lang">\n    <button data-l="ko" aria-pressed="true">\uD55C</button>\n    <button data-l="en" aria-pressed="false">EN</button>\n  </div>\n  <div class="head">\n    <div class="head__k" id="kicker"></div>\n    <div class="head__t" id="title"></div>\n    <div class="head__s" id="sub"></div>\n  </div>\n  <div class="legend" id="legend"></div>\n  <div class="list" id="list"></div>\n  <div class="acts">\n    <button class="bt-ghost" id="quit"></button>\n    <button class="bt-main" id="next"></button>\n  </div>\n</main>'
};
export {
  BAR_SWAP,
  CFG_HTML,
  GEAR,
  MARKUP,
  OPT_HTML,
  initNav,
  mount as mountEntry
};
