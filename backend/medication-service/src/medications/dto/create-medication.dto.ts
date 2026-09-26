import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsDateOnly, IsTimeOfDay } from '../../common/validation.js';

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
  @IsTimeOfDay({ each: true })
  timesOfDay: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;

  @IsDateOnly()
  startDate: string;

  @IsOptional()
  @IsDateOnly()
  endDate?: string | null;
}
