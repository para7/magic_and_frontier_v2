export type DropRef = {
	kind: "item" | "grimoire";
	refId: string;
	weight: number;
	countMin?: number;
	countMax?: number;
};

export type SpawnRule = {
	origin: {
		x: number;
		y: number;
		z: number;
	};
	distance: {
		min: number;
		max: number;
	};
	axisBounds?: {
		xMin?: number;
		xMax?: number;
		yMin?: number;
		yMax?: number;
		zMin?: number;
		zMax?: number;
	};
};

export type EnemyEntry = {
	id: string;
	name: string;
	hp: number;
	attack?: number;
	defense?: number;
	moveSpeed?: number;
	dropTableId: string;
	enemySkillIds: string[];
	spawnRule: SpawnRule;
	updatedAt: string;
};

export type EnemyState = {
	entries: EnemyEntry[];
};

export const defaultEnemyState: EnemyState = {
	entries: [],
};

export type EnemyFieldErrors = Partial<
	Record<
		| "name"
		| "hp"
		| "attack"
		| "defense"
		| "moveSpeed"
		| "dropTableId"
		| "enemySkillIds"
		| "spawnRule",
		string
	>
>;

export type SaveEnemyInput = {
	id: string;
	name: string;
	hp: number;
	attack?: number;
	defense?: number;
	moveSpeed?: number;
	dropTableId: string;
	enemySkillIds: string[];
	spawnRule: SpawnRule;
};

export type SaveEnemyResult =
	| {
			ok: true;
			enemy: EnemyEntry;
			mode: "created" | "updated";
	  }
	| {
			ok: false;
			fieldErrors: EnemyFieldErrors;
			formError?: string;
	  };

export type DeleteEnemyResult =
	| {
			ok: true;
			deletedId: string;
	  }
	| {
			ok: false;
			formError: string;
	  };
