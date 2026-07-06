// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@astrojs/netlify";
import clerk from "@clerk/astro";
import { esES } from "@clerk/localizations";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: netlify({
    edgeMiddleware: false,
  }),
  integrations: [react(), clerk({ localization: esES })],

  vite: {
    plugins: [tailwindcss()],
  },
});
