import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { api } from "./api";
import { AppShellLayoutComponent } from "./layout/app-shell-layout.component";
import { ItemScreenComponent } from "./features/item/item-screen.component";
import { GrimoireScreenComponent } from "./features/grimoire/grimoire-screen.component";
import { SkillScreenComponent } from "./features/skill/skill-screen.component";
import { EnemySkillScreenComponent } from "./features/enemy-skill/enemy-skill-screen.component";
import { EnemyScreenComponent } from "./features/enemy/enemy-screen.component";
import { TreasureScreenComponent } from "./features/treasure/treasure-screen.component";
import { ToastService } from "./shared/toast.service";
import type { AppScreen } from "./types";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    AppShellLayoutComponent,
    ItemScreenComponent,
    GrimoireScreenComponent,
    SkillScreenComponent,
    EnemySkillScreenComponent,
    EnemyScreenComponent,
    TreasureScreenComponent
  ],
  template: `
    <app-shell-layout
      [screen]="screen()"
      (screenChange)="switchScreen($event)"
      (saveRequested)="requestSave()"
    >
      <app-item-screen *ngIf="screen() === 'item'" />
      <app-grimoire-screen *ngIf="screen() === 'grimoire'" />
      <app-skill-screen *ngIf="screen() === 'skill'" />
      <app-enemy-skill-screen *ngIf="screen() === 'enemySkill'" />
      <app-enemy-screen *ngIf="screen() === 'enemy'" />
      <app-treasure-screen *ngIf="screen() === 'treasure'" />
    </app-shell-layout>
  `
})
export class AppComponent {
  private readonly toast = inject(ToastService);

  readonly screen = signal<AppScreen>("item");

  switchScreen(screen: AppScreen): void {
    this.screen.set(screen);
  }

  async requestSave(): Promise<void> {
    try {
      const result = await api.saveData();
      this.toast.success(`保存処理を受け付けました: ${result.message}`);
    } catch (error) {
      console.error("save request failed:", error);
      this.toast.error("データ保存の実行に失敗しました。");
    }
  }
}
