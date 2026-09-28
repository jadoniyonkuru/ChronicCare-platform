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
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateMedicationDto } from './dto/create-medication.dto.js';
import { UpdateMedicationDto } from './dto/update-medication.dto.js';
import { Medication } from './entities/medication.entity.js';
import { MedicationsService } from './medications.service.js';

// Scoped by patient in the URL until auth-service exists; the patient id will
// then come from the authenticated user instead.
@ApiTags('medications')
@ApiBadRequestResponse({ description: 'Invalid id or request body' })
@Controller('patients/:patientId/medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  /** Add a medication to the patient's schedule. */
  @Post()
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateMedicationDto,
  ): Promise<Medication> {
    return this.medicationsService.create(patientId, dto);
  }

  /** List the patient's medications, sorted by name. */
  @Get()
  findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<Medication[]> {
    return this.medicationsService.findAll(patientId);
  }

  /** Get one medication. */
  @Get(':id')
  @ApiNotFoundResponse({ description: 'Medication not found' })
  findOne(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Medication> {
    return this.medicationsService.findOne(patientId, id);
  }

  /** Change some fields of a medication; send `endDate: null` to make it ongoing. */
  @Patch(':id')
  @ApiNotFoundResponse({ description: 'Medication not found' })
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicationDto,
  ): Promise<Medication> {
    return this.medicationsService.update(patientId, id, dto);
  }

  /** Remove a medication and all of its dose logs. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNotFoundResponse({ description: 'Medication not found' })
  remove(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.medicationsService.remove(patientId, id);
  }
}
