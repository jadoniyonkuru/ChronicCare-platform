import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { type AuthenticatedUser, CurrentUser } from '../auth/auth.guards.js';
import { CareTeamService } from './care-team.service.js';
import { AddCareTeamMemberDto } from './dto/add-care-team-member.dto.js';
import { CareTeamMember } from './entities/care-team-member.entity.js';

// PatientAccessGuard lets the patient manage this, and lets linked providers
// read it. Providers cannot add or remove links.
@ApiTags('care team')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired access token',
})
@ApiForbiddenResponse({
  description: "Not allowed to access this patient's care team",
})
@ApiBadRequestResponse({ description: 'Invalid id' })
@Controller('patients/:patientId/care-team')
export class CareTeamController {
  constructor(private readonly careTeam: CareTeamService) {}

  /** Allow a provider to read this patient's medication data. */
  @Post()
  add(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: AddCareTeamMemberDto,
  ): Promise<CareTeamMember> {
    return this.careTeam.add(patientId, dto.providerId);
  }

  /** The providers who can read this patient's data. */
  @Get()
  list(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<CareTeamMember[]> {
    return this.careTeam.list(patientId);
  }

  /** Revoke a provider's access, effective immediately. */
  @Delete(':providerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNotFoundResponse({ description: 'Provider is not on this care team' })
  remove(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('providerId', ParseUUIDPipe) providerId: string,
  ): Promise<void> {
    return this.careTeam.remove(patientId, providerId);
  }
}

@ApiTags('care team')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired access token',
})
@ApiForbiddenResponse({ description: 'Only the provider themselves' })
@Controller('providers/:providerId/patients')
export class ProviderPatientsController {
  constructor(private readonly careTeam: CareTeamService) {}

  /** The patients who have added this provider to their care team. */
  @Get()
  list(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CareTeamMember[]> {
    if (user.role !== 'provider' || user.id !== providerId) {
      throw new ForbiddenException(
        'Providers can only list their own patients',
      );
    }
    return this.careTeam.patientsOf(providerId);
  }
}
