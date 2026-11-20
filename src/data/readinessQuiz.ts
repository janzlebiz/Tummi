export interface ReadinessQuestion {
  id: string;
  question: string;
  detail: string;
}

export const READINESS_QUESTIONS: ReadinessQuestion[] = [
  {
    id: 'age',
    question: 'Is your baby around 6 months old (or adjusted age ~6 months)?',
    detail: 'Most pediatricians recommend starting solids around 6 months.',
  },
  {
    id: 'head',
    question: 'Can your baby hold their head steady and upright?',
    detail: 'Steady head and neck control is essential for safe swallowing.',
  },
  {
    id: 'sit',
    question: 'Can your baby sit upright with minimal support in a high chair?',
    detail: 'Sitting upright keeps the airway aligned and lowers choking risk.',
  },
  {
    id: 'tongue',
    question: 'Has the tongue-thrust reflex faded?',
    detail: 'Baby no longer automatically pushes everything back out with their tongue.',
  },
  {
    id: 'interest',
    question: 'Does your baby show interest in food when others eat?',
    detail: 'Leaning forward, watching spoons, or reaching for food on your plate.',
  },
  {
    id: 'grasp',
    question: 'Can your baby bring objects or hands to their mouth?',
    detail: 'Shows hand-eye coordination needed for self-feeding or accepting a spoon.',
  },
];

export const CHOKING_VS_GAGGING = {
  gagging: {
    title: 'Gagging (Normal Reflex)',
    color: '#E8A435',
    points: [
      'Loud coughing, sputtering, or retching sounds',
      'Baby pushes food forward with tongue',
      'Face may turn slightly red; eyes may water',
      'Stay calm, do not put fingers in baby’s mouth — let baby work it out',
    ],
  },
  choking: {
    title: 'Choking (Emergency)',
    color: '#D64545',
    points: [
      'Silent or weak, ineffective cough; unable to cry or make sound',
      'Skin/lips turning blue, pale, or dusky',
      'Wide-eyed panic or limpness',
      'Act immediately: call emergency services and perform infant back blows & chest thrusts',
    ],
  },
};
