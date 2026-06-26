const numberOfXforMasking = 6;
export function maskString(value: string | null): string {
  if (!value) return 'N/A';
  return 'x'.repeat(numberOfXforMasking);
}
