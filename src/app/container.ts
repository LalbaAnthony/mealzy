import type { AppServices } from '../types/container';

let configuredServices: AppServices | null = null;

export function configureServices(services: AppServices): void {
  configuredServices = services;
}

export function useServices(): AppServices {
  if (configuredServices === null) {
    throw new Error(
      'The service container has not been configured. Call configureServices before rendering the application.',
    );
  }
  return configuredServices;
}

export function resetServices(): void {
  configuredServices = null;
}
