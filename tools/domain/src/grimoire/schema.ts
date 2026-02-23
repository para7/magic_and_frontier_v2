import * as v from "valibot";

const grimoireVariantSchema = v.object({
	cast: v.pipe(
		v.number(),
		v.integer("cast must be an integer."),
		v.minValue(0, "cast must be 0 or greater."),
	),
	cost: v.pipe(
		v.number(),
		v.integer("cost must be an integer."),
		v.minValue(0, "cost must be 0 or greater."),
	),
});

export const saveGrimoireEntrySchema = v.object({
	id: v.pipe(v.string(), v.trim(), v.minLength(1, "Entry id is required.")),
	castid: v.pipe(
		v.number(),
		v.integer("castid must be an integer."),
		v.minValue(0, "castid must be 0 or greater."),
	),
	script: v.pipe(v.string(), v.trim(), v.minLength(1, "script is required.")),
	title: v.pipe(
		v.string(),
		v.maxLength(200, "title must be 200 characters or fewer."),
	),
	description: v.pipe(
		v.string(),
		v.maxLength(2000, "description must be 2000 characters or fewer."),
	),
	variants: v.pipe(
		v.array(grimoireVariantSchema),
		v.minLength(1, "At least one cast/cost pair is required."),
	),
});
