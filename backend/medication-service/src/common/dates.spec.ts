import {
  addDays,
  daysInclusive,
  maxDate,
  minDate,
  toDateString,
} from './dates.js';

describe('dates', () => {
  it('takes the UTC calendar date of a moment', () => {
    expect(toDateString(new Date('2026-09-26T23:30:00Z'))).toBe('2026-09-26');
    expect(toDateString(new Date('2026-09-27T01:00:00+02:00'))).toBe(
      '2026-09-26',
    );
  });

  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('is not affected by daylight saving changes', () => {
    // Europe and the US switch clocks around these dates.
    expect(daysInclusive('2026-03-01', '2026-03-31')).toBe(31);
    expect(daysInclusive('2026-10-20', '2026-11-10')).toBe(22);
  });

  it('counts days inclusively and never negative', () => {
    expect(daysInclusive('2026-09-01', '2026-09-01')).toBe(1);
    expect(daysInclusive('2026-09-01', '2026-09-30')).toBe(30);
    expect(daysInclusive('2026-09-02', '2026-09-01')).toBe(0);
  });

  it('picks the earliest and latest date', () => {
    expect(minDate('2026-09-05', '2026-08-31', '2026-09-01')).toBe(
      '2026-08-31',
    );
    expect(maxDate('2026-09-05', '2026-08-31', '2026-09-01')).toBe(
      '2026-09-05',
    );
  });
});
