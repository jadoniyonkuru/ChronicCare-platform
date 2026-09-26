import { applyDecorators } from '@nestjs/common';
import { IsISO8601, Matches } from 'class-validator';

export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A real calendar date in "YYYY-MM-DD" form (rejects e.g. 2026-02-30). */
export function IsDateOnly(): PropertyDecorator {
  return applyDecorators(
    Matches(DATE_ONLY, { message: '$property must be in YYYY-MM-DD format' }),
    IsISO8601({ strict: true }),
  );
}

/** A 24h time of day in "HH:mm" form. */
export function IsTimeOfDay(options?: { each?: boolean }): PropertyDecorator {
  return Matches(TIME_OF_DAY, {
    each: options?.each,
    message: options?.each
      ? 'each value in $property must be a 24h time in HH:mm format'
      : '$property must be a 24h time in HH:mm format',
  });
}
