export * as A from "../src/lib/account.js";
export * as FR from "../src/lib/friends.js";
export { auth } from "./_fake_fb.js";
export { STORE, LOG } from "./_fake_firestore.js";
export { signInWithCredential, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
