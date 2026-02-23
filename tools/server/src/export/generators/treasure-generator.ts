import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GrimoireEntry, ItemEntry } from "@maf/domain";
import type { ExportSettings } from "../types.js";
import { buildDropLootTable, type DropRefLike } from "./drop-loot-table.js";

type TreasureEntryLike = {
	id: string;
	lootPools: DropRefLike[];
};

export async function generateTreasureLootOutputs(params: {
	settings: ExportSettings;
	entries: TreasureEntryLike[];
	items: ItemEntry[];
	grimoires: GrimoireEntry[];
}): Promise<{ treasureLootTables: number }> {
	const lootRoot = path.join(
		params.settings.outputRoot,
		params.settings.paths.treasureLootDir,
	);
	await mkdir(lootRoot, { recursive: true });

	const itemsById = new Map(params.items.map((item) => [item.id, item]));
	const grimoiresById = new Map(
		params.grimoires.map((entry) => [entry.id, entry]),
	);

	for (const entry of params.entries) {
		if (!Array.isArray(entry.lootPools) || entry.lootPools.length === 0) {
			throw new Error(`treasure(${entry.id}): lootPools must not be empty`);
		}

		const lootPath = path.join(lootRoot, `${entry.id}.json`);
		const lootTable = buildDropLootTable({
			drops: entry.lootPools,
			itemsById,
			grimoiresById,
			context: `treasure(${entry.id})`,
		});
		await writeFile(
			lootPath,
			`${JSON.stringify(lootTable, null, 2)}\n`,
			"utf-8",
		);
	}

	return {
		treasureLootTables: params.entries.length,
	};
}
