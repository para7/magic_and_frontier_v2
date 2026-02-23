import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createGrimoireUsecase, createItemUsecase, type GrimoireState, type ItemState } from "@maf/domain";
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

const tempDirs: string[] = [];

afterEach(async () => {
	await Promise.all(
		tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
	);
});

describe("save/export", () => {
	test("exportDatapack: generated statistics match actual output files and keep item/grimoire compatibility", async () => {
		const tempRoot = await mkdtemp(path.join(os.tmpdir(), "maf-export-test-"));
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
			effectid: 10,
			cost: 20,
			cast: 5,
			title: "Test Spell",
			description: "First line\nSecond line",
		});

		const result = await exportDatapack({
			itemUsecase,
			grimoireUsecase,
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
		expect(result.generated.totalFiles).toBe(fileCount);

		const itemFunction = await readFile(
			path.join(outputRoot, "data/maf/function/item/item-1.mcfunction"),
			"utf-8",
		);
		expect(itemFunction).toContain("# itemId=minecraft:stone sourceId=item-1");
		expect(itemFunction).toContain("loot give @s loot maf:item/item-1");

		const grimoireLoot = await readFile(
			path.join(outputRoot, "data/maf/loot_table/grimoire/cast_1.json"),
			"utf-8",
		);
		expect(grimoireLoot).toContain('"name": "minecraft:written_book"');
		expect(grimoireLoot).toContain("castid:1");
		expect(grimoireLoot).toContain("effectid:10");
	});

	test("POST /api/save: returns generated totals that match produced files", async () => {
		const tempRoot = await mkdtemp(path.join(os.tmpdir(), "maf-api-save-test-"));
		tempDirs.push(tempRoot);
		const outputRoot = path.join(tempRoot, "out");
		const settingsPath = path.join(tempRoot, "export-settings.json");
		const templatePath = path.join(tempRoot, "pack-template.mcmeta");
		const itemStatePath = path.join(tempRoot, "item-state.json");
		const grimoireStatePath = path.join(tempRoot, "grimoire-state.json");

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
						minecraftTagDir: "data/minecraft/tags/function",
					},
				},
				null,
				2,
			)}\n`,
			"utf-8",
		);

		const previousEnv = {
			ITEM_STATE_PATH: process.env.ITEM_STATE_PATH,
			GRIMOIRE_STATE_PATH: process.env.GRIMOIRE_STATE_PATH,
			EXPORT_SETTINGS_PATH: process.env.EXPORT_SETTINGS_PATH,
		};
		process.env.ITEM_STATE_PATH = itemStatePath;
		process.env.GRIMOIRE_STATE_PATH = grimoireStatePath;
		process.env.EXPORT_SETTINGS_PATH = settingsPath;

		try {
			const { app } = createApp();

			await app.request("http://localhost/api/items", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: "item-2",
					itemId: "minecraft:apple",
					count: 2,
					customName: "",
					lore: "",
					enchantments: "",
					unbreakable: false,
					customModelData: "",
					customNbt: "",
				}),
			});

			await app.request("http://localhost/api/grimoire", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: "grimoire-2",
					castid: 2,
					effectid: 20,
					cost: 40,
					cast: 6,
					title: "Apple Spell",
					description: "desc",
				}),
			});

			const response = await app.request("http://localhost/api/save", {
				method: "POST",
			});
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.ok).toBe(true);
			if (body.ok !== true) return;

			const fileCount = await countFiles(outputRoot);
			expect(body.generated.totalFiles).toBe(fileCount);
			expect(body.generated.itemFunctions).toBe(1);
			expect(body.generated.spellLootTables).toBe(1);
		} finally {
			process.env.ITEM_STATE_PATH = previousEnv.ITEM_STATE_PATH;
			process.env.GRIMOIRE_STATE_PATH = previousEnv.GRIMOIRE_STATE_PATH;
			process.env.EXPORT_SETTINGS_PATH = previousEnv.EXPORT_SETTINGS_PATH;
		}
	});

	test("POST /api/save: includes generated counts for skills, enemy skills, enemies, and treasures", async () => {
		const tempRoot = await mkdtemp(path.join(os.tmpdir(), "maf-api-save-new-categories-"));
		tempDirs.push(tempRoot);
		const outputRoot = path.join(tempRoot, "out");
		const settingsPath = path.join(tempRoot, "export-settings.json");
		const templatePath = path.join(tempRoot, "pack-template.mcmeta");
		const itemStatePath = path.join(tempRoot, "item-state.json");
		const grimoireStatePath = path.join(tempRoot, "grimoire-state.json");
		const skillStatePath = path.join(tempRoot, "skill-state.json");
		const enemySkillStatePath = path.join(tempRoot, "enemy-skill-state.json");
		const enemyStatePath = path.join(tempRoot, "enemy-state.json");
		const treasureStatePath = path.join(tempRoot, "treasure-state.json");

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

		const itemId = uuid("000000000041");
		const grimoireId = uuid("000000000042");
		const skillId = uuid("000000000043");
		const enemySkillId = uuid("000000000044");
		const treasureId = uuid("000000000045");
		const enemyId = uuid("000000000046");

		const previousEnv = {
			ITEM_STATE_PATH: process.env.ITEM_STATE_PATH,
			GRIMOIRE_STATE_PATH: process.env.GRIMOIRE_STATE_PATH,
			SKILL_STATE_PATH: process.env.SKILL_STATE_PATH,
			ENEMY_SKILL_STATE_PATH: process.env.ENEMY_SKILL_STATE_PATH,
			ENEMY_STATE_PATH: process.env.ENEMY_STATE_PATH,
			TREASURE_STATE_PATH: process.env.TREASURE_STATE_PATH,
			EXPORT_SETTINGS_PATH: process.env.EXPORT_SETTINGS_PATH,
		};
		process.env.ITEM_STATE_PATH = itemStatePath;
		process.env.GRIMOIRE_STATE_PATH = grimoireStatePath;
		process.env.SKILL_STATE_PATH = skillStatePath;
		process.env.ENEMY_SKILL_STATE_PATH = enemySkillStatePath;
		process.env.ENEMY_STATE_PATH = enemyStatePath;
		process.env.TREASURE_STATE_PATH = treasureStatePath;
		process.env.EXPORT_SETTINGS_PATH = settingsPath;

		try {
			const { app } = createApp();

			await app.request("http://localhost/api/items", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: itemId,
					itemId: "minecraft:apple",
					count: 2,
					customName: "",
					lore: "",
					enchantments: "",
					unbreakable: false,
					customModelData: "",
					customNbt: "",
				}),
			});
			await app.request("http://localhost/api/grimoire", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: grimoireId,
					castid: 2,
					effectid: 20,
					cost: 40,
					cast: 6,
					title: "Apple Spell",
					description: "desc",
				}),
			});
			await app.request("http://localhost/api/skills", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: skillId,
					name: "Slash",
					script: "say slash",
					itemId,
				}),
			});
			await app.request("http://localhost/api/enemy-skills", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: enemySkillId,
					name: "Roar",
					script: "say roar",
					trigger: "on_spawn",
				}),
			});
			await app.request("http://localhost/api/treasures", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: treasureId,
					name: "Starter Chest",
					lootPools: [
						{ kind: "item", refId: itemId, weight: 2 },
						{ kind: "grimoire", refId: grimoireId, weight: 1 },
					],
				}),
			});
			await app.request("http://localhost/api/enemies", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: enemyId,
					name: "Zombie",
					hp: 20,
					dropTableId: treasureId,
					enemySkillIds: [enemySkillId],
					spawnRule: {
						origin: { x: 0, y: 64, z: 0 },
						distance: { min: 0, max: 16 },
					},
				}),
			});

			const response = await app.request("http://localhost/api/save", {
				method: "POST",
			});
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.ok).toBe(true);
			if (body.ok !== true) return;

			expect(body.generated.skillFunctions).toBe(1);
			expect(body.generated.enemySkillFunctions).toBe(1);
			expect(body.generated.enemyFunctions).toBe(1);
			expect(body.generated.enemyLootTables).toBe(1);
			expect(body.generated.treasureLootTables).toBe(1);
			expect(body.generated.totalFiles).toBe(await countFiles(outputRoot));

			expect(
				await readFile(
					path.join(outputRoot, `data/maf/function/skill/${skillId}.mcfunction`),
					"utf-8",
				),
			).toContain("say slash");
			expect(
				await readFile(
					path.join(
						outputRoot,
						`data/maf/function/enemy_skill/${enemySkillId}.mcfunction`,
					),
					"utf-8",
				),
			).toContain("say roar");
			expect(
				await readFile(
					path.join(outputRoot, `data/maf/loot_table/treasure/${treasureId}.json`),
					"utf-8",
				),
			).toContain(`source_id:\\"${itemId}\\"`);
		} finally {
			process.env.ITEM_STATE_PATH = previousEnv.ITEM_STATE_PATH;
			process.env.GRIMOIRE_STATE_PATH = previousEnv.GRIMOIRE_STATE_PATH;
			process.env.SKILL_STATE_PATH = previousEnv.SKILL_STATE_PATH;
			process.env.ENEMY_SKILL_STATE_PATH = previousEnv.ENEMY_SKILL_STATE_PATH;
			process.env.ENEMY_STATE_PATH = previousEnv.ENEMY_STATE_PATH;
			process.env.TREASURE_STATE_PATH = previousEnv.TREASURE_STATE_PATH;
			process.env.EXPORT_SETTINGS_PATH = previousEnv.EXPORT_SETTINGS_PATH;
		}
	});
});
