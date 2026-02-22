import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { api } from "../../api";
import { ItemEditorDialogComponent } from "./item-editor-dialog.component";
import { StatusMessageComponent } from "../../shared/status-message.component";
import type { ItemEntry } from "../../types";

@Component({
  selector: "app-item-screen",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, StatusMessageComponent],
  styleUrl: "./item-screen.component.css",
  template: `
    <mat-card appearance="outlined">
      <header class="list-header">
        <h1>アイテムNBTエディター</h1>
        <button mat-flat-button type="button" (click)="openCreateModal()">アイテム追加</button>
      </header>
      <p>設定された保存先パスから読み込み・保存を行います。</p>

      <ul class="item-list" *ngIf="items().length > 0; else noItems">
        <li class="item-row" *ngFor="let item of items()">
          <div class="item-main">
            <strong>{{ item.itemId }}</strong>
            <small>個数: {{ item.count }}</small>
            <code class="nbt-preview">{{ item.nbt }}</code>
          </div>
          <div class="item-actions">
            <button mat-button type="button" (click)="openEditModal(item)">編集</button>
            <button mat-stroked-button type="button" (click)="deleteItem(item.id)">削除</button>
          </div>
        </li>
      </ul>
      <ng-template #noItems><p>アイテムはまだありません。</p></ng-template>

      <app-status-message [ok]="success()" [err]="error()" />
    </mat-card>
  `
})
export class ItemScreenComponent {
  private readonly dialog = inject(MatDialog);

  readonly items = signal<ItemEntry[]>([]);
  readonly message = signal<{ ok?: string; err?: string }>({});

  readonly success = computed(() => this.message().ok ?? "");
  readonly error = computed(() => this.message().err ?? "");

  constructor() {
    void this.reloadItems();
  }

  async reloadItems(): Promise<void> {
    const itemState = await api.loadItems();
    this.items.set(itemState.items);
  }

  async openCreateModal(): Promise<void> {
    const ref = this.dialog.open(ItemEditorDialogComponent, {
      width: "90vw",
      maxWidth: "90vw",
      data: { mode: "create" as const }
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === "saved") {
      this.message.set({ ok: "アイテムを保存しました。" });
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
      this.message.set({ ok: "アイテムを保存しました。" });
      await this.reloadItems();
    }
  }

  async deleteItem(id: string): Promise<void> {
    this.message.set({});
    try {
      await api.deleteItem(id);
      this.message.set({ ok: "アイテムを削除しました。" });
      await this.reloadItems();
    } catch {
      this.message.set({ err: "アイテムの削除に失敗しました。" });
    }
  }
}
