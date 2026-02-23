import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";
import type {
  EnemyEntry,
  EnemySkillEntry,
  GrimoireEntry,
  ItemEntry,
  SkillEntry,
  TreasureEntry
} from "./types";

interface SaveDataResponse {
  ok: boolean;
  message: string;
}

const API_BASE =
  (globalThis as { __MAF_API_BASE__?: string }).__MAF_API_BASE__ ?? "http://localhost:8787";

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly http = inject(HttpClient);

  private toUrl(path: string): string {
    return `${API_BASE}${path}`;
  }

  private async getJson<T>(path: string): Promise<T> {
    try {
      return await firstValueFrom(
        this.http.get<T>(this.toUrl(path), {
          headers: { Accept: "application/json" }
        })
      );
    } catch (error) {
      throw unwrapHttpError(error);
    }
  }

  private async postJson<T>(path: string, input?: unknown): Promise<T> {
    try {
      return await firstValueFrom(
        this.http.post<T>(this.toUrl(path), input ?? null, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          }
        })
      );
    } catch (error) {
      throw unwrapHttpError(error);
    }
  }

  private async deleteJson<T>(path: string): Promise<T> {
    try {
      return await firstValueFrom(
        this.http.delete<T>(this.toUrl(path), {
          headers: { Accept: "application/json" }
        })
      );
    } catch (error) {
      throw unwrapHttpError(error);
    }
  }

  loadItems(): Promise<{ items: ItemEntry[] }> {
    return this.getJson<{ items: ItemEntry[] }>("/api/items");
  }

  saveItem(input: unknown): Promise<unknown> {
    return this.postJson<unknown>("/api/items", input);
  }

  deleteItem(id: string): Promise<unknown> {
    return this.deleteJson<unknown>(`/api/items/${id}`);
  }

  loadGrimoire(): Promise<{ entries: GrimoireEntry[] }> {
    return this.getJson<{ entries: GrimoireEntry[] }>("/api/grimoire");
  }

  saveGrimoire(input: unknown): Promise<unknown> {
    return this.postJson<unknown>("/api/grimoire", input);
  }

  deleteGrimoire(id: string): Promise<unknown> {
    return this.deleteJson<unknown>(`/api/grimoire/${id}`);
  }

  loadSkills(): Promise<{ entries: SkillEntry[] }> {
    return this.getJson<{ entries: SkillEntry[] }>("/api/skills");
  }

  saveSkill(input: unknown): Promise<unknown> {
    return this.postJson<unknown>("/api/skills", input);
  }

  deleteSkill(id: string): Promise<unknown> {
    return this.deleteJson<unknown>(`/api/skills/${id}`);
  }

  loadEnemySkills(): Promise<{ entries: EnemySkillEntry[] }> {
    return this.getJson<{ entries: EnemySkillEntry[] }>("/api/enemy-skills");
  }

  saveEnemySkill(input: unknown): Promise<unknown> {
    return this.postJson<unknown>("/api/enemy-skills", input);
  }

  deleteEnemySkill(id: string): Promise<unknown> {
    return this.deleteJson<unknown>(`/api/enemy-skills/${id}`);
  }

  loadEnemies(): Promise<{ entries: EnemyEntry[] }> {
    return this.getJson<{ entries: EnemyEntry[] }>("/api/enemies");
  }

  saveEnemy(input: unknown): Promise<unknown> {
    return this.postJson<unknown>("/api/enemies", input);
  }

  deleteEnemy(id: string): Promise<unknown> {
    return this.deleteJson<unknown>(`/api/enemies/${id}`);
  }

  loadTreasures(): Promise<{ entries: TreasureEntry[] }> {
    return this.getJson<{ entries: TreasureEntry[] }>("/api/treasures");
  }

  saveTreasure(input: unknown): Promise<unknown> {
    return this.postJson<unknown>("/api/treasures", input);
  }

  deleteTreasure(id: string): Promise<unknown> {
    return this.deleteJson<unknown>(`/api/treasures/${id}`);
  }

  saveData(): Promise<SaveDataResponse> {
    return this.postJson<SaveDataResponse>("/api/save");
  }
}

function unwrapHttpError(error: unknown): unknown {
  if (error instanceof HttpErrorResponse) {
    return error.error ?? { ok: false, message: error.message };
  }
  return error;
}
