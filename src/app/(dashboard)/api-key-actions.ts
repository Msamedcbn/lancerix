"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ApiKeyInfo = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

/**
 * Creates a new secure API key with prefix lx_sec_...
 * The full secret key is returned ONLY once upon creation.
 */
export async function createApiKeyAction(name: string): Promise<
  | { success: true; rawKey: string; keyInfo: ApiKeyInfo }
  | { success: false; error: string }
> {
  const session = await requireSession();
  const trimmedName = name.trim() || "CI/CD Pipeline Key";

  const rawSecret = crypto.randomBytes(24).toString("hex");
  const fullKey = `lx_sec_${rawSecret}`;
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");
  const keyPrefix = `lx_sec_${rawSecret.slice(0, 6)}...${rawSecret.slice(-4)}`;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("security_api_keys")
    .insert({
      user_id: session.userId,
      name: trimmedName,
      key_prefix: keyPrefix,
      key_hash: keyHash,
    })
    .select("id, name, key_prefix, last_used_at, created_at")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "API anahtarı oluşturulamadı." };
  }

  revalidatePath("/settings/api-keys");
  return {
    success: true,
    rawKey: fullKey,
    keyInfo: {
      id: data.id,
      name: data.name,
      keyPrefix: data.key_prefix,
      lastUsedAt: data.last_used_at,
      createdAt: data.created_at,
    },
  };
}

/**
 * Lists all API keys for the signed-in user.
 */
export async function listApiKeysAction(): Promise<ApiKeyInfo[]> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("security_api_keys")
    .select("id, name, key_prefix, last_used_at, created_at")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((d) => ({
    id: d.id,
    name: d.name,
    keyPrefix: d.key_prefix,
    lastUsedAt: d.last_used_at,
    createdAt: d.created_at,
  }));
}

/**
 * Revokes / deletes an API key.
 */
export async function revokeApiKeyAction(keyId: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("security_api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", session.userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/api-keys");
  return { success: true };
}

/**
 * Authenticates an incoming Bearer token against stored sha256 hashes.
 */
export async function authenticateApiKey(rawKey: string): Promise<{ userId: string } | null> {
  if (!rawKey.startsWith("lx_sec_")) return null;

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const admin = createAdminClient();

  const { data: keyRecord, error } = await admin
    .from("security_api_keys")
    .select("id, user_id")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (error || !keyRecord) return null;

  // Update last_used_at asynchronously
  await admin
    .from("security_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id);

  return { userId: keyRecord.user_id };
}
