import { hc } from "hono/client";
import type { AppType } from "@maf/server/rpc";
import type {
  EnemyEntry,
  EnemySkillEntry,
  GrimoireEntry,
  ItemEntry,
  SkillEntry,
  TreasureEntry
} from "./types";
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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  return unwrap<T>(response);
}

async function postJson<T>(path: string, input: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(input)
  });
  return unwrap<T>(response);
}

async function deleteJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  return unwrap<T>(response);
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
  async loadGrimoire(): Promise<{ entries: GrimoireEntry[] }> {
    return unwrap<{ entries: GrimoireEntry[] }>(await client.api.grimoire.$get());
  },
  async saveGrimoire(input: unknown): Promise<unknown> {
    return unwrap<unknown>(await client.api.grimoire.$post({ json: input as never }));
  },
  async deleteGrimoire(id: string): Promise<unknown> {
    return unwrap<unknown>(await client.api.grimoire[":id"].$delete({ param: { id } }));
  },
  async loadSkills(): Promise<{ entries: SkillEntry[] }> {
    return getJson<{ entries: SkillEntry[] }>("/api/skills");
  },
  async saveSkill(input: unknown): Promise<unknown> {
    return postJson<unknown>("/api/skills", input);
  },
  async deleteSkill(id: string): Promise<unknown> {
    return deleteJson<unknown>(`/api/skills/${id}`);
  },
  async loadEnemySkills(): Promise<{ entries: EnemySkillEntry[] }> {
    return getJson<{ entries: EnemySkillEntry[] }>("/api/enemy-skills");
  },
  async saveEnemySkill(input: unknown): Promise<unknown> {
    return postJson<unknown>("/api/enemy-skills", input);
  },
  async deleteEnemySkill(id: string): Promise<unknown> {
    return deleteJson<unknown>(`/api/enemy-skills/${id}`);
  },
  async loadEnemies(): Promise<{ entries: EnemyEntry[] }> {
    return getJson<{ entries: EnemyEntry[] }>("/api/enemies");
  },
  async saveEnemy(input: unknown): Promise<unknown> {
    return postJson<unknown>("/api/enemies", input);
  },
  async deleteEnemy(id: string): Promise<unknown> {
    return deleteJson<unknown>(`/api/enemies/${id}`);
  },
  async loadTreasures(): Promise<{ entries: TreasureEntry[] }> {
    return getJson<{ entries: TreasureEntry[] }>("/api/treasures");
  },
  async saveTreasure(input: unknown): Promise<unknown> {
    return postJson<unknown>("/api/treasures", input);
  },
  async deleteTreasure(id: string): Promise<unknown> {
    return deleteJson<unknown>(`/api/treasures/${id}`);
  },
  async saveData(): Promise<SaveDataResponse> {
    return unwrap<SaveDataResponse>(await client.api.save.$post());
  }
};
