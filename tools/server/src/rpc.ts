import type {
	DeleteItemResult,
	DeleteGrimoireEntryResult,
	ItemState,
	SaveItemResult,
	SaveGrimoireEntryResult,
	GrimoireState,
} from "@maf/domain";
import { Hono } from "hono";
import type { SaveDataResponse } from "./export/types.js";

// Type-only RPC contract for hono/client.
const rpcApp = new Hono()
	.get("/api/items", (c) => c.json({ items: [] } as ItemState))
	.post("/api/items", (c) => c.json({ ok: true } as SaveItemResult))
	.delete("/api/items/:id", (c) => c.json({ ok: true } as DeleteItemResult))
	.get("/api/grimoire", (c) => c.json({ entries: [] } as GrimoireState))
	.post("/api/grimoire", (c) =>
		c.json({ ok: true } as SaveGrimoireEntryResult),
	)
	.delete("/api/grimoire/:id", (c) =>
		c.json({ ok: true } as DeleteGrimoireEntryResult),
	)
	.post("/api/save", (c) =>
		c.json({ ok: true, message: "datapack export completed" } as SaveDataResponse),
	);

export type AppType = typeof rpcApp;
