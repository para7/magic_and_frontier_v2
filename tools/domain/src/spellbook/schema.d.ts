import * as v from "valibot";
export declare const saveSpellbookEntrySchema: v.ObjectSchema<{
    readonly id: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.MinLengthAction<string, 1, "Entry id is required.">]>;
    readonly castid: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, "castid must be an integer.">, v.MinValueAction<number, 0, "castid must be 0 or greater.">]>;
    readonly effectid: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, "effectid must be an integer.">, v.MinValueAction<number, 0, "effectid must be 0 or greater.">]>;
    readonly cost: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, "cost must be an integer.">, v.MinValueAction<number, 0, "cost must be 0 or greater.">]>;
    readonly cast: v.SchemaWithPipe<readonly [v.NumberSchema<undefined>, v.IntegerAction<number, "cast must be an integer.">, v.MinValueAction<number, 0, "cast must be 0 or greater.">]>;
    readonly title: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 200, "title must be 200 characters or fewer.">]>;
    readonly description: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MaxLengthAction<string, 2000, "description must be 2000 characters or fewer.">]>;
}, undefined>;
//# sourceMappingURL=schema.d.ts.map