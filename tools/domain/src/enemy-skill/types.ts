export type EnemySkillTrigger =
	| "on_spawn"
	| "on_hit"
	| "on_low_hp"
	| "on_timer";

export type EnemySkillEntry = {
	id: string;
	name: string;
	script: string;
	cooldown?: number;
	trigger?: EnemySkillTrigger;
	updatedAt: string;
};

export type EnemySkillState = {
	entries: EnemySkillEntry[];
};

export const defaultEnemySkillState: EnemySkillState = {
	entries: [],
};

export type EnemySkillFieldErrors = Partial<
	Record<"name" | "script" | "cooldown" | "trigger", string>
>;

export type SaveEnemySkillInput = {
	id: string;
	name: string;
	script: string;
	cooldown?: number;
	trigger?: EnemySkillTrigger;
};

export type SaveEnemySkillResult =
	| {
			ok: true;
			enemySkill: EnemySkillEntry;
			mode: "created" | "updated";
	  }
	| {
			ok: false;
			fieldErrors: EnemySkillFieldErrors;
			formError?: string;
	  };

export type DeleteEnemySkillResult =
	| {
			ok: true;
			deletedId: string;
	  }
	| {
			ok: false;
			formError: string;
	  };
