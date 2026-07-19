// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import clerk from "@clerk/astro";
import { esES } from "@clerk/localizations";

// https://astro.build/config
export default defineConfig({
  output: "server",

  adapter:
    process.env.BUILD_PLATFORM === "netlify"
      ? (await import("@astrojs/netlify")).default({ edgeMiddleware: false })
      : (await import("@astrojs/node")).default({ mode: "standalone" }),

  integrations: [react(), clerk({ localization: esES })],

  vite: {
    plugins: [tailwindcss()],
  },
});
