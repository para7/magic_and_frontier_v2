import {
	defaultGrimoireState,
	type GrimoireEntry,
	type GrimoireState,
} from "./types.js";

function asNonNegativeInteger(value: unknown): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return 0;
	}
	return Math.max(0, Math.floor(value));
}

function normalizeGrimoireEntry(value: unknown): GrimoireEntry | null {
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
		description:
			typeof record.description === "string" ? record.description : "",
		updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
	};
}

export function normalizeGrimoireState(value: unknown): GrimoireState {
	if (!value || typeof value !== "object") {
		return defaultGrimoireState;
	}

	const record = value as Record<string, unknown>;
	if (!Array.isArray(record.entries)) {
		return defaultGrimoireState;
	}

	const entries = record.entries
		.map(normalizeGrimoireEntry)
		.filter((entry): entry is GrimoireEntry => entry !== null);
	return { entries };
}
