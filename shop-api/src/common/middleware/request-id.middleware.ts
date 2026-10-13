import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

// Functional middleware: stamps every request with an id, like a reception desk ticket number.
// Reuses the caller's X-Request-Id if they sent one, so logs can be followed across services.
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id =
    (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  req.headers['x-request-id'] = id; // available to later layers (see AllExceptionsFilter)
  res.setHeader('X-Request-Id', id); // returned to the client
  next(); // ⚠️ never forget this, or the request hangs forever
}
