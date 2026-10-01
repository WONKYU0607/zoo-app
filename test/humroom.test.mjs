/* 사람 여럿이 **방**에서 겪는 일 — 진짜 게임 서버 + 크롬 창 여러 개.
   2026-09-30 전체 점검에서 찾은 것들을 못박는다.

     열쇠      방 번호만으로 남의 자리표를 받거나, 남을 내보내거나, 대신 시작할 수 없다
     설정      방장이 대기실에서 바꾼 판 수·세금·친구끼리가 서버에도 간다
     두번누름  시작을 빠르게 두 번 눌러도 티켓은 한 장
     인원      인원을 바꿔도 자리·봇이 그대로다 (줄일 때는 순서대로 당긴다)
     친구방    자리보다 적게 모여 시작해도 뽑기에서 안 멈춘다
     방장      방장이 나가면 남은 사람이 방장이 되어 시작할 수 있다
     번호      없는 번호·시작한 방은 이유가 뜨고, 앉아 있던 자리는 그대로다

   쓰는 법:  node test/humroom.test.mjs   (zoo-server 가 zoo-app 옆에 있어야 한다) */
import { canRun, checker, startServer, api, roomOf, seatsOf, launch, human, closeAll, nap, waitFor } from "./_hum.mjs";

if (!(await canRun())) process.exit(0);
const C = checker();
const { check } = C;

async function setup(names, env2 = {}){
  const srv = await startServer(env2);
  const env = await launch();
  const H = [];
  for (const n of names) H.push(await human(env, srv, n));
  return { srv, env, H };
}

/* ---------- 열쇠 ---------- */
console.log("\n[열쇠 — 남의 자리를 건드릴 수 없다]");
{
  const { srv, env, H } = await setup(["방장", "손님"]);
  const code = await H[0].create({ cap: 4 });
  await nap(300); await H[1].join(code); await nap(600);
  const g = await H[1].seat();
  const r1 = await api(srv, "/zoo/rooms/" + code + "?seat=1&gen=0");
  check("열쇠 없이 자리 번호로는 자리표를 안 준다", r1.status === 200 && !r1.body.you, JSON.stringify(r1.body.you));
  const r2 = await api(srv, "/zoo/rooms/" + code + "?key=" + encodeURIComponent(g.key));
  check("자기 열쇠로는 자기 자리를 받는다", r2.body.you && r2.body.you.playerID === "1" && r2.body.you.credentials === g.credentials);
  check("열쇠 없이 남을 내보낼 수 없다", (await api(srv, "/zoo/rooms/" + code + "/leave", { playerID: "1" })).status === 403);
  check("가짜 열쇠로도 못 내보낸다", (await api(srv, "/zoo/rooms/" + code + "/leave", { key: "x" })).status === 403);
  check("손님은 시작할 수 없다", (await api(srv, "/zoo/rooms/" + code + "/start", { key: g.key })).status === 403);
  check("손님은 인원을 바꿀 수 없다", (await api(srv, "/zoo/rooms/" + code + "/cap", { key: g.key, numPlayers: 6 })).status === 403);
  await nap(500);
  const s = await seatsOf(srv, code);
  check("그 뒤에도 둘 다 그대로 앉아 있다", s[0] === "방장" && s[1] === "손님", JSON.stringify(s));
  await closeAll(env, srv);
}

/* ---------- 설정 ---------- */
console.log("\n[방 설정이 서버에도 간다]");
{
  const { srv, env, H } = await setup(["방장", "손님"], { ZOO_BOT_JOIN_MS: "400" });
  const code = await H[0].create({ cap: 4, rounds: 3, tax: true });
  await nap(300); await H[1].join(code);
  await waitFor(async () => (await seatsOf(srv, code)).filter(x => x !== "-").length >= 4, 10000);
  await H[0].page.evaluate(async () => {
    window.__opts.rounds = 5; window.__opts.tax = false; window.__opts.friends = true;
    await window.__saveOpts();
  });
  await nap(1800);
  const b = await roomOf(srv, code);
  check("판 수·세금이 서버에 들어갔다", b.opts.rounds === 5 && b.opts.tax === false, JSON.stringify(b.opts));
  check("친구끼리로 바꾸면 봇이 나간다", b.friends === true && !(b.players || []).some(p => p.bot),
    JSON.stringify((b.players || []).map(p => (p.name || "-") + (p.bot ? "(봇)" : ""))));
  await nap(2000);
  const go = await H[1].page.evaluate(() => ({ r: window.__opts.rounds, t: window.__opts.tax, f: window.__opts.friends }));
  check("손님 화면도 바뀐 설정을 안다", go.r === 5 && go.t === false && go.f === true, JSON.stringify(go));
  await closeAll(env, srv);
}

/* ---------- 두 번 누르기 ---------- */
console.log("\n[시작을 두 번 눌러도 티켓은 한 장]");
{
  const { srv, env, H } = await setup(["방장"], { ZOO_BOT_JOIN_MS: "300" });
  /* 티켓 쓰기가 파이어베이스를 다녀오는 만큼 느리다고 친다 */
  await H[0].page.evaluate(() => { window.spendTicket = async () => {
    window.__tickets = (window.__tickets || 0) + 1; await new Promise(r => setTimeout(r, 700)); return true; }; });
  await H[0].create({ cap: 4 });
  await waitFor(async () => (await H[0].seated()) >= 4, 15000);
  await H[0].page.evaluate(() => {
    const tap = () => { const b = document.querySelector("#room #action .btn-primary");
      if (b) b.dispatchEvent(new MouseEvent("click", { bubbles: true })); };
    tap(); setTimeout(tap, 150); setTimeout(tap, 400);
  });
  await nap(3000);
  check("티켓은 한 장만 쓴다", (await H[0].page.evaluate(() => window.__tickets || 0)) === 1,
    String(await H[0].page.evaluate(() => window.__tickets || 0)));
  check("게임은 시작했다", ["draw", "table"].includes(await H[0].screen()), await H[0].screen());
  await closeAll(env, srv);
}

/* ---------- 인원 바꾸기 ---------- */
console.log("\n[인원을 바꿔도 자리·봇이 그대로]");
{
  const { srv, env, H } = await setup(["방장", "손님"], { ZOO_BOT_JOIN_MS: "300" });
  const code = await H[0].create({ cap: 6 });
  await nap(1000);
  await H[1].join(code);
  await waitFor(async () => (await seatsOf(srv, code)).filter(x => x !== "-").length >= 6, 10000);
  const who = p => p.name ? (p.bot ? "봇#" + p.botName + "/" + p.avatar : p.name + "/" + p.avatar) : "-";
  const before = ((await roomOf(srv, code)).players || []).map(who);
  const guestSeat = before.findIndex(x => x.startsWith("손님"));
  await H[0].page.evaluate(async () => { window.__opts.cap = 7; await window.__saveOpts(); });
  await nap(1500);
  const up = ((await roomOf(srv, code)).players || []).map(who);
  check("늘리면 앉은 자리·봇이 그대로다", JSON.stringify(up.slice(0, 6)) === JSON.stringify(before),
    "\n           전 " + before.join(" | ") + "\n           후 " + up.join(" | "));
  const gs = await H[1].seat();
  const peek = await api(srv, "/zoo/rooms/" + code + "?key=" + encodeURIComponent(gs.key));
  check("손님은 같은 자리 번호를 받아 간다", peek.body.you && Number(peek.body.you.playerID) === guestSeat,
    JSON.stringify(peek.body.you && peek.body.you.playerID) + " / 전 " + guestSeat);
  await waitFor(async () => (await seatsOf(srv, code)).filter(x => x !== "-").length >= 7, 10000);
  const full7 = ((await roomOf(srv, code)).players || []).map(who);
  await H[0].page.evaluate(async () => { window.__opts.cap = 5; await window.__saveOpts(); });
  await nap(1500);
  const down = ((await roomOf(srv, code)).players || []).map(who);
  const keep = full7.filter(x => down.includes(x));
  const orderKept = keep.every((x, i) => i === 0 || down.indexOf(x) > down.indexOf(keep[i - 1]));
  check("줄이면 사람은 남고 순서도 그대로 당겨진다",
    down.length === 5 && down.includes(full7[0]) && down.some(x => x.startsWith("손님")) && orderKept,
    "\n           전 " + full7.join(" | ") + "\n           후 " + down.join(" | "));
  await closeAll(env, srv);
}

/* ---------- 친구 방 ---------- */
console.log("\n[친구 방 6자리에 4명이 시작]");
{
  const { srv, env, H } = await setup(["원규", "민수", "지영", "철호"]);
  const code = await H[0].create({ cap: 6, friends: true });
  for (let i = 1; i < 4; i++){ await nap(400); await H[i].join(code); }
  await waitFor(async () => (await H[0].seated()) >= 4, 10000);
  await nap(600);
  await H[0].pressStart();
  const ok = await waitFor(async () => (await Promise.all(H.map(h => h.screen()))).every(s => s === "table"), 45000);
  check("넷 다 뽑기를 지나 판에 들어간다", ok, JSON.stringify(await Promise.all(H.map(h => h.screen()))));
  const n = await H[0].page.evaluate(() => { const st = window.__eng.client && window.__eng.client.getState(); return st && st.ctx.numPlayers; });
  check("4인 판으로 시작했다", n === 4, String(n));
  check("서버 대리인이 에러 없이 돈다", !srv.lines.some(l => /\[runner\].*에러/.test(l)),
    srv.lines.filter(l => /\[runner\]/.test(l)).slice(0, 2).join(" / "));
  await closeAll(env, srv);
}

/* ---------- 방장이 나감 ---------- */
console.log("\n[방장이 대기실에서 나가면]");
{
  const { srv, env, H } = await setup(["방장", "손님1", "손님2"], { ZOO_BOT_JOIN_MS: "1500" });
  const code = await H[0].create({ cap: 4 });
  for (let i = 1; i < 3; i++){ await nap(400); await H[i].join(code); }
  await nap(1200);
  await H[0].page.evaluate(() => window.__back && window.__back());
  await nap(400);
  await H[0].page.evaluate(() => { const b = document.getElementById("askYes"); if (b) b.click(); });
  await nap(2500);
  const b = await H[1].startBtn();
  check("남은 첫 사람에게 시작 단추가 생긴다", Boolean(b), JSON.stringify(b));
  const badge = await H[2].page.evaluate(() => [...document.querySelectorAll("#room .seat")].some(s =>
    ((s.querySelector(".seat__n") || {}).textContent || "").trim() === "손님1" &&
    [...s.querySelectorAll("*")].some(x => x.textContent.trim() === "방장" && x.offsetParent !== null)));
  check("다른 손님 화면에도 새 방장 표시가 뜬다", badge);
  const started = await waitFor(async () => (await roomOf(srv, code)).started, 30000);
  check("방이 차면 새 방장 쪽에서 시작된다", started);
  const both = await waitFor(async () => ["draw", "table"].includes(await H[1].screen()) && ["draw", "table"].includes(await H[2].screen()), 20000);
  check("남은 둘 다 게임에 들어간다", both);
  await closeAll(env, srv);
}

/* ---------- 번호로 들어가기 실패 ---------- */
console.log("\n[번호로 못 들어갈 때]");
{
  const { srv, env, H } = await setup(["방장", "손님"], { ZOO_BOT_JOIN_MS: "400" });
  const code = await H[0].create({ cap: 4 });
  await waitFor(async () => (await H[0].seated()) >= 4, 10000);
  await H[0].pressStart();
  await nap(1500);
  const note = () => H[1].page.evaluate(() => ((document.querySelector("#lobby .hint--warn") || {}).textContent || ""));
  for (const [c, want] of [["0000", "없는 방"], [code, "이미 게임을 시작"]]){
    await H[1].page.evaluate(() => window.__goto("lobby"));
    await nap(300);
    await H[1].page.evaluate(c => { const i = document.querySelector("#lobby #code"); if (i) i.value = c;
      document.querySelector("#lobby #btJoin").click(); }, c);
    await nap(1500);
    const n = await note();
    check("'" + c + "' → 이유가 뜬다", n.includes(want), JSON.stringify(n));
  }
  check("잡히지 않은 오류가 없다", !H[1].errs.some(e => /pageerror/.test(e)), JSON.stringify(H[1].errs));
  const code2 = await H[0].page.evaluate(async () => { window.__leaveRoom();
    window.__opts = { cap: 4, seated: 1, rounds: 3, tax: true }; await window.__createRoom(); window.__goto("room");
    return window.__roomCode(); });
  await nap(400);
  await H[1].join(code2);
  await nap(1200);
  await H[1].page.evaluate(async () => { try { await window.__joinRoom("0000"); } catch(e){} });
  await nap(1500);
  const s = await seatsOf(srv, code2);
  check("앉아 있다가 없는 번호를 넣어도 원래 자리는 그대로다", s.includes("손님"), JSON.stringify(s));
  await closeAll(env, srv);
}

process.exit(C.done());
