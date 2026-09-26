import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DOSE_STATUSES, type DoseStatus } from '../entities/dose-log.entity.js';

export class RecordDoseDto {
  @IsIn(DOSE_STATUSES)
  status: DoseStatus;

  /** When the dose was taken; defaults to now. Not allowed when skipped. */
  @IsOptional()
  @IsISO8601({ strict: true })
  takenAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
