/* 덱과 규칙. 서버와 앱이 같은 판정을 쓰도록 여기 한 곳에만 둔다.
   카멜레온은 13, 14. 혼자 내면 13번으로 가장 약하고, 다른 카드와 같이 내면 그 카드가 된다. */

export const JOKER_A = 13;
export const JOKER_B = 14;
export const isJoker = c => c >= 13;

/* 1번 1장 ~ 12번 12장 + 카멜레온 2장 = 80장 */
export function makeDeck(){
  const d = [];
  for (let n = 1; n <= 12; n++) for (let i = 0; i < n; i++) d.push(n);
  d.push(JOKER_A, JOKER_B);
  return d;
}

/* 시드를 넣으면 같은 순서가 나온다. 서버가 검증할 때 같은 덱을 다시 만들기 위함 */
export function shuffle(deck, seed){
  let s = seed >>> 0;
  const rnd = () => {                    /* xorshift32 */
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
  const a = deck.slice();
  for (let i = a.length - 1; i > 0; i--){
    const k = Math.floor(rnd() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}

export function deal(n, seed){
  const d = shuffle(makeDeck(), seed);
  const hands = Array.from({length: n}, () => []);
  d.forEach((c, i) => hands[i % n].push(c));
  hands.forEach(h => h.sort((a, b) => a - b));
  return hands;
}

/* 손에서 카드를 실제로 뺀다. 모자라면 카멜레온으로 채운다.
   뺄 수 없으면 null */
export function takeFrom(hand, num, count){
  const h = hand.slice();
  const used = [];
  for (let i = 0; i < count; i++){
    const at = h.indexOf(num);
    if (at >= 0){ used.push(h.splice(at, 1)[0]); continue; }
    const j = h.findIndex(isJoker);
    if (j < 0) return null;                       /* 채울 수 없다 */
    used.push(h.splice(j, 1)[0]);
  }
  return {hand: h, used};
}

/* 이 수가 규칙에 맞는가.
   cur 이 null 이면 새로 시작하는 것이라 아무 조합이나 된다. */
export function legalMove(hand, num, count, cur){
  if (!Number.isInteger(num) || !Number.isInteger(count)) return false;
  if (num < 1 || num > 13 || count < 1) return false;
  if (cur){
    if (count !== cur.count) return false;        /* 장수가 같아야 한다 */
    if (num >= cur.num) return false;             /* 더 낮은 숫자만 */
  }
  const plain = hand.filter(c => c === num).length;
  const jok = hand.filter(isJoker).length;
  if (num === 13){                                /* 카멜레온 단독 */
    return jok >= count;
  }
  return plain + jok >= count;
}
