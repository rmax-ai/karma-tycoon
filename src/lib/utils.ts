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
