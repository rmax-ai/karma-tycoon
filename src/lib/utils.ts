import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKarma(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  if (value >= 1000000) {
    const formatted = (value / 1000000).toFixed(1);
    return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'M';
  }
  if (value >= 1000) {
    const formatted = (value / 1000).toFixed(1);
    return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'K';
  }
  if (value >= 100) {
    return Math.floor(value).toLocaleString();
  }
  return value.toFixed(1).replace(/\.0$/, '');
}
