// Country and address-format configuration. Shipping zones and tax rates come from /api/settings.

import type { PublicShippingZone } from '@/api/types';

export type RegionLabel = 'state' | 'province' | 'county' | 'prefecture' | 'emirate' | 'stateTerritory' | 'region';
export type PostalLabel = 'zip' | 'postcode' | 'pinCode' | 'postalCode' | 'eircode';
export type CityLabel = 'city' | 'townCity' | 'suburb';

export interface AddressFormat {
  cityLabel: CityLabel;
  cityRequired: boolean;
  region: null | { label: RegionLabel; required: boolean; options?: string[] };
  postal: null | { label: PostalLabel; required: boolean; pattern: RegExp; example: string };
}

export interface CountryConfig {
  code: string;
  name: string;
  dialCode: string;
  /** Shipping zone id, populated from /api/settings. Null = we don't ship there. */
  zone: string | null;
  format: AddressFormat;
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

const IN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const CA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories',
  'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
];

const AU_STATES = [
  'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland', 'South Australia', 'Tasmania',
  'Victoria', 'Western Australia',
];

const AE_EMIRATES = ['Abu Dhabi', 'Ajman', 'Dubai', 'Fujairah', 'Ras Al Khaimah', 'Sharjah', 'Umm Al Quwain'];

const generic: AddressFormat = {
  cityLabel: 'city',
  cityRequired: true,
  region: { label: 'region', required: false },
  postal: { label: 'postalCode', required: false, pattern: /^[A-Za-z0-9 -]{2,10}$/, example: '' },
};

const fiveDigit = (label: PostalLabel, example: string): AddressFormat['postal'] => ({
  label,
  required: true,
  pattern: /^\d{5}$/,
  example,
});

export const COUNTRIES: CountryConfig[] = [
  {
    code: 'IN', name: 'India', dialCode: '+91', zone: null,
    format: {
      cityLabel: 'city', cityRequired: true,
      region: { label: 'state', required: true, options: IN_STATES },
      postal: { label: 'pinCode', required: true, pattern: /^[1-9]\d{5}$/, example: '302001' },
    },
  },
  {
    code: 'US', name: 'United States', dialCode: '+1', zone: null,
    format: {
      cityLabel: 'city', cityRequired: true,
      region: { label: 'state', required: true, options: US_STATES },
      postal: { label: 'zip', required: true, pattern: /^\d{5}(-\d{4})?$/, example: '94107' },
    },
  },
  {
    code: 'CA', name: 'Canada', dialCode: '+1', zone: null,
    format: {
      cityLabel: 'city', cityRequired: true,
      region: { label: 'province', required: true, options: CA_PROVINCES },
      postal: { label: 'postalCode', required: true, pattern: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/, example: 'M5V 2T6' },
    },
  },
  {
    code: 'GB', name: 'United Kingdom', dialCode: '+44', zone: null,
    format: {
      cityLabel: 'townCity', cityRequired: true,
      region: { label: 'county', required: false },
      postal: { label: 'postcode', required: true, pattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/, example: 'SW1A 1AA' },
    },
  },
  {
    code: 'IE', name: 'Ireland', dialCode: '+353', zone: null,
    format: {
      cityLabel: 'townCity', cityRequired: true,
      region: { label: 'county', required: true },
      postal: { label: 'eircode', required: false, pattern: /^[A-Za-z]\d[\dWw] ?[A-Za-z\d]{4}$/, example: 'D02 X285' },
    },
  },
  { code: 'DE', name: 'Germany', dialCode: '+49', zone: null, format: { cityLabel: 'city', cityRequired: true, region: null, postal: fiveDigit('postalCode', '10115') } },
  { code: 'FR', name: 'France', dialCode: '+33', zone: null, format: { cityLabel: 'city', cityRequired: true, region: null, postal: fiveDigit('postalCode', '75001') } },
  { code: 'ES', name: 'Spain', dialCode: '+34', zone: null, format: { cityLabel: 'city', cityRequired: true, region: { label: 'province', required: false }, postal: fiveDigit('postalCode', '28013') } },
  { code: 'IT', name: 'Italy', dialCode: '+39', zone: null, format: { cityLabel: 'city', cityRequired: true, region: { label: 'province', required: false }, postal: fiveDigit('postalCode', '00184') } },
  {
    code: 'NL', name: 'Netherlands', dialCode: '+31', zone: null,
    format: { cityLabel: 'city', cityRequired: true, region: null, postal: { label: 'postalCode', required: true, pattern: /^\d{4} ?[A-Za-z]{2}$/, example: '1012 AB' } },
  },
  {
    code: 'AU', name: 'Australia', dialCode: '+61', zone: null,
    format: {
      cityLabel: 'suburb', cityRequired: true,
      region: { label: 'stateTerritory', required: true, options: AU_STATES },
      postal: { label: 'postcode', required: true, pattern: /^\d{4}$/, example: '2000' },
    },
  },
  {
    code: 'NZ', name: 'New Zealand', dialCode: '+64', zone: null,
    format: { cityLabel: 'townCity', cityRequired: true, region: { label: 'region', required: false }, postal: { label: 'postcode', required: true, pattern: /^\d{4}$/, example: '6011' } },
  },
  {
    code: 'JP', name: 'Japan', dialCode: '+81', zone: null,
    format: { cityLabel: 'city', cityRequired: true, region: { label: 'prefecture', required: true }, postal: { label: 'postalCode', required: true, pattern: /^\d{3}-?\d{4}$/, example: '100-0001' } },
  },
  {
    code: 'SG', name: 'Singapore', dialCode: '+65', zone: null,
    format: { cityLabel: 'city', cityRequired: false, region: null, postal: { label: 'postalCode', required: true, pattern: /^\d{6}$/, example: '018956' } },
  },
  {
    code: 'AE', name: 'United Arab Emirates', dialCode: '+971', zone: null,
    format: { cityLabel: 'city', cityRequired: true, region: { label: 'emirate', required: true, options: AE_EMIRATES }, postal: null },
  },
  {
    code: 'HK', name: 'Hong Kong', dialCode: '+852', zone: null,
    format: { cityLabel: 'city', cityRequired: false, region: { label: 'region', required: true, options: ['Hong Kong Island', 'Kowloon', 'New Territories'] }, postal: null },
  },
  { code: 'BR', name: 'Brazil', dialCode: '+55', zone: null, format: generic },
  { code: 'MX', name: 'Mexico', dialCode: '+52', zone: null, format: generic },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', zone: null, format: generic },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', zone: null, format: generic },
];

export const COUNTRY_BY_CODE: Record<string, CountryConfig> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string | undefined | null): CountryConfig | undefined {
  return code ? COUNTRY_BY_CODE[code] : undefined;
}

// --- Shipping zones from /api/settings -----------------------------------------------------------

export let SHIPPING_ZONES: PublicShippingZone[] = [];

/** Country → zone lookup, rebuilt when settings sync. */
let countryZoneMap: Record<string, PublicShippingZone> = {};

export function getCountryZone(countryCode: string | undefined | null): PublicShippingZone | undefined {
  return countryCode ? countryZoneMap[countryCode] : undefined;
}

export function isShippingSupported(countryCode: string | undefined | null): boolean {
  return !!getCountryZone(countryCode);
}

/** Called by initSiteSettings after /api/settings resolves. */
export function syncShippingFromSettings(shipping: { zones: PublicShippingZone[] }) {
  SHIPPING_ZONES = shipping.zones;
  countryZoneMap = {};
  for (const zone of shipping.zones) {
    for (const cc of zone.countries) {
      countryZoneMap[cc] = zone;
    }
  }
  for (const c of COUNTRIES) {
    c.zone = countryZoneMap[c.code]?.id ?? null;
  }
  for (const [code, c] of Object.entries(COUNTRY_BY_CODE)) {
    c.zone = countryZoneMap[code]?.id ?? null;
  }
}
