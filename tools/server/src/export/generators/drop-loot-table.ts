import type { GrimoireEntry, ItemEntry } from "@maf/domain";

type DropRefLike = {
	kind: "item" | "grimoire";
	refId: string;
	weight: number;
	countMin?: number;
	countMax?: number;
};

function linesToLoreValues(value: string): string[] {
	return value
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

function toSpellCustomData(entry: GrimoireEntry): string {
	const primaryVariant = entry.variants[0] ?? { cast: 0, cost: 0 };
	return `spell:{castid:${entry.castid},cost:${primaryVariant.cost},cast:${primaryVariant.cast},title:${JSON.stringify(entry.title)},description:${JSON.stringify(entry.description)},script:${JSON.stringify(entry.script)}}`;
}

function toCountValue(drop: DropRefLike): number | Record<string, unknown> {
	const min = drop.countMin ?? 1;
	const max = drop.countMax ?? 1;
	if (min === max) {
		return min;
	}
	return {
		type: "minecraft:uniform",
		min,
		max,
	};
}

function toWeight(weight: number): number {
	return Number.isFinite(weight) && weight > 0 ? Math.floor(weight) : 1;
}

export function buildDropLootTable(params: {
	drops: DropRefLike[];
	itemsById: Map<string, ItemEntry>;
	grimoiresById: Map<string, GrimoireEntry>;
	context: string;
}): Record<string, unknown> {
	const entries = params.drops.map((drop) => {
		if (drop.kind === "item") {
			const item = params.itemsById.get(drop.refId);
			if (!item) {
				throw new Error(
					`${params.context}: referenced item not found (${drop.refId})`,
				);
			}
			return {
				type: "minecraft:item",
				name: item.itemId,
				weight: toWeight(drop.weight),
				functions: [
					{
						function: "minecraft:set_count",
						count: toCountValue(drop),
					},
					{
						function: "minecraft:set_custom_data",
						tag: `{maf:{source_id:${JSON.stringify(drop.refId)}}}`,
					},
				],
			};
		}

		const grimoire = params.grimoiresById.get(drop.refId);
		if (!grimoire) {
			throw new Error(
				`${params.context}: referenced grimoire not found (${drop.refId})`,
			);
		}

		const lore = linesToLoreValues(grimoire.description).map((line) => ({
			text: line,
		}));
		return {
			type: "minecraft:item",
			name: "minecraft:written_book",
			weight: toWeight(drop.weight),
			functions: [
				{
					function: "minecraft:set_count",
					count: toCountValue(drop),
				},
				{
					function: "minecraft:set_name",
					name: {
						text: grimoire.title,
					},
				},
				{
					function: "minecraft:set_lore",
					lore,
				},
				{
					function: "minecraft:set_custom_data",
					tag: `{maf:{source_id:${JSON.stringify(drop.refId)},${toSpellCustomData(grimoire)}}}`,
				},
			],
		};
	});

	return {
		type: "minecraft:generic",
		pools: [
			{
				rolls: 1,
				entries,
			},
		],
	};
}

export type { DropRefLike };
