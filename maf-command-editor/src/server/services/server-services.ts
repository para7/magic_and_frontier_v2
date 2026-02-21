import { loadAppConfig } from "~/server/config/app-config";
import { createSpellbookStateRepository } from "~/server/repositories/spellbook-state-repository";
import { createItemStateRepository } from "~/server/repositories/item-state-repository";
import {
	createSpellbookUsecase,
	type SpellbookUsecase,
} from "~/server/usecases/spellbook-usecase";
import {
	createItemUsecase,
	type ItemUsecase,
} from "~/server/usecases/item-usecase";

export type ServerServices = {
	itemUsecase: ItemUsecase;
	spellbookUsecase: SpellbookUsecase;
};

export async function createServerServices(): Promise<ServerServices> {
	const appConfig = await loadAppConfig();
	const itemRepository = createItemStateRepository(
		appConfig.storage.itemStatePath,
	);
	const spellbookRepository = createSpellbookStateRepository(
		appConfig.storage.spellbookStatePath,
	);
	const itemUsecase = createItemUsecase({ itemRepository });
	const spellbookUsecase = createSpellbookUsecase({ spellbookRepository });
	return { itemUsecase, spellbookUsecase };
}
