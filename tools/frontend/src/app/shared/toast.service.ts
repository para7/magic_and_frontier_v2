import { Injectable, inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";

type ToastLevel = "success" | "error" | "info";

@Injectable({ providedIn: "root" })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, "success");
  }

  error(message: string): void {
    this.open(message, "error");
  }

  info(message: string): void {
    this.open(message, "info");
  }

  private open(message: string, level: ToastLevel): void {
    const panelClass =
      level === "success" ? "app-toast-success" : level === "error" ? "app-toast-error" : "app-toast-info";
    this.snackBar.open(message, "閉じる", {
      duration: level === "error" ? 4500 : 2800,
      horizontalPosition: "right",
      verticalPosition: "top",
      panelClass
    });
  }
}
