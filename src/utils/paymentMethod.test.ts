import { describe, expect, it } from 'vitest';
import { paymentMethodLabelKey } from './paymentMethod';

describe('paymentMethodLabelKey', () => {
  it('maps the supported methods to their labels', () => {
    expect(paymentMethodLabelKey('card')).toBe('checkout.paymentMethods.card');
    expect(paymentMethodLabelKey('upi')).toBe('checkout.paymentMethods.upi');
    expect(paymentMethodLabelKey('wallet')).toBe('checkout.paymentMethods.wallet');
  });

  it('maps a legacy COD order to the generic Prepaid label, never to COD', () => {
    expect(paymentMethodLabelKey('cod')).toBe('checkout.paymentMethods.prepaid');
  });

  it('maps any unknown method to the generic Prepaid label', () => {
    expect(paymentMethodLabelKey('something-else')).toBe('checkout.paymentMethods.prepaid');
  });
});
