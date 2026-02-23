import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ApiService } from "./api";
import { AppShellLayoutComponent } from "./layout/app-shell-layout.component";
import { ToastService } from "./shared/toast.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [AppShellLayoutComponent, RouterOutlet],
  template: `
    <app-shell-layout (saveRequested)="requestSave()">
      <router-outlet />
    </app-shell-layout>
  `
})
export class AppComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  async requestSave(): Promise<void> {
    try {
      const result = await this.api.saveData();
      this.toast.success(`保存処理を受け付けました: ${result.message}`);
    } catch (error) {
      console.error("save request failed:", error);
      this.toast.error("データ保存の実行に失敗しました。");
    }
  }
}
