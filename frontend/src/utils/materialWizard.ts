/**
 * Rule-based material recommender for LaserHub wizard.
 *
 * Scoring approach: each material has scores for various "facets" (use case,
 * environment, strength, budget, finish). Answers map to facets and the
 * highest-scoring materials win.
 */

import type { Material } from '../services';

export type WizardAnswers = {
  useCase: 'signage' | 'enclosure' | 'jewelry' | 'decoration' | 'prototype' | 'other';
  environment: 'indoor' | 'outdoor';
  strength: 'low' | 'medium' | 'high';
  budget: 'low' | 'medium' | 'high'; // <100, 100-500, 500+
  finish: 'matte' | 'glossy' | 'natural_wood' | 'metallic' | 'any';
};

// Material-type -> facet scores (0-10)
const TYPE_SCORES: Record<string, Record<string, number>> = {
  acrylic: {
    signage: 9, decoration: 8, jewelry: 6, enclosure: 5, prototype: 4, other: 5,
    indoor: 8, outdoor: 7,
    strength_low: 7, strength_medium: 6, strength_high: 3,
    budget_low: 5, budget_medium: 8, budget_high: 7,
    finish_glossy: 10, finish_matte: 7, finish_natural_wood: 0, finish_metallic: 0, finish_any: 7,
  },
  wood_mdf: {
    signage: 6, decoration: 7, prototype: 9, enclosure: 8, jewelry: 4, other: 6,
    indoor: 9, outdoor: 2,
    strength_low: 6, strength_medium: 7, strength_high: 4,
    budget_low: 9, budget_medium: 7, budget_high: 4,
    finish_matte: 7, finish_glossy: 3, finish_natural_wood: 9, finish_metallic: 0, finish_any: 7,
  },
  plywood: {
    signage: 6, decoration: 8, enclosure: 7, prototype: 7, jewelry: 5, other: 6,
    indoor: 9, outdoor: 4,
    strength_low: 5, strength_medium: 7, strength_high: 7,
    budget_low: 7, budget_medium: 8, budget_high: 5,
    finish_matte: 6, finish_glossy: 4, finish_natural_wood: 10, finish_metallic: 0, finish_any: 8,
  },
  leather: {
    jewelry: 9, decoration: 7, signage: 2, enclosure: 2, prototype: 3, other: 4,
    indoor: 8, outdoor: 6,
    strength_low: 7, strength_medium: 5, strength_high: 2,
    budget_low: 3, budget_medium: 7, budget_high: 8,
    finish_matte: 8, finish_glossy: 5, finish_natural_wood: 4, finish_metallic: 0, finish_any: 6,
  },
  paper: {
    decoration: 8, prototype: 7, jewelry: 4, signage: 3, enclosure: 1, other: 5,
    indoor: 9, outdoor: 1,
    strength_low: 9, strength_medium: 2, strength_high: 1,
    budget_low: 10, budget_medium: 5, budget_high: 2,
    finish_matte: 8, finish_glossy: 6, finish_natural_wood: 2, finish_metallic: 0, finish_any: 6,
  },
  aluminum: {
    signage: 8, enclosure: 9, jewelry: 6, prototype: 5, decoration: 5, other: 6,
    indoor: 8, outdoor: 9,
    strength_low: 3, strength_medium: 7, strength_high: 9,
    budget_low: 2, budget_medium: 6, budget_high: 9,
    finish_metallic: 10, finish_matte: 6, finish_glossy: 4, finish_natural_wood: 0, finish_any: 7,
  },
  stainless_steel: {
    signage: 7, enclosure: 8, jewelry: 8, prototype: 4, decoration: 6, other: 6,
    indoor: 8, outdoor: 10,
    strength_low: 2, strength_medium: 6, strength_high: 10,
    budget_low: 1, budget_medium: 4, budget_high: 10,
    finish_metallic: 10, finish_matte: 5, finish_glossy: 7, finish_natural_wood: 0, finish_any: 7,
  },
};

type Scored = { material: Material; score: number; reasons: string[] };

export function recommendMaterials(
  materials: Material[],
  answers: WizardAnswers,
  topN = 3,
): Scored[] {
  const scored: Scored[] = materials
    .filter((m) => m.is_active !== false)
    .map((m) => {
      const table = TYPE_SCORES[m.type] || {};
      const reasons: string[] = [];

      const useScore = table[answers.useCase] ?? 4;
      const envScore = table[answers.environment] ?? 5;
      const strengthScore = table[`strength_${answers.strength}`] ?? 5;
      const budgetScore = table[`budget_${answers.budget}`] ?? 5;
      const finishScore = table[`finish_${answers.finish}`] ?? 5;

      // Outdoor filter: strongly penalise non-outdoor-safe materials
      let outdoorPenalty = 0;
      if (answers.environment === 'outdoor' && m.outdoor_safe === false) {
        outdoorPenalty = 8;
        reasons.push('Not ideal for outdoor use');
      }

      const total =
        useScore * 2 +
        envScore * 1.5 +
        strengthScore * 1 +
        budgetScore * 1 +
        finishScore * 0.8 -
        outdoorPenalty * 2;

      if (useScore >= 8) reasons.push(`Great for ${answers.useCase}`);
      if (envScore >= 8 && answers.environment === 'outdoor') reasons.push('Weather resistant');
      if (strengthScore >= 8) reasons.push('Strong and durable');
      if (budgetScore >= 8 && answers.budget === 'low') reasons.push('Budget friendly');
      if (finishScore >= 9) reasons.push(`Offers ${answers.finish.replace('_', ' ')} finish`);

      if (reasons.length === 0) reasons.push('Solid general-purpose choice');

      return { material: m, score: Math.max(0, total), reasons };
    });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

/** Material-specific laser kerf widths in mm (typical CO2 laser). */
export const KERF_MM: Record<string, number> = {
  acrylic: 0.15,
  wood_mdf: 0.25,
  plywood: 0.2,
  leather: 0.15,
  paper: 0.1,
  aluminum: 0.3,
  stainless_steel: 0.3,
};

export function getKerfForMaterial(type?: string): number {
  if (!type) return 0.2;
  return KERF_MM[type] ?? 0.2;
}
