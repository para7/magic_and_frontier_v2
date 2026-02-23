import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import type { AppScreen } from "../types";

@Component({
  selector: "app-screen-sidebar",
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  styleUrl: "./screen-sidebar.component.css",
  template: `
    <aside class="site-sidebar" aria-label="画面切り替え">
      <nav class="sidebar-nav">
        <button
          mat-button
          class="sidebar-link"
          [class.active-nav]="screen === 'item'"
          (click)="switch.emit('item')"
        >
          アイテム
        </button>
        <button
          mat-button
          class="sidebar-link"
          [class.active-nav]="screen === 'grimoire'"
          (click)="switch.emit('grimoire')"
        >
          grimoireDB
        </button>
      </nav>
      <div class="sidebar-actions">
        <button mat-flat-button class="save-button" (click)="save.emit()">
          データ保存
        </button>
      </div>
    </aside>
  `
})
export class ScreenSidebarComponent {
  @Input({ required: true }) screen!: AppScreen;
  @Output() readonly switch = new EventEmitter<AppScreen>();
  @Output() readonly save = new EventEmitter<void>();
}
