import { createItemUsecase, createSpellbookUsecase } from "@maf/domain";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { loadServerConfig } from "./config.js";
import { exportDatapack } from "./export/index.js";
import {
	createItemStateRepository,
	createSpellbookStateRepository,
} from "./repositories/json-file-repositories.js";

export function createApp() {
	const config = loadServerConfig();
	const itemRepository = createItemStateRepository(config.itemStatePath);
	const spellbookRepository = createSpellbookStateRepository(
		config.spellbookStatePath,
	);

	const itemUsecase = createItemUsecase({ itemRepository });
	const spellbookUsecase = createSpellbookUsecase({ spellbookRepository });

	const app = new Hono();

	app.use(
		"*",
		cors({
			origin: config.allowedOrigin,
			allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
			allowHeaders: ["Content-Type"],
		}),
	);

	app.get("/health", (c) => c.json({ ok: true }));

	app.get("/api/items", async (c) => {
		const state = await itemUsecase.loadItems();
		return c.json(state);
	});

	app.post("/api/items", async (c) => {
		const body = await c.req.json();
		const result = await itemUsecase.saveItem(body);
		return c.json(result, result.ok ? 200 : 400);
	});

	app.delete("/api/items/:id", async (c) => {
		const id = c.req.param("id");
		const result = await itemUsecase.deleteItem({ id });
		return c.json(result, result.ok ? 200 : 404);
	});

	app.get("/api/spellbook", async (c) => {
		const state = await spellbookUsecase.loadSpellbook();
		return c.json(state);
	});

	app.post("/api/spellbook", async (c) => {
		const body = await c.req.json();
		const result = await spellbookUsecase.saveSpellbookEntry(body);
		return c.json(result, result.ok ? 200 : 400);
	});

	app.delete("/api/spellbook/:id", async (c) => {
		const id = c.req.param("id");
		const result = await spellbookUsecase.deleteSpellbookEntry(id);
		return c.json(result, result.ok ? 200 : 404);
	});

	app.post("/api/save", async (c) => {
		const result = await exportDatapack({
			itemUsecase,
			spellbookUsecase,
			itemStatePath: config.itemStatePath,
			spellbookStatePath: config.spellbookStatePath,
			exportSettingsPath: config.exportSettingsPath,
		});
		return c.json(result, result.ok ? 200 : 400);
	});

	return { app, config };
}
