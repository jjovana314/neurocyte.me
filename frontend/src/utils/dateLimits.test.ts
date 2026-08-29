import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nowDateTimeLocalString, todayDateString } from './dateLimits';

describe('dateLimits', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('todayDateString returns a bare YYYY-MM-DD value', () => {
    expect(todayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('nowDateTimeLocalString returns a YYYY-MM-DDTHH:mm value usable by datetime-local inputs', () => {
    expect(nowDateTimeLocalString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('nowDateTimeLocalString starts with the current local date', () => {
    expect(nowDateTimeLocalString().slice(0, 10)).toBe(todayDateString());
  });

  describe('with a fixed clock', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Pick an instant that is the same calendar day/time in UTC and in
      // timezones behind UTC, so the local-shift arithmetic is observable.
      vi.setSystemTime(new Date('2026-08-30T12:34:56Z'));
    });

    it('reflects the local wall-clock date and minute', () => {
      const offsetMinutes = new Date().getTimezoneOffset();
      const expected = new Date(Date.UTC(2026, 7, 30, 12, 34, 56) - offsetMinutes * 60000)
        .toISOString()
        .slice(0, 16);
      expect(nowDateTimeLocalString()).toBe(expected);
      expect(todayDateString()).toBe(expected.slice(0, 10));
    });
  });
});
