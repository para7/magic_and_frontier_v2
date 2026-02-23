import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { api } from "../../api";
import { createSkillDraft } from "../../models/drafts";
import { skillDraftToSaveInput, skillEntryToDraft } from "../../services/editor-mappers";
import { ReferencePickerComponent } from "../../shared/reference-picker.component";
import { ToastService } from "../../shared/toast.service";
import type { ItemEntry, ReferenceOption, SaveErrorResult, SkillEntry } from "../../types";

export interface SkillEditorDialogData {
  mode: "create" | "edit" | "duplicate";
  initial?: SkillEntry;
}

@Component({
  selector: "app-skill-editor-dialog",
  standalone: true,
  styleUrl: "./skill-editor-dialog.component.css",
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReferencePickerComponent
  ],
  template: `
    <h2 mat-dialog-title>{{ mode() === "edit" ? "skill編集" : "skill追加" }}</h2>
    <mat-dialog-content>
      <form id="skill-editor-form" class="form-grid" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>name</mat-label>
          <input matInput [(ngModel)]="draft().name" name="name" />
        </mat-form-field>
        <app-reference-picker
          label="item参照"
          [value]="draft().itemId"
          [options]="itemOptions()"
          (valueChange)="onItemChange($event)"
        />
        <p class="status-error form-span-2" *ngIf="fieldErrors()['itemId']">{{ fieldErrors()["itemId"] }}</p>
        <mat-form-field appearance="outline" class="form-span-2">
          <mat-label>script</mat-label>
          <textarea matInput [(ngModel)]="draft().script" name="script" rows="8"></textarea>
        </mat-form-field>
        <p class="status-error form-span-2" *ngIf="fieldErrors()['name']">{{ fieldErrors()["name"] }}</p>
        <p class="status-error form-span-2" *ngIf="fieldErrors()['script']">{{ fieldErrors()["script"] }}</p>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">キャンセル</button>
      <button mat-flat-button type="submit" form="skill-editor-form">保存</button>
    </mat-dialog-actions>
  `
})
export class SkillEditorDialogComponent {
  private readonly data = inject<SkillEditorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SkillEditorDialogComponent>);
  private readonly toast = inject(ToastService);

  readonly mode = signal<"create" | "edit" | "duplicate">(this.data.mode);
  readonly draft = signal(
    this.data.initial ? skillEntryToDraft(this.data.initial, this.data.mode === "duplicate") : createSkillDraft()
  );
  readonly itemEntries = signal<ItemEntry[]>([]);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly itemOptions = computed<ReferenceOption[]>(() =>
    this.itemEntries().map((item) => ({ id: item.id, label: item.itemId }))
  );

  constructor() {
    void this.loadItems();
  }

  cancel(): void {
    this.dialogRef.close("cancel");
  }

  onItemChange(itemId: string): void {
    this.draft.update((current) => ({ ...current, itemId }));
  }

  async loadItems(): Promise<void> {
    try {
      const state = await api.loadItems();
      this.itemEntries.set(state.items);
      if (!this.draft().itemId && state.items[0]) {
        this.onItemChange(state.items[0].id);
      }
    } catch {
      this.toast.error("item参照一覧の読み込みに失敗しました。");
    }
  }

  async save(): Promise<void> {
    this.fieldErrors.set({});
    try {
      await api.saveSkill(skillDraftToSaveInput(this.draft()));
      this.dialogRef.close("saved");
    } catch (error) {
      const result = error as SaveErrorResult;
      this.fieldErrors.set(result.fieldErrors ?? {});
      this.toast.error(result.formError ?? "skillエントリーの保存に失敗しました。");
    }
  }
}
