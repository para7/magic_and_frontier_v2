import * as v from "valibot";
import { buildItemNbt } from "~/features/items/nbt";
import type { ItemEntry, ItemState } from "~/server/domain/item-types";
import type { ItemStateRepository } from "~/server/repositories/item-state-repository";

export type FieldErrors = Partial<
	Record<
		| "itemId"
		| "count"
		| "customName"
		| "lore"
		| "enchantments"
		| "customModelData"
		| "customNbt",
		string
	>
>;

export type SaveItemInput = {
	id: string;
	itemId: string;
	count: number;
	customName: string;
	lore: string;
	enchantments: string;
	unbreakable: boolean;
	customModelData: string;
	customNbt: string;
};

export type SaveItemResult =
	| {
			ok: true;
			item: ItemEntry;
			mode: "created" | "updated";
	  }
	| {
			ok: false;
			fieldErrors: FieldErrors;
			formError?: string;
	  };

export type DeleteItemInput = {
	id: string;
};

export type DeleteItemResult =
	| {
			ok: true;
			deletedId: string;
	  }
	| {
			ok: false;
			formError: string;
	  };

export interface ItemUsecase {
	loadItems(): Promise<ItemState>;
	saveItem(input: SaveItemInput): Promise<SaveItemResult>;
	deleteItem(input: DeleteItemInput): Promise<DeleteItemResult>;
}

const saveItemSchema = v.object({
	id: v.pipe(v.string(), v.trim(), v.minLength(1, "Item id is required.")),
	itemId: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, "Minecraft item id is required."),
		v.regex(
			/^(?:[a-z0-9_.-]+:)?[a-z0-9_./-]+$/,
			"Use a valid item id, e.g. minecraft:diamond_sword.",
		),
	),
	count: v.pipe(
		v.number(),
		v.minValue(1, "Count must be at least 1."),
		v.maxValue(99, "Count must be 99 or fewer."),
	),
	customName: v.pipe(
		v.string(),
		v.maxLength(200, "Custom name must be 200 characters or fewer."),
	),
	lore: v.pipe(
		v.string(),
		v.maxLength(3000, "Lore must be 3000 characters or fewer."),
	),
	enchantments: v.pipe(
		v.string(),
		v.maxLength(3000, "Enchantments must be 3000 characters or fewer."),
	),
	unbreakable: v.boolean(),
	customModelData: v.pipe(
		v.string(),
		v.maxLength(20, "CustomModelData must be 20 digits or fewer."),
		v.regex(/^\d*$/, "CustomModelData must be a non-negative integer."),
	),
	customNbt: v.pipe(
		v.string(),
		v.maxLength(4000, "Custom NBT must be 4000 characters or fewer."),
	),
});

function toFieldErrors(
	nested: v.FlatErrors<typeof saveItemSchema>["nested"],
): FieldErrors {
	const fieldErrors: FieldErrors = {};
	if (!nested) {
		return fieldErrors;
	}

	if (nested.itemId?.[0]) {
		fieldErrors.itemId = nested.itemId[0];
	}
	if (nested.count?.[0]) {
		fieldErrors.count = nested.count[0];
	}
	if (nested.customName?.[0]) {
		fieldErrors.customName = nested.customName[0];
	}
	if (nested.lore?.[0]) {
		fieldErrors.lore = nested.lore[0];
	}
	if (nested.enchantments?.[0]) {
		fieldErrors.enchantments = nested.enchantments[0];
	}
	if (nested.customModelData?.[0]) {
		fieldErrors.customModelData = nested.customModelData[0];
	}
	if (nested.customNbt?.[0]) {
		fieldErrors.customNbt = nested.customNbt[0];
	}
	return fieldErrors;
}

export function createItemUsecase(deps: {
	itemRepository: ItemStateRepository;
	now?: () => Date;
}): ItemUsecase {
	return {
		loadItems() {
			return deps.itemRepository.loadItemState();
		},
		async saveItem(input: SaveItemInput): Promise<SaveItemResult> {
			const parsed = v.safeParse(saveItemSchema, input);
			if (!parsed.success) {
				const flat = v.flatten(parsed.issues);
				return {
					ok: false,
					fieldErrors: toFieldErrors(flat.nested),
					formError: "Validation failed. Fix the highlighted fields.",
				};
			}

			const built = buildItemNbt(parsed.output);
			if (built.enchantmentError) {
				return {
					ok: false,
					fieldErrors: {
						enchantments: built.enchantmentError,
					},
					formError: "Validation failed. Fix the highlighted fields.",
				};
			}

			const currentState = await deps.itemRepository.loadItemState();
			const now = (deps.now ?? (() => new Date()))().toISOString();
			const nextItem: ItemEntry = {
				...parsed.output,
				nbt: built.nbt,
				updatedAt: now,
			};

			const itemIndex = currentState.items.findIndex(
				(item) => item.id === parsed.output.id,
			);
			const mode: "created" | "updated" =
				itemIndex >= 0 ? "updated" : "created";
			const nextItems = [...currentState.items];
			if (itemIndex >= 0) {
				nextItems[itemIndex] = nextItem;
			} else {
				nextItems.push(nextItem);
			}

			await deps.itemRepository.saveItemState({ items: nextItems });
			return { ok: true, item: nextItem, mode };
		},
		async deleteItem(input: DeleteItemInput): Promise<DeleteItemResult> {
			const id = input.id.trim();
			if (id.length === 0) {
				return { ok: false, formError: "Missing item id." };
			}

			const currentState = await deps.itemRepository.loadItemState();
			const nextItems = currentState.items.filter((item) => item.id !== id);
			if (nextItems.length === currentState.items.length) {
				return { ok: false, formError: "Item not found." };
			}

			await deps.itemRepository.saveItemState({ items: nextItems });
			return { ok: true, deletedId: id };
		},
	};
}
