import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Clock } from '../common/clock.js';
import { CareTeamRepository } from './care-team.repository.js';
import type { CareTeamMember } from './entities/care-team-member.entity.js';

@Injectable()
export class CareTeamService {
  constructor(
    private readonly repository: CareTeamRepository,
    private readonly clock: Clock,
  ) {}

  /** Allows a provider to read the patient's data. Adding twice is a no-op. */
  add(patientId: string, providerId: string): Promise<CareTeamMember> {
    if (patientId === providerId) {
      throw new BadRequestException(
        'A patient cannot add themselves to their care team',
      );
    }
    return this.repository.add({
      patientId,
      providerId,
      addedAt: this.clock.now().toISOString(),
    });
  }

  list(patientId: string): Promise<CareTeamMember[]> {
    return this.repository.listForPatient(patientId);
  }

  /** Revokes the provider's access immediately. */
  async remove(patientId: string, providerId: string): Promise<void> {
    if (!(await this.repository.remove(patientId, providerId))) {
      throw new NotFoundException(
        `Provider ${providerId} is not on this care team`,
      );
    }
  }

  patientsOf(providerId: string): Promise<CareTeamMember[]> {
    return this.repository.listForProvider(providerId);
  }
}
