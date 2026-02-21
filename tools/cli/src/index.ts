#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { Command } from "commander";
import {
  createItemUsecase,
  createSpellbookUsecase,
  type ItemState,
  type SaveItemInput,
  type SaveSpellbookEntryInput,
  type SpellbookState
} from "@maf/domain";

async function loadJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function createMemoryItemRepository(initial: ItemState = { items: [] }) {
  let state = initial;
  return {
    async loadItemState() {
      return state;
    },
    async saveItemState(next: ItemState) {
      state = next;
    }
  };
}

function createMemorySpellbookRepository(initial: SpellbookState = { entries: [] }) {
  let state = initial;
  return {
    async loadSpellbookState() {
      return state;
    },
    async saveSpellbookState(next: SpellbookState) {
      state = next;
    }
  };
}

const program = new Command();
program.name("maf-cli").description("MAF domain utility CLI");

program
  .command("validate-item")
  .requiredOption("-f, --file <path>", "json file path for SaveItemInput")
  .action(async ({ file }: { file: string }) => {
    const input = await loadJson<SaveItemInput>(file);
    const usecase = createItemUsecase({ itemRepository: createMemoryItemRepository() });
    const result = await usecase.saveItem(input);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
  });

program
  .command("validate-spellbook")
  .requiredOption("-f, --file <path>", "json file path for SaveSpellbookEntryInput")
  .action(async ({ file }: { file: string }) => {
    const input = await loadJson<SaveSpellbookEntryInput>(file);
    const usecase = createSpellbookUsecase({
      spellbookRepository: createMemorySpellbookRepository()
    });
    const result = await usecase.saveSpellbookEntry(input);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
  });

program.parseAsync().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
