/* **로그인 기록** — 앱을 다시 켤 때 "이미 로그인한 사람" 을 곧바로 알아보려고 (2026-10-26)

   사용자 신고: "구글 로그인이 되어 있는데도 잠시 딜레이가 되어 있다가 게스트로 시작하기가 떴다가
   로그인되면서 게임 시작 버튼이 나온다. 로그인 이미 한 사람은 그 바뀌는 거 안 뜨게."

   왜 그랬나: 로그인이 됐는지는 파이어베이스가 기기에 적어 둔 것을 읽고(로그인 복원),
   이어서 계정 문서(이름·점수·티켓)를 서버에서 받아 와야(Firestore) 알 수 있다. 앱을 막 켰을 때는
   서버에 처음 붙는 시간까지 걸려 잠깐 늦다. 그동안 첫 화면은 "아직 로그인 안 됨" 으로 보고
   구글로 시작하기 · 게스트로 시작하기를 그렸다가, 계정이 오면 게임 시작으로 바꿨다.

   그래서 로그인에 성공할 때마다 **기기에 "로그인했었다"(+ 별명)를 적어 둔다.** 다음에 켜면 첫 화면이
   이걸 보고 처음부터 게임 시작을 그린다. 확인이 끝나기 전에 누르면 "들어가는 중" 으로 기다렸다가 들어간다.
   로그아웃·계정 삭제·로그인이 풀린 것이 확인되면 지운다.
   여기에는 별명만 둔다 — 로그인 표나 계정 번호는 두지 않는다(그건 파이어베이스가 따로 들고 있다) */
const KEY = "zk_in";

export function rememberIn(name){
  try { localStorage.setItem(KEY, JSON.stringify({ name: String(name || "") })); } catch(e){}
}
export function forgetIn(){
  try { localStorage.removeItem(KEY); } catch(e){}
}
/* 적혀 있으면 { name }, 없으면 null */
export function wasIn(){
  try {
    const v = localStorage.getItem(KEY);
    if (!v) return null;
    const o = JSON.parse(v);
    return o && typeof o === "object" ? { name: String(o.name || "") } : { name: "" };
  } catch(e){ return null; }
}
