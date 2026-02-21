import type { SaveItemInput } from "./types.js";
export type BuildItemNbtInput = SaveItemInput;
export type NbtBuildResult = {
    nbt: string;
    enchantmentError?: string;
};
export declare function buildItemNbt(input: BuildItemNbtInput): NbtBuildResult;
//# sourceMappingURL=nbt.d.ts.map