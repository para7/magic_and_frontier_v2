import { access } from "node:fs/promises";
import type { ItemUsecase, SpellbookUsecase } from "@maf/domain";
import { writeDatapackScaffold } from "./datapack-template.js";
import { generateItemOutputs } from "./generators/item-generator.js";
import { generateSpellbookOutputs } from "./generators/spellbook-generator.js";
import { loadExportSettings } from "./settings.js";
import type { SaveDataResponse } from "./types.js";

async function ensureStateFileExists(
	pathName: string,
	errorCode: "MISSING_ITEM_STATE" | "MISSING_SPELLBOOK_STATE",
): Promise<SaveDataResponse | null> {
	try {
		await access(pathName);
		return null;
	} catch {
		return {
			ok: false,
			code: errorCode,
			message: `Required state file is missing: ${pathName}`,
		};
	}
}

export async function exportDatapack(params: {
	itemUsecase: ItemUsecase;
	spellbookUsecase: SpellbookUsecase;
	itemStatePath: string;
	spellbookStatePath: string;
	exportSettingsPath: string;
}): Promise<SaveDataResponse> {
	const missingItem = await ensureStateFileExists(
		params.itemStatePath,
		"MISSING_ITEM_STATE",
	);
	if (missingItem) {
		return missingItem;
	}

	const missingSpellbook = await ensureStateFileExists(
		params.spellbookStatePath,
		"MISSING_SPELLBOOK_STATE",
	);
	if (missingSpellbook) {
		return missingSpellbook;
	}

	try {
		const settings = await loadExportSettings(params.exportSettingsPath);
		const [itemState, spellbookState] = await Promise.all([
			params.itemUsecase.loadItems(),
			params.spellbookUsecase.loadSpellbook(),
		]);

		await writeDatapackScaffold(settings);
		const itemStats = await generateItemOutputs({
			settings,
			items: itemState.items,
		});
		const spellStats = await generateSpellbookOutputs({
			settings,
			entries: spellbookState.entries,
		});

		const totalFiles =
			itemStats.itemFunctions +
			itemStats.itemLootTables +
			spellStats.spellFunctions +
			spellStats.spellLootTables +
			3;

		return {
			ok: true,
			message: "datapack export completed",
			outputRoot: settings.outputRoot,
			generated: {
				...itemStats,
				...spellStats,
				totalFiles,
			},
		};
	} catch (error) {
		const details = error instanceof Error ? error.message : String(error);
		const isConfigError = /settings|namespace|paths|templatePackPath/.test(
			details,
		);
		const code = isConfigError ? "INVALID_CONFIG" : "EXPORT_FAILED";
		console.error(`[save] ${code}: ${details}`);
		return {
			ok: false,
			code,
			message: code === "INVALID_CONFIG" ? "Invalid export settings." : "Datapack export failed.",
			details,
		};
	}
}
