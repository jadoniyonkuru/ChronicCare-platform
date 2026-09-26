import { Injectable } from '@nestjs/common';

/**
 * Source of the current time. Inject this instead of calling `new Date()`
 * so tests can pin "now" to a fixed moment.
 */
export abstract class Clock {
  abstract now(): Date;
}

@Injectable()
export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
