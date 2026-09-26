import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Clock } from '../common/clock.js';
import { addDays, toDateString } from '../common/dates.js';
import type { Medication } from '../medications/entities/medication.entity.js';
import { MedicationsService } from '../medications/medications.service.js';
import { resolveDateRange } from './date-range.js';
import { DoseLogsRepository } from './dose-logs.repository.js';
import type { DateRangeQueryDto } from './dto/date-range-query.dto.js';
import type {
  DoseSlotParams,
  MedicationParams,
} from './dto/dose-params.dto.js';
import type { RecordDoseDto } from './dto/record-dose.dto.js';
import type { DoseLog } from './entities/dose-log.entity.js';

/** Allowance for small differences between the phone's and server's clocks. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

@Injectable()
export class DosesService {
  constructor(
    private readonly medications: MedicationsService,
    private readonly repository: DoseLogsRepository,
    private readonly clock: Clock,
  ) {}

  /** Records (or corrects) what happened to one scheduled dose. */
  async record(slot: DoseSlotParams, dto: RecordDoseDto): Promise<DoseLog> {
    const medication = await this.medications.findOne(
      slot.patientId,
      slot.medicationId,
    );
    assertSlotIsScheduled(medication, slot);

    const now = this.clock.now();
    // Dates are the patient's local dates. Until patients have a timezone on
    // their profile, allow one day past the server's UTC date so patients
    // ahead of UTC can log today's doses.
    if (slot.date > addDays(toDateString(now), 1)) {
      throw new BadRequestException(
        'cannot log a dose that is scheduled in the future',
      );
    }

    const takenAt = this.resolveTakenAt(dto, now);
    const timestamp = now.toISOString();
    return this.repository.upsert({
      id: randomUUID(),
      medicationId: slot.medicationId,
      patientId: slot.patientId,
      scheduledDate: slot.date,
      scheduledTime: slot.time,
      status: dto.status,
      takenAt,
      note: dto.note?.trim() || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async list(
    params: MedicationParams,
    query: DateRangeQueryDto,
  ): Promise<DoseLog[]> {
    await this.medications.findOne(params.patientId, params.medicationId);
    const range = resolveDateRange(query, toDateString(this.clock.now()));
    return this.repository.find(params.patientId, {
      ...range,
      medicationId: params.medicationId,
    });
  }

  async remove(slot: DoseSlotParams): Promise<void> {
    await this.medications.findOne(slot.patientId, slot.medicationId);
    const deleted = await this.repository.delete(
      slot.patientId,
      slot.medicationId,
      slot.date,
      slot.time,
    );
    if (!deleted) {
      throw new NotFoundException(
        `No dose logged for ${slot.date} ${slot.time}`,
      );
    }
  }

  private resolveTakenAt(dto: RecordDoseDto, now: Date): string | null {
    if (dto.status === 'skipped') {
      if (dto.takenAt !== undefined) {
        throw new BadRequestException(
          'takenAt must not be set when a dose is skipped',
        );
      }
      return null;
    }

    if (dto.takenAt === undefined) return now.toISOString();
    const takenAt = new Date(dto.takenAt);
    if (takenAt.getTime() > now.getTime() + CLOCK_SKEW_MS) {
      throw new BadRequestException('takenAt must not be in the future');
    }
    return takenAt.toISOString();
  }
}

function assertSlotIsScheduled(
  medication: Medication,
  { date, time }: DoseSlotParams,
): void {
  if (!medication.timesOfDay.includes(time)) {
    throw new BadRequestException(
      `${time} is not a scheduled time for this medication (${medication.timesOfDay.join(', ')})`,
    );
  }
  if (
    date < medication.startDate ||
    (medication.endDate !== null && date > medication.endDate)
  ) {
    throw new BadRequestException(
      `${date} is outside this medication's treatment period`,
    );
  }
}
