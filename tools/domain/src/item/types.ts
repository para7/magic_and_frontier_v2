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

export type ItemFieldErrors = Partial<
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
			fieldErrors: ItemFieldErrors;
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
