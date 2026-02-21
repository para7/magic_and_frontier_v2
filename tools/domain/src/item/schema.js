import * as v from "valibot";
export const saveItemSchema = v.object({
    id: v.pipe(v.string(), v.trim(), v.minLength(1, "Item id is required.")),
    itemId: v.pipe(v.string(), v.trim(), v.minLength(1, "Minecraft item id is required."), v.regex(/^(?:[a-z0-9_.-]+:)?[a-z0-9_./-]+$/, "Use a valid item id, e.g. minecraft:diamond_sword.")),
    count: v.pipe(v.number(), v.minValue(1, "Count must be at least 1."), v.maxValue(99, "Count must be 99 or fewer.")),
    customName: v.pipe(v.string(), v.maxLength(200, "Custom name must be 200 characters or fewer.")),
    lore: v.pipe(v.string(), v.maxLength(3000, "Lore must be 3000 characters or fewer.")),
    enchantments: v.pipe(v.string(), v.maxLength(3000, "Enchantments must be 3000 characters or fewer.")),
    unbreakable: v.boolean(),
    customModelData: v.pipe(v.string(), v.maxLength(20, "CustomModelData must be 20 digits or fewer."), v.regex(/^\d*$/, "CustomModelData must be a non-negative integer.")),
    customNbt: v.pipe(v.string(), v.maxLength(4000, "Custom NBT must be 4000 characters or fewer."))
});
//# sourceMappingURL=schema.js.map