import type { EpochMillis } from '../../types/identifiers';

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

export function buildBackupFileName(exportedAt: EpochMillis): string {
  const date = new Date(exportedAt);
  const day = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
  const time = `${pad(date.getHours(), 2)}${pad(date.getMinutes(), 2)}${pad(date.getSeconds(), 2)}`;
  return `mealzy-backup-${day}-${time}.json`;
}
