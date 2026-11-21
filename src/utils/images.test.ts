import { describe, expect, it } from 'vitest';
import { cloudinaryWidthUrl, isCloudinaryUrl, productImageSrcSet } from './images';

const CLOUDINARY = 'https://res.cloudinary.com/demo/image/upload/v1710000000/rugs/kilim-1.jpg';
const CLOUDINARY_NO_VERSION = 'https://res.cloudinary.com/demo/image/upload/rugs/kilim-1.jpg';
const LOCAL = 'https://api.example.com/media/m_123';

describe('isCloudinaryUrl', () => {
  it('accepts Cloudinary image URLs', () => {
    expect(isCloudinaryUrl(CLOUDINARY)).toBe(true);
    expect(isCloudinaryUrl(CLOUDINARY_NO_VERSION)).toBe(true);
  });

  it('rejects local media URLs and other hosts', () => {
    expect(isCloudinaryUrl(LOCAL)).toBe(false);
    expect(isCloudinaryUrl('https://images.example.com/rugs/kilim-1.jpg')).toBe(false);
  });
});

describe('cloudinaryWidthUrl', () => {
  it('inserts a width transform after /upload/, keeping the version segment', () => {
    expect(cloudinaryWidthUrl(CLOUDINARY, 600)).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_600,c_scale,f_auto,q_auto/v1710000000/rugs/kilim-1.jpg',
    );
  });

  it('works without a version segment', () => {
    expect(cloudinaryWidthUrl(CLOUDINARY_NO_VERSION, 400)).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_400,c_scale,f_auto,q_auto/rugs/kilim-1.jpg',
    );
  });

  it('returns null for non-Cloudinary URLs instead of fabricating a transform', () => {
    expect(cloudinaryWidthUrl(LOCAL, 600)).toBeNull();
  });

  it('returns null when the URL already carries a transform', () => {
    expect(
      cloudinaryWidthUrl('https://res.cloudinary.com/demo/image/upload/w_300,c_scale/v1710000000/rugs/kilim-1.jpg', 600),
    ).toBeNull();
  });
});

describe('productImageSrcSet', () => {
  it('builds width candidates with sizes for Cloudinary URLs', () => {
    const { srcSet, sizes } = productImageSrcSet(CLOUDINARY, [400, 800], '(max-width: 640px) 50vw, 20vw');
    expect(srcSet).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_400,c_scale,f_auto,q_auto/v1710000000/rugs/kilim-1.jpg 400w, ' +
        'https://res.cloudinary.com/demo/image/upload/w_800,c_scale,f_auto,q_auto/v1710000000/rugs/kilim-1.jpg 800w',
    );
    expect(sizes).toBe('(max-width: 640px) 50vw, 20vw');
  });

  it('falls back to a plain 1x candidate for non-Cloudinary URLs', () => {
    const { srcSet, sizes } = productImageSrcSet(LOCAL, [400, 800], '(max-width: 640px) 50vw, 20vw');
    expect(srcSet).toBe(`${LOCAL} 1x`);
    expect(sizes).toBeUndefined();
  });
});
