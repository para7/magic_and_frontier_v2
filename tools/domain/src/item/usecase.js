import * as v from "valibot";
import { buildItemNbt } from "./nbt.js";
import { saveItemSchema } from "./schema.js";
function toFieldErrors(nested) {
    const fieldErrors = {};
    if (!nested) {
        return fieldErrors;
    }
    if (nested.itemId?.[0])
        fieldErrors.itemId = nested.itemId[0];
    if (nested.count?.[0])
        fieldErrors.count = nested.count[0];
    if (nested.customName?.[0])
        fieldErrors.customName = nested.customName[0];
    if (nested.lore?.[0])
        fieldErrors.lore = nested.lore[0];
    if (nested.enchantments?.[0])
        fieldErrors.enchantments = nested.enchantments[0];
    if (nested.customModelData?.[0])
        fieldErrors.customModelData = nested.customModelData[0];
    if (nested.customNbt?.[0])
        fieldErrors.customNbt = nested.customNbt[0];
    return fieldErrors;
}
export function createItemUsecase(deps) {
    return {
        loadItems() {
            return deps.itemRepository.loadItemState();
        },
        async saveItem(input) {
            const parsed = v.safeParse(saveItemSchema, input);
            if (!parsed.success) {
                const flat = v.flatten(parsed.issues);
                return {
                    ok: false,
                    fieldErrors: toFieldErrors(flat.nested),
                    formError: "Validation failed. Fix the highlighted fields."
                };
            }
            const built = buildItemNbt(parsed.output);
            if (built.enchantmentError) {
                return {
                    ok: false,
                    fieldErrors: { enchantments: built.enchantmentError },
                    formError: "Validation failed. Fix the highlighted fields."
                };
            }
            const currentState = await deps.itemRepository.loadItemState();
            const now = (deps.now ?? (() => new Date()))().toISOString();
            const nextItem = {
                ...parsed.output,
                nbt: built.nbt,
                updatedAt: now
            };
            const itemIndex = currentState.items.findIndex((item) => item.id === parsed.output.id);
            const mode = itemIndex >= 0 ? "updated" : "created";
            const nextItems = [...currentState.items];
            if (itemIndex >= 0) {
                nextItems[itemIndex] = nextItem;
            }
            else {
                nextItems.push(nextItem);
            }
            await deps.itemRepository.saveItemState({ items: nextItems });
            return { ok: true, item: nextItem, mode };
        },
        async deleteItem(input) {
            const id = input.id.trim();
            if (id.length === 0) {
                return { ok: false, formError: "Missing item id." };
            }
            const currentState = await deps.itemRepository.loadItemState();
            const nextItems = currentState.items.filter((item) => item.id !== id);
            if (nextItems.length === currentState.items.length) {
                return { ok: false, formError: "Item not found." };
            }
            await deps.itemRepository.saveItemState({ items: nextItems });
            return { ok: true, deletedId: id };
        }
    };
}
//# sourceMappingURL=usecase.js.map