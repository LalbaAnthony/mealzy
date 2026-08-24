import type { IsoDate } from '../../types/identifiers';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const displayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(timestamp)) {
    return false;
  }
  return new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function compareIsoDates(left: IsoDate, right: IsoDate): number {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

export function formatIsoDateForDisplay(value: IsoDate): string {
  if (!isValidIsoDate(value)) {
    return value;
  }
  return displayFormatter.format(new Date(`${value}T00:00:00.000Z`));
}
