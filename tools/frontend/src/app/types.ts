export type AppScreen = "item" | "grimoire" | "skill" | "enemySkill" | "enemy" | "treasure";

export interface ItemEntry {
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
}

export interface GrimoireEntry {
  id: string;
  castid: number;
  effectid: number;
  cost: number;
  cast: number;
  title: string;
  description: string;
  updatedAt: string;
}

export interface SaveErrorResult {
  ok: false;
  fieldErrors?: Record<string, string>;
  formError?: string;
}

export interface SkillEntry {
  id: string;
  name: string;
  script: string;
  itemId: string;
  updatedAt: string;
}

export interface EnemySkillEntry {
  id: string;
  name: string;
  script: string;
  cooldown?: number;
  trigger?: "on_spawn" | "on_hit" | "on_low_hp" | "on_timer";
  updatedAt: string;
}

export interface DropRefEntry {
  kind: "item" | "grimoire";
  refId: string;
  weight: number;
  countMin?: number;
  countMax?: number;
}

export interface SpawnRuleEntry {
  origin: {
    x: number;
    y: number;
    z: number;
  };
  distance: {
    min: number;
    max: number;
  };
  axisBounds?: {
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
    zMin?: number;
    zMax?: number;
  };
}

export interface EnemyEntry {
  id: string;
  name: string;
  hp: number;
  attack?: number;
  defense?: number;
  moveSpeed?: number;
  dropTableId: string;
  enemySkillIds: string[];
  spawnRule: SpawnRuleEntry;
  updatedAt: string;
}

export interface TreasureEntry {
  id: string;
  name: string;
  lootPools: DropRefEntry[];
  updatedAt: string;
}

export interface ReferenceOption {
  id: string;
  label: string;
}
