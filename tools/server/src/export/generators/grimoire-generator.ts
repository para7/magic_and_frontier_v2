import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GrimoireEntry } from "@maf/domain";
import type { ExportSettings } from "../types.js";

function textComponent(value: string): string {
	const json = JSON.stringify({ text: value }).replace(/'/g, "\\'");
	return `'${json}'`;
}

function linesToLoreValues(value: string): string[] {
	return value
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

function toSpellCustomData(entry: GrimoireEntry): string {
	return `maf:{spell:{castid:${entry.castid},effectid:${entry.effectid},cost:${entry.cost},cast:${entry.cast},title:${JSON.stringify(entry.title)},description:${JSON.stringify(entry.description)}}}`;
}

function toSpellLootTable(entry: GrimoireEntry): Record<string, unknown> {
	const lore = linesToLoreValues(entry.description).map((line) => ({
		text: line,
	}));
	return {
		type: "minecraft:generic",
		pools: [
			{
				rolls: 1,
				entries: [
					{
						type: "minecraft:item",
						name: "minecraft:written_book",
						functions: [
							{
								function: "minecraft:set_name",
								name: {
									text: entry.title,
								},
							},
							{
								function: "minecraft:set_lore",
								lore,
							},
							{
								function: "minecraft:set_custom_data",
								tag: `{${toSpellCustomData(entry)}}`,
							},
						],
					},
				],
			},
		],
	};
}

function toSpellGiveCommand(entry: GrimoireEntry): string {
	const loreParts = linesToLoreValues(entry.description).map(textComponent);
	const loreValue =
		loreParts.length > 0 ? `,lore:[${loreParts.join(",")}]` : "";
	const customName = `'${JSON.stringify({ text: entry.title }).replace(/'/g, "\\'")}'`;
	return `give @s minecraft:written_book[custom_name=${customName}${loreValue},custom_data={${toSpellCustomData(entry)}}] 1`;
}

export async function generateGrimoireOutputs(params: {
	settings: ExportSettings;
	entries: GrimoireEntry[];
}): Promise<{ spellFunctions: number; spellLootTables: number }> {
	const { settings, entries } = params;
	const functionRoot = path.join(
		settings.outputRoot,
		settings.paths.spellFunctionDir,
	);
	const lootRoot = path.join(settings.outputRoot, settings.paths.spellLootDir);

	await mkdir(functionRoot, { recursive: true });
	await mkdir(lootRoot, { recursive: true });

	for (const entry of entries) {
		const baseName = `cast_${entry.castid}`;
		const functionPath = path.join(functionRoot, `${baseName}.mcfunction`);
		const lootPath = path.join(lootRoot, `${baseName}.json`);
		const lines = [
			`# castid=${entry.castid} effectid=${entry.effectid} sourceId=${entry.id}`,
			toSpellGiveCommand(entry),
		];

		await writeFile(functionPath, `${lines.join("\n")}\n`, "utf-8");
		await writeFile(
			lootPath,
			`${JSON.stringify(toSpellLootTable(entry), null, 2)}\n`,
			"utf-8",
		);
	}

	return {
		spellFunctions: entries.length,
		spellLootTables: entries.length,
	};
}
