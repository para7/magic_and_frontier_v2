import { createItemUsecase, createGrimoireUsecase } from "@maf/domain";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { loadServerConfig } from "./config.js";
import { exportDatapack } from "./export/index.js";
import {
	createItemStateRepository,
	createGrimoireStateRepository,
} from "./repositories/json-file-repositories.js";

export function createApp() {
	const config = loadServerConfig();
	const itemRepository = createItemStateRepository(config.itemStatePath);
	const grimoireRepository = createGrimoireStateRepository(
		config.grimoireStatePath,
	);

	const itemUsecase = createItemUsecase({ itemRepository });
	const grimoireUsecase = createGrimoireUsecase({ grimoireRepository });

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

	app.get("/api/grimoire", async (c) => {
		const state = await grimoireUsecase.loadGrimoire();
		return c.json(state);
	});

	app.post("/api/grimoire", async (c) => {
		const body = await c.req.json();
		const result = await grimoireUsecase.saveGrimoireEntry(body);
		return c.json(result, result.ok ? 200 : 400);
	});

	app.delete("/api/grimoire/:id", async (c) => {
		const id = c.req.param("id");
		const result = await grimoireUsecase.deleteGrimoireEntry(id);
		return c.json(result, result.ok ? 200 : 404);
	});

	app.post("/api/save", async (c) => {
		const result = await exportDatapack({
			itemUsecase,
			grimoireUsecase,
			itemStatePath: config.itemStatePath,
			grimoireStatePath: config.grimoireStatePath,
			exportSettingsPath: config.exportSettingsPath,
		});
		return c.json(result, result.ok ? 200 : 400);
	});

	return { app, config };
}
