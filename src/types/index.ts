export type FeedingStyle = 'blw' | 'purees' | 'combo';

export type AllergenId =
  | 'peanut'
  | 'egg'
  | 'dairy'
  | 'wheat'
  | 'soy'
  | 'fish'
  | 'tree_nuts'
  | 'sesame'
  | 'shellfish';

export type FoodCategory =
  | 'Fruits'
  | 'Vegetables'
  | 'Proteins'
  | 'Grains'
  | 'Dairy'
  | 'Legumes'
  | 'Nuts & Seeds'
  | 'Seasonings';

export type AgeStage = '6-8m' | '9-11m' | '12m+';

export type ChokingRisk = 'low' | 'moderate' | 'high';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type AcceptanceLevel = 'loved' | 'liked' | 'neutral' | 'disliked';

export type ReactionSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export interface BabyProfile {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  isPremature?: boolean;
  weeksEarly?: number;
  feedingStyle: FeedingStyle;
  restrictions: string[];
  cultureNotes: string;
  createdAt: string;
}

export interface AgePrepGuide {
  stage: AgeStage;
  blw: string;
  puree: string;
  cutSize: string;
  texture: string;
}

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  category: FoodCategory;
  minAgeMonths: number;
  ironRich: boolean;
  gentleOnTummy: boolean;
  chokingRisk: ChokingRisk;
  chokingNotes: string;
  allergens: AllergenId[];
  nutritionHighlights: string[];
  prepByAge: AgePrepGuide[];
  pairings: string[];
  lists: string[];
}

export interface FoodLogEntry {
  id: string;
  babyId: string;
  foodId: string;
  foodName: string;
  emoji: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  mealType: MealType;
  prepUsed: FeedingStyle;
  acceptance: AcceptanceLevel;
  reactionSeverity: ReactionSeverity;
  reactionSymptoms: string[];
  notes: string;
  allergens: AllergenId[];
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  foodId?: string;
}

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  minAgeMonths: number;
  prepTimeMins: number;
  mealType: MealType;
  style: 'blw' | 'puree' | 'both';
  ironRich: boolean;
  ingredients: RecipeIngredient[];
  steps: string[];
  allergens: AllergenId[];
  cultureTag: string;
}

export interface MealPlanDay {
  date: string; // YYYY-MM-DD
  breakfastId: string;
  lunchId: string;
  dinnerId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AppSettings {
  aiProvider: 'offline' | 'gemini' | 'openai';
  apiKey: string;
  waitDaysBetweenAllergens: number;
}
