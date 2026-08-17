var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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
var ART = { "01": "assets/card_01.webp", "02": "assets/card_02.webp", "03": "assets/card_03.webp", "04": "assets/card_04.webp", "05": "assets/card_05.webp", "06": "assets/card_06.webp", "07": "assets/card_07.webp", "08": "assets/card_08.webp", "09": "assets/card_09.webp", "10": "assets/card_10.webp", "11": "assets/card_11.webp", "12": "assets/card_12.webp", "jokerA": "assets/joker_a.webp", "jokerB": "assets/joker_b.webp" };
var HEADS = ["assets/head_01.webp", "assets/head_02.webp", "assets/head_04.webp", "assets/head_10.webp", "assets/head_06.webp", "assets/head_09.webp", "assets/head_07.webp", "assets/head_12.webp"];
var RINGS = { "avatar": "assets/ring.webp", "empty": "assets/ring_empty.webp" };

// src/screens/room.js
function mount(root) {
  const document = scoped(root);
  const HEADS2 = HEADS;
  const PLAYERS_KO = ["\uB098", "\uBBFC\uC9C0", "\uC900\uD638", "\uC11C\uC5F0", "\uD0DC\uC724", "\uD558\uC740", "\uC9C0\uD6C8", "\uC608\uB9B0"];
  const PLAYERS_EN = ["You", "Minji", "Junho", "Seoyeon", "Taeyun", "Haeun", "Jihoon", "Yerin"];
  const L = {
    ko: {
      title: "\uBC29 \uB300\uAE30\uC2E4",
      roomL: "\uBC29 \uBC88\uD638",
      copy: "\uBC88\uD638 \uBCF5\uC0AC",
      host: "\uBC29\uC7A5",
      guest: "\uCC38\uAC00\uC790",
      count: (j, c) => j + " / " + c + "\uBA85",
      needMore: "4\uBA85\uBD80\uD130 \uC2DC\uC791\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4",
      canStart: "\uC9C0\uAE08 \uC2DC\uC791\uD558\uAC70\uB098 \uB354 \uAE30\uB2E4\uB9AC\uC154\uB3C4 \uB429\uB2C8\uB2E4",
      full: "\uC790\uB9AC\uAC00 \uB2E4 \uCC3C\uC2B5\uB2C8\uB2E4",
      empty: "\uBE48 \uC790\uB9AC",
      hostTag: "\uBC29\uC7A5",
      capT: "\uBC29 \uC778\uC6D0",
      capD: "4\uBA85 \u2013 8\uBA85",
      capDG: "\uBC29\uC7A5\uC774 \uC815\uD569\uB2C8\uB2E4.",
      rndT: "\uD50C\uB808\uC774 \uD310 \uC218 \uC124\uC815",
      rndD: "\uCD5C\uC18C 3\uD310\uBD80\uD130 \uC2DC\uC791",
      rndDG: "\uBC29\uC7A5\uC774 \uC815\uD569\uB2C8\uB2E4.",
      rndU: (n) => n + "\uD310",
      taxT: "\uC138\uAE08\uACFC \uD601\uBA85",
      taxD: "\uB4F1\uC218\uC5D0 \uB530\uB77C \uCE74\uB4DC\uB97C \uAD50\uD658\uD558\uACE0, \uC870\uCEE4 \uB450 \uC7A5\uC73C\uB85C \uC21C\uC704\uB97C \uB4A4\uC9D1\uB294 \uADDC\uCE59\uC785\uB2C8\uB2E4.",
      clrT: "2\uBC88 \uCEF7",
      clrD: "2\uBC88 \uCE74\uB4DC\uB97C \uB0B4\uBA74 \uBC14\uB2E5\uC744 \uBE44\uC6B0\uACE0 \uB2E4\uC2DC \uC120\uC744 \uC7A1\uC2B5\uB2C8\uB2E4.",
      on: "\uCF1C\uC838 \uC788\uC2B5\uB2C8\uB2E4.",
      off: "\uAEBC\uC838 \uC788\uC2B5\uB2C8\uB2E4.",
      sumP: "\uBA85",
      sumR: "\uD310",
      sumT: "\uC138\uAE08",
      sumC: "2\uBC88 \uCEF7",
      on2: "\uCF2C",
      off2: "\uB054",
      edit: "\u203A \uBCC0\uACBD",
      copied: "\uBCF5\uC0AC\uB428",
      start: "\uC2DC\uC791\uD558\uAE30",
      starting: "\uCE74\uB4DC\uB97C \uB098\uB204\uB294 \uC911",
      needFour: "4\uBA85\uC774 \uBAA8\uC5EC\uC57C \uC2DC\uC791\uD569\uB2C8\uB2E4",
      noTicket: "\uD2F0\uCF13\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB0B4\uC77C \uB2E4\uC2DC \uCC44\uC6CC\uC9D1\uB2C8\uB2E4",
      wait: "\uBC29\uC7A5\uC774 \uC2DC\uC791\uD558\uAE30\uB97C \uAE30\uB2E4\uB9AC\uB294 \uC911\uC785\uB2C8\uB2E4"
    },
    en: {
      title: "Waiting room",
      roomL: "ROOM NUMBER",
      copy: "Copy",
      host: "Host",
      guest: "Guest",
      count: (j, c) => j + " of " + c,
      needMore: "Four players are needed to start",
      canStart: "Start now, or wait for more",
      full: "The table is full",
      empty: "Open seat",
      hostTag: "HOST",
      capT: "Table size",
      capD: "4 \u2013 8 players",
      capDG: "The host decides.",
      rndT: "Number of rounds",
      rndD: "Three at least",
      rndDG: "The host decides.",
      rndU: (n) => n + "",
      taxT: "Tax and revolution",
      taxD: "Cards change hands by standing, and two jokers overturn it.",
      clrT: "Two-cut",
      clrD: "Playing a 2 clears the pile and you lead again.",
      on: "On.",
      off: "Off.",
      sumP: " players",
      sumR: " rounds",
      sumT: "Tax",
      sumC: "Two-cut",
      on2: "on",
      off2: "off",
      edit: "\u203A Change",
      copied: "Copied",
      start: "Start",
      starting: "Dealing",
      needFour: "Four players are needed",
      noTicket: "No tickets left. They refill tomorrow",
      wait: "Waiting for the host to start"
    }
  };
  let lang = window.__lang || "ko";
  const PLAYERS = PLAYERS_KO;
  let cap = 6;
  let joined = 4;
  let clear2 = false;
  let rounds = 5;
  let taxOn = true;
  let role = "host";
  const OV = { iw: 860, ih: 1859, cx: 0.4994, cy: 0.4415, rx: 0.425, ry: 0.142 };
  function placeTable(sec, cyPct) {
    const b = sec.getBoundingClientRect();
    const W = b.width, H = b.height;
    const scale = Math.max(W / OV.iw, H / OV.ih);
    const dw = OV.iw * scale, dh = OV.ih * scale;
    const cy = cyPct == null ? (H - dh) / 2 + OV.cy * dh : cyPct / 100 * H;
    const ox = W / 2 - OV.cx * dw;
    const oy = cy - OV.cy * dh;
    sec.style.backgroundSize = Math.round(dw) + "px " + Math.round(dh) + "px";
    sec.style.backgroundPosition = Math.round(ox) + "px " + Math.round(oy) + "px";
    return {
      cx: (ox + OV.cx * dw) / W * 100,
      cy: cy / H * 100,
      rx: OV.rx * dw / W * 100,
      ry: OV.ry * dh / H * 100
    };
  }
  function ringBox() {
    const sec = window.document.getElementById("room");
    if (!sec) return RB;
    const b = sec.getBoundingClientRect();
    const H = b.height;
    const base = placeTable(sec, null);
    const ctrl = document.getElementById("sum");
    const limit = ctrl ? ctrl.getBoundingClientRect().top - b.top - 22 : H * 0.72;
    const ryPx = base.ry / 100 * H;
    const wantCy = Math.min(base.cy / 100 * H, limit - ryPx);
    return placeTable(sec, wantCy / H * 100);
  }
  let RB = { cx: 49, cy: 34, rx: 35, ry: 11.5 };
  function anchorSeats(box, limitBottom) {
    const root2 = window.document.documentElement;
    const W = (window.document.getElementById("stage") || root2).getBoundingClientRect();
    box.querySelectorAll(".seat").forEach((s) => {
      const av = s.querySelector(".seat__av");
      if (!av) return;
      const dy = av.offsetTop + av.offsetHeight / 2;
      s.style.transform = "translate(-50%," + -dy + "px)";
      const r = s.getBoundingClientRect();
      let ox = 0, oy = 0;
      if (r.left < W.left + 3) ox = W.left + 3 - r.left;
      else if (r.right > W.right - 3) ox = W.right - 3 - r.right;
      if (limitBottom && r.bottom > limitBottom) oy = limitBottom - r.bottom;
      if (ox || oy) s.style.transform = "translate(calc(-50% + " + ox + "px)," + (-dy + oy) + "px)";
    });
  }
  function asArray(raw, n) {
    const out = new Array(n).fill(null);
    if (!raw) return out;
    if (Array.isArray(raw)) raw.forEach((v, i) => {
      if (i < n) out[i] = v || null;
    });
    else Object.keys(raw).forEach((k) => {
      const i = +k;
      if (i >= 0 && i < n) out[i] = raw[k] || null;
    });
    return out;
  }
  function seatList() {
    const R = window.__room;
    if (R && R.seats) {
      return asArray(R.seats, R.cap || cap).map((s, i) => s ? {
        name: s.name || "",
        me: i === R.me,
        host: s.uid && s.uid === R.host,
        off: Boolean(s.off),
        left: Boolean(s.left)
      } : null);
    }
    const KO = lang === "ko" ? PLAYERS_KO : PLAYERS_EN;
    return Array.from({ length: joined }, (_, i) => ({
      name: KO[i],
      me: i === 0,
      host: i === 0 && role === "host",
      off: false,
      left: false
    }));
  }
  function renderSeats() {
    RB = ringBox();
    const box = document.getElementById("seats");
    box.innerHTML = "";
    const list = seatList();
    const R = window.__room;
    if (R) cap = R.cap || cap;
    for (let i = 0; i < cap; i++) {
      const a = Math.PI / 2 + i * 2 * Math.PI / cap;
      const sy = Math.sin(a);
      const bias = sy > 0.25 ? 3.4 * sy : 0;
      const left = RB.cx + Math.cos(a) * -RB.rx;
      const top = RB.cy + sy * RB.ry + bias;
      const p = list[i] || null;
      const filled = Boolean(p);
      const el = document.createElement("div");
      el.className = "seat" + (filled ? "" : " seat--empty") + (p && p.me ? " seat--me" : "") + (p && (p.off || p.left) ? " seat--off" : "");
      el.style.left = left.toFixed(2) + "%";
      el.style.top = top.toFixed(2) + "%";
      const big = cap <= 6;
      el.style.setProperty("--av", (big ? 46 : 36) + "px");
      el.style.setProperty("--fs", (big ? 11 : 9.5) + "px");
      el.innerHTML = filled ? '<span class="seat__av" style="background-image:url(' + RINGS.avatar + "),url(" + HEADS2[i % HEADS2.length] + ')"></span>' + (p.off || p.left ? '<span class="seat__off"></span>' : "") + '<span class="seat__n">' + p.name + "</span>" + (p.host ? '<span class="seat__b">' + L[lang].hostTag + "</span>" : "") : '<span class="seat__av seat__av--empty" style="background-image:url(' + RINGS.empty + ')"></span><span class="seat__n">' + L[lang].empty + "</span>";
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
    const R2 = window.__room;
    const now = R2 && R2.seats ? asArray(R2.seats, R2.cap || cap).filter((s) => s && !s.left).length : joined;
    document.getElementById("feltN").textContent = t.count(now, cap);
    document.getElementById("feltS").textContent = now < 4 ? t.needMore : now < cap ? t.canStart : t.full;
  }
  function syncOpts() {
    const o = window.__opts || {};
    cap = o.cap || cap;
    rounds = o.rounds || rounds;
    taxOn = o.tax !== false;
    clear2 = !!o.clear2;
    if (joined > cap) joined = cap;
  }
  function renderControls() {
    const t = L[lang];
    const R = window.__room;
    const arr = R ? asArray(R.seats, R.cap || cap) : null;
    const now = arr ? arr.filter((s) => s && !s.left).length : joined;
    const iamHost = R ? Boolean(arr && arr[R.me] && arr[R.me].uid === R.host) : role === "host";
    const sm = document.getElementById("sum");
    sm.innerHTML = "<b>" + cap + "</b>" + t.sumP + " \xB7 <b>" + rounds + "</b>" + t.sumR + " \xB7 " + t.sumT + " " + (taxOn ? t.on2 : t.off2) + " \xB7 " + t.sumC + " " + (clear2 ? t.on2 : t.off2) + (iamHost ? '  <span style="color:#E3C67C">' + t.edit + "</span>" : "");
    sm.disabled = !iamHost;
    const a = document.getElementById("action");
    if (iamHost) {
      a.innerHTML = '<button class="btn-primary" ' + (now < 4 ? "disabled" : "") + ">" + (now < 4 ? t.needFour : t.start) + "</button>";
    } else {
      a.innerHTML = '<div class="waiting">' + t.wait + '<span class="dots"></span></div>';
    }
  }
  function draw() {
    syncOpts();
    renderSeats();
    renderControls();
    const sm2 = document.getElementById("sum");
    anchorSeats(document.getElementById("seats"), sm2 ? sm2.getBoundingClientRect().top - 6 : 0);
  }
  draw();
  window.addEventListener("resize", draw);
  window.addEventListener("optschange", draw);
  window.addEventListener("roomchange", draw);
  function paintCode() {
    const el2 = document.getElementById("roomNo");
    if (el2 && window.__roomCode) el2.textContent = window.__roomCode() || "----";
  }
  window.addEventListener("roomchange", paintCode);
  paintCode();
  const rcBtn = document.getElementById("rc");
  if (rcBtn) rcBtn.addEventListener("click", () => {
    const code = window.__roomCode && window.__roomCode() || "";
    if (!code) return;
    try {
      navigator.clipboard.writeText(code);
    } catch (e) {
    }
    const old = rcBtn.textContent;
    rcBtn.textContent = L[lang].copied;
    setTimeout(() => {
      rcBtn.textContent = old;
    }, 1200);
  });
  document.getElementById("action").addEventListener("click", async (e) => {
    const b = e.target.closest(".btn-primary");
    if (!b || b.disabled) return;
    const R = window.__room;
    if (window.spendTicket) {
      const ok = await window.spendTicket();
      if (!ok) {
        e.stopImmediatePropagation();
        const sm = document.getElementById("sum");
        if (sm) sm.textContent = L[lang].noTicket;
        return;
      }
    }
    window.__scored = false;
    if (R) {
      e.stopImmediatePropagation();
      b.disabled = true;
      b.textContent = L[lang].starting;
      try {
        await window.__startRound();
      } catch (err) {
        b.disabled = false;
        b.textContent = L[lang].start;
        alert("\uC2DC\uC791\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4 : " + (err && (err.message || err.code) || err));
      }
      return;
    }
    if (window.__opts) window.__opts.seated = joined;
  }, true);
  document.querySelectorAll("#lang button").forEach((b) => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document.documentElement.lang = lang;
      document.querySelectorAll("#lang button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });
  document.querySelectorAll("#view button").forEach((b) => {
    b.addEventListener("click", () => {
      role = b.dataset.v;
      document.querySelectorAll("#view button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });
  setInterval(() => {
    if (window.__room) return;
    joined = joined < cap ? joined + 1 : 2;
    draw();
  }, 3400);
  window.addEventListener("langchange", () => {
    lang = window.__lang;
    draw();
  });
}

// src/lib/engine.js
var engine = {
  mode: null,
  /* "local" | "online" */
  client: null,
  myID: "0",
  names: [],
  bots: [],
  /* 봇이 앉은 자리 (엔진 자리 번호) */
  view: null,
  paused: false,
  /* 결과를 보는 동안 다음 판을 멈춘다 */
  botMs: 1400
  /* 봇이 생각하는 척하는 시간 */
};
var listeners = [];
function onView(fn) {
  listeners.push(fn);
  if (engine.view) fn(engine.view);
  return () => {
    listeners = listeners.filter((f) => f !== fn);
  };
}
function play(num, count) {
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.play(num, count);
  return true;
}
function passTurn() {
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.pass();
  return true;
}

// src/screens/table.js
function mount2(root) {
  const document = scoped(root);
  const HEADS2 = HEADS, ART2 = ART;
  const KO_N = ["\uC0AC\uC790", "\uD638\uB791\uC774", "\uBD88\uACF0", "\uCF54\uB07C\uB9AC", "\uC545\uC5B4", "\uC5EC\uC6B0", "\uAE30\uB9B0", "\uBA67\uB3FC\uC9C0", "\uC6D0\uC22D\uC774", "\uD1A0\uB07C", "\uC0C8", "\uC0DD\uC950"];
  const EN_N = ["LION", "TIGER", "BEAR", "ELEPHANT", "CROCODILE", "FOX", "GIRAFFE", "BOAR", "MONKEY", "RABBIT", "BIRD", "MOUSE"];
  const T = {
    ko: {
      roundN: (n) => "ROUND " + n,
      joker: "\uCE74\uBA5C\uB808\uC628",
      myTurn: "\uB0B4 \uCC28\uB840",
      theirTurn: (n) => n + " \uCC28\uB840",
      left: (c) => "\uB0A8\uC740 <b>" + c + "</b>\uC7A5",
      tagTurn: "\uCC28\uB840",
      tagPass: "\uD328\uC2A4",
      tagOut: "\uC644\uC8FC",
      lead: "\uC6D0\uD558\uB294 \uC7A5\uC218\uB85C \uC2DC\uC791\uD558\uC138\uC694",
      top1: "<b>1\uBC88</b>\uC774 \uB098\uC654\uC2B5\uB2C8\uB2E4. \uC544\uBB34\uB3C4 \uBC1B\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4",
      need: (c, n) => "<b>" + c + "\uC7A5</b>\uC744 <b>" + n + "\uBC88 \uC774\uD558</b>\uB85C \uBC1B\uC73C\uC138\uC694",
      emptyPile: "\uBC14\uB2E5\uC774 \uBE44\uC5C8\uC2B5\uB2C8\uB2E4<br>\uC6D0\uD558\uB294 \uCE74\uB4DC\uB97C \uB0B4\uC138\uC694",
      pass: "\uD328\uC2A4",
      pick: "\uCE74\uB4DC\uB97C \uACE0\uB974\uC138\uC694",
      play: (n) => n + "\uC7A5 \uB0B4\uAE30",
      notTurn: "\uC0C1\uB300 \uCC28\uB840\uC785\uB2C8\uB2E4",
      mix: "\uAC19\uC740 \uC22B\uC790\uB9CC \uD568\uAED8 \uB0BC \uC218 \uC788\uC2B5\uB2C8\uB2E4",
      cnt: (n) => n + "\uC7A5\uC744 \uB9DE\uCDB0 \uC8FC\uC138\uC694",
      lower: "\uB354 \uB0AE\uC740 \uC22B\uC790\uB97C \uB0B4\uC138\uC694",
      autoPass: "\uC2DC\uAC04\uC774 \uB2E4 \uB418\uC5B4 \uC790\uB3D9\uC73C\uB85C \uB118\uACBC\uC2B5\uB2C8\uB2E4",
      left2: (n) => n + "\uCD08",
      cleared: "\uD310\uC744 \uBE44\uC6E0\uC2B5\uB2C8\uB2E4 \xB7 \uB2E4\uC2DC \uC120",
      endR: "\uD310 \uC885\uB8CC",
      close: "\uB2E4\uC2DC \uB204\uB974\uBA74 \uC811\uD799\uB2C8\uB2E4"
    },
    en: {
      roundN: (n) => "ROUND " + n,
      joker: "CHAMELEON",
      myTurn: "Your turn",
      theirTurn: (n) => n + "'s turn",
      left: (c) => "<b>" + c + "</b> left",
      tagTurn: "turn",
      tagPass: "passed",
      tagOut: "done",
      lead: "Lead with any number of cards",
      top1: "<b>1</b> is out. Nobody can beat it",
      need: (c, n) => "Beat with <b>" + c + (c === 1 ? " card" : " cards") + "</b> of <b>" + n + " or lower</b>",
      emptyPile: "The pile is empty<br>Play anything you like",
      pass: "Pass",
      pick: "Select cards",
      play: (n) => "Play " + n,
      notTurn: "Opponent's turn",
      mix: "Cards must share one number",
      cnt: (n) => "Play exactly " + n,
      lower: "Play a lower number",
      autoPass: "Time up \u2014 passed for you",
      left2: (n) => n + "s",
      cleared: "Pile cleared \xB7 you lead again",
      endR: "End round",
      close: "Tap again to close"
    }
  };
  let lang = window.__lang || "ko";
  const NAMES = KO_N;
  const el = (id) => document.getElementById(id);
  const isJ = (c) => c >= 13;
  const ALL = ["\uB098", "\uBBFC\uC9C0", "\uC900\uD638", "\uC11C\uC5F0", "\uD0DC\uC724", "\uD558\uC740", "\uC9C0\uD6C8", "\uC608\uB9B0"];
  const ALL_EN = ["You", "Minji", "Junho", "Seoyeon", "Taeyun", "Haeun", "Jihoon", "Yerin"];
  let SEATS = [];
  let hand = [];
  let finish = [];
  let offView = null;
  let lastRound = -1, overSent = false;
  function apply(v) {
    if (!v) return;
    SEATS = v.seats.map((x) => ({ n: x.name, c: x.c, s: x.s, hold: x.hold || [] }));
    hand = v.hand.slice();
    if (SEATS[0]) SEATS[0].hold = hand;
    finish = v.finish.slice();
    turn = v.turn;
    busy = !v.myTurn;
    if (v.roundNo !== lastRound) {
      const first = lastRound < 0;
      lastRound = v.roundNo;
      sel = [];
      animated = 0;
      spread = false;
      window.__roundNo = v.roundNo;
      if (!first && v.lastRound && window.__onRoundEnd) {
        showLastRound(v);
        return;
      }
    }
    if (v.table.length < trick.length) {
      animated = 0;
      spread = false;
    }
    trick = v.table.map((t) => ({ by: t.by, num: t.num, count: t.count, cards: t.cards.slice() }));
    sel = sel.filter((i) => i < hand.length);
    const me = finish.indexOf(0);
    window.__myRankIdx = me >= 0 ? me : null;
    if (v.over && !overSent) {
      overSent = true;
      window.__gameOver = v.over;
      window.GAME = window.GAME || {};
      window.GAME.score = v.over.score.slice();
      window.GAME.finish = v.over.order.slice();
      window.GAME.names = SEATS.map((x) => x.n);
      if (window.__onGameOver) setTimeout(window.__onGameOver, 900);
    }
    if (v.phase === "tax" && window.__onTax) window.__onTax(v);
    draw();
    resetTimer();
  }
  function showLastRound(v) {
    const lr = v.lastRound;
    SEATS = v.seats.map((x, i) => ({
      n: x.name,
      c: i === lr.order[lr.order.length - 1] ? x.c : 0,
      s: "",
      hold: []
    }));
    hand = [];
    finish = lr.order.slice();
    turn = -1;
    busy = true;
    trick = lr.table.map((t) => ({ by: t.by, num: t.num, count: t.count, cards: t.cards.slice() }));
    animated = 0;
    spread = false;
    draw();
    if (timerId) clearTimeout(timerId);
    setTimeout(() => {
      window.__onRoundEnd && window.__onRoundEnd(v);
    }, 1600);
  }
  function boot() {
    if (offView) offView();
    lastRound = -1;
    overSent = false;
    trick = [];
    sel = [];
    busy = false;
    animated = 0;
    spread = false;
    offView = onView(apply);
    if (engine.view) apply(engine.view);
  }
  window.__bootTable = boot;
  window.__forceEnd = () => {
    const left = SEATS.map((s, i) => i).filter((i) => !finish.includes(i));
    left.sort((a, b) => SEATS[a].c - SEATS[b].c);
    finish = finish.concat(left);
    endRound();
  };
  let sel = [];
  let trick = [];
  let turn = 0;
  let lastPlayer = null;
  let busy = false;
  let animated = 0;
  let spread = false;
  const cur = () => trick.length ? trick[trick.length - 1] : null;
  const label = (n) => isJ(n) ? T[lang].joker : (lang === "ko" ? KO_N : EN_N)[n - 1];
  const art = (n) => n === 13 ? ART2.jokerA : n === 14 ? ART2.jokerB : ART2[String(n).padStart(2, "0")];
  function cardHTML(n, w) {
    if (isJ(n)) return '<div class="card is-joker" style="--w:' + w + 'px"><div class="card__band"><span class="card__name">\uCE74\uBA5C\uB808\uC628</span></div><div class="card__art"><img src="' + art(n) + '" alt=""></div><div class="card__band"></div></div>';
    return '<div class="card" style="--w:' + w + 'px"><div class="card__band"><span class="card__num">' + n + '</span><span class="card__name">' + label(n) + '</span><span class="card__num">' + n + '</span></div><div class="card__art"><img src="' + art(n) + '" alt=""></div><div class="card__band"><span class="card__num">' + n + '</span><span class="card__num">' + n + "</span></div></div>";
  }
  const OV = { iw: 860, ih: 1859, cx: 0.4994, cy: 0.4415, rx: 0.425, ry: 0.142 };
  function placeTable(sec, cyPct) {
    const b = sec.getBoundingClientRect();
    const W = b.width, H = b.height;
    const scale = Math.max(W / OV.iw, H / OV.ih);
    const dw = OV.iw * scale, dh = OV.ih * scale;
    const cy = cyPct == null ? (H - dh) / 2 + OV.cy * dh : cyPct / 100 * H;
    const ox = W / 2 - OV.cx * dw;
    const oy = cy - OV.cy * dh;
    sec.style.backgroundSize = Math.round(dw) + "px " + Math.round(dh) + "px";
    sec.style.backgroundPosition = Math.round(ox) + "px " + Math.round(oy) + "px";
    return {
      cx: (ox + OV.cx * dw) / W * 100,
      cy: cy / H * 100,
      rx: OV.rx * dw / W * 100,
      ry: OV.ry * dh / H * 100
    };
  }
  let RING = { cx: 49, cy: 43, rx: 42.5, ry: 14.5 };
  function syncRing() {
    const sec = window.document.getElementById("table");
    if (!sec) return;
    RING = placeTable(sec, null);
    const p = el("pile");
    if (p) {
      p.style.left = RING.cx + "%";
      p.style.top = RING.cy + "%";
    }
    const ph = el("ring") && el("ring").querySelector(".pile__hint");
    if (ph) {
      ph.style.left = RING.cx + "%";
      ph.style.top = RING.cy + "%";
    }
  }
  function seatPos(i) {
    const a = Math.PI / 2 + i * 2 * Math.PI / SEATS.length;
    const s = Math.sin(a);
    const bias = 0;
    const side = Math.abs(s) < 0.05;
    const nudge = s > 0.9 ? 9 : side ? 4 : s > 0.25 ? 2 : 0;
    const nudgeX = side ? Math.cos(a) < 0 ? 2 : -2 : 0;
    return {
      x: RING.cx + Math.cos(a) * -RING.rx,
      y: RING.cy + s * RING.ry + bias,
      nudge,
      nudgeX
    };
  }
  function maxCount(n) {
    const j = hand.filter(isJ).length;
    return isJ(n) ? j : hand.filter((x) => x === n).length + j;
  }
  function isDead(n) {
    const c = cur();
    if (!c) return false;
    if (isJ(n)) return !KO_N.some((_, i) => i + 1 < c.num && maxCount(i + 1) >= c.count);
    return !(n < c.num && maxCount(n) >= c.count);
  }
  function effective(l) {
    const r = l.filter((x) => !isJ(x));
    if (!r.length) return 13;
    return r.every((x) => x === r[0]) ? r[0] : null;
  }
  function legal(l) {
    if (!l.length) return false;
    const e = effective(l);
    if (e === null) return false;
    const c = cur();
    if (!c) return true;
    return l.length === c.count && e < c.num;
  }
  function fanHTML(c) {
    if (!c) return '<div class="fan"></div>';
    const shown = Math.min(c, 7), step = 5;
    const w = 13 + (shown - 1) * step;
    let s = '<div class="fan" style="width:' + w + 'px">';
    for (let i = 0; i < shown; i++)
      s += '<i style="left:' + i * step + "px;z-index:" + i + '"></i>';
    return s + "</div>";
  }
  function anchorSeats(box, limitBottom) {
    const root2 = window.document.documentElement;
    const W = (window.document.getElementById("stage") || root2).getBoundingClientRect();
    box.querySelectorAll(".seat").forEach((s) => {
      const av = s.querySelector(".seat__av");
      if (!av) return;
      const nudge = +(s.dataset.nudge || 0), nx = +(s.dataset.nudgex || 0);
      const dy = av.offsetTop + av.offsetHeight / 2 + nudge;
      s.style.transform = "translate(calc(-50% + " + nx + "px)," + -dy + "px)";
      const r = s.getBoundingClientRect();
      let ox = nx, oy = 0;
      if (r.left < W.left + 1) ox = nx + (W.left + 1 - r.left);
      else if (r.right > W.right - 1) ox = nx + (W.right - 1 - r.right);
      if (limitBottom && r.bottom > limitBottom) oy = limitBottom - r.bottom;
      if (ox !== nx || oy) s.style.transform = "translate(calc(-50% + " + ox + "px)," + (-dy + oy) + "px)";
    });
  }
  function renderSeats() {
    syncRing();
    const box = el("seats");
    box.innerHTML = "";
    SEATS.forEach((s, i) => {
      const p = seatPos(i);
      const d = document.createElement("div");
      d.className = "seat" + (i === 0 ? " seat--me" : "") + (turn === i && SEATS[i].c > 0 ? " seat--turn" : "") + /* 봇 차례에도 표시 */
      (s.s === "pass" ? " seat--pass" : "") + (s.c === 0 ? " seat--out" : "");
      d.style.left = p.x.toFixed(1) + "%";
      d.style.top = p.y.toFixed(1) + "%";
      d.dataset.nudge = p.nudge || 0;
      d.dataset.nudgex = p.nudgeX || 0;
      const big = SEATS.length <= 6;
      d.style.setProperty("--av", (big ? 44 : 34) + "px");
      d.style.setProperty("--fs", (big ? 10.5 : 9) + "px");
      d.style.zIndex = 6 + Math.round(p.y);
      const tg = T[lang];
      const tag = s.c === 0 ? tg.tagOut : s.s === "pass" ? tg.tagPass : "";
      d.innerHTML = (tag ? '<span class="seat__tag">' + tag + "</span>" : "") + '<span class="seat__av" style="background-image:url(' + RINGS.avatar + "),url(" + HEADS2[i] + ')"></span><span class="seat__n">' + (s.n || "") + "</span>" + (i === 0 ? "" : fanHTML(s.c)) + '<span class="seat__c">' + T[lang].left(s.c) + "</span>";
      box.appendChild(d);
    });
    const nd = el("need");
    anchorSeats(box, nd ? nd.getBoundingClientRect().top - 4 : 0);
  }
  function renderPile() {
    const p = el("pile");
    p.innerHTML = "";
    if (spread && trick.length) {
      const t = T[lang];
      const maxC = Math.min(6, Math.max(...trick.map((x) => x.count)));
      const cw = Math.max(18, Math.min(32, Math.floor((196 - (maxC - 1) * 3) / maxC)));
      p.innerHTML = '<div class="spread">' + trick.slice().reverse().map((x, idx) => '<div class="srow' + (idx === 0 ? " srow--new" : "") + '"><span class="srow__w">' + (SEATS[x.by] && SEATS[x.by].n || "") + '</span><span class="srow__c">' + (x.cards || Array.from({ length: x.count }, () => x.num)).slice(0, 6).map((cc) => cardHTML(cc, cw, isJ(cc) ? x.num : null)).join("") + (x.count > 6 ? '<span class="srow__p">+' + (x.count - 6) + "</span>" : "") + "</span></div>").join("") + '<div class="spread__t">' + t.close + "</div></div>";
      return;
    }
    if (!trick.length) {
      p.innerHTML = '<div class="pile__hint">' + T[lang].emptyPile + "</div>";
      animated = 0;
      return;
    }
    const rect = el("ring").getBoundingClientRect();
    trick.slice(-4).forEach((t, kk) => {
      const k = trick.length - Math.min(trick.length, 4) + kk;
      const from = seatPos(t.by);
      const g = document.createElement("div");
      g.className = "play" + (k < trick.length - 1 ? " play--old" : "") + (k >= animated ? " play--new" : "");
      const d = trick.length - 1 - k;
      g.style.setProperty("--r", d === 0 ? "0deg" : k * 37 % 19 - 9 - d * 3 + "deg");
      g.style.setProperty("--dy", -Math.min(d, 3) * 6 + "px");
      g.style.setProperty("--sc", (1 - Math.min(d, 3) * 0.05).toFixed(3));
      g.style.setProperty("--fx", ((from.x - 50) / 100 * rect.width).toFixed(0) + "px");
      g.style.setProperty("--fy", ((from.y - 50) / 100 * rect.height).toFixed(0) + "px");
      g.style.zIndex = k;
      const cw = Math.max(18, Math.min(44, Math.floor((rect.width * 0.44 - (t.count - 1) * 4) / t.count)));
      g.innerHTML = (t.cards || Array.from({ length: t.count }, () => t.num)).map((cc) => cardHTML(cc, cw, isJ(cc) ? t.num : null)).join("");
      p.appendChild(g);
    });
    animated = trick.length;
  }
  function renderHand() {
    const h = el("hand");
    h.innerHTML = "";
    const w = 60, n = hand.length;
    const step = n > 1 ? Math.min(36, (h.clientWidth - w) / (n - 1)) : 0;
    const total = w + step * (n - 1);
    hand.forEach((c, i) => {
      const s = document.createElement("div");
      s.className = "slot" + (sel.includes(i) ? " slot--sel" : "") + (isDead(c) ? " slot--dead" : "");
      s.style.left = (h.clientWidth - total) / 2 + i * step + "px";
      s.style.zIndex = i;
      s.innerHTML = cardHTML(c, w);
      s.onclick = () => {
        if (turn !== 0 || busy) return;
        const k = sel.indexOf(i);
        if (k >= 0) sel.splice(k, 1);
        else sel.push(i);
        draw();
      };
      h.appendChild(s);
    });
    if (SEATS[0]) SEATS[0].c = hand.length;
  }
  function renderBottom() {
    const c = cur();
    const t = T[lang];
    const mine = turn === 0 && !busy;
    const who = turn === 0 ? "" : t.theirTurn(SEATS[turn] && SEATS[turn].n || "") + " \xB7 ";
    const left = mine && tLeft > 0 ? ' \xB7 <span class="count' + (tLeft <= 5 ? " warn" : "") + '">' + t.left2(tLeft) + "</span>" : "";
    el("need").innerHTML = who + (c ? c.num === 1 ? t.top1 : t.need(c.count, c.num - 1) : turn === 0 ? t.lead : "") + left;
    const rn = window.__roundNo || 1;
    const NM = lang === "ko" ? KO_N : EN_N;
    const ri = window.__myRankIdx;
    const ord = (x) => {
      const s = ["th", "st", "nd", "rd"], v = x % 100;
      return x + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const rname = ri == null ? "" : lang === "ko" ? ri + 1 + "\uB4F1" : ord(ri + 1);
    el("round").textContent = t.roundN(rn) + (rname ? " \xB7 " + rname : "");
    const eb = el("endRound");
    if (eb) eb.textContent = t.endR;
    el("pass").textContent = t.pass;
    const list = sel.map((i) => hand[i]);
    const ok = legal(list) && turn === 0 && !busy;
    const b = el("play");
    b.disabled = !ok;
    b.textContent = turn !== 0 ? t.notTurn : !list.length ? t.pick : ok ? t.play(list.length) : effective(list) === null ? t.mix : cur() && list.length !== cur().count ? t.cnt(cur().count) : t.lower;
    el("pass").disabled = turn !== 0 || busy || !cur();
  }
  function draw() {
    if (!SEATS.length) return;
    renderSeats();
    renderPile();
    renderHand();
    renderBottom();
    const nd = el("need");
    anchorSeats(el("seats"), nd ? nd.getBoundingClientRect().top - 4 : 0);
  }
  let timerId = null, tickId = null, tLeft = 0;
  let myGen = 0, botGen = 0;
  function laterBot(ms) {
    const g = myGen;
    setTimeout(() => {
      botGen = g;
      if (g === myGen) botTurn();
    }, ms);
  }
  const TURN_SEC = 15;
  function watchDeadline() {
  }
  function resetTimer() {
    el("timer").innerHTML = "<i></i>";
    el("timer").classList.toggle("mine", turn === 0 && !busy);
    if (timerId) clearTimeout(timerId);
    if (tickId) clearInterval(tickId);
    tLeft = 0;
    if (turn === 0 && !busy) {
      tLeft = TURN_SEC;
      renderBottom();
      tickId = setInterval(() => {
        tLeft--;
        if (tLeft <= 0) {
          clearInterval(tickId);
          tickId = null;
        }
        renderBottom();
      }, 1e3);
      timerId = setTimeout(() => {
        if (turn === 0 && !busy) doPass(true);
      }, TURN_SEC * 1e3);
    }
  }
  function quitGame() {
    if (window.__scored) return;
    window.__scored = true;
    const G = window.GAME || {};
    const sc = G.score || [];
    const order = sc.map((_, i) => i).sort((a, b) => (sc[b] || 0) - (sc[a] || 0));
    if (window.reportGame) window.reportGame(order.indexOf(0), sc.length || SEATS.length, sc[0] || 0, true);
  }
  window.__quitGame = quitGame;
  function clearsPile(numValue) {
    if (numValue === 1) return true;
    return numValue === 2 && window.__opts && window.__opts.clear2;
  }
  el("play").onclick = () => {
    const list = sel.map((i) => hand[i]);
    if (!legal(list) || turn !== 0 || busy) return;
    const e = effective(list);
    sel = [];
    busy = true;
    play(e, list.length);
    unlockLater();
  };
  let unlockId = null;
  function unlockLater() {
    if (unlockId) clearTimeout(unlockId);
    unlockId = setTimeout(() => {
      unlockId = null;
      const v = engine.view;
      if (v && v.myTurn && busy) {
        busy = false;
        draw();
      }
    }, 1200);
  }
  function doPass(auto) {
    if (turn !== 0 || busy) return;
    if (timerId) clearTimeout(timerId);
    if (!cur()) {
      if (!auto) return;
      const w = weakest();
      if (!w) return;
      sel = [];
      busy = true;
      flash(T[lang].autoPass, true);
      play(w.num, w.count);
      return;
    }
    sel = [];
    busy = true;
    if (auto) flash(T[lang].autoPass, true);
    passTurn();
    unlockLater();
  }
  function weakest() {
    let best = null;
    for (const c of hand) if (!isJ(c) && (best === null || c > best)) best = c;
    if (best !== null) return { num: best, count: 1 };
    return hand.some(isJ) ? { num: 13, count: 1 } : null;
  }
  el("pass").onclick = () => doPass(false);
  function flash(msg, msLong) {
    const f = el("flash");
    f.textContent = msg;
    f.style.opacity = 1;
    setTimeout(() => f.style.opacity = 0, msLong ? 2200 : 1200);
  }
  el("ring").addEventListener("click", (e) => {
    if (!trick.length) return;
    if (e.target.closest(".play, .spread")) {
      spread = !spread;
      renderPile();
    }
  });
  document.querySelectorAll("#lang button").forEach((b) => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document.documentElement.lang = lang;
      document.querySelectorAll("#lang button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
  });
  boot();
  window.addEventListener("resize", draw);
  window.addEventListener("langchange", () => {
    lang = window.__lang;
    draw();
  });
}

// src/lib/localroom.js
var localroom_exports = {};
__export(localroom_exports, {
  BOT_NAMES: () => BOT_NAMES,
  addBot: () => addBot,
  createRoom: () => createRoom,
  seatCount: () => seatCount,
  setCap: () => setCap,
  toRoomView: () => toRoomView
});
var BOT_NAMES = ["\uC11C\uC5F0", "\uC900\uD638", "\uBBFC\uC9C0", "\uD0DC\uC724", "\uD558\uC740", "\uC9C0\uD6C8", "\uC608\uB9B0"];
var ME = "me";
function createRoom({ cap = 6, name = "\uB098" } = {}) {
  return {
    cap: Math.min(8, Math.max(4, cap)),
    phase: "waiting",
    seats: [{ uid: ME, name: String(name || "\uB098"), bot: false }]
  };
}
function addBot(room) {
  if (!room || room.phase !== "waiting") return false;
  if (room.seats.length >= room.cap) return false;
  const used = room.seats.map((s) => s && s.name);
  const name = BOT_NAMES.find((n) => !used.includes(n)) || "\uBD07" + room.seats.length;
  room.seats.push({ uid: "bot" + room.seats.length, name, bot: true });
  return true;
}
function setCap(room, cap) {
  if (!room) return;
  room.cap = Math.min(8, Math.max(4, Number(cap) || room.cap));
  while (room.seats.length > room.cap) room.seats.pop();
}
function toRoomView(room) {
  if (!room) return null;
  return {
    cap: room.cap,
    me: 0,
    host: ME,
    phase: room.phase,
    round: null,
    seats: room.seats.slice()
  };
}
var seatCount = (room) => room ? room.seats.length : 0;

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
    <div style="display:flex;align-items:center;gap:9px">
      <div class="lang" id="lang">
        <button data-l="ko" aria-pressed="true">\uD55C</button>
        <button data-l="en" aria-pressed="false">EN</button>
      </div>
    </div>
  </div>

  <div class="ring" id="ring">
    <div class="stage"><div class="plane">
      <div class="felt"></div>
      <div class="pile" id="pile"></div>
      <div id="seats"></div>
    </div></div>
  </div>

  <div class="need" id="need"></div>
  <div class="timer" id="timer"><i></i></div>
  <div class="hand" id="hand"></div>
  <div class="acts">
    <button class="bt-pass" id="pass">\uD328\uC2A4</button>
    <button class="bt-play" id="play" disabled>\uCE74\uB4DC\uB97C \uACE0\uB974\uC138\uC694</button>
  </div>
</main>

<div id="flash" style="position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);
  padding:12px 22px;border:1px solid var(--gold);border-radius:3px;background:rgba(10,18,13,.94);
  font-family:'Gowun Batang',serif;font-weight:700;font-size:16px;opacity:0;pointer-events:none;
  transition:opacity .2s ease;z-index:50"></div>`,
  "tax": '<main class="screen">\n  <div class="bar">\n    <div class="bar__t" id="step"></div>\n    <div style="display:flex;gap:6px">\n      <div class="lang" id="lang">\n        <button data-l="ko" aria-pressed="true">\uD55C</button>\n        <button data-l="en" aria-pressed="false">EN</button>\n      </div>\n    </div>\n  </div>\n\n  <div class="ring">\n    <div class="plane">\n      <div class="felt"></div>\n      <div id="seats"></div>\n      <div class="fx" id="fx"></div>\n      <div class="flash" id="flash"></div>\n      <div class="mid" id="mid"></div>\n    </div>\n  </div>\n\n  <div class="hint" id="hint"></div>\n  <div class="hand" id="hand"></div>\n  <div class="acts">\n    <button class="bt-ghost" id="back"></button>\n    <button class="bt-main" id="next"></button>\n  </div>\n</main>',
  "result": '<main class="screen">\n  <div class="lang" id="lang">\n    <button data-l="ko" aria-pressed="true">\uD55C</button>\n    <button data-l="en" aria-pressed="false">EN</button>\n  </div>\n  <div class="head">\n    <div class="head__k" id="kicker"></div>\n    <div class="head__t" id="title"></div>\n    <div class="head__s" id="sub"></div>\n  </div>\n  <div class="legend" id="legend"></div>\n  <div class="list" id="list"></div>\n  <div class="acts">\n    <button class="bt-ghost" id="quit"></button>\n    <button class="bt-main" id="next"></button>\n  </div>\n</main>'
};
export {
  MARKUP,
  localroom_exports as localroom,
  mount as mountRoom,
  mount2 as mountTable
};
