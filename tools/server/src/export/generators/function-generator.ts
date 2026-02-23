import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ExportSettings } from "../types.js";

type SkillEntryLike = {
	id: string;
	script: string;
};

type EnemySkillEntryLike = {
	id: string;
	script: string;
};

function normalizeFunctionBody(script: string): string {
	return script.endsWith("\n") ? script : `${script}\n`;
}

export async function generateSkillFunctionOutputs(params: {
	settings: ExportSettings;
	entries: SkillEntryLike[];
}): Promise<{ skillFunctions: number }> {
	const functionRoot = path.join(
		params.settings.outputRoot,
		params.settings.paths.skillFunctionDir,
	);
	await mkdir(functionRoot, { recursive: true });

	for (const entry of params.entries) {
		const functionPath = path.join(functionRoot, `${entry.id}.mcfunction`);
		await writeFile(functionPath, normalizeFunctionBody(entry.script), "utf-8");
	}

	return {
		skillFunctions: params.entries.length,
	};
}

export async function generateEnemySkillFunctionOutputs(params: {
	settings: ExportSettings;
	entries: EnemySkillEntryLike[];
}): Promise<{ enemySkillFunctions: number }> {
	const functionRoot = path.join(
		params.settings.outputRoot,
		params.settings.paths.enemySkillFunctionDir,
	);
	await mkdir(functionRoot, { recursive: true });

	for (const entry of params.entries) {
		const functionPath = path.join(functionRoot, `${entry.id}.mcfunction`);
		await writeFile(functionPath, normalizeFunctionBody(entry.script), "utf-8");
	}

	return {
		enemySkillFunctions: params.entries.length,
	};
}
