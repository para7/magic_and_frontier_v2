import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { api } from "../../api";
import { createEnemyDraft } from "../../models/drafts";
import { enemyDraftToSaveInput, enemyEntryToDraft } from "../../services/editor-mappers";
import { ToastService } from "../../shared/toast.service";
import type { EnemyEntry, EnemySkillEntry, ReferenceOption, SaveErrorResult } from "../../types";

export interface EnemyEditorDialogData {
  mode: "create" | "edit" | "duplicate";
  initial?: EnemyEntry;
}

@Component({
  selector: "app-enemy-editor-dialog",
  standalone: true,
  styleUrl: "./enemy-editor-dialog.component.css",
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
    <h2 mat-dialog-title>{{ mode() === "edit" ? "enemy編集" : "enemy追加" }}</h2>
    <mat-dialog-content>
      <form id="enemy-editor-form" class="form-grid" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>name</mat-label>
          <input matInput [(ngModel)]="draft().name" name="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>hp</mat-label>
          <input matInput [(ngModel)]="draft().hp" name="hp" type="number" min="1" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>attack</mat-label>
          <input matInput [(ngModel)]="draft().attack" name="attack" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>defense</mat-label>
          <input matInput [(ngModel)]="draft().defense" name="defense" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>moveSpeed</mat-label>
          <input matInput [(ngModel)]="draft().moveSpeed" name="moveSpeed" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>dropTableId</mat-label>
          <input matInput [(ngModel)]="draft().dropTableId" name="dropTableId" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-span-2">
          <mat-label>enemy_skill参照</mat-label>
          <mat-select
            [ngModel]="draft().enemySkillIds"
            name="enemySkillIds"
            multiple
            (ngModelChange)="onEnemySkillsChange($event)"
          >
            <mat-option *ngFor="let option of enemySkillOptions()" [value]="option.id">
              <div class="picker-option">
                <span>{{ option.label }}</span>
                <small>{{ option.id }}</small>
              </div>
            </mat-option>
          </mat-select>
        </mat-form-field>

        <section class="grid-subtitle form-span-2">spawnRule.origin</section>
        <mat-form-field appearance="outline">
          <mat-label>origin.x</mat-label>
          <input matInput [(ngModel)]="draft().originX" name="originX" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>origin.y</mat-label>
          <input matInput [(ngModel)]="draft().originY" name="originY" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-span-2">
          <mat-label>origin.z</mat-label>
          <input matInput [(ngModel)]="draft().originZ" name="originZ" type="number" />
        </mat-form-field>

        <section class="grid-subtitle form-span-2">spawnRule.distance</section>
        <mat-form-field appearance="outline">
          <mat-label>distance.min</mat-label>
          <input matInput [(ngModel)]="draft().distanceMin" name="distanceMin" type="number" min="0" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>distance.max</mat-label>
          <input matInput [(ngModel)]="draft().distanceMax" name="distanceMax" type="number" min="0" />
        </mat-form-field>

        <section class="grid-subtitle form-span-2">spawnRule.axisBounds (optional)</section>
        <mat-form-field appearance="outline">
          <mat-label>xMin</mat-label>
          <input matInput [(ngModel)]="draft().xMin" name="xMin" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>xMax</mat-label>
          <input matInput [(ngModel)]="draft().xMax" name="xMax" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>yMin</mat-label>
          <input matInput [(ngModel)]="draft().yMin" name="yMin" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>yMax</mat-label>
          <input matInput [(ngModel)]="draft().yMax" name="yMax" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>zMin</mat-label>
          <input matInput [(ngModel)]="draft().zMin" name="zMin" type="number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>zMax</mat-label>
          <input matInput [(ngModel)]="draft().zMax" name="zMax" type="number" />
        </mat-form-field>

        <p class="status-error form-span-2" *ngFor="let key of errorKeys()">{{ fieldErrors()[key] }}</p>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">キャンセル</button>
      <button mat-flat-button type="submit" form="enemy-editor-form">保存</button>
    </mat-dialog-actions>
  `
})
export class EnemyEditorDialogComponent {
  private readonly data = inject<EnemyEditorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EnemyEditorDialogComponent>);
  private readonly toast = inject(ToastService);

  readonly mode = signal<"create" | "edit" | "duplicate">(this.data.mode);
  readonly draft = signal(
    this.data.initial
      ? enemyEntryToDraft(this.data.initial, this.data.mode === "duplicate")
      : createEnemyDraft()
  );
  readonly enemySkills = signal<EnemySkillEntry[]>([]);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly enemySkillOptions = computed<ReferenceOption[]>(() =>
    this.enemySkills().map((entry) => ({ id: entry.id, label: entry.name }))
  );
  readonly errorKeys = computed(() => Object.keys(this.fieldErrors()));

  constructor() {
    this.draft.update((current) => ({
      ...current,
      dropTableId: current.dropTableId || current.id
    }));
    void this.loadEnemySkills();
  }

  cancel(): void {
    this.dialogRef.close("cancel");
  }

  onEnemySkillsChange(enemySkillIds: string[]): void {
    this.draft.update((current) => ({ ...current, enemySkillIds }));
  }

  async loadEnemySkills(): Promise<void> {
    try {
      const state = await api.loadEnemySkills();
      this.enemySkills.set(state.entries);
    } catch {
      this.toast.error("enemy_skill参照一覧の読み込みに失敗しました。");
    }
  }

  async save(): Promise<void> {
    this.fieldErrors.set({});
    try {
      await api.saveEnemy(enemyDraftToSaveInput(this.draft()));
      this.dialogRef.close("saved");
    } catch (error) {
      const result = error as SaveErrorResult;
      this.fieldErrors.set(result.fieldErrors ?? {});
      this.toast.error(result.formError ?? "enemyエントリーの保存に失敗しました。");
    }
  }
}
