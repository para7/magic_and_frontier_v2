import * as v from "valibot";

export const enemySkillTriggerSchema = v.picklist([
	"on_spawn",
	"on_hit",
	"on_low_hp",
	"on_timer",
] as const);

export const saveEnemySkillSchema = v.object({
	id: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, "Enemy skill id is required."),
	),
	name: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, "Name is required."),
		v.maxLength(80, "Name must be 80 characters or fewer."),
	),
	script: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, "Script is required."),
		v.maxLength(20000, "Script must be 20000 characters or fewer."),
	),
	cooldown: v.optional(
		v.pipe(
			v.number(),
			v.integer("Cooldown must be an integer."),
			v.minValue(0, "Cooldown must be 0 or greater."),
			v.maxValue(12000, "Cooldown must be 12000 or fewer."),
		),
	),
	trigger: v.optional(enemySkillTriggerSchema),
});
