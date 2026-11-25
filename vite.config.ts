/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// `vite` / `--mode site`: the playground in index.html (fixture data or a live ?api= URL).
// `--mode lib`: the publishable library in dist/.
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [
    react(),
    ...(mode === "lib"
      ? [dts({ include: ["src"], exclude: ["src/dev", "src/**/*.test.*", "src/test"] })]
      : []),
  ],
  build:
    mode === "lib"
      ? {
          lib: {
            entry: resolve(__dirname, "src/index.ts"),
            formats: ["es"],
            fileName: () => "ml-demo-kit.js",
            cssFileName: "ml-demo-kit",
          },
          rollupOptions: { external: ["react", "react-dom", "react/jsx-runtime"] },
          sourcemap: true,
        }
      : { outDir: "site" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    css: false,
  },
}));
