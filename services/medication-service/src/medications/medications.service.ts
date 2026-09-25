import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateMedicationDto } from './dto/create-medication.dto.js';
import { UpdateMedicationDto } from './dto/update-medication.dto.js';
import type { Medication } from './entities/medication.entity.js';
import { MedicationsRepository } from './medications.repository.js';

@Injectable()
export class MedicationsService {
  constructor(private readonly repository: MedicationsRepository) {}

  async create(
    patientId: string,
    dto: CreateMedicationDto,
  ): Promise<Medication> {
    const now = new Date().toISOString();
    const medication: Medication = {
      id: randomUUID(),
      patientId,
      name: dto.name.trim(),
      dosage: dto.dosage.trim(),
      timesOfDay: [...dto.timesOfDay].sort(),
      instructions: dto.instructions?.trim() || null,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    assertValidDateRange(medication);
    return this.repository.save(medication);
  }

  findAll(patientId: string): Promise<Medication[]> {
    return this.repository.findByPatient(patientId);
  }

  async findOne(patientId: string, id: string): Promise<Medication> {
    const medication = await this.repository.findOne(patientId, id);
    if (!medication) {
      throw new NotFoundException(`Medication ${id} not found`);
    }
    return medication;
  }

  async update(
    patientId: string,
    id: string,
    dto: UpdateMedicationDto,
  ): Promise<Medication> {
    assertNoNullRequiredFields(dto);
    const existing = await this.findOne(patientId, id);
    const updated: Medication = {
      ...existing,
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.dosage !== undefined && { dosage: dto.dosage.trim() }),
      ...(dto.timesOfDay !== undefined && {
        timesOfDay: [...dto.timesOfDay].sort(),
      }),
      ...(dto.instructions !== undefined && {
        instructions: dto.instructions?.trim() || null,
      }),
      ...(dto.startDate !== undefined && { startDate: dto.startDate }),
      ...(dto.endDate !== undefined && { endDate: dto.endDate }),
      updatedAt: new Date().toISOString(),
    };
    assertValidDateRange(updated);
    return this.repository.save(updated);
  }

  async remove(patientId: string, id: string): Promise<void> {
    if (!(await this.repository.delete(patientId, id))) {
      throw new NotFoundException(`Medication ${id} not found`);
    }
  }
}

const REQUIRED_FIELDS = ['name', 'dosage', 'timesOfDay', 'startDate'] as const;

// @IsOptional() on the partial update DTO lets null through; only the
// genuinely optional fields may be cleared.
function assertNoNullRequiredFields(dto: UpdateMedicationDto): void {
  const nulled = REQUIRED_FIELDS.filter((field) => dto[field] === null);
  if (nulled.length > 0) {
    throw new BadRequestException(
      nulled.map((field) => `${field} must not be null`),
    );
  }
}

function assertValidDateRange({ startDate, endDate }: Medication): void {
  // YYYY-MM-DD strings compare correctly as plain strings.
  if (endDate !== null && endDate < startDate) {
    throw new BadRequestException('endDate must not be before startDate');
  }
}
