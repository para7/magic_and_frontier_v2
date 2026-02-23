import type { GrimoireUsecase, ItemUsecase } from "@maf/domain";
import { writeDatapackScaffold } from "./datapack-template.js";
import { generateEnemyOutputs } from "./generators/enemy-generator.js";
import {
	generateEnemySkillFunctionOutputs,
	generateSkillFunctionOutputs,
} from "./generators/function-generator.js";
import { generateGrimoireOutputs } from "./generators/grimoire-generator.js";
import { generateItemOutputs } from "./generators/item-generator.js";
import { generateTreasureLootOutputs } from "./generators/treasure-generator.js";
import { loadExportSettings } from "./settings.js";
import type { SaveDataResponse } from "./types.js";

type EntryState<TEntry> = { entries: TEntry[] };

type SkillLike = { id: string; script: string };
type EnemySkillLike = { id: string; script: string };
type TreasureLike = {
	id: string;
	lootPools: Array<{
		kind: "item" | "grimoire";
		refId: string;
		weight: number;
		countMin?: number;
		countMax?: number;
	}>;
};
type EnemyLike = {
	id: string;
	name?: string;
	dropTable?: TreasureLike["lootPools"];
	lootPools?: TreasureLike["lootPools"];
	dropTableId?: string;
	spawnRule?: {
		origin?: { x: number; y: number; z: number };
		distance?: { min: number; max: number };
		axisBounds?: {
			xMin?: number;
			xMax?: number;
			yMin?: number;
			yMax?: number;
			zMin?: number;
			zMax?: number;
		};
	};
};

function getLoaderMethod<TEntry>(
	source: unknown,
	candidates: string[],
): (() => Promise<EntryState<TEntry> | TEntry[]>) | null {
	if (!source || typeof source !== "object") {
		return null;
	}

	for (const name of candidates) {
		const maybeMethod = (source as Record<string, unknown>)[name];
		if (typeof maybeMethod === "function") {
			return maybeMethod as () => Promise<EntryState<TEntry> | TEntry[]>;
		}
	}
	return null;
}

function normalizeEntries<TEntry>(
	state: EntryState<TEntry> | TEntry[],
): TEntry[] {
	if (Array.isArray(state)) {
		return state;
	}
	if (Array.isArray(state.entries)) {
		return state.entries;
	}
	return [];
}

async function loadOptionalEntries<TEntry>(params: {
	source?: unknown;
	methodNames: string[];
}): Promise<TEntry[]> {
	const loader = getLoaderMethod<TEntry>(params.source, params.methodNames);
	if (!loader) {
		return [];
	}

	const state = await loader();
	return normalizeEntries(state);
}

export async function exportDatapack(params: {
	itemUsecase: ItemUsecase;
	grimoireUsecase: GrimoireUsecase;
	skillUsecase?: unknown;
	enemySkillUsecase?: unknown;
	enemyUsecase?: unknown;
	treasureUsecase?: unknown;
	itemStatePath: string;
	grimoireStatePath: string;
	exportSettingsPath: string;
}): Promise<SaveDataResponse> {
	try {
		const settings = await loadExportSettings(params.exportSettingsPath);
		const [itemState, grimoireState] = await Promise.all([
			params.itemUsecase.loadItems(),
			params.grimoireUsecase.loadGrimoire(),
		]);
		const [skills, enemySkills, enemies, treasures] = await Promise.all([
			loadOptionalEntries<SkillLike>({
				source: params.skillUsecase,
				methodNames: ["loadSkills", "loadState", "loadSkillState"],
			}),
			loadOptionalEntries<EnemySkillLike>({
				source: params.enemySkillUsecase,
				methodNames: ["loadEnemySkills", "loadState", "loadEnemySkillState"],
			}),
			loadOptionalEntries<EnemyLike>({
				source: params.enemyUsecase,
				methodNames: ["loadEnemies", "loadState", "loadEnemyState"],
			}),
			loadOptionalEntries<TreasureLike>({
				source: params.treasureUsecase,
				methodNames: ["loadTreasures", "loadState", "loadTreasureState"],
			}),
		]);

		await writeDatapackScaffold(settings);
		const itemStats = await generateItemOutputs({
			settings,
			items: itemState.items,
		});
		const spellStats = await generateGrimoireOutputs({
			settings,
			entries: grimoireState.entries,
		});
		const skillStats = await generateSkillFunctionOutputs({
			settings,
			entries: skills,
		});
		const enemySkillStats = await generateEnemySkillFunctionOutputs({
			settings,
			entries: enemySkills,
		});
		const enemyStats = await generateEnemyOutputs({
			settings,
			entries: enemies,
			treasures,
			items: itemState.items,
			grimoires: grimoireState.entries,
		});
		const treasureStats = await generateTreasureLootOutputs({
			settings,
			entries: treasures,
			items: itemState.items,
			grimoires: grimoireState.entries,
		});

		const totalFiles =
			itemStats.itemFunctions +
			itemStats.itemLootTables +
			spellStats.spellFunctions +
			spellStats.spellLootTables +
			skillStats.skillFunctions +
			enemySkillStats.enemySkillFunctions +
			enemyStats.enemyFunctions +
			enemyStats.enemyLootTables +
			treasureStats.treasureLootTables +
			3;

		return {
			ok: true,
			message: "datapack export completed",
			outputRoot: settings.outputRoot,
			generated: {
				...itemStats,
				...spellStats,
				...skillStats,
				...enemySkillStats,
				...enemyStats,
				...treasureStats,
				totalFiles,
			},
		};
	} catch (error) {
		const details = error instanceof Error ? error.message : String(error);
		const isConfigError = /settings|namespace|paths|templatePackPath/.test(
			details,
		);
		const code = isConfigError ? "INVALID_CONFIG" : "EXPORT_FAILED";
		console.error(`[save] ${code}: ${details}`);
		return {
			ok: false,
			code,
			message:
				code === "INVALID_CONFIG"
					? "Invalid export settings."
					: "Datapack export failed.",
			details,
		};
	}
}
