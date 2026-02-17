import { Title } from "@solidjs/meta";
import { action, createAsync, query, revalidate, useSubmission } from "@solidjs/router";
import { Show } from "solid-js";
import { readFile, writeFile } from "node:fs/promises";

const FORM_STATE_PATH = "/tmp/form-state.json";

type FormState = {
  title: string;
  description: string;
  enabled: boolean;
  updatedAt: string;
};

const defaultFormState: FormState = {
  title: "",
  description: "",
  enabled: false,
  updatedAt: "",
};

function normalizeFormState(value: unknown): FormState {
  if (!value || typeof value !== "object") {
    return defaultFormState;
  }

  const record = value as Record<string, unknown>;
  return {
    title: typeof record.title === "string" ? record.title : "",
    description: typeof record.description === "string" ? record.description : "",
    enabled: typeof record.enabled === "boolean" ? record.enabled : false,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
  };
}

const loadFormState = query(async () => {
  "use server";
  try {
    const raw = await readFile(FORM_STATE_PATH, "utf-8");
    return normalizeFormState(JSON.parse(raw));
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`Failed to load form state from ${FORM_STATE_PATH}: ${error.message}`);
    }
    return defaultFormState;
  }
}, "load-form-state");

const saveFormState = action(async (formData: FormData) => {
  "use server";
  const nextState: FormState = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    enabled: formData.get("enabled") !== null,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(FORM_STATE_PATH, JSON.stringify(nextState, null, 2), "utf-8");
  await revalidate(loadFormState.key);
  return nextState;
}, "save-form-state");

export default function Home() {
  const initialState = createAsync(() => loadFormState());
  const submission = useSubmission(saveFormState);

  return (
    <main class="container">
      <Title>Form Sample</Title>
      <article>
        <h1>Form Sample</h1>
        <p>Values are loaded from and saved to /tmp/form-state.json.</p>

        <form action={saveFormState} method="post">
          <label for="title">
            Title
            <input
              id="title"
              name="title"
              type="text"
              value={initialState()?.title ?? ""}
              placeholder="Enter title"
            />
          </label>

          <label for="description">
            Description
            <textarea
              id="description"
              name="description"
              rows="4"
              placeholder="Enter description"
            >
              {initialState()?.description ?? ""}
            </textarea>
          </label>

          <fieldset>
            <label for="enabled">
              <input
                id="enabled"
                name="enabled"
                type="checkbox"
                checked={initialState()?.enabled ?? false}
              />
              Enabled
            </label>
          </fieldset>

          <button type="submit" disabled={submission.pending} aria-busy={submission.pending}>
            {submission.pending ? "Saving..." : "Save"}
          </button>
        </form>

        <Show when={submission.result && !submission.pending}>
          <p class="status-ok">
            Saved at {(submission.result as FormState).updatedAt || "unknown time"}.
          </p>
        </Show>

        <Show when={submission.error && !submission.pending}>
          <p class="status-error">Failed to save. Please check server logs.</p>
        </Show>

        <Show when={initialState()?.updatedAt}>
          <small>Last saved: {initialState()?.updatedAt}</small>
        </Show>
      </article>
    </main>
  );
}
