import type { SADesignCreate } from '../../services';

export const DESIGN_CATEGORIES = [
  'signage', 'jewelry', 'home_decor', 'art', 'mechanical',
  'packaging', 'stencils', 'educational', 'other',
];

export const EMPTY_DESIGN_FORM: SADesignCreate = {
  title: '',
  description: '',
  category: 'other',
  tags: [],
  thumbnail_url: '',
  is_public: false,
  is_featured: false,
};

export type SuperAdminTab = 'overview' | 'users' | 'vendors' | 'designs' | 'orders' | 'stats';
