import { timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

function equal(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function basicAuth(username: string, password: string) {
  return async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    if (request.url === '/health' || request.url === '/ready') return;
    const authorization = request.headers.authorization;
    if (authorization?.startsWith('Basic ')) {
      try {
        const decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
        const separator = decoded.indexOf(':');
        if (
          separator > 0 &&
          equal(decoded.slice(0, separator), username) &&
          equal(decoded.slice(separator + 1), password)
        ) {
          return;
        }
      } catch {}
    }
    reply.header('WWW-Authenticate', 'Basic realm="DE | NOISE Analytics", charset="UTF-8"');
    return reply.code(401).send({ error: 'Authentication required.' });
  };
}

