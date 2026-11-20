import { ALLERGENS } from '../data/allergens';
import { FOODS } from '../data/foods';
import { RECIPES } from '../data/recipes';
import { AllergenId, AppSettings, BabyProfile, FoodLogEntry } from '../types';
import { getBabyAgeInfo } from './babyAge';

export async function askTummiAssistant(
  question: string,
  baby: BabyProfile,
  logs: FoodLogEntry[],
  settings: AppSettings
): Promise<string> {
  const ageInfo = getBabyAgeInfo(baby);
  const triedFoodIds = Array.from(new Set(logs.map((l) => l.foodId)));
  const triedFoodNames = Array.from(new Set(logs.map((l) => l.foodName)));
  const introducedAllergens = Array.from(
    new Set(logs.flatMap((l) => l.allergens))
  ) as AllergenId[];
  const reactions = logs.filter((l) => l.reactionSeverity !== 'none');

  // If user configured a personal Gemini or OpenAI API key, use it!
  if (settings.aiProvider === 'gemini' && settings.apiKey.trim()) {
    try {
      const systemContext = buildSystemPrompt(baby, ageInfo.label, ageInfo.stage, triedFoodNames, introducedAllergens, reactions);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          settings.apiKey.trim()
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemContext}\n\nParent question: ${question}` }] }],
          }),
        }
      );
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch {
      // Fall back cleanly to offline assistant
    }
  } else if (settings.aiProvider === 'openai' && settings.apiKey.trim()) {
    try {
      const systemContext = buildSystemPrompt(baby, ageInfo.label, ageInfo.stage, triedFoodNames, introducedAllergens, reactions);
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemContext },
            { role: 'user', content: question },
          ],
          max_tokens: 450,
        }),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text;
    } catch {
      // Fall back cleanly to offline assistant
    }
  }

  // Offline smart contextual engine (100% free, zero API needed)
  return generateOfflineResponse(question, baby, ageInfo.months, ageInfo.stage, triedFoodIds, triedFoodNames, introducedAllergens, reactions);
}

function buildSystemPrompt(
  baby: BabyProfile,
  ageLabel: string,
  stage: string,
  triedFoodNames: string[],
  introducedAllergens: AllergenId[],
  reactions: FoodLogEntry[]
): string {
  return `You are Tummi, a calm, evidence-based pediatric feeding assistant.
Baby: ${baby.name}, Age: ${ageLabel} (Stage: ${stage}), Feeding style: ${baby.feedingStyle.toUpperCase()}.
Restrictions: ${baby.restrictions.length ? baby.restrictions.join(', ') : 'None'}.
Culture/Notes: ${baby.cultureNotes || 'None'}.
Foods tried (${triedFoodNames.length}): ${triedFoodNames.slice(0, 30).join(', ') || 'None yet'}.
Allergens introduced: ${introducedAllergens.join(', ') || 'None yet'}.
Reactions logged: ${reactions.map((r) => `${r.foodName} (${r.reactionSeverity}: ${r.reactionSymptoms.join(', ')})`).join('; ') || 'None'}.
Give practical, concise, safe feeding guidance tailored to this baby's age and history. Include choking safety notes when relevant. Remind parents this is general guidance, not medical advice.`;
}

function generateOfflineResponse(
  question: string,
  baby: BabyProfile,
  months: number,
  stage: '6-8m' | '9-11m' | '12m+',
  triedFoodIds: string[],
  triedFoodNames: string[],
  introducedAllergens: AllergenId[],
  reactions: FoodLogEntry[]
): string {
  const q = question.toLowerCase();

  // Check if asking about a specific food in our database
  const matchedFood = FOODS.find(
    (f) => q.includes(f.name.toLowerCase()) || q.includes(f.id.replace('_', ' '))
  );
  if (matchedFood) {
    const prep = matchedFood.prepByAge.find((p) => p.stage === stage) || matchedFood.prepByAge[0];
    const styleText =
      baby.feedingStyle === 'purees'
        ? `Purée prep: ${prep.puree}`
        : baby.feedingStyle === 'blw'
        ? `BLW prep (${prep.cutSize}): ${prep.blw}`
        : `BLW (${prep.cutSize}): ${prep.blw}\n• Purée: ${prep.puree}`;

    const allergenWarning = matchedFood.allergens.length
      ? `\n⚠️ Allergen: Contains ${matchedFood.allergens.join(', ')}. Introduce early in the day and watch for 2 hours.`
      : '';

    return `${matchedFood.emoji} **${matchedFood.name}** for ${baby.name} (${stage}):\n\n• ${styleText}\n• Texture: ${prep.texture}\n• Safety: ${matchedFood.chokingNotes}${allergenWarning}\n• Great pairings: ${matchedFood.pairings.join(', ')}.`;
  }

  // Check if asking about meal ideas / what to make with tried foods
  if (q.includes('make') || q.includes('meal') || q.includes('recipe') || q.includes('tried') || q.includes('idea')) {
    const matchingRecipes = RECIPES.filter((r) => {
      const hasTried = r.ingredients.some((ing) => ing.foodId && triedFoodIds.includes(ing.foodId));
      return triedFoodIds.length === 0 || hasTried;
    }).slice(0, 3);

    const untriedIron = FOODS.filter((f) => f.ironRich && !triedFoodIds.includes(f.id)).slice(0, 3);

    return `🍽️ **Meal ideas for ${baby.name} (${stage}, ${baby.feedingStyle.toUpperCase()}):**\n\n${matchingRecipes
      .map((r) => `• ${r.emoji} **${r.title}** (${r.prepTimeMins}m) — ${r.ingredients.map((i) => i.name).join(', ')}`)
      .join('\n')}\n\n${
      untriedIron.length
        ? `💡 **New iron-rich foods to try next:** ${untriedIron.map((f) => `${f.emoji} ${f.name}`).join(', ')}.`
        : ''
    }\n\n_(General feeding guidance, not medical advice.)_`;
  }

  // Check if asking about allergens
  if (q.includes('allergen') || q.includes('peanut') || q.includes('egg') || q.includes('reaction') || q.includes('rash')) {
    const missingAllergens = ALLERGENS.filter((a) => !introducedAllergens.includes(a.id));
    const nextAllergen = missingAllergens[0];
    return `🛡️ **Allergen Plan for ${baby.name}:**\n\n• Introduced so far: ${
      introducedAllergens.length ? introducedAllergens.join(', ') : 'None yet'
    } (${introducedAllergens.length}/9)\n• Logged reactions: ${
      reactions.length ? reactions.map((r) => `${r.foodName} (${r.reactionSeverity})`).join(', ') : 'None'
    }\n${
      nextAllergen
        ? `\n👉 **Next suggested allergen:** ${nextAllergen.emoji} **${nextAllergen.name}**\n• How: ${nextAllergen.safeIntroTip}\n• Avoid: ${nextAllergen.neverServeAs}`
        : '\n🎉 All 9 major allergens have been introduced! Keep offering them 2-3x/week.'
    }\n\n⚠️ Seek immediate medical care for hives, facial swelling, repeated vomiting, or breathing trouble.`;
  }

  // Check if asking about gagging vs choking
  if (q.includes('gag') || q.includes('chok')) {
    return `🚨 **Gagging vs. Choking:**\n\n• **Gagging (Normal):** Loud coughing/sputtering, tongue pushes food forward, red face. Stay calm and let ${baby.name} work it out — never put fingers in their mouth.\n• **Choking (Emergency):** Silent or weak cough, unable to cry, bluish lips, panic. Call emergency services and perform infant back blows & chest thrusts immediately.\n\nAlways pass the "squish test" between thumb and forefinger for ${stage} foods.`;
  }

  // Check if asking about portions / how many meals
  if (q.includes('portion') || q.includes('how much') || q.includes('many meals') || q.includes('schedule')) {
    const mealsRec =
      months < 7
        ? '1-2 small meals per day alongside breast milk or formula.'
        : months < 9
        ? '2-3 small meals per day alongside breast milk or formula.'
        : '3 meals + 1-2 snacks per day. Breast milk/formula remains primary until 12 months.';
    return `📅 **Feeding Schedule for ${baby.name} (${months}m):**\n\n• Recommended frequency: ${mealsRec}\n• Portions: Start with 1-2 tablespoons per food and follow ${baby.name}'s hunger and fullness cues (turning head away, closing mouth, slowing down).`;
  }

  // Default personalized summary + suggestions
  const nextFoods = FOODS.filter((f) => !triedFoodIds.includes(f.id)).slice(0, 3);
  return `👋 Hi! Here's where **${baby.name}** (${ageRangeLabel(months)}, ${baby.feedingStyle.toUpperCase()}) is at:\n\n• **Foods tried:** ${triedFoodNames.length} (${
    triedFoodNames.slice(-4).join(', ') || 'none yet'
  })\n• **Allergens:** ${introducedAllergens.length}/9 introduced\n• **Suggested next:** ${nextFoods
    .map((f) => `${f.emoji} ${f.name}`)
    .join(', ')}\n\nAsk me about any specific food (e.g., *"How do I serve blueberries?"*), *"What can I make with tried foods?"*, or *"How to introduce allergens?"*.`;
}

function ageRangeLabel(months: number): string {
  if (months < 9) return '6-8m stage';
  if (months < 12) return '9-11m stage';
  return '12m+ stage';
}
