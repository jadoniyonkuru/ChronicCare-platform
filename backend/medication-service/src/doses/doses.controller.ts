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
import { DosesService } from './doses.service.js';
import { DateRangeQueryDto } from './dto/date-range-query.dto.js';
import { DoseSlotParams, MedicationParams } from './dto/dose-params.dto.js';
import { RecordDoseDto } from './dto/record-dose.dto.js';
import type { DoseLog } from './entities/dose-log.entity.js';

@Controller('patients/:patientId/medications/:medicationId/doses')
export class DosesController {
  constructor(private readonly dosesService: DosesService) {}

  /** Idempotent: logging the same dose again replaces the earlier entry. */
  @Put(':date/:time')
  record(
    @Param() slot: DoseSlotParams,
    @Body() dto: RecordDoseDto,
  ): Promise<DoseLog> {
    return this.dosesService.record(slot, dto);
  }

  @Get()
  list(
    @Param() params: MedicationParams,
    @Query() query: DateRangeQueryDto,
  ): Promise<DoseLog[]> {
    return this.dosesService.list(params, query);
  }

  @Delete(':date/:time')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() slot: DoseSlotParams): Promise<void> {
    return this.dosesService.remove(slot);
  }
}
