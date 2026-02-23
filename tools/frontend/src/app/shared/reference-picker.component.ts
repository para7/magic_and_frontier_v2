import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import type { ReferenceOption } from "../types";

@Component({
  selector: "app-reference-picker",
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule],
  styleUrl: "./reference-picker.component.css",
  template: `
    <mat-form-field appearance="outline">
      <mat-label>{{ label }}</mat-label>
      <mat-select
        [disabled]="disabled || options.length === 0"
        [ngModel]="value"
        (ngModelChange)="valueChange.emit($event)"
      >
        <mat-option *ngFor="let option of options" [value]="option.id">
          <div class="picker-option">
            <span>{{ option.label }}</span>
            <small>{{ option.id }}</small>
          </div>
        </mat-option>
      </mat-select>
    </mat-form-field>
  `
})
export class ReferencePickerComponent {
  @Input({ required: true }) label!: string;
  @Input() value = "";
  @Input() options: ReferenceOption[] = [];
  @Input() disabled = false;
  @Output() readonly valueChange = new EventEmitter<string>();
}
