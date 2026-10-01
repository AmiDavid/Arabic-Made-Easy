import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Strip Arabic diacritics for fuzzy search
export function stripDiacritics(s: string): string {
  return s.replace(/[ً-ْٰ]/g, '');
}
