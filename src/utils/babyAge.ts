import { AgeStage, BabyProfile } from '../types';

export function getBabyAgeInfo(baby: BabyProfile): {
  months: number;
  weeksRemainder: number;
  stage: AgeStage;
  label: string;
} {
  const birth = new Date(baby.birthDate + 'T00:00:00');
  const now = new Date();
  let diffDays = Math.max(0, Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)));

  if (baby.isPremature && baby.weeksEarly && baby.weeksEarly > 0) {
    diffDays = Math.max(0, diffDays - baby.weeksEarly * 7);
  }

  const months = Math.floor(diffDays / 30.4375);
  const weeksRemainder = Math.floor((diffDays % 30.4375) / 7);

  let stage: AgeStage = '6-8m';
  if (months >= 12) stage = '12m+';
  else if (months >= 9) stage = '9-11m';

  const prefix = baby.isPremature && baby.weeksEarly ? 'Adjusted ' : '';
  const label = `${prefix}${months}m ${weeksRemainder}w`;

  return { months, weeksRemainder, stage, label };
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekDatesISO(startDate = new Date()): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}
