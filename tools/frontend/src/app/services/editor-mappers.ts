import type {
  EnemyDraft,
  EnemySkillDraft,
  GrimoireDraft,
  ItemDraft,
  SkillDraft,
  TreasureDraft
} from "../models/drafts";
import type {
  EnemyEntry,
  EnemySkillEntry,
  GrimoireEntry,
  ItemEntry,
  SkillEntry,
  TreasureEntry
} from "../types";

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

export function skillEntryToDraft(entry: SkillEntry, duplicate = false): SkillDraft {
  return {
    id: duplicate ? crypto.randomUUID() : entry.id,
    name: entry.name,
    script: entry.script,
    itemId: entry.itemId
  };
}

export function skillDraftToSaveInput(draft: SkillDraft): {
  id: string;
  name: string;
  script: string;
  itemId: string;
} {
  return {
    id: draft.id,
    name: draft.name,
    script: draft.script,
    itemId: draft.itemId
  };
}

export function enemySkillEntryToDraft(
  entry: EnemySkillEntry,
  duplicate = false
): EnemySkillDraft {
  return {
    id: duplicate ? crypto.randomUUID() : entry.id,
    name: entry.name,
    script: entry.script,
    cooldown: entry.cooldown == null ? "" : String(entry.cooldown),
    trigger: entry.trigger ?? ""
  };
}

export function enemySkillDraftToSaveInput(draft: EnemySkillDraft): {
  id: string;
  name: string;
  script: string;
  cooldown?: number;
  trigger?: "on_spawn" | "on_hit" | "on_low_hp" | "on_timer";
} {
  const trimmedCooldown = draft.cooldown.trim();
  return {
    id: draft.id,
    name: draft.name,
    script: draft.script,
    cooldown: trimmedCooldown ? Number.parseInt(trimmedCooldown, 10) : undefined,
    trigger: draft.trigger || undefined
  };
}

export function enemyEntryToDraft(entry: EnemyEntry, duplicate = false): EnemyDraft {
  const axis = entry.spawnRule.axisBounds;
  return {
    id: duplicate ? crypto.randomUUID() : entry.id,
    name: entry.name,
    hp: String(entry.hp),
    attack: entry.attack == null ? "" : String(entry.attack),
    defense: entry.defense == null ? "" : String(entry.defense),
    moveSpeed: entry.moveSpeed == null ? "" : String(entry.moveSpeed),
    dropTableId: entry.dropTableId,
    enemySkillIds: [...entry.enemySkillIds],
    originX: String(entry.spawnRule.origin.x),
    originY: String(entry.spawnRule.origin.y),
    originZ: String(entry.spawnRule.origin.z),
    distanceMin: String(entry.spawnRule.distance.min),
    distanceMax: String(entry.spawnRule.distance.max),
    xMin: axis?.xMin == null ? "" : String(axis.xMin),
    xMax: axis?.xMax == null ? "" : String(axis.xMax),
    yMin: axis?.yMin == null ? "" : String(axis.yMin),
    yMax: axis?.yMax == null ? "" : String(axis.yMax),
    zMin: axis?.zMin == null ? "" : String(axis.zMin),
    zMax: axis?.zMax == null ? "" : String(axis.zMax)
  };
}

export function enemyDraftToSaveInput(draft: EnemyDraft): {
  id: string;
  name: string;
  hp: number;
  attack?: number;
  defense?: number;
  moveSpeed?: number;
  dropTableId: string;
  enemySkillIds: string[];
  spawnRule: {
    origin: { x: number; y: number; z: number };
    distance: { min: number; max: number };
    axisBounds?: {
      xMin?: number;
      xMax?: number;
      yMin?: number;
      yMax?: number;
      zMin?: number;
      zMax?: number;
    };
  };
} {
  const axisBounds = {
    xMin: toOptionalNumber(draft.xMin),
    xMax: toOptionalNumber(draft.xMax),
    yMin: toOptionalNumber(draft.yMin),
    yMax: toOptionalNumber(draft.yMax),
    zMin: toOptionalNumber(draft.zMin),
    zMax: toOptionalNumber(draft.zMax)
  };

  return {
    id: draft.id,
    name: draft.name,
    hp: Number.parseFloat(draft.hp),
    attack: toOptionalNumber(draft.attack),
    defense: toOptionalNumber(draft.defense),
    moveSpeed: toOptionalNumber(draft.moveSpeed),
    dropTableId: draft.dropTableId,
    enemySkillIds: [...draft.enemySkillIds],
    spawnRule: {
      origin: {
        x: Number.parseFloat(draft.originX),
        y: Number.parseFloat(draft.originY),
        z: Number.parseFloat(draft.originZ)
      },
      distance: {
        min: Number.parseFloat(draft.distanceMin),
        max: Number.parseFloat(draft.distanceMax)
      },
      axisBounds: hasAnyAxisBounds(axisBounds) ? axisBounds : undefined
    }
  };
}

export function treasureEntryToDraft(entry: TreasureEntry, duplicate = false): TreasureDraft {
  return {
    id: duplicate ? crypto.randomUUID() : entry.id,
    name: entry.name,
    lootPools: entry.lootPools.map((pool) => ({
      kind: pool.kind,
      refId: pool.refId,
      weight: String(pool.weight),
      countMin: pool.countMin == null ? "" : String(pool.countMin),
      countMax: pool.countMax == null ? "" : String(pool.countMax)
    }))
  };
}

export function treasureDraftToSaveInput(draft: TreasureDraft): {
  id: string;
  name: string;
  lootPools: {
    kind: "item" | "grimoire";
    refId: string;
    weight: number;
    countMin?: number;
    countMax?: number;
  }[];
} {
  return {
    id: draft.id,
    name: draft.name,
    lootPools: draft.lootPools.map((pool) => ({
      kind: pool.kind,
      refId: pool.refId,
      weight: Number.parseInt(pool.weight, 10),
      countMin: toOptionalInteger(pool.countMin),
      countMax: toOptionalInteger(pool.countMax)
    }))
  };
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toOptionalInteger(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function hasAnyAxisBounds(axis: {
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  zMin?: number;
  zMax?: number;
}): boolean {
  return (
    axis.xMin != null ||
    axis.xMax != null ||
    axis.yMin != null ||
    axis.yMax != null ||
    axis.zMin != null ||
    axis.zMax != null
  );
}
