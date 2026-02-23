import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: "app-screen-sidebar",
  standalone: true,
  imports: [CommonModule, MatButtonModule, RouterLink, RouterLinkActive],
  styleUrl: "./screen-sidebar.component.css",
  template: `
    <aside class="site-sidebar" aria-label="画面切り替え">
      <nav class="sidebar-nav">
        <button
          mat-button
          class="sidebar-link"
          routerLink="/items"
          routerLinkActive="active-nav"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          アイテム
        </button>
        <button
          mat-button
          class="sidebar-link"
          routerLink="/grimoire"
          routerLinkActive="active-nav"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          grimoireDB
        </button>
        <button
          mat-button
          class="sidebar-link"
          routerLink="/skills"
          routerLinkActive="active-nav"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          skill
        </button>
        <button
          mat-button
          class="sidebar-link"
          routerLink="/enemy-skills"
          routerLinkActive="active-nav"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          enemy_skill
        </button>
        <button
          mat-button
          class="sidebar-link"
          routerLink="/enemies"
          routerLinkActive="active-nav"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          enemy
        </button>
        <button
          mat-button
          class="sidebar-link"
          routerLink="/treasures"
          routerLinkActive="active-nav"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          treasure
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
  @Output() readonly save = new EventEmitter<void>();
}
