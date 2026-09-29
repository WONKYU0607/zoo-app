/* 계정 삭제 검사용 firebase.js — 로그인은 **진짜 Auth 에뮬레이터**, 저장소는 가짜 */
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
export const ready = true;
export const app = initializeApp({ apiKey: "fake-key", projectId: "demo-zoo", authDomain: "demo-zoo.firebaseapp.com" });
export const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:" + (globalThis.__authPort || 9099), { disableWarnings: true });
export const db = { fake: true };
