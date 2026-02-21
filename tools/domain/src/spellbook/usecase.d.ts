import type { SpellbookStateRepository } from "../shared/storage.js";
import type { DeleteSpellbookEntryResult, SaveSpellbookEntryInput, SaveSpellbookEntryResult, SpellbookState } from "./types.js";
export interface SpellbookUsecase {
    loadSpellbook(): Promise<SpellbookState>;
    saveSpellbookEntry(input: SaveSpellbookEntryInput): Promise<SaveSpellbookEntryResult>;
    deleteSpellbookEntry(id: string): Promise<DeleteSpellbookEntryResult>;
}
export declare function createSpellbookUsecase(deps: {
    spellbookRepository: SpellbookStateRepository;
    now?: () => Date;
}): SpellbookUsecase;
//# sourceMappingURL=usecase.d.ts.map