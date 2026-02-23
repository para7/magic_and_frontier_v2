import { defaultEnemyState, type EnemyEntry, type EnemyState } from "./types.js";

function asFiniteNumber(value: unknown, fallback = 0): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return fallback;
	}
	return value;
}

function asOptionalFiniteNumber(value: unknown): number | undefined {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return undefined;
	}
	return value;
}

function normalizeEnemySkillIds(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const seen = new Set<string>();
	const ids: string[] = [];
	for (const rawId of value) {
		if (typeof rawId !== "string") {
			continue;
		}
		const id = rawId.trim();
		if (id.length === 0 || seen.has(id)) {
			continue;
		}
		seen.add(id);
		ids.push(id);
	}

	return ids;
}

function normalizeEnemyEntry(value: unknown): EnemyEntry | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const id = typeof record.id === "string" ? record.id.trim() : "";
	const name = typeof record.name === "string" ? record.name.trim() : "";
	const dropTableId =
		typeof record.dropTableId === "string" ? record.dropTableId.trim() : "";

	const spawnRuleRecord =
		record.spawnRule && typeof record.spawnRule === "object"
			? (record.spawnRule as Record<string, unknown>)
			: {};
	const originRecord =
		spawnRuleRecord.origin && typeof spawnRuleRecord.origin === "object"
			? (spawnRuleRecord.origin as Record<string, unknown>)
			: {};
	const distanceRecord =
		spawnRuleRecord.distance && typeof spawnRuleRecord.distance === "object"
			? (spawnRuleRecord.distance as Record<string, unknown>)
			: {};
	const axisBoundsRecord =
		spawnRuleRecord.axisBounds && typeof spawnRuleRecord.axisBounds === "object"
			? (spawnRuleRecord.axisBounds as Record<string, unknown>)
			: undefined;

	const axisBounds =
		axisBoundsRecord === undefined
			? undefined
			: {
				...(asOptionalFiniteNumber(axisBoundsRecord.xMin) === undefined
					? {}
					: { xMin: asOptionalFiniteNumber(axisBoundsRecord.xMin) }),
				...(asOptionalFiniteNumber(axisBoundsRecord.xMax) === undefined
					? {}
					: { xMax: asOptionalFiniteNumber(axisBoundsRecord.xMax) }),
				...(asOptionalFiniteNumber(axisBoundsRecord.yMin) === undefined
					? {}
					: { yMin: asOptionalFiniteNumber(axisBoundsRecord.yMin) }),
				...(asOptionalFiniteNumber(axisBoundsRecord.yMax) === undefined
					? {}
					: { yMax: asOptionalFiniteNumber(axisBoundsRecord.yMax) }),
				...(asOptionalFiniteNumber(axisBoundsRecord.zMin) === undefined
					? {}
					: { zMin: asOptionalFiniteNumber(axisBoundsRecord.zMin) }),
				...(asOptionalFiniteNumber(axisBoundsRecord.zMax) === undefined
					? {}
					: { zMax: asOptionalFiniteNumber(axisBoundsRecord.zMax) }),
			};

	return {
		id: id.length > 0 ? id : crypto.randomUUID(),
		name,
		hp: Math.max(1, Math.floor(asFiniteNumber(record.hp, 1))),
		...(asOptionalFiniteNumber(record.attack) === undefined
			? {}
			: { attack: Math.floor(asFiniteNumber(record.attack)) }),
		...(asOptionalFiniteNumber(record.defense) === undefined
			? {}
			: { defense: Math.floor(asFiniteNumber(record.defense)) }),
		...(asOptionalFiniteNumber(record.moveSpeed) === undefined
			? {}
			: { moveSpeed: asFiniteNumber(record.moveSpeed) }),
		dropTableId,
		enemySkillIds: normalizeEnemySkillIds(record.enemySkillIds),
		spawnRule: {
			origin: {
				x: asFiniteNumber(originRecord.x),
				y: asFiniteNumber(originRecord.y),
				z: asFiniteNumber(originRecord.z),
			},
			distance: {
				min: Math.max(0, asFiniteNumber(distanceRecord.min)),
				max: Math.max(0, asFiniteNumber(distanceRecord.max)),
			},
			...(axisBounds && Object.keys(axisBounds).length > 0 ? { axisBounds } : {}),
		},
		updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
	};
}

export function normalizeEnemyState(value: unknown): EnemyState {
	if (!value || typeof value !== "object") {
		return defaultEnemyState;
	}

	const record = value as Record<string, unknown>;
	if (!Array.isArray(record.entries)) {
		return defaultEnemyState;
	}

	const entries = record.entries
		.map(normalizeEnemyEntry)
		.filter((entry): entry is EnemyEntry => entry !== null);
	return { entries };
}
