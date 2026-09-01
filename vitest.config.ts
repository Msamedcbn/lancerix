import path from "node:path";

import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // `server-only` throws unless the bundler sets Next's `react-server`
      // condition, which vitest doesn't. See the stub file for why this is
      // needed at all.
      "server-only": path.resolve(__dirname, "src/lib/test-utils/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
