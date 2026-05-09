import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => "yahatl.js",
    },
    outDir: resolve(__dirname, "../www"),
    emptyOutDir: false,
    rollupOptions: {
      // HA provides these globally, don't bundle them
      external: [],
    },
  },
});
