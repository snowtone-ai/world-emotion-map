/**
 * scripts/generate-map-image.ts
 * Fetches the WEM OG image from the production endpoint and returns it as a Buffer.
 * Used by post-to-x.ts to attach a map preview to tweets.
 *
 * Direct run:
 *   pnpm tsx scripts/generate-map-image.ts
 *   → saves to /tmp/wem-og.png
 *
 * Environment variable override:
 *   WEM_BASE_URL=http://localhost:3000  (defaults to https://worldemotionmap.com)
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";

const WEM_BASE_URL = process.env.WEM_BASE_URL ?? "https://worldemotionmap.com";

/**
 * Fetch the /api/og endpoint and return its body as a Buffer.
 * Returns null if the request fails or times out (15 s).
 */
export async function fetchOgImageBuffer(): Promise<Buffer | null> {
  const url = `${WEM_BASE_URL}/api/og`;
  try {
    const res = await fetch(url, {
      headers: { "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(
        `[generate-map-image] OG endpoint returned ${res.status} ${res.statusText}`,
      );
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("[generate-map-image] Failed to fetch OG image:", err);
    return null;
  }
}

// ── Direct execution ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  console.log(`[generate-map-image] Fetching from ${WEM_BASE_URL}/api/og ...`);
  const buf = await fetchOgImageBuffer();
  if (buf) {
    const outPath = "/tmp/wem-og.png";
    writeFileSync(outPath, buf);
    console.log(
      `[generate-map-image] ✓ Saved ${buf.byteLength.toLocaleString()} bytes → ${outPath}`,
    );
  } else {
    console.error("[generate-map-image] ✗ Failed to generate image");
    process.exit(1);
  }
}
