import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBandColor(band: number): string {
  if (band >= 7) return 'text-green-400';
  if (band >= 5) return 'text-amber-400';
  return 'text-red-400';
}

export function getBandBgColor(band: number): string {
  if (band >= 7) return 'bg-green-400/10 border-green-400/30';
  if (band >= 5) return 'bg-amber-400/10 border-amber-400/30';
  return 'bg-red-400/10 border-red-400/30';
}

export function getBandLabel(band: number): string {
  if (band >= 9) return 'Expert';
  if (band >= 8) return 'Very Good';
  if (band >= 7) return 'Good';
  if (band >= 6) return 'Competent';
  if (band >= 5) return 'Modest';
  if (band >= 4) return 'Limited';
  if (band >= 3) return 'Extremely Limited';
  return 'Non-User';
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getWordCountStatus(
  wordCount: number,
  taskType: 'task1' | 'task2',
): 'too-short' | 'ideal' | 'over' {
  const limits = {
    task1: { min: 150, ideal_max: 200 },
    task2: { min: 250, ideal_max: 350 },
  };
  const { min, ideal_max } = limits[taskType];
  if (wordCount < min) return 'too-short';
  if (wordCount > ideal_max) return 'over';
  return 'ideal';
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < day * 7) return `${Math.floor(diff / day)}d ago`;
  return formatDate(date);
}
