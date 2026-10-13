import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';

// Functional middleware: stamps every request with an id, like a reception desk ticket number.
// Reuses the caller's X-Request-Id if they sent one, so logs can be followed across services.
// On Fastify, Nest middleware gets the raw Node.js request/response (not Fastify's wrappers).
export function requestId(
  req: FastifyRequest['raw'],
  res: FastifyReply['raw'],
  next: () => void,
) {
  const id =
    (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  req.headers['x-request-id'] = id; // available to later layers (see AllExceptionsFilter)
  res.setHeader('X-Request-Id', id); // returned to the client
  next(); // ⚠️ never forget this, or the request hangs forever
}
