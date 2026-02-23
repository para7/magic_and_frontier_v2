import { defaultSkillState, type SkillEntry, type SkillState } from "./types.js";

function normalizeSkillEntry(value: unknown): SkillEntry | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const id = typeof record.id === "string" ? record.id.trim() : "";
	const name = typeof record.name === "string" ? record.name.trim() : "";
	const script = typeof record.script === "string" ? record.script.trim() : "";
	const itemId = typeof record.itemId === "string" ? record.itemId.trim() : "";

	return {
		id: id.length > 0 ? id : crypto.randomUUID(),
		name,
		script,
		itemId,
		updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
	};
}

export function normalizeSkillState(value: unknown): SkillState {
	if (!value || typeof value !== "object") {
		return defaultSkillState;
	}

	const record = value as Record<string, unknown>;
	if (!Array.isArray(record.entries)) {
		return defaultSkillState;
	}

	const entries = record.entries
		.map(normalizeSkillEntry)
		.filter((entry): entry is SkillEntry => entry !== null);
	return { entries };
}
