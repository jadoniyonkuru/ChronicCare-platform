import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Clock } from '../common/clock.js';
import {
  InMemoryMedicationsRepository,
  MedicationsRepository,
} from '../medications/medications.repository.js';
import { MedicationsService } from '../medications/medications.service.js';
import {
  DoseLogsRepository,
  InMemoryDoseLogsRepository,
} from './dose-logs.repository.js';
import { DosesService } from './doses.service.js';
import type { DoseSlotParams } from './dto/dose-params.dto.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const OTHER_PATIENT = 'c2d4e6f8-1a3b-4c5d-8e7f-9a0b1c2d3e4f';
const NOW = new Date('2026-09-26T10:00:00.000Z');

describe('DosesService', () => {
  let doses: DosesService;
  let medicationId: string;

  const slot = (overrides: Partial<DoseSlotParams> = {}): DoseSlotParams => ({
    patientId: PATIENT,
    medicationId,
    date: '2026-09-25',
    time: '08:00',
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationsService,
        DosesService,
        { provide: Clock, useValue: { now: () => NOW } },
        {
          provide: MedicationsRepository,
          useClass: InMemoryMedicationsRepository,
        },
        { provide: DoseLogsRepository, useClass: InMemoryDoseLogsRepository },
      ],
    }).compile();

    doses = module.get(DosesService);
    const medication = await module.get(MedicationsService).create(PATIENT, {
      name: 'Metformin',
      dosage: '500 mg',
      timesOfDay: ['08:00', '20:00'],
      startDate: '2026-09-01',
      endDate: '2026-12-31',
    });
    medicationId = medication.id;
  });

  describe('record', () => {
    it('records a taken dose, defaulting takenAt to now', async () => {
      const log = await doses.record(slot(), { status: 'taken' });

      expect(log).toMatchObject({
        medicationId,
        patientId: PATIENT,
        scheduledDate: '2026-09-25',
        scheduledTime: '08:00',
        status: 'taken',
        takenAt: NOW.toISOString(),
        note: null,
      });
    });

    it('keeps an explicit takenAt, normalised to UTC', async () => {
      const log = await doses.record(slot(), {
        status: 'taken',
        takenAt: '2026-09-25T10:15:00+02:00',
      });

      expect(log.takenAt).toBe('2026-09-25T08:15:00.000Z');
    });

    it('records a skipped dose without takenAt', async () => {
      const log = await doses.record(slot(), {
        status: 'skipped',
        note: ' Felt nauseous ',
      });

      expect(log).toMatchObject({
        status: 'skipped',
        takenAt: null,
        note: 'Felt nauseous',
      });
    });

    it('replaces the earlier entry when the same dose is logged again', async () => {
      const first = await doses.record(slot(), { status: 'skipped' });

      const second = await doses.record(slot(), { status: 'taken' });

      expect(second.id).toBe(first.id);
      await expect(
        doses.list({ patientId: PATIENT, medicationId }, {}),
      ).resolves.toHaveLength(1);
    });

    it.each([
      ['a time that is not scheduled', { time: '09:00' }],
      ['a date before the treatment starts', { date: '2026-08-31' }],
      ['a date after the treatment ends', { date: '2027-01-01' }],
      ['a date more than a day in the future', { date: '2026-09-28' }],
    ])('rejects %s', async (_case, overrides) => {
      await expect(
        doses.record(slot(overrides), { status: 'taken' }),
      ).rejects.toThrow(BadRequestException);
    });

    it("accepts tomorrow's date for patients ahead of UTC", async () => {
      await expect(
        doses.record(slot({ date: '2026-09-27' }), {
          status: 'taken',
          takenAt: NOW.toISOString(),
        }),
      ).resolves.toMatchObject({ scheduledDate: '2026-09-27' });
    });

    it('rejects takenAt on a skipped dose', async () => {
      await expect(
        doses.record(slot(), {
          status: 'skipped',
          takenAt: '2026-09-25T08:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a takenAt in the future beyond clock skew', async () => {
      await expect(
        doses.record(slot(), {
          status: 'taken',
          takenAt: '2026-09-26T10:10:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        doses.record(slot(), {
          status: 'taken',
          takenAt: '2026-09-26T10:03:00Z',
        }),
      ).resolves.toBeDefined();
    });

    it("does not log doses for another patient's medication", async () => {
      await expect(
        doses.record(slot({ patientId: OTHER_PATIENT }), { status: 'taken' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('defaults to the last 30 days up to today', async () => {
      for (const date of ['2026-09-01', '2026-09-26', '2026-09-27']) {
        await doses.record(slot({ date }), { status: 'skipped' });
      }

      const logs = await doses.list({ patientId: PATIENT, medicationId }, {});

      // 2026-09-27 is after today (2026-09-26), so it is outside the default.
      expect(logs.map((l) => l.scheduledDate)).toEqual([
        '2026-09-01',
        '2026-09-26',
      ]);
    });

    it('uses an explicit range', async () => {
      for (const date of ['2026-09-01', '2026-09-10', '2026-09-20']) {
        await doses.record(slot({ date }), { status: 'skipped' });
      }

      const logs = await doses.list(
        { patientId: PATIENT, medicationId },
        { from: '2026-09-05', to: '2026-09-15' },
      );

      expect(logs.map((l) => l.scheduledDate)).toEqual(['2026-09-10']);
    });

    it('rejects a range where from is after to', async () => {
      await expect(
        doses.list(
          { patientId: PATIENT, medicationId },
          { from: '2026-09-20', to: '2026-09-10' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a range longer than a year', async () => {
      await expect(
        doses.list(
          { patientId: PATIENT, medicationId },
          { from: '2025-01-01', to: '2026-09-26' },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('undoes a logged dose', async () => {
      await doses.record(slot(), { status: 'taken' });

      await doses.remove(slot());

      await expect(
        doses.list({ patientId: PATIENT, medicationId }, {}),
      ).resolves.toEqual([]);
    });

    it('returns not found when nothing was logged', async () => {
      await expect(doses.remove(slot())).rejects.toThrow(NotFoundException);
    });
  });
});
