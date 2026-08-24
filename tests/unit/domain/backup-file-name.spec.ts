import { describe, expect, it } from 'vitest';
import { buildBackupFileName } from '../../../src/domain/export/backup-file-name';

describe('backup file name', () => {
  it('carries the local export date and time', () => {
    const exportedAt = new Date(2026, 7, 25, 14, 30, 5).getTime();

    expect(buildBackupFileName(exportedAt)).toBe('mealzy-backup-2026-08-25-143005.json');
  });

  it('pads every component to a fixed width', () => {
    const exportedAt = new Date(2026, 0, 2, 3, 4, 9).getTime();

    expect(buildBackupFileName(exportedAt)).toBe('mealzy-backup-2026-01-02-030409.json');
  });

  it('distinguishes two exports taken in the same minute', () => {
    const first = buildBackupFileName(new Date(2026, 7, 25, 14, 30, 5).getTime());
    const second = buildBackupFileName(new Date(2026, 7, 25, 14, 30, 41).getTime());

    expect(first).not.toBe(second);
  });
});
