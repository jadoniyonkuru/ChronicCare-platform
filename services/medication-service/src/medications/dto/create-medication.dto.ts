import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class CreateMedicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  dosage: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ArrayUnique()
  @Matches(TIME_OF_DAY, {
    each: true,
    message: 'each value in timesOfDay must be a 24h time in HH:mm format',
  })
  timesOfDay: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;

  @Matches(DATE_ONLY, { message: 'startDate must be in YYYY-MM-DD format' })
  @IsISO8601({ strict: true })
  startDate: string;

  @IsOptional()
  @Matches(DATE_ONLY, { message: 'endDate must be in YYYY-MM-DD format' })
  @IsISO8601({ strict: true })
  endDate?: string | null;
}
