import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { "@next/next/no-img-element": "off" } },
  globalIgnores([".next/**", "next-env.d.ts"]),
]);
// Authenticated private photos must retain browser cookies; Next's image optimizer does not forward them.
