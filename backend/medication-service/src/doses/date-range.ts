import { BadRequestException } from '@nestjs/common';
import { addDays, daysInclusive } from '../common/dates.js';
import type { DateRangeQueryDto } from './dto/date-range-query.dto.js';

export const DEFAULT_RANGE_DAYS = 30;
export const MAX_RANGE_DAYS = 366;

export interface DateRange {
  from: string;
  to: string;
}

/** Fills in defaults (the last 30 days up to today) and checks the range. */
export function resolveDateRange(
  query: DateRangeQueryDto,
  today: string,
): DateRange {
  const to = query.to ?? today;
  const from = query.from ?? addDays(to, -(DEFAULT_RANGE_DAYS - 1));

  if (from > to) {
    throw new BadRequestException('from must not be after to');
  }
  if (daysInclusive(from, to) > MAX_RANGE_DAYS) {
    throw new BadRequestException(
      `date range must not be longer than ${MAX_RANGE_DAYS} days`,
    );
  }
  return { from, to };
}
