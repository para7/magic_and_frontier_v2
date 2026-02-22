import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
  selector: "app-status-message",
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="status-error" *ngIf="err">{{ err }}</p>
    <p class="status-ok" *ngIf="ok">{{ ok }}</p>
  `
})
export class StatusMessageComponent {
  @Input() ok = "";
  @Input() err = "";
}
