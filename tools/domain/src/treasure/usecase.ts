import * as v from "valibot";
import type {
	GrimoireStateRepository,
	ItemStateRepository,
	EnemyStateRepository,
	TreasureStateRepository,
} from "../shared/storage.js";
import { saveTreasureSchema } from "./schema.js";
import type {
	DeleteTreasureResult,
	SaveTreasureInput,
	SaveTreasureResult,
	TreasureFieldErrors,
	TreasureState,
} from "./types.js";

export interface TreasureUsecase {
	loadTreasures(): Promise<TreasureState>;
	saveTreasure(input: SaveTreasureInput): Promise<SaveTreasureResult>;
	deleteTreasure(id: string): Promise<DeleteTreasureResult>;
}

function toFieldErrors(
	nested: v.FlatErrors<typeof saveTreasureSchema>["nested"],
): TreasureFieldErrors {
	const fieldErrors: TreasureFieldErrors = {};
	if (!nested) {
		return fieldErrors;
	}

	if (nested.name?.[0]) fieldErrors.name = nested.name[0];
	if (nested.lootPools?.[0]) fieldErrors.lootPools = nested.lootPools[0];

	return fieldErrors;
}

export function createTreasureUsecase(deps: {
	treasureRepository: TreasureStateRepository;
	itemRepository: Pick<ItemStateRepository, "loadItemState">;
	grimoireRepository: Pick<GrimoireStateRepository, "loadGrimoireState">;
	enemyRepository: Pick<EnemyStateRepository, "loadEnemyState">;
	now?: () => Date;
}): TreasureUsecase {
	return {
		loadTreasures() {
			return deps.treasureRepository.loadTreasureState();
		},
		async saveTreasure(input: SaveTreasureInput): Promise<SaveTreasureResult> {
			const parsed = v.safeParse(saveTreasureSchema, input);
			if (!parsed.success) {
				const flat = v.flatten(parsed.issues);
				return {
					ok: false,
					fieldErrors: toFieldErrors(flat.nested),
					formError: "Validation failed. Fix the highlighted fields.",
				};
			}

			const [itemState, grimoireState] = await Promise.all([
				deps.itemRepository.loadItemState(),
				deps.grimoireRepository.loadGrimoireState(),
			]);
			const itemIdSet = new Set(itemState.items.map((item) => item.id));
			const grimoireIdSet = new Set(grimoireState.entries.map((entry) => entry.id));

			for (const pool of parsed.output.lootPools) {
				if (pool.kind === "item" && !itemIdSet.has(pool.refId)) {
					return {
						ok: false,
						fieldErrors: {
							lootPools: `Referenced item '${pool.refId}' does not exist.`,
						},
						formError: "Reference validation failed.",
					};
				}
				if (pool.kind === "grimoire" && !grimoireIdSet.has(pool.refId)) {
					return {
						ok: false,
						fieldErrors: {
							lootPools: `Referenced grimoire '${pool.refId}' does not exist.`,
						},
						formError: "Reference validation failed.",
					};
				}
			}

			const state = await deps.treasureRepository.loadTreasureState();
			const now = (deps.now ?? (() => new Date()))().toISOString();
			const nextEntry = {
				...parsed.output,
				updatedAt: now,
			};

			const currentIndex = state.entries.findIndex(
				(entry) => entry.id === nextEntry.id,
			);
			const mode: "created" | "updated" =
				currentIndex >= 0 ? "updated" : "created";
			const nextEntries = [...state.entries];
			if (currentIndex >= 0) {
				nextEntries[currentIndex] = nextEntry;
			} else {
				nextEntries.push(nextEntry);
			}

			await deps.treasureRepository.saveTreasureState({ entries: nextEntries });
			return { ok: true, treasure: nextEntry, mode };
		},
		async deleteTreasure(id: string): Promise<DeleteTreasureResult> {
			const trimmedId = id.trim();
			if (trimmedId.length === 0) {
				return { ok: false, formError: "Missing treasure id." };
			}

			const enemyState = await deps.enemyRepository.loadEnemyState();
			const referencedBy = enemyState.entries.find(
				(entry) => entry.dropTableId === trimmedId,
			);
			if (referencedBy) {
				return {
					ok: false,
					formError: `Treasure is referenced by enemy '${referencedBy.name}'.`,
				};
			}

			const state = await deps.treasureRepository.loadTreasureState();
			const nextEntries = state.entries.filter((entry) => entry.id !== trimmedId);
			if (nextEntries.length === state.entries.length) {
				return { ok: false, formError: "Treasure not found." };
			}

			await deps.treasureRepository.saveTreasureState({ entries: nextEntries });
			return { ok: true, deletedId: trimmedId };
		},
	};
}
