import type { ItemDraft, GrimoireDraft } from "../models/drafts";
import type { ItemEntry, GrimoireEntry } from "../types";

export function itemEntryToDraft(entry: ItemEntry): ItemDraft {
  return {
    id: entry.id,
    itemId: entry.itemId,
    count: String(entry.count),
    customName: entry.customName,
    lore: entry.lore,
    enchantments: entry.enchantments,
    unbreakable: entry.unbreakable,
    customModelData: entry.customModelData,
    customNbt: entry.customNbt
  };
}

export function grimoireEntryToDraft(entry: GrimoireEntry, duplicate = false): GrimoireDraft {
  return {
    id: duplicate ? crypto.randomUUID() : entry.id,
    castid: String(entry.castid),
    effectid: String(entry.effectid),
    cost: String(entry.cost),
    cast: String(entry.cast),
    title: entry.title,
    description: entry.description
  };
}

export function itemDraftToSaveInput(draft: ItemDraft): {
  id: string;
  itemId: string;
  count: number;
  customName: string;
  lore: string;
  enchantments: string;
  unbreakable: boolean;
  customModelData: string;
  customNbt: string;
} {
  return {
    id: draft.id,
    itemId: draft.itemId,
    count: Number.parseInt(draft.count, 10),
    customName: draft.customName,
    lore: draft.lore,
    enchantments: draft.enchantments,
    unbreakable: draft.unbreakable,
    customModelData: draft.customModelData,
    customNbt: draft.customNbt
  };
}

export function grimoireDraftToSaveInput(draft: GrimoireDraft): {
  id: string;
  castid: number;
  effectid: number;
  cost: number;
  cast: number;
  title: string;
  description: string;
} {
  return {
    id: draft.id,
    castid: Number.parseInt(draft.castid, 10),
    effectid: Number.parseInt(draft.effectid, 10),
    cost: Number.parseInt(draft.cost, 10),
    cast: Number.parseInt(draft.cast, 10),
    title: draft.title,
    description: draft.description
  };
}
