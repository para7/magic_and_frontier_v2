import * as v from "valibot";
import type {
	EnemySkillStateRepository,
	EnemyStateRepository,
	TreasureStateRepository,
} from "../shared/storage.js";
import { saveEnemySchema } from "./schema.js";
import type {
	DeleteEnemyResult,
	EnemyFieldErrors,
	EnemyState,
	SaveEnemyInput,
	SaveEnemyResult,
} from "./types.js";

export interface EnemyUsecase {
	loadEnemies(): Promise<EnemyState>;
	saveEnemy(input: SaveEnemyInput): Promise<SaveEnemyResult>;
	deleteEnemy(id: string): Promise<DeleteEnemyResult>;
}

function toFieldErrors(
	nested: v.FlatErrors<typeof saveEnemySchema>["nested"],
): EnemyFieldErrors {
	const fieldErrors: EnemyFieldErrors = {};
	if (!nested) {
		return fieldErrors;
	}

	if (nested.name?.[0]) fieldErrors.name = nested.name[0];
	if (nested.hp?.[0]) fieldErrors.hp = nested.hp[0];
	if (nested.attack?.[0]) fieldErrors.attack = nested.attack[0];
	if (nested.defense?.[0]) fieldErrors.defense = nested.defense[0];
	if (nested.moveSpeed?.[0]) fieldErrors.moveSpeed = nested.moveSpeed[0];
	if (nested.dropTableId?.[0]) fieldErrors.dropTableId = nested.dropTableId[0];
	if (nested.enemySkillIds?.[0]) fieldErrors.enemySkillIds = nested.enemySkillIds[0];
	if (nested.spawnRule?.[0]) fieldErrors.spawnRule = nested.spawnRule[0];

	return fieldErrors;
}

function dedupeEnemySkillIds(ids: string[]): string[] {
	const seen = new Set<string>();
	const deduped: string[] = [];
	for (const rawId of ids) {
		const id = rawId.trim();
		if (id.length === 0 || seen.has(id)) {
			continue;
		}
		seen.add(id);
		deduped.push(id);
	}
	return deduped;
}

export function createEnemyUsecase(deps: {
	enemyRepository: EnemyStateRepository;
	enemySkillRepository: Pick<EnemySkillStateRepository, "loadEnemySkillState">;
	treasureRepository: Pick<TreasureStateRepository, "loadTreasureState">;
	now?: () => Date;
}): EnemyUsecase {
	return {
		loadEnemies() {
			return deps.enemyRepository.loadEnemyState();
		},
		async saveEnemy(input: SaveEnemyInput): Promise<SaveEnemyResult> {
			const parsed = v.safeParse(saveEnemySchema, input);
			if (!parsed.success) {
				const flat = v.flatten(parsed.issues);
				return {
					ok: false,
					fieldErrors: toFieldErrors(flat.nested),
					formError: "Validation failed. Fix the highlighted fields.",
				};
			}

			const enemySkillIds = dedupeEnemySkillIds(parsed.output.enemySkillIds);

			const enemySkillState = await deps.enemySkillRepository.loadEnemySkillState();
			const enemySkillIdSet = new Set(enemySkillState.entries.map((entry) => entry.id));
			const missingEnemySkillId = enemySkillIds.find(
				(id) => !enemySkillIdSet.has(id),
			);
			if (missingEnemySkillId) {
				return {
					ok: false,
					fieldErrors: {
						enemySkillIds: `Referenced enemy skill '${missingEnemySkillId}' does not exist.`,
					},
					formError: "Reference validation failed.",
				};
			}

			const treasureState = await deps.treasureRepository.loadTreasureState();
			const dropTableExists = treasureState.entries.some(
				(entry) => entry.id === parsed.output.dropTableId,
			);
			if (!dropTableExists) {
				return {
					ok: false,
					fieldErrors: { dropTableId: "Referenced drop table does not exist." },
					formError: "Reference validation failed.",
				};
			}

			const state = await deps.enemyRepository.loadEnemyState();
			const now = (deps.now ?? (() => new Date()))().toISOString();
			const nextEntry = {
				...parsed.output,
				enemySkillIds,
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

			await deps.enemyRepository.saveEnemyState({ entries: nextEntries });
			return { ok: true, enemy: nextEntry, mode };
		},
		async deleteEnemy(id: string): Promise<DeleteEnemyResult> {
			const trimmedId = id.trim();
			if (trimmedId.length === 0) {
				return { ok: false, formError: "Missing enemy id." };
			}

			const state = await deps.enemyRepository.loadEnemyState();
			const nextEntries = state.entries.filter((entry) => entry.id !== trimmedId);
			if (nextEntries.length === state.entries.length) {
				return { ok: false, formError: "Enemy not found." };
			}

			await deps.enemyRepository.saveEnemyState({ entries: nextEntries });
			return { ok: true, deletedId: trimmedId };
		},
	};
}
