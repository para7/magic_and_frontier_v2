import * as v from "valibot";
import type {
	ItemStateRepository,
	SkillStateRepository,
} from "../shared/storage.js";
import { saveSkillSchema } from "./schema.js";
import type {
	DeleteSkillResult,
	SaveSkillInput,
	SaveSkillResult,
	SkillFieldErrors,
	SkillState,
} from "./types.js";

export interface SkillUsecase {
	loadSkills(): Promise<SkillState>;
	saveSkill(input: SaveSkillInput): Promise<SaveSkillResult>;
	deleteSkill(id: string): Promise<DeleteSkillResult>;
}

function toFieldErrors(
	nested: v.FlatErrors<typeof saveSkillSchema>["nested"],
): SkillFieldErrors {
	const fieldErrors: SkillFieldErrors = {};
	if (!nested) {
		return fieldErrors;
	}

	if (nested.name?.[0]) fieldErrors.name = nested.name[0];
	if (nested.script?.[0]) fieldErrors.script = nested.script[0];
	if (nested.itemId?.[0]) fieldErrors.itemId = nested.itemId[0];

	return fieldErrors;
}

export function createSkillUsecase(deps: {
	skillRepository: SkillStateRepository;
	itemRepository: Pick<ItemStateRepository, "loadItemState">;
	now?: () => Date;
}): SkillUsecase {
	return {
		loadSkills() {
			return deps.skillRepository.loadSkillState();
		},
		async saveSkill(input: SaveSkillInput): Promise<SaveSkillResult> {
			const parsed = v.safeParse(saveSkillSchema, input);
			if (!parsed.success) {
				const flat = v.flatten(parsed.issues);
				return {
					ok: false,
					fieldErrors: toFieldErrors(flat.nested),
					formError: "Validation failed. Fix the highlighted fields.",
				};
			}

			const itemState = await deps.itemRepository.loadItemState();
			const itemExists = itemState.items.some(
				(item) => item.id === parsed.output.itemId,
			);
			if (!itemExists) {
				return {
					ok: false,
					fieldErrors: { itemId: "Referenced item does not exist." },
					formError: "Reference validation failed.",
				};
			}

			const state = await deps.skillRepository.loadSkillState();
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

			await deps.skillRepository.saveSkillState({ entries: nextEntries });
			return { ok: true, skill: nextEntry, mode };
		},
		async deleteSkill(id: string): Promise<DeleteSkillResult> {
			const trimmedId = id.trim();
			if (trimmedId.length === 0) {
				return { ok: false, formError: "Missing skill id." };
			}

			const state = await deps.skillRepository.loadSkillState();
			const nextEntries = state.entries.filter(
				(entry) => entry.id !== trimmedId,
			);
			if (nextEntries.length === state.entries.length) {
				return { ok: false, formError: "Skill not found." };
			}

			await deps.skillRepository.saveSkillState({ entries: nextEntries });
			return { ok: true, deletedId: trimmedId };
		},
	};
}
