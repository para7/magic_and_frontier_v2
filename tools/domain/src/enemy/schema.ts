import * as v from "valibot";

const finiteNumberSchema = v.pipe(
	v.number(),
	v.finite("Must be a finite number."),
);

const nonNegativeNumberSchema = v.pipe(
	finiteNumberSchema,
	v.minValue(0, "Must be 0 or greater."),
);

const axisBoundsSchema = v.partial(
	v.object({
		xMin: finiteNumberSchema,
		xMax: finiteNumberSchema,
		yMin: finiteNumberSchema,
		yMax: finiteNumberSchema,
		zMin: finiteNumberSchema,
		zMax: finiteNumberSchema,
	}),
);

const spawnRuleSchemaBase = v.object({
	origin: v.object({
		x: finiteNumberSchema,
		y: finiteNumberSchema,
		z: finiteNumberSchema,
	}),
	distance: v.object({
		min: nonNegativeNumberSchema,
		max: nonNegativeNumberSchema,
	}),
	axisBounds: v.optional(axisBoundsSchema),
});

export const spawnRuleSchema = v.pipe(
	spawnRuleSchemaBase,
	v.check(
		(value) => value.distance.min <= value.distance.max,
		"distance.min must be less than or equal to distance.max.",
	),
	v.check(
		(value) =>
			value.axisBounds === undefined ||
			value.axisBounds.xMin === undefined ||
			value.axisBounds.xMax === undefined ||
			value.axisBounds.xMin <= value.axisBounds.xMax,
		"axisBounds.xMin must be less than or equal to axisBounds.xMax.",
	),
	v.check(
		(value) =>
			value.axisBounds === undefined ||
			value.axisBounds.yMin === undefined ||
			value.axisBounds.yMax === undefined ||
			value.axisBounds.yMin <= value.axisBounds.yMax,
		"axisBounds.yMin must be less than or equal to axisBounds.yMax.",
	),
	v.check(
		(value) =>
			value.axisBounds === undefined ||
			value.axisBounds.zMin === undefined ||
			value.axisBounds.zMax === undefined ||
			value.axisBounds.zMin <= value.axisBounds.zMax,
		"axisBounds.zMin must be less than or equal to axisBounds.zMax.",
	),
);

export const saveEnemySchema = v.object({
	id: v.pipe(v.string(), v.trim(), v.minLength(1, "Enemy id is required.")),
	name: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, "Name is required."),
		v.maxLength(80, "Name must be 80 characters or fewer."),
	),
	hp: v.pipe(
		v.number(),
		v.integer("HP must be an integer."),
		v.minValue(1, "HP must be at least 1."),
		v.maxValue(100000, "HP must be 100000 or fewer."),
	),
	attack: v.optional(
		v.pipe(
			v.number(),
			v.integer("Attack must be an integer."),
			v.minValue(0, "Attack must be 0 or greater."),
		),
	),
	defense: v.optional(
		v.pipe(
			v.number(),
			v.integer("Defense must be an integer."),
			v.minValue(0, "Defense must be 0 or greater."),
		),
	),
	moveSpeed: v.optional(nonNegativeNumberSchema),
	dropTableId: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, "Drop table id is required."),
	),
	enemySkillIds: v.pipe(
		v.array(
			v.pipe(v.string(), v.trim(), v.minLength(1, "Invalid enemy skill id.")),
		),
	),
	spawnRule: spawnRuleSchema,
});
