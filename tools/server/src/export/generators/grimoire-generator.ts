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

function toSpellCustomData(
	entry: GrimoireEntry,
	variant: GrimoireEntry["variants"][number],
): string {
	return `maf:{spell:{castid:${entry.castid},cost:${variant.cost},cast:${variant.cast},title:${JSON.stringify(entry.title)},description:${JSON.stringify(entry.description)},script:${JSON.stringify(entry.script)}}}`;
}

function toSpellLootTable(
	entry: GrimoireEntry,
	variant: GrimoireEntry["variants"][number],
): Record<string, unknown> {
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
								tag: `{${toSpellCustomData(entry, variant)}}`,
							},
						],
					},
				],
			},
		],
	};
}

function toSpellGiveCommand(
	entry: GrimoireEntry,
	variant: GrimoireEntry["variants"][number],
): string {
	const loreParts = linesToLoreValues(entry.description).map(textComponent);
	const loreValue =
		loreParts.length > 0 ? `,lore:[${loreParts.join(",")}]` : "";
	const customName = `'${JSON.stringify({ text: entry.title }).replace(/'/g, "\\'")}'`;
	return `give @s minecraft:written_book[custom_name=${customName}${loreValue},custom_data={${toSpellCustomData(entry, variant)}}] 1`;
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
		for (const [variantIndex, variant] of entry.variants.entries()) {
			const baseName = `cast_${entry.castid}_v${variantIndex + 1}`;
			const functionPath = path.join(functionRoot, `${baseName}.mcfunction`);
			const lootPath = path.join(lootRoot, `${baseName}.json`);
			const lines = [
				`# castid=${entry.castid} variant=${variantIndex + 1} sourceId=${entry.id}`,
				toSpellGiveCommand(entry, variant),
			];

			await writeFile(functionPath, `${lines.join("\n")}\n`, "utf-8");
			await writeFile(
				lootPath,
				`${JSON.stringify(toSpellLootTable(entry, variant), null, 2)}\n`,
				"utf-8",
			);
		}
	}

	const variantCount = entries.reduce(
		(sum, entry) => sum + entry.variants.length,
		0,
	);
	return {
		spellFunctions: variantCount,
		spellLootTables: variantCount,
	};
}
