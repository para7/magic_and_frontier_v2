import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ExportSettings } from "./types.js";

export async function writeDatapackScaffold(
	settings: ExportSettings,
): Promise<void> {
	await mkdir(settings.outputRoot, { recursive: true });
	await cp(
		settings.templatePackPath,
		path.join(settings.outputRoot, "pack.mcmeta"),
	);

	const outputDirs = [
		settings.paths.itemFunctionDir,
		settings.paths.itemLootDir,
		settings.paths.spellFunctionDir,
		settings.paths.spellLootDir,
		settings.paths.skillFunctionDir,
		settings.paths.enemySkillFunctionDir,
		settings.paths.enemyFunctionDir,
		settings.paths.enemyLootDir,
		settings.paths.treasureLootDir,
		path.join(settings.paths.debugFunctionDir, "item"),
		path.join(settings.paths.debugFunctionDir, "grimoire"),
	];

	for (const relativeDir of outputDirs) {
		const absoluteDir = path.join(settings.outputRoot, relativeDir);
		await rm(absoluteDir, { recursive: true, force: true });
		await mkdir(absoluteDir, { recursive: true });
	}

	const loadTagPath = path.join(
		settings.outputRoot,
		settings.paths.minecraftTagDir,
		"load.json",
	);
	await mkdir(path.dirname(loadTagPath), { recursive: true });
	await writeFile(
		loadTagPath,
		`${JSON.stringify({ values: [`${settings.namespace}:load`] }, null, 2)}\n`,
		"utf-8",
	);

	const loadFunctionPath = path.join(
		settings.outputRoot,
		"data",
		settings.namespace,
		"function",
		"load.mcfunction",
	);
	await mkdir(path.dirname(loadFunctionPath), { recursive: true });
	await writeFile(
		loadFunctionPath,
		`tellraw @a [{"text":"enabled datapack: ${settings.namespace}"}]\n`,
		"utf-8",
	);
}
