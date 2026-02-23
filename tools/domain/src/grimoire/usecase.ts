import * as v from "valibot";
import type {
	GrimoireStateRepository,
	TreasureStateRepository,
} from "../shared/storage.js";
import { saveGrimoireEntrySchema } from "./schema.js";
import type {
	DeleteGrimoireEntryResult,
	GrimoireEntry,
	GrimoireFieldErrors,
	GrimoireState,
	SaveGrimoireEntryInput,
	SaveGrimoireEntryResult,
} from "./types.js";

export interface GrimoireUsecase {
	loadGrimoire(): Promise<GrimoireState>;
	saveGrimoireEntry(
		input: SaveGrimoireEntryInput,
	): Promise<SaveGrimoireEntryResult>;
	deleteGrimoireEntry(id: string): Promise<DeleteGrimoireEntryResult>;
}

function toFieldErrors(issues: v.BaseIssue<unknown>[]): GrimoireFieldErrors {
	const fieldErrors: GrimoireFieldErrors = {};
	if (!issues || issues.length === 0) {
		return fieldErrors;
	}

	for (const issue of issues) {
		const path = issue.path?.map((segment) => String(segment.key)).join(".");
		if (!path) {
			continue;
		}

		if (
			path === "castid" ||
			path === "script" ||
			path === "title" ||
			path === "description" ||
			path === "variants"
		) {
			fieldErrors[path] = issue.message;
			continue;
		}

		if (/^variants\.\d+\.(cast|cost)$/.test(path)) {
			fieldErrors[path as `variants.${number}.cast` | `variants.${number}.cost`] =
				issue.message;
			continue;
		}

		if (path.startsWith("variants.")) {
			fieldErrors.variants = issue.message;
		}
	}

	return fieldErrors;
}

function sortByCastId(entries: GrimoireEntry[]): GrimoireEntry[] {
	return [...entries].sort((a, b) => a.castid - b.castid || a.id.localeCompare(b.id));
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
			return {
				ok: false,
				fieldErrors: toFieldErrors(parsed.issues),
				formError: "Validation failed. Fix the highlighted fields.",
			};
		}

			const state = await deps.grimoireRepository.loadGrimoireState();
			const now = (deps.now ?? (() => new Date()))().toISOString();
			const current = state.entries.find((entry) => entry.id === parsed.output.id);
			const duplicatedCastid = state.entries.find(
				(entry) =>
					entry.id !== parsed.output.id && entry.castid === parsed.output.castid,
			);
			if (duplicatedCastid) {
				return {
					ok: false,
					fieldErrors: {
						castid: `castid ${parsed.output.castid} is already used by '${duplicatedCastid.title || duplicatedCastid.id}'.`,
					},
					formError: "castid must be unique.",
				};
			}

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

			const resolvedEntries = sortByCastId(mutableEntries);
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
				warnings:
					current && current.castid !== saved.castid
						? {
								castidChanged: {
									from: current.castid,
									to: saved.castid,
								},
							}
						: undefined,
			};
		},
		async deleteGrimoireEntry(id: string): Promise<DeleteGrimoireEntryResult> {
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
