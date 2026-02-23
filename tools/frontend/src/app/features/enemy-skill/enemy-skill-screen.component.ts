import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { api } from "../../api";
import { ToastService } from "../../shared/toast.service";
import type { EnemySkillEntry } from "../../types";
import { EnemySkillEditorDialogComponent } from "./enemy-skill-editor-dialog.component";

@Component({
  selector: "app-enemy-skill-screen",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  styleUrl: "./enemy-skill-screen.component.css",
  template: `
    <mat-card appearance="outlined">
      <header class="list-header">
        <h1>enemy_skillエディター</h1>
        <button mat-flat-button type="button" (click)="openCreateModal()">エントリー追加</button>
      </header>

      <div class="table-wrap">
        <table class="list-table">
          <thead>
            <tr>
              <th>name</th>
              <th>trigger</th>
              <th>cooldown</th>
              <th>script</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of entries()">
              <td>{{ entry.name }}</td>
              <td>{{ entry.trigger ?? "-" }}</td>
              <td>{{ entry.cooldown ?? "-" }}</td>
              <td><code class="code-preview">{{ entry.script }}</code></td>
              <td>
                <div class="table-actions">
                  <button mat-button type="button" (click)="openEditModal(entry)">編集</button>
                  <button mat-stroked-button type="button" (click)="openDuplicateModal(entry)">
                    複製
                  </button>
                  <button mat-stroked-button type="button" (click)="deleteEntry(entry.id)">削除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </mat-card>
  `
})
export class EnemySkillScreenComponent {
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly entries = signal<EnemySkillEntry[]>([]);

  constructor() {
    void this.reloadEntries();
  }

  async reloadEntries(): Promise<void> {
    try {
      const state = await api.loadEnemySkills();
      this.entries.set(state.entries);
    } catch {
      this.toast.error("enemy_skillエントリー一覧の読み込みに失敗しました。");
    }
  }

  async openCreateModal(): Promise<void> {
    const ref = this.dialog.open(EnemySkillEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "create" as const }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.toast.success("enemy_skillエントリーを保存しました。");
      await this.reloadEntries();
    }
  }

  async openEditModal(entry: EnemySkillEntry): Promise<void> {
    const ref = this.dialog.open(EnemySkillEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "edit" as const, initial: entry }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.toast.success("enemy_skillエントリーを保存しました。");
      await this.reloadEntries();
    }
  }

  async openDuplicateModal(entry: EnemySkillEntry): Promise<void> {
    const ref = this.dialog.open(EnemySkillEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "duplicate" as const, initial: entry }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.toast.success("enemy_skillエントリーを保存しました。");
      await this.reloadEntries();
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      await api.deleteEnemySkill(id);
      this.toast.success("enemy_skillエントリーを削除しました。");
      await this.reloadEntries();
    } catch {
      this.toast.error("enemy_skillエントリーの削除に失敗しました。");
    }
  }
}
