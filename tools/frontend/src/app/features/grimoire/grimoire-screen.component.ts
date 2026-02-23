import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../api";
import { GrimoireEditorDialogComponent } from "./grimoire-editor-dialog.component";
import { ToastService } from "../../shared/toast.service";
import type { GrimoireEntry } from "../../types";

@Component({
  selector: "app-grimoire-screen",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  styleUrl: "./grimoire-screen.component.css",
  template: `
    <mat-card appearance="outlined">
      <header class="list-header">
        <h1>grimoireDBエディター</h1>
        <div class="header-actions">
          <button mat-flat-button type="button" (click)="openCreateModal()">エントリー追加</button>
        </div>
      </header>

      <div class="grimoire-table-wrap">
        <table class="grimoire-table">
          <thead>
            <tr>
              <th>castid</th>
              <th>script</th>
              <th>詠唱設定</th>
              <th>タイトル</th>
              <th>説明</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of entries()">
              <td>{{ entry.castid }}</td>
              <td>{{ entry.script }}</td>
              <td>
                <div *ngFor="let variant of entry.variants">
                  cast: {{ variant.cast }} / cost: {{ variant.cost }}
                </div>
              </td>
              <td>{{ entry.title }}</td>
              <td>{{ entry.description }}</td>
              <td>
                <div class="table-actions">
                  <button mat-button type="button" (click)="openEditModal(entry)">編集</button>
                  <button mat-stroked-button type="button" (click)="openDuplicateModal(entry)">
                    複製
                  </button>
                  <button mat-stroked-button type="button" (click)="deleteEntry(entry.id)">
                    削除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </mat-card>
  `
})
export class GrimoireScreenComponent {
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);

  readonly entries = signal<GrimoireEntry[]>([]);

  constructor() {
    void this.reloadEntries();
  }

  async reloadEntries(): Promise<void> {
    try {
      const grimoireState = await this.api.loadGrimoire();
      this.entries.set(grimoireState.entries);
    } catch {
      this.toast.error("grimoireエントリー一覧の読み込みに失敗しました。");
    }
  }

  async openCreateModal(): Promise<void> {
    const ref = this.dialog.open(GrimoireEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "create" as const }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.toast.success("grimoireエントリーを保存しました。");
      await this.reloadEntries();
    }
  }

  async openEditModal(entry: GrimoireEntry): Promise<void> {
    const ref = this.dialog.open(GrimoireEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "edit" as const, initial: entry }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.toast.success("grimoireエントリーを保存しました。");
      await this.reloadEntries();
    }
  }

  async openDuplicateModal(entry: GrimoireEntry): Promise<void> {
    const ref = this.dialog.open(GrimoireEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "duplicate" as const, initial: entry }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.toast.success("grimoireエントリーを保存しました。");
      await this.reloadEntries();
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      await this.api.deleteGrimoire(id);
      this.toast.success("grimoireエントリーを削除しました。");
      await this.reloadEntries();
    } catch {
      this.toast.error("grimoireエントリーの削除に失敗しました。");
    }
  }
}
