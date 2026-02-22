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
          [class.active-nav]="screen === 'spellbook'"
          (click)="switch.emit('spellbook')"
        >
          魔法書DB
        </button>
      </nav>
    </aside>
  `
})
export class ScreenSidebarComponent {
  @Input({ required: true }) screen!: AppScreen;
  @Output() readonly switch = new EventEmitter<AppScreen>();
}
