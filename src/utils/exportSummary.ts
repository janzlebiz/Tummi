import { ALLERGENS } from '../data/allergens';
import { BabyProfile, FoodLogEntry } from '../types';
import { getBabyAgeInfo } from './babyAge';

export function buildPediatricianReport(baby: BabyProfile, logs: FoodLogEntry[]): string {
  const age = getBabyAgeInfo(baby);
  const uniqueFoods = Array.from(new Set(logs.map((l) => l.foodName)));
  const reactions = logs.filter((l) => l.reactionSeverity !== 'none');

  const allergenLines = ALLERGENS.map((a) => {
    const matches = logs.filter((l) => l.allergens.includes(a.id));
    const hasReaction = matches.some((m) => m.reactionSeverity !== 'none');
    const status =
      matches.length === 0
        ? 'Not yet introduced'
        : hasReaction
        ? `REACTION LOGGED (${matches.length} exposures)`
        : `Tolerated (${matches.length} exposures)`;
    return `- ${a.name}: ${status}`;
  }).join('\n');

  const reactionLines = reactions.length
    ? reactions
        .map(
          (r) =>
            `- ${r.date} | ${r.foodName} | Severity: ${r.reactionSeverity.toUpperCase()} | Symptoms: ${
              r.reactionSymptoms.join(', ') || 'None specified'
            }${r.notes ? ` | Notes: ${r.notes}` : ''}`
        )
        .join('\n')
    : 'None logged.';

  return `TUMMI FEEDING & ALLERGEN REPORT
================================
Baby: ${baby.name}
Age: ${age.label} (DOB: ${baby.birthDate})
Feeding Style: ${baby.feedingStyle.toUpperCase()}
Total Foods Tried: ${uniqueFoods.length}
Total Meals Logged: ${logs.length}

TOP 9 ALLERGENS STATUS
----------------------
${allergenLines}

LOGGED REACTIONS
----------------
${reactionLines}

FOODS TRIED (${uniqueFoods.length})
-----------
${uniqueFoods.join(', ') || 'None yet'}
`;
}
