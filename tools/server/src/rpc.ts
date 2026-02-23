import type {
	DeleteItemResult,
	DeleteSpellbookEntryResult,
	ItemState,
	SaveItemResult,
	SaveSpellbookEntryResult,
	SpellbookState,
} from "@maf/domain";
import { Hono } from "hono";
import type { SaveDataResponse } from "./export/types.js";

// Type-only RPC contract for hono/client.
const rpcApp = new Hono()
	.get("/api/items", (c) => c.json({ items: [] } as ItemState))
	.post("/api/items", (c) => c.json({ ok: true } as SaveItemResult))
	.delete("/api/items/:id", (c) => c.json({ ok: true } as DeleteItemResult))
	.get("/api/spellbook", (c) => c.json({ entries: [] } as SpellbookState))
	.post("/api/spellbook", (c) =>
		c.json({ ok: true } as SaveSpellbookEntryResult),
	)
	.delete("/api/spellbook/:id", (c) =>
		c.json({ ok: true } as DeleteSpellbookEntryResult),
	)
	.post("/api/save", (c) =>
		c.json({ ok: true, message: "datapack export completed" } as SaveDataResponse),
	);

export type AppType = typeof rpcApp;
