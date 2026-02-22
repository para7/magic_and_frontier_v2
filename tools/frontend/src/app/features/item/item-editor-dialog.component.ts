import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { api } from "../../api";
import { createItemDraft } from "../../models/drafts";
import { itemDraftToSaveInput, itemEntryToDraft } from "../../services/editor-mappers";
import type { SaveErrorResult, ItemEntry } from "../../types";
import {
  ENCHANTMENT_CATALOG,
  ENCHANTMENT_CATEGORY_LABELS,
  type EnchantmentCategoryId,
  type EnchantmentDefinition
} from "./enchantment-catalog";
import {
  parseEnchantmentsText,
  serializeEnchantmentsSelection,
  type EnchantmentSelection
} from "./enchantment-mapper";

export interface ItemEditorDialogData {
  mode: "create" | "edit";
  initial?: ItemEntry;
}

@Component({
  selector: "app-item-editor-dialog",
  standalone: true,
  styleUrl: "./item-editor-dialog.component.css",
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatExpansionModule
  ],
  template: `
    <h2 mat-dialog-title>{{ mode() === "edit" ? "アイテム編集" : "アイテム追加" }}</h2>
    <mat-dialog-content>
      <form id="item-editor-form" class="form-grid" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="form-span-2">
          <mat-label>アイテムID</mat-label>
          <input matInput [(ngModel)]="draft().itemId" name="itemId" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>個数</mat-label>
          <input matInput [(ngModel)]="draft().count" name="count" type="number" min="1" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>カスタムモデルデータ</mat-label>
          <input matInput [(ngModel)]="draft().customModelData" name="customModelData" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>カスタム名</mat-label>
          <input matInput [(ngModel)]="draft().customName" name="customName" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>説明文</mat-label>
          <textarea matInput [(ngModel)]="draft().lore" name="lore" rows="2"></textarea>
        </mat-form-field>
        <section class="enchantments-section form-span-2">
          <h3 class="enchantments-title">エンチャント</h3>
          <p class="status-warn" *ngFor="let warning of enchantmentWarnings()">{{ warning }}</p>
          <mat-accordion class="enchantments-accordion" multi>
            <mat-expansion-panel *ngFor="let group of enchantmentGroups; trackBy: trackByGroup">
              <mat-expansion-panel-header>
                <mat-panel-title>{{ group.label }}</mat-panel-title>
              </mat-expansion-panel-header>
              <div class="enchantments-list">
                <div
                  class="enchantment-row"
                  *ngFor="let enchantment of group.enchantments; trackBy: trackByEnchantment"
                >
                  <mat-checkbox
                    [ngModel]="isEnabled(enchantment.id)"
                    [name]="'enchant-enabled-' + enchantment.id"
                    (ngModelChange)="onToggle(enchantment.id, $event, enchantment.maxLevel)"
                  >
                    {{ enchantment.label }}
                  </mat-checkbox>
                  <div class="enchantment-level">
                    <label [for]="'enchant-level-' + enchantment.id">Lv</label>
                    <input
                      matInput
                      type="number"
                      [id]="'enchant-level-' + enchantment.id"
                      [name]="'enchant-level-' + enchantment.id"
                      [min]="1"
                      [max]="enchantment.maxLevel"
                      [disabled]="!isEnabled(enchantment.id)"
                      [ngModel]="getLevel(enchantment.id)"
                      (ngModelChange)="onLevelChange(enchantment.id, $event, enchantment.maxLevel)"
                    />
                    <span class="enchantment-max">/ {{ enchantment.maxLevel }}</span>
                  </div>
                </div>
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </section>
        <mat-form-field appearance="outline" class="form-span-2">
          <mat-label>カスタムNBT</mat-label>
          <textarea matInput [(ngModel)]="draft().customNbt" name="customNbt" rows="2"></textarea>
        </mat-form-field>
        <mat-checkbox class="form-span-2" [(ngModel)]="draft().unbreakable" name="unbreakable"
          >耐久値を減らさない</mat-checkbox
        >
      </form>
      <p class="status-error" *ngIf="error()">{{ error() }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">キャンセル</button>
      <button mat-flat-button type="submit" form="item-editor-form">保存</button>
    </mat-dialog-actions>
  `
})
export class ItemEditorDialogComponent {
  private readonly data = inject<ItemEditorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ItemEditorDialogComponent>);

  readonly mode = signal<"create" | "edit">(this.data.mode);
  readonly draft = signal(
    this.data.initial ? itemEntryToDraft(this.data.initial) : createItemDraft()
  );

  readonly message = signal<{ err?: string }>({});
  readonly error = computed(() => this.message().err ?? "");
  readonly enchantmentWarnings = signal<string[]>([]);
  readonly enchantmentSelection = signal<EnchantmentSelection>({});
  readonly enchantmentGroups = buildEnchantmentGroups();

  constructor() {
    const parsed = parseEnchantmentsText(this.draft().enchantments, ENCHANTMENT_CATALOG);
    this.enchantmentSelection.set(parsed.selection);
    this.enchantmentWarnings.set(parsed.warnings);
  }

  cancel(): void {
    this.dialogRef.close("cancel");
  }

  trackByGroup(_index: number, group: EnchantmentGroup): string {
    return group.id;
  }

  trackByEnchantment(_index: number, enchantment: EnchantmentDefinition): string {
    return enchantment.id;
  }

  isEnabled(id: string): boolean {
    return this.enchantmentSelection()[id]?.enabled ?? false;
  }

  getLevel(id: string): string {
    return this.enchantmentSelection()[id]?.level ?? "1";
  }

  onToggle(id: string, enabled: boolean, maxLevel: number): void {
    const current = this.enchantmentSelection()[id];
    const nextLevel = current?.level?.trim() ? current.level : String(clampLevel(1, maxLevel));

    this.enchantmentSelection.update((selection) => ({
      ...selection,
      [id]: {
        enabled,
        level: nextLevel
      }
    }));
  }

  onLevelChange(id: string, value: unknown, maxLevel: number): void {
    const rawText = String(value ?? "").trim();
    const numeric = Number.parseInt(rawText, 10);
    const normalizedLevel = Number.isInteger(numeric) ? String(clampLevel(numeric, maxLevel)) : "";

    this.enchantmentSelection.update((selection) => {
      const previous = selection[id] ?? { enabled: false, level: "1" };
      return {
        ...selection,
        [id]: {
          ...previous,
          level: normalizedLevel
        }
      };
    });
  }

  async save(): Promise<void> {
    this.message.set({});
    const { text } = serializeEnchantmentsSelection(
      this.enchantmentSelection(),
      ENCHANTMENT_CATALOG
    );
    const draft = {
      ...this.draft(),
      enchantments: text
    };
    this.draft.set(draft);
    try {
      await api.saveItem(itemDraftToSaveInput(draft));
      this.dialogRef.close("saved");
    } catch (error) {
      const result = error as SaveErrorResult;
      this.message.set({ err: result.formError ?? "アイテムの保存に失敗しました。" });
    }
  }
}

const ENCHANTMENT_CATEGORY_ORDER: EnchantmentCategoryId[] = [
  "weapon",
  "mace",
  "armor",
  "tool",
  "bow",
  "crossbow",
  "trident",
  "fishing",
  "general",
  "curse"
];

interface EnchantmentGroup {
  id: EnchantmentCategoryId;
  label: string;
  enchantments: EnchantmentDefinition[];
}

function buildEnchantmentGroups(): EnchantmentGroup[] {
  return ENCHANTMENT_CATEGORY_ORDER.map((categoryId) => ({
    id: categoryId,
    label: ENCHANTMENT_CATEGORY_LABELS[categoryId],
    enchantments: ENCHANTMENT_CATALOG.filter((enchantment) => enchantment.category === categoryId)
  })).filter((group) => group.enchantments.length > 0);
}

function clampLevel(value: number, maxLevel: number): number {
  if (value < 1) return 1;
  if (value > maxLevel) return maxLevel;
  return value;
}
