import { vi } from "vitest";

export type RpcResult = { data?: unknown; error?: { message: string } | null };
export type RpcImpl = (name: string, args: Record<string, unknown>) => RpcResult;

/**
 * A stand-in for the Supabase client, scoped to what the Server Actions in
 * this repo actually call: `.rpc(name, args)`. Every RPC-shaped action added
 * since the delivery/contract-lifecycle rewrite is a single call, so this is
 * enough to test the TS orchestration layer without a live database -- it
 * proves the right RPC was called with the right args and that its error is
 * surfaced, not what the RPC does once it reaches Postgres. That half is
 * covered by the migration's own guards and, for anything time/DB-state
 * dependent, needs a real hosted Supabase project (see CLAUDE.md).
 */
export function mockRpcClient(impl: RpcImpl) {
  const rpc = vi.fn(
    async (name: string, args: Record<string, unknown> = {}) => impl(name, args),
  );
  return { client: { rpc }, rpc };
}

/** An `.rpc()` call that always succeeds with the given data (default: null). */
export function okRpc(data: unknown = null): RpcImpl {
  return () => ({ data, error: null });
}

/** An `.rpc()` call that always fails with the given Postgres-style message. */
export function failRpc(message: string): RpcImpl {
  return () => ({ data: null, error: { message } });
}
