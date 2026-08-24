import type { DomainError, DomainErrorCode, DomainResult } from '../../types/validation';

export function ok<TValue>(value: TValue): DomainResult<TValue> {
  return { ok: true, value };
}

export function fail<TValue>(
  code: DomainErrorCode,
  message: string,
  details: readonly string[],
): DomainResult<TValue> {
  return { ok: false, error: { code, message, details } };
}

export function domainError(
  code: DomainErrorCode,
  message: string,
  details: readonly string[],
): DomainError {
  return { code, message, details };
}
