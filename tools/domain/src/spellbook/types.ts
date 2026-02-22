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

export type SpellbookFieldErrors = Partial<
	Record<
		"castid" | "effectid" | "cost" | "cast" | "title" | "description",
		string
	>
>;

export type CastIdReassignment = {
	id: string;
	title: string;
	from: number;
	to: number;
};

export type SaveSpellbookEntryInput = {
	id: string;
	castid: number;
	effectid: number;
	cost: number;
	cast: number;
	title: string;
	description: string;
};

export type SaveSpellbookEntryResult =
	| {
			ok: true;
			entry: SpellbookEntry;
			mode: "created" | "updated";
			reassignments: CastIdReassignment[];
	  }
	| {
			ok: false;
			fieldErrors: SpellbookFieldErrors;
			formError?: string;
	  };

export type DeleteSpellbookEntryResult =
	| {
			ok: true;
			deletedId: string;
	  }
	| {
			ok: false;
			formError: string;
	  };
