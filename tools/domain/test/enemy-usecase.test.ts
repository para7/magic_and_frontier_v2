import { describe, expect, test } from "vitest";
import {
	createEnemyUsecase,
	type EnemySkillState,
	type EnemyState,
	type TreasureState,
} from "../src/index.js";

function createMemoryRepositories(params?: {
	enemies?: EnemyState;
	enemySkills?: EnemySkillState;
	treasures?: TreasureState;
}) {
	let enemyState = params?.enemies ?? { entries: [] };
	let enemySkillState = params?.enemySkills ?? { entries: [] };
	let treasureState = params?.treasures ?? { entries: [] };

	return {
		enemyRepository: {
			async loadEnemyState() {
				return enemyState;
			},
			async saveEnemyState(next: EnemyState) {
				enemyState = next;
			},
		},
		enemySkillRepository: {
			async loadEnemySkillState() {
				return enemySkillState;
			},
			async saveEnemySkillState(next: EnemySkillState) {
				enemySkillState = next;
			},
		},
		treasureRepository: {
			async loadTreasureState() {
				return treasureState;
			},
			async saveTreasureState(next: TreasureState) {
				treasureState = next;
			},
		},
		getEnemyState() {
			return enemyState;
		},
	};
}

describe("enemy usecase", () => {
	test("rejects unknown enemy skill references", async () => {
		const memory = createMemoryRepositories({
			treasures: {
				entries: [
					{
						id: "treasure-1",
						name: "Drops",
						lootPools: [{ kind: "item", refId: "item-1", weight: 1 }],
						updatedAt: "2026-02-21T00:00:00.000Z",
					},
				],
			},
		});
		const usecase = createEnemyUsecase({
			enemyRepository: memory.enemyRepository,
			enemySkillRepository: memory.enemySkillRepository,
			treasureRepository: memory.treasureRepository,
		});

		const result = await usecase.saveEnemy({
			id: "enemy-1",
			name: "Zombie",
			hp: 20,
			dropTableId: "treasure-1",
			enemySkillIds: ["missing-skill"],
			spawnRule: {
				origin: { x: 0, y: 64, z: 0 },
				distance: { min: 0, max: 32 },
			},
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.fieldErrors.enemySkillIds).toBeDefined();
	});

	test("creates enemy and deduplicates enemySkillIds", async () => {
		const memory = createMemoryRepositories({
			enemySkills: {
				entries: [
					{
						id: "eskill-1",
						name: "Roar",
						script: "say roar",
						updatedAt: "2026-02-21T00:00:00.000Z",
					},
				],
			},
			treasures: {
				entries: [
					{
						id: "treasure-1",
						name: "Drops",
						lootPools: [{ kind: "item", refId: "item-1", weight: 1 }],
						updatedAt: "2026-02-21T00:00:00.000Z",
					},
				],
			},
		});
		const usecase = createEnemyUsecase({
			enemyRepository: memory.enemyRepository,
			enemySkillRepository: memory.enemySkillRepository,
			treasureRepository: memory.treasureRepository,
			now: () => new Date("2026-02-21T00:00:00.000Z"),
		});

		const result = await usecase.saveEnemy({
			id: "enemy-1",
			name: "Zombie",
			hp: 20,
			dropTableId: "treasure-1",
			enemySkillIds: ["eskill-1", "eskill-1"],
			spawnRule: {
				origin: { x: 0, y: 64, z: 0 },
				distance: { min: 0, max: 32 },
			},
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(memory.getEnemyState().entries[0]?.enemySkillIds).toEqual(["eskill-1"]);
	});
});
