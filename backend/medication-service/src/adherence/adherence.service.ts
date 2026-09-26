import { Injectable } from '@nestjs/common';
import { Clock } from '../common/clock.js';
import { toDateString } from '../common/dates.js';
import { resolveDateRange } from '../doses/date-range.js';
import { DoseLogsRepository } from '../doses/dose-logs.repository.js';
import type { DateRangeQueryDto } from '../doses/dto/date-range-query.dto.js';
import { MedicationsService } from '../medications/medications.service.js';
import {
  type AdherenceReport,
  calculateAdherence,
} from './calculate-adherence.js';

@Injectable()
export class AdherenceService {
  constructor(
    private readonly medications: MedicationsService,
    private readonly doseLogs: DoseLogsRepository,
    private readonly clock: Clock,
  ) {}

  async report(
    patientId: string,
    query: DateRangeQueryDto,
  ): Promise<AdherenceReport> {
    const today = toDateString(this.clock.now());
    const range = resolveDateRange(query, today);

    const [medications, logs] = await Promise.all([
      this.medications.findAll(patientId),
      this.doseLogs.find(patientId, range),
    ]);

    return calculateAdherence({ medications, logs, ...range, today });
  }
}
