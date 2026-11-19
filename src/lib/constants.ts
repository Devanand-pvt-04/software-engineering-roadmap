// Small, content-free constants that client code may import.
// Plan content itself lives in src/data and is only read on the server (see src/server/content.ts).

export const DEFAULT_START = "2026-11-02"; // fallback Monday when no clock is available

export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const BUFFER_AFTER = [6, 12, 18, 24, 30];

export const SESSION_TEMPLATE: { name: string; minutes: number; text: string }[] = [
  { name: "Open", minutes: 2, text: "Open this app, find today's unticked box, read it aloud." },
  { name: "Recall", minutes: 5, text: "Without notes, write 3 things you remember from the last session. Blank page? Reread your last note quickly." },
  { name: "Focus", minutes: 65, text: "Phone in another room. One resource only. When stuck for more than 20 minutes, write the exact question down and move to the next part." },
  { name: "Explain", minutes: 10, text: 'Write 5-10 lines: "Today I learned X. It exists because Y. It works by Z. I\'m still confused about W."' },
  { name: "Close", minutes: 3, text: "Tick the box. Write the first action for next session on a sticky note." },
];
