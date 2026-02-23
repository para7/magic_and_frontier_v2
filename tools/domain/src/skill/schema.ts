import * as v from "valibot";

export const saveSkillSchema = v.object({
	id: v.pipe(v.string(), v.trim(), v.minLength(1, "Skill id is required.")),
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
	itemId: v.pipe(v.string(), v.trim(), v.minLength(1, "Item id is required.")),
});
