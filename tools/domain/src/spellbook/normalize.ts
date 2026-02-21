import { defaultSpellbookState, type SpellbookEntry, type SpellbookState } from "./types.js";

function asNonNegativeInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function normalizeSpellbookEntry(value: unknown): SpellbookEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  return {
    id:
      typeof record.id === "string" && record.id.length > 0
        ? record.id
        : crypto.randomUUID(),
    castid: asNonNegativeInteger(record.castid),
    effectid: asNonNegativeInteger(record.effectid),
    cost: asNonNegativeInteger(record.cost),
    cast: asNonNegativeInteger(record.cast),
    title: typeof record.title === "string" ? record.title : "",
    description: typeof record.description === "string" ? record.description : "",
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : ""
  };
}

export function normalizeSpellbookState(value: unknown): SpellbookState {
  if (!value || typeof value !== "object") {
    return defaultSpellbookState;
  }

  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.entries)) {
    return defaultSpellbookState;
  }

  const entries = record.entries
    .map(normalizeSpellbookEntry)
    .filter((entry): entry is SpellbookEntry => entry !== null);
  return { entries };
}
