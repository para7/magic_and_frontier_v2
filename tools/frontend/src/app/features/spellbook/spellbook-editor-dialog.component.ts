import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { api } from "../../api";
import { createSpellbookDraft } from "../../models/drafts";
import { spellbookDraftToSaveInput, spellbookEntryToDraft } from "../../services/editor-mappers";
import type { SaveErrorResult, SpellbookEntry } from "../../types";
import { ToastService } from "../../shared/toast.service";

export interface SpellbookEditorDialogData {
  mode: "create" | "edit" | "duplicate";
  initial?: SpellbookEntry;
}

@Component({
  selector: "app-spellbook-editor-dialog",
  standalone: true,
  styleUrl: "./spellbook-editor-dialog.component.css",
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
      <form id="spellbook-editor-form" class="form-grid" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>castid</mat-label>
          <input matInput [(ngModel)]="draft().castid" name="castid" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>effectid</mat-label>
          <input matInput [(ngModel)]="draft().effectid" name="effectid" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>cost</mat-label>
          <input matInput [(ngModel)]="draft().cost" name="cost" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>cast</mat-label>
          <input matInput [(ngModel)]="draft().cast" name="cast" type="number" />
        </mat-form-field>
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
      <button mat-flat-button type="submit" form="spellbook-editor-form">保存</button>
    </mat-dialog-actions>
  `
})
export class SpellbookEditorDialogComponent {
  private readonly data = inject<SpellbookEditorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SpellbookEditorDialogComponent>);
  private readonly toast = inject(ToastService);

  readonly mode = signal<"create" | "edit" | "duplicate">(this.data.mode);
  readonly draft = signal(
    this.data.initial
      ? spellbookEntryToDraft(this.data.initial, this.data.mode === "duplicate")
      : createSpellbookDraft()
  );

  cancel(): void {
    this.dialogRef.close("cancel");
  }

  async save(): Promise<void> {
    try {
      await api.saveSpellbook(spellbookDraftToSaveInput(this.draft()));
      this.dialogRef.close("saved");
    } catch (error) {
      const result = error as SaveErrorResult;
      this.toast.error(result.formError ?? "魔法書エントリーの保存に失敗しました。");
    }
  }
}
