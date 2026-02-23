export type GrimoireRecord = {
	castid: number;
	effectid: number;
	cost: number;
	cast: number;
	title: string;
	description: string;
};

export type GrimoireEntry = GrimoireRecord & {
	id: string;
	updatedAt: string;
};

export type GrimoireState = {
	entries: GrimoireEntry[];
};

export const defaultGrimoireState: GrimoireState = {
	entries: [],
};

export type GrimoireFieldErrors = Partial<
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

export type SaveGrimoireEntryInput = {
	id: string;
	castid: number;
	effectid: number;
	cost: number;
	cast: number;
	title: string;
	description: string;
};

export type SaveGrimoireEntryResult =
	| {
			ok: true;
			entry: GrimoireEntry;
			mode: "created" | "updated";
			reassignments: CastIdReassignment[];
	  }
	| {
			ok: false;
			fieldErrors: GrimoireFieldErrors;
			formError?: string;
	  };

export type DeleteGrimoireEntryResult =
	| {
			ok: true;
			deletedId: string;
	  }
	| {
			ok: false;
			formError: string;
	  };
