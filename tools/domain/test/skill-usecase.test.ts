import { describe, expect, test } from "vitest";
import {
	createSkillUsecase,
	type ItemState,
	type SkillState,
} from "../src/index.js";

function createMemoryRepositories(params?: {
	items?: ItemState;
	skills?: SkillState;
}) {
	let itemState = params?.items ?? { items: [] };
	let skillState = params?.skills ?? { entries: [] };

	return {
		itemRepository: {
			async loadItemState() {
				return itemState;
			},
			async saveItemState(next: ItemState) {
				itemState = next;
			},
		},
		skillRepository: {
			async loadSkillState() {
				return skillState;
			},
			async saveSkillState(next: SkillState) {
				skillState = next;
			},
		},
		getSkillState() {
			return skillState;
		},
	};
}

describe("skill usecase", () => {
	test("creates a skill when referenced item exists", async () => {
		const memory = createMemoryRepositories({
			items: {
				items: [
					{
						id: "item-1",
						itemId: "minecraft:stone",
						count: 1,
						customName: "",
						lore: "",
						enchantments: "",
						unbreakable: false,
						customModelData: "",
						customNbt: "",
						nbt: "{id:\"minecraft:stone\",Count:1b}",
						updatedAt: "2026-02-21T00:00:00.000Z",
					},
				],
			},
		});

		const usecase = createSkillUsecase({
			skillRepository: memory.skillRepository,
			itemRepository: memory.itemRepository,
			now: () => new Date("2026-02-21T00:00:00.000Z"),
		});

		const result = await usecase.saveSkill({
			id: "skill-1",
			name: "Slash",
			script: "say slash",
			itemId: "item-1",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.mode).toBe("created");
		expect(memory.getSkillState().entries).toHaveLength(1);
	});

	test("returns reference error when item does not exist", async () => {
		const memory = createMemoryRepositories();
		const usecase = createSkillUsecase({
			skillRepository: memory.skillRepository,
			itemRepository: memory.itemRepository,
		});

		const result = await usecase.saveSkill({
			id: "skill-1",
			name: "Slash",
			script: "say slash",
			itemId: "missing-item",
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.fieldErrors.itemId).toBeDefined();
	});
});
