import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ApiService } from "../../api";
import { createGrimoireDraft } from "../../models/drafts";
import { grimoireDraftToSaveInput, grimoireEntryToDraft } from "../../services/editor-mappers";
import type { SaveErrorResult, GrimoireEntry } from "../../types";
import { ToastService } from "../../shared/toast.service";

export interface GrimoireEditorDialogData {
  mode: "create" | "edit" | "duplicate";
  initial?: GrimoireEntry;
}

type SaveGrimoireResponse = {
  ok: boolean;
  warnings?: {
    castidChanged?: {
      from: number;
      to: number;
    };
  };
};

@Component({
  selector: "app-grimoire-editor-dialog",
  standalone: true,
  styleUrl: "./grimoire-editor-dialog.component.css",
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>{{ mode() === "edit" ? "エントリー編集" : "エントリー追加" }}</h2>
    <mat-dialog-content>
      <form id="grimoire-editor-form" class="form-grid" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>castid</mat-label>
          <input matInput [(ngModel)]="draft().castid" name="castid" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-span-2">
          <mat-label>効果スクリプト</mat-label>
          <textarea matInput [(ngModel)]="draft().script" name="script" rows="3"></textarea>
        </mat-form-field>
        <p class="status-warn form-span-2" *ngIf="castidWarning()">
          castid を変更すると、既存の紐づけが壊れる可能性があります。
        </p>
        <section class="variants form-span-2">
          <header class="variants-header">
            <h3>詠唱設定（cast / cost）</h3>
            <button mat-stroked-button type="button" (click)="addVariant()">+ 追加</button>
          </header>
          <div class="variant-row" *ngFor="let variant of draft().variants; let i = index">
            <mat-form-field appearance="outline">
              <mat-label>cast</mat-label>
              <input
                matInput
                type="number"
                [name]="'cast-' + i"
                [ngModel]="variant.cast"
                (ngModelChange)="updateVariant(i, 'cast', $event)"
              />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>cost</mat-label>
              <input
                matInput
                type="number"
                [name]="'cost-' + i"
                [ngModel]="variant.cost"
                (ngModelChange)="updateVariant(i, 'cost', $event)"
              />
            </mat-form-field>
            <button mat-button type="button" (click)="removeVariant(i)" [disabled]="draft().variants.length <= 1">
              削除
            </button>
          </div>
        </section>
        <mat-form-field appearance="outline" class="form-span-2">
          <mat-label>タイトル</mat-label>
          <input matInput [(ngModel)]="draft().title" name="title" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-span-2">
          <mat-label>説明</mat-label>
          <textarea
            matInput
            [(ngModel)]="draft().description"
            name="description"
            rows="2"
          ></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">キャンセル</button>
      <button mat-flat-button type="submit" form="grimoire-editor-form">保存</button>
    </mat-dialog-actions>
  `
})
export class GrimoireEditorDialogComponent {
  private readonly data = inject<GrimoireEditorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<GrimoireEditorDialogComponent>);
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  private readonly initialCastid = this.data.initial?.castid;

  readonly mode = signal<"create" | "edit" | "duplicate">(this.data.mode);
  readonly draft = signal(
    this.data.initial
      ? grimoireEntryToDraft(this.data.initial, this.data.mode === "duplicate")
      : createGrimoireDraft()
  );
  readonly castidWarning = computed(() => {
    if (this.initialCastid == null) return false;
    return Number.parseInt(this.draft().castid, 10) !== this.initialCastid;
  });

  constructor() {
    if (!this.data.initial) {
      void this.assignInitialCastid();
    }
  }

  cancel(): void {
    this.dialogRef.close("cancel");
  }

  addVariant(): void {
    this.draft.update((current) => ({
      ...current,
      variants: [...current.variants, { cast: "", cost: "" }]
    }));
  }

  removeVariant(index: number): void {
    this.draft.update((current) => {
      if (current.variants.length <= 1) return current;
      return {
        ...current,
        variants: current.variants.filter((_, currentIndex) => currentIndex !== index)
      };
    });
  }

  updateVariant(index: number, field: "cast" | "cost", value: unknown): void {
    this.draft.update((current) => {
      const currentVariant = current.variants[index];
      if (!currentVariant) return current;
      const next = [...current.variants];
      next[index] = { ...currentVariant, [field]: String(value ?? "") };
      return { ...current, variants: next };
    });
  }

  async save(): Promise<void> {
    if (this.hasInvalidVariants()) {
      this.toast.error("cast/cost は各行で両方入力してください。");
      return;
    }
    if (this.castidWarning()) {
      this.toast.info("castid を変更して保存します。");
    }
    try {
      const result = (await this.api.saveGrimoire(
        grimoireDraftToSaveInput(this.draft())
      )) as SaveGrimoireResponse;
      if (result.warnings?.castidChanged) {
        this.toast.info(
          `castid が変更されました: ${result.warnings.castidChanged.from} -> ${result.warnings.castidChanged.to}`
        );
      }
      this.dialogRef.close("saved");
    } catch (error) {
      const result = error as SaveErrorResult;
      this.toast.error(result.formError ?? "grimoireエントリーの保存に失敗しました。");
    }
  }

  private hasInvalidVariants(): boolean {
    return this.draft().variants.some((variant) => {
      const cast = variant.cast.trim();
      const cost = variant.cost.trim();
      if (!cast || !cost) return true;
      return Number.isNaN(Number.parseInt(cast, 10)) || Number.isNaN(Number.parseInt(cost, 10));
    });
  }

  private async assignInitialCastid(): Promise<void> {
    try {
      const state = await this.api.loadGrimoire();
      const nextCastid =
        state.entries.reduce((maxValue, entry) => Math.max(maxValue, entry.castid), 0) + 10;
      this.draft.update((current) => ({ ...current, castid: String(nextCastid) }));
    } catch {
      // Keep fallback castid when initial load failed.
    }
  }
}
