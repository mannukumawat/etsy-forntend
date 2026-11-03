import { z } from 'zod';
import { getCountry } from '@/data/countries';

// Zod schemas used by every form. Error messages are i18n keys, translated by <FieldError>.

export const emailField = z.string().trim().min(1, 'validation.required').email('validation.email').max(120, 'validation.tooLong');

export const passwordField = z
  .string()
  .min(8, 'validation.passwordMin')
  .max(72, 'validation.tooLong')
  .regex(/[A-Za-z]/, 'validation.passwordLetter')
  .regex(/\d/, 'validation.passwordNumber');

const phoneDigits = (v: string) => v.replace(/[\s\-().]/g, '');

export const phoneField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .refine((v) => /^\d{6,14}$/.test(phoneDigits(v)), 'validation.phone');

const optionalText = (max: number) => z.string().trim().max(max, 'validation.tooLong').optional().or(z.literal(''));

const addressShape = {
  fullName: z.string().trim().min(2, 'validation.fullName').max(80, 'validation.tooLong'),
  phoneCountry: z.string().min(2, 'validation.required'),
  phone: phoneField,
  country: z.string().min(2, 'validation.country'),
  line1: z.string().trim().min(3, 'validation.address').max(120, 'validation.tooLong'),
  line2: optionalText(120),
  city: optionalText(80),
  region: optionalText(80),
  postalCode: optionalText(12),
};

type AddressLike = { country: string; city?: string; region?: string; postalCode?: string };

/** Country-aware rules: which fields are required and how postal codes must look. */
export function refineAddress(data: AddressLike, ctx: z.RefinementCtx) {
  const country = getCountry(data.country);
  if (!country) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['country'], message: 'validation.country' });
    return;
  }
  const { format } = country;
  if (format.cityRequired && !data.city?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['city'], message: 'validation.required' });
  }
  if (format.region) {
    const region = data.region?.trim() ?? '';
    if (format.region.required && !region) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['region'], message: 'validation.required' });
    } else if (region && format.region.options && !format.region.options.includes(region)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['region'], message: 'validation.selectOption' });
    }
  }
  if (format.postal) {
    const postal = data.postalCode?.trim() ?? '';
    if (format.postal.required && !postal) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['postalCode'], message: 'validation.required' });
    } else if (postal && !format.postal.pattern.test(postal)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['postalCode'], message: 'validation.postal' });
    }
  }
}

export const addressSchema = z.object(addressShape).superRefine(refineAddress);
export type AddressFormValues = z.infer<typeof addressSchema>;

export const savedAddressSchema = z
  .object({
    ...addressShape,
    label: z.string().trim().min(1, 'validation.required').max(30, 'validation.tooLong'),
    isDefault: z.boolean(),
  })
  .superRefine(refineAddress);
export type SavedAddressFormValues = z.infer<typeof savedAddressSchema>;

export const checkoutDetailsSchema = z
  .object({
    email: emailField,
    marketing: z.boolean(),
    ...addressShape,
  })
  .superRefine(refineAddress);
export type CheckoutDetailsValues = z.infer<typeof checkoutDetailsSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'validation.required'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'validation.name').max(80, 'validation.tooLong'),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'validation.required'),
    acceptTerms: z.boolean().refine((v) => v, 'validation.acceptTerms'),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'validation.passwordMatch' });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotSchema = z.object({ email: emailField });
export type ForgotValues = z.infer<typeof forgotSchema>;

export const resetPasswordSchema = z
  .object({ password: passwordField, confirmPassword: z.string().min(1, 'validation.required') })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'validation.passwordMatch' });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'validation.name').max(80, 'validation.tooLong'),
  email: emailField,
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\+?\d{6,15}$/.test(phoneDigits(v)), 'validation.phone'),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const newsletterSchema = z.object({ email: emailField });
export type NewsletterValues = z.infer<typeof newsletterSchema>;

export const CONTACT_SUBJECTS = ['order', 'product', 'custom', 'other'] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'validation.name').max(80, 'validation.tooLong'),
  email: emailField,
  subject: z.enum(CONTACT_SUBJECTS, { errorMap: () => ({ message: 'validation.subject' }) }),
  orderNumber: z
    .string()
    .trim()
    .refine((v) => v === '' || /^YS-?\d{6}$/i.test(v), 'validation.orderNumber'),
  message: z.string().trim().min(10, 'validation.message').max(1000, 'validation.tooLong'),
});
export type ContactValues = z.infer<typeof contactSchema>;

export const trackSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .refine((v) => /^YS-?\d{6}$/i.test(v), 'validation.orderNumber'),
  email: emailField,
});
export type TrackValues = z.infer<typeof trackSchema>;

export const couponSchema = z.object({ code: z.string().trim().min(1, 'validation.required').max(30, 'validation.tooLong') });

/** Normalise "ys240117" / "YS-240117" to the canonical form. */
export function normalizeOrderNumber(v: string): string {
  const digits = v.replace(/\D/g, '');
  return `YS-${digits}`;
}
