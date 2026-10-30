/* 하단 고정 탭이 틀에 맞는가 (2026-10-29 사용자 "하단바에 칸이랑 안에 들어간 거 크기가 안맞아보이는데") —
   다섯 칸이 양끝 장식 안쪽을 똑같이 나누는가 · 그림·글자가 칸 가운데인가 · 위아래 여백이 같고 3px 넘는가(테에 안 걸림) · 글자가 칸에 들어가는가. 한·영 × 폭 넷 */
import { canRun, launch, human, startServer, closeAll, nap } from "./_hum.mjs";
if (!(await canRun())) process.exit(0);
const srv = await startServer({ ZOO_ACCOUNTS: "memory", ZOO_TEST_TOKENS: "1", NODE_ENV: "test", ZOO_ALERT_URL: "" });
const env = await launch();
const H = await human(env, srv, "원규", { uid: "u1" });
await H.page.evaluate(() => window.__goto("lobby")); await nap(800);
let bad = 0;
for (const lang of ["ko", "en"]){
  await H.page.evaluate(l => window.setLang(l), lang);
  for (const [w, h] of [[320, 640], [360, 760], [393, 852], [412, 915]]){
    await H.page.setViewport({ width: w, height: h, deviceScaleFactor: 3 }); await nap(400);
    const r = await H.page.evaluate(() => {
      const tb = document.getElementById("tabbar"), cs = getComputedStyle(tb), R = tb.getBoundingClientRect();
      const f = { l: R.left + parseFloat(cs.borderLeftWidth), r: R.right - parseFloat(cs.borderRightWidth), t: R.top + parseFloat(cs.borderTopWidth), b: R.bottom - parseFloat(cs.borderBottomWidth) };
      const tabs = [...tb.querySelectorAll(".tab")].map(t => { const b = t.getBoundingClientRect(), ic = t.querySelector(".tab__ic").getBoundingClientRect();
        /* 글자는 줄 상자가 아니라 실제 글씨 크기로 — Range 로 잰다 */
        const rg = document.createRange(); rg.selectNodeContents(t.querySelector("span")); const lb = rg.getBoundingClientRect();
        return { l: b.left, r: b.right, w: b.width, cx: (b.left + b.right) / 2, icx: (ic.left + ic.right) / 2, lcx: (lb.left + lb.right) / 2, it: ic.top, ib: ic.bottom, lt: lb.top, lbm: lb.bottom, lw: lb.width }; });
      const ws = tabs.map(t => t.w);
      return {
        field: [f.l, f.r, f.t, f.b].map(v => Math.round(v * 10) / 10), fieldH: Math.round((f.b - f.t) * 10) / 10,
        edge: [Math.round((tabs[0].l - f.l) * 10) / 10, Math.round((f.r - tabs[4].r) * 10) / 10],
        cellW: [Math.min(...ws), Math.max(...ws)].map(v => Math.round(v * 10) / 10),
        offIcon: Math.round(Math.max(...tabs.map(t => Math.abs(t.icx - t.cx))) * 10) / 10,
        offLabel: Math.round(Math.max(...tabs.map(t => Math.abs(t.lcx - t.cx))) * 10) / 10,
        top: Math.round(Math.min(...tabs.map(t => t.it - f.t)) * 10) / 10, bottom: Math.round(Math.min(...tabs.map(t => f.b - t.lbm)) * 10) / 10,
        labelRoom: Math.round(Math.min(...tabs.map(t => t.w - t.lw)) * 10) / 10,
      };
    });
    const ok = Math.abs(r.edge[0]) < 0.6 && Math.abs(r.edge[1]) < 0.6 && r.cellW[1] - r.cellW[0] < 0.6 && r.offIcon < 0.6 && r.offLabel < 0.8 && r.top >= 3 && r.bottom >= 3 && Math.abs(r.top - r.bottom) <= 1.5 && r.labelRoom >= 8;
    if (!ok) bad++;
    console.log((ok ? "ok  " : "확인") + " " + lang + " " + w + "px · 안쪽 판 높이 " + r.fieldH + " · 양끝 칸 틈 " + r.edge + " · 칸 폭 " + r.cellW.join("~") + " · 그림 가운데 어긋남 " + r.offIcon + " · 글자 " + r.offLabel + " · 위 여백 " + r.top + " / 아래 " + r.bottom + " · 글자 양옆 남는 폭 " + r.labelRoom);
    if (process.env.SHOT) await H.page.screenshot({ path: process.env.SHOT + "_" + lang + "_" + w + ".png", clip: { x: 0, y: h - 100, width: w, height: 100 } });
  }
}
console.log(bad ? "=== 확인 " + bad + " ===" : "=== 모두 ok ===");
await closeAll(env, srv);
process.exit(bad ? 1 : 0);
