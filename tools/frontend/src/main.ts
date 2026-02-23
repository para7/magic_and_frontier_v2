import { importProvidersFrom } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { AppComponent } from "./app/app.component";

bootstrapApplication(AppComponent, {
  providers: [provideAnimations(), importProvidersFrom(MatSnackBarModule)]
}).catch((error) => {
  console.error(error);
});
