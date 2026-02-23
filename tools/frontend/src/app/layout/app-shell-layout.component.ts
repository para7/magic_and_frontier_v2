import { Component, EventEmitter, Output } from "@angular/core";
import { MatToolbarModule } from "@angular/material/toolbar";
import { ScreenSidebarComponent } from "./screen-sidebar.component";

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
        <app-screen-sidebar
          (save)="saveRequested.emit()"
        />

        <main class="container">
          <ng-content />
        </main>
      </div>
    </div>
  `
})
export class AppShellLayoutComponent {
  @Output() readonly saveRequested = new EventEmitter<void>();
}
