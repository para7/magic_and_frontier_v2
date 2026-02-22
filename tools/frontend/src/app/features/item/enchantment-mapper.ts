import type { EnchantmentDefinition } from "./enchantment-catalog";

export type EnchantmentSelection = Record<
  string,
  {
    enabled: boolean;
    level: string;
  }
>;

export interface ParseEnchantmentsResult {
  selection: EnchantmentSelection;
  warnings: string[];
}

export interface SerializeEnchantmentsResult {
  text: string;
}

function clampLevel(level: number, maxLevel: number): number {
  if (level < 1) return 1;
  if (level > maxLevel) return maxLevel;
  return level;
}

export function parseEnchantmentsText(
  text: string,
  catalog: EnchantmentDefinition[]
): ParseEnchantmentsResult {
  const selection: EnchantmentSelection = {};
  const warnings: string[] = [];
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const [rawId, rawLevel, extra] = line.split(/\s+/);
    if (!rawId || !rawLevel || extra) {
      warnings.push(`不正な形式を除外しました: ${line}`);
      continue;
    }

    const found = byId.get(rawId);
    if (!found) {
      warnings.push(`未対応エンチャントを除外しました: ${rawId}`);
      continue;
    }

    const level = Number.parseInt(rawLevel, 10);
    if (!Number.isInteger(level) || level < 1 || level > found.maxLevel) {
      warnings.push(`レベル範囲外のため除外しました: ${rawId} ${rawLevel}`);
      continue;
    }

    selection[rawId] = {
      enabled: true,
      level: String(level)
    };
  }

  return { selection, warnings };
}

export function serializeEnchantmentsSelection(
  selection: EnchantmentSelection,
  catalog: EnchantmentDefinition[]
): SerializeEnchantmentsResult {
  const lines: string[] = [];

  for (const enchantment of catalog) {
    const state = selection[enchantment.id];
    if (!state?.enabled) {
      continue;
    }

    const parsedLevel = Number.parseInt(state.level, 10);
    const safeLevel = Number.isInteger(parsedLevel)
      ? clampLevel(parsedLevel, enchantment.maxLevel)
      : 1;

    lines.push(`${enchantment.id} ${safeLevel}`);
  }

  return { text: lines.join("\n") };
}
