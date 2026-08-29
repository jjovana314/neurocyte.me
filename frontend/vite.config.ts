/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    sourcemapIgnoreList: false,
    proxy: {
      "/auth": "http://localhost:3000",
      "/patients": "http://localhost:3000",
    },
  },
  build: {
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/test/**",
      ],
      reporter: ["text", "html"],
      // Ratchet: raise these as coverage improves; commits fail if it drops below.
      thresholds: {
        statements: 29,
        branches: 32,
        functions: 21,
        lines: 29,
      },
    },
  },
});
