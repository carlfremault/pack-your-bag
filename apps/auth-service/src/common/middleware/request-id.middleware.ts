import { Injectable, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';
import { v7 as uuidv7, validate as isUuid } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incomingId = req.headers['x-request-id'];
    const validId = typeof incomingId === 'string' && isUuid(incomingId) ? incomingId : uuidv7();

    req.id = validId;
    res.setHeader('x-request-id', validId);
    next();
  }
}
