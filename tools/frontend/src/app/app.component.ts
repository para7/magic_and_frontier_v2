import { CommonModule } from "@angular/common";
import { Component, TemplateRef, ViewChild, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatToolbarModule } from "@angular/material/toolbar";
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
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatToolbarModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule
  ],
  template: `
    <div class="app-shell">
      <mat-toolbar class="site-header" role="banner">
        <span class="site-title">MAF Command Editor</span>
      </mat-toolbar>

      <div class="app-layout">
        <aside class="site-sidebar" aria-label="画面切り替え">
          <nav class="sidebar-nav">
            <button mat-button class="sidebar-link" [class.active-nav]="screen() === 'item'" (click)="switchScreen('item')">
              アイテム
            </button>
            <button
              mat-button
              class="sidebar-link"
              [class.active-nav]="screen() === 'spellbook'"
              (click)="switchScreen('spellbook')"
            >
              魔法書DB
            </button>
          </nav>
        </aside>

        <main class="container">
          <mat-card appearance="outlined" *ngIf="screen() === 'item'">
          <header class="list-header">
            <h1>Item NBT Editor</h1>
            <button mat-flat-button type="button" (click)="openCreateItemModal()">Add Item</button>
          </header>
          <p>Items are loaded from and saved to configured storage path.</p>

          <ul class="item-list" *ngIf="items().length > 0; else noItems">
            <li class="item-row" *ngFor="let item of items()">
              <div class="item-main">
                <strong>{{ item.itemId }}</strong>
                <small>Count: {{ item.count }}</small>
                <code class="nbt-preview">{{ item.nbt }}</code>
              </div>
              <div class="item-actions">
                <button mat-button type="button" (click)="openEditItemModal(item)">Edit</button>
                <button mat-stroked-button type="button" (click)="deleteItem(item.id)">Delete</button>
              </div>
            </li>
          </ul>
          <ng-template #noItems><p>No items yet.</p></ng-template>

          <p class="status-error" *ngIf="itemError()">{{ itemError() }}</p>
          <p class="status-ok" *ngIf="itemSuccess()">{{ itemSuccess() }}</p>
          </mat-card>

          <mat-card appearance="outlined" *ngIf="screen() === 'spellbook'">
          <header class="list-header">
            <h1>Spellbook DB Editor</h1>
            <div class="header-actions">
              <button mat-flat-button type="button" (click)="openCreateSpellbookModal()">Add Entry</button>
            </div>
          </header>
          <p>Edits and saves spellbook DB entries to configured storage path.</p>

          <div class="spellbook-table-wrap" *ngIf="spellbookEntries().length > 0; else noEntries">
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
                <tr *ngFor="let entry of spellbookEntries()">
                  <td>{{ entry.castid }}</td>
                  <td>{{ entry.effectid }}</td>
                  <td>{{ entry.cost }}</td>
                  <td>{{ entry.cast }}</td>
                  <td>{{ entry.title }}</td>
                  <td>{{ entry.description }}</td>
                  <td>
                    <div class="table-actions">
                      <button mat-button type="button" (click)="openEditSpellbookModal(entry)">Edit</button>
                      <button mat-stroked-button type="button" (click)="openDuplicateSpellbookModal(entry)">Duplicate</button>
                      <button mat-stroked-button type="button" (click)="deleteSpellbook(entry.id)">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noEntries><p>No spellbook entries yet.</p></ng-template>

          <p class="status-error" *ngIf="spellbookError()">{{ spellbookError() }}</p>
          <p class="status-ok" *ngIf="spellbookSuccess()">{{ spellbookSuccess() }}</p>
          </mat-card>
        </main>
      </div>
    </div>

    <ng-template #itemEditor>
      <h2 mat-dialog-title>{{ itemDialogMode() === 'edit' ? 'Edit Item' : 'Add Item' }}</h2>
      <mat-dialog-content>
        <form id="item-editor-form" (ngSubmit)="saveItem()">
          <mat-form-field appearance="outline" class="form-full">
            <mat-label>Item ID</mat-label>
            <input matInput [(ngModel)]="itemDraft().itemId" name="itemId" />
          </mat-form-field>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Count</mat-label>
              <input matInput [(ngModel)]="itemDraft().count" name="count" type="number" min="1" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>CustomModelData</mat-label>
              <input matInput [(ngModel)]="itemDraft().customModelData" name="customModelData" />
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="form-full">
            <mat-label>Custom Name</mat-label>
            <input matInput [(ngModel)]="itemDraft().customName" name="customName" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="form-full">
            <mat-label>Lore</mat-label>
            <textarea matInput [(ngModel)]="itemDraft().lore" name="lore" rows="3"></textarea>
          </mat-form-field>
          <mat-form-field appearance="outline" class="form-full">
            <mat-label>Enchantments</mat-label>
            <textarea matInput [(ngModel)]="itemDraft().enchantments" name="enchantments" rows="3"></textarea>
          </mat-form-field>
          <mat-form-field appearance="outline" class="form-full">
            <mat-label>Custom NBT</mat-label>
            <textarea matInput [(ngModel)]="itemDraft().customNbt" name="customNbt" rows="2"></textarea>
          </mat-form-field>
          <mat-checkbox [(ngModel)]="itemDraft().unbreakable" name="unbreakable">Unbreakable</mat-checkbox>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="closeItemModal()">Cancel</button>
        <button mat-flat-button type="submit" form="item-editor-form">Save</button>
      </mat-dialog-actions>
    </ng-template>

    <ng-template #spellbookEditor>
      <h2 mat-dialog-title>{{ spellbookDialogMode() === 'edit' ? 'Edit Entry' : 'Add Entry' }}</h2>
      <mat-dialog-content>
        <form id="spellbook-editor-form" (ngSubmit)="saveSpellbook()">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>castid</mat-label>
              <input matInput [(ngModel)]="spellbookDraft().castid" name="castid" type="number" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>effectid</mat-label>
              <input matInput [(ngModel)]="spellbookDraft().effectid" name="effectid" type="number" />
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>cost</mat-label>
              <input matInput [(ngModel)]="spellbookDraft().cost" name="cost" type="number" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>cast</mat-label>
              <input matInput [(ngModel)]="spellbookDraft().cast" name="cast" type="number" />
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="form-full">
            <mat-label>title</mat-label>
            <input matInput [(ngModel)]="spellbookDraft().title" name="title" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="form-full">
            <mat-label>description</mat-label>
            <textarea matInput [(ngModel)]="spellbookDraft().description" name="description" rows="3"></textarea>
          </mat-form-field>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="closeSpellbookModal()">Cancel</button>
        <button mat-flat-button type="submit" form="spellbook-editor-form">Save</button>
      </mat-dialog-actions>
    </ng-template>
  `
})
export class AppComponent {
  @ViewChild("itemEditor") readonly itemEditor?: TemplateRef<unknown>;
  @ViewChild("spellbookEditor") readonly spellbookEditor?: TemplateRef<unknown>;

  private readonly dialog = inject(MatDialog);
  private itemDialogRef: MatDialogRef<unknown> | null = null;
  private spellbookDialogRef: MatDialogRef<unknown> | null = null;

  readonly screen = signal<"item" | "spellbook">("item");
  readonly items = signal<ItemEntry[]>([]);
  readonly spellbookEntries = signal<SpellbookEntry[]>([]);

  readonly itemDraft = signal<ItemDraft>(this.newItemDraft());
  readonly spellbookDraft = signal<SpellbookDraft>(this.newSpellbookDraft());
  readonly itemDialogMode = signal<"create" | "edit">("create");
  readonly spellbookDialogMode = signal<"create" | "edit">("create");

  readonly itemMessage = signal<{ ok?: string; err?: string }>({});
  readonly spellbookMessage = signal<{ ok?: string; err?: string }>({});

  readonly itemSuccess = computed(() => this.itemMessage().ok ?? "");
  readonly itemError = computed(() => this.itemMessage().err ?? "");
  readonly spellbookSuccess = computed(() => this.spellbookMessage().ok ?? "");
  readonly spellbookError = computed(() => this.spellbookMessage().err ?? "");

  constructor() {
    void this.reloadAll();
  }

  switchScreen(screen: "item" | "spellbook"): void {
    this.screen.set(screen);
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

  openCreateItemModal(): void {
    this.itemDialogMode.set("create");
    this.resetItemDraft();
    if (this.itemEditor) {
      this.itemDialogRef = this.dialog.open(this.itemEditor, { width: "740px" });
    }
  }

  openEditItemModal(item: ItemEntry): void {
    this.itemDialogMode.set("edit");
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
    if (this.itemEditor) {
      this.itemDialogRef = this.dialog.open(this.itemEditor, { width: "740px" });
    }
  }

  closeItemModal(): void {
    this.itemDialogRef?.close();
    this.itemDialogRef = null;
  }

  openCreateSpellbookModal(): void {
    this.spellbookDialogMode.set("create");
    this.resetSpellbookDraft();
    if (this.spellbookEditor) {
      this.spellbookDialogRef = this.dialog.open(this.spellbookEditor, { width: "740px" });
    }
  }

  openEditSpellbookModal(entry: SpellbookEntry): void {
    this.spellbookDialogMode.set("edit");
    this.spellbookDraft.set({
      id: entry.id,
      castid: String(entry.castid),
      effectid: String(entry.effectid),
      cost: String(entry.cost),
      cast: String(entry.cast),
      title: entry.title,
      description: entry.description
    });
    if (this.spellbookEditor) {
      this.spellbookDialogRef = this.dialog.open(this.spellbookEditor, { width: "740px" });
    }
  }

  openDuplicateSpellbookModal(entry: SpellbookEntry): void {
    this.spellbookDialogMode.set("create");
    this.spellbookDraft.set({
      id: crypto.randomUUID(),
      castid: String(entry.castid),
      effectid: String(entry.effectid),
      cost: String(entry.cost),
      cast: String(entry.cast),
      title: entry.title,
      description: entry.description
    });
    if (this.spellbookEditor) {
      this.spellbookDialogRef = this.dialog.open(this.spellbookEditor, { width: "740px" });
    }
  }

  closeSpellbookModal(): void {
    this.spellbookDialogRef?.close();
    this.spellbookDialogRef = null;
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
      this.closeItemModal();
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
      this.closeSpellbookModal();
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
