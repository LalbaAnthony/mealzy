import type { SeedService, ServiceDependencies } from '../types/services';
import { writeSeedData } from './seed-writer';

export function createSeedService(dependencies: ServiceDependencies): SeedService {
  const { meta } = dependencies.repositories;

  return {
    async ensureSeeded(): Promise<void> {
      const storedVersion = await meta.getSchemaVersion();
      if (storedVersion !== null) {
        return;
      }

      await writeSeedData(dependencies);
      await meta.setSchemaVersion(dependencies.schemaVersion);
    },
  };
}
