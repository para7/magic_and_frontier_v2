export type ItemDraft = {
  id: string;
  itemId: string;
  count: string;
  customName: string;
  lore: string;
  enchantments: string;
  unbreakable: boolean;
  customModelData: string;
  customNbt: string;
};

export type SpellbookDraft = {
  id: string;
  castid: string;
  effectid: string;
  cost: string;
  cast: string;
  title: string;
  description: string;
};

export function createItemDraft(): ItemDraft {
  return {
    id: crypto.randomUUID(),
    itemId: "minecraft:stone",
    count: "1",
    customName: "",
    lore: "",
    enchantments: "",
    unbreakable: false,
    customModelData: "",
    customNbt: ""
  };
}

export function createSpellbookDraft(): SpellbookDraft {
  return {
    id: crypto.randomUUID(),
    castid: "0",
    effectid: "0",
    cost: "0",
    cast: "0",
    title: "",
    description: ""
  };
}
