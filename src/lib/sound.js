/* 소리.

   소리 파일은 아직 없다. 여기까지 미리 만들어 두면, 파일이 들어오는 순간
   assets/snd/ 에 넣고 아래 목록에 이름만 적으면 곧바로 울린다.
   화면 쪽 코드는 sound.play("card_play") 처럼 부르기만 하면 된다.

   음량은 두 갈래다 — 배경음악과 효과음. 사람들이 배경음악만 끄는 일이 잦다.
   음소거는 그 위에 얹히는 스위치라, 껐다 켜도 원래 음량이 그대로 돌아온다. */

const KEY = { bgm: "zk_vol_bgm", sfx: "zk_vol_sfx", mute: "zk_mute" };

function readNum(k, dflt){
  try {
    const v = localStorage.getItem(k);
    if (v == null) return dflt;
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : dflt;
  } catch(e){ return dflt; }
}
function readBool(k){
  try { return localStorage.getItem(k) === "1"; } catch(e){ return false; }
}
function write(k, v){ try { localStorage.setItem(k, String(v)); } catch(e){} }

export const sound = {
  bgm: readNum(KEY.bgm, 50),
  sfx: readNum(KEY.sfx, 50),
  muted: readBool(KEY.mute),
};

/* 실제로 나갈 음량(0~1). 음소거면 0 */
export const bgmGain = () => (sound.muted ? 0 : sound.bgm / 100);
export const sfxGain = () => (sound.muted ? 0 : sound.sfx / 100);

const fns = [];
export function onSound(fn){
  fns.push(fn);
  return () => { const i = fns.indexOf(fn); if (i >= 0) fns.splice(i, 1); };
}
function tell(){
  applyBgm();
  fns.forEach(f => { try { f(sound); } catch(e){ console.error(e); } });
}

export function setBgm(v){ sound.bgm = Math.max(0, Math.min(100, Number(v) || 0)); write(KEY.bgm, sound.bgm); tell(); }
export function setSfx(v){ sound.sfx = Math.max(0, Math.min(100, Number(v) || 0)); write(KEY.sfx, sound.sfx); tell(); }
export function setMuted(on){ sound.muted = Boolean(on); write(KEY.mute, sound.muted ? 1 : 0); tell(); }
export function toggleMute(){ setMuted(!sound.muted); return sound.muted; }

/* ---------- 소리 파일 ----------

   파일이 들어오면 여기에 이름만 적는다. 없는 것은 조용히 넘어간다 */
export const SFX = {
  card_play:  "assets/snd/card_play.webm",    /* 카드 낼 때 */
  card_deal:  "assets/snd/card_deal.webm",    /* 패 나눌 때 */
  pass:       "assets/snd/pass.webm",
  my_turn:    "assets/snd/my_turn.webm",
  win:        "assets/snd/win.webm",          /* 완주 */
  lose:       "assets/snd/lose.webm",
  button:     "assets/snd/button.webm",
  revolution: "assets/snd/revolution.webm",
  tick:       "assets/snd/tick.webm",         /* 남은 시간 */
  join:       "assets/snd/join.webm",         /* 대기실에 들어올 때 */
};
export const BGM = {
  lobby: "assets/snd/bgm_lobby.webm",
};

/* 소리마다 몇 벌씩 미리 만들어 둔다.

   부를 때마다 새로 만들면(cloneNode) 그때 파일을 다시 열어야 해서
   **첫 소리가 눈에 띄게 늦다**. 미리 받아 둔 것을 돌려 쓰면 바로 난다.
   같은 소리가 겹쳐 울릴 수 있게 한 소리에 여러 벌을 둔다 */
const POOL = 4;
const pool = {};
function voices(src){
  if (!pool[src]){
    pool[src] = { i: 0, list: Array.from({ length: POOL }, () => {
      const a = new Audio(src);
      a.preload = "auto";
      try { a.load(); } catch(e){}
      return a;
    }) };
  }
  return pool[src];
}

/* 미리 받아 두기 — 화면이 열릴 때 한 번 불러 주면 첫 소리도 안 늦다 */
export function warm(){
  Object.keys(SFX).forEach(k => { try { voices(SFX[k]); } catch(e){} });
}

/* 울리고 있는 소리를 멈춘다 (째깍 소리처럼 긴 것) */
export function stop(name){
  const src = SFX[name];
  if (!src || !pool[src]) return;
  pool[src].list.forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
}

/* 효과음 한 번 */
export function play(name){
  const src = SFX[name];
  if (!src) return;                 /* 아직 파일이 없다 */
  const g = sfxGain();
  if (g <= 0) return;
  try {
    const v = voices(src);
    const a = v.list[v.i];
    v.i = (v.i + 1) % v.list.length;
    try { a.currentTime = 0; } catch(e){}
    a.volume = g;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});   /* 사람이 아직 화면을 안 만졌으면 막힌다 */
  } catch(e){}
}

let bgmEl = null, bgmName = "";

/* 배경음악. 같은 곡이면 다시 틀지 않는다 */
export function playBgm(name){
  const src = BGM[name];
  if (!src){ stopBgm(); return; }
  if (bgmName === name && bgmEl) { applyBgm(); return; }
  stopBgm();
  try {
    bgmEl = new Audio(src);
    bgmEl.loop = true;
    bgmEl.volume = bgmGain();
    bgmName = name;
    try { window.__bgmOn = true; } catch(e){}
    const p = bgmEl.play();
    if (p && p.catch) p.catch(() => {});
  } catch(e){}
}

export function stopBgm(){
  if (bgmEl){ try { bgmEl.pause(); } catch(e){} }
  bgmEl = null; bgmName = "";
  try { window.__bgmOn = false; } catch(e){}
}

function applyBgm(){
  if (!bgmEl) return;
  const g = bgmGain();
  bgmEl.volume = g;
  if (g <= 0) { try { bgmEl.pause(); } catch(e){} }
  else { const p = bgmEl.play(); if (p && p.catch) p.catch(() => {}); }
}
