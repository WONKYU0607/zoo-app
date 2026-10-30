/* 방장이 앱을 꺼 버린 방에 손님이 들어감 (2026-10-28 사용자 신고 — "방장이 시작하기를 기다리는 중입니다" 로 시작이 안 됨)
   보는 것: 손님 화면에 "방장의 연결이 끊어졌습니다 · N초 뒤 다른 사람에게 방장이 넘어갑니다" · 초가 줄어든다 ·
   15초 안팎에 손님이 방장이 되어 시작하기 단추 · 안내 상자가 평소 상자와 **같은 높이**(설정 줄·자리가 안 들썩임) ·
   화면 크기 넷에서 두 줄 그대로 · 화면 안. 한국어·영어 둘 다 */
import { canRun, launch, human, startServer, api, closeAll, nap } from "./_hum.mjs";
if (!(await canRun())) process.exit(0);
let pass = 0, fail = 0;
const check = (n, ok, note) => { ok ? pass++ : fail++; console.log((ok ? "  [OK]   " : "  [실패] ") + n + (note ? "  " + note : "")); };
const srv = await startServer({ ZOO_ACCOUNTS: "memory", ZOO_TEST_TOKENS: "1", NODE_ENV: "test", ZOO_ALERT_URL: "", ZOO_BOT_JOIN_MS: "600000" });
const env = await launch();
const box = P => P.evaluate(() => {
  const a = document.querySelector("#room #action > *"); if (!a) return null;
  const r = a.getBoundingClientRect();
  return { cls: a.className, text: a.innerText.replace(/\n/g, " / "), h: Math.round(r.height), sumBottom: Math.round(document.getElementById("sum").getBoundingClientRect().bottom) };
});
const amHost = P => P.evaluate(() => { const R = window.__room; return Boolean(R && R.seats[R.me] && R.seats[R.me].uid === R.host); });
const TXT = { ko: ["방장의 연결이 끊어졌습니다", "초 뒤 다른 사람에게 방장이 넘어갑니다"], en: ["The host has disconnected", "Host passes to another player in "] };
let n = 0;
for (const lang of ["ko", "en"]){
  console.log("\n=== " + lang + " ===");
  const hu = "h" + (++n), gu = "g" + n;
  for (const u of [hu, gu]) await api(srv, "/zoo/test/acct/" + u, { name: u, avatar: 0, score: 0, coins: 0, owned: [], tickets: 5, ticketAt: Date.now() });
  const H = await human(env, srv, "방장", { uid: hu });
  const G = await human(env, srv, "손님", { uid: gu, lang });
  await H.drv({ on: false }); await G.drv({ on: false });
  const code = await H.create({ cap: 4, rounds: 3, tax: true });
  await nap(1500);
  await G.join(code); await nap(2000);
  const b0 = await box(G.page);
  check("방장이 살아 있으면 평소 안내", b0 && b0.cls === "waiting", JSON.stringify(b0));
  const t0 = Date.now();
  await H.page.close();                                 /* 앱을 꺼 버림 — 나가기가 안 간다 */
  let first = null, secs = [], became = null, bGone = null;
  while (Date.now() - t0 < 30000){
    await nap(700);
    const b = await box(G.page);
    if (await amHost(G.page)){ became = (Date.now() - t0) / 1000; break; }
    if (b && /waiting--gone/.test(b.cls)){
      if (!first){ first = (Date.now() - t0) / 1000; bGone = b; }
      const m = b.text.match(/(\d+)/); if (m) secs.push(Number(m[1]));
    }
  }
  check("몇 초 안에 끊김 안내가 뜬다", first != null && first <= 8, first && first.toFixed(1) + "초");
  check("안내 글 두 줄", bGone && bGone.text.startsWith(TXT[lang][0]) && bGone.text.includes(TXT[lang][1]), bGone && bGone.text);
  check("남은 초가 1초씩 줄어든다(건너뛰지 않음 · 늘지 않음)", secs.length >= 4 && secs[secs.length - 1] < secs[0] &&
        secs.every((v, i) => i === 0 || (secs[i - 1] - v >= 0 && secs[i - 1] - v <= 1)), JSON.stringify(secs));
  check("15초 안팎에 손님이 방장이 된다", became != null && became >= 13 && became <= 19, became && became.toFixed(1) + "초");
  const b1 = await box(G.page);
  check("방장이 되면 시작하기 단추", b1 && /btn-primary/.test(b1.cls), JSON.stringify(b1));
  check("안내 상자가 평소 상자와 같은 높이 · 설정 줄이 안 움직임", bGone && bGone.h === b0.h && bGone.sumBottom === b0.sumBottom, "평소 " + b0.h + "/" + b0.sumBottom + " · 안내 " + (bGone && bGone.h + "/" + bGone.sumBottom));
  for (const [w, h] of [[320, 568], [360, 640], [360, 740], [412, 915]]){
    await G.page.setViewport({ width: w, height: h });
    await nap(400);
    const r = await G.page.evaluate(lang => {
      const a = document.getElementById("action"); const keep = a.innerHTML;
      a.innerHTML = '<div class="waiting">' + (lang === "ko" ? "방장이 시작하기를 기다리는 중입니다" : "Waiting for the host to start") + '</div>';
      const one = a.firstChild.getBoundingClientRect().height;
      a.innerHTML = '<div class="waiting waiting--gone">' + (lang === "ko" ? "방장의 연결이 끊어졌습니다<br>10초 뒤 다른 사람에게 방장이 넘어갑니다" : "The host has disconnected<br>Host passes to another player in 10s") + '</div>';
      const el = a.firstChild, rr = el.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(el);
      const lines = new Set([...range.getClientRects()].map(x => Math.round(x.top))).size;
      const fit = el.scrollWidth <= el.clientWidth + 1;
      a.innerHTML = keep;
      return { one: Math.round(one), two: Math.round(rr.height), lines, fit, bottom: Math.round(rr.bottom), vh: innerHeight };
    }, lang);
    check(w + "x" + h + " 두 줄 · 같은 높이 · 안 넘침 · 화면 안", r.lines === 2 && r.two === r.one && r.fit && r.bottom <= r.vh, JSON.stringify(r));
  }
  await G.page.evaluate(() => window.__goto("lobby")); await nap(800);
}
await closeAll(env, srv);
console.log("\n=== " + (fail ? "통과 " + pass + " / 실패 " + fail : "전부 통과 (" + pass + ")") + " ===\n");
process.exit(fail ? 1 : 0);
