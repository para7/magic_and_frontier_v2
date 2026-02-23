export type GrimoireRecord = {
	castid: number;
	script: string;
	title: string;
	description: string;
	variants: GrimoireVariant[];
};

export type GrimoireVariant = {
	cast: number;
	cost: number;
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
		| "castid"
		| "script"
		| "variants"
		| `variants.${number}.cast`
		| `variants.${number}.cost`
		| "title"
		| "description",
		string
	>
>;

export type SaveGrimoireEntryInput = {
	id: string;
	castid: number;
	script: string;
	title: string;
	description: string;
	variants: GrimoireVariant[];
};

export type SaveGrimoireEntryResult =
	| {
			ok: true;
			entry: GrimoireEntry;
			mode: "created" | "updated";
			warnings?: {
				castidChanged?: {
					from: number;
					to: number;
				};
			};
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
