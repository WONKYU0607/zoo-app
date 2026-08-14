import { defineConfig } from "vite";

export default defineConfig({
  base: "./",                 /* 앱으로 감쌀 때 상대 경로여야 한다 */
  build: { outDir: "dist", assetsInlineLimit: 0 },
  server: { host: true },
});
