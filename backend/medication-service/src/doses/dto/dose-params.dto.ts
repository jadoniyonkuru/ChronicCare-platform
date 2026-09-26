import { IsUUID } from 'class-validator';
import { IsDateOnly, IsTimeOfDay } from '../../common/validation.js';

export class MedicationParams {
  @IsUUID()
  patientId: string;

  @IsUUID()
  medicationId: string;
}

/** Identifies one scheduled dose: a medication on a given date and time. */
export class DoseSlotParams extends MedicationParams {
  @IsDateOnly()
  date: string;

  @IsTimeOfDay()
  time: string;
}
