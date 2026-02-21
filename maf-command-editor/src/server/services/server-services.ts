import { createItemStateRepository } from "~/server/repositories/item-state-repository";
import {
	createItemUsecase,
	type ItemUsecase,
} from "~/server/usecases/item-usecase";

export type ServerServices = {
	itemUsecase: ItemUsecase;
};

export function createServerServices(): ServerServices {
	const itemRepository = createItemStateRepository();
	const itemUsecase = createItemUsecase({ itemRepository });
	return { itemUsecase };
}
