import { hc } from "hono/client";
import type { AppType } from "@maf/server/rpc";
import type { ItemEntry, SpellbookEntry } from "./types";
type SaveDataResponse = { ok: boolean; message: string };

const API_BASE =
  (globalThis as { __MAF_API_BASE__?: string }).__MAF_API_BASE__ ?? "http://localhost:8787";
const client = hc<AppType>(API_BASE);

async function unwrap<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;
  if (!response.ok) {
    throw body;
  }
  return body;
}

export const api = {
  async loadItems(): Promise<{ items: ItemEntry[] }> {
    return unwrap<{ items: ItemEntry[] }>(await client.api.items.$get());
  },
  async saveItem(input: unknown): Promise<unknown> {
    return unwrap<unknown>(await client.api.items.$post({ json: input as never }));
  },
  async deleteItem(id: string): Promise<unknown> {
    return unwrap<unknown>(await client.api.items[":id"].$delete({ param: { id } }));
  },
  async loadSpellbook(): Promise<{ entries: SpellbookEntry[] }> {
    return unwrap<{ entries: SpellbookEntry[] }>(await client.api.spellbook.$get());
  },
  async saveSpellbook(input: unknown): Promise<unknown> {
    return unwrap<unknown>(await client.api.spellbook.$post({ json: input as never }));
  },
  async deleteSpellbook(id: string): Promise<unknown> {
    return unwrap<unknown>(await client.api.spellbook[":id"].$delete({ param: { id } }));
  },
  async saveData(): Promise<SaveDataResponse> {
    return unwrap<SaveDataResponse>(await client.api.save.$post());
  }
};
