import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/lib/mount.tsx",
      name: "KurvingCotizador",
      fileName: "kurving-cotizador",
      formats: ["iife"]
    }
  }
});
