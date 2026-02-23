export interface ItemDraft {
  id: string;
  itemId: string;
  count: string;
  customName: string;
  lore: string;
  enchantments: string;
  unbreakable: boolean;
  customModelData: string;
  customNbt: string;
}

export interface GrimoireDraft {
  id: string;
  castid: string;
  effectid: string;
  cost: string;
  cast: string;
  title: string;
  description: string;
}

export interface SkillDraft {
  id: string;
  name: string;
  script: string;
  itemId: string;
}

export interface EnemySkillDraft {
  id: string;
  name: string;
  script: string;
  cooldown: string;
  trigger: "" | "on_spawn" | "on_hit" | "on_low_hp" | "on_timer";
}

export interface EnemyDraft {
  id: string;
  name: string;
  hp: string;
  attack: string;
  defense: string;
  moveSpeed: string;
  dropTableId: string;
  enemySkillIds: string[];
  originX: string;
  originY: string;
  originZ: string;
  distanceMin: string;
  distanceMax: string;
  xMin: string;
  xMax: string;
  yMin: string;
  yMax: string;
  zMin: string;
  zMax: string;
}

export interface TreasureDropRefDraft {
  kind: "item" | "grimoire";
  refId: string;
  weight: string;
  countMin: string;
  countMax: string;
}

export interface TreasureDraft {
  id: string;
  name: string;
  lootPools: TreasureDropRefDraft[];
}

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

export function createGrimoireDraft(): GrimoireDraft {
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

export function createSkillDraft(): SkillDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    script: "",
    itemId: ""
  };
}

export function createEnemySkillDraft(): EnemySkillDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    script: "",
    cooldown: "",
    trigger: ""
  };
}

export function createEnemyDraft(): EnemyDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    hp: "20",
    attack: "",
    defense: "",
    moveSpeed: "",
    dropTableId: "",
    enemySkillIds: [],
    originX: "0",
    originY: "0",
    originZ: "0",
    distanceMin: "0",
    distanceMax: "16",
    xMin: "",
    xMax: "",
    yMin: "",
    yMax: "",
    zMin: "",
    zMax: ""
  };
}

export function createTreasureDropRefDraft(): TreasureDropRefDraft {
  return {
    kind: "item",
    refId: "",
    weight: "1",
    countMin: "1",
    countMax: "1"
  };
}

export function createTreasureDraft(): TreasureDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    lootPools: [createTreasureDropRefDraft()]
  };
}
