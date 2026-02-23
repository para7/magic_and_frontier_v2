import type {
	DeleteGrimoireEntryResult,
	DeleteItemResult,
	GrimoireState,
	ItemState,
	SaveGrimoireEntryResult,
	SaveItemResult,
} from "@maf/domain";
import { Hono } from "hono";
import type { SaveDataResponse } from "./export/types.js";

type SkillEntry = {
	id: string;
	name: string;
	script: string;
	itemId: string;
	updatedAt: string;
};

type EnemySkillTrigger = "on_spawn" | "on_hit" | "on_low_hp" | "on_timer";

type EnemySkillEntry = {
	id: string;
	name: string;
	script: string;
	cooldown?: number;
	trigger?: EnemySkillTrigger;
	updatedAt: string;
};

type DropRef = {
	kind: "item" | "grimoire";
	refId: string;
	weight: number;
	countMin?: number;
	countMax?: number;
};

type SpawnRule = {
	origin: { x: number; y: number; z: number };
	distance: { min: number; max: number };
	axisBounds?: {
		xMin?: number;
		xMax?: number;
		yMin?: number;
		yMax?: number;
		zMin?: number;
		zMax?: number;
	};
};

type EnemyEntry = {
	id: string;
	name: string;
	hp: number;
	attack?: number;
	defense?: number;
	moveSpeed?: number;
	dropTableId: string;
	enemySkillIds: string[];
	spawnRule: SpawnRule;
	dropTable?: DropRef[];
	updatedAt: string;
};

type TreasureEntry = {
	id: string;
	name: string;
	lootPools: DropRef[];
	updatedAt: string;
};

type EntryState<TEntry> = {
	entries: TEntry[];
};

type SaveEntryResult<TEntry> =
	| {
			ok: true;
			entry: TEntry;
			mode: "created" | "updated";
	  }
	| {
			ok: false;
			fieldErrors: Record<string, string>;
			formError?: string;
	  };

type DeleteEntryResult =
	| {
			ok: true;
			deletedId: string;
	  }
	| {
			ok: false;
			formError: string;
			code?: "NOT_FOUND" | "REFERENCE_ERROR";
	  };

// Type-only RPC contract for hono/client.
const rpcApp = new Hono()
	.get("/api/items", (c) => c.json({ items: [] } as ItemState))
	.post("/api/items", (c) => c.json({ ok: true } as SaveItemResult))
	.delete("/api/items/:id", (c) => c.json({ ok: true } as DeleteItemResult))
	.get("/api/grimoire", (c) => c.json({ entries: [] } as GrimoireState))
	.post("/api/grimoire", (c) => c.json({ ok: true } as SaveGrimoireEntryResult))
	.delete("/api/grimoire/:id", (c) =>
		c.json({ ok: true } as DeleteGrimoireEntryResult),
	)
	.get("/api/skills", (c) => c.json({ entries: [] } as EntryState<SkillEntry>))
	.post("/api/skills", (c) =>
		c.json({ ok: true } as SaveEntryResult<SkillEntry>),
	)
	.delete("/api/skills/:id", (c) => c.json({ ok: true } as DeleteEntryResult))
	.get("/api/enemy-skills", (c) =>
		c.json({ entries: [] } as EntryState<EnemySkillEntry>),
	)
	.post("/api/enemy-skills", (c) =>
		c.json({ ok: true } as SaveEntryResult<EnemySkillEntry>),
	)
	.delete("/api/enemy-skills/:id", (c) =>
		c.json({ ok: true } as DeleteEntryResult),
	)
	.get("/api/enemies", (c) => c.json({ entries: [] } as EntryState<EnemyEntry>))
	.post("/api/enemies", (c) =>
		c.json({ ok: true } as SaveEntryResult<EnemyEntry>),
	)
	.delete("/api/enemies/:id", (c) => c.json({ ok: true } as DeleteEntryResult))
	.get("/api/treasures", (c) =>
		c.json({ entries: [] } as EntryState<TreasureEntry>),
	)
	.post("/api/treasures", (c) =>
		c.json({ ok: true } as SaveEntryResult<TreasureEntry>),
	)
	.delete("/api/treasures/:id", (c) =>
		c.json({ ok: true } as DeleteEntryResult),
	)
	.post("/api/save", (c) =>
		c.json({
			ok: true,
			message: "datapack export completed",
		} as SaveDataResponse),
	);

export type AppType = typeof rpcApp;
