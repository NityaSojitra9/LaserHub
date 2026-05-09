// Shared taxonomy constants for the marketplace.
//
// Canonical source: BrowseDesignsPage (kept char-for-char identical so a
// future migration is a no-op rename). Other pages (MarketplacePage,
// DesignDetailPage) should import from here.

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'downloads', label: 'Most Downloads' },
];

export const CATEGORIES: readonly string[] = [
  '',
  'signage',
  'jewelry',
  'home_decor',
  'art',
  'mechanical',
  'packaging',
  'stencils',
  'educational',
];

export const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  signage: 'Signage',
  jewelry: 'Jewelry',
  home_decor: 'Home Decor',
  art: 'Art',
  mechanical: 'Mechanical',
  packaging: 'Packaging',
  stencils: 'Stencils',
  educational: 'Education',
};
