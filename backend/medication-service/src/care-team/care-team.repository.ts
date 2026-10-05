import { Injectable } from '@nestjs/common';
import type { CareTeamMember } from './entities/care-team-member.entity.js';

/** Storage boundary for care-team links between patients and providers. */
export abstract class CareTeamRepository {
  /** Adds the link, or returns the existing one unchanged. */
  abstract add(member: CareTeamMember): Promise<CareTeamMember>;
  abstract remove(patientId: string, providerId: string): Promise<boolean>;
  /** Oldest first. */
  abstract listForPatient(patientId: string): Promise<CareTeamMember[]>;
  /** Oldest first. */
  abstract listForProvider(providerId: string): Promise<CareTeamMember[]>;
  abstract isMember(patientId: string, providerId: string): Promise<boolean>;
}

@Injectable()
export class InMemoryCareTeamRepository extends CareTeamRepository {
  private readonly members = new Map<string, CareTeamMember>();

  async add(member: CareTeamMember): Promise<CareTeamMember> {
    const key = linkKey(member.patientId, member.providerId);
    const existing = this.members.get(key);
    if (existing) return { ...existing };
    this.members.set(key, { ...member });
    return { ...member };
  }

  async remove(patientId: string, providerId: string): Promise<boolean> {
    return this.members.delete(linkKey(patientId, providerId));
  }

  async listForPatient(patientId: string): Promise<CareTeamMember[]> {
    return this.list((m) => m.patientId === patientId);
  }

  async listForProvider(providerId: string): Promise<CareTeamMember[]> {
    return this.list((m) => m.providerId === providerId);
  }

  async isMember(patientId: string, providerId: string): Promise<boolean> {
    return this.members.has(linkKey(patientId, providerId));
  }

  private list(match: (m: CareTeamMember) => boolean): CareTeamMember[] {
    return [...this.members.values()]
      .filter(match)
      .sort((a, b) => a.addedAt.localeCompare(b.addedAt))
      .map((m) => ({ ...m }));
  }
}

function linkKey(patientId: string, providerId: string): string {
  return `${patientId}|${providerId}`;
}
