import { Title } from "@solidjs/meta";
import {
	action,
	createAsync,
	query,
	revalidate,
	useSubmission,
} from "@solidjs/router";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import type { SpellbookEntry } from "~/server/domain/spellbook-types";
import { createServerServices } from "~/server/services/server-services";
import type {
	CastIdReassignment,
	DeleteSpellbookEntryResult,
	SaveSpellbookEntryInput,
	SaveSpellbookEntryResult,
	SpellbookFieldErrors,
} from "~/server/usecases/spellbook-usecase";

type EditableFields = {
	id: string;
	castid: string;
	effectid: string;
	cost: string;
	cast: string;
	title: string;
	description: string;
};

const loadSpellbookState = query(async () => {
	"use server";
	const { spellbookUsecase } = await createServerServices();
	return spellbookUsecase.loadSpellbook();
}, "load-spellbook-state");

const saveSpellbookEntry = action(
	async (formData: FormData): Promise<SaveSpellbookEntryResult> => {
		"use server";
		const castid = Number.parseInt(String(formData.get("castid") ?? ""), 10);
		const effectid = Number.parseInt(String(formData.get("effectid") ?? ""), 10);
		const cost = Number.parseInt(String(formData.get("cost") ?? ""), 10);
		const cast = Number.parseInt(String(formData.get("cast") ?? ""), 10);

		const input: SaveSpellbookEntryInput = {
			id: String(formData.get("id") ?? ""),
			castid: Number.isInteger(castid) ? castid : Number.NaN,
			effectid: Number.isInteger(effectid) ? effectid : Number.NaN,
			cost: Number.isInteger(cost) ? cost : Number.NaN,
			cast: Number.isInteger(cast) ? cast : Number.NaN,
			title: String(formData.get("title") ?? ""),
			description: String(formData.get("description") ?? ""),
		};

		const { spellbookUsecase } = await createServerServices();
		const result = await spellbookUsecase.saveSpellbookEntry(input);
		if (result.ok) {
			await revalidate(loadSpellbookState.key);
		}
		return result;
	},
	"save-spellbook-entry",
);

const deleteSpellbookEntry = action(
	async (formData: FormData): Promise<DeleteSpellbookEntryResult> => {
		"use server";
		const { spellbookUsecase } = await createServerServices();
		const result = await spellbookUsecase.deleteSpellbookEntry(
			String(formData.get("id") ?? ""),
		);
		if (result.ok) {
			await revalidate(loadSpellbookState.key);
		}
		return result;
	},
	"delete-spellbook-entry",
);

function formatReassignments(reassignments: CastIdReassignment[]): string {
	if (reassignments.length === 0) {
		return "";
	}

	return reassignments
		.map((entry) => `${entry.from} -> ${entry.to} (${entry.title || "untitled"})`)
		.join(", ");
}

export default function SpellbookRoute() {
	let editorDialog: HTMLDialogElement | undefined;

	const spellbookState = createAsync(() => loadSpellbookState());
	const saveSubmission = useSubmission(saveSpellbookEntry);
	const deleteSubmission = useSubmission(deleteSpellbookEntry);

	const [isEditing, setIsEditing] = createSignal(false);
	const [lastSubmittedId, setLastSubmittedId] = createSignal("");
	const [activeDeleteId, setActiveDeleteId] = createSignal("");
	const [draft, setDraft] = createSignal<EditableFields>({
		id: "",
		castid: "0",
		effectid: "0",
		cost: "0",
		cast: "0",
		title: "",
		description: "",
	});

	const saveResult = () => saveSubmission.result as SaveSpellbookEntryResult | undefined;
	const deleteResult = () =>
		deleteSubmission.result as DeleteSpellbookEntryResult | undefined;

	const saveSuccessResult = createMemo(() => {
		const result = saveResult();
		return result?.ok ? result : undefined;
	});
	const saveErrorResult = createMemo(() => {
		const result = saveResult();
		return result && !result.ok ? result : undefined;
	});
	const deleteErrorResult = createMemo(() => {
		const result = deleteResult();
		return result && !result.ok ? result : undefined;
	});

	const saveFieldErrors = (): SpellbookFieldErrors => {
		const result = saveResult();
		if (!result || result.ok || lastSubmittedId() !== draft().id) {
			return {};
		}
		return result.fieldErrors;
	};

	const openCreateModal = () => {
		setIsEditing(false);
		setDraft({
			id: crypto.randomUUID(),
			castid: "0",
			effectid: "0",
			cost: "0",
			cast: "0",
			title: "",
			description: "",
		});
		editorDialog?.showModal();
	};

	const openEditModal = (entry: SpellbookEntry) => {
		setIsEditing(true);
		setDraft({
			id: entry.id,
			castid: String(entry.castid),
			effectid: String(entry.effectid),
			cost: String(entry.cost),
			cast: String(entry.cast),
			title: entry.title,
			description: entry.description,
		});
		editorDialog?.showModal();
	};

	const openDuplicateModal = (entry: SpellbookEntry) => {
		setIsEditing(false);
		setDraft({
			id: crypto.randomUUID(),
			castid: String(entry.castid),
			effectid: String(entry.effectid),
			cost: String(entry.cost),
			cast: String(entry.cast),
			title: entry.title,
			description: entry.description,
		});
		editorDialog?.showModal();
	};

	createEffect(() => {
		const result = saveResult();
		if (result?.ok && !saveSubmission.pending) {
			editorDialog?.close();
		}
	});

	return (
		<main class="container">
			<Title>Spellbook DB Editor</Title>
			<article>
				<header class="list-header">
					<h1>Spellbook DB Editor</h1>
					<div class="header-actions">
						<button type="button" onClick={openCreateModal}>
							Add Entry
						</button>
					</div>
				</header>
				<p>
					Edits and saves spellbook DB entries to configured storage path.
					Default: <code>/tmp/spellbook-state.json</code>
				</p>

				<Show
					when={(spellbookState()?.entries.length ?? 0) > 0}
					fallback={<p>No spellbook entries yet.</p>}
				>
					<div class="spellbook-table-wrap">
						<table class="spellbook-table">
							<thead>
								<tr>
									<th>castid</th>
									<th>effectid</th>
									<th>cost</th>
									<th>cast</th>
									<th>title</th>
									<th>description</th>
									<th>actions</th>
								</tr>
							</thead>
							<tbody>
								<For each={spellbookState()?.entries ?? []}>
									{(entry) => (
										<tr>
											<td>{entry.castid}</td>
											<td>{entry.effectid}</td>
											<td>{entry.cost}</td>
											<td>{entry.cast}</td>
											<td>{entry.title}</td>
											<td>{entry.description}</td>
											<td>
												<div class="table-actions">
													<button type="button" onClick={() => openEditModal(entry)}>
														Edit
													</button>
													<button
														type="button"
														class="secondary"
														onClick={() => openDuplicateModal(entry)}
													>
														Duplicate
													</button>
													<form
														action={deleteSpellbookEntry}
														method="post"
														onSubmit={(event) => {
															if (!window.confirm(`Delete castid ${entry.castid}?`)) {
																event.preventDefault();
																return;
															}
															setActiveDeleteId(entry.id);
														}}
													>
														<input type="hidden" name="id" value={entry.id} />
														<button
															type="submit"
															class="secondary"
															disabled={deleteSubmission.pending}
															aria-busy={
																deleteSubmission.pending && activeDeleteId() === entry.id
															}
														>
															Delete
														</button>
													</form>
												</div>
											</td>
										</tr>
									)}
								</For>
							</tbody>
						</table>
					</div>
				</Show>

				<Show when={saveSuccessResult() && !saveSubmission.pending}>
					<p class="status-ok">
						{saveSuccessResult()?.mode === "created" ? "Created" : "Updated"} entry.
					</p>
					<Show when={(saveSuccessResult()?.reassignments.length ?? 0) > 0}>
						<p class="status-warn">
							castid reassigned: {formatReassignments(saveSuccessResult()?.reassignments ?? [])}
						</p>
					</Show>
				</Show>

				<Show when={deleteResult()?.ok && !deleteSubmission.pending}>
					<p class="status-ok">Entry deleted.</p>
				</Show>
				<Show when={deleteErrorResult() && !deleteSubmission.pending}>
					<p class="status-error">
						{deleteErrorResult()?.formError ?? "Failed to delete entry."}
					</p>
				</Show>
			</article>

			<dialog ref={(element) => (editorDialog = element)} class="editor-dialog">
				<article>
					<header>
						<h2>{isEditing() ? "Edit Entry" : "Add Entry"}</h2>
					</header>

					<form
						action={saveSpellbookEntry}
						method="post"
						onSubmit={() => {
							setLastSubmittedId(draft().id);
						}}
					>
						<input type="hidden" name="id" value={draft().id} />

						<label for="spellbook-castid">
							castid
							<input
								id="spellbook-castid"
								name="castid"
								type="number"
								min="0"
								step="1"
								value={draft().castid}
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										castid: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().castid}>
							<small class="status-error validation-error">
								{saveFieldErrors().castid}
							</small>
						</Show>

						<label for="spellbook-effectid">
							effectid
							<input
								id="spellbook-effectid"
								name="effectid"
								type="number"
								min="0"
								step="1"
								value={draft().effectid}
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										effectid: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().effectid}>
							<small class="status-error validation-error">
								{saveFieldErrors().effectid}
							</small>
						</Show>

						<label for="spellbook-cost">
							cost
							<input
								id="spellbook-cost"
								name="cost"
								type="number"
								min="0"
								step="1"
								value={draft().cost}
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										cost: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().cost}>
							<small class="status-error validation-error">
								{saveFieldErrors().cost}
							</small>
						</Show>

						<label for="spellbook-cast">
							cast
							<input
								id="spellbook-cast"
								name="cast"
								type="number"
								min="0"
								step="1"
								value={draft().cast}
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										cast: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().cast}>
							<small class="status-error validation-error">
								{saveFieldErrors().cast}
							</small>
						</Show>

						<label for="spellbook-title">
							title
							<input
								id="spellbook-title"
								name="title"
								type="text"
								value={draft().title}
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										title: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().title}>
							<small class="status-error validation-error">
								{saveFieldErrors().title}
							</small>
						</Show>

						<label for="spellbook-description">
							description
							<textarea
								id="spellbook-description"
								name="description"
								rows="4"
								value={draft().description}
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										description: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().description}>
							<small class="status-error validation-error">
								{saveFieldErrors().description}
							</small>
						</Show>

						<Show when={saveErrorResult() && lastSubmittedId() === draft().id}>
							<p class="status-error">
								{saveErrorResult()?.formError ?? "Failed to save entry."}
							</p>
						</Show>

						<footer class="modal-actions">
							<button
								type="button"
								class="secondary"
								onClick={() => editorDialog?.close()}
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={saveSubmission.pending}
								aria-busy={saveSubmission.pending}
							>
								{saveSubmission.pending ? "Saving..." : "Save"}
							</button>
						</footer>
					</form>
				</article>
			</dialog>
		</main>
	);
}
