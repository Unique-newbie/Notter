import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateWordCount(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/);
  return words.filter(word => word.length > 0).length;
}

export function calculateReadingTime(wordCount: number): number {
  // Average reading speed ~ 225 wpm
  return Math.max(1, Math.ceil(wordCount / 225));
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}
