import {
	createGrimoireUsecase,
	createItemUsecase,
	type GrimoireEntry,
	type ItemEntry,
} from "@maf/domain";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { loadServerConfig } from "./config.js";
import { exportDatapack } from "./export/index.js";
import {
	createEntryStateRepository,
	createGrimoireStateRepository,
	createItemStateRepository,
	type EntryState,
} from "./repositories/json-file-repositories.js";

type FieldErrors = Record<string, string>;

type SaveEntryResult<TEntry> =
	| {
			ok: true;
			entry: TEntry;
			mode: "created" | "updated";
	  }
	| {
			ok: false;
			fieldErrors: FieldErrors;
			formError?: string;
	  };

type DeleteEntryResult =
	| {
			ok: true;
			deletedId: string;
	  }
	| {
			ok: false;
			formError: string;
			code?: "NOT_FOUND" | "REFERENCE_ERROR";
	  };

type SkillEntry = {
	id: string;
	name: string;
	script: string;
	itemId: string;
	updatedAt: string;
};

type EnemySkillTrigger = "on_spawn" | "on_hit" | "on_low_hp" | "on_timer";

type EnemySkillEntry = {
	id: string;
	name: string;
	script: string;
	cooldown?: number;
	trigger?: EnemySkillTrigger;
	updatedAt: string;
};

type DropRef = {
	kind: "item" | "grimoire";
	refId: string;
	weight: number;
	countMin?: number;
	countMax?: number;
};

type SpawnRule = {
	origin: { x: number; y: number; z: number };
	distance: { min: number; max: number };
	axisBounds?: {
		xMin?: number;
		xMax?: number;
		yMin?: number;
		yMax?: number;
		zMin?: number;
		zMax?: number;
	};
};

type EnemyEntry = {
	id: string;
	name: string;
	hp: number;
	attack?: number;
	defense?: number;
	moveSpeed?: number;
	dropTableId: string;
	enemySkillIds: string[];
	spawnRule: SpawnRule;
	dropTable?: DropRef[];
	updatedAt: string;
};

type TreasureEntry = {
	id: string;
	name: string;
	lootPools: DropRef[];
	updatedAt: string;
};

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeText(value: unknown): string {
	if (typeof value !== "string") {
		return "";
	}
	return value.replace(/\r\n?/g, "\n").trim();
}

function parseRequiredId(
	value: unknown,
	field: string,
	errors: FieldErrors,
): string {
	const id = normalizeText(value);
	if (id.length === 0) {
		errors[field] = "Required.";
		return "";
	}
	if (!UUID_PATTERN.test(id)) {
		errors[field] = "Must be a UUID.";
		return "";
	}
	return id;
}

function parseRequiredText(
	value: unknown,
	field: string,
	errors: FieldErrors,
	minLength: number,
	maxLength: number,
): string {
	const text = normalizeText(value);
	if (text.length < minLength || text.length > maxLength) {
		errors[field] = `Must be ${minLength}..${maxLength} characters.`;
		return "";
	}
	return text;
}

function parseNumberInRange(
	value: unknown,
	field: string,
	errors: FieldErrors,
	min: number,
	max: number,
): number | undefined {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		errors[field] = "Must be a number.";
		return undefined;
	}
	if (value < min || value > max) {
		errors[field] = `Must be between ${min} and ${max}.`;
		return undefined;
	}
	return value;
}

function parseOptionalNumberInRange(
	value: unknown,
	field: string,
	errors: FieldErrors,
	min: number,
	max: number,
): number | undefined {
	if (value == null) {
		return undefined;
	}
	return parseNumberInRange(value, field, errors, min, max);
}

function validationError(
	errors: FieldErrors,
	fallback: string,
): SaveEntryResult<never> {
	return {
		ok: false,
		fieldErrors: errors,
		formError: fallback,
	};
}

function parseDropRef(
	input: unknown,
	index: number,
	itemIds: Set<string>,
	grimoireIds: Set<string>,
	errors: FieldErrors,
): DropRef | undefined {
	if (!isRecord(input)) {
		errors[`lootPools.${index}`] = "Invalid drop reference.";
		return undefined;
	}

	const kind = normalizeText(input.kind);
	if (kind !== "item" && kind !== "grimoire") {
		errors[`lootPools.${index}.kind`] = "Must be item or grimoire.";
		return undefined;
	}

	const refId = parseRequiredId(
		input.refId,
		`lootPools.${index}.refId`,
		errors,
	);
	if (refId) {
		const exists =
			kind === "item" ? itemIds.has(refId) : grimoireIds.has(refId);
		if (!exists) {
			errors[`lootPools.${index}.refId`] = "Referenced entry does not exist.";
		}
	}

	const weight = parseNumberInRange(
		input.weight,
		`lootPools.${index}.weight`,
		errors,
		1,
		100000,
	);

	const countMin = parseOptionalNumberInRange(
		input.countMin,
		`lootPools.${index}.countMin`,
		errors,
		1,
		64,
	);
	const countMax = parseOptionalNumberInRange(
		input.countMax,
		`lootPools.${index}.countMax`,
		errors,
		1,
		64,
	);

	if (countMin != null && countMax != null && countMin > countMax) {
		errors[`lootPools.${index}.countMin`] = "Must be <= countMax.";
	}

	if (!refId || weight == null) {
		return undefined;
	}

	return {
		kind,
		refId,
		weight,
		...(countMin == null ? {} : { countMin }),
		...(countMax == null ? {} : { countMax }),
	};
}

function validateSkill(
	body: unknown,
	itemIds: Set<string>,
	nowIso: string,
): SaveEntryResult<SkillEntry> {
	if (!isRecord(body)) {
		return validationError({}, "Invalid request body.");
	}

	const fieldErrors: FieldErrors = {};
	const id = parseRequiredId(body.id, "id", fieldErrors);
	const name = parseRequiredText(body.name, "name", fieldErrors, 1, 80);
	const script = parseRequiredText(
		body.script,
		"script",
		fieldErrors,
		1,
		20000,
	);
	const itemId = parseRequiredId(body.itemId, "itemId", fieldErrors);
	if (itemId && !itemIds.has(itemId)) {
		fieldErrors.itemId = "Referenced item does not exist.";
	}

	if (Object.keys(fieldErrors).length > 0) {
		return validationError(
			fieldErrors,
			"Validation failed. Fix the highlighted fields.",
		);
	}

	return {
		ok: true,
		mode: "created",
		entry: {
			id,
			name,
			script,
			itemId,
			updatedAt: nowIso,
		},
	};
}

function validateEnemySkill(
	body: unknown,
	nowIso: string,
): SaveEntryResult<EnemySkillEntry> {
	if (!isRecord(body)) {
		return validationError({}, "Invalid request body.");
	}

	const fieldErrors: FieldErrors = {};
	const id = parseRequiredId(body.id, "id", fieldErrors);
	const name = parseRequiredText(body.name, "name", fieldErrors, 1, 80);
	const script = parseRequiredText(
		body.script,
		"script",
		fieldErrors,
		1,
		20000,
	);
	const cooldown = parseOptionalNumberInRange(
		body.cooldown,
		"cooldown",
		fieldErrors,
		0,
		12000,
	);

	let trigger: EnemySkillTrigger | undefined;
	if (body.trigger != null) {
		const rawTrigger = normalizeText(body.trigger);
		if (
			rawTrigger === "on_spawn" ||
			rawTrigger === "on_hit" ||
			rawTrigger === "on_low_hp" ||
			rawTrigger === "on_timer"
		) {
			trigger = rawTrigger;
		} else {
			fieldErrors.trigger = "Invalid trigger.";
		}
	}

	if (Object.keys(fieldErrors).length > 0) {
		return validationError(
			fieldErrors,
			"Validation failed. Fix the highlighted fields.",
		);
	}

	return {
		ok: true,
		mode: "created",
		entry: {
			id,
			name,
			script,
			...(cooldown == null ? {} : { cooldown }),
			...(trigger == null ? {} : { trigger }),
			updatedAt: nowIso,
		},
	};
}

function validateEnemy(
	body: unknown,
	enemySkillIds: Set<string>,
	itemIds: Set<string>,
	grimoireIds: Set<string>,
	nowIso: string,
): SaveEntryResult<EnemyEntry> {
	if (!isRecord(body)) {
		return validationError({}, "Invalid request body.");
	}

	const fieldErrors: FieldErrors = {};
	const id = parseRequiredId(body.id, "id", fieldErrors);
	const name = parseRequiredText(body.name, "name", fieldErrors, 1, 80);
	const hp = parseNumberInRange(body.hp, "hp", fieldErrors, 1, 100000);
	const attack = parseOptionalNumberInRange(
		body.attack,
		"attack",
		fieldErrors,
		0,
		100000,
	);
	const defense = parseOptionalNumberInRange(
		body.defense,
		"defense",
		fieldErrors,
		0,
		100000,
	);
	const moveSpeed = parseOptionalNumberInRange(
		body.moveSpeed,
		"moveSpeed",
		fieldErrors,
		0,
		100000,
	);
	const dropTableId = parseRequiredText(
		body.dropTableId,
		"dropTableId",
		fieldErrors,
		1,
		200,
	);

	const rawEnemySkillIds = body.enemySkillIds;
	const normalizedEnemySkillIds: string[] = [];
	if (!Array.isArray(rawEnemySkillIds)) {
		fieldErrors.enemySkillIds = "Must be an array.";
	} else {
		for (let index = 0; index < rawEnemySkillIds.length; index += 1) {
			const skillId = parseRequiredId(
				rawEnemySkillIds[index],
				`enemySkillIds.${index}`,
				fieldErrors,
			);
			if (!skillId) {
				continue;
			}
			if (!enemySkillIds.has(skillId)) {
				fieldErrors[`enemySkillIds.${index}`] =
					"Referenced enemy skill does not exist.";
				continue;
			}
			if (!normalizedEnemySkillIds.includes(skillId)) {
				normalizedEnemySkillIds.push(skillId);
			}
		}
	}

	let spawnRule: SpawnRule | undefined;
	if (!isRecord(body.spawnRule)) {
		fieldErrors.spawnRule = "Required.";
	} else {
		const origin = isRecord(body.spawnRule.origin)
			? body.spawnRule.origin
			: null;
		const distance = isRecord(body.spawnRule.distance)
			? body.spawnRule.distance
			: null;
		const axisBounds = isRecord(body.spawnRule.axisBounds)
			? body.spawnRule.axisBounds
			: undefined;
		if (!origin) {
			fieldErrors["spawnRule.origin"] = "Required.";
		}
		if (!distance) {
			fieldErrors["spawnRule.distance"] = "Required.";
		}
		const x = parseNumberInRange(
			origin?.x,
			"spawnRule.origin.x",
			fieldErrors,
			-30000000,
			30000000,
		);
		const y = parseNumberInRange(
			origin?.y,
			"spawnRule.origin.y",
			fieldErrors,
			-30000000,
			30000000,
		);
		const z = parseNumberInRange(
			origin?.z,
			"spawnRule.origin.z",
			fieldErrors,
			-30000000,
			30000000,
		);
		const minDistance = parseNumberInRange(
			distance?.min,
			"spawnRule.distance.min",
			fieldErrors,
			0,
			30000000,
		);
		const maxDistance = parseNumberInRange(
			distance?.max,
			"spawnRule.distance.max",
			fieldErrors,
			0,
			30000000,
		);
		if (
			minDistance != null &&
			maxDistance != null &&
			minDistance > maxDistance
		) {
			fieldErrors["spawnRule.distance.min"] = "Must be <= distance.max.";
		}

		const bounds = {
			xMin: parseOptionalNumberInRange(
				axisBounds?.xMin,
				"spawnRule.axisBounds.xMin",
				fieldErrors,
				-30000000,
				30000000,
			),
			xMax: parseOptionalNumberInRange(
				axisBounds?.xMax,
				"spawnRule.axisBounds.xMax",
				fieldErrors,
				-30000000,
				30000000,
			),
			yMin: parseOptionalNumberInRange(
				axisBounds?.yMin,
				"spawnRule.axisBounds.yMin",
				fieldErrors,
				-30000000,
				30000000,
			),
			yMax: parseOptionalNumberInRange(
				axisBounds?.yMax,
				"spawnRule.axisBounds.yMax",
				fieldErrors,
				-30000000,
				30000000,
			),
			zMin: parseOptionalNumberInRange(
				axisBounds?.zMin,
				"spawnRule.axisBounds.zMin",
				fieldErrors,
				-30000000,
				30000000,
			),
			zMax: parseOptionalNumberInRange(
				axisBounds?.zMax,
				"spawnRule.axisBounds.zMax",
				fieldErrors,
				-30000000,
				30000000,
			),
		};

		if (
			bounds.xMin != null &&
			bounds.xMax != null &&
			bounds.xMin > bounds.xMax
		) {
			fieldErrors["spawnRule.axisBounds.xMin"] = "Must be <= xMax.";
		}
		if (
			bounds.yMin != null &&
			bounds.yMax != null &&
			bounds.yMin > bounds.yMax
		) {
			fieldErrors["spawnRule.axisBounds.yMin"] = "Must be <= yMax.";
		}
		if (
			bounds.zMin != null &&
			bounds.zMax != null &&
			bounds.zMin > bounds.zMax
		) {
			fieldErrors["spawnRule.axisBounds.zMin"] = "Must be <= zMax.";
		}

		if (
			x != null &&
			y != null &&
			z != null &&
			minDistance != null &&
			maxDistance != null
		) {
			spawnRule = {
				origin: { x, y, z },
				distance: { min: minDistance, max: maxDistance },
				...(Object.values(bounds).some((v) => v != null)
					? { axisBounds: bounds }
					: {}),
			};
		}
	}

	let dropTable: DropRef[] | undefined;
	if (body.dropTable != null) {
		if (!Array.isArray(body.dropTable)) {
			fieldErrors.dropTable = "Must be an array.";
		} else {
			const normalized: DropRef[] = [];
			for (let index = 0; index < body.dropTable.length; index += 1) {
				const parsed = parseDropRef(
					body.dropTable[index],
					index,
					itemIds,
					grimoireIds,
					fieldErrors,
				);
				if (parsed) {
					normalized.push(parsed);
				}
			}
			dropTable = normalized;
		}
	}

	if (Object.keys(fieldErrors).length > 0 || hp == null || !spawnRule) {
		return validationError(
			fieldErrors,
			"Validation failed. Fix the highlighted fields.",
		);
	}

	return {
		ok: true,
		mode: "created",
		entry: {
			id,
			name,
			hp,
			...(attack == null ? {} : { attack }),
			...(defense == null ? {} : { defense }),
			...(moveSpeed == null ? {} : { moveSpeed }),
			dropTableId,
			enemySkillIds: normalizedEnemySkillIds,
			spawnRule,
			...(dropTable == null ? {} : { dropTable }),
			updatedAt: nowIso,
		},
	};
}

function validateTreasure(
	body: unknown,
	itemIds: Set<string>,
	grimoireIds: Set<string>,
	nowIso: string,
): SaveEntryResult<TreasureEntry> {
	if (!isRecord(body)) {
		return validationError({}, "Invalid request body.");
	}

	const fieldErrors: FieldErrors = {};
	const id = parseRequiredId(body.id, "id", fieldErrors);
	const name = parseRequiredText(body.name, "name", fieldErrors, 1, 80);
	const rawLootPools = body.lootPools;
	const lootPools: DropRef[] = [];
	if (!Array.isArray(rawLootPools) || rawLootPools.length === 0) {
		fieldErrors.lootPools = "At least one loot pool is required.";
	} else {
		for (let index = 0; index < rawLootPools.length; index += 1) {
			const parsed = parseDropRef(
				rawLootPools[index],
				index,
				itemIds,
				grimoireIds,
				fieldErrors,
			);
			if (parsed) {
				lootPools.push(parsed);
			}
		}
	}

	if (Object.keys(fieldErrors).length > 0) {
		return validationError(
			fieldErrors,
			"Validation failed. Fix the highlighted fields.",
		);
	}

	return {
		ok: true,
		mode: "created",
		entry: {
			id,
			name,
			lootPools,
			updatedAt: nowIso,
		},
	};
}

function upsertEntry<TEntry extends { id: string }>(
	state: EntryState<TEntry>,
	entry: TEntry,
): { nextState: EntryState<TEntry>; mode: "created" | "updated" } {
	const index = state.entries.findIndex((current) => current.id === entry.id);
	if (index >= 0) {
		const nextEntries = [...state.entries];
		nextEntries[index] = entry;
		return {
			nextState: { entries: nextEntries },
			mode: "updated",
		};
	}
	return {
		nextState: { entries: [...state.entries, entry] },
		mode: "created",
	};
}

function deleteEntry<TEntry extends { id: string }>(
	state: EntryState<TEntry>,
	id: string,
): { ok: true; nextState: EntryState<TEntry> } | { ok: false } {
	const nextEntries = state.entries.filter((entry) => entry.id !== id);
	if (nextEntries.length === state.entries.length) {
		return { ok: false };
	}
	return {
		ok: true,
		nextState: { entries: nextEntries },
	};
}

function toIdSet(entries: Array<{ id: string }>): Set<string> {
	return new Set(entries.map((entry) => entry.id));
}

function trimId(id: string): string {
	return id.trim();
}

function notFoundMessage(entityName: string): DeleteEntryResult {
	return {
		ok: false,
		code: "NOT_FOUND",
		formError: `${entityName} not found.`,
	};
}

export function createApp() {
	const config = loadServerConfig();
	const itemRepository = createItemStateRepository(config.itemStatePath);
	const grimoireRepository = createGrimoireStateRepository(
		config.grimoireStatePath,
	);
	const skillRepository = createEntryStateRepository<SkillEntry>(
		config.skillStatePath,
	);
	const enemySkillRepository = createEntryStateRepository<EnemySkillEntry>(
		config.enemySkillStatePath,
	);
	const enemyRepository = createEntryStateRepository<EnemyEntry>(
		config.enemyStatePath,
	);
	const treasureRepository = createEntryStateRepository<TreasureEntry>(
		config.treasureStatePath,
	);

	const itemUsecase = createItemUsecase({ itemRepository });
	const grimoireUsecase = createGrimoireUsecase({ grimoireRepository });

	const app = new Hono();

	app.use(
		"*",
		cors({
			origin: config.allowedOrigin,
			allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
			allowHeaders: ["Content-Type"],
		}),
	);

	app.get("/health", (c) => c.json({ ok: true }));

	app.get("/api/items", async (c) => {
		const state = await itemUsecase.loadItems();
		return c.json(state);
	});

	app.post("/api/items", async (c) => {
		const body = await c.req.json();
		const result = await itemUsecase.saveItem(body);
		return c.json(result, result.ok ? 200 : 400);
	});

	app.delete("/api/items/:id", async (c) => {
		const id = c.req.param("id");
		const result = await itemUsecase.deleteItem({ id });
		return c.json(result, result.ok ? 200 : 404);
	});

	app.get("/api/grimoire", async (c) => {
		const state = await grimoireUsecase.loadGrimoire();
		return c.json(state);
	});

	app.post("/api/grimoire", async (c) => {
		const body = await c.req.json();
		const result = await grimoireUsecase.saveGrimoireEntry(body);
		return c.json(result, result.ok ? 200 : 400);
	});

	app.delete("/api/grimoire/:id", async (c) => {
		const id = c.req.param("id");
		const result = await grimoireUsecase.deleteGrimoireEntry(id);
		return c.json(result, result.ok ? 200 : 404);
	});

	app.get("/api/skills", async (c) => {
		const state = await skillRepository.loadState();
		return c.json(state);
	});

	app.post("/api/skills", async (c) => {
		const body = await c.req.json();
		const nowIso = new Date().toISOString();
		const itemState = await itemUsecase.loadItems();
		const parsed = validateSkill(body, toIdSet(itemState.items), nowIso);
		if (!parsed.ok) {
			return c.json(parsed, 400);
		}

		const state = await skillRepository.loadState();
		const { nextState, mode } = upsertEntry(state, parsed.entry);
		await skillRepository.saveState(nextState);
		return c.json({ ok: true, entry: parsed.entry, mode }, 200);
	});

	app.delete("/api/skills/:id", async (c) => {
		const id = trimId(c.req.param("id"));
		if (id.length === 0) {
			return c.json({ ok: false, formError: "Missing skill id." }, 400);
		}

		const state = await skillRepository.loadState();
		const deleted = deleteEntry(state, id);
		if (!deleted.ok) {
			return c.json(notFoundMessage("Skill"), 404);
		}
		await skillRepository.saveState(deleted.nextState);
		return c.json({ ok: true, deletedId: id }, 200);
	});

	app.get("/api/enemy-skills", async (c) => {
		const state = await enemySkillRepository.loadState();
		return c.json(state);
	});

	app.post("/api/enemy-skills", async (c) => {
		const body = await c.req.json();
		const nowIso = new Date().toISOString();
		const parsed = validateEnemySkill(body, nowIso);
		if (!parsed.ok) {
			return c.json(parsed, 400);
		}

		const state = await enemySkillRepository.loadState();
		const { nextState, mode } = upsertEntry(state, parsed.entry);
		await enemySkillRepository.saveState(nextState);
		return c.json({ ok: true, entry: parsed.entry, mode }, 200);
	});

	app.delete("/api/enemy-skills/:id", async (c) => {
		const id = trimId(c.req.param("id"));
		if (id.length === 0) {
			return c.json({ ok: false, formError: "Missing enemy skill id." }, 400);
		}

		const enemyState = await enemyRepository.loadState();
		const referenced = enemyState.entries.find((enemy) =>
			enemy.enemySkillIds.includes(id),
		);
		if (referenced) {
			return c.json(
				{
					ok: false,
					code: "REFERENCE_ERROR",
					formError: `Enemy skill is referenced by enemy ${referenced.id}.`,
				},
				400,
			);
		}

		const state = await enemySkillRepository.loadState();
		const deleted = deleteEntry(state, id);
		if (!deleted.ok) {
			return c.json(notFoundMessage("Enemy skill"), 404);
		}
		await enemySkillRepository.saveState(deleted.nextState);
		return c.json({ ok: true, deletedId: id }, 200);
	});

	app.get("/api/enemies", async (c) => {
		const state = await enemyRepository.loadState();
		return c.json(state);
	});

	app.post("/api/enemies", async (c) => {
		const body = await c.req.json();
		const nowIso = new Date().toISOString();
		const [enemySkillState, itemState, grimoireState] = await Promise.all([
			enemySkillRepository.loadState(),
			itemUsecase.loadItems(),
			grimoireUsecase.loadGrimoire(),
		]);
		const parsed = validateEnemy(
			body,
			toIdSet(enemySkillState.entries),
			toIdSet(itemState.items as ItemEntry[]),
			toIdSet(grimoireState.entries as GrimoireEntry[]),
			nowIso,
		);
		if (!parsed.ok) {
			return c.json(parsed, 400);
		}

		const state = await enemyRepository.loadState();
		const { nextState, mode } = upsertEntry(state, parsed.entry);
		await enemyRepository.saveState(nextState);
		return c.json({ ok: true, entry: parsed.entry, mode }, 200);
	});

	app.delete("/api/enemies/:id", async (c) => {
		const id = trimId(c.req.param("id"));
		if (id.length === 0) {
			return c.json({ ok: false, formError: "Missing enemy id." }, 400);
		}

		const state = await enemyRepository.loadState();
		const deleted = deleteEntry(state, id);
		if (!deleted.ok) {
			return c.json(notFoundMessage("Enemy"), 404);
		}
		await enemyRepository.saveState(deleted.nextState);
		return c.json({ ok: true, deletedId: id }, 200);
	});

	app.get("/api/treasures", async (c) => {
		const state = await treasureRepository.loadState();
		return c.json(state);
	});

	app.post("/api/treasures", async (c) => {
		const body = await c.req.json();
		const nowIso = new Date().toISOString();
		const [itemState, grimoireState] = await Promise.all([
			itemUsecase.loadItems(),
			grimoireUsecase.loadGrimoire(),
		]);
		const parsed = validateTreasure(
			body,
			toIdSet(itemState.items as ItemEntry[]),
			toIdSet(grimoireState.entries as GrimoireEntry[]),
			nowIso,
		);
		if (!parsed.ok) {
			return c.json(parsed, 400);
		}

		const state = await treasureRepository.loadState();
		const { nextState, mode } = upsertEntry(state, parsed.entry);
		await treasureRepository.saveState(nextState);
		return c.json({ ok: true, entry: parsed.entry, mode }, 200);
	});

	app.delete("/api/treasures/:id", async (c) => {
		const id = trimId(c.req.param("id"));
		if (id.length === 0) {
			return c.json({ ok: false, formError: "Missing treasure id." }, 400);
		}

		const state = await treasureRepository.loadState();
		const deleted = deleteEntry(state, id);
		if (!deleted.ok) {
			return c.json(notFoundMessage("Treasure"), 404);
		}
		await treasureRepository.saveState(deleted.nextState);
		return c.json({ ok: true, deletedId: id }, 200);
	});

	app.post("/api/save", async (c) => {
		const result = await exportDatapack({
			itemUsecase,
			grimoireUsecase,
			itemStatePath: config.itemStatePath,
			grimoireStatePath: config.grimoireStatePath,
			exportSettingsPath: config.exportSettingsPath,
		});
		return c.json(result, result.ok ? 200 : 400);
	});

	return { app, config };
}
