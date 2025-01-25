// @ts-check
import { defineConfig } from "astro/config";

import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import remarkGfm from "remark-gfm";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  integrations: [
    preact(),
    tailwind(),
    mdx({
      syntaxHighlight: "shiki",
      shikiConfig: { theme: "dracula" },
      remarkPlugins: [remarkGfm],
      remarkRehype: { footnoteLabel: "주석" },
      gfm: false,
    }),
  ],
});
