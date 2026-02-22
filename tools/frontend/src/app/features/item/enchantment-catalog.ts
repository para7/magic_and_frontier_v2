export type EnchantmentCategoryId =
  | "weapon"
  | "armor"
  | "tool"
  | "bow"
  | "trident"
  | "crossbow"
  | "fishing"
  | "mace"
  | "general"
  | "curse";

export interface EnchantmentDefinition {
  id: string;
  label: string;
  maxLevel: number;
  category: EnchantmentCategoryId;
}

export const ENCHANTMENT_CATEGORY_LABELS: Record<EnchantmentCategoryId, string> = {
  weapon: "武器",
  armor: "防具",
  tool: "ツール",
  bow: "弓",
  trident: "トライデント",
  crossbow: "クロスボウ",
  fishing: "釣り",
  mace: "メイス",
  general: "汎用",
  curse: "呪い"
};

export const ENCHANTMENT_CATALOG: EnchantmentDefinition[] = [
  { id: "minecraft:sharpness", label: "Sharpness", maxLevel: 5, category: "weapon" },
  { id: "minecraft:smite", label: "Smite", maxLevel: 5, category: "weapon" },
  {
    id: "minecraft:bane_of_arthropods",
    label: "Bane of Arthropods",
    maxLevel: 5,
    category: "weapon"
  },
  { id: "minecraft:knockback", label: "Knockback", maxLevel: 2, category: "weapon" },
  { id: "minecraft:fire_aspect", label: "Fire Aspect", maxLevel: 2, category: "weapon" },
  { id: "minecraft:looting", label: "Looting", maxLevel: 3, category: "weapon" },
  { id: "minecraft:sweeping_edge", label: "Sweeping Edge", maxLevel: 3, category: "weapon" },

  { id: "minecraft:protection", label: "Protection", maxLevel: 4, category: "armor" },
  {
    id: "minecraft:fire_protection",
    label: "Fire Protection",
    maxLevel: 4,
    category: "armor"
  },
  {
    id: "minecraft:feather_falling",
    label: "Feather Falling",
    maxLevel: 4,
    category: "armor"
  },
  {
    id: "minecraft:blast_protection",
    label: "Blast Protection",
    maxLevel: 4,
    category: "armor"
  },
  {
    id: "minecraft:projectile_protection",
    label: "Projectile Protection",
    maxLevel: 4,
    category: "armor"
  },
  { id: "minecraft:respiration", label: "Respiration", maxLevel: 3, category: "armor" },
  { id: "minecraft:aqua_affinity", label: "Aqua Affinity", maxLevel: 1, category: "armor" },
  { id: "minecraft:thorns", label: "Thorns", maxLevel: 3, category: "armor" },
  { id: "minecraft:depth_strider", label: "Depth Strider", maxLevel: 3, category: "armor" },
  { id: "minecraft:frost_walker", label: "Frost Walker", maxLevel: 2, category: "armor" },
  { id: "minecraft:soul_speed", label: "Soul Speed", maxLevel: 3, category: "armor" },
  { id: "minecraft:swift_sneak", label: "Swift Sneak", maxLevel: 3, category: "armor" },

  { id: "minecraft:efficiency", label: "Efficiency", maxLevel: 5, category: "tool" },
  { id: "minecraft:silk_touch", label: "Silk Touch", maxLevel: 1, category: "tool" },
  { id: "minecraft:unbreaking", label: "Unbreaking", maxLevel: 3, category: "tool" },
  { id: "minecraft:fortune", label: "Fortune", maxLevel: 3, category: "tool" },

  { id: "minecraft:power", label: "Power", maxLevel: 5, category: "bow" },
  { id: "minecraft:punch", label: "Punch", maxLevel: 2, category: "bow" },
  { id: "minecraft:flame", label: "Flame", maxLevel: 1, category: "bow" },
  { id: "minecraft:infinity", label: "Infinity", maxLevel: 1, category: "bow" },

  { id: "minecraft:loyalty", label: "Loyalty", maxLevel: 3, category: "trident" },
  { id: "minecraft:impaling", label: "Impaling", maxLevel: 5, category: "trident" },
  { id: "minecraft:riptide", label: "Riptide", maxLevel: 3, category: "trident" },
  { id: "minecraft:channeling", label: "Channeling", maxLevel: 1, category: "trident" },

  { id: "minecraft:multishot", label: "Multishot", maxLevel: 1, category: "crossbow" },
  { id: "minecraft:quick_charge", label: "Quick Charge", maxLevel: 3, category: "crossbow" },
  { id: "minecraft:piercing", label: "Piercing", maxLevel: 4, category: "crossbow" },

  { id: "minecraft:luck_of_the_sea", label: "Luck of the Sea", maxLevel: 3, category: "fishing" },
  { id: "minecraft:lure", label: "Lure", maxLevel: 3, category: "fishing" },

  { id: "minecraft:density", label: "Density", maxLevel: 5, category: "mace" },
  { id: "minecraft:breach", label: "Breach", maxLevel: 4, category: "mace" },
  { id: "minecraft:wind_burst", label: "Wind Burst", maxLevel: 3, category: "mace" },

  { id: "minecraft:mending", label: "Mending", maxLevel: 1, category: "general" },

  { id: "minecraft:binding_curse", label: "Curse of Binding", maxLevel: 1, category: "curse" },
  { id: "minecraft:vanishing_curse", label: "Curse of Vanishing", maxLevel: 1, category: "curse" }
];
