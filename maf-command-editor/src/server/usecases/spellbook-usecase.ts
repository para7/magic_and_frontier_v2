import * as v from "valibot";
import type { SpellbookEntry, SpellbookState } from "~/server/domain/spellbook-types";
import type { SpellbookStateRepository } from "~/server/repositories/spellbook-state-repository";

export type SpellbookFieldErrors = Partial<
	Record<
		"castid" | "effectid" | "cost" | "cast" | "title" | "description",
		string
	>
>;

export type CastIdReassignment = {
	id: string;
	title: string;
	from: number;
	to: number;
};

export type SaveSpellbookEntryInput = {
	id: string;
	castid: number;
	effectid: number;
	cost: number;
	cast: number;
	title: string;
	description: string;
};

export type SaveSpellbookEntryResult =
	| {
			ok: true;
			entry: SpellbookEntry;
			mode: "created" | "updated";
			reassignments: CastIdReassignment[];
	  }
	| {
			ok: false;
			fieldErrors: SpellbookFieldErrors;
			formError?: string;
	  };

export type DeleteSpellbookEntryResult =
	| {
			ok: true;
			deletedId: string;
	  }
	| {
			ok: false;
			formError: string;
	  };

export interface SpellbookUsecase {
	loadSpellbook(): Promise<SpellbookState>;
	saveSpellbookEntry(
		input: SaveSpellbookEntryInput,
	): Promise<SaveSpellbookEntryResult>;
	deleteSpellbookEntry(id: string): Promise<DeleteSpellbookEntryResult>;
}

const saveSpellbookEntrySchema = v.object({
	id: v.pipe(v.string(), v.trim(), v.minLength(1, "Entry id is required.")),
	castid: v.pipe(
		v.number(),
		v.integer("castid must be an integer."),
		v.minValue(0, "castid must be 0 or greater."),
	),
	effectid: v.pipe(
		v.number(),
		v.integer("effectid must be an integer."),
		v.minValue(0, "effectid must be 0 or greater."),
	),
	cost: v.pipe(
		v.number(),
		v.integer("cost must be an integer."),
		v.minValue(0, "cost must be 0 or greater."),
	),
	cast: v.pipe(
		v.number(),
		v.integer("cast must be an integer."),
		v.minValue(0, "cast must be 0 or greater."),
	),
	title: v.pipe(v.string(), v.maxLength(200, "title must be 200 characters or fewer.")),
	description: v.pipe(
		v.string(),
		v.maxLength(2000, "description must be 2000 characters or fewer."),
	),
});

function toFieldErrors(
	nested: v.FlatErrors<typeof saveSpellbookEntrySchema>["nested"],
): SpellbookFieldErrors {
	const fieldErrors: SpellbookFieldErrors = {};
	if (!nested) {
		return fieldErrors;
	}

	if (nested.castid?.[0]) {
		fieldErrors.castid = nested.castid[0];
	}
	if (nested.effectid?.[0]) {
		fieldErrors.effectid = nested.effectid[0];
	}
	if (nested.cost?.[0]) {
		fieldErrors.cost = nested.cost[0];
	}
	if (nested.cast?.[0]) {
		fieldErrors.cast = nested.cast[0];
	}
	if (nested.title?.[0]) {
		fieldErrors.title = nested.title[0];
	}
	if (nested.description?.[0]) {
		fieldErrors.description = nested.description[0];
	}
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
			const nextEntry: SpellbookEntry = {
				...parsed.output,
				updatedAt: now,
			};

			const currentIndex = state.entries.findIndex(
				(entry) => entry.id === nextEntry.id,
			);
			const mode: "created" | "updated" = currentIndex >= 0 ? "updated" : "created";
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
		async deleteSpellbookEntry(id: string): Promise<DeleteSpellbookEntryResult> {
			const trimmedId = id.trim();
			if (trimmedId.length === 0) {
				return { ok: false, formError: "Missing entry id." };
			}

			const state = await deps.spellbookRepository.loadSpellbookState();
			const nextEntries = state.entries.filter((entry) => entry.id !== trimmedId);
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
