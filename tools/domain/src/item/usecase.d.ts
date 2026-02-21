import type { ItemStateRepository } from "../shared/storage.js";
import type { DeleteItemInput, DeleteItemResult, ItemState, SaveItemInput, SaveItemResult } from "./types.js";
export interface ItemUsecase {
    loadItems(): Promise<ItemState>;
    saveItem(input: SaveItemInput): Promise<SaveItemResult>;
    deleteItem(input: DeleteItemInput): Promise<DeleteItemResult>;
}
export declare function createItemUsecase(deps: {
    itemRepository: ItemStateRepository;
    now?: () => Date;
}): ItemUsecase;
//# sourceMappingURL=usecase.d.ts.map