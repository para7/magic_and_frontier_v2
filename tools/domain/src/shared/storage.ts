import type { ItemState } from "../item/types.js";
import type { GrimoireState } from "../grimoire/types.js";
import type { SkillState } from "../skill/types.js";
import type { EnemySkillState } from "../enemy-skill/types.js";
import type { EnemyState } from "../enemy/types.js";
import type { TreasureState } from "../treasure/types.js";

export interface ItemStateRepository {
	loadItemState(): Promise<ItemState>;
	saveItemState(state: ItemState): Promise<void>;
}

export interface GrimoireStateRepository {
	loadGrimoireState(): Promise<GrimoireState>;
	saveGrimoireState(state: GrimoireState): Promise<void>;
}

export interface SkillStateRepository {
	loadSkillState(): Promise<SkillState>;
	saveSkillState(state: SkillState): Promise<void>;
}

export interface EnemySkillStateRepository {
	loadEnemySkillState(): Promise<EnemySkillState>;
	saveEnemySkillState(state: EnemySkillState): Promise<void>;
}

export interface EnemyStateRepository {
	loadEnemyState(): Promise<EnemyState>;
	saveEnemyState(state: EnemyState): Promise<void>;
}

export interface TreasureStateRepository {
	loadTreasureState(): Promise<TreasureState>;
	saveTreasureState(state: TreasureState): Promise<void>;
}
