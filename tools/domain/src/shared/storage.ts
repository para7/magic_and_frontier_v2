import type { ItemState } from "../item/types.js";
import type { GrimoireState } from "../grimoire/types.js";

export interface ItemStateRepository {
	loadItemState(): Promise<ItemState>;
	saveItemState(state: ItemState): Promise<void>;
}

export interface GrimoireStateRepository {
	loadGrimoireState(): Promise<GrimoireState>;
	saveGrimoireState(state: GrimoireState): Promise<void>;
}
