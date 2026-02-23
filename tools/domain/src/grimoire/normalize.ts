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
	const variants = normalizeVariants(record);
	if (!variants) {
		return null;
	}

	const script = normalizeScript(record);
	if (!script) {
		return null;
	}

	return {
		id:
			typeof record.id === "string" && record.id.length > 0
				? record.id
				: crypto.randomUUID(),
		castid: asNonNegativeInteger(record.castid),
		script,
		title: typeof record.title === "string" ? record.title : "",
		description:
			typeof record.description === "string" ? record.description : "",
		variants,
		updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
	};
}

function normalizeScript(record: Record<string, unknown>): string | null {
	if (typeof record.script === "string" && record.script.trim().length > 0) {
		return record.script;
	}
	if (typeof record.effectid === "number" && Number.isFinite(record.effectid)) {
		return `effect_${asNonNegativeInteger(record.effectid)}`;
	}
	return null;
}

function normalizeVariants(
	record: Record<string, unknown>,
): GrimoireEntry["variants"] | null {
	if (Array.isArray(record.variants)) {
		const variants = record.variants
			.map((variant) => {
				if (!variant || typeof variant !== "object") return null;
				const typed = variant as Record<string, unknown>;
				return {
					cast: asNonNegativeInteger(typed.cast),
					cost: asNonNegativeInteger(typed.cost),
				};
			})
			.filter(
				(
					variant,
				): variant is {
					cast: number;
					cost: number;
				} => variant !== null,
			);
		return variants.length > 0 ? variants : null;
	}

	if (
		typeof record.cast === "number" &&
		Number.isFinite(record.cast) &&
		typeof record.cost === "number" &&
		Number.isFinite(record.cost)
	) {
		return [
			{
				cast: asNonNegativeInteger(record.cast),
				cost: asNonNegativeInteger(record.cost),
			},
		];
	}

	return null;
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
