import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ItemEntry } from "@maf/domain";
import type { ExportSettings } from "../types.js";

function nbtString(value: string): string {
	return JSON.stringify(value);
}

function toItemLootTable(item: ItemEntry): Record<string, unknown> {
	return {
		type: "minecraft:generic",
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:item",
						name: item.itemId,
						functions: [
							{
								function: "minecraft:set_count",
								count: item.count,
							},
							{
								function: "minecraft:set_custom_data",
								tag: `{maf:{item_id:${nbtString(item.itemId)},source_id:${nbtString(item.id)},nbt_snapshot:${nbtString(item.nbt)}}}`,
							},
						],
					},
				],
			},
		],
	};
}

export async function generateItemOutputs(params: {
	settings: ExportSettings;
	items: ItemEntry[];
}): Promise<{ itemFunctions: number; itemLootTables: number }> {
	const { settings, items } = params;
	const functionRoot = path.join(
		settings.outputRoot,
		settings.paths.itemFunctionDir,
	);
	const lootRoot = path.join(settings.outputRoot, settings.paths.itemLootDir);

	await mkdir(functionRoot, { recursive: true });
	await mkdir(lootRoot, { recursive: true });

	for (const item of items) {
		const functionPath = path.join(functionRoot, `${item.id}.mcfunction`);
		const lootPath = path.join(lootRoot, `${item.id}.json`);

		const lines = [
			`# itemId=${item.itemId} sourceId=${item.id}`,
			`loot give @s loot ${settings.namespace}:item/${item.id}`,
		];
		await writeFile(functionPath, `${lines.join("\n")}\n`, "utf-8");
		await writeFile(
			lootPath,
			`${JSON.stringify(toItemLootTable(item), null, 2)}\n`,
			"utf-8",
		);
	}

	return {
		itemFunctions: items.length,
		itemLootTables: items.length,
	};
}
