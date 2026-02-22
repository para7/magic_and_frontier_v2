import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatToolbarModule } from "@angular/material/toolbar";
import { ScreenSidebarComponent } from "./screen-sidebar.component";
import type { AppScreen } from "../types";

@Component({
  selector: "app-shell-layout",
  standalone: true,
  imports: [MatToolbarModule, ScreenSidebarComponent],
  styleUrl: "./app-shell-layout.component.css",
  template: `
    <div class="app-shell">
      <mat-toolbar class="site-header" role="banner">
        <span class="site-title">MAF Command Editor</span>
      </mat-toolbar>

      <div class="app-layout">
        <app-screen-sidebar [screen]="screen" (switch)="screenChange.emit($event)" />

        <main class="container">
          <ng-content />
        </main>
      </div>
    </div>
  `
})
export class AppShellLayoutComponent {
  @Input({ required: true }) screen!: AppScreen;
  @Output() readonly screenChange = new EventEmitter<AppScreen>();
}
