import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DosesService } from './doses.service.js';
import { DateRangeQueryDto } from './dto/date-range-query.dto.js';
import { DoseSlotParams, MedicationParams } from './dto/dose-params.dto.js';
import { RecordDoseDto } from './dto/record-dose.dto.js';
import { DoseLog } from './entities/dose-log.entity.js';

@ApiTags('doses')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired access token',
})
@ApiForbiddenResponse({
  description: "Not allowed to access this patient's data",
})
@ApiBadRequestResponse({
  description:
    'Invalid ids, date, time or body, or a dose that is not scheduled',
})
@ApiNotFoundResponse({ description: 'Medication (or logged dose) not found' })
@Controller('patients/:patientId/medications/:medicationId/doses')
export class DosesController {
  constructor(private readonly dosesService: DosesService) {}

  /**
   * Record a scheduled dose as taken or skipped.
   *
   * @remarks Idempotent: logging the same dose again replaces the earlier entry.
   */
  @Put(':date/:time')
  record(
    @Param() slot: DoseSlotParams,
    @Body() dto: RecordDoseDto,
  ): Promise<DoseLog> {
    return this.dosesService.record(slot, dto);
  }

  /** List logged doses for a date range (default: the last 30 days). */
  @Get()
  list(
    @Param() params: MedicationParams,
    @Query() query: DateRangeQueryDto,
  ): Promise<DoseLog[]> {
    return this.dosesService.list(params, query);
  }

  /** Undo a logged dose. */
  @Delete(':date/:time')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() slot: DoseSlotParams): Promise<void> {
    return this.dosesService.remove(slot);
  }
}
