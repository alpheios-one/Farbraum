/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  base: "/Farbraum/",
  test: {
    environment: "node",
  },
});
