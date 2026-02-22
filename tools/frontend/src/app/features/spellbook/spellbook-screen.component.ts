import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { api } from "../../api";
import { SpellbookEditorDialogComponent } from "./spellbook-editor-dialog.component";
import { StatusMessageComponent } from "../../shared/status-message.component";
import type { SpellbookEntry } from "../../types";

@Component({
  selector: "app-spellbook-screen",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, StatusMessageComponent],
  template: `
    <mat-card appearance="outlined">
      <header class="list-header">
        <h1>魔法書DBエディター</h1>
        <div class="header-actions">
          <button mat-flat-button type="button" (click)="openCreateModal()">エントリー追加</button>
        </div>
      </header>
      <p>設定された保存先パスの魔法書DBエントリーを編集・保存します。</p>

      <div class="spellbook-table-wrap" *ngIf="entries().length > 0; else noEntries">
        <table class="spellbook-table">
          <thead>
            <tr>
              <th>castid</th>
              <th>effectid</th>
              <th>cost</th>
              <th>cast</th>
              <th>タイトル</th>
              <th>説明</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of entries()">
              <td>{{ entry.castid }}</td>
              <td>{{ entry.effectid }}</td>
              <td>{{ entry.cost }}</td>
              <td>{{ entry.cast }}</td>
              <td>{{ entry.title }}</td>
              <td>{{ entry.description }}</td>
              <td>
                <div class="table-actions">
                  <button mat-button type="button" (click)="openEditModal(entry)">編集</button>
                  <button mat-stroked-button type="button" (click)="openDuplicateModal(entry)">複製</button>
                  <button mat-stroked-button type="button" (click)="deleteEntry(entry.id)">削除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ng-template #noEntries><p>魔法書エントリーはまだありません。</p></ng-template>

      <app-status-message [ok]="success()" [err]="error()" />
    </mat-card>
  `
})
export class SpellbookScreenComponent {
  private readonly dialog = inject(MatDialog);

  readonly entries = signal<SpellbookEntry[]>([]);
  readonly message = signal<{ ok?: string; err?: string }>({});

  readonly success = computed(() => this.message().ok ?? "");
  readonly error = computed(() => this.message().err ?? "");

  constructor() {
    void this.reloadEntries();
  }

  async reloadEntries(): Promise<void> {
    const spellbookState = await api.loadSpellbook();
    this.entries.set(spellbookState.entries);
  }

  async openCreateModal(): Promise<void> {
    const ref = this.dialog.open(SpellbookEditorDialogComponent, {
      width: "740px",
      data: { mode: "create" as const }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.message.set({ ok: "魔法書エントリーを保存しました。" });
      await this.reloadEntries();
    }
  }

  async openEditModal(entry: SpellbookEntry): Promise<void> {
    const ref = this.dialog.open(SpellbookEditorDialogComponent, {
      width: "740px",
      data: { mode: "edit" as const, initial: entry }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.message.set({ ok: "魔法書エントリーを保存しました。" });
      await this.reloadEntries();
    }
  }

  async openDuplicateModal(entry: SpellbookEntry): Promise<void> {
    const ref = this.dialog.open(SpellbookEditorDialogComponent, {
      width: "740px",
      data: { mode: "duplicate" as const, initial: entry }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.message.set({ ok: "魔法書エントリーを保存しました。" });
      await this.reloadEntries();
    }
  }

  async deleteEntry(id: string): Promise<void> {
    this.message.set({});
    try {
      await api.deleteSpellbook(id);
      this.message.set({ ok: "魔法書エントリーを削除しました。" });
      await this.reloadEntries();
    } catch {
      this.message.set({ err: "魔法書エントリーの削除に失敗しました。" });
    }
  }
}
