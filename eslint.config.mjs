import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "src/lib/supabase/database.types.ts",
      // A separate Node service (the Tier2 QA agent worker), not part of
      // the Next.js app -- its own package.json/tsconfig, deployed and
      // linted on its own.
      "worker/**",
    ],
  },
];

export default eslintConfig;
