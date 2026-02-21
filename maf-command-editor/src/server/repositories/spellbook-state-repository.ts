import {
	defaultSpellbookState,
	type SpellbookEntry,
	type SpellbookState,
} from "~/server/domain/spellbook-types";

const DEFAULT_SPELLBOOK_STATE_PATH = "/tmp/spellbook-state.json";

export interface SpellbookStateRepository {
	loadSpellbookState(): Promise<SpellbookState>;
	saveSpellbookState(state: SpellbookState): Promise<void>;
}

function isErrnoCode(error: unknown, code: string): boolean {
	if (!error || typeof error !== "object") {
		return false;
	}
	return (error as { code?: unknown }).code === code;
}

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
		updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
	};
}

function normalizeSpellbookState(value: unknown): SpellbookState {
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

export function createSpellbookStateRepository(
	spellbookStatePath = DEFAULT_SPELLBOOK_STATE_PATH,
): SpellbookStateRepository {
	return {
		async loadSpellbookState(): Promise<SpellbookState> {
			try {
				const raw = await Bun.file(spellbookStatePath).text();
				return normalizeSpellbookState(JSON.parse(raw));
			} catch (error) {
				if (isErrnoCode(error, "ENOENT")) {
					return defaultSpellbookState;
				}
				if (error instanceof Error) {
					console.warn(
						`Failed to load spellbook state from ${spellbookStatePath}: ${error.message}`,
					);
				}
				return defaultSpellbookState;
			}
		},
		async saveSpellbookState(state: SpellbookState): Promise<void> {
			await Bun.write(spellbookStatePath, JSON.stringify(state, null, 2));
		},
	};
}
