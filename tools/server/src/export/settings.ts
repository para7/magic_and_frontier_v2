import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ExportSettings } from "./types.js";

function isObject(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object";
}

function asString(value: unknown, key: string): string {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`${key} must be a non-empty string.`);
	}
	return value;
}

function asStringOrDefault(
	value: unknown,
	key: string,
	fallback: string,
): string {
	if (value === undefined) {
		return fallback;
	}
	return asString(value, key);
}

export async function loadExportSettings(
	settingsPath: string,
): Promise<ExportSettings> {
	let parsed: unknown;
	try {
		const raw = await readFile(settingsPath, "utf-8");
		parsed = JSON.parse(raw);
	} catch (error) {
		throw new Error(
			`Failed to read export settings at ${settingsPath}: ${String(error)}`,
		);
	}

	if (!isObject(parsed)) {
		throw new Error("Export settings must be an object.");
	}

	const outputRoot = asString(parsed.outputRoot, "outputRoot");
	const namespace = asString(parsed.namespace, "namespace");
	if (!/^[a-z0-9_.-]+$/.test(namespace)) {
		throw new Error("namespace must match [a-z0-9_.-]+.");
	}

	const templatePackPath = asString(
		parsed.templatePackPath,
		"templatePackPath",
	);
	const paths = parsed.paths;
	if (!isObject(paths)) {
		throw new Error("paths must be an object.");
	}

	const itemFunctionDir = asString(
		paths.itemFunctionDir,
		"paths.itemFunctionDir",
	);
	const itemLootDir = asString(paths.itemLootDir, "paths.itemLootDir");
	const spellFunctionDir = asString(
		paths.spellFunctionDir,
		"paths.spellFunctionDir",
	);
	const spellLootDir = asString(paths.spellLootDir, "paths.spellLootDir");
	const skillFunctionDir = asStringOrDefault(
		paths.skillFunctionDir,
		"paths.skillFunctionDir",
		`data/${namespace}/function/skill`,
	);
	const enemySkillFunctionDir = asStringOrDefault(
		paths.enemySkillFunctionDir,
		"paths.enemySkillFunctionDir",
		`data/${namespace}/function/enemy_skill`,
	);
	const enemyFunctionDir = asStringOrDefault(
		paths.enemyFunctionDir,
		"paths.enemyFunctionDir",
		`data/${namespace}/function/enemy/spawn`,
	);
	const enemyLootDir = asStringOrDefault(
		paths.enemyLootDir,
		"paths.enemyLootDir",
		`data/${namespace}/loot_table/enemy`,
	);
	const treasureLootDir = asStringOrDefault(
		paths.treasureLootDir,
		"paths.treasureLootDir",
		`data/${namespace}/loot_table/treasure`,
	);
	const debugFunctionDir = asStringOrDefault(
		paths.debugFunctionDir,
		"paths.debugFunctionDir",
		`data/${namespace}/function/debug/give`,
	);
	const minecraftTagDir = asString(
		paths.minecraftTagDir,
		"paths.minecraftTagDir",
	);

	const baseDir = path.dirname(settingsPath);
	return {
		outputRoot: path.resolve(baseDir, outputRoot),
		namespace,
		templatePackPath: path.resolve(baseDir, templatePackPath),
		paths: {
			itemFunctionDir,
			itemLootDir,
			spellFunctionDir,
			spellLootDir,
			skillFunctionDir,
			enemySkillFunctionDir,
			enemyFunctionDir,
			enemyLootDir,
			treasureLootDir,
			debugFunctionDir,
			minecraftTagDir,
		},
	};
}
