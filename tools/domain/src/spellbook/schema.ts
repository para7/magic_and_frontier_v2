import * as v from "valibot";

export const saveSpellbookEntrySchema = v.object({
  id: v.pipe(v.string(), v.trim(), v.minLength(1, "Entry id is required.")),
  castid: v.pipe(v.number(), v.integer("castid must be an integer."), v.minValue(0, "castid must be 0 or greater.")),
  effectid: v.pipe(v.number(), v.integer("effectid must be an integer."), v.minValue(0, "effectid must be 0 or greater.")),
  cost: v.pipe(v.number(), v.integer("cost must be an integer."), v.minValue(0, "cost must be 0 or greater.")),
  cast: v.pipe(v.number(), v.integer("cast must be an integer."), v.minValue(0, "cast must be 0 or greater.")),
  title: v.pipe(v.string(), v.maxLength(200, "title must be 200 characters or fewer.")),
  description: v.pipe(v.string(), v.maxLength(2000, "description must be 2000 characters or fewer."))
});
