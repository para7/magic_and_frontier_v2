import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { api } from "../../api";
import { createItemDraft } from "../../models/drafts";
import { itemDraftToSaveInput, itemEntryToDraft } from "../../services/editor-mappers";
import type { SaveErrorResult, ItemEntry } from "../../types";

export type ItemEditorDialogData = {
  mode: "create" | "edit";
  initial?: ItemEntry;
};

@Component({
  selector: "app-item-editor-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>{{ mode() === 'edit' ? 'アイテム編集' : 'アイテム追加' }}</h2>
    <mat-dialog-content>
      <form id="item-editor-form" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="form-full">
          <mat-label>アイテムID</mat-label>
          <input matInput [(ngModel)]="draft().itemId" name="itemId" />
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>個数</mat-label>
            <input matInput [(ngModel)]="draft().count" name="count" type="number" min="1" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>カスタムモデルデータ</mat-label>
            <input matInput [(ngModel)]="draft().customModelData" name="customModelData" />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="form-full">
          <mat-label>カスタム名</mat-label>
          <input matInput [(ngModel)]="draft().customName" name="customName" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-full">
          <mat-label>説明文</mat-label>
          <textarea matInput [(ngModel)]="draft().lore" name="lore" rows="3"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-full">
          <mat-label>エンチャント</mat-label>
          <textarea matInput [(ngModel)]="draft().enchantments" name="enchantments" rows="3"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-full">
          <mat-label>カスタムNBT</mat-label>
          <textarea matInput [(ngModel)]="draft().customNbt" name="customNbt" rows="2"></textarea>
        </mat-form-field>
        <mat-checkbox [(ngModel)]="draft().unbreakable" name="unbreakable">耐久値を減らさない</mat-checkbox>
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
  readonly draft = signal(this.data.initial ? itemEntryToDraft(this.data.initial) : createItemDraft());

  readonly message = signal<{ err?: string }>({});
  readonly error = computed(() => this.message().err ?? "");

  cancel(): void {
    this.dialogRef.close("cancel");
  }

  async save(): Promise<void> {
    this.message.set({});
    try {
      await api.saveItem(itemDraftToSaveInput(this.draft()));
      this.dialogRef.close("saved");
    } catch (error) {
      const result = error as SaveErrorResult;
      this.message.set({ err: result.formError ?? "アイテムの保存に失敗しました。" });
    }
  }
}
