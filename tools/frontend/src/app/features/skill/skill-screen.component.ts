import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../api";
import type { ItemEntry, SkillEntry } from "../../types";
import { ToastService } from "../../shared/toast.service";
import { SkillEditorDialogComponent } from "./skill-editor-dialog.component";

@Component({
  selector: "app-skill-screen",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  styleUrl: "./skill-screen.component.css",
  template: `
    <mat-card appearance="outlined">
      <header class="list-header">
        <h1>skillエディター</h1>
        <button mat-flat-button type="button" (click)="openCreateModal()">エントリー追加</button>
      </header>

      <div class="table-wrap">
        <table class="list-table">
          <thead>
            <tr>
              <th class="no-col">No.</th>
              <th>name</th>
              <th>itemRef</th>
              <th>script</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of pagedEntries(); let i = index">
              <td class="no-col">{{ pageStartIndex() + i + 1 }}</td>
              <td>{{ entry.name }}</td>
              <td>{{ resolveItemLabel(entry.itemId) }}</td>
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

      <div class="header-actions" *ngIf="totalPages() > 1">
        <button mat-stroked-button type="button" (click)="prevPage()" [disabled]="currentPage() === 0">
          前へ
        </button>
        <span>{{ currentPage() + 1 }} / {{ totalPages() }} ({{ entries().length }}件)</span>
        <button
          mat-stroked-button
          type="button"
          (click)="nextPage()"
          [disabled]="currentPage() >= totalPages() - 1"
        >
          次へ
        </button>
      </div>
    </mat-card>
  `
})
export class SkillScreenComponent {
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);

  readonly pageSize = 50;
  readonly entries = signal<SkillEntry[]>([]);
  readonly itemIndex = signal<Record<string, string>>({});
  readonly currentPage = signal(0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.entries().length / this.pageSize)));
  readonly pageStartIndex = computed(() => this.currentPage() * this.pageSize);
  readonly pagedEntries = computed(() =>
    this.entries().slice(this.pageStartIndex(), this.pageStartIndex() + this.pageSize)
  );

  constructor() {
    void this.reloadAll();
  }

  async reloadAll(): Promise<void> {
    await Promise.all([this.reloadEntries(), this.reloadItems()]);
  }

  async reloadEntries(): Promise<void> {
    try {
      const state = await this.api.loadSkills();
      this.entries.set(state.entries);
      this.ensureValidPage();
    } catch {
      this.toast.error("skillエントリー一覧の読み込みに失敗しました。");
    }
  }

  prevPage(): void {
    this.currentPage.update((page) => Math.max(0, page - 1));
  }

  nextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages() - 1, page + 1));
  }

  async reloadItems(): Promise<void> {
    try {
      const state = await this.api.loadItems();
      this.itemIndex.set(toItemLabelMap(state.items));
    } catch {
      this.toast.error("item参照一覧の読み込みに失敗しました。");
    }
  }

  resolveItemLabel(itemId: string): string {
    return this.itemIndex()[itemId] ?? `(未解決) ${itemId}`;
  }

  async openCreateModal(): Promise<void> {
    const ref = this.dialog.open(SkillEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "create" as const }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.toast.success("skillエントリーを保存しました。");
      await this.reloadAll();
    }
  }

  async openEditModal(entry: SkillEntry): Promise<void> {
    const ref = this.dialog.open(SkillEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "edit" as const, initial: entry }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.toast.success("skillエントリーを保存しました。");
      await this.reloadAll();
    }
  }

  async openDuplicateModal(entry: SkillEntry): Promise<void> {
    const ref = this.dialog.open(SkillEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "duplicate" as const, initial: entry }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.toast.success("skillエントリーを保存しました。");
      await this.reloadAll();
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      await this.api.deleteSkill(id);
      this.toast.success("skillエントリーを削除しました。");
      await this.reloadEntries();
    } catch {
      this.toast.error("skillエントリーの削除に失敗しました。");
    }
  }

  private ensureValidPage(): void {
    const lastPage = this.totalPages() - 1;
    if (this.currentPage() > lastPage) {
      this.currentPage.set(lastPage);
    }
  }
}

function toItemLabelMap(items: ItemEntry[]): Record<string, string> {
  return Object.fromEntries(items.map((item) => [item.id, `${item.itemId}`]));
}
