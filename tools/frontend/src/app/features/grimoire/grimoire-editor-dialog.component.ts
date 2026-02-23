import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { api } from "../../api";
import { createGrimoireDraft } from "../../models/drafts";
import { grimoireDraftToSaveInput, grimoireEntryToDraft } from "../../services/editor-mappers";
import type { SaveErrorResult, GrimoireEntry } from "../../types";
import { ToastService } from "../../shared/toast.service";

export interface GrimoireEditorDialogData {
  mode: "create" | "edit" | "duplicate";
  initial?: GrimoireEntry;
}

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
      <button mat-flat-button type="submit" form="grimoire-editor-form">保存</button>
    </mat-dialog-actions>
  `
})
export class GrimoireEditorDialogComponent {
  private readonly data = inject<GrimoireEditorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<GrimoireEditorDialogComponent>);
  private readonly toast = inject(ToastService);

  readonly mode = signal<"create" | "edit" | "duplicate">(this.data.mode);
  readonly draft = signal(
    this.data.initial
      ? grimoireEntryToDraft(this.data.initial, this.data.mode === "duplicate")
      : createGrimoireDraft()
  );

  cancel(): void {
    this.dialogRef.close("cancel");
  }

  async save(): Promise<void> {
    try {
      await api.saveGrimoire(grimoireDraftToSaveInput(this.draft()));
      this.dialogRef.close("saved");
    } catch (error) {
      const result = error as SaveErrorResult;
      this.toast.error(result.formError ?? "grimoireエントリーの保存に失敗しました。");
    }
  }
}
