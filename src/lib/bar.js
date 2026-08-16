/* 화면 상단에 뒤로 가기·판 종료 버튼을 붙인다 */
export const BAR_SWAP = {
  "lobby": [
    "<div class=\"bar\">",
    "<div class=\"bar\">"
  ],
  "room": [
    "<button class=\"back\" aria-label=\"나가기\">‹</button>",
    "<button class=\"back\" data-back=\"lobby\" aria-label=\"나가기\">‹</button>"
  ],
  "draw": [
    "<div class=\"bar__t\" id=\"step\"></div>",
    "<div style=\"display:flex;align-items:center;gap:6px\"><button class=\"navback\" data-back=\"room\" aria-label=\"뒤로\">‹</button><div class=\"bar__t\" id=\"step\"></div></div>"
  ],
  "result": [
    "<div class=\"head__k\" id=\"kicker\"></div>",
    "<div class=\"head__k\" id=\"kicker\"></div>"
  ],
  "tax": [
    "<div class=\"bar__t\" id=\"step\"></div>",
    "<div style=\"display:flex;align-items:center;gap:6px\"><button class=\"navback\" data-back=\"room\" aria-label=\"뒤로\">‹</button><div class=\"bar__t\" id=\"step\"></div></div>"
  ],
  "table": [
    "<button class=\"bar__x\" aria-label=\"나가기\">✕</button>",
    "<div style=\"display:flex;align-items:center;gap:9px\"><button class=\"bar__x\" data-back=\"lobby\" aria-label=\"나가기\">✕</button><button id=\"endRound\" style=\"font-size:10.5px;letter-spacing:.04em;color:#8FA898;border:1px solid #2E4436;border-radius:2px;padding:4px 8px;background:none;cursor:pointer\"></button></div>"
  ]
};
