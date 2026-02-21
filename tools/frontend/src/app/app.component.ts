import { CommonModule } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { api } from "./api";
import type { ItemEntry, SaveErrorResult, SpellbookEntry } from "./types";

type ItemDraft = {
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

type SpellbookDraft = {
  id: string;
  castid: string;
  effectid: string;
  cost: string;
  cast: string;
  title: string;
  description: string;
};

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="container">
      <h1>MAF Command Editor</h1>
      <p>Angular frontend / Hono backend / Domain-first architecture</p>

      <div class="grid">
        <section class="panel">
          <h2>Item</h2>
          <form (ngSubmit)="saveItem()">
            <label>Item ID <input [(ngModel)]="itemDraft().itemId" name="itemId" /></label>
            <div class="row">
              <label>Count <input [(ngModel)]="itemDraft().count" name="count" type="number" /></label>
              <label>CustomModelData <input [(ngModel)]="itemDraft().customModelData" name="customModelData" /></label>
            </div>
            <label>Custom Name <input [(ngModel)]="itemDraft().customName" name="customName" /></label>
            <label>Lore <textarea [(ngModel)]="itemDraft().lore" name="lore" rows="3"></textarea></label>
            <label>Enchantments <textarea [(ngModel)]="itemDraft().enchantments" name="enchantments" rows="3"></textarea></label>
            <label>Custom NBT <textarea [(ngModel)]="itemDraft().customNbt" name="customNbt" rows="2"></textarea></label>
            <label><input type="checkbox" [(ngModel)]="itemDraft().unbreakable" name="unbreakable" /> Unbreakable</label>
            <div class="actions">
              <button type="submit">Save Item</button>
              <button type="button" class="secondary" (click)="resetItemDraft()">New</button>
            </div>
          </form>

          <p class="status-error" *ngIf="itemError()">{{ itemError() }}</p>
          <p class="status-ok" *ngIf="itemSuccess()">{{ itemSuccess() }}</p>

          <div class="list">
            <div class="item" *ngFor="let item of items()">
              <strong>{{ item.itemId }}</strong> ({{ item.count }})
              <div class="actions">
                <button type="button" class="secondary" (click)="editItem(item)">Edit</button>
                <button type="button" class="secondary" (click)="deleteItem(item.id)">Delete</button>
              </div>
              <code>{{ item.nbt }}</code>
            </div>
          </div>
        </section>

        <section class="panel">
          <h2>Spellbook</h2>
          <form (ngSubmit)="saveSpellbook()">
            <div class="row">
              <label>castid <input [(ngModel)]="spellbookDraft().castid" name="castid" type="number" /></label>
              <label>effectid <input [(ngModel)]="spellbookDraft().effectid" name="effectid" type="number" /></label>
            </div>
            <div class="row">
              <label>cost <input [(ngModel)]="spellbookDraft().cost" name="cost" type="number" /></label>
              <label>cast <input [(ngModel)]="spellbookDraft().cast" name="cast" type="number" /></label>
            </div>
            <label>title <input [(ngModel)]="spellbookDraft().title" name="title" /></label>
            <label>description <textarea [(ngModel)]="spellbookDraft().description" name="description" rows="3"></textarea></label>
            <div class="actions">
              <button type="submit">Save Entry</button>
              <button type="button" class="secondary" (click)="resetSpellbookDraft()">New</button>
            </div>
          </form>

          <p class="status-error" *ngIf="spellbookError()">{{ spellbookError() }}</p>
          <p class="status-ok" *ngIf="spellbookSuccess()">{{ spellbookSuccess() }}</p>

          <div class="list">
            <div class="item" *ngFor="let entry of spellbookEntries()">
              <strong>{{ entry.castid }}: {{ entry.title || '(untitled)' }}</strong>
              <div>{{ entry.description }}</div>
              <div class="actions">
                <button type="button" class="secondary" (click)="editSpellbook(entry)">Edit</button>
                <button type="button" class="secondary" (click)="deleteSpellbook(entry.id)">Delete</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  `
})
export class AppComponent {
  readonly items = signal<ItemEntry[]>([]);
  readonly spellbookEntries = signal<SpellbookEntry[]>([]);

  readonly itemDraft = signal<ItemDraft>(this.newItemDraft());
  readonly spellbookDraft = signal<SpellbookDraft>(this.newSpellbookDraft());

  readonly itemMessage = signal<{ ok?: string; err?: string }>({});
  readonly spellbookMessage = signal<{ ok?: string; err?: string }>({});

  readonly itemSuccess = computed(() => this.itemMessage().ok ?? "");
  readonly itemError = computed(() => this.itemMessage().err ?? "");
  readonly spellbookSuccess = computed(() => this.spellbookMessage().ok ?? "");
  readonly spellbookError = computed(() => this.spellbookMessage().err ?? "");

  constructor() {
    void this.reloadAll();
  }

  async reloadAll(): Promise<void> {
    const [itemState, spellbookState] = await Promise.all([api.loadItems(), api.loadSpellbook()]);
    this.items.set(itemState.items);
    this.spellbookEntries.set(spellbookState.entries);
  }

  newItemDraft(): ItemDraft {
    return {
      id: crypto.randomUUID(),
      itemId: "minecraft:stone",
      count: "1",
      customName: "",
      lore: "",
      enchantments: "",
      unbreakable: false,
      customModelData: "",
      customNbt: ""
    };
  }

  newSpellbookDraft(): SpellbookDraft {
    return {
      id: crypto.randomUUID(),
      castid: "0",
      effectid: "0",
      cost: "0",
      cast: "0",
      title: "",
      description: ""
    };
  }

  resetItemDraft(): void {
    this.itemDraft.set(this.newItemDraft());
  }

  resetSpellbookDraft(): void {
    this.spellbookDraft.set(this.newSpellbookDraft());
  }

  editItem(item: ItemEntry): void {
    this.itemDraft.set({
      id: item.id,
      itemId: item.itemId,
      count: String(item.count),
      customName: item.customName,
      lore: item.lore,
      enchantments: item.enchantments,
      unbreakable: item.unbreakable,
      customModelData: item.customModelData,
      customNbt: item.customNbt
    });
  }

  editSpellbook(entry: SpellbookEntry): void {
    this.spellbookDraft.set({
      id: entry.id,
      castid: String(entry.castid),
      effectid: String(entry.effectid),
      cost: String(entry.cost),
      cast: String(entry.cast),
      title: entry.title,
      description: entry.description
    });
  }

  async saveItem(): Promise<void> {
    this.itemMessage.set({});
    const draft = this.itemDraft();

    try {
      await api.saveItem({
        id: draft.id,
        itemId: draft.itemId,
        count: Number.parseInt(draft.count, 10),
        customName: draft.customName,
        lore: draft.lore,
        enchantments: draft.enchantments,
        unbreakable: draft.unbreakable,
        customModelData: draft.customModelData,
        customNbt: draft.customNbt
      });
      this.itemMessage.set({ ok: "Item saved." });
      this.resetItemDraft();
      await this.reloadAll();
    } catch (error) {
      const result = error as SaveErrorResult;
      this.itemMessage.set({ err: result.formError ?? "Failed to save item." });
    }
  }

  async deleteItem(id: string): Promise<void> {
    this.itemMessage.set({});
    try {
      await api.deleteItem(id);
      this.itemMessage.set({ ok: "Item deleted." });
      await this.reloadAll();
    } catch {
      this.itemMessage.set({ err: "Failed to delete item." });
    }
  }

  async saveSpellbook(): Promise<void> {
    this.spellbookMessage.set({});
    const draft = this.spellbookDraft();

    try {
      await api.saveSpellbook({
        id: draft.id,
        castid: Number.parseInt(draft.castid, 10),
        effectid: Number.parseInt(draft.effectid, 10),
        cost: Number.parseInt(draft.cost, 10),
        cast: Number.parseInt(draft.cast, 10),
        title: draft.title,
        description: draft.description
      });
      this.spellbookMessage.set({ ok: "Spellbook entry saved." });
      this.resetSpellbookDraft();
      await this.reloadAll();
    } catch (error) {
      const result = error as SaveErrorResult;
      this.spellbookMessage.set({ err: result.formError ?? "Failed to save spellbook entry." });
    }
  }

  async deleteSpellbook(id: string): Promise<void> {
    this.spellbookMessage.set({});
    try {
      await api.deleteSpellbook(id);
      this.spellbookMessage.set({ ok: "Spellbook entry deleted." });
      await this.reloadAll();
    } catch {
      this.spellbookMessage.set({ err: "Failed to delete spellbook entry." });
    }
  }
}
