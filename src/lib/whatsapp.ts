/** Mantém só dígitos; ex.: (11) 98765-4321 → 11987654321 */
export function normalizeWhatsappDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/** Pelo menos 10 dígitos (DDD + número BR ou formato internacional enxuto). */
export function isLikelyMobileDigits(digits: string): boolean {
  return digits.length >= 10 && digits.length <= 15;
}
