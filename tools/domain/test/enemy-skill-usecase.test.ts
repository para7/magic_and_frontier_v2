import { describe, expect, test } from "vitest";
import {
	createEnemySkillUsecase,
	type EnemySkillState,
	type EnemyState,
} from "../src/index.js";

function createMemoryRepositories(params?: {
	enemySkills?: EnemySkillState;
	enemies?: EnemyState;
}) {
	let enemySkillState = params?.enemySkills ?? { entries: [] };
	let enemyState = params?.enemies ?? { entries: [] };

	return {
		enemySkillRepository: {
			async loadEnemySkillState() {
				return enemySkillState;
			},
			async saveEnemySkillState(next: EnemySkillState) {
				enemySkillState = next;
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
		getEnemySkillState() {
			return enemySkillState;
		},
	};
}

describe("enemy skill usecase", () => {
	test("deletion is rejected when enemy references the skill", async () => {
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
			enemies: {
				entries: [
					{
						id: "enemy-1",
						name: "Zombie King",
						hp: 100,
						dropTableId: "treasure-1",
						enemySkillIds: ["eskill-1"],
						spawnRule: {
							origin: { x: 0, y: 64, z: 0 },
							distance: { min: 0, max: 32 },
						},
						updatedAt: "2026-02-21T00:00:00.000Z",
					},
				],
			},
		});
		const usecase = createEnemySkillUsecase({
			enemySkillRepository: memory.enemySkillRepository,
			enemyRepository: memory.enemyRepository,
		});

		const result = await usecase.deleteEnemySkill("eskill-1");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.formError).toContain("referenced");
	});

	test("creates enemy skill", async () => {
		const memory = createMemoryRepositories();
		const usecase = createEnemySkillUsecase({
			enemySkillRepository: memory.enemySkillRepository,
			enemyRepository: memory.enemyRepository,
			now: () => new Date("2026-02-21T00:00:00.000Z"),
		});

		const result = await usecase.saveEnemySkill({
			id: "eskill-1",
			name: "Roar",
			script: "say roar",
			cooldown: 10,
			trigger: "on_spawn",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(memory.getEnemySkillState().entries).toHaveLength(1);
	});
});
