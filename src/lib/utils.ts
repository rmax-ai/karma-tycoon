import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKarma(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  
  const suffixes = [
    { value: 1e21, symbol: 'Sx' },
    { value: 1e18, symbol: 'E' },
    { value: 1e15, symbol: 'P' },
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' },
  ];

  for (const suffix of suffixes) {
    if (value >= suffix.value) {
      const formatted = (value / suffix.value).toFixed(1);
      return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + suffix.symbol;
    }
  }

  if (value >= 100) {
    return Math.floor(value).toLocaleString();
  }
  
  return value.toFixed(1).replace(/\.0$/, '');
}

const CHART_SCALE_STEPS = [
  { value: 1, suffix: '' },
  { value: 1e3, suffix: 'K' },
  { value: 1e6, suffix: 'M' },
  { value: 1e9, suffix: 'B' },
  { value: 1e12, suffix: 'T' },
  { value: 1e15, suffix: 'P' },
  { value: 1e18, suffix: 'E' },
  { value: 1e21, suffix: 'Z' },
  { value: 1e24, suffix: 'Y' },
];

export interface ChartScale {
  scale: number;
  formattedScale: string;
}

export function getSafeChartScale(values: number[], maxSafeValue = 90071992547409.91): ChartScale {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  const maxAbs = finiteValues.length ? Math.max(...finiteValues.map(Math.abs)) : 0;
  if (maxAbs === 0) {
    return { scale: 1, formattedScale: '1' };
  }

  let stepIndex = 0;
  while (
    stepIndex < CHART_SCALE_STEPS.length - 1 &&
    maxAbs / CHART_SCALE_STEPS[stepIndex].value > maxSafeValue
  ) {
    stepIndex += 1;
  }

  let scale = CHART_SCALE_STEPS[stepIndex].value;
  if (maxAbs / scale > maxSafeValue) {
    scale = maxAbs / maxSafeValue;
  }

  const sanitizedScale = Math.max(scale, 1);
  return {
    scale: sanitizedScale,
    formattedScale: formatKarma(sanitizedScale),
  };
}

export function generateUsername(): string {
  const qualifiers = [
    "Ambitious", "Brave", "Cunning", "Daring", "Elite",
    "Famous", "Glorious", "Hungry", "Intelligent", "Jolly",
    "Kind", "Lucky", "Mighty", "Noble", "Optimistic",
    "Proud", "Quick", "Rare", "Sneaky", "Tough"
  ];
  const nouns = [
    "Lurker", "Moderator", "Redditor", "Shitposter", "KarmaFarmer",
    "Upvoter", "Downvoter", "MemeLord", "Admin", "User",
    "Poster", "Debater", "Explorer", "Collector", "Strategist",
    "Influencer", "Skeptical", "Believer", "Dreamer", "Legend"
  ];

  const qualifier = qualifiers[Math.floor(Math.random() * qualifiers.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const numbers = Math.floor(1000 + Math.random() * 9000).toString();

  return `${qualifier}-${noun}-${numbers}`;
}
