import { IsOptional } from 'class-validator';
import { IsDateOnly } from '../../common/validation.js';

export class DateRangeQueryDto {
  /** First date to include; defaults to 29 days before `to`. */
  @IsOptional()
  @IsDateOnly()
  from?: string;

  /** Last date to include; defaults to today. */
  @IsOptional()
  @IsDateOnly()
  to?: string;
}
