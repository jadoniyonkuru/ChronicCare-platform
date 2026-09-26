import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { DateRangeQueryDto } from '../doses/dto/date-range-query.dto.js';
import { AdherenceService } from './adherence.service.js';
import type { AdherenceReport } from './calculate-adherence.js';

@Controller('patients/:patientId/adherence')
export class AdherenceController {
  constructor(private readonly adherenceService: AdherenceService) {}

  @Get()
  report(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: DateRangeQueryDto,
  ): Promise<AdherenceReport> {
    return this.adherenceService.report(patientId, query);
  }
}
