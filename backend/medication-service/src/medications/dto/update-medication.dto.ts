import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicationDto } from './create-medication.dto.js';

/** All fields optional; send `endDate: null` to mark a medication as ongoing. */
export class UpdateMedicationDto extends PartialType(CreateMedicationDto) {}
