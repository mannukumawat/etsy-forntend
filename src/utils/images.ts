/**
 * Responsive product images.
 *
 * Product photos are served by the backend media mapper as either a Cloudinary
 * URL (`cloudinaryUrl`) or a local `/media/:id` URL (`media.mapper.ts`).
 * Only Cloudinary URLs can take width transforms — a transform is inserted
 * after `/image/upload/` (`w_<n>,c_scale,f_auto,q_auto`). Any other URL is
 * returned untouched as a plain `1x` srcset candidate: transform URLs must
 * never be fabricated for a host that does not understand them.
 */

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

/** True when the URL is a Cloudinary image URL that accepts transforms. */
export function isCloudinaryUrl(src: string): boolean {
  return CLOUDINARY_UPLOAD.test(src);
}

/**
 * The same image at a Cloudinary width, or `null` when the URL is not a
 * transformable Cloudinary URL — including one that already carries a
 * transform segment (never stack a second transform onto it).
 */
export function cloudinaryWidthUrl(src: string, width: number): string | null {
  const match = src.match(CLOUDINARY_UPLOAD);
  if (!match) return null;
  const [, prefix, rest] = match;
  const firstSegment = rest.split('/')[0];
  // A transform segment starts with a known Cloudinary transform key
  // (`w_400`, `c_fill`, or a comma-joined list of those); a version segment
  // (`v1234567890`) or a plain folder name is not a transform.
  const isTransform =
    firstSegment.includes(',') || /^(w|h|c|f|q|ar|g|dpr|e|a|b|o|r|t|fl|fn|pg|vs|bo|cs|d|dl)_[^/]+$/.test(firstSegment);
  if (isTransform) return null;
  return `${prefix}w_${width},c_scale,f_auto,q_auto/${rest}`;
}

export interface ResponsiveImage {
  /** Value for the `srcSet` attribute. Always present so callers are uniform. */
  srcSet: string;
  /** Value for the `sizes` attribute; only meaningful with `w` descriptors. */
  sizes?: string;
}

/**
 * Width-based srcset for a product image. Cloudinary URLs get one candidate
 * per width; every other URL gets a single `1x` candidate of the original,
 * so the browser still uses the exact URL the backend served.
 */
export function productImageSrcSet(src: string, widths: number[], sizes: string): ResponsiveImage {
  const candidates = widths
    .map((width) => {
      const url = cloudinaryWidthUrl(src, width);
      return url ? `${url} ${width}w` : null;
    })
    .filter((candidate): candidate is string => candidate !== null);
  if (!candidates.length) return { srcSet: `${src} 1x` };
  return { srcSet: candidates.join(', '), sizes };
}

/** Card-grid image: cards are ~50vw on phones, ~20vw on wide desktops. */
export const PRODUCT_CARD_WIDTHS = [400, 600, 800, 1200];
export const PRODUCT_CARD_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw';

/** Product-detail main image: full width on phones, about half the page on desktop. */
export const PRODUCT_GALLERY_WIDTHS = [600, 900, 1200, 1600];
export const PRODUCT_GALLERY_SIZES = '(max-width: 768px) 100vw, 50vw';
