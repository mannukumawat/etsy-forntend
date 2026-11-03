import type { Category, CategorySlug } from '@/types';
import { compositeArt, productArt } from './art';

// Category content for Dignity ArtEdge — handmade rugs and home décor.

export const CATEGORIES: Category[] = [
  {
    id: 'kilim-rugs',
    slug: 'kilim-rugs',
    name: { en: 'Kilim Rugs' },
    description: {
      en: 'Handwoven flatweave Kilim rugs crafted from wool and jute. Geometric diamonds, zigzags and traditional Rajasthani motifs in warm neutral and earthy tones.',
    },
    image: {
      src: productArt({ kind: 'macrame', color: '#c2846e', accent: '#5a3a2e', seed: 'kilim' }, 0),
      alt: { en: 'Handwoven Kilim rug with geometric pattern' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'macrame', color: '#c2846e', accent: '#5a3a2e' }, x: 900, baseY: 360, scale: 0.9 },
      { spec: { kind: 'cushion', color: '#d4705a', accent: '#8a3820' }, x: 1250, baseY: 372, scale: 0.7 },
      { spec: { kind: 'macrame', color: '#b87a5c', accent: '#4a2e22' }, x: 1470, baseY: 368, scale: 0.75 },
    ], 'warm', 330),
  },
  {
    id: 'wool-jute-runners',
    slug: 'wool-jute-runners',
    name: { en: 'Wool & Jute Runners' },
    description: {
      en: 'Long narrow runners handwoven from wool and jute. Perfect for hallways, corridors and staircases. Bohemian stripes and Kilim patterns in natural earthy colours.',
    },
    image: {
      src: productArt({ kind: 'macrame', color: '#8e6b52', accent: '#c49268', seed: 'runner' }, 0),
      alt: { en: 'Handwoven wool and jute runner for hallway' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'macrame', color: '#8e6b52', accent: '#c49268' }, x: 960, baseY: 360, scale: 0.85 },
      { spec: { kind: 'macrame', color: '#7a5a42', accent: '#b88060' }, x: 1280, baseY: 370, scale: 0.7 },
    ], 'warm', 330),
  },
  {
    id: 'kilim-benches',
    slug: 'kilim-benches',
    name: { en: 'Kilim Benches' },
    description: {
      en: 'Handcrafted wooden benches upholstered in authentic Kilim fabric. Rustic farmhouse style with bold geometric textile patterns.',
    },
    image: {
      src: productArt({ kind: 'lamp', color: '#b86a48', accent: '#5a3020', seed: 'bench' }, 0),
      alt: { en: 'Kilim upholstered wooden bench' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'lamp', color: '#b86a48', accent: '#5a3020' }, x: 1020, baseY: 368, scale: 0.8 },
      { spec: { kind: 'cushion', color: '#c8845a' }, x: 1300, baseY: 372, scale: 0.65 },
    ], 'warm', 330),
  },
  {
    id: 'cotton-yoga-mats',
    slug: 'cotton-yoga-mats',
    name: { en: 'Cotton Yoga Mats' },
    description: {
      en: 'Woven cotton yoga mats made for mindful practice. Natural, non-synthetic materials with traditional stripe and geometric weave patterns. Foldable and lightweight.',
    },
    image: {
      src: productArt({ kind: 'macrame', color: '#c8b890', accent: '#7a6040', seed: 'yoga', pattern: 'jute' }, 0),
      alt: { en: 'Woven cotton yoga mat with stripe pattern' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'macrame', color: '#c8b890', pattern: 'jute' }, x: 930, baseY: 362, scale: 0.88 },
      { spec: { kind: 'macrame', color: '#b0a07a', pattern: 'jute' }, x: 1260, baseY: 370, scale: 0.72 },
    ], 'warm', 330),
  },
  {
    id: 'jute-rugs',
    slug: 'jute-rugs',
    name: { en: 'Jute Rugs' },
    description: {
      en: 'Natural jute rugs woven from sustainably sourced plant fibres. Earthy, textured and durable for living rooms, dining spaces and sunrooms.',
    },
    image: {
      src: productArt({ kind: 'macrame', color: '#b8a07a', accent: '#7a6040', seed: 'jute', pattern: 'jute' }, 0),
      alt: { en: 'Natural jute rug with woven texture' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'macrame', color: '#b8a07a', pattern: 'jute' }, x: 920, baseY: 360, scale: 0.88 },
      { spec: { kind: 'macrame', color: '#a89060', pattern: 'jute' }, x: 1240, baseY: 368, scale: 0.72 },
      { spec: { kind: 'cushion', color: '#c8a870' }, x: 1460, baseY: 372, scale: 0.65 },
    ], 'warm', 330),
  },
  {
    id: 'round-jute-rugs',
    slug: 'round-jute-rugs',
    name: { en: 'Round Jute Rugs' },
    description: {
      en: 'Circular jute rugs that define a space with a soft organic shape. Natural tones and woven textures for under dining tables and reading corners.',
    },
    image: {
      src: productArt({ kind: 'macrame', color: '#b0987a', accent: '#7a6240', seed: 'round-jute', pattern: 'jute' }, 0),
      alt: { en: 'Round natural jute rug' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'macrame', color: '#b0987a', pattern: 'jute' }, x: 940, baseY: 360, scale: 0.88 },
      { spec: { kind: 'macrame', color: '#988060', pattern: 'jute' }, x: 1260, baseY: 368, scale: 0.72 },
    ], 'warm', 330),
  },
  {
    id: 'cushion-covers',
    slug: 'cushion-covers',
    name: { en: 'Cushion Covers' },
    description: {
      en: 'Handwoven and block-printed cushion covers in Kilim and traditional Indian textile patterns. Cover only; insert not included.',
    },
    image: {
      src: productArt({ kind: 'cushion', color: '#d4705a', accent: '#8a3820', seed: 'cushion' }, 0),
      alt: { en: 'Kilim cushion cover with geometric design' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'cushion', color: '#d4705a', accent: '#8a3820' }, x: 980, baseY: 368, scale: 0.75 },
      { spec: { kind: 'cushion', color: '#c86040', accent: '#7a3018' }, x: 1220, baseY: 372, scale: 0.7 },
      { spec: { kind: 'cushion', color: '#e0906a', accent: '#904830' }, x: 1440, baseY: 368, scale: 0.72 },
    ], 'warm', 330),
  },
  {
    id: 'throws',
    slug: 'throws',
    name: { en: 'Throws' },
    description: {
      en: 'Soft handwoven throws in wool and cotton. Fringed edges and traditional stripe or check patterns to add warmth and Bohemian texture to any sofa or bed.',
    },
    image: {
      src: productArt({ kind: 'macrame', color: '#9b7356', accent: '#4a3228', seed: 'throw' }, 0),
      alt: { en: 'Handwoven cotton throw with fringe' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'macrame', color: '#9b7356', accent: '#4a3228' }, x: 950, baseY: 362, scale: 0.88 },
      { spec: { kind: 'macrame', color: '#8a6448', accent: '#3a2820' }, x: 1270, baseY: 368, scale: 0.75 },
    ], 'warm', 330),
  },
  {
    id: 'scalloped-jute-rugs',
    slug: 'scalloped-jute-rugs',
    name: { en: 'Scalloped Jute Rugs' },
    description: {
      en: 'Jute rugs with distinctive curved scalloped edges for a decorative silhouette. Natural fibre construction with an artisan border finish.',
    },
    image: {
      src: productArt({ kind: 'macrame', color: '#a8906a', accent: '#6a5030', seed: 'scalloped', pattern: 'jute' }, 0),
      alt: { en: 'Scalloped edge jute rug' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'macrame', color: '#a8906a', pattern: 'jute' }, x: 940, baseY: 360, scale: 0.88 },
      { spec: { kind: 'macrame', color: '#987858', pattern: 'jute' }, x: 1260, baseY: 368, scale: 0.72 },
    ], 'warm', 330),
  },
  {
    id: 'jute-doormats',
    slug: 'jute-doormats',
    name: { en: 'Jute Doormats' },
    description: {
      en: 'Handwoven jute doormats for doorstep and entryway. Naturally coarse jute fibres trap dirt and dust. Classic stripe and plain weave patterns in neutral tones.',
    },
    image: {
      src: productArt({ kind: 'macrame', color: '#9a8060', accent: '#5a4020', seed: 'doormat', pattern: 'jute' }, 0),
      alt: { en: 'Handwoven jute doormat' },
    },
    banner: compositeArt(1600, 420, [
      { spec: { kind: 'macrame', color: '#9a8060', pattern: 'jute' }, x: 950, baseY: 362, scale: 0.88 },
      { spec: { kind: 'macrame', color: '#887050', pattern: 'jute' }, x: 1270, baseY: 370, scale: 0.72 },
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
  { spec: { kind: 'macrame', color: '#c2846e', accent: '#5a3a2e', seed: 'hero' }, x: 900, baseY: 620, scale: 1.0 },
  { spec: { kind: 'cushion', color: '#d4705a', accent: '#8a3820', seed: 'hero' }, x: 1220, baseY: 630, scale: 0.9 },
  { spec: { kind: 'macrame', color: '#b8a07a', seed: 'hero', pattern: 'jute' }, x: 1460, baseY: 638, scale: 0.82 },
], 'warm', 560);

export const STORY_IMAGE = compositeArt(1200, 900, [
  { spec: { kind: 'macrame', color: '#b8a07a', pattern: 'jute', seed: 'story' }, x: 320, baseY: 730, scale: 0.9 },
  { spec: { kind: 'cushion', color: '#c2846e', accent: '#5a3a2e', seed: 'story' }, x: 650, baseY: 742, scale: 0.82 },
  { spec: { kind: 'macrame', color: '#9b7356', accent: '#4a3228', seed: 'story' }, x: 940, baseY: 748, scale: 0.78 },
], 'warm', 680);

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
