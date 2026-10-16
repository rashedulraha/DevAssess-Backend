import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  target: "es2022",
  outDir: "dist",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  noExternal: [
    /^((?!@prisma\/client).)*$/,
  ],
  banner: {
    js: `
      // CommonJS shim for Node.js modules compatibility
      var require = require || ((m) => { throw new Error('Cannot require ' + m); });
    `,
  },
});