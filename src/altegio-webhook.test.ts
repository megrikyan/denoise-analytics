import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { verifyAltegioLifecycleWebhook } from './altegio-webhook.js';

const token = 'partner-token-for-test';
const digest = createHash('sha256').update(token).digest('hex');

test('accepts an authenticated Altegio lifecycle event', () => {
  assert.deepEqual(
    verifyAltegioLifecycleWebhook(
      {
        salon_id: 123,
        application_id: 456,
        event: 'uninstall',
        partner_token: token,
      },
      digest,
    ),
    {
      ok: true,
      value: { salonId: 123, applicationId: 456, event: 'uninstall' },
    },
  );
});

test('rejects a webhook with the wrong partner token', () => {
  assert.deepEqual(
    verifyAltegioLifecycleWebhook(
      {
        salon_id: 123,
        application_id: 456,
        event: 'freeze',
        partner_token: 'wrong-token',
      },
      digest,
    ),
    { ok: false, reason: 'invalid_token' },
  );
});

test('rejects unsupported events and malformed identifiers', () => {
  assert.deepEqual(
    verifyAltegioLifecycleWebhook(
      {
        salon_id: 0,
        application_id: 456,
        event: 'record',
        partner_token: token,
      },
      digest,
    ),
    { ok: false, reason: 'invalid_payload' },
  );
});
