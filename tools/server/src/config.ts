import { existsSync } from "node:fs";
import path from "node:path";

function defaultStatePath(fileName: string): string {
	const candidates = [
		path.resolve(process.cwd(), "savedata", fileName),
		path.resolve(process.cwd(), "../savedata", fileName),
		path.resolve(process.cwd(), "tools/savedata", fileName),
	];
	const existing = candidates.find((candidate) => existsSync(candidate));
	return existing ?? candidates[0];
}

function defaultExportSettingsPath(): string {
	const candidates = [
		path.resolve(process.cwd(), "config/export-settings.json"),
		path.resolve(process.cwd(), "server/config/export-settings.json"),
		path.resolve(process.cwd(), "tools/server/config/export-settings.json"),
	];
	const existing = candidates.find((candidate) => existsSync(candidate));
	return existing ?? candidates[0];
}

export type ServerConfig = {
	port: number;
	itemStatePath: string;
	grimoireStatePath: string;
	skillStatePath: string;
	enemySkillStatePath: string;
	enemyStatePath: string;
	treasureStatePath: string;
	allowedOrigin: string;
	exportSettingsPath: string;
};

export function loadServerConfig(): ServerConfig {
	const rawPort = Number.parseInt(process.env.PORT ?? "8787", 10);
	return {
		port: Number.isInteger(rawPort) ? rawPort : 8787,
		itemStatePath:
			process.env.ITEM_STATE_PATH ?? defaultStatePath("form-state.json"),
		grimoireStatePath:
			process.env.GRIMOIRE_STATE_PATH ??
			defaultStatePath("grimoire-state.json"),
		skillStatePath:
			process.env.SKILL_STATE_PATH ?? defaultStatePath("skill-state.json"),
		enemySkillStatePath:
			process.env.ENEMY_SKILL_STATE_PATH ??
			defaultStatePath("enemy-skill-state.json"),
		enemyStatePath:
			process.env.ENEMY_STATE_PATH ?? defaultStatePath("enemy-state.json"),
		treasureStatePath:
			process.env.TREASURE_STATE_PATH ??
			defaultStatePath("treasure-state.json"),
		allowedOrigin: process.env.ALLOWED_ORIGIN ?? "http://localhost:4200",
		exportSettingsPath:
			process.env.EXPORT_SETTINGS_PATH ?? defaultExportSettingsPath(),
	};
}
