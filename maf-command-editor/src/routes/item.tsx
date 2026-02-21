import { Title } from "@solidjs/meta";
import {
	action,
	createAsync,
	query,
	revalidate,
	useSubmission,
} from "@solidjs/router";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { COMMON_ITEM_IDS } from "~/database/item-id";
import { buildItemNbt } from "~/features/items/nbt";
import type { ItemEntry } from "~/server/domain/item-types";
import { createServerServices } from "~/server/services/server-services";
import type {
	DeleteItemResult,
	FieldErrors,
	SaveItemInput,
	SaveItemResult,
} from "~/server/usecases/item-usecase";

type EditableFields = {
	id: string;
	itemId: string;
	count: string;
	customName: string;
	lore: string;
	enchantments: string;
	unbreakable: boolean;
	customModelData: string;
	customNbt: string;
};

const loadItemState = query(async () => {
	"use server";
	const { itemUsecase } = createServerServices();
	return itemUsecase.loadItems();
}, "load-item-state");

const saveItem = action(async (formData: FormData): Promise<SaveItemResult> => {
	"use server";
	const countRaw = String(formData.get("count") ?? "");
	const parsedCount = Number.parseInt(countRaw, 10);
	const input: SaveItemInput = {
		id: String(formData.get("id") ?? ""),
		itemId: String(formData.get("itemId") ?? ""),
		count: Number.isInteger(parsedCount) ? parsedCount : Number.NaN,
		customName: String(formData.get("customName") ?? ""),
		lore: String(formData.get("lore") ?? ""),
		enchantments: String(formData.get("enchantments") ?? ""),
		unbreakable: formData.get("unbreakable") !== null,
		customModelData: String(formData.get("customModelData") ?? ""),
		customNbt: String(formData.get("customNbt") ?? ""),
	};

	const { itemUsecase } = createServerServices();
	const result = await itemUsecase.saveItem(input);
	if (result.ok) {
		await revalidate(loadItemState.key);
	}
	return result;
}, "save-item");

const deleteItem = action(
	async (formData: FormData): Promise<DeleteItemResult> => {
		"use server";
		const { itemUsecase } = createServerServices();
		const result = await itemUsecase.deleteItem({
			id: String(formData.get("id") ?? ""),
		});
		if (result.ok) {
			await revalidate(loadItemState.key);
		}
		return result;
	},
	"delete-item",
);

export default function Home() {
	let editorDialog: HTMLDialogElement | undefined;
	const itemState = createAsync(() => loadItemState());
	const saveSubmission = useSubmission(saveItem);
	const deleteSubmission = useSubmission(deleteItem);
	const [isEditing, setIsEditing] = createSignal(false);
	const [lastSubmittedId, setLastSubmittedId] = createSignal("");
	const [activeDeleteId, setActiveDeleteId] = createSignal("");
	const [draft, setDraft] = createSignal<EditableFields>({
		id: "",
		itemId: "minecraft:stone",
		count: "1",
		customName: "",
		lore: "",
		enchantments: "",
		unbreakable: false,
		customModelData: "",
		customNbt: "",
	});

	const saveResult = () => saveSubmission.result as SaveItemResult | undefined;
	const deleteResult = () =>
		deleteSubmission.result as DeleteItemResult | undefined;
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

	const preview = createMemo(() => {
		const current = draft();
		const parsedCount = Number.parseInt(current.count, 10);
		if (!Number.isInteger(parsedCount) || parsedCount < 1) {
			return "Count must be an integer >= 1.";
		}

		const built = buildItemNbt({
			itemId: current.itemId,
			count: parsedCount,
			customName: current.customName,
			lore: current.lore,
			enchantments: current.enchantments,
			unbreakable: current.unbreakable,
			customModelData: current.customModelData,
			customNbt: current.customNbt,
		});

		return built.enchantmentError ?? built.nbt;
	});

	const saveFieldErrors = (): FieldErrors => {
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
			itemId: "minecraft:stone",
			count: "1",
			customName: "",
			lore: "",
			enchantments: "",
			unbreakable: false,
			customModelData: "",
			customNbt: "",
		});
		editorDialog?.showModal();
	};

	const openEditModal = (item: ItemEntry) => {
		setIsEditing(true);
		setDraft({
			id: item.id,
			itemId: item.itemId,
			count: String(item.count),
			customName: item.customName,
			lore: item.lore,
			enchantments: item.enchantments,
			unbreakable: item.unbreakable,
			customModelData: item.customModelData,
			customNbt: item.customNbt,
		});
		editorDialog?.showModal();
	};

	const closeEditorModal = () => {
		editorDialog?.close();
	};

	createEffect(() => {
		const result = saveResult();
		if (result?.ok && !saveSubmission.pending) {
			closeEditorModal();
		}
	});

	return (
		<main class="container">
			<Title>Item NBT Editor</Title>
			<article>
				<header class="list-header">
					<h1>Item NBT Editor</h1>
					<button type="button" onClick={openCreateModal}>
						Add Item
					</button>
				</header>
				<p>Items are loaded from and saved to /tmp/form-state.json.</p>

				<Show
					when={(itemState()?.items.length ?? 0) > 0}
					fallback={<p>No items yet.</p>}
				>
					<ul class="item-list">
						<For each={itemState()?.items ?? []}>
							{(item) => (
								<li class="item-row">
									<div class="item-main">
										<strong>{item.itemId}</strong>
										<small>
											Count: {item.count}
											<Show when={item.updatedAt}>
												{" "}
												- Last saved: {item.updatedAt}
											</Show>
										</small>
										<code class="nbt-preview">{item.nbt}</code>
									</div>
									<div class="item-actions">
										<button type="button" onClick={() => openEditModal(item)}>
											Edit
										</button>
										<form
											action={deleteItem}
											method="post"
											onSubmit={(event) => {
												if (!window.confirm(`Delete "${item.itemId}"?`)) {
													event.preventDefault();
													return;
												}
												setActiveDeleteId(item.id);
											}}
										>
											<input type="hidden" name="id" value={item.id} />
											<button
												type="submit"
												class="secondary"
												disabled={deleteSubmission.pending}
												aria-busy={
													deleteSubmission.pending &&
													activeDeleteId() === item.id
												}
											>
												Delete
											</button>
										</form>
									</div>
								</li>
							)}
						</For>
					</ul>
				</Show>

				<Show when={saveSuccessResult() && !saveSubmission.pending}>
					<p class="status-ok">
						{saveSuccessResult()?.mode === "created" ? "Created" : "Updated"}{" "}
						item at {saveSuccessResult()?.item.updatedAt || "unknown time"}.
					</p>
				</Show>

				<Show when={deleteResult()?.ok && !deleteSubmission.pending}>
					<p class="status-ok">Item deleted.</p>
				</Show>

				<Show when={deleteErrorResult() && !deleteSubmission.pending}>
					<p class="status-error">
						{deleteErrorResult()?.formError ?? "Failed to delete item."}
					</p>
				</Show>
			</article>

			<dialog ref={(element) => (editorDialog = element)} class="editor-dialog">
				<article>
					<header>
						<h2>{isEditing() ? "Edit Item" : "Add Item"}</h2>
					</header>

					<form
						action={saveItem}
						method="post"
						onSubmit={() => {
							setLastSubmittedId(draft().id);
						}}
					>
						<input type="hidden" name="id" value={draft().id} />

						<label for="editor-item-id">
							Item ID
							<input
								id="editor-item-id"
								name="itemId"
								type="text"
								list="minecraft-item-id-options"
								value={draft().itemId}
								placeholder="minecraft:diamond_sword"
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										itemId: event.currentTarget.value,
									}))
								}
							/>
							<datalist id="minecraft-item-id-options">
								<For each={COMMON_ITEM_IDS}>
									{(itemId) => <option value={itemId} />}
								</For>
							</datalist>
						</label>
						<Show when={saveFieldErrors().itemId}>
							<small class="status-error validation-error">
								{saveFieldErrors().itemId}
							</small>
						</Show>

						<label for="editor-count">
							Count
							<input
								id="editor-count"
								name="count"
								type="number"
								min="1"
								max="99"
								step="1"
								value={draft().count}
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										count: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().count}>
							<small class="status-error validation-error">
								{saveFieldErrors().count}
							</small>
						</Show>

						<label for="editor-custom-name">
							Custom Name (optional)
							<input
								id="editor-custom-name"
								name="customName"
								type="text"
								value={draft().customName}
								placeholder="Epic Sword"
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										customName: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().customName}>
							<small class="status-error validation-error">
								{saveFieldErrors().customName}
							</small>
						</Show>

						<label for="editor-lore">
							Lore (1 line per entry)
							<textarea
								id="editor-lore"
								name="lore"
								rows="4"
								value={draft().lore}
								placeholder={"Line 1\nLine 2"}
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										lore: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().lore}>
							<small class="status-error validation-error">
								{saveFieldErrors().lore}
							</small>
						</Show>

						<label for="editor-enchantments">
							Enchantments (minecraft:id level per line)
							<textarea
								id="editor-enchantments"
								name="enchantments"
								rows="4"
								value={draft().enchantments}
								placeholder={"minecraft:sharpness 5\nminecraft:unbreaking 3"}
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										enchantments: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().enchantments}>
							<small class="status-error validation-error">
								{saveFieldErrors().enchantments}
							</small>
						</Show>

						<label for="editor-custom-model-data">
							CustomModelData (optional)
							<input
								id="editor-custom-model-data"
								name="customModelData"
								type="text"
								inputMode="numeric"
								value={draft().customModelData}
								placeholder="1001"
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										customModelData: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().customModelData}>
							<small class="status-error validation-error">
								{saveFieldErrors().customModelData}
							</small>
						</Show>

						<label for="editor-custom-nbt">
							Extra tag NBT fragment (optional)
							<textarea
								id="editor-custom-nbt"
								name="customNbt"
								rows="3"
								value={draft().customNbt}
								placeholder="HideFlags:1,Damage:2"
								onInput={(event) =>
									setDraft((current) => ({
										...current,
										customNbt: event.currentTarget.value,
									}))
								}
							/>
						</label>
						<Show when={saveFieldErrors().customNbt}>
							<small class="status-error validation-error">
								{saveFieldErrors().customNbt}
							</small>
						</Show>

						<label for="editor-unbreakable" class="checkbox-label">
							<input
								id="editor-unbreakable"
								name="unbreakable"
								type="checkbox"
								checked={draft().unbreakable}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										unbreakable: event.currentTarget.checked,
									}))
								}
							/>
							Unbreakable
						</label>

						<label for="editor-preview">
							NBT Preview
							<textarea
								id="editor-preview"
								rows="6"
								value={preview()}
								readonly
								class="nbt-output"
							/>
						</label>

						<Show when={saveErrorResult() && lastSubmittedId() === draft().id}>
							<p class="status-error">
								{saveErrorResult()?.formError ?? "Failed to save item."}
							</p>
						</Show>
						<Show when={saveSubmission.error && !saveSubmission.pending}>
							<p class="status-error">
								Failed to save item. Please check server logs.
							</p>
						</Show>

						<footer class="modal-actions">
							<button
								type="button"
								class="secondary"
								onClick={closeEditorModal}
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
