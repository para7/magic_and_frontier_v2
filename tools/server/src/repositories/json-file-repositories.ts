import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
	defaultGrimoireState,
	defaultItemState,
	type GrimoireState,
	type GrimoireStateRepository,
	type ItemState,
	type ItemStateRepository,
	normalizeGrimoireState,
	normalizeItemState,
} from "@maf/domain";

export type EntryState<TEntry> = {
	entries: TEntry[];
};

function normalizeEntryState<TEntry>(value: unknown): EntryState<TEntry> {
	if (!value || typeof value !== "object") {
		return { entries: [] };
	}

	const entries = (value as { entries?: unknown }).entries;
	if (!Array.isArray(entries)) {
		return { entries: [] };
	}

	return { entries: entries as TEntry[] };
}

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

export function createGrimoireStateRepository(
	grimoireStatePath: string,
): GrimoireStateRepository {
	return {
		async loadGrimoireState(): Promise<GrimoireState> {
			const value = await readJson(grimoireStatePath);
			if (value == null) {
				return defaultGrimoireState;
			}
			return normalizeGrimoireState(value);
		},
		async saveGrimoireState(state: GrimoireState): Promise<void> {
			await writeJson(grimoireStatePath, state);
		},
	};
}

export function createEntryStateRepository<TEntry>(statePath: string): {
	loadState(): Promise<EntryState<TEntry>>;
	saveState(state: EntryState<TEntry>): Promise<void>;
} {
	return {
		async loadState(): Promise<EntryState<TEntry>> {
			const value = await readJson(statePath);
			if (value == null) {
				return { entries: [] };
			}
			return normalizeEntryState<TEntry>(value);
		},
		async saveState(state: EntryState<TEntry>): Promise<void> {
			await writeJson(statePath, state);
		},
	};
}
