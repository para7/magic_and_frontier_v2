# Project: Minecraft Datapack Dev Tool (Magic & Frontier 系) - JSON SSOT + Generator + Web UI

## Goal / Purpose
Minecraftのデータパック開発用の総合ツールを作る。
目的は、魔法・スキル・アイテム・敵・ドロップ等の各概念をブラウザから管理し、内部の正規化JSON（SSOT）に保存し、バリデーションを通した上で最終的にmcfunction等の成果物を一式生成できるようにすること。

既存の https://github.com/para7/magic_and_frontier の概念を流用する：
- 魔法には castid/effectid 等の識別子がある（maf.json 相当）
- 魔法書やアイテムはデフォルトでは効果が見えず、識別（アナライズ）でNBTがマージされ効果が確認できる（この仕組みは既存にある）

## Constraints / Non-goals
- DBは使わない。当面はJSONファイル群をGit管理する（GitHub上で差分レビューできることが重要）。
- マイクラのバージョン差分、スポーン制御や戦闘AIなどの「制御ロジック」は本スコープ外（ただし将来拡張できるように定義は残せる）。
- ドロップは loot table を直接設定する。ただし本ツールでドロップ設計を管理し、必要ならloot table JSONの生成も可能にしたい（ON/OFF可能設計にする）。

## High-level Architecture
- SSOT: /data 以下のJSON群が唯一の真実（skills/items/enemies/dropTables/enemySkills）
- Generator: dataを読み込み → validate → resolve(IR) → generate(/generated) を行うCLI（Node/TS）
- Web UI: data JSON群を読み込み/編集/保存できる（将来的にmonorepo想定）
- 生成物（/generated）は手編集しない。差分が安定するように整形/並び順を規定。

## Domain Rules (Core)
1) Player Skill と Enemy Skill は完全に別物（別エンティティ、相互参照しない）
2) Skill は isMagic: boolean を持つ
   - isMagic=true の場合、魔法として扱う（魔法書アイテムとして紐づけ可能）
   - isMagic=true の魔法は、アイテム登録しなくても「魔法書として」ドロップ等に紐づけ可能
3) アイテム（剣など）には固有スキル（プレイヤースキル）を紐づけできる
4) 識別（アナライズ）で NBT がマージされて初めて効果が見える運用を前提とする
   - items は unidentifiedNbt / identifiedNbt を持てる
   - 両方に追跡可能なキー（例 itemId 等）が残ることを推奨し、バリデーションで警告できる

## Data Model (SSOT JSON) - Proposed
Create initial schemas (zod or jsonschema) and sample data files under /data.

### /data/skills.json
[
  {
    "skillId": "sk_firebolt",
    "name": "Fire Bolt",
    "description": "...",
    "isMagic": true,
    "magic": {
      "castId": "029001",
      "effectId": "E_FIRE_BOLT",
      "cost": 10,
      "castTime": 20,
      "title": "Fire Bolt",
      "description": "..."
      // allow extra fields for future extension
    },
    "tags": ["fire"]
  }
]

### /data/items.json
[
  {
    "itemId": "it_iron_sword_001",
    "name": "Iron Sword of ...",
    "minecraftId": "minecraft:iron_sword",
    "rarity": "rare",
    "unidentifiedNbt": { ... },
    "identifiedNbt": { ... },
    "skills": [
      { "skillId": "sk_slash", "trigger": "onHit", "cooldown": 40 }
    ],
    "notes": ""
  }
]

### /data/enemySkills.json
[
  {
    "enemySkillId": "esk_poison_cloud",
    "name": "Poison Cloud",
    "description": "...",
    "behaviorType": "aoe",
    "params": { ... }
  }
]

### /data/dropTables.json
[
  {
    "dropTableId": "dt_treasure_low",
    "name": "Treasure Low",
    "entries": [
      { "kind": "item", "itemId": "it_iron_sword_001", "weight": 10, "minCount": 1, "maxCount": 1 },
      { "kind": "magic", "castId": "029001", "weight": 3, "minCount": 1, "maxCount": 1 }
    ]
  }
]

### /data/enemies.json
[
  {
    "enemyId": "en_slime_001",
    "name": "Slime",
    "entityType": "minecraft:slime",
    "params": { "hp": 20, "atk": 3 },
    "dropTableId": "dt_treasure_low",
    "enemySkills": [
      { "enemySkillId": "esk_poison_cloud", "cooldown": 100, "priority": 10 }
    ]
    // spawn definition may be stored but generation for spawn logic is out-of-scope
  }
]

## Validation Requirements (Must)
Implement validate command that checks:
- ID uniqueness (skillId/itemId/enemyId/dropTableId/enemySkillId, castId uniqueness within magic skills)
- Reference integrity:
  - items.skills[].skillId exists in skills
  - dropTables.entries itemId exists / castId exists in skills where isMagic=true
  - enemies.dropTableId exists
  - enemies.enemySkills[].enemySkillId exists
- Domain rules:
  - skills.isMagic=true => magic.castId & effectId required
  - skills.isMagic=false => magic must be absent (or ignored with warning)
  - dropTables.entries kind=magic must reference castId of an isMagic=true skill (or provide rule: castId registry)
- NBT rule (warning-level):
  - items should keep stable internal key between unidentified/identified (if configured)

Validation output should be human readable + machine readable JSON report.

## Generator Requirements
Implement generate command that outputs to /generated with stable formatting.
Generation targets (phaseable):
Phase 1 (minimum): generate compatibility magic list
- Generate /generated/maf.json from skills where isMagic=true
  - Format compatible with existing maf.json (castid/effectid/title/description/cost/cast etc.)
  - Preserve extra fields from skill.magic as best-effort

Phase 2 (optional): generate loot table JSON from dropTables.json
- Make it toggleable by config (generateLootTables true/false)
- Output under /generated/data/<namespace>/loot_tables/...

Phase 3 (later): generate mcfunction helpers for item give / analyze merge hooks
- Keep hooks compatible with existing “識別でNBTマージ”の運用（details TBD）

Note: spawn/AI logic generation is explicitly out-of-scope for now.

## Web UI Requirements
Web app in TypeScript (React preferred) that edits the SSOT JSON.
Pages:
1) Skills & Magic Management
   - list/filter/search
   - edit skill; if isMagic=true show magic fields; else hide
2) Items Management
   - edit unidentified/identified NBT (JSON editor)
   - link player skills (trigger/cooldown)
3) Drop Table Management
   - mix item + magic entries (magic by castId or by selecting isMagic skill)
4) Enemy Skills Management
5) Enemies Management
   - params, dropTable link, enemy skill links
6) Validate / Generate Dashboard
   - run validator, show errors/warnings
   - run generator, show outputs + file list

No database. For now, implement file import/export:
- Import: load /data JSON files (either via file picker or drag-drop as a folder/zip)
- Export: download updated /data JSON set as zip (or individual JSON)
(If running in repo context, allow writing to filesystem is optional; focus on import/export.)

## Repo Setup
Create monorepo structure (pnpm workspace acceptable):
/data (SSOT JSON)
/generated (generated outputs)
/packages/generator (node ts cli)
/packages/web (react app)
/packages/shared (schemas, types, validator core)

## Deliverables
- Initial schemas + sample JSON in /data
- Shared TS types + zod/jsonschema validation
- CLI: `pnpm validate` `pnpm generate`
- Web UI skeleton with the pages above, can load/edit/save JSON
- Generator Phase 1: produce maf.json
- Documentation: README explaining workflow (edit -> validate -> generate)

## Implementation Notes
- Keep output deterministic (stable key ordering, stable array sorting rules configurable)
- Prefer “round-trip safety”: unknown fields in JSON should be preserved on load/save
- Provide clear errors with file path + json pointer for fix guidance

## Task Breakdown (Suggested)
1) Set up monorepo + shared schema/types + sample data
2) Implement validator core + CLI command
3) Implement generator Phase 1 (maf.json)
4) Build web UI skeleton + import/export + basic editors
5) Wire validate/generate dashboard to CLI (or run in-browser if feasible)
6) Add dropTable editor + enemy editor
7) Optional: loot table generation

Please implement step-by-step with incremental commits and keep tests for validator/generator.
