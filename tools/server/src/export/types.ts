export type ExportSettings = {
	outputRoot: string;
	namespace: string;
	templatePackPath: string;
	paths: {
		itemFunctionDir: string;
		itemLootDir: string;
		spellFunctionDir: string;
		spellLootDir: string;
		skillFunctionDir: string;
		enemySkillFunctionDir: string;
		enemyFunctionDir: string;
		enemyLootDir: string;
		treasureLootDir: string;
		debugFunctionDir: string;
		minecraftTagDir: string;
	};
};

export type ExportStats = {
	itemFunctions: number;
	itemLootTables: number;
	spellFunctions: number;
	spellLootTables: number;
	skillFunctions: number;
	enemySkillFunctions: number;
	enemyFunctions: number;
	enemyLootTables: number;
	treasureLootTables: number;
	totalFiles: number;
};

export type SaveDataResponse =
	| {
			ok: true;
			message: string;
			outputRoot: string;
			generated: ExportStats;
	  }
	| {
			ok: false;
			message: string;
			code:
				| "MISSING_ITEM_STATE"
				| "MISSING_GRIMOIRE_STATE"
				| "INVALID_CONFIG"
				| "EXPORT_FAILED"
				| "VALIDATION_ERROR"
				| "REFERENCE_ERROR";
			details?: string;
	  };
