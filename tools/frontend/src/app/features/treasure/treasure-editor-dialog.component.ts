import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { ApiService } from "../../api";
import { createTreasureDraft, createTreasureDropRefDraft } from "../../models/drafts";
import type { TreasureDropRefDraft } from "../../models/drafts";
import { treasureDraftToSaveInput, treasureEntryToDraft } from "../../services/editor-mappers";
import { ReferencePickerComponent } from "../../shared/reference-picker.component";
import { ToastService } from "../../shared/toast.service";
import type {
  GrimoireEntry,
  ItemEntry,
  ReferenceOption,
  SaveErrorResult,
  TreasureEntry
} from "../../types";

export interface TreasureEditorDialogData {
  mode: "create" | "edit" | "duplicate";
  initial?: TreasureEntry;
}

@Component({
  selector: "app-treasure-editor-dialog",
  standalone: true,
  styleUrl: "./treasure-editor-dialog.component.css",
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReferencePickerComponent
  ],
  template: `
    <h2 mat-dialog-title>{{ mode() === "edit" ? "treasure編集" : "treasure追加" }}</h2>
    <mat-dialog-content>
      <form id="treasure-editor-form" class="form-grid" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="form-span-2">
          <mat-label>name</mat-label>
          <input matInput [(ngModel)]="draft().name" name="name" />
        </mat-form-field>

        <section class="form-span-2 pool-header">
          <h3>lootPools</h3>
          <button mat-stroked-button type="button" (click)="addPool()">プール追加</button>
        </section>

        <section class="pool-card form-span-2" *ngFor="let pool of draft().lootPools; let i = index">
          <header class="pool-card-header">
            <h4>Pool {{ i + 1 }}</h4>
            <button mat-button type="button" (click)="removePool(i)" [disabled]="draft().lootPools.length <= 1">
              削除
            </button>
          </header>

          <div class="pool-grid">
            <mat-form-field appearance="outline">
              <mat-label>kind</mat-label>
              <mat-select [ngModel]="pool.kind" [name]="'kind-' + i" (ngModelChange)="onKindChange(i, $event)">
                <mat-option value="item">item</mat-option>
                <mat-option value="grimoire">grimoire</mat-option>
              </mat-select>
            </mat-form-field>

            <app-reference-picker
              label="参照"
              [value]="pool.refId"
              [options]="pool.kind === 'item' ? itemOptions() : grimoireOptions()"
              (valueChange)="onRefChange(i, $event)"
            />

            <mat-form-field appearance="outline">
              <mat-label>weight</mat-label>
              <input
                matInput
                type="number"
                min="1"
                [ngModel]="pool.weight"
                [name]="'weight-' + i"
                (ngModelChange)="onPoolFieldChange(i, 'weight', $event)"
              />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>countMin</mat-label>
              <input
                matInput
                type="number"
                min="1"
                [ngModel]="pool.countMin"
                [name]="'countMin-' + i"
                (ngModelChange)="onPoolFieldChange(i, 'countMin', $event)"
              />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>countMax</mat-label>
              <input
                matInput
                type="number"
                min="1"
                [ngModel]="pool.countMax"
                [name]="'countMax-' + i"
                (ngModelChange)="onPoolFieldChange(i, 'countMax', $event)"
              />
            </mat-form-field>
          </div>
          <p class="status-error" *ngIf="fieldErrors()['lootPools.' + i]">
            {{ fieldErrors()["lootPools." + i] }}
          </p>
        </section>

        <p class="status-error form-span-2" *ngIf="fieldErrors()['name']">{{ fieldErrors()["name"] }}</p>
        <p class="status-error form-span-2" *ngIf="fieldErrors()['lootPools']">{{ fieldErrors()["lootPools"] }}</p>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">キャンセル</button>
      <button mat-flat-button type="submit" form="treasure-editor-form">保存</button>
    </mat-dialog-actions>
  `
})
export class TreasureEditorDialogComponent {
  private readonly data = inject<TreasureEditorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TreasureEditorDialogComponent>);
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);

  readonly mode = signal<"create" | "edit" | "duplicate">(this.data.mode);
  readonly draft = signal(
    this.data.initial
      ? treasureEntryToDraft(this.data.initial, this.data.mode === "duplicate")
      : createTreasureDraft()
  );
  readonly items = signal<ItemEntry[]>([]);
  readonly grimoireEntries = signal<GrimoireEntry[]>([]);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly itemOptions = computed<ReferenceOption[]>(() =>
    this.items().map((item) => ({ id: item.id, label: item.itemId }))
  );
  readonly grimoireOptions = computed<ReferenceOption[]>(() =>
    this.grimoireEntries().map((entry) => ({
      id: entry.id,
      label: entry.title || `${entry.castid} (${entry.variants.length} variants)`
    }))
  );

  constructor() {
    void this.loadReferences();
  }

  cancel(): void {
    this.dialogRef.close("cancel");
  }

  addPool(): void {
    this.draft.update((current) => ({
      ...current,
      lootPools: [...current.lootPools, createTreasureDropRefDraft()]
    }));
  }

  removePool(index: number): void {
    this.draft.update((current) => ({
      ...current,
      lootPools: current.lootPools.filter((_, currentIndex) => currentIndex !== index)
    }));
  }

  onKindChange(index: number, kind: "item" | "grimoire"): void {
    this.draft.update((current) => {
      const pool = current.lootPools[index];
      if (!pool) return current;
      const nextPools = [...current.lootPools];
      const nextRefId = kind === "item" ? this.itemOptions()[0]?.id ?? "" : this.grimoireOptions()[0]?.id ?? "";
      nextPools[index] = { ...pool, kind, refId: nextRefId };
      return { ...current, lootPools: nextPools };
    });
  }

  onRefChange(index: number, refId: string): void {
    this.draft.update((current) => {
      const pool = current.lootPools[index];
      if (!pool) return current;
      const nextPools = [...current.lootPools];
      nextPools[index] = { ...pool, refId };
      return { ...current, lootPools: nextPools };
    });
  }

  onPoolFieldChange(index: number, field: keyof TreasureDropRefDraft, value: unknown): void {
    this.draft.update((current) => {
      const pool = current.lootPools[index];
      if (!pool) return current;
      const nextPools = [...current.lootPools];
      nextPools[index] = { ...pool, [field]: String(value ?? "") };
      return { ...current, lootPools: nextPools };
    });
  }

  async loadReferences(): Promise<void> {
    try {
      const [itemState, grimoireState] = await Promise.all([this.api.loadItems(), this.api.loadGrimoire()]);
      this.items.set(itemState.items);
      this.grimoireEntries.set(grimoireState.entries);
      this.draft.update((current) => ({
        ...current,
        lootPools: current.lootPools.map((pool) => {
          if (pool.refId) return pool;
          const refId = pool.kind === "item" ? itemState.items[0]?.id : grimoireState.entries[0]?.id;
          return { ...pool, refId: refId ?? "" };
        })
      }));
    } catch {
      this.toast.error("参照一覧の読み込みに失敗しました。");
    }
  }

  async save(): Promise<void> {
    this.fieldErrors.set({});
    try {
      await this.api.saveTreasure(treasureDraftToSaveInput(this.draft()));
      this.dialogRef.close("saved");
    } catch (error) {
      const result = error as SaveErrorResult;
      this.fieldErrors.set(result.fieldErrors ?? {});
      this.toast.error(result.formError ?? "treasureエントリーの保存に失敗しました。");
    }
  }
}
