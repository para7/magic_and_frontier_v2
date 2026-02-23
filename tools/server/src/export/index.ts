import type { ItemUsecase, GrimoireUsecase } from "@maf/domain";
import { writeDatapackScaffold } from "./datapack-template.js";
import { generateItemOutputs } from "./generators/item-generator.js";
import { generateGrimoireOutputs } from "./generators/grimoire-generator.js";
import { loadExportSettings } from "./settings.js";
import type { SaveDataResponse } from "./types.js";

export async function exportDatapack(params: {
	itemUsecase: ItemUsecase;
	grimoireUsecase: GrimoireUsecase;
	itemStatePath: string;
	grimoireStatePath: string;
	exportSettingsPath: string;
}): Promise<SaveDataResponse> {
	try {
		const settings = await loadExportSettings(params.exportSettingsPath);
		const [itemState, grimoireState] = await Promise.all([
			params.itemUsecase.loadItems(),
			params.grimoireUsecase.loadGrimoire(),
		]);

		await writeDatapackScaffold(settings);
		const itemStats = await generateItemOutputs({
			settings,
			items: itemState.items,
		});
		const spellStats = await generateGrimoireOutputs({
			settings,
			entries: grimoireState.entries,
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
