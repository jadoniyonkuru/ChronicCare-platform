import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateMedicationDto } from './dto/create-medication.dto.js';
import {
  InMemoryMedicationsRepository,
  MedicationsRepository,
} from './medications.repository.js';
import { MedicationsService } from './medications.service.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const OTHER_PATIENT = 'c2d4e6f8-1a3b-4c5d-8e7f-9a0b1c2d3e4f';

const metformin = (): CreateMedicationDto => ({
  name: ' Metformin ',
  dosage: '500 mg',
  timesOfDay: ['20:00', '08:00'],
  instructions: 'Take with food',
  startDate: '2026-09-01',
});

describe('MedicationsService', () => {
  let service: MedicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationsService,
        {
          provide: MedicationsRepository,
          useClass: InMemoryMedicationsRepository,
        },
      ],
    }).compile();

    service = module.get(MedicationsService);
  });

  describe('create', () => {
    it('stores a normalised medication for the patient', async () => {
      const created = await service.create(PATIENT, metformin());

      expect(created).toMatchObject({
        patientId: PATIENT,
        name: 'Metformin',
        dosage: '500 mg',
        timesOfDay: ['08:00', '20:00'],
        instructions: 'Take with food',
        startDate: '2026-09-01',
        endDate: null,
      });
      expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(created.createdAt).toBe(created.updatedAt);
    });

    it('stores blank instructions as null', async () => {
      const created = await service.create(PATIENT, {
        ...metformin(),
        instructions: '   ',
      });

      expect(created.instructions).toBeNull();
    });

    it('rejects an end date before the start date', async () => {
      await expect(
        service.create(PATIENT, { ...metformin(), endDate: '2026-08-31' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts a single-day course', async () => {
      const created = await service.create(PATIENT, {
        ...metformin(),
        endDate: '2026-09-01',
      });

      expect(created.endDate).toBe('2026-09-01');
    });
  });

  describe('findAll', () => {
    it("returns only the patient's medications, sorted by name", async () => {
      await service.create(PATIENT, { ...metformin(), name: 'Lisinopril' });
      await service.create(PATIENT, metformin());
      await service.create(OTHER_PATIENT, { ...metformin(), name: 'Aspirin' });

      const result = await service.findAll(PATIENT);

      expect(result.map((m) => m.name)).toEqual(['Lisinopril', 'Metformin']);
    });
  });

  describe('findOne', () => {
    it("does not expose another patient's medication", async () => {
      const created = await service.create(PATIENT, metformin());

      await expect(service.findOne(OTHER_PATIENT, created.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('changes only the provided fields', async () => {
      const created = await service.create(PATIENT, metformin());

      const updated = await service.update(PATIENT, created.id, {
        dosage: '850 mg',
        timesOfDay: ['21:00', '07:30'],
      });

      expect(updated).toMatchObject({
        name: 'Metformin',
        dosage: '850 mg',
        timesOfDay: ['07:30', '21:00'],
        instructions: 'Take with food',
      });
      expect(updated.createdAt).toBe(created.createdAt);
    });

    it('clears the end date when sent null', async () => {
      const created = await service.create(PATIENT, {
        ...metformin(),
        endDate: '2026-12-31',
      });

      const updated = await service.update(PATIENT, created.id, {
        endDate: null,
      });

      expect(updated.endDate).toBeNull();
    });

    it('rejects null for required fields', async () => {
      const created = await service.create(PATIENT, metformin());

      await expect(
        service.update(PATIENT, created.id, {
          name: null as unknown as string,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('validates the date range against existing values', async () => {
      const created = await service.create(PATIENT, metformin());

      await expect(
        service.update(PATIENT, created.id, { endDate: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('does not persist a rejected update', async () => {
      const created = await service.create(PATIENT, metformin());

      await service
        .update(PATIENT, created.id, { endDate: '2026-01-01' })
        .catch(() => undefined);

      expect((await service.findOne(PATIENT, created.id)).endDate).toBeNull();
    });
  });

  describe('remove', () => {
    it('deletes the medication', async () => {
      const created = await service.create(PATIENT, metformin());

      await service.remove(PATIENT, created.id);

      await expect(service.findOne(PATIENT, created.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("cannot delete another patient's medication", async () => {
      const created = await service.create(PATIENT, metformin());

      await expect(service.remove(OTHER_PATIENT, created.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(PATIENT, created.id)).resolves.toBeDefined();
    });
  });
});
