import * as v from "valibot";

export const dropRefSchema = v.pipe(
	v.object({
		kind: v.picklist(["item", "grimoire"] as const),
		refId: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(1, "Reference id is required."),
		),
		weight: v.pipe(
			v.number(),
			v.integer("Weight must be an integer."),
			v.minValue(1, "Weight must be at least 1."),
			v.maxValue(100000, "Weight must be 100000 or fewer."),
		),
		countMin: v.optional(
			v.pipe(
				v.number(),
				v.integer("countMin must be an integer."),
				v.minValue(1, "countMin must be at least 1."),
				v.maxValue(64, "countMin must be 64 or fewer."),
			),
		),
		countMax: v.optional(
			v.pipe(
				v.number(),
				v.integer("countMax must be an integer."),
				v.minValue(1, "countMax must be at least 1."),
				v.maxValue(64, "countMax must be 64 or fewer."),
			),
		),
	}),
	v.check(
		(value) =>
			value.countMin === undefined ||
			value.countMax === undefined ||
			value.countMin <= value.countMax,
		"countMin must be less than or equal to countMax.",
	),
);

export const saveTreasureSchema = v.object({
	id: v.pipe(v.string(), v.trim(), v.minLength(1, "Treasure id is required.")),
	name: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, "Name is required."),
		v.maxLength(80, "Name must be 80 characters or fewer."),
	),
	lootPools: v.pipe(
		v.array(dropRefSchema),
		v.minLength(1, "At least one loot pool entry is required."),
	),
});
