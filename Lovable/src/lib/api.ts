/**
 * Backend API client. All calls time out after 5 seconds and return null on
 * any error so callers can degrade gracefully without try/catch boilerplate.
 */

import type { Product } from "@/types/product";
import type { AssetManagerProfile } from "@/types/assetManager";
import type { ExtractedProduct } from "@/lib/gemini";
import type { Recommendation } from "@/types/recommendation";

const BACKEND = "http://localhost:8000";
const TIMEOUT_MS = 5_000;

async function post<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Server-side Gemini extraction. Returns null if backend is offline or has no API key. */
export async function extractViaBackend(text: string): Promise<ExtractedProduct | null> {
  return post<ExtractedProduct>("/extract", { text });
}

/**
 * Score a product against an AM mandate via the backend.
 * `withProse=true` triggers a Gemini-generated narrative rationale (requires GOOGLE_API_KEY).
 * Falls back to null silently if backend is offline.
 */
export async function scoreProductViaBackend(
  product: Product,
  am: AssetManagerProfile,
  withProse: boolean,
): Promise<Recommendation | null> {
  return post<Recommendation>("/recommendations/score", {
    product,
    am,
    with_prose: withProse,
  });
}

/** Lightweight health check — returns true if the backend is reachable. */
export async function isBackendOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND}/health`, {
      signal: AbortSignal.timeout(1_500),
    });
    return res.ok;
  } catch {
    return false;
  }
}
