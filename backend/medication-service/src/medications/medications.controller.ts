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
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateMedicationDto } from './dto/create-medication.dto.js';
import { UpdateMedicationDto } from './dto/update-medication.dto.js';
import { Medication } from './entities/medication.entity.js';
import { MedicationsService } from './medications.service.js';

// Every route needs an access token; PatientAccessGuard checks that the caller
// may access :patientId (patients: only themselves; providers: read-only).
@ApiTags('medications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired access token',
})
@ApiForbiddenResponse({
  description: "Not allowed to access this patient's data",
})
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
