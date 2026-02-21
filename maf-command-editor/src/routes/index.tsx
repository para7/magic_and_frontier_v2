import { Title } from "@solidjs/meta";
import { action, createAsync, query, revalidate, useSubmission } from "@solidjs/router";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { readFile, writeFile } from "node:fs/promises";
import * as v from "valibot";
import { COMMON_ITEM_IDS } from "~/database/item-id";

const FORM_STATE_PATH = "/tmp/form-state.json";

type ItemEntry = {
  id: string;
  itemId: string;
  count: number;
  customName: string;
  lore: string;
  enchantments: string;
  unbreakable: boolean;
  customModelData: string;
  customNbt: string;
  nbt: string;
  updatedAt: string;
};

type ItemState = {
  items: ItemEntry[];
};

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

type FieldErrors = Partial<
  Record<"itemId" | "count" | "customName" | "lore" | "enchantments" | "customModelData" | "customNbt", string>
>;

type SaveItemResult =
  | {
      ok: true;
      item: ItemEntry;
      mode: "created" | "updated";
    }
  | {
      ok: false;
      fieldErrors: FieldErrors;
      formError?: string;
    };

type DeleteItemResult =
  | {
      ok: true;
      deletedId: string;
    }
  | {
      ok: false;
      formError: string;
    };

const defaultItemState: ItemState = {
  items: [],
};

const saveItemSchema = v.object({
  id: v.pipe(v.string(), v.trim(), v.minLength(1, "Item id is required.")),
  itemId: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Minecraft item id is required."),
    v.regex(/^(?:[a-z0-9_.-]+:)?[a-z0-9_./-]+$/, "Use a valid item id, e.g. minecraft:diamond_sword."),
  ),
  count: v.pipe(v.number(), v.minValue(1, "Count must be at least 1."), v.maxValue(99, "Count must be 99 or fewer.")),
  customName: v.pipe(v.string(), v.maxLength(200, "Custom name must be 200 characters or fewer.")),
  lore: v.pipe(v.string(), v.maxLength(3000, "Lore must be 3000 characters or fewer.")),
  enchantments: v.pipe(v.string(), v.maxLength(3000, "Enchantments must be 3000 characters or fewer.")),
  unbreakable: v.boolean(),
  customModelData: v.pipe(
    v.string(),
    v.maxLength(20, "CustomModelData must be 20 digits or fewer."),
    v.regex(/^\d*$/, "CustomModelData must be a non-negative integer."),
  ),
  customNbt: v.pipe(v.string(), v.maxLength(4000, "Custom NBT must be 4000 characters or fewer.")),
});

type NbtBuildResult = {
  nbt: string;
  enchantmentError?: string;
};

function toNbtText(value: string): string {
  const json = JSON.stringify({ text: value }).replace(/'/g, "\\'");
  return `'${json}'`;
}

function normalizeCustomNbtFragment(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function buildItemNbt(input: {
  itemId: string;
  count: number;
  customName: string;
  lore: string;
  enchantments: string;
  unbreakable: boolean;
  customModelData: string;
  customNbt: string;
}): NbtBuildResult {
  const tagParts: string[] = [];

  const displayParts: string[] = [];
  if (input.customName.trim().length > 0) {
    displayParts.push(`Name:${toNbtText(input.customName.trim())}`);
  }

  const loreLines = input.lore
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  if (loreLines.length > 0) {
    const lore = loreLines.map(line => toNbtText(line)).join(",");
    displayParts.push(`Lore:[${lore}]`);
  }

  if (displayParts.length > 0) {
    tagParts.push(`display:{${displayParts.join(",")}}`);
  }

  const enchantmentEntries = input.enchantments
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  if (enchantmentEntries.length > 0) {
    const enchantments: string[] = [];
    for (const entry of enchantmentEntries) {
      const [rawId, rawLevel] = entry.split(/\s+/, 2);
      const level = Number.parseInt(rawLevel ?? "", 10);
      if (!rawId || !Number.isInteger(level) || level < 1 || level > 255) {
        return {
          nbt: "",
          enchantmentError: `Invalid enchantment line: "${entry}". Use "minecraft:sharpness 5" format.`,
        };
      }
      enchantments.push(`{id:"${rawId}",lvl:${level}s}`);
    }
    tagParts.push(`Enchantments:[${enchantments.join(",")}]`);
  }

  if (input.unbreakable) {
    tagParts.push("Unbreakable:1b");
  }

  if (input.customModelData.trim().length > 0) {
    tagParts.push(`CustomModelData:${input.customModelData.trim()}`);
  }

  const customFragment = normalizeCustomNbtFragment(input.customNbt);
  if (customFragment.length > 0) {
    tagParts.push(customFragment);
  }

  const itemNbtParts = [`id:"${input.itemId.trim()}"`, `Count:${input.count}b`];
  if (tagParts.length > 0) {
    itemNbtParts.push(`tag:{${tagParts.join(",")}}`);
  }

  return {
    nbt: `{${itemNbtParts.join(",")}}`,
  };
}

function normalizeItemEntry(value: unknown): ItemEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const fallbackNbt = buildItemNbt({
    itemId: typeof record.itemId === "string" ? record.itemId : "minecraft:stone",
    count: typeof record.count === "number" && Number.isFinite(record.count) ? Math.max(1, Math.floor(record.count)) : 1,
    customName: typeof record.customName === "string" ? record.customName : "",
    lore: typeof record.lore === "string" ? record.lore : "",
    enchantments: typeof record.enchantments === "string" ? record.enchantments : "",
    unbreakable: typeof record.unbreakable === "boolean" ? record.unbreakable : false,
    customModelData: typeof record.customModelData === "string" ? record.customModelData : "",
    customNbt: typeof record.customNbt === "string" ? record.customNbt : "",
  }).nbt;

  return {
    id: typeof record.id === "string" && record.id.length > 0 ? record.id : crypto.randomUUID(),
    itemId: typeof record.itemId === "string" && record.itemId.length > 0 ? record.itemId : "minecraft:stone",
    count: typeof record.count === "number" && Number.isFinite(record.count) ? Math.max(1, Math.floor(record.count)) : 1,
    customName: typeof record.customName === "string" ? record.customName : "",
    lore: typeof record.lore === "string" ? record.lore : "",
    enchantments: typeof record.enchantments === "string" ? record.enchantments : "",
    unbreakable: typeof record.unbreakable === "boolean" ? record.unbreakable : false,
    customModelData: typeof record.customModelData === "string" ? record.customModelData : "",
    customNbt: typeof record.customNbt === "string" ? record.customNbt : "",
    nbt: typeof record.nbt === "string" && record.nbt.length > 0 ? record.nbt : fallbackNbt,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
  };
}

function normalizeItemState(value: unknown): ItemState {
  if (!value || typeof value !== "object") {
    return defaultItemState;
  }

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.items)) {
    const items = record.items.map(normalizeItemEntry).filter((item): item is ItemEntry => item !== null);
    return { items };
  }

  return defaultItemState;
}

async function readItemStateFromDisk(): Promise<ItemState> {
  try {
    const raw = await readFile(FORM_STATE_PATH, "utf-8");
    return normalizeItemState(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return defaultItemState;
    }
    if (error instanceof Error) {
      console.warn(`Failed to load item state from ${FORM_STATE_PATH}: ${error.message}`);
    }
    return defaultItemState;
  }
}

async function writeItemStateToDisk(state: ItemState): Promise<void> {
  await writeFile(FORM_STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

const loadItemState = query(async () => {
  "use server";
  return readItemStateFromDisk();
}, "load-item-state");

const saveItem = action(async (formData: FormData): Promise<SaveItemResult> => {
  "use server";
  const countRaw = String(formData.get("count") ?? "");
  const parsedCount = Number.parseInt(countRaw, 10);
  const parsed = v.safeParse(saveItemSchema, {
    id: String(formData.get("id") ?? ""),
    itemId: String(formData.get("itemId") ?? ""),
    count: Number.isInteger(parsedCount) ? parsedCount : Number.NaN,
    customName: String(formData.get("customName") ?? ""),
    lore: String(formData.get("lore") ?? ""),
    enchantments: String(formData.get("enchantments") ?? ""),
    unbreakable: formData.get("unbreakable") !== null,
    customModelData: String(formData.get("customModelData") ?? ""),
    customNbt: String(formData.get("customNbt") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.issues) {
      const path = v.getDotPath(issue);
      if (path === "itemId" && !fieldErrors.itemId) {
        fieldErrors.itemId = issue.message;
      }
      if (path === "count" && !fieldErrors.count) {
        fieldErrors.count = issue.message;
      }
      if (path === "customName" && !fieldErrors.customName) {
        fieldErrors.customName = issue.message;
      }
      if (path === "lore" && !fieldErrors.lore) {
        fieldErrors.lore = issue.message;
      }
      if (path === "enchantments" && !fieldErrors.enchantments) {
        fieldErrors.enchantments = issue.message;
      }
      if (path === "customModelData" && !fieldErrors.customModelData) {
        fieldErrors.customModelData = issue.message;
      }
      if (path === "customNbt" && !fieldErrors.customNbt) {
        fieldErrors.customNbt = issue.message;
      }
    }
    return {
      ok: false,
      fieldErrors,
      formError: "Validation failed. Fix the highlighted fields.",
    };
  }

  const built = buildItemNbt(parsed.output);
  if (built.enchantmentError) {
    return {
      ok: false,
      fieldErrors: {
        enchantments: built.enchantmentError,
      },
      formError: "Validation failed. Fix the highlighted fields.",
    };
  }

  const currentState = await readItemStateFromDisk();
  const now = new Date().toISOString();
  const nextItem: ItemEntry = {
    ...parsed.output,
    nbt: built.nbt,
    updatedAt: now,
  };

  const itemIndex = currentState.items.findIndex(item => item.id === parsed.output.id);
  const mode: "created" | "updated" = itemIndex >= 0 ? "updated" : "created";
  const nextItems = [...currentState.items];
  if (itemIndex >= 0) {
    nextItems[itemIndex] = nextItem;
  } else {
    nextItems.push(nextItem);
  }

  await writeItemStateToDisk({ items: nextItems });
  await revalidate(loadItemState.key);
  return { ok: true, item: nextItem, mode };
}, "save-item");

const deleteItem = action(async (formData: FormData): Promise<DeleteItemResult> => {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  if (id.length === 0) {
    return { ok: false, formError: "Missing item id." };
  }

  const currentState = await readItemStateFromDisk();
  const nextItems = currentState.items.filter(item => item.id !== id);
  if (nextItems.length === currentState.items.length) {
    return { ok: false, formError: "Item not found." };
  }

  await writeItemStateToDisk({ items: nextItems });
  await revalidate(loadItemState.key);
  return { ok: true, deletedId: id };
}, "delete-item");

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
  const deleteResult = () => deleteSubmission.result as DeleteItemResult | undefined;

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

        <Show when={(itemState()?.items.length ?? 0) > 0} fallback={<p>No items yet.</p>}>
          <ul class="item-list">
            <For each={itemState()?.items ?? []}>
              {item => (
                <li class="item-row">
                  <div class="item-main">
                    <strong>{item.itemId}</strong>
                    <small>
                      Count: {item.count}
                      <Show when={item.updatedAt}> - Last saved: {item.updatedAt}</Show>
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
                      onSubmit={event => {
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
                        aria-busy={deleteSubmission.pending && activeDeleteId() === item.id}
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

        <Show when={saveResult()?.ok && !saveSubmission.pending}>
          <p class="status-ok">
            {saveResult()?.mode === "created" ? "Created" : "Updated"} item at {saveResult()?.item.updatedAt || "unknown time"}.
          </p>
        </Show>

        <Show when={deleteResult()?.ok && !deleteSubmission.pending}>
          <p class="status-ok">Item deleted.</p>
        </Show>

        <Show when={deleteResult() && !deleteResult()?.ok && !deleteSubmission.pending}>
          <p class="status-error">{deleteResult()?.formError ?? "Failed to delete item."}</p>
        </Show>
      </article>

      <dialog ref={element => (editorDialog = element)} class="editor-dialog">
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
                onInput={event =>
                  setDraft(current => ({
                    ...current,
                    itemId: event.currentTarget.value,
                  }))
                }
              />
              <datalist id="minecraft-item-id-options">
                <For each={COMMON_ITEM_IDS}>{itemId => <option value={itemId} />}</For>
              </datalist>
            </label>
            <Show when={saveFieldErrors().itemId}>
              <small class="status-error validation-error">{saveFieldErrors().itemId}</small>
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
                onInput={event =>
                  setDraft(current => ({
                    ...current,
                    count: event.currentTarget.value,
                  }))
                }
              />
            </label>
            <Show when={saveFieldErrors().count}>
              <small class="status-error validation-error">{saveFieldErrors().count}</small>
            </Show>

            <label for="editor-custom-name">
              Custom Name (optional)
              <input
                id="editor-custom-name"
                name="customName"
                type="text"
                value={draft().customName}
                placeholder="Epic Sword"
                onInput={event =>
                  setDraft(current => ({
                    ...current,
                    customName: event.currentTarget.value,
                  }))
                }
              />
            </label>
            <Show when={saveFieldErrors().customName}>
              <small class="status-error validation-error">{saveFieldErrors().customName}</small>
            </Show>

            <label for="editor-lore">
              Lore (1 line per entry)
              <textarea
                id="editor-lore"
                name="lore"
                rows="4"
                value={draft().lore}
                placeholder={"Line 1\nLine 2"}
                onInput={event =>
                  setDraft(current => ({
                    ...current,
                    lore: event.currentTarget.value,
                  }))
                }
              />
            </label>
            <Show when={saveFieldErrors().lore}>
              <small class="status-error validation-error">{saveFieldErrors().lore}</small>
            </Show>

            <label for="editor-enchantments">
              Enchantments (minecraft:id level per line)
              <textarea
                id="editor-enchantments"
                name="enchantments"
                rows="4"
                value={draft().enchantments}
                placeholder={"minecraft:sharpness 5\nminecraft:unbreaking 3"}
                onInput={event =>
                  setDraft(current => ({
                    ...current,
                    enchantments: event.currentTarget.value,
                  }))
                }
              />
            </label>
            <Show when={saveFieldErrors().enchantments}>
              <small class="status-error validation-error">{saveFieldErrors().enchantments}</small>
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
                onInput={event =>
                  setDraft(current => ({
                    ...current,
                    customModelData: event.currentTarget.value,
                  }))
                }
              />
            </label>
            <Show when={saveFieldErrors().customModelData}>
              <small class="status-error validation-error">{saveFieldErrors().customModelData}</small>
            </Show>

            <label for="editor-custom-nbt">
              Extra tag NBT fragment (optional)
              <textarea
                id="editor-custom-nbt"
                name="customNbt"
                rows="3"
                value={draft().customNbt}
                placeholder="HideFlags:1,Damage:2"
                onInput={event =>
                  setDraft(current => ({
                    ...current,
                    customNbt: event.currentTarget.value,
                  }))
                }
              />
            </label>
            <Show when={saveFieldErrors().customNbt}>
              <small class="status-error validation-error">{saveFieldErrors().customNbt}</small>
            </Show>

            <label for="editor-unbreakable" class="checkbox-label">
              <input
                id="editor-unbreakable"
                name="unbreakable"
                type="checkbox"
                checked={draft().unbreakable}
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    unbreakable: event.currentTarget.checked,
                  }))
                }
              />
              Unbreakable
            </label>

            <label for="editor-preview">
              NBT Preview
              <textarea id="editor-preview" rows="6" value={preview()} readonly class="nbt-output" />
            </label>

            <Show when={saveResult() && !saveResult()?.ok && lastSubmittedId() === draft().id}>
              <p class="status-error">{saveResult()?.formError ?? "Failed to save item."}</p>
            </Show>
            <Show when={saveSubmission.error && !saveSubmission.pending}>
              <p class="status-error">Failed to save item. Please check server logs.</p>
            </Show>

            <footer class="modal-actions">
              <button type="button" class="secondary" onClick={closeEditorModal}>
                Cancel
              </button>
              <button type="submit" disabled={saveSubmission.pending} aria-busy={saveSubmission.pending}>
                {saveSubmission.pending ? "Saving..." : "Save"}
              </button>
            </footer>
          </form>
        </article>
      </dialog>
    </main>
  );
}
