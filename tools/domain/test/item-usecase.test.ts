import { describe, expect, test } from "vitest";
import { createItemUsecase, type ItemState } from "../src/index.js";

function createMemoryRepository(initial: ItemState = { items: [] }) {
  let state = initial;

  return {
    repository: {
      async loadItemState() {
        return state;
      },
      async saveItemState(next: ItemState) {
        state = next;
      }
    },
    getState: () => state
  };
}

describe("item usecase", () => {
  test("creates item", async () => {
    const memory = createMemoryRepository();
    const usecase = createItemUsecase({ itemRepository: memory.repository });

    const result = await usecase.saveItem({
      id: "item-1",
      itemId: "minecraft:stone",
      count: 1,
      customName: "",
      lore: "",
      enchantments: "",
      unbreakable: false,
      customModelData: "",
      customNbt: ""
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mode).toBe("created");
    expect(memory.getState().items).toHaveLength(1);
  });

  test("returns validation error", async () => {
    const memory = createMemoryRepository();
    const usecase = createItemUsecase({ itemRepository: memory.repository });

    const result = await usecase.saveItem({
      id: "item-1",
      itemId: "",
      count: Number.NaN,
      customName: "",
      lore: "",
      enchantments: "",
      unbreakable: false,
      customModelData: "",
      customNbt: ""
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.itemId).toBeDefined();
  });
});
