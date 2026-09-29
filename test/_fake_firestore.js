/* 계정 삭제 검사용 가짜 Firestore — 메모리에 문서를 들고 있는다.
   **보안 규칙은 흉내 내지 않는다.** 규칙은 진짜 Firestore 에뮬레이터로만 잴 수 있다.
   여기서 보는 것은 "무엇을 어떤 순서로 지우는가" 뿐이다.
   globalThis.__fsFail(경로, 동작) 이 참이면 그 쓰기를 permission-denied 로 막는다. */
export const STORE = globalThis.__fsStore || (globalThis.__fsStore = new Map());
export const LOG = globalThis.__fsLog || (globalThis.__fsLog = []);

const join = segs => segs.join("/").replace(/\/+/g, "/");
const denied = (path, op) => {
  if (globalThis.__fsFail && globalThis.__fsFail(path, op)){
    const e = new Error("Missing or insufficient permissions."); e.code = "permission-denied"; throw e;
  }
};
export function getFirestore(){ return { fake: true }; }
export function connectFirestoreEmulator(){}
export function collection(base, ...segs){
  const path = base && base.path ? join([base.path, ...segs]) : join(segs);
  return { type: "collection", path };
}
export function doc(base, ...segs){
  const path = base && base.type === "collection" ? join([base.path, ...segs]) : join(segs);
  const id = path.split("/").pop();
  return { type: "document", path, id };
}
function snap(ref){
  const v = STORE.get(ref.path);
  return { id: ref.id, ref, exists: () => v !== undefined, data: () => (v === undefined ? undefined : { ...v }) };
}
export async function getDoc(ref){ return snap(ref); }
export function where(field, op, value){ return { kind: "where", field, op, value }; }
export function limit(n){ return { kind: "limit", n }; }
export function orderBy(field, dir){ return { kind: "orderBy", field, dir }; }
export function query(col, ...parts){ return { type: "query", path: col.path, parts }; }
export async function getDocs(q){
  const parts = q.parts || [];
  const depth = q.path.split("/").length + 1;
  let docs = [...STORE.keys()]
    .filter(p => p.startsWith(q.path + "/") && p.split("/").length === depth)
    .sort()
    .map(p => snap({ type: "document", path: p, id: p.split("/").pop() }));
  for (const w of parts.filter(x => x.kind === "where")){
    if (w.op !== "==") throw new Error("fake: only ==");
    docs = docs.filter(d => d.data()[w.field] === w.value);
  }
  const lim = parts.find(x => x.kind === "limit");
  if (lim) docs = docs.slice(0, lim.n);
  return { docs, empty: docs.length === 0, size: docs.length };
}
export async function getCountFromServer(q){ const s = await getDocs(q); return { data: () => ({ count: s.size }) }; }
export function increment(n){ return { __inc: n }; }
export function serverTimestamp(){ return { __ts: true }; }
function apply(prev, data){
  const out = { ...(prev || {}) };
  for (const [k, v] of Object.entries(data)){
    if (v && typeof v === "object" && "__inc" in v) out[k] = (Number(out[k]) || 0) + v.__inc;
    else if (v && typeof v === "object" && v.__ts) out[k] = Date.now();
    else out[k] = v;
  }
  return out;
}
export async function setDoc(ref, data, opt){
  denied(ref.path, "set"); LOG.push(["set", ref.path]);
  STORE.set(ref.path, apply(opt && opt.merge ? STORE.get(ref.path) : null, data));
}
export async function updateDoc(ref, data){
  denied(ref.path, "update");
  if (!STORE.has(ref.path)){ const e = new Error("No document to update"); e.code = "not-found"; throw e; }
  LOG.push(["update", ref.path]);
  STORE.set(ref.path, apply(STORE.get(ref.path), data));
}
export async function deleteDoc(ref){
  denied(ref.path, "delete"); LOG.push(["delete", ref.path]);
  STORE.delete(ref.path);
}
export async function runTransaction(db, fn){
  const tx = {
    get: async ref => snap(ref),
    set: (ref, data, opt) => { denied(ref.path, "set"); LOG.push(["set", ref.path]);
      STORE.set(ref.path, apply(opt && opt.merge ? STORE.get(ref.path) : null, data)); return tx; },
    update: (ref, data) => { denied(ref.path, "update"); STORE.set(ref.path, apply(STORE.get(ref.path), data)); return tx; },
    delete: ref => { denied(ref.path, "delete"); STORE.delete(ref.path); return tx; },
  };
  return fn(tx);
}
