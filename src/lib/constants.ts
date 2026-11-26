// Small, content-free constants that client code may import.
// Plan content itself lives in src/data and is only read on the server (see src/server/content.ts).

export const DEFAULT_START = "2026-11-02"; // fallback Monday when no clock is available

export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const BUFFER_AFTER = [6, 12, 18, 24, 30];
