import { CommonModule } from "@angular/common";
import { Component, signal } from "@angular/core";
import { AppShellLayoutComponent } from "./layout/app-shell-layout.component";
import { ItemScreenComponent } from "./features/item/item-screen.component";
import { SpellbookScreenComponent } from "./features/spellbook/spellbook-screen.component";
import type { AppScreen } from "./types";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, AppShellLayoutComponent, ItemScreenComponent, SpellbookScreenComponent],
  template: `
    <app-shell-layout [screen]="screen()" (screenChange)="switchScreen($event)">
      <app-item-screen *ngIf="screen() === 'item'" />
      <app-spellbook-screen *ngIf="screen() === 'spellbook'" />
    </app-shell-layout>
  `
})
export class AppComponent {
  readonly screen = signal<AppScreen>("item");

  switchScreen(screen: AppScreen): void {
    this.screen.set(screen);
  }
}
