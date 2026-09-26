import { randomUUID } from 'node:crypto';
import { InMemoryDoseLogsRepository } from './dose-logs.repository.js';
import type { DoseLog } from './entities/dose-log.entity.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const OTHER_PATIENT = 'c2d4e6f8-1a3b-4c5d-8e7f-9a0b1c2d3e4f';
const MEDICATION = '0b9e6c8a-2f4d-4e1a-9c3b-7d5e8f1a2b3c';

function doseLog(overrides: Partial<DoseLog> = {}): DoseLog {
  return {
    id: randomUUID(),
    medicationId: MEDICATION,
    patientId: PATIENT,
    scheduledDate: '2026-09-20',
    scheduledTime: '08:00',
    status: 'taken',
    takenAt: '2026-09-20T08:05:00.000Z',
    note: null,
    createdAt: '2026-09-20T08:05:00.000Z',
    updatedAt: '2026-09-20T08:05:00.000Z',
    ...overrides,
  };
}

describe('InMemoryDoseLogsRepository', () => {
  let repository: InMemoryDoseLogsRepository;

  beforeEach(() => {
    repository = new InMemoryDoseLogsRepository();
  });

  it('updates the existing log for the same slot, keeping id and createdAt', async () => {
    const first = await repository.upsert(doseLog());

    const second = await repository.upsert(
      doseLog({
        status: 'skipped',
        takenAt: null,
        updatedAt: '2026-09-20T09:00:00.000Z',
      }),
    );

    expect(second).toMatchObject({
      id: first.id,
      createdAt: first.createdAt,
      status: 'skipped',
    });
    await expect(
      repository.find(PATIENT, { from: '2026-09-20', to: '2026-09-20' }),
    ).resolves.toHaveLength(1);
  });

  it('refuses to overwrite a slot owned by another patient', async () => {
    await repository.upsert(doseLog());

    await expect(
      repository.upsert(doseLog({ patientId: OTHER_PATIENT })),
    ).rejects.toThrow();
  });

  it('filters by date range and medication, sorted by date then time', async () => {
    const otherMedication = randomUUID();
    await repository.upsert(doseLog({ scheduledTime: '20:00' }));
    await repository.upsert(doseLog({ scheduledTime: '08:00' }));
    await repository.upsert(doseLog({ scheduledDate: '2026-09-19' }));
    await repository.upsert(doseLog({ scheduledDate: '2026-09-25' }));
    await repository.upsert(doseLog({ medicationId: otherMedication }));

    const logs = await repository.find(PATIENT, {
      from: '2026-09-19',
      to: '2026-09-20',
      medicationId: MEDICATION,
    });

    expect(logs.map((l) => `${l.scheduledDate} ${l.scheduledTime}`)).toEqual([
      '2026-09-19 08:00',
      '2026-09-20 08:00',
      '2026-09-20 20:00',
    ]);
  });

  it("only deletes the patient's own log", async () => {
    await repository.upsert(doseLog());

    await expect(
      repository.delete(OTHER_PATIENT, MEDICATION, '2026-09-20', '08:00'),
    ).resolves.toBe(false);
    await expect(
      repository.delete(PATIENT, MEDICATION, '2026-09-20', '08:00'),
    ).resolves.toBe(true);
    await expect(
      repository.find(PATIENT, { from: '2026-09-20', to: '2026-09-20' }),
    ).resolves.toEqual([]);
  });
});
