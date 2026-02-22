import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
	defaultItemState,
	defaultSpellbookState,
	type ItemState,
	type ItemStateRepository,
	normalizeItemState,
	normalizeSpellbookState,
	type SpellbookState,
	type SpellbookStateRepository,
} from "@maf/domain";

function isErrnoCode(error: unknown, code: string): boolean {
	if (!error || typeof error !== "object") {
		return false;
	}
	return (error as { code?: unknown }).code === code;
}

async function readJson(pathName: string): Promise<unknown> {
	try {
		const raw = await readFile(pathName, "utf-8");
		return JSON.parse(raw);
	} catch (error) {
		if (isErrnoCode(error, "ENOENT")) {
			return null;
		}
		throw error;
	}
}

async function writeJson(pathName: string, value: unknown): Promise<void> {
	await mkdir(path.dirname(pathName), { recursive: true });
	await writeFile(pathName, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

export function createItemStateRepository(
	itemStatePath: string,
): ItemStateRepository {
	return {
		async loadItemState(): Promise<ItemState> {
			const value = await readJson(itemStatePath);
			if (value == null) {
				return defaultItemState;
			}
			return normalizeItemState(value);
		},
		async saveItemState(state: ItemState): Promise<void> {
			await writeJson(itemStatePath, state);
		},
	};
}

export function createSpellbookStateRepository(
	spellbookStatePath: string,
): SpellbookStateRepository {
	return {
		async loadSpellbookState(): Promise<SpellbookState> {
			const value = await readJson(spellbookStatePath);
			if (value == null) {
				return defaultSpellbookState;
			}
			return normalizeSpellbookState(value);
		},
		async saveSpellbookState(state: SpellbookState): Promise<void> {
			await writeJson(spellbookStatePath, state);
		},
	};
}
