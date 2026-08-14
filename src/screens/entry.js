import { scoped } from "../lib/scoped.js";
import { HERO as A_HERO } from "../lib/assets.js";
import "../styles/entry.css";

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
    ko:{eyebrow:"ZOO PRESIDENT", wordmark:"동물의 왕국", sub:"계급 카드게임", start:"게임 시작"},
    en:{eyebrow:"CARD CLASH", wordmark:"Zoo President", sub:"Climbing card game", start:"Start game"}
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
  
}
