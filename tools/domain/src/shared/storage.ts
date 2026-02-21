import type { ItemState } from "../item/types.js";
import type { SpellbookState } from "../spellbook/types.js";

export interface ItemStateRepository {
  loadItemState(): Promise<ItemState>;
  saveItemState(state: ItemState): Promise<void>;
}

export interface SpellbookStateRepository {
  loadSpellbookState(): Promise<SpellbookState>;
  saveSpellbookState(state: SpellbookState): Promise<void>;
}
