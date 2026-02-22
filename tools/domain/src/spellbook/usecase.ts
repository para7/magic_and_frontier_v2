import * as v from "valibot";
import type { SpellbookStateRepository } from "../shared/storage.js";
import { saveSpellbookEntrySchema } from "./schema.js";
import type {
	CastIdReassignment,
	DeleteSpellbookEntryResult,
	SaveSpellbookEntryInput,
	SaveSpellbookEntryResult,
	SpellbookEntry,
	SpellbookFieldErrors,
	SpellbookState,
} from "./types.js";

export interface SpellbookUsecase {
	loadSpellbook(): Promise<SpellbookState>;
	saveSpellbookEntry(
		input: SaveSpellbookEntryInput,
	): Promise<SaveSpellbookEntryResult>;
	deleteSpellbookEntry(id: string): Promise<DeleteSpellbookEntryResult>;
}

function toFieldErrors(
	nested: v.FlatErrors<typeof saveSpellbookEntrySchema>["nested"],
): SpellbookFieldErrors {
	const fieldErrors: SpellbookFieldErrors = {};
	if (!nested) {
		return fieldErrors;
	}

	if (nested.castid?.[0]) fieldErrors.castid = nested.castid[0];
	if (nested.effectid?.[0]) fieldErrors.effectid = nested.effectid[0];
	if (nested.cost?.[0]) fieldErrors.cost = nested.cost[0];
	if (nested.cast?.[0]) fieldErrors.cast = nested.cast[0];
	if (nested.title?.[0]) fieldErrors.title = nested.title[0];
	if (nested.description?.[0]) fieldErrors.description = nested.description[0];

	return fieldErrors;
}

function sortByCastId(entries: SpellbookEntry[]): SpellbookEntry[] {
	return [...entries].sort((a, b) => a.castid - b.castid);
}

function resolveCastIdConflicts(entries: SpellbookEntry[]): {
	entries: SpellbookEntry[];
	reassignments: CastIdReassignment[];
} {
	const usedCastIds = new Set<number>();
	let maxCastId = entries.reduce(
		(currentMax, entry) => Math.max(currentMax, entry.castid),
		0,
	);

	const reassignments: CastIdReassignment[] = [];
	const resolved = entries.map((entry) => {
		const originalCastId = entry.castid;
		let nextCastId = originalCastId;

		if (usedCastIds.has(nextCastId)) {
			do {
				maxCastId += 1;
				nextCastId = maxCastId;
			} while (usedCastIds.has(nextCastId));
		}

		usedCastIds.add(nextCastId);

		if (nextCastId !== originalCastId) {
			reassignments.push({
				id: entry.id,
				title: entry.title,
				from: originalCastId,
				to: nextCastId,
			});
		}

		return {
			...entry,
			castid: nextCastId,
		};
	});

	return {
		entries: sortByCastId(resolved),
		reassignments,
	};
}

export function createSpellbookUsecase(deps: {
	spellbookRepository: SpellbookStateRepository;
	now?: () => Date;
}): SpellbookUsecase {
	return {
		loadSpellbook() {
			return deps.spellbookRepository.loadSpellbookState();
		},
		async saveSpellbookEntry(
			input: SaveSpellbookEntryInput,
		): Promise<SaveSpellbookEntryResult> {
			const parsed = v.safeParse(saveSpellbookEntrySchema, input);
			if (!parsed.success) {
				const flat = v.flatten(parsed.issues);
				return {
					ok: false,
					fieldErrors: toFieldErrors(flat.nested),
					formError: "Validation failed. Fix the highlighted fields.",
				};
			}

			const state = await deps.spellbookRepository.loadSpellbookState();
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
			const mutableEntries = [...state.entries];
			if (currentIndex >= 0) {
				mutableEntries[currentIndex] = nextEntry;
			} else {
				mutableEntries.push(nextEntry);
			}

			const { entries: resolvedEntries, reassignments } =
				resolveCastIdConflicts(mutableEntries);
			await deps.spellbookRepository.saveSpellbookState({
				entries: resolvedEntries,
			});

			const saved = resolvedEntries.find((entry) => entry.id === nextEntry.id);
			if (!saved) {
				return {
					ok: false,
					fieldErrors: {},
					formError: "Failed to save entry.",
				};
			}

			return {
				ok: true,
				entry: saved,
				mode,
				reassignments,
			};
		},
		async deleteSpellbookEntry(
			id: string,
		): Promise<DeleteSpellbookEntryResult> {
			const trimmedId = id.trim();
			if (trimmedId.length === 0) {
				return { ok: false, formError: "Missing entry id." };
			}

			const state = await deps.spellbookRepository.loadSpellbookState();
			const nextEntries = state.entries.filter(
				(entry) => entry.id !== trimmedId,
			);
			if (nextEntries.length === state.entries.length) {
				return { ok: false, formError: "Entry not found." };
			}

			await deps.spellbookRepository.saveSpellbookState({
				entries: sortByCastId(nextEntries),
			});
			return { ok: true, deletedId: trimmedId };
		},
	};
}
