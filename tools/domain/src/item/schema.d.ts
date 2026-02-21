import * as v from "valibot";
export declare const saveItemSchema: v.ObjectSchema<{
    readonly id: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.MinLengthAction<string, 1, "Item id is required.">]>;
    readonly itemId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.MinLengthAction<string, 1, "Minecraft item id is required.">, v.RegexAction<string, "Use a valid item id, e.g. minecraft:diamond_sword.">]>;
    readonly count: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.MinValueAction<number, 1, "Count must be at least 1.">, v.MaxValueAction<number, 99, "Count must be 99 or fewer.">]>;
    readonly customName: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 200, "Custom name must be 200 characters or fewer.">]>;
    readonly lore: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 3000, "Lore must be 3000 characters or fewer.">]>;
    readonly enchantments: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 3000, "Enchantments must be 3000 characters or fewer.">]>;
    readonly unbreakable: v.BooleanSchema<undefined>;
    readonly customModelData: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 20, "CustomModelData must be 20 digits or fewer.">, v.RegexAction<string, "CustomModelData must be a non-negative integer.">]>;
    readonly customNbt: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 4000, "Custom NBT must be 4000 characters or fewer.">]>;
}, undefined>;
//# sourceMappingURL=schema.d.ts.map