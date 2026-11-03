import type { Category, CategorySlug } from '@/types';
import { compositeArt, productArt } from './art';

// Category content. Swap names, descriptions and art here to rebrand the catalogue.

export const CATEGORIES: Category[] = [
  {
    id: 'ceramics',
    slug: 'ceramics',
    name: { en: 'Ceramics' },
    description: {
      en: 'Wheel-thrown mugs, bowls and vases for slower, more meaningful days.',
    },
    image: {
      src: productArt({ kind: 'bowl', color: '#e9dfcc', seed: 'cat' }, 0),
      alt: { en: 'Speckled stoneware bowl on a wooden table' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'bowl', color: '#e9dfcc' }, x: 980, baseY: 360, scale: 0.75 },
      { spec: { kind: 'mug', color: '#e6d3b8' }, x: 1220, baseY: 368, scale: 0.85 },
      { spec: { kind: 'plates', color: '#e8dcc8' }, x: 1440, baseY: 372, scale: 0.6 },
    ], 'warm', 330),
  },
  {
    id: 'bags',
    slug: 'bags',
    name: { en: 'Bags' },
    description: {
      en: 'Woven, stitched and block-printed bags made to be carried every day.',
    },
    image: {
      src: productArt({ kind: 'basketBag', color: '#d2ae72', accent: '#8a5530', seed: 'cat' }, 0),
      alt: { en: 'Woven market basket bag with leather handles' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'basketBag', color: '#d2ae72', accent: '#8a5530' }, x: 1020, baseY: 372, scale: 0.68 },
      { spec: { kind: 'crossbody', color: '#a86b3c' }, x: 1280, baseY: 372, scale: 0.62 },
      { spec: { kind: 'clutch', color: '#f1e9da', accent: '#2f4a7a', pattern: 'print' }, x: 1470, baseY: 372, scale: 0.55 },
    ], 'sage', 330),
  },
  {
    id: 'jewellery',
    slug: 'jewellery',
    name: { en: 'Jewellery' },
    description: {
      en: 'Small-batch brass and silver pieces, hammered and finished by hand.',
    },
    image: {
      src: productArt({ kind: 'necklace', color: '#c9a04f', seed: 'cat' }, 0),
      alt: { en: 'Brass leaf pendant necklace laid on linen' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'candle', color: '#e7dccb', accent: '#8a5a3c' }, x: 1050, baseY: 372, scale: 0.8 },
      { spec: { kind: 'vase', color: '#ede6d8', accent: '#2f4a7a' }, x: 1300, baseY: 372, scale: 0.55 },
      { spec: { kind: 'bowl', color: '#d9c7a8' }, x: 1480, baseY: 372, scale: 0.5 },
    ], 'soft', 330),
  },
  {
    id: 'home-decor',
    slug: 'home-decor',
    name: { en: 'Home Decor' },
    description: {
      en: 'Lamps, cushions, candles and planters that make a house feel lived-in.',
    },
    image: {
      src: productArt({ kind: 'lamp', color: '#c49a63', seed: 'cat' }, 0),
      alt: { en: 'Rattan table lamp with a warm glow' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'planter', color: '#c46a43' }, x: 1000, baseY: 372, scale: 0.5 },
      { spec: { kind: 'lamp', color: '#c49a63' }, x: 1230, baseY: 372, scale: 0.72 },
      { spec: { kind: 'candle', color: '#c9cfc0', accent: '#5c6b4a' }, x: 1450, baseY: 372, scale: 0.7 },
    ], 'warm', 330),
  },
];

export const CATEGORY_BY_SLUG: Record<CategorySlug, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, Category>;

export function isCategorySlug(value: string | undefined): value is CategorySlug {
  return !!value && value in CATEGORY_BY_SLUG;
}

export const HERO_IMAGE = compositeArt(1600, 760, [
  { spec: { kind: 'vase', color: '#ede6d8', accent: '#2f4a7a', seed: 'hero' }, x: 1000, baseY: 600, scale: 0.92 },
  { spec: { kind: 'mug', color: '#e6d3b8', seed: 'hero' }, x: 1220, baseY: 612, scale: 1.0 },
  { spec: { kind: 'bowl', color: '#e9dfcc', seed: 'hero' }, x: 1420, baseY: 618, scale: 0.72 },
], 'warm', 560);

export const STORY_IMAGE = compositeArt(1200, 900, [
  { spec: { kind: 'planter', color: '#c46a43', seed: 'story' }, x: 330, baseY: 730, scale: 0.85 },
  { spec: { kind: 'vase', color: '#e9dfcc', accent: '#6f7d5c', seed: 'story' }, x: 640, baseY: 740, scale: 0.8 },
  { spec: { kind: 'bowl', color: '#a9b49a', seed: 'story' }, x: 920, baseY: 748, scale: 0.75 },
], 'sage', 680);

/** Replaces the bundled category list with the live one from the store API (names include
 *  translations for the shopper's language; new categories added in the admin appear too).
 *  Called once at startup; on failure the bundled list stays. */
export async function syncCategoriesFromApi(fetchLive: () => Promise<Category[]>): Promise<void> {
  try {
    const live = await fetchLive();
    if (!live.length) return;
    CATEGORIES.splice(0, CATEGORIES.length, ...live);
    for (const key of Object.keys(CATEGORY_BY_SLUG)) delete CATEGORY_BY_SLUG[key];
    for (const c of live) CATEGORY_BY_SLUG[c.slug] = c;
  } catch {
    /* keep bundled values */
  }
}
