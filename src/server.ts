import staticPlugin from '@fastify/static';
import Fastify from 'fastify';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { basicAuth } from './auth.js';
import { verifyAltegioLifecycleWebhook } from './altegio-webhook.js';
import { loadConfig } from './config.js';
import { DashboardService } from './dashboard.js';
import { parseDateRange } from './date-range.js';

const config = loadConfig();
const app = Fastify({ logger: { level: config.logLevel }, trustProxy: true });
const dashboard = new DashboardService(config);
const publicRoot = join(dirname(fileURLToPath(import.meta.url)), '../public');

app.addHook('onRequest', basicAuth(config.username, config.password));
app.addHook('onSend', async (_request, reply, payload) => {
  reply
    .header('X-Content-Type-Options', 'nosniff')
    .header('X-Frame-Options', 'DENY')
    .header('Referrer-Policy', 'no-referrer')
    .header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    .header('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
    .header('Cache-Control', 'no-store');
  return payload;
});

app.get('/health', async () => ({ ok: true }));
app.get('/ready', async () => ({ ok: true, sources: dashboard.status() }));
app.get('/api/status', async () => ({ sources: dashboard.status() }));
app.post('/api/webhooks/altegio', async (request, reply) => {
  if (!config.altegioWebhookPartnerTokenSha256) {
    request.log.error('Altegio lifecycle webhook is not configured');
    return reply.code(503).send({ error: 'Webhook is not configured.' });
  }

  const result = verifyAltegioLifecycleWebhook(
    request.body,
    config.altegioWebhookPartnerTokenSha256,
  );
  if (!result.ok) {
    return reply
      .code(result.reason === 'invalid_token' ? 401 : 400)
      .send({ error: 'Invalid webhook request.' });
  }

  request.log.warn(
    {
      salonId: result.value.salonId,
      applicationId: result.value.applicationId,
      event: result.value.event,
    },
    'Altegio application lifecycle event received',
  );
  return reply.code(204).send();
});
app.get<{
  Querystring: { startDate?: string; endDate?: string; refresh?: string };
}>('/api/dashboard', async (request, reply) => {
  try {
    const range = parseDateRange(
      request.query.startDate,
      request.query.endDate,
      config.maxDays,
    );
    return dashboard.report(range, request.query.refresh === 'true');
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Invalid report request.',
    });
  }
});

await app.register(staticPlugin, {
  root: publicRoot,
  prefix: '/',
  wildcard: false,
});

await app.listen({ host: '0.0.0.0', port: config.port });
