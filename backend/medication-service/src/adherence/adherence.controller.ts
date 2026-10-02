import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DateRangeQueryDto } from '../doses/dto/date-range-query.dto.js';
import { AdherenceService } from './adherence.service.js';
import { AdherenceReport } from './entities/adherence-report.entity.js';

@ApiTags('adherence')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired access token',
})
@ApiForbiddenResponse({
  description: "Not allowed to access this patient's data",
})
@Controller('patients/:patientId/adherence')
export class AdherenceController {
  constructor(private readonly adherenceService: AdherenceService) {}

  /**
   * Adherence report across all of the patient's medications.
   *
   * @remarks Skipped and missed doses count against adherence. Today's doses only
   * count once logged. Defaults to the last 30 days.
   */
  @Get()
  @ApiBadRequestResponse({ description: 'Invalid patient id or date range' })
  report(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: DateRangeQueryDto,
  ): Promise<AdherenceReport> {
    return this.adherenceService.report(patientId, query);
  }
}
