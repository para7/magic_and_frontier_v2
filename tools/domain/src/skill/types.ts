export type SkillEntry = {
	id: string;
	name: string;
	script: string;
	itemId: string;
	updatedAt: string;
};

export type SkillState = {
	entries: SkillEntry[];
};

export const defaultSkillState: SkillState = {
	entries: [],
};

export type SkillFieldErrors = Partial<
	Record<"name" | "script" | "itemId", string>
>;

export type SaveSkillInput = {
	id: string;
	name: string;
	script: string;
	itemId: string;
};

export type SaveSkillResult =
	| {
			ok: true;
			skill: SkillEntry;
			mode: "created" | "updated";
	  }
	| {
			ok: false;
			fieldErrors: SkillFieldErrors;
			formError?: string;
	  };

export type DeleteSkillResult =
	| {
			ok: true;
			deletedId: string;
	  }
	| {
			ok: false;
			formError: string;
	  };
