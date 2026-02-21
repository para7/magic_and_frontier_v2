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

export type ItemState = {
	items: ItemEntry[];
};

export const defaultItemState: ItemState = {
	items: [],
};
