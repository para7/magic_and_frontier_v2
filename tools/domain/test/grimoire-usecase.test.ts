import { describe, expect, test } from "vitest";
import { createGrimoireUsecase, type GrimoireState } from "../src/index.js";

function createMemoryRepository(initial: GrimoireState = { entries: [] }) {
  let state = initial;

  return {
    repository: {
      async loadGrimoireState() {
        return state;
      },
      async saveGrimoireState(next: GrimoireState) {
        state = next;
      }
    },
    getState: () => state
  };
}

describe("grimoire usecase", () => {
  test("creates an entry", async () => {
    const memory = createMemoryRepository();
    const usecase = createGrimoireUsecase({
      grimoireRepository: memory.repository,
      now: () => new Date("2026-02-21T00:00:00.000Z")
    });

    const result = await usecase.saveGrimoireEntry({
      id: "entry-1",
      castid: 1,
      script: "function maf:spell/heal",
      title: "Heal",
      description: "Recover HP",
      variants: [{ cast: 15, cost: 30 }]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mode).toBe("created");
    expect(memory.getState().entries).toHaveLength(1);
    expect(memory.getState().entries[0]?.castid).toBe(1);
    expect(memory.getState().entries[0]?.variants).toEqual([{ cast: 15, cost: 30 }]);
  });

  test("rejects duplicated castid on save", async () => {
    const memory = createMemoryRepository();
    const usecase = createGrimoireUsecase({ grimoireRepository: memory.repository });

    await usecase.saveGrimoireEntry({
      id: "entry-1",
      castid: 5,
      script: "say a",
      title: "A",
      description: "A",
      variants: [{ cast: 1, cost: 1 }]
    });

    const result = await usecase.saveGrimoireEntry({
      id: "entry-2",
      castid: 5,
      script: "say b",
      title: "B",
      description: "B",
      variants: [{ cast: 2, cost: 2 }]
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.castid).toContain("already used");
    expect(memory.getState().entries.map((entry) => entry.castid)).toEqual([5]);
  });

  test("returns warning when castid is changed by edit", async () => {
    const memory = createMemoryRepository({
      entries: [
        {
          id: "entry-1",
          castid: 5,
          script: "say a",
          title: "A",
          description: "A",
          variants: [{ cast: 1, cost: 1 }],
          updatedAt: "2026-02-21T00:00:00.000Z"
        }
      ]
    });
    const usecase = createGrimoireUsecase({
      grimoireRepository: memory.repository,
      now: () => new Date("2026-02-22T00:00:00.000Z")
    });

    const result = await usecase.saveGrimoireEntry({
      id: "entry-1",
      castid: 15,
      script: "say a2",
      title: "A",
      description: "AA",
      variants: [{ cast: 2, cost: 2 }]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings?.castidChanged?.from).toBe(5);
    expect(result.warnings?.castidChanged?.to).toBe(15);
    expect(memory.getState().entries[0]?.castid).toBe(15);
  });
});
