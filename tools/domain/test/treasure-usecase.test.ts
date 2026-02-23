import { describe, expect, test } from "vitest";
import {
	createTreasureUsecase,
	type EnemyState,
	type GrimoireState,
	type ItemState,
	type TreasureState,
} from "../src/index.js";

function createMemoryRepositories(params?: {
	treasures?: TreasureState;
	items?: ItemState;
	grimoires?: GrimoireState;
	enemies?: EnemyState;
}) {
	let treasureState = params?.treasures ?? { entries: [] };
	let itemState = params?.items ?? { items: [] };
	let grimoireState = params?.grimoires ?? { entries: [] };
	let enemyState = params?.enemies ?? { entries: [] };

	return {
		treasureRepository: {
			async loadTreasureState() {
				return treasureState;
			},
			async saveTreasureState(next: TreasureState) {
				treasureState = next;
			},
		},
		itemRepository: {
			async loadItemState() {
				return itemState;
			},
			async saveItemState(next: ItemState) {
				itemState = next;
			},
		},
		grimoireRepository: {
			async loadGrimoireState() {
				return grimoireState;
			},
			async saveGrimoireState(next: GrimoireState) {
				grimoireState = next;
			},
		},
		enemyRepository: {
			async loadEnemyState() {
				return enemyState;
			},
			async saveEnemyState(next: EnemyState) {
				enemyState = next;
			},
		},
	};
}

describe("treasure usecase", () => {
	test("rejects missing loot reference", async () => {
		const memory = createMemoryRepositories();
		const usecase = createTreasureUsecase({
			treasureRepository: memory.treasureRepository,
			itemRepository: memory.itemRepository,
			grimoireRepository: memory.grimoireRepository,
			enemyRepository: memory.enemyRepository,
		});

		const result = await usecase.saveTreasure({
			id: "treasure-1",
			name: "Chest",
			lootPools: [{ kind: "item", refId: "missing-item", weight: 5 }],
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.fieldErrors.lootPools).toBeDefined();
	});

	test("rejects deletion while referenced by enemy", async () => {
		const memory = createMemoryRepositories({
			treasures: {
				entries: [
					{
						id: "treasure-1",
						name: "Chest",
						lootPools: [{ kind: "item", refId: "item-1", weight: 5 }],
						updatedAt: "2026-02-21T00:00:00.000Z",
					},
				],
			},
			enemies: {
				entries: [
					{
						id: "enemy-1",
						name: "Zombie",
						hp: 20,
						dropTableId: "treasure-1",
						enemySkillIds: [],
						spawnRule: {
							origin: { x: 0, y: 64, z: 0 },
							distance: { min: 0, max: 32 },
						},
						updatedAt: "2026-02-21T00:00:00.000Z",
					},
				],
			},
		});
		const usecase = createTreasureUsecase({
			treasureRepository: memory.treasureRepository,
			itemRepository: memory.itemRepository,
			grimoireRepository: memory.grimoireRepository,
			enemyRepository: memory.enemyRepository,
		});

		const result = await usecase.deleteTreasure("treasure-1");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.formError).toContain("referenced");
	});
});
