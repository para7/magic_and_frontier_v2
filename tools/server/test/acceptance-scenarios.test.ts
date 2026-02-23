import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
	createGrimoireUsecase,
	createItemUsecase,
	type GrimoireState,
	type ItemState,
} from "@maf/domain";
import { afterEach, describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";
import { exportDatapack } from "../src/export/index.js";

function createMemoryItemRepo(initial: ItemState = { items: [] }) {
	let state = initial;
	return {
		async loadItemState() {
			return state;
		},
		async saveItemState(next: ItemState) {
			state = next;
		},
	};
}

function createMemoryGrimoireRepo(initial: GrimoireState = { entries: [] }) {
	let state = initial;
	return {
		async loadGrimoireState() {
			return state;
		},
		async saveGrimoireState(next: GrimoireState) {
			state = next;
		},
	};
}

async function countFiles(root: string): Promise<number> {
	let count = 0;
	const stack = [root];
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;
		const entries = await readdir(current, { withFileTypes: true });
		for (const entry of entries) {
			const absolute = path.join(current, entry.name);
			if (entry.isDirectory()) {
				stack.push(absolute);
				continue;
			}
			count += 1;
		}
	}
	return count;
}

function uuid(suffix: string): string {
	return `00000000-0000-4000-8000-${suffix}`;
}

async function withTempServerEnv(
	run: (app: ReturnType<typeof createApp>["app"]) => Promise<void>,
) {
	const tempRoot = await mkdtemp(path.join(os.tmpdir(), "maf-api-validation-"));
	tempDirs.push(tempRoot);
	const previousEnv = {
		ITEM_STATE_PATH: process.env.ITEM_STATE_PATH,
		GRIMOIRE_STATE_PATH: process.env.GRIMOIRE_STATE_PATH,
		SKILL_STATE_PATH: process.env.SKILL_STATE_PATH,
		ENEMY_SKILL_STATE_PATH: process.env.ENEMY_SKILL_STATE_PATH,
		ENEMY_STATE_PATH: process.env.ENEMY_STATE_PATH,
		TREASURE_STATE_PATH: process.env.TREASURE_STATE_PATH,
	};
	process.env.ITEM_STATE_PATH = path.join(tempRoot, "item-state.json");
	process.env.GRIMOIRE_STATE_PATH = path.join(tempRoot, "grimoire-state.json");
	process.env.SKILL_STATE_PATH = path.join(tempRoot, "skill-state.json");
	process.env.ENEMY_SKILL_STATE_PATH = path.join(
		tempRoot,
		"enemy-skill-state.json",
	);
	process.env.ENEMY_STATE_PATH = path.join(tempRoot, "enemy-state.json");
	process.env.TREASURE_STATE_PATH = path.join(tempRoot, "treasure-state.json");

	try {
		const { app } = createApp();
		await run(app);
	} finally {
		process.env.ITEM_STATE_PATH = previousEnv.ITEM_STATE_PATH;
		process.env.GRIMOIRE_STATE_PATH = previousEnv.GRIMOIRE_STATE_PATH;
		process.env.SKILL_STATE_PATH = previousEnv.SKILL_STATE_PATH;
		process.env.ENEMY_SKILL_STATE_PATH = previousEnv.ENEMY_SKILL_STATE_PATH;
		process.env.ENEMY_STATE_PATH = previousEnv.ENEMY_STATE_PATH;
		process.env.TREASURE_STATE_PATH = previousEnv.TREASURE_STATE_PATH;
	}
}

const tempDirs: string[] = [];

afterEach(async () => {
	await Promise.all(
		tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
	);
});

describe("acceptance scenarios", () => {
	test("POST /api/skills returns 400 when referenced itemId does not exist", async () => {
		await withTempServerEnv(async (app) => {
			const response = await app.request("http://localhost/api/skills", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: uuid("000000000001"),
					name: "Slash",
					script: "say slash",
					itemId: uuid("000000000777"),
				}),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.ok).toBe(false);
			expect(body.fieldErrors?.itemId).toContain("Referenced item");
		});
	});

	test("POST /api/enemies returns 400 when enemySkillIds contains unknown id", async () => {
		await withTempServerEnv(async (app) => {
			const response = await app.request("http://localhost/api/enemies", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: uuid("000000000002"),
					name: "Zombie",
					hp: 20,
					dropTableId: "treasure-a",
					enemySkillIds: [uuid("000000000888")],
					spawnRule: {
						origin: { x: 0, y: 64, z: 0 },
						distance: { min: 0, max: 32 },
					},
				}),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.ok).toBe(false);
			expect(body.fieldErrors?.["enemySkillIds.0"]).toContain("Referenced enemy skill");
		});
	});

	test("POST /api/enemies returns 400 when spawnRule.distance.min is greater than max", async () => {
		await withTempServerEnv(async (app) => {
			const enemySkillId = uuid("000000000003");
			await app.request("http://localhost/api/enemy-skills", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: enemySkillId,
					name: "Roar",
					script: "say roar",
				}),
			});

			const response = await app.request("http://localhost/api/enemies", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: uuid("000000000004"),
					name: "Zombie",
					hp: 20,
					dropTableId: "treasure-a",
					enemySkillIds: [enemySkillId],
					spawnRule: {
						origin: { x: 0, y: 64, z: 0 },
						distance: { min: 50, max: 10 },
					},
				}),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.ok).toBe(false);
			expect(body.fieldErrors?.["spawnRule.distance.min"]).toContain("Must be <=");
		});
	});

	test("exportDatapack reflects mixed item/grimoire loot, weight values, and generated totals", async () => {
		const tempRoot = await mkdtemp(path.join(os.tmpdir(), "maf-export-acceptance-"));
		tempDirs.push(tempRoot);
		const templatePath = path.join(tempRoot, "pack-template.mcmeta");
		const settingsPath = path.join(tempRoot, "export-settings.json");
		const outputRoot = path.join(tempRoot, "out");

		await writeFile(templatePath, '{"pack":{"pack_format":61,"description":"test"}}\n', "utf-8");
		await writeFile(
			settingsPath,
			`${JSON.stringify(
				{
					outputRoot: "./out",
					namespace: "maf",
					templatePackPath: "./pack-template.mcmeta",
					paths: {
						itemFunctionDir: "data/maf/function/item",
						itemLootDir: "data/maf/loot_table/item",
						spellFunctionDir: "data/maf/function/grimoire",
						spellLootDir: "data/maf/loot_table/grimoire",
						skillFunctionDir: "data/maf/function/skill",
						enemySkillFunctionDir: "data/maf/function/enemy_skill",
						enemyFunctionDir: "data/maf/function/enemy/spawn",
						enemyLootDir: "data/maf/loot_table/enemy",
						treasureLootDir: "data/maf/loot_table/treasure",
						debugFunctionDir: "data/maf/function/debug/give",
						minecraftTagDir: "data/minecraft/tags/function",
					},
				},
				null,
				2,
			)}\n`,
			"utf-8",
		);

		const itemUsecase = createItemUsecase({
			itemRepository: createMemoryItemRepo(),
			now: () => new Date("2026-02-23T00:00:00.000Z"),
		});
		const grimoireUsecase = createGrimoireUsecase({
			grimoireRepository: createMemoryGrimoireRepo(),
			now: () => new Date("2026-02-23T00:00:00.000Z"),
		});

		await itemUsecase.saveItem({
			id: "item-1",
			itemId: "minecraft:stone",
			count: 3,
			customName: "",
			lore: "",
			enchantments: "",
			unbreakable: false,
			customModelData: "",
			customNbt: "",
		});
		await grimoireUsecase.saveGrimoireEntry({
			id: "grimoire-1",
			castid: 1,
			script: "function maf:spell/test",
			variants: [{ cast: 5, cost: 20 }],
			title: "Test Spell",
			description: "First line\nSecond line",
		});

		const result = await exportDatapack({
			itemUsecase,
			grimoireUsecase,
			skillUsecase: {
				async loadSkills() {
					return { entries: [{ id: "skill-1", script: "say skill" }] };
				},
			},
			enemySkillUsecase: {
				async loadEnemySkills() {
					return { entries: [{ id: "enemy-skill-1", script: "say enemy-skill" }] };
				},
			},
			enemyUsecase: {
				async loadEnemies() {
					return {
						entries: [
							{
								id: "enemy-1",
								name: "Zombie",
								dropTableId: "treasure-1",
								spawnRule: {
									origin: { x: 0, y: 64, z: 0 },
									distance: { min: 0, max: 16 },
								},
							},
						],
					};
				},
			},
			treasureUsecase: {
				async loadTreasures() {
					return {
						entries: [
							{
								id: "treasure-1",
								lootPools: [
									{ kind: "item", refId: "item-1", weight: 3 },
									{ kind: "grimoire", refId: "grimoire-1", weight: 11 },
								],
							},
						],
					};
				},
			},
			itemStatePath: path.join(tempRoot, "unused-item-state.json"),
			grimoireStatePath: path.join(tempRoot, "unused-grimoire-state.json"),
			exportSettingsPath: settingsPath,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const fileCount = await countFiles(outputRoot);
		expect(result.generated.itemFunctions).toBe(1);
		expect(result.generated.itemLootTables).toBe(1);
		expect(result.generated.spellFunctions).toBe(1);
		expect(result.generated.spellLootTables).toBe(1);
		expect(result.generated.skillFunctions).toBe(1);
		expect(result.generated.enemySkillFunctions).toBe(1);
		expect(result.generated.enemyFunctions).toBe(1);
		expect(result.generated.enemyLootTables).toBe(1);
		expect(result.generated.treasureLootTables).toBe(1);
		expect(result.generated.totalFiles).toBe(fileCount);

		const treasureLoot = await readFile(
			path.join(outputRoot, "data/maf/loot_table/treasure/treasure-1.json"),
			"utf-8",
		);
		expect(treasureLoot).toContain('"name": "minecraft:stone"');
		expect(treasureLoot).toContain('"name": "minecraft:written_book"');
		expect(treasureLoot).toContain('"weight": 3');
		expect(treasureLoot).toContain('"weight": 11');

		const enemyLoot = await readFile(
			path.join(outputRoot, "data/maf/loot_table/enemy/enemy-1.json"),
			"utf-8",
		);
		expect(enemyLoot).toContain('"weight": 3');
		expect(enemyLoot).toContain('"weight": 11');

		const itemFunction = await readFile(
			path.join(outputRoot, "data/maf/function/item/item-1.mcfunction"),
			"utf-8",
		);
		expect(itemFunction).toContain("# itemId=minecraft:stone sourceId=item-1");
		expect(itemFunction).toContain("loot give @s loot maf:item/item-1");

		const grimoireLoot = await readFile(
			path.join(outputRoot, "data/maf/loot_table/grimoire/cast_1_v1.json"),
			"utf-8",
		);
		expect(grimoireLoot).toContain('"name": "minecraft:written_book"');
		expect(grimoireLoot).toContain("castid:1");
		expect(grimoireLoot).toContain('script:\\"function maf:spell/test\\"');
	});
});
