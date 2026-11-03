import { describe, expect, it } from 'vitest';
import { addressSchema, registerSchema } from './validation';

const base = { fullName: 'Asha Example', phoneCountry: 'IN', phone: '98765 43210', line1: '12 Sample Street', line2: '' };

function issues(values: Record<string, unknown>) {
  const r = addressSchema.safeParse({ ...base, ...values });
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('country-aware address validation', () => {
  it('India: requires state and a 6-digit PIN code', () => {
    expect(issues({ country: 'IN', city: 'Jaipur', region: 'Rajasthan', postalCode: '302006' })).toEqual({});
    expect(issues({ country: 'IN', city: 'Jaipur', region: '', postalCode: '30200' })).toEqual({
      region: 'validation.required',
      postalCode: 'validation.postal',
    });
  });

  it('United States: validates ZIP and state from the list', () => {
    expect(issues({ country: 'US', city: 'Austin', region: 'Texas', postalCode: '78701-1234' })).toEqual({});
    expect(issues({ country: 'US', city: 'Austin', region: 'Rajasthan', postalCode: '7870' })).toEqual({
      region: 'validation.selectOption',
      postalCode: 'validation.postal',
    });
  });

  it('UK: postcode required, county optional', () => {
    expect(issues({ country: 'GB', city: 'Leeds', postalCode: 'LS1 4AP' })).toEqual({});
    expect(issues({ country: 'GB', city: 'Leeds', postalCode: '' })).toEqual({ postalCode: 'validation.required' });
  });

  it('UAE: no postal code, emirate required; Singapore: city optional', () => {
    expect(issues({ country: 'AE', city: 'Dubai', region: 'Dubai' })).toEqual({});
    expect(issues({ country: 'SG', postalCode: '018956' })).toEqual({});
  });

  it('rejects bad phone numbers and unknown countries', () => {
    expect(issues({ country: 'ZZ', phone: '12' })).toMatchObject({ country: 'validation.country', phone: 'validation.phone' });
  });
});

describe('registration', () => {
  it('checks password strength and confirmation', () => {
    const r = registerSchema.safeParse({ name: 'A B', email: 'a@b.co', password: 'short', confirmPassword: 'other', acceptTerms: false });
    expect(r.success).toBe(false);
    const paths = r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['password', 'acceptTerms']));
  });
});
