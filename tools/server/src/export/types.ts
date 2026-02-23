export type ExportSettings = {
	outputRoot: string;
	namespace: string;
	templatePackPath: string;
	paths: {
		itemFunctionDir: string;
		itemLootDir: string;
		spellFunctionDir: string;
		spellLootDir: string;
		minecraftTagDir: string;
	};
};

export type ExportStats = {
	itemFunctions: number;
	itemLootTables: number;
	spellFunctions: number;
	spellLootTables: number;
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
				| "MISSING_SPELLBOOK_STATE"
				| "INVALID_CONFIG"
				| "EXPORT_FAILED";
			details?: string;
	  };
