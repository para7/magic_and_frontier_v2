import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GrimoireEntry, ItemEntry } from "@maf/domain";
import type { ExportSettings } from "../types.js";
import { buildDropLootTable, type DropRefLike } from "./drop-loot-table.js";

type SpawnRuleLike = {
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

type EnemyEntryLike = {
	id: string;
	name?: string;
	dropTable?: DropRefLike[];
	lootPools?: DropRefLike[];
	dropTableId?: string;
	spawnRule?: SpawnRuleLike;
};

type TreasureLike = {
	id: string;
	lootPools: DropRefLike[];
};

function resolveDrops(
	entry: EnemyEntryLike,
	treasuresById: Map<string, TreasureLike>,
): DropRefLike[] {
	if (Array.isArray(entry.dropTable) && entry.dropTable.length > 0) {
		return entry.dropTable;
	}
	if (Array.isArray(entry.lootPools) && entry.lootPools.length > 0) {
		return entry.lootPools;
	}
	if (entry.dropTableId) {
		const treasure = treasuresById.get(entry.dropTableId);
		if (treasure?.lootPools?.length) {
			return treasure.lootPools;
		}
	}
	throw new Error(`enemy(${entry.id}): drop table was not found`);
}

function toSpawnFunctionLines(entry: EnemyEntryLike): string[] {
	const origin = entry.spawnRule?.origin ?? { x: 0, y: 0, z: 0 };
	const distance = entry.spawnRule?.distance ?? { min: 0, max: 0 };
	const bounds = entry.spawnRule?.axisBounds;
	const lines = [
		`# enemyId=${entry.id} name=${entry.name ?? entry.id}`,
		`# distance=${distance.min}..${distance.max}`,
		`execute positioned ${origin.x} ${origin.y} ${origin.z} run summon minecraft:zombie ~ ~ ~`,
	];
	if (bounds) {
		lines.splice(
			2,
			0,
			`# axisBounds=${JSON.stringify(bounds).replace(/\s+/g, "")}`,
		);
	}
	return lines;
}

export async function generateEnemyOutputs(params: {
	settings: ExportSettings;
	entries: EnemyEntryLike[];
	treasures: TreasureLike[];
	items: ItemEntry[];
	grimoires: GrimoireEntry[];
}): Promise<{ enemyFunctions: number; enemyLootTables: number }> {
	const functionRoot = path.join(
		params.settings.outputRoot,
		params.settings.paths.enemyFunctionDir,
	);
	const lootRoot = path.join(
		params.settings.outputRoot,
		params.settings.paths.enemyLootDir,
	);
	await mkdir(functionRoot, { recursive: true });
	await mkdir(lootRoot, { recursive: true });

	const treasuresById = new Map(
		params.treasures.map((entry) => [entry.id, entry]),
	);
	const itemsById = new Map(params.items.map((item) => [item.id, item]));
	const grimoiresById = new Map(
		params.grimoires.map((entry) => [entry.id, entry]),
	);

	for (const entry of params.entries) {
		const functionPath = path.join(functionRoot, `${entry.id}.mcfunction`);
		const lootPath = path.join(lootRoot, `${entry.id}.json`);
		const drops = resolveDrops(entry, treasuresById);
		const lootTable = buildDropLootTable({
			drops,
			itemsById,
			grimoiresById,
			context: `enemy(${entry.id})`,
		});

		await writeFile(
			functionPath,
			`${toSpawnFunctionLines(entry).join("\n")}\n`,
			"utf-8",
		);
		await writeFile(
			lootPath,
			`${JSON.stringify(lootTable, null, 2)}\n`,
			"utf-8",
		);
	}

	return {
		enemyFunctions: params.entries.length,
		enemyLootTables: params.entries.length,
	};
}
