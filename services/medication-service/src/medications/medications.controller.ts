import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateMedicationDto } from './dto/create-medication.dto.js';
import { UpdateMedicationDto } from './dto/update-medication.dto.js';
import type { Medication } from './entities/medication.entity.js';
import { MedicationsService } from './medications.service.js';

// Scoped by patient in the URL until auth-service exists; the patient id will
// then come from the authenticated user instead.
@Controller('patients/:patientId/medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Post()
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateMedicationDto,
  ): Promise<Medication> {
    return this.medicationsService.create(patientId, dto);
  }

  @Get()
  findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<Medication[]> {
    return this.medicationsService.findAll(patientId);
  }

  @Get(':id')
  findOne(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Medication> {
    return this.medicationsService.findOne(patientId, id);
  }

  @Patch(':id')
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicationDto,
  ): Promise<Medication> {
    return this.medicationsService.update(patientId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.medicationsService.remove(patientId, id);
  }
}
