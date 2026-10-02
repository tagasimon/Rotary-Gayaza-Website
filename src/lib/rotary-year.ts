import { localParts } from "./time";

/** Rotary year runs 1 July – 30 June. 15 Oct 2026 -> "2026-27". */
export function rotaryYearOf(date: Date): string {
  const { y, m } = localParts(date);
  const start = m >= 7 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export function rotaryYearRange(ry: string): { start: Date; end: Date } {
  const start = parseInt(ry.slice(0, 4), 10);
  return {
    start: new Date(`${start}-07-01T00:00:00+03:00`),
    end: new Date(`${start + 1}-07-01T00:00:00+03:00`),
  };
}

export function currentRotaryYear() {
  return rotaryYearOf(new Date());
}

export function isRotaryYear(s: string) {
  return /^\d{4}-\d{2}$/.test(s);
}
