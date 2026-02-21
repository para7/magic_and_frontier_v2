import { describe, expect, test } from "vitest";
import { createSpellbookUsecase, type SpellbookState } from "../src/index.js";

function createMemoryRepository(initial: SpellbookState = { entries: [] }) {
  let state = initial;

  return {
    repository: {
      async loadSpellbookState() {
        return state;
      },
      async saveSpellbookState(next: SpellbookState) {
        state = next;
      }
    },
    getState: () => state
  };
}

describe("spellbook usecase", () => {
  test("creates an entry", async () => {
    const memory = createMemoryRepository();
    const usecase = createSpellbookUsecase({
      spellbookRepository: memory.repository,
      now: () => new Date("2026-02-21T00:00:00.000Z")
    });

    const result = await usecase.saveSpellbookEntry({
      id: "entry-1",
      castid: 1,
      effectid: 10,
      cost: 30,
      cast: 15,
      title: "Heal",
      description: "Recover HP"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mode).toBe("created");
    expect(memory.getState().entries).toHaveLength(1);
    expect(memory.getState().entries[0]?.castid).toBe(1);
  });

  test("auto reassigns duplicated castid on save", async () => {
    const memory = createMemoryRepository();
    const usecase = createSpellbookUsecase({ spellbookRepository: memory.repository });

    await usecase.saveSpellbookEntry({
      id: "entry-1",
      castid: 5,
      effectid: 1,
      cost: 1,
      cast: 1,
      title: "A",
      description: "A"
    });

    const result = await usecase.saveSpellbookEntry({
      id: "entry-2",
      castid: 5,
      effectid: 2,
      cost: 2,
      cast: 2,
      title: "B",
      description: "B"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reassignments).toHaveLength(1);
    expect(result.reassignments[0]?.from).toBe(5);
    expect(result.reassignments[0]?.to).toBe(6);
    expect(memory.getState().entries.map((entry) => entry.castid)).toEqual([5, 6]);
  });
});
