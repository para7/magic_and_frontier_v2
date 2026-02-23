import * as v from "valibot";
import type {
	GrimoireStateRepository,
	TreasureStateRepository,
} from "../shared/storage.js";
import { saveGrimoireEntrySchema } from "./schema.js";
import type {
	CastIdReassignment,
	DeleteGrimoireEntryResult,
	SaveGrimoireEntryInput,
	SaveGrimoireEntryResult,
	GrimoireEntry,
	GrimoireFieldErrors,
	GrimoireState,
} from "./types.js";

export interface GrimoireUsecase {
	loadGrimoire(): Promise<GrimoireState>;
	saveGrimoireEntry(
		input: SaveGrimoireEntryInput,
	): Promise<SaveGrimoireEntryResult>;
	deleteGrimoireEntry(id: string): Promise<DeleteGrimoireEntryResult>;
}

function toFieldErrors(
	nested: v.FlatErrors<typeof saveGrimoireEntrySchema>["nested"],
): GrimoireFieldErrors {
	const fieldErrors: GrimoireFieldErrors = {};
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

function sortByCastId(entries: GrimoireEntry[]): GrimoireEntry[] {
	return [...entries].sort((a, b) => a.castid - b.castid);
}

function resolveCastIdConflicts(entries: GrimoireEntry[]): {
	entries: GrimoireEntry[];
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

export function createGrimoireUsecase(deps: {
	grimoireRepository: GrimoireStateRepository;
	treasureRepository?: Pick<TreasureStateRepository, "loadTreasureState">;
	now?: () => Date;
}): GrimoireUsecase {
	return {
		loadGrimoire() {
			return deps.grimoireRepository.loadGrimoireState();
		},
		async saveGrimoireEntry(
			input: SaveGrimoireEntryInput,
		): Promise<SaveGrimoireEntryResult> {
			const parsed = v.safeParse(saveGrimoireEntrySchema, input);
			if (!parsed.success) {
				const flat = v.flatten(parsed.issues);
				return {
					ok: false,
					fieldErrors: toFieldErrors(flat.nested),
					formError: "Validation failed. Fix the highlighted fields.",
				};
			}

			const state = await deps.grimoireRepository.loadGrimoireState();
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
			await deps.grimoireRepository.saveGrimoireState({
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
		async deleteGrimoireEntry(
			id: string,
		): Promise<DeleteGrimoireEntryResult> {
			const trimmedId = id.trim();
			if (trimmedId.length === 0) {
				return { ok: false, formError: "Missing entry id." };
			}

			if (deps.treasureRepository) {
				const treasureState = await deps.treasureRepository.loadTreasureState();
				const referencedBy = treasureState.entries.find((entry) =>
					entry.lootPools.some(
						(pool) => pool.kind === "grimoire" && pool.refId === trimmedId,
					),
				);
				if (referencedBy) {
					return {
						ok: false,
						formError: `Entry is referenced by treasure '${referencedBy.name}'.`,
					};
				}
			}

			const state = await deps.grimoireRepository.loadGrimoireState();
			const nextEntries = state.entries.filter(
				(entry) => entry.id !== trimmedId,
			);
			if (nextEntries.length === state.entries.length) {
				return { ok: false, formError: "Entry not found." };
			}

			await deps.grimoireRepository.saveGrimoireState({
				entries: sortByCastId(nextEntries),
			});
			return { ok: true, deletedId: trimmedId };
		},
	};
}
