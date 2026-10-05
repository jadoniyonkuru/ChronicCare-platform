import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InMemoryCareTeamRepository } from './care-team.repository.js';
import { CareTeamService } from './care-team.service.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const OTHER_PATIENT = 'c2d4e6f8-1a3b-4c5d-8e7f-9a0b1c2d3e4f';
const PROVIDER = '7b1d9e2f-3c4a-4b5d-8e6f-0a1b2c3d4e5f';
const OTHER_PROVIDER = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

describe('CareTeamService', () => {
  let repository: InMemoryCareTeamRepository;
  let careTeam: CareTeamService;
  let now: Date;

  beforeEach(() => {
    repository = new InMemoryCareTeamRepository();
    now = new Date('2026-10-05T09:00:00.000Z');
    careTeam = new CareTeamService(repository, { now: () => now });
  });

  it('adds a provider with the current time', async () => {
    await expect(careTeam.add(PATIENT, PROVIDER)).resolves.toEqual({
      patientId: PATIENT,
      providerId: PROVIDER,
      addedAt: '2026-10-05T09:00:00.000Z',
    });
    await expect(repository.isMember(PATIENT, PROVIDER)).resolves.toBe(true);
  });

  it('keeps the original date when a provider is added twice', async () => {
    await careTeam.add(PATIENT, PROVIDER);
    now = new Date('2026-10-06T09:00:00.000Z');

    const again = await careTeam.add(PATIENT, PROVIDER);

    expect(again.addedAt).toBe('2026-10-05T09:00:00.000Z');
    await expect(careTeam.list(PATIENT)).resolves.toHaveLength(1);
  });

  it('refuses to add the patient to their own care team', () => {
    expect(() => careTeam.add(PATIENT, PATIENT)).toThrow(BadRequestException);
  });

  it('lists links in the order they were added', async () => {
    await careTeam.add(PATIENT, PROVIDER);
    now = new Date('2026-10-06T09:00:00.000Z');
    await careTeam.add(PATIENT, OTHER_PROVIDER);
    await careTeam.add(OTHER_PATIENT, PROVIDER);

    const team = await careTeam.list(PATIENT);
    const patients = await careTeam.patientsOf(PROVIDER);

    expect(team.map((m) => m.providerId)).toEqual([PROVIDER, OTHER_PROVIDER]);
    expect(patients.map((m) => m.patientId)).toEqual([PATIENT, OTHER_PATIENT]);
  });

  it('revokes access immediately and reports unknown links', async () => {
    await careTeam.add(PATIENT, PROVIDER);

    await careTeam.remove(PATIENT, PROVIDER);

    await expect(repository.isMember(PATIENT, PROVIDER)).resolves.toBe(false);
    await expect(careTeam.remove(PATIENT, PROVIDER)).rejects.toThrow(
      NotFoundException,
    );
  });
});
