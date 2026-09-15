import { createHash, timingSafeEqual } from 'node:crypto';

export type AltegioLifecycleEvent = {
  salonId: number;
  applicationId: number;
  event: 'uninstall' | 'freeze';
};

export type AltegioWebhookResult =
  | { ok: true; value: AltegioLifecycleEvent }
  | { ok: false; reason: 'invalid_payload' | 'invalid_token' };

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

export function verifyAltegioLifecycleWebhook(
  body: unknown,
  expectedPartnerTokenSha256: string,
): AltegioWebhookResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, reason: 'invalid_payload' };
  }

  const payload = body as Record<string, unknown>;
  if (
    !isPositiveInteger(payload.salon_id) ||
    !isPositiveInteger(payload.application_id) ||
    (payload.event !== 'uninstall' && payload.event !== 'freeze') ||
    typeof payload.partner_token !== 'string' ||
    payload.partner_token.length === 0
  ) {
    return { ok: false, reason: 'invalid_payload' };
  }

  const actualDigest = createHash('sha256').update(payload.partner_token).digest();
  const expectedDigest = Buffer.from(expectedPartnerTokenSha256, 'hex');
  if (
    expectedDigest.length !== actualDigest.length ||
    !timingSafeEqual(actualDigest, expectedDigest)
  ) {
    return { ok: false, reason: 'invalid_token' };
  }

  return {
    ok: true,
    value: {
      salonId: payload.salon_id,
      applicationId: payload.application_id,
      event: payload.event,
    },
  };
}
