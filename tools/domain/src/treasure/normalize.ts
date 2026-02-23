import {
	defaultTreasureState,
	type TreasureEntry,
	type TreasureState,
} from "./types.js";

function asOptionalInteger(value: unknown): number | undefined {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return undefined;
	}
	return Math.floor(value);
}

function normalizeLootPools(value: unknown): TreasureEntry["lootPools"] {
	if (!Array.isArray(value)) {
		return [];
	}

	const pools: TreasureEntry["lootPools"] = [];
	for (const rawPool of value) {
		if (!rawPool || typeof rawPool !== "object") {
			continue;
		}

		const record = rawPool as Record<string, unknown>;
		const kind =
			record.kind === "item" || record.kind === "grimoire"
				? record.kind
				: undefined;
		if (!kind) {
			continue;
		}

		const refId = typeof record.refId === "string" ? record.refId.trim() : "";
		if (refId.length === 0) {
			continue;
		}

		const weight =
			typeof record.weight === "number" && Number.isFinite(record.weight)
				? Math.max(1, Math.floor(record.weight))
				: 1;
		const countMin = asOptionalInteger(record.countMin);
		const countMax = asOptionalInteger(record.countMax);

		pools.push({
			kind,
			refId,
			weight,
			...(countMin === undefined ? {} : { countMin }),
			...(countMax === undefined ? {} : { countMax }),
		});
	}

	return pools;
}

function normalizeTreasureEntry(value: unknown): TreasureEntry | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const id = typeof record.id === "string" ? record.id.trim() : "";
	const name = typeof record.name === "string" ? record.name.trim() : "";

	return {
		id: id.length > 0 ? id : crypto.randomUUID(),
		name,
		lootPools: normalizeLootPools(record.lootPools),
		updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
	};
}

export function normalizeTreasureState(value: unknown): TreasureState {
	if (!value || typeof value !== "object") {
		return defaultTreasureState;
	}

	const record = value as Record<string, unknown>;
	if (!Array.isArray(record.entries)) {
		return defaultTreasureState;
	}

	const entries = record.entries
		.map(normalizeTreasureEntry)
		.filter((entry): entry is TreasureEntry => entry !== null);
	return { entries };
}
