export type Shift = "Morning" | "Afternoon" | "Graveyard";
export type Role = "Shift Manager" | "Chatter" | "QA" | "Leadership" | "Support";

export interface TeamMember {
  name: string;
  role: Role;
  shift: Shift | null;
  telegram?: string;
}

// Shift hours in EST
export const SHIFT_HOURS: Record<Shift, { start: number; end: number; label: string }> = {
  Morning:   { start: 4,  end: 12, label: "Morning (4AM–12PM EST)" },
  Afternoon: { start: 12, end: 20, label: "Afternoon (12PM–8PM EST)" },
  Graveyard: { start: 20, end: 28, label: "Graveyard (8PM–4AM EST)" }, // 28 = next-day 4AM
};

export const TEAM_ROSTER: TeamMember[] = [
  // Morning Shift EST (4AM–12PM)
  { name: "Ana",                   role: "Shift Manager", shift: "Morning",   telegram: "@ANANANANABANANA" },
  { name: "Bern Pingot",           role: "Chatter",       shift: "Morning" },
  { name: "Athena",                role: "Chatter",       shift: "Morning" },
  { name: "Aizen",                 role: "Chatter",       shift: "Morning" },
  { name: "Jochel Magno Salugao",  role: "Chatter",       shift: "Morning" },
  { name: "Hailey",                role: "QA",            shift: "Morning",   telegram: "@whatthehxileyy" },

  // Afternoon Shift EST (12PM–8PM)
  { name: "Noah",                  role: "Shift Manager", shift: "Afternoon", telegram: "@noah122921" },
  { name: "Zade Zapatos",          role: "Chatter",       shift: "Afternoon" },
  { name: "Berl",                  role: "Chatter",       shift: "Afternoon" },
  { name: "Froi Borromeo",         role: "Chatter",       shift: "Afternoon" },
  { name: "Dre",                   role: "QA",            shift: "Afternoon", telegram: "@Dre677" },

  // Graveyard Shift EST (8PM–4AM)
  { name: "Gem",                   role: "Shift Manager", shift: "Graveyard", telegram: "@iamg3m" },
  { name: "Wells",                 role: "Chatter",       shift: "Graveyard" },
  { name: "Irene",                 role: "Chatter",       shift: "Graveyard" },
  { name: "Jie",                   role: "Chatter",       shift: "Graveyard" },
  { name: "Justine Dequilla",      role: "Chatter",       shift: "Graveyard" },
  { name: "Mac",                   role: "Chatter",       shift: "Graveyard" },
  { name: "Jah",                   role: "QA",            shift: "Graveyard", telegram: "@ScoopyDoggy" },

  // Support / Ops
  { name: "AJ Ynion",              role: "Support",       shift: null },
  { name: "Emily Ramirez",         role: "Support",       shift: null },
  { name: "Gio",                   role: "Support",       shift: null },

  // Leadership
  { name: "Mario",                 role: "Leadership",    shift: null },
  { name: "Joe Weill",             role: "Leadership",    shift: null,        telegram: "@ren54321" },
  { name: "Theresa McLees",        role: "Leadership",    shift: null,        telegram: "@TheresaLM" },
  { name: "Keith Morata",          role: "Leadership",    shift: null,        telegram: "@kitmrts" },
];

/** Returns the current shift based on EST time */
export function getCurrentShift(): Shift {
  const now = new Date();
  // Convert to EST (UTC-5 standard, UTC-4 daylight — we use a fixed offset for simplicity)
  const estOffset = -5 * 60; // minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  let estMinutes = utcMinutes + estOffset;
  if (estMinutes < 0) estMinutes += 24 * 60;
  if (estMinutes >= 24 * 60) estMinutes -= 24 * 60;
  const estHour = Math.floor(estMinutes / 60);

  if (estHour >= 4 && estHour < 12) return "Morning";
  if (estHour >= 12 && estHour < 20) return "Afternoon";
  return "Graveyard";
}

export function getMembersByShift(shift: Shift): TeamMember[] {
  return TEAM_ROSTER.filter((m) => m.shift === shift);
}

export const SHIFT_COLORS: Record<Shift, { bg: string; text: string; border: string; badge: string }> = {
  Morning:   { bg: "bg-amber-50",   text: "text-amber-800",  border: "border-amber-200", badge: "bg-amber-100 text-amber-800" },
  Afternoon: { bg: "bg-sky-50",     text: "text-sky-800",    border: "border-sky-200",   badge: "bg-sky-100 text-sky-800" },
  Graveyard: { bg: "bg-indigo-50",  text: "text-indigo-800", border: "border-indigo-200",badge: "bg-indigo-100 text-indigo-800" },
};

export const SHIFT_EMOJI: Record<Shift, string> = {
  Morning:   "🌅",
  Afternoon: "☀️",
  Graveyard: "🌙",
};
