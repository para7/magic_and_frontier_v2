import { buildItemNbt } from "~/features/items/nbt";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import {
	defaultItemState,
	type ItemEntry,
	type ItemState,
} from "~/server/domain/item-types";

const DEFAULT_FORM_STATE_PATH = "/tmp/form-state.json";

export interface ItemStateRepository {
	loadItemState(): Promise<ItemState>;
	saveItemState(state: ItemState): Promise<void>;
}

function isErrnoCode(error: unknown, code: string): boolean {
	if (!error || typeof error !== "object") {
		return false;
	}
	return (error as { code?: unknown }).code === code;
}

function fallbackNbtFor(record: Record<string, unknown>): string {
	const built = buildItemNbt({
		itemId:
			typeof record.itemId === "string" ? record.itemId : "minecraft:stone",
		count:
			typeof record.count === "number" && Number.isFinite(record.count)
				? Math.max(1, Math.floor(record.count))
				: 1,
		customName: typeof record.customName === "string" ? record.customName : "",
		lore: typeof record.lore === "string" ? record.lore : "",
		enchantments:
			typeof record.enchantments === "string" ? record.enchantments : "",
		unbreakable:
			typeof record.unbreakable === "boolean" ? record.unbreakable : false,
		customModelData:
			typeof record.customModelData === "string" ? record.customModelData : "",
		customNbt: typeof record.customNbt === "string" ? record.customNbt : "",
	});
	if (!built.enchantmentError) {
		return built.nbt;
	}
	const safeItemId =
		typeof record.itemId === "string" && record.itemId.length > 0
			? record.itemId
			: "minecraft:stone";
	const safeCount =
		typeof record.count === "number" && Number.isFinite(record.count)
			? Math.max(1, Math.floor(record.count))
			: 1;
	return `{id:"${safeItemId}",Count:${safeCount}b}`;
}

function normalizeItemEntry(value: unknown): ItemEntry | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const fallbackNbt = fallbackNbtFor(record);

	return {
		id:
			typeof record.id === "string" && record.id.length > 0
				? record.id
				: crypto.randomUUID(),
		itemId:
			typeof record.itemId === "string" && record.itemId.length > 0
				? record.itemId
				: "minecraft:stone",
		count:
			typeof record.count === "number" && Number.isFinite(record.count)
				? Math.max(1, Math.floor(record.count))
				: 1,
		customName: typeof record.customName === "string" ? record.customName : "",
		lore: typeof record.lore === "string" ? record.lore : "",
		enchantments:
			typeof record.enchantments === "string" ? record.enchantments : "",
		unbreakable:
			typeof record.unbreakable === "boolean" ? record.unbreakable : false,
		customModelData:
			typeof record.customModelData === "string" ? record.customModelData : "",
		customNbt: typeof record.customNbt === "string" ? record.customNbt : "",
		nbt:
			typeof record.nbt === "string" && record.nbt.length > 0
				? record.nbt
				: fallbackNbt,
		updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
	};
}

function normalizeItemState(value: unknown): ItemState {
	if (!value || typeof value !== "object") {
		return defaultItemState;
	}

	const record = value as Record<string, unknown>;
	if (!Array.isArray(record.items)) {
		return defaultItemState;
	}

	const items = record.items
		.map(normalizeItemEntry)
		.filter((item): item is ItemEntry => item !== null);
	return { items };
}

export function createItemStateRepository(
	formStatePath = DEFAULT_FORM_STATE_PATH,
): ItemStateRepository {
	return {
		async loadItemState(): Promise<ItemState> {
			try {
				const raw = await Bun.file(formStatePath).text();
				return normalizeItemState(JSON.parse(raw));
			} catch (error) {
				if (isErrnoCode(error, "ENOENT")) {
					return defaultItemState;
				}
				if (error instanceof Error) {
					console.warn(
						`Failed to load item state from ${formStatePath}: ${error.message}`,
					);
				}
				return defaultItemState;
			}
		},
		async saveItemState(state: ItemState): Promise<void> {
			try {
				await mkdir(dirname(formStatePath), { recursive: true });
				await Bun.write(formStatePath, JSON.stringify(state, null, 2));
			} catch (error) {
				if (error instanceof Error) {
					console.warn(
						`Failed to save item state to ${formStatePath}: ${error.message}`,
					);
				}
				throw error;
			}
		},
	};
}
