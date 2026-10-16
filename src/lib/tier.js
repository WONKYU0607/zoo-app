/* 티어 기준 — 점수 5000점마다 한 칸. 뱃지 그림은 0~10 (public/assets/tier_00~10.webp).
   account.js 와 대기실 프로필 상자(room.js)가 같이 쓴다. 프로필 상자가 account.js 를 직접 부르면
   firebase 까지 딸려 와서(검사 번들이 깨진다) 기준만 여기로 뺐다 (2026-10-06) */
export const TIER_STEP = 5000;
export const TIER_MAX = 10;
export function tierOf(score){ return Math.floor(score / TIER_STEP); }
