const DEFAULT_CONFIG_PATH = "config.json";
const DEFAULT_ITEM_STATE_PATH = "/tmp/form-state.json";
const DEFAULT_SPELLBOOK_STATE_PATH = "/tmp/spellbook-state.json";

export type AppConfig = {
	storage: {
		itemStatePath: string;
		spellbookStatePath: string;
	};
};

function isErrnoCode(error: unknown, code: string): boolean {
	if (!error || typeof error !== "object") {
		return false;
	}
	return (error as { code?: unknown }).code === code;
}

function normalizeAppConfig(value: unknown): AppConfig {
	if (!value || typeof value !== "object") {
		return {
			storage: {
				itemStatePath: DEFAULT_ITEM_STATE_PATH,
				spellbookStatePath: DEFAULT_SPELLBOOK_STATE_PATH,
			},
		};
	}

	const record = value as Record<string, unknown>;
	const storage =
		record.storage && typeof record.storage === "object"
			? (record.storage as Record<string, unknown>)
			: {};
	const itemStatePath =
		typeof storage.itemStatePath === "string" && storage.itemStatePath.length > 0
			? storage.itemStatePath
			: DEFAULT_ITEM_STATE_PATH;
	const spellbookStatePath =
		typeof storage.spellbookStatePath === "string" &&
		storage.spellbookStatePath.length > 0
			? storage.spellbookStatePath
			: DEFAULT_SPELLBOOK_STATE_PATH;

	return {
		storage: { itemStatePath, spellbookStatePath },
	};
}

export async function loadAppConfig(
	configPath = DEFAULT_CONFIG_PATH,
): Promise<AppConfig> {
	try {
		const raw = await Bun.file(configPath).text();
		return normalizeAppConfig(JSON.parse(raw));
	} catch (error) {
		if (!isErrnoCode(error, "ENOENT") && error instanceof Error) {
			console.warn(`Failed to load app config from ${configPath}: ${error.message}`);
		}
		return normalizeAppConfig(null);
	}
}
