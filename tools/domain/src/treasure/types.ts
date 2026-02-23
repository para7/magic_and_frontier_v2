import type { DropRef } from "../enemy/types.js";

export type TreasureEntry = {
	id: string;
	name: string;
	lootPools: DropRef[];
	updatedAt: string;
};

export type TreasureState = {
	entries: TreasureEntry[];
};

export const defaultTreasureState: TreasureState = {
	entries: [],
};

export type TreasureFieldErrors = Partial<Record<"name" | "lootPools", string>>;

export type SaveTreasureInput = {
	id: string;
	name: string;
	lootPools: DropRef[];
};

export type SaveTreasureResult =
	| {
			ok: true;
			treasure: TreasureEntry;
			mode: "created" | "updated";
	  }
	| {
			ok: false;
			fieldErrors: TreasureFieldErrors;
			formError?: string;
	  };

export type DeleteTreasureResult =
	| {
			ok: true;
			deletedId: string;
	  }
	| {
			ok: false;
			formError: string;
	  };
