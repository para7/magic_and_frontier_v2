import * as v from "valibot";
import type {
	EnemySkillStateRepository,
	EnemyStateRepository,
} from "../shared/storage.js";
import { saveEnemySkillSchema } from "./schema.js";
import type {
	DeleteEnemySkillResult,
	EnemySkillFieldErrors,
	EnemySkillState,
	SaveEnemySkillInput,
	SaveEnemySkillResult,
} from "./types.js";

export interface EnemySkillUsecase {
	loadEnemySkills(): Promise<EnemySkillState>;
	saveEnemySkill(input: SaveEnemySkillInput): Promise<SaveEnemySkillResult>;
	deleteEnemySkill(id: string): Promise<DeleteEnemySkillResult>;
}

function toFieldErrors(
	nested: v.FlatErrors<typeof saveEnemySkillSchema>["nested"],
): EnemySkillFieldErrors {
	const fieldErrors: EnemySkillFieldErrors = {};
	if (!nested) {
		return fieldErrors;
	}

	if (nested.name?.[0]) fieldErrors.name = nested.name[0];
	if (nested.script?.[0]) fieldErrors.script = nested.script[0];
	if (nested.cooldown?.[0]) fieldErrors.cooldown = nested.cooldown[0];
	if (nested.trigger?.[0]) fieldErrors.trigger = nested.trigger[0];

	return fieldErrors;
}

export function createEnemySkillUsecase(deps: {
	enemySkillRepository: EnemySkillStateRepository;
	enemyRepository: Pick<EnemyStateRepository, "loadEnemyState">;
	now?: () => Date;
}): EnemySkillUsecase {
	return {
		loadEnemySkills() {
			return deps.enemySkillRepository.loadEnemySkillState();
		},
		async saveEnemySkill(
			input: SaveEnemySkillInput,
		): Promise<SaveEnemySkillResult> {
			const parsed = v.safeParse(saveEnemySkillSchema, input);
			if (!parsed.success) {
				const flat = v.flatten(parsed.issues);
				return {
					ok: false,
					fieldErrors: toFieldErrors(flat.nested),
					formError: "Validation failed. Fix the highlighted fields.",
				};
			}

			const state = await deps.enemySkillRepository.loadEnemySkillState();
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

			await deps.enemySkillRepository.saveEnemySkillState({
				entries: nextEntries,
			});
			return { ok: true, enemySkill: nextEntry, mode };
		},
		async deleteEnemySkill(id: string): Promise<DeleteEnemySkillResult> {
			const trimmedId = id.trim();
			if (trimmedId.length === 0) {
				return { ok: false, formError: "Missing enemy skill id." };
			}

			const enemyState = await deps.enemyRepository.loadEnemyState();
			const referencedBy = enemyState.entries.find((enemy) =>
				enemy.enemySkillIds.includes(trimmedId),
			);
			if (referencedBy) {
				return {
					ok: false,
					formError: `Enemy skill is referenced by enemy '${referencedBy.name}'.`,
				};
			}

			const state = await deps.enemySkillRepository.loadEnemySkillState();
			const nextEntries = state.entries.filter(
				(entry) => entry.id !== trimmedId,
			);
			if (nextEntries.length === state.entries.length) {
				return { ok: false, formError: "Enemy skill not found." };
			}

			await deps.enemySkillRepository.saveEnemySkillState({
				entries: nextEntries,
			});
			return { ok: true, deletedId: trimmedId };
		},
	};
}
