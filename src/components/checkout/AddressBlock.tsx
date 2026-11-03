import { getCountry } from '@/data/countries';
import { useCountries } from '@/hooks/useCountries';
import type { Address } from '@/types';

/** Formatted postal address (used in checkout review, order pages and the address book). */
export function AddressBlock({ address, showPhone = true }: { address: Address; showPhone?: boolean }) {
  const { nameOf } = useCountries();
  const dial = getCountry(address.phoneCountry)?.dialCode ?? '';
  const parts = [address.line1, address.line2, address.city, address.region, address.postalCode, nameOf(address.country)].filter(Boolean).join(', ');
  return (
    <address className="not-italic text-sm text-ink-soft">
      <span className="block font-semibold text-ink">{address.fullName}</span>
      <span className="block leading-snug">{parts}</span>
      {showPhone && address.phone && (
        <span className="block text-ink-muted">{dial} {address.phone}</span>
      )}
    </address>
  );
}
