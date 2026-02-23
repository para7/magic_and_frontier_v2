import {
	defaultEnemySkillState,
	type EnemySkillEntry,
	type EnemySkillState,
} from "./types.js";

function asOptionalInteger(value: unknown): number | undefined {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return undefined;
	}
	return Math.floor(value);
}

function normalizeEnemySkillEntry(value: unknown): EnemySkillEntry | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const id = typeof record.id === "string" ? record.id.trim() : "";
	const name = typeof record.name === "string" ? record.name.trim() : "";
	const script = typeof record.script === "string" ? record.script.trim() : "";
	const cooldown = asOptionalInteger(record.cooldown);
	const trigger =
		record.trigger === "on_spawn" ||
		record.trigger === "on_hit" ||
		record.trigger === "on_low_hp" ||
		record.trigger === "on_timer"
			? record.trigger
			: undefined;

	return {
		id: id.length > 0 ? id : crypto.randomUUID(),
		name,
		script,
		...(cooldown === undefined ? {} : { cooldown }),
		...(trigger === undefined ? {} : { trigger }),
		updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
	};
}

export function normalizeEnemySkillState(value: unknown): EnemySkillState {
	if (!value || typeof value !== "object") {
		return defaultEnemySkillState;
	}

	const record = value as Record<string, unknown>;
	if (!Array.isArray(record.entries)) {
		return defaultEnemySkillState;
	}

	const entries = record.entries
		.map(normalizeEnemySkillEntry)
		.filter((entry): entry is EnemySkillEntry => entry !== null);
	return { entries };
}
