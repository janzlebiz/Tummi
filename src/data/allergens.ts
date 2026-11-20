import { AllergenId } from '../types';

export interface AllergenInfo {
  id: AllergenId;
  name: string;
  emoji: string;
  safeIntroTip: string;
  neverServeAs: string;
  recommendedFrequency: string;
}

export const ALLERGENS: AllergenInfo[] = [
  {
    id: 'peanut',
    name: 'Peanut',
    emoji: '🥜',
    safeIntroTip: 'Thin 1/2 tsp smooth peanut butter with warm water, breast milk, formula, or yogurt/oatmeal.',
    neverServeAs: 'Whole peanuts, chopped nuts, or thick globs of peanut butter.',
    recommendedFrequency: '2-3 times per week once tolerated.',
  },
  {
    id: 'egg',
    name: 'Egg',
    emoji: '🥚',
    safeIntroTip: 'Offer well-cooked scrambled egg strips or omelet strips, or mashed hard-boiled egg yolk/white.',
    neverServeAs: 'Raw or runny eggs before 12 months.',
    recommendedFrequency: '2-3 times per week once tolerated.',
  },
  {
    id: 'dairy',
    name: 'Dairy',
    emoji: '🥛',
    safeIntroTip: 'Full-fat plain Greek yogurt, ricotta, or melted low-sodium cheese in cooked dishes.',
    neverServeAs: 'Cow milk as a main drink before 12 months.',
    recommendedFrequency: 'Regularly in small food portions.',
  },
  {
    id: 'wheat',
    name: 'Wheat',
    emoji: '🌾',
    safeIntroTip: 'Well-cooked soft pasta, lightly toasted bread strips with toppings, or wheat cereal.',
    neverServeAs: 'Dry crusty bread or gummy white bread balls.',
    recommendedFrequency: 'Regularly as part of grains.',
  },
  {
    id: 'soy',
    name: 'Soy',
    emoji: '🫘',
    safeIntroTip: 'Soft steamed tofu strips, mashed edamame, or plain soy yogurt.',
    neverServeAs: 'Whole firm edamame beans (choking risk) or high-sodium soy sauce.',
    recommendedFrequency: '1-2 times per week once tolerated.',
  },
  {
    id: 'fish',
    name: 'Fish',
    emoji: '🐟',
    safeIntroTip: 'Flaked, deboned, fully cooked low-mercury fish like salmon, cod, or sardines.',
    neverServeAs: 'Fish with bones, raw fish, or high-mercury fish (shark, swordfish, king mackerel).',
    recommendedFrequency: '1-2 times per week (great for DHA & iron).',
  },
  {
    id: 'tree_nuts',
    name: 'Tree Nuts',
    emoji: '🌰',
    safeIntroTip: 'Thinned smooth almond, cashew, or walnut butter mixed into puree, oats, or yogurt.',
    neverServeAs: 'Whole or chopped tree nuts before age 4.',
    recommendedFrequency: '1-2 times per week once tolerated.',
  },
  {
    id: 'sesame',
    name: 'Sesame',
    emoji: '🥯',
    safeIntroTip: 'Thinned tahini (sesame paste) mixed with mashed sweet potato, hummus, or yogurt.',
    neverServeAs: 'Thick unthinned tahini.',
    recommendedFrequency: '1-2 times per week once tolerated.',
  },
  {
    id: 'shellfish',
    name: 'Shellfish',
    emoji: '🍤',
    safeIntroTip: 'Finely minced, fully cooked shrimp or crab mixed into soft patties or mashed avocado.',
    neverServeAs: 'Whole rubbery shrimp pieces or raw shellfish.',
    recommendedFrequency: 'Periodically once tolerated.',
  },
];

export const ALLERGEN_MAP: Record<AllergenId, AllergenInfo> = ALLERGENS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<AllergenId, AllergenInfo>
);
