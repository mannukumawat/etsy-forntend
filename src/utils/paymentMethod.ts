/**
 * Maps a payment-method value to its i18n label key.
 *
 * Cash on Delivery was removed from checkout, so no new order can carry
 * 'cod'. Orders placed before the removal may still return 'cod' from the
 * backend (legacy data); those must not crash the order pages and must never
 * be shown as Cash on Delivery again. Any unknown or legacy value therefore
 * falls back to the generic 'Prepaid' label.
 */
export function paymentMethodLabelKey(method: string): string {
  switch (method) {
    case 'card':
      return 'checkout.paymentMethods.card';
    case 'upi':
      return 'checkout.paymentMethods.upi';
    case 'wallet':
      return 'checkout.paymentMethods.wallet';
    default:
      return 'checkout.paymentMethods.prepaid';
  }
}
