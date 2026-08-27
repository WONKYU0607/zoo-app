/* 소리를 두 번 울리지도, 빠뜨리지도 않게 하는 열쇠.

   ---- 왜 어려운가 ----

   (1) 서버 대전은 내 화면이 먼저 반영하고 서버가 다시 확인해 준다.
       그 사이 바닥이 잠깐 비었다가 같은 카드로 다시 채워지므로,
       "바뀌었으니 울린다" 로 만들면 한 번 낸 것이 **두 번** 울린다.
   (2) 바닥에 쌓인 것만 보고 알아내면, **바닥을 치우는 수**는 흔적이 안 남는다.
       바퀴를 끝내는 마지막 패스 · 판 엎기(1번) · 마지막 카드가 그렇다.
       그래서 패스 단추를 눌러도 아무 소리가 안 나는 경우가 있었다.

   예전에는 "같은 것이 0.9초 안에 또 오면 메아리" 로 (1)만 막았다.
   그런데 걸러 낸 것의 시각까지 매번 새로 찍는 바람에, 패스 표시는
   그 바퀴가 끝날 때까지 시각이 계속 밀렸다. 결국 다음 바퀴에서 같은 사람이
   곧바로 또 패스하면 **진짜 소리가 메아리로 걸려 사라졌다**(봇이 빠를수록 잦다).

   ---- 어떻게 고쳤나 ----

   엔진이 수를 둘 때마다 번호를 매긴다(`G.moveNo`). 화면은 그 번호로만 판단한다.
   되돌림은 같은 번호라 걸러지고, 새 수는 언제나 다른 번호라 안 빠진다.
   바닥을 치우는 수도 번호는 남으므로 (2)도 같이 풀린다.

   옛 서버는 번호를 안 보낸다. 그때는 예전처럼 바닥·패스 표시에서 알아내되,
   시각이 아니라 **몇 번째 바퀴인지**로 가른다(그래도 (2)는 못 고친다). */

/* 지금이 몇 번째 바퀴인가 — 번호가 없는 옛 서버용.
   엔진이 안 알려 주면 **모두의 남은 장수 합**으로 대신한다.
   선은 패스할 수 없으므로 바퀴가 바뀌려면 카드가 최소 한 장은 나가 합이 줄어든다 */
export function trickId(v){
  if (v && v.trickNo != null) return "t" + v.trickNo;
  return "c" + ((v && v.seats) || []).reduce((a, s) => a + (s.c || 0), 0);
}

/* 이 화면 상태가 알려 주는 수들. `[{ key, kind, by }]`, kind 는 "play" | "pass" */
export function moveEvents(v){
  if (!v) return [];
  if (v.moveNo != null && v.lastMove){
    if (!v.moveNo) return [];                    /* 아직 아무도 안 뒀다 */
    return [{ key: "m" + v.moveNo, kind: v.lastMove.k, by: v.lastMove.by }];
  }
  /* ---- 옛 서버 대비 ---- */
  const id = trickId(v);
  const out = [];
  const tb = v.table || [];
  if (tb.length){
    const t = tb[tb.length - 1];
    out.push({ key: id + "#" + tb.length + ":" + t.by + "-" + t.num + "-" + t.count,
               kind: "play", by: t.by });
  }
  (v.seats || []).forEach((s, i) => {
    if (s && s.s === "pass") out.push({ key: id + "#p" + i, kind: "pass", by: i });
  });
  return out;
}

/* 이미 울린 번호들. 오래된 것부터 버린다.
   통째로 비우면 되돌림이 걸러지지 않아 두 번 울린다 */
export function makeSeen(limit = 240){
  const set = new Set();
  return {
    /* 처음 보는 번호면 true (그리고 기억한다) */
    add(key){
      if (!key) return false;
      if (set.has(key)) return false;
      set.add(key);
      if (set.size > limit){
        const it = set.values();
        for (let i = set.size - limit; i > 0; i--) set.delete(it.next().value);
      }
      return true;
    },
    has(key){ return set.has(key); },
    clear(){ set.clear(); },
    get size(){ return set.size; },
  };
}
