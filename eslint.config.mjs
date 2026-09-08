import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // The codebase's own convention for "this parameter/binding must exist
      // (a mock's call signature, an unused first arg to a Server Action) but
      // isn't used here" -- e.g. every Server Action's `_prev: FormState`.
      // Next's default config has no exception for it, so ~20 already-correct
      // call sites were flagged as if they were dead code.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "src/lib/supabase/database.types.ts",
      // A worktree under here is a full second checkout of the repo (see
      // EnterWorktree) -- without this, lint (and tsc, via its own
      // tsconfig excludes below) doubles every error it finds, once for
      // the real tree and once for the worktree's copy.
      ".claude/worktrees/**",
      // Vendored skill assets, not Lancerix application code -- their own
      // conventions (untyped third-party APIs, CommonJS scripts) are not
      // this project's to enforce, and linting them was drowning out the
      // ~8 files that actually needed attention under ~500 false errors.
      ".agents/**",
      ".claude/skills/**",
    ],
  },
];

export default eslintConfig;
