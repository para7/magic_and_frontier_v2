import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../api";
import { ItemEditorDialogComponent } from "./item-editor-dialog.component";
import { ToastService } from "../../shared/toast.service";
import type { ItemEntry } from "../../types";

@Component({
  selector: "app-item-screen",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  styleUrl: "./item-screen.component.css",
  template: `
    <mat-card appearance="outlined">
      <header class="list-header">
        <h1>アイテムNBTエディター</h1>
        <div class="header-actions">
          <button mat-flat-button type="button" (click)="openCreateModal()">アイテム追加</button>
        </div>
      </header>

      <ul class="item-list">
        <li class="item-row" *ngFor="let item of pagedItems(); let i = index">
          <span class="item-no">{{ pageStartIndex() + i + 1 }}.</span>
          <div class="item-main">
            <strong>{{ resolveItemTitle(item) }}</strong>
            <small>個数: {{ item.count }}</small>
            <code class="nbt-preview">{{ item.nbt }}</code>
          </div>
          <div class="item-actions">
            <button mat-button type="button" (click)="openEditModal(item)">編集</button>
            <button mat-stroked-button type="button" (click)="deleteItem(item.id)">削除</button>
          </div>
        </li>
      </ul>

      <div class="header-actions" *ngIf="totalPages() > 1">
        <button mat-stroked-button type="button" (click)="prevPage()" [disabled]="currentPage() === 0">
          前へ
        </button>
        <span>{{ currentPage() + 1 }} / {{ totalPages() }} ({{ items().length }}件)</span>
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
export class ItemScreenComponent {
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);

  readonly pageSize = 50;
  readonly items = signal<ItemEntry[]>([]);
  readonly currentPage = signal(0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.items().length / this.pageSize)));
  readonly pageStartIndex = computed(() => this.currentPage() * this.pageSize);
  readonly pagedItems = computed(() =>
    this.items().slice(this.pageStartIndex(), this.pageStartIndex() + this.pageSize)
  );

  constructor() {
    void this.reloadItems();
  }

  async reloadItems(): Promise<void> {
    try {
      const itemState = await this.api.loadItems();
      this.items.set(itemState.items);
      this.ensureValidPage();
    } catch {
      this.toast.error("アイテム一覧の読み込みに失敗しました。");
    }
  }

  prevPage(): void {
    this.currentPage.update((page) => Math.max(0, page - 1));
  }

  nextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages() - 1, page + 1));
  }

  async openCreateModal(): Promise<void> {
    const ref = this.dialog.open(ItemEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "create" as const }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.toast.success("アイテムを保存しました。");
      await this.reloadItems();
    }
  }

  async openEditModal(item: ItemEntry): Promise<void> {
    const ref = this.dialog.open(ItemEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "edit" as const, initial: item }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.toast.success("アイテムを保存しました。");
      await this.reloadItems();
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      await this.api.deleteItem(id);
      this.toast.success("アイテムを削除しました。");
      await this.reloadItems();
    } catch {
      this.toast.error("アイテムの削除に失敗しました。");
    }
  }

  resolveItemTitle(item: ItemEntry): string {
    const customName = item.customName.trim();
    return customName.length > 0 ? customName : item.itemId;
  }

  private ensureValidPage(): void {
    const lastPage = this.totalPages() - 1;
    if (this.currentPage() > lastPage) {
      this.currentPage.set(lastPage);
    }
  }
}
