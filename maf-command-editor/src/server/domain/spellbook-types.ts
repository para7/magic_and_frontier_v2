export type SpellbookRecord = {
	castid: number;
	effectid: number;
	cost: number;
	cast: number;
	title: string;
	description: string;
};

export type SpellbookEntry = SpellbookRecord & {
	id: string;
	updatedAt: string;
};

export type SpellbookState = {
	entries: SpellbookEntry[];
};

export const defaultSpellbookState: SpellbookState = {
	entries: [],
};
