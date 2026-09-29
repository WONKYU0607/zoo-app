/* 안드로이드 구글 로그인 흉내. 고를 계정은 globalThis.__pick 에 둔다.
   Auth 에뮬레이터는 서명 없는 JSON 을 구글 표로 받아 준다 */
export const FirebaseAuthentication = {
  async signInWithGoogle(){
    const p = globalThis.__pick;
    if (!p){ const e = new Error("The user canceled the sign-in flow."); e.code = "SIGN_IN_CANCELED"; throw e; }
    globalThis.__picked = (globalThis.__picked || 0) + 1;
    return { credential: { idToken: JSON.stringify({ sub: p.sub, email: p.email, email_verified: true, name: p.name || "x" }) } };
  },
  async signOut(){ globalThis.__nativeOut = (globalThis.__nativeOut || 0) + 1; },
};
