import { Title } from "@solidjs/meta";
import { action, createAsync, query, revalidate, useSubmission } from "@solidjs/router";
import { createEffect, createSignal, For, Show } from "solid-js";
import * as v from "valibot";

const FORM_STATE_PATH = "/tmp/form-state.json";

type FormItem = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  updatedAt: string;
};

type FormState = {
  items: FormItem[];
};

type EditableFields = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

type FieldErrors = Partial<Record<"title" | "description", string>>;

type SaveFormItemResult =
  | {
      ok: true;
      item: FormItem;
      mode: "created" | "updated";
    }
  | {
      ok: false;
      fieldErrors: FieldErrors;
      formError?: string;
    };

type DeleteFormItemResult =
  | {
      ok: true;
      deletedId: string;
    }
  | {
      ok: false;
      formError: string;
    };

const defaultFormState: FormState = {
  items: [],
};

const saveFormItemSchema = v.object({
  id: v.pipe(v.string(), v.trim(), v.minLength(1, "Item id is required.")),
  title: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Title is required."),
    v.maxLength(100, "Title must be 100 characters or fewer."),
  ),
  description: v.pipe(v.string(), v.maxLength(1000, "Description must be 1000 characters or fewer.")),
  enabled: v.boolean(),
});

function normalizeFormItem(value: unknown): FormItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  return {
    id: typeof record.id === "string" && record.id.length > 0 ? record.id : crypto.randomUUID(),
    title: typeof record.title === "string" ? record.title : "",
    description: typeof record.description === "string" ? record.description : "",
    enabled: typeof record.enabled === "boolean" ? record.enabled : false,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
  };
}

function normalizeFormState(value: unknown): FormState {
  if (!value || typeof value !== "object") {
    return defaultFormState;
  }

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.items)) {
    const items = record.items.map(normalizeFormItem).filter((item): item is FormItem => item !== null);
    return { items };
  }

  // Backward compatibility for previous single-object format.
  const single = normalizeFormItem(record);
  return single ? { items: [single] } : defaultFormState;
}

async function readFormStateFromDisk(): Promise<FormState> {
  try {
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(FORM_STATE_PATH, "utf8");
    return normalizeFormState(JSON.parse(raw));
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`Failed to load form state from ${FORM_STATE_PATH}: ${error.message}`);
    }
    return defaultFormState;
  }
}

async function writeFormStateToDisk(state: FormState): Promise<void> {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(FORM_STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

const loadFormState = query(async () => {
  "use server";
  return readFormStateFromDisk();
}, "load-form-state");

const saveFormItem = action(async (formData: FormData): Promise<SaveFormItemResult> => {
  "use server";
  const parsed = v.safeParse(saveFormItemSchema, {
    id: String(formData.get("id") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    enabled: formData.get("enabled") !== null,
  });

  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.issues) {
      const path = v.getDotPath(issue);
      if (path === "title" && !fieldErrors.title) {
        fieldErrors.title = issue.message;
      }
      if (path === "description" && !fieldErrors.description) {
        fieldErrors.description = issue.message;
      }
    }
    return {
      ok: false,
      fieldErrors,
      formError: "Validation failed. Fix the highlighted fields.",
    };
  }

  const currentState = await readFormStateFromDisk();
  const now = new Date().toISOString();
  const nextItem: FormItem = {
    ...parsed.output,
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

  await writeFormStateToDisk({ items: nextItems });
  await revalidate(loadFormState.key);
  return { ok: true, item: nextItem, mode };
}, "save-form-item");

const deleteFormItem = action(async (formData: FormData): Promise<DeleteFormItemResult> => {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  if (id.length === 0) {
    return { ok: false, formError: "Missing item id." };
  }

  const currentState = await readFormStateFromDisk();
  const nextItems = currentState.items.filter(item => item.id !== id);
  if (nextItems.length === currentState.items.length) {
    return { ok: false, formError: "Item not found." };
  }

  await writeFormStateToDisk({ items: nextItems });
  await revalidate(loadFormState.key);
  return { ok: true, deletedId: id };
}, "delete-form-item");

export default function Home() {
  let editorDialog: HTMLDialogElement | undefined;
  const formState = createAsync(() => loadFormState());
  const saveSubmission = useSubmission(saveFormItem);
  const deleteSubmission = useSubmission(deleteFormItem);
  const [isEditing, setIsEditing] = createSignal(false);
  const [lastSubmittedId, setLastSubmittedId] = createSignal("");
  const [activeDeleteId, setActiveDeleteId] = createSignal("");
  const [draft, setDraft] = createSignal<EditableFields>({
    id: "",
    title: "",
    description: "",
    enabled: false,
  });

  const saveResult = () => saveSubmission.result as SaveFormItemResult | undefined;
  const deleteResult = () => deleteSubmission.result as DeleteFormItemResult | undefined;
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
      title: "",
      description: "",
      enabled: false,
    });
    editorDialog?.showModal();
  };

  const openEditModal = (item: FormItem) => {
    setIsEditing(true);
    setDraft({
      id: item.id,
      title: item.title,
      description: item.description,
      enabled: item.enabled,
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
      <Title>Form Items</Title>
      <article>
        <header class="list-header">
          <h1>Form Items</h1>
          <button type="button" onClick={openCreateModal}>
            Add Item
          </button>
        </header>
        <p>Values are loaded from and saved to /tmp/form-state.json.</p>

        <Show when={(formState()?.items.length ?? 0) > 0} fallback={<p>No items yet.</p>}>
          <ul class="item-list">
            <For each={formState()?.items ?? []}>
              {item => (
                <li class="item-row">
                  <div class="item-main">
                    <strong>{item.title || "(Untitled)"}</strong>
                    <small>
                      {item.enabled ? "Enabled" : "Disabled"}
                      <Show when={item.updatedAt}>
                        {" "}
                        - Last saved: {item.updatedAt}
                      </Show>
                    </small>
                  </div>
                  <div class="item-actions">
                    <button type="button" onClick={() => openEditModal(item)}>
                      Edit
                    </button>
                    <form
                      action={deleteFormItem}
                      method="post"
                      onSubmit={event => {
                        if (!window.confirm(`Delete "${item.title || "Untitled"}"?`)) {
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
            {saveResult()?.mode === "created" ? "Created" : "Updated"} item at{" "}
            {saveResult()?.item.updatedAt || "unknown time"}.
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
            action={saveFormItem}
            method="post"
            onSubmit={() => {
              setLastSubmittedId(draft().id);
            }}
          >
            <input type="hidden" name="id" value={draft().id} />

            <label for="editor-title">
              Title
              <input
                id="editor-title"
                name="title"
                type="text"
                value={draft().title}
                placeholder="Enter title"
                onInput={event =>
                  setDraft(current => ({
                    ...current,
                    title: event.currentTarget.value,
                  }))
                }
              />
            </label>
            <Show when={saveFieldErrors().title}>
              <small class="status-error validation-error">{saveFieldErrors().title}</small>
            </Show>

            <label for="editor-description">
              Description
              <textarea
                id="editor-description"
                name="description"
                rows="4"
                value={draft().description}
                placeholder="Enter description"
                onInput={event =>
                  setDraft(current => ({
                    ...current,
                    description: event.currentTarget.value,
                  }))
                }
              />
            </label>
            <Show when={saveFieldErrors().description}>
              <small class="status-error validation-error">{saveFieldErrors().description}</small>
            </Show>

            <label for="editor-enabled" class="checkbox-label">
              <input
                id="editor-enabled"
                name="enabled"
                type="checkbox"
                checked={draft().enabled}
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    enabled: event.currentTarget.checked,
                  }))
                }
              />
              Enabled
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
