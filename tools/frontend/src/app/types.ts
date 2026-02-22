export type AppScreen = "item" | "spellbook";

export type ItemEntry = {
  id: string;
  itemId: string;
  count: number;
  customName: string;
  lore: string;
  enchantments: string;
  unbreakable: boolean;
  customModelData: string;
  customNbt: string;
  nbt: string;
  updatedAt: string;
};

export type SpellbookEntry = {
  id: string;
  castid: number;
  effectid: number;
  cost: number;
  cast: number;
  title: string;
  description: string;
  updatedAt: string;
};

export type SaveErrorResult = {
  ok: false;
  fieldErrors?: Record<string, string>;
  formError?: string;
};
