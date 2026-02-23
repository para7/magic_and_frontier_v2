import type { Routes } from "@angular/router";
import { EnemyScreenComponent } from "./features/enemy/enemy-screen.component";
import { EnemySkillScreenComponent } from "./features/enemy-skill/enemy-skill-screen.component";
import { GrimoireScreenComponent } from "./features/grimoire/grimoire-screen.component";
import { ItemScreenComponent } from "./features/item/item-screen.component";
import { SkillScreenComponent } from "./features/skill/skill-screen.component";
import { TreasureScreenComponent } from "./features/treasure/treasure-screen.component";

export const APP_ROUTES: Routes = [
  { path: "", pathMatch: "full", redirectTo: "items" },
  { path: "items", component: ItemScreenComponent },
  { path: "grimoire", component: GrimoireScreenComponent },
  { path: "skills", component: SkillScreenComponent },
  { path: "enemy-skills", component: EnemySkillScreenComponent },
  { path: "enemies", component: EnemyScreenComponent },
  { path: "treasures", component: TreasureScreenComponent },
  { path: "**", redirectTo: "items" }
];
