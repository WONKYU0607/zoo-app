import { scoped } from "../lib/scoped.js";
import { LOBBY_ART as A_LOBBY } from "../lib/assets.js";
import "../styles/lobby.css";

export function mount(root){
  const document = scoped(root);
  
  const IMG = A_LOBBY;
  
  const T = {
    ko:{
      mark:"동물의 왕국",
      lbQuick:"바로 시작하기", btQuick:"빠른 참가",
      hQuick:"기다리는 분들과 자동으로 이어 드립니다. 인원이 모이면 바로 시작합니다.",
      lbNew:"친구와 하기", btNew:"방 만들기",
      hNew:"방을 만들면 4자리 번호가 나옵니다. 친구에게 번호를 알려 주세요. 4명부터 8명까지 함께할 수 있습니다.",
      lbJoin:"번호로 들어가기", btJoin:"참가",
      mkTitle:"방 만들기", mkGo:"방 만들기",
      mkCap:["방 인원","4명 \u2013 8명"],
      mkRnd:["플레이 판 수 설정","최소 3판부터 시작"],
      mkTax:["세금과 혁명","등수에 따라 카드를 교환하고, 조커 두 장으로 순위를 뒤집는 규칙입니다."],
      mkCut:["2번 컷","2번 카드를 내면 바닥을 비우고 다시 선을 잡습니다."],
      rules:"규칙 보기", shTitle:"규칙",
      shLead:"손에 든 카드를 <b>먼저 다 털어내면</b> 이깁니다. 핵심은 하나입니다 — <b>숫자가 낮을수록 높은 계급</b>이고, 해당 숫자와 덱에 들어있는 카드의 장 수가 일치합니다. 예) 1 사자 = 1장, 12 생쥐 = 12장.",
      names:["사자","호랑이","불곰","코끼리","악어","여우","기린","멧돼지","원숭이","토끼","새","생쥐"],
      count:function(n){return n + "장"},
      items:[
        ["내는 법","앞사람이 낸 것과 <b>같은 장수</b>로, <b>더 낮은 숫자</b>만 낼 수 있습니다. 8번 세 장 위에는 7번 이하 세 장을 냅니다."],
        ["패스","언제든 넘길 수 있고 다음 차례에 다시 낼 수 있습니다. 전원이 넘기면 바닥을 치우고 마지막에 낸 분이 새로 시작합니다."],
        ["세금","판이 끝나면 등수가 다음 판의 계급이 됩니다. 1등은 꼴등의 가장 좋은 카드 두 장을 가져가고 아무 카드나 두 장을 줍니다. 2등은 뒤에서 두 번째와 한 장씩 바꿉니다."],
        ["혁명","한 사람이 카멜레온 두 장을 모두 쥐면 그 판의 세금이 취소됩니다. 그 사람이 꼴등이면 대혁명이 되어 계급이 통째로 뒤집힙니다."],
        ["점수와 승리","한 판이 끝나면 1등 100점, 2등 90점처럼 등수마다 점수를 받습니다. 방장이 정한 판 수를 다 치르고 총점이 가장 높은 분이 우승합니다. 세금과 혁명 기능은 방에서 끌 수 있습니다."]
      ],
      joker:["카멜레온","다른 카드와 같이 내면 그 카드로 변합니다. 5번 두 장에 카멜레온을 얹으면 5번 세 장이 됩니다. 혼자 내면 13번으로 취급되어 가장 약합니다. 덱에 총 두 장 있습니다."]
    },
    en:{
      mark:"Zoo President",
      lbQuick:"PLAY NOW", btQuick:"Quick match",
      hQuick:"We'll pair you with players already waiting. The game starts as soon as the table fills.",
      lbNew:"PLAY WITH FRIENDS", btNew:"Create room",
      hNew:"You'll get a 4-digit number. Share it with your friends. 4 to 8 players.",
      lbJoin:"JOIN BY NUMBER", btJoin:"Join",
      mkTitle:"Create a room", mkGo:"Create room",
      mkCap:["Table size","4 \u2013 8 players"],
      mkRnd:["Number of rounds","Three at least"],
      mkTax:["Tax and revolution","Cards change hands by standing, and two jokers overturn it."],
      mkCut:["Two-cut","Playing a 2 clears the pile and you lead again."],
      rules:"How to play", shTitle:"How to play",
      shLead:"<b>Empty your hand first</b> to win. One idea drives everything — <b>the lower the number, the higher the rank</b>, and that number is also how many of the card sit in the deck. 1 Lion means one card, 12 Mouse means twelve.",
      names:["LION","TIGER","BEAR","ELEPHANT","CROCODILE","FOX","GIRAFFE","BOAR","MONKEY","RABBIT","BIRD","MOUSE"],
      count:function(n){return n + (n === 1 ? " card" : " cards")},
      items:[
        ["Playing","Match the <b>same count</b> as the player before you, at a <b>lower number</b>. Three 8s must be answered with three cards of 7 or lower."],
        ["Passing","Pass any time and play again on your next turn. Once everyone passes, the pile is cleared and whoever played last leads."],
        ["Tax","Finishing order sets rank for the next round. First takes the last player's two best cards and hands back any two. Second swaps one card with the second from last."],
        ["Revolution","If one player holds both chameleons, tax is cancelled for that round. If that player finished last it becomes a great revolution and every rank reverses."],
        ["Score and winning","Each round pays out by place — 100 for first, 90 for second, and so on down. After the number of rounds the host set, the highest total wins. Tax and revolution can be switched off in the room."]
      ],
      joker:["Chameleon","Played alongside other cards it becomes that card — two 5s plus a chameleon makes three 5s. Played alone it counts as 13, the weakest card of all. Two are in the deck."]
    }
  };
  let lang = window.__lang || "ko";
  
  function miniCard(key, num, name){
    return '<div class="card">' +
      '<div class="card__band">' +
        '<span class="card__num">' + num + '</span>' +
        '<span class="card__name">' + name + '</span>' +
        '<span class="card__num">' + num + '</span>' +
      '</div>' +
      '<div class="card__art"><img src="' + IMG[key] + '" alt=""></div>' +
      '<div class="card__band"><span class="card__num">' + num + '</span><span class="card__num">' + num + '</span></div>' +
    '</div>';
  }
  
  function render(){
    const t = T[lang];
    document.body.dataset.lang = lang;
    document.documentElement.lang = lang;
    const set = (id, v) => document.getElementById(id).textContent = v;
    set("lbQuick", t.lbQuick); set("btQuick", t.btQuick); set("hQuick", t.hQuick);
    set("lbNew", t.lbNew); set("btNew", t.btNew); set("hNew", t.hNew);
    set("lbJoin", t.lbJoin); set("btJoin", t.btJoin);
    set("btRules", t.rules); set("shTitle", t.shTitle);
    document.getElementById("shLead").innerHTML = t.shLead;
  
    document.getElementById("grid").innerHTML = t.names.map((name, i) => {
      const n = i + 1;
      const key = String(n).padStart(2, "0");
      return '<div class="cell">' + miniCard(key, n, name) +
        '<span class="cell__c">' + t.count(n) + '</span></div>';
    }).join("");
  
    const jk = '<div class="rule rule--joker">' +
      '<div class="jk">' +
        '<div class="card"><div class="card__band" style="justify-content:center">' +
        '<span class="card__name">' + t.joker[0] + '</span></div>' +
        '<div class="card__art"><img src="' + IMG.joker + '" alt=""></div>' +
        '<div class="card__band"></div></div>' +
      '</div>' +
      '<div><h3>' + t.joker[0] + '</h3><p>' + t.joker[1] + '</p></div></div>';
  
    document.getElementById("rules").innerHTML =
      jk + t.items.map(it => '<div class="rule"><h3>' + it[0] + '</h3><p>' + it[1] + '</p></div>').join("");
  }
  render();
  
  document.querySelectorAll("#lang button").forEach(b => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document.querySelectorAll("#lang button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
  });
  
  const sheet = document.getElementById("sheet");
  document.getElementById("btRules").addEventListener("click", () => sheet.classList.add("is-open"));
  sheet.querySelectorAll("[data-close]").forEach(el =>
    el.addEventListener("click", () => sheet.classList.remove("is-open")));
  
  document.getElementById("code").addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
  });
  
  window.addEventListener("langchange", () => { lang = window.__lang; render(); });
  
  
}
