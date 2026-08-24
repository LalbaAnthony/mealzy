export function assertSchemaMatchesDeclaredType<TAssertion extends true>(
  assertion: TAssertion,
): TAssertion {
  return assertion;
}
