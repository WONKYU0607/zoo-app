/* Firebase 연결.
   설정값은 .env 에 넣는다. 브라우저에 실려 나가는 공개 값이라 비밀이 아니다.
   실제 보호는 Firestore 보안 규칙이 한다. */
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const cfg = {
  apiKey:            import.meta.env.VITE_FB_API_KEY,
  authDomain:        import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID,
  appId:             import.meta.env.VITE_FB_APP_ID,
};

export const ready = Boolean(cfg.apiKey && cfg.projectId);

let app = null, auth = null, db = null;
if (ready){
  app  = initializeApp(cfg);
  auth = getAuth(app);
  db   = getFirestore(app);
}
export { app, auth, db };
