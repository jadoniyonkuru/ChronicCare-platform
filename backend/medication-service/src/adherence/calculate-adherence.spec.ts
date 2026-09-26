import type { DoseLog, DoseStatus } from '../doses/entities/dose-log.entity.js';
import type { Medication } from '../medications/entities/medication.entity.js';
import { calculateAdherence } from './calculate-adherence.js';

const TODAY = '2026-09-26';

function medication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'med-1',
    patientId: 'patient-1',
    name: 'Metformin',
    dosage: '500 mg',
    timesOfDay: ['08:00', '20:00'],
    instructions: null,
    startDate: '2026-09-01',
    endDate: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

function log(
  scheduledDate: string,
  scheduledTime: string,
  status: DoseStatus = 'taken',
  medicationId = 'med-1',
): DoseLog {
  return {
    id: `${medicationId}-${scheduledDate}-${scheduledTime}`,
    medicationId,
    patientId: 'patient-1',
    scheduledDate,
    scheduledTime,
    status,
    takenAt:
      status === 'taken' ? `${scheduledDate}T${scheduledTime}:00Z` : null,
    note: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };
}

/** Logs every scheduled dose on each day in [from, to] as taken. */
function allTaken(from: string, to: string, times = ['08:00', '20:00']) {
  const logs: DoseLog[] = [];
  for (
    let d = new Date(from);
    d <= new Date(to);
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    for (const time of times)
      logs.push(log(d.toISOString().slice(0, 10), time));
  }
  return logs;
}

describe('calculateAdherence', () => {
  it('is 100% when every due dose was taken', () => {
    const report = calculateAdherence({
      medications: [medication()],
      logs: allTaken('2026-09-20', '2026-09-25'),
      from: '2026-09-20',
      to: '2026-09-25',
      today: TODAY,
    });

    expect(report).toMatchObject({
      due: 12,
      taken: 12,
      skipped: 0,
      missed: 0,
      pending: 0,
      adherencePercent: 100,
    });
  });

  it('counts unlogged past doses as missed and skipped doses against adherence', () => {
    const report = calculateAdherence({
      medications: [medication()],
      logs: [
        log('2026-09-24', '08:00'),
        log('2026-09-24', '20:00', 'skipped'),
        log('2026-09-25', '08:00'),
      ],
      from: '2026-09-24',
      to: '2026-09-25',
      today: TODAY,
    });

    expect(report).toMatchObject({
      due: 4,
      taken: 2,
      skipped: 1,
      missed: 1,
      adherencePercent: 50,
    });
  });

  it("treats today's unlogged doses as pending, not missed", () => {
    const report = calculateAdherence({
      medications: [medication()],
      logs: [log(TODAY, '08:00')],
      from: TODAY,
      to: TODAY,
      today: TODAY,
    });

    expect(report).toMatchObject({
      due: 1,
      taken: 1,
      missed: 0,
      pending: 1,
      adherencePercent: 100,
    });
  });

  it('ignores days after today', () => {
    const report = calculateAdherence({
      medications: [medication()],
      logs: [log('2026-09-25', '08:00'), log('2026-09-25', '20:00')],
      from: '2026-09-25',
      to: '2026-10-31',
      today: TODAY,
    });

    expect(report).toMatchObject({ due: 2, missed: 0, pending: 2 });
  });

  it('only counts days within the treatment period', () => {
    const report = calculateAdherence({
      medications: [
        medication({ startDate: '2026-09-10', endDate: '2026-09-12' }),
      ],
      logs: [],
      from: '2026-09-01',
      to: '2026-09-25',
      today: TODAY,
    });

    // 3 days x 2 doses, all missed.
    expect(report).toMatchObject({ due: 6, missed: 6, adherencePercent: 0 });
  });

  it('ignores logs for times no longer in the schedule', () => {
    const report = calculateAdherence({
      medications: [medication({ timesOfDay: ['08:00'] })],
      logs: [log('2026-09-25', '08:00'), log('2026-09-25', '20:00')],
      from: '2026-09-25',
      to: '2026-09-25',
      today: TODAY,
    });

    expect(report).toMatchObject({ due: 1, taken: 1, adherencePercent: 100 });
  });

  it('reports null adherence when nothing was due', () => {
    const report = calculateAdherence({
      medications: [medication({ startDate: '2026-10-01' })],
      logs: [],
      from: '2026-09-01',
      to: '2026-09-25',
      today: TODAY,
    });

    expect(report).toMatchObject({ due: 0, adherencePercent: null });
    expect(report.medications[0].adherencePercent).toBeNull();
  });

  it('weights the overall figure by doses, not by medication', () => {
    const report = calculateAdherence({
      medications: [
        // 2 doses a day, both taken on 2026-09-25.
        medication(),
        // 1 dose a day, missed on 2026-09-25.
        medication({ id: 'med-2', name: 'Lisinopril', timesOfDay: ['09:00'] }),
      ],
      logs: allTaken('2026-09-25', '2026-09-25'),
      from: '2026-09-25',
      to: '2026-09-25',
      today: TODAY,
    });

    expect(report.medications.map((m) => m.adherencePercent)).toEqual([100, 0]);
    // 2 of 3 doses taken, not the 50% average of the two medications.
    expect(report).toMatchObject({ due: 3, taken: 2, adherencePercent: 66.7 });
  });

  it('echoes the requested range', () => {
    const report = calculateAdherence({
      medications: [],
      logs: [],
      from: '2026-09-01',
      to: '2026-09-30',
      today: TODAY,
    });

    expect(report).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
      due: 0,
      taken: 0,
      skipped: 0,
      missed: 0,
      pending: 0,
      adherencePercent: null,
      medications: [],
    });
  });
});
