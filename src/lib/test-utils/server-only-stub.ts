// Stands in for the `server-only` package under vitest.
//
// The real package throws unconditionally unless the bundler sets Next.js's
// `react-server` resolve condition, which vitest does not. Every server
// action file eventually imports something marked `server-only`
// (contracts/document.ts, data/contracts.ts, ...), so without this alias no
// action test can import its subject at all -- see vitest.config.ts.
export {};
