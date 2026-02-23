import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { ApiService } from "../../api";
import { createEnemySkillDraft } from "../../models/drafts";
import { enemySkillDraftToSaveInput, enemySkillEntryToDraft } from "../../services/editor-mappers";
import { ToastService } from "../../shared/toast.service";
import type { EnemySkillEntry, SaveErrorResult } from "../../types";

export interface EnemySkillEditorDialogData {
  mode: "create" | "edit" | "duplicate";
  initial?: EnemySkillEntry;
}

@Component({
  selector: "app-enemy-skill-editor-dialog",
  standalone: true,
  styleUrl: "./enemy-skill-editor-dialog.component.css",
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ mode() === "edit" ? "enemy_skill編集" : "enemy_skill追加" }}</h2>
    <mat-dialog-content>
      <form id="enemy-skill-editor-form" class="form-grid" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>name</mat-label>
          <input matInput [(ngModel)]="draft().name" name="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>cooldown</mat-label>
          <input matInput [(ngModel)]="draft().cooldown" name="cooldown" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-span-2">
          <mat-label>trigger</mat-label>
          <mat-select [(ngModel)]="draft().trigger" name="trigger">
            <mat-option [value]="''">未指定</mat-option>
            <mat-option value="on_spawn">on_spawn</mat-option>
            <mat-option value="on_hit">on_hit</mat-option>
            <mat-option value="on_low_hp">on_low_hp</mat-option>
            <mat-option value="on_timer">on_timer</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-span-2">
          <mat-label>script</mat-label>
          <textarea matInput [(ngModel)]="draft().script" name="script" rows="8"></textarea>
        </mat-form-field>
        <p class="status-error form-span-2" *ngIf="fieldErrors()['name']">{{ fieldErrors()["name"] }}</p>
        <p class="status-error form-span-2" *ngIf="fieldErrors()['script']">{{ fieldErrors()["script"] }}</p>
        <p class="status-error form-span-2" *ngIf="fieldErrors()['cooldown']">
          {{ fieldErrors()["cooldown"] }}
        </p>
        <p class="status-error form-span-2" *ngIf="fieldErrors()['trigger']">{{ fieldErrors()["trigger"] }}</p>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">キャンセル</button>
      <button mat-flat-button type="submit" form="enemy-skill-editor-form">保存</button>
    </mat-dialog-actions>
  `
})
export class EnemySkillEditorDialogComponent {
  private readonly data = inject<EnemySkillEditorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EnemySkillEditorDialogComponent>);
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);

  readonly mode = signal<"create" | "edit" | "duplicate">(this.data.mode);
  readonly draft = signal(
    this.data.initial
      ? enemySkillEntryToDraft(this.data.initial, this.data.mode === "duplicate")
      : createEnemySkillDraft()
  );
  readonly fieldErrors = signal<Record<string, string>>({});

  cancel(): void {
    this.dialogRef.close("cancel");
  }

  async save(): Promise<void> {
    this.fieldErrors.set({});
    try {
      await this.api.saveEnemySkill(enemySkillDraftToSaveInput(this.draft()));
      this.dialogRef.close("saved");
    } catch (error) {
      const result = error as SaveErrorResult;
      this.fieldErrors.set(result.fieldErrors ?? {});
      this.toast.error(result.formError ?? "enemy_skillエントリーの保存に失敗しました。");
    }
  }
}
