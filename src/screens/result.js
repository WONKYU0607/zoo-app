import { scoped } from "../lib/scoped.js";
import { HEADS as A_HEADS } from "../lib/assets.js";
import "../styles/result.css";

export function mount(root){
  const document = scoped(root);
  
  const HEADS = A_HEADS;
  const el = id => document.getElementById(id);
  const KO_N = ["사자","호랑이","불곰","코끼리","악어","여우","기린","멧돼지","원숭이","토끼","새","생쥐"];
  const EN_N = ["LION","TIGER","BEAR","ELEPHANT","CROCODILE","FOX","GIRAFFE","BOAR","MONKEY","RABBIT","BIRD","MOUSE"];
  const T = {
    ko:{ kickR:n=>n+"판 결과", kickF:"최종 결과",
         titleR:"이번 판 등수", titleF:"우승",
         subR:(a,b)=>a+"판까지 끝났습니다. "+b+"판 남았습니다.",
         subLast:"마지막 판입니다.",
         subF:n=>'<b>'+n+'</b>님이 가장 높은 점수로 이겼습니다.',
         colP:"등수", colG:"이번 판", colT:"총점",
         next:"다음 판", nextF:"다시 하기", quit:"나가기",
         tie:"동점입니다. 사자를 더 많이 한 분이 앞섭니다." },
    en:{ kickR:n=>"Round "+n, kickF:"Final",
         titleR:"This round", titleF:"Winner",
         subR:(a,b)=>a+" rounds played, "+b+" to go.",
         subLast:"Last round.",
         subF:n=>'<b>'+n+'</b> finishes with the highest score.',
         colP:"Place", colG:"Round", colT:"Total",
         next:"Next round", nextF:"Play again", quit:"Leave",
         tie:"Tied on points. More Lion finishes ranks higher." }
  };
  let lang = window.__lang || "ko";
  
  function ordEn(n){
    const s = ["th","st","nd","rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function rankLabel(r){ return lang === "ko" ? (r + 1) + "등" : ordEn(r + 1); }
  
  function render(){
    const G = window.GAME || {};
    const n = G.N || 6;
    const names = (lang === "ko" ? G.names : G.namesEn) || G.names || [];
    const finish = G.finish || [];
    const score = G.score || [];
    const rounds = (window.__opts && window.__opts.rounds) || 5;
    const played = G.roundNo || 1;
    const last = played >= rounds;
    const t = T[lang];
  
    /* 최종은 총점순, 중간은 이번 판 등수순 */
    const rows = last
      ? names.map((_, i) => i).sort((a, b) => (score[b] || 0) - (score[a] || 0))
      : finish.slice();
  
    el("kicker").textContent = last ? t.kickF : t.kickR(played);
    el("title").innerHTML = last
      ? '<span class="crown">\u265B</span><br>' + t.titleF
      : t.titleR;
    el("sub").innerHTML = last
      ? t.subF(names[rows[0]] || "")
      : (played + 1 > rounds ? t.subLast : t.subR(played, rounds - played));
    el("legend").innerHTML = '<span>' + t.colP + '</span><span>' + t.colG + ' · ' + t.colT + '</span>';
  
    el("list").innerHTML = rows.map((seat, idx) => {
      const place = last ? idx : finish.indexOf(seat);
      const gained = Math.max(10, 100 - place * 10);
      return '<div class="row' + (seat === 0 ? " row--me" : "") + (idx === 0 ? " row--top" : "") + '">' +
        '<span class="row__p">' + (idx + 1) + '</span>' +
        '<img class="row__av" src="' + HEADS[seat % HEADS.length] + '" alt="">' +
        '<span class="row__n">' + (names[seat] || "") + '</span>' +
        '<span class="row__r">' + rankLabel(place) + '</span>' +
        '<span class="row__g">+' + gained + '</span>' +
        '<span class="row__t">' + (score[seat] || 0) + '</span></div>';
    }).join("");
  
    el("next").textContent = last ? t.nextF : t.next;
    el("quit").textContent = t.quit;
  }
  window.__bootResult = render;
  render();
  
  window.addEventListener("langchange", () => { lang = window.__lang; render(); });
  
}
