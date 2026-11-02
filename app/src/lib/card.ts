/** UI-23 / NFR-9: the demo accepts only the test card number. Real card numbers are refused, never stored. */
export const TEST_CARD = '4242424242424242';

export function isTestCard(number: string): boolean {
  return number.replace(/[\s-]/g, '') === TEST_CARD;
}
