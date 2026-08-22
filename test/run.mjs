/* 검사를 한꺼번에 돌린다.

   왜 필요한가: 검사 파일이 열한 개인데 하나씩 줄줄이 돌리면 시간이 다 더해진다.
   대부분은 실제로 게임을 끝까지 돌리는 것이라 계산이 오래 걸린다(대기가 아니라 계산이다).
   파일끼리는 서로 아무것도 안 나눠 쓰므로 같이 돌려도 된다 —
   묶음 파일 이름만 겹치지 않으면 된다(auto 와 table 이 겹쳐 있어서 갈라놨다).

   빠른 벌: 게임을 통째로 돌리는 두 개(table, sequence)를 뺀 것. 고치는 중에 쓴다.
   전체 벌: 다 돌린다. 파일을 보내기 전에 쓴다. */

import { spawn } from "node:child_process";
import { cpus } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* 오래 걸리는 것부터 넣는다. 먼저 띄워야 마지막에 혼자 남지 않는다.
   게임 수를 줄여 놨다(시퀀스 1판, 화면통째 2판) — 그만큼 덜 본다.
   더 돌리고 싶으면 `npm run test:seq`(3판) / `npm run test:table`(3판 6명) */
const SLOW = [
  ["시퀀스",   ["test/sequence.test.mjs", "1"]],
  ["화면통째", ["test/table.test.mjs", "2"]],
];
const FAST = [
  ["엔진",     ["test/engine.test.js"]],
  ["배치",     ["test/layout.test.mjs"]],
  ["뒤로가기",   ["test/back.test.mjs"]],
  ["얼굴",      ["test/avatar.test.mjs"]],
  ["자동",     ["test/auto.test.mjs"]],
  ["카드얼굴", ["test/face.test.mjs"]],
  ["로그인",   ["test/login.test.mjs"]],
  ["랭킹",     ["test/rank.test.mjs"]],
  ["부팅",     ["test/boot.test.mjs"]],
  ["방",       ["test/room.test.mjs"]],
  ["판종료",   ["test/roundend.test.mjs"]],
  ["별명",     ["test/name.test.mjs"]],
];

const all = process.argv.includes("--all");
const jobs = all ? [...SLOW, ...FAST] : FAST;

/* 코어 수만큼. 계산이 대부분이라 너무 늘려도 소용없다 */
const LIMIT = Math.max(2, Math.min(8, cpus().length));

function run(name, args){
  return new Promise(res => {
    const t0 = Date.now();
    const p = spawn(process.execPath, args, { cwd: ROOT });
    let out = "";
    p.stdout.on("data", d => { out += d; });
    p.stderr.on("data", d => { out += d; });
    p.on("close", code => res({ name, code, out, ms: Date.now() - t0 }));
  });
}

const t0 = Date.now();
const queue = jobs.slice();
const done = [];
async function worker(){
  for (;;){
    const j = queue.shift();
    if (!j) return;
    const r = await run(j[0], j[1]);
    /* 각 검사가 마지막에 찍는 합계 줄을 뽑아 온다 */
    const sum = (r.out.match(/(통과 \d+ \/ 실패 \d+)/g) || []).pop() || "";
    const ok = r.code === 0;
    const skip = /건너뜁니다/.test(r.out);
    console.log((skip ? "  [건너뜀]" : ok ? "  [OK]   " : "  [실패] ") +
      j[0].padEnd(9) + " " + sum.padEnd(20) + (r.ms / 1000).toFixed(1) + "초");
    if (skip) console.log(r.out.split("\n").filter(l => l.trim() && !/^===/.test(l))
      .map(l => "         " + l.trim()).join("\n"));
    done.push(r);
  }
}

console.log("\n=== " + (all ? "전체" : "빠른") + " 검사 · " + jobs.length +
            "개 파일 · 동시 " + LIMIT + "개 ===\n");
await Promise.all(Array.from({ length: LIMIT }, worker));

const bad = done.filter(r => r.code !== 0);
for (const r of bad){
  console.log("\n───── " + r.name + " ─────");
  console.log(r.out.split("\n").filter(l => /실패|Error|error/.test(l)).slice(0, 30).join("\n"));
}
console.log("\n=== " + (done.length - bad.length) + " / " + done.length +
            " 통과 · " + ((Date.now() - t0) / 1000).toFixed(1) + "초 ===\n");
if (!all && !bad.length) console.log("게임을 통째로 돌리는 검사는 빠졌습니다. 보내기 전에 npm run test:all\n");
process.exit(bad.length ? 1 : 0);
