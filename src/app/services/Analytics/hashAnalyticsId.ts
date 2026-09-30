import { createHash } from "crypto";

/**
 * Hashes a RingCentral id the same way as the legacy Embeddable analytics,
 * so Mixpanel distinct ids and `rcAccountId` values stay stable.
 */
export function hashAnalyticsId(
  id: string | number | null | undefined
): string | null {
  if (!id) {
    return null;
  }
  const secretKey = process.env.ANALYTICS_SECRET_KEY;
  return createHash("sha256").update(`${id}:${secretKey}`).digest("hex");
}
