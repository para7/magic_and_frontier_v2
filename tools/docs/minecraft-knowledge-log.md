- Context: アイテム編集UIをmcstacker風にし、入力値からNBTを生成して保存する実装。
- Finding: エンチャント入力は `minecraft:sharpness 5` のように `ID + レベル` の1行形式に正規化すると、`Enchantments:[{id:"minecraft:sharpness",lvl:5s}]` へ安定して変換できる。
- Impact: フリーフォーマットを許可するとNBT生成時の失敗が増えるため、行単位のフォーマット制約と保存前バリデーションが必要。
- Source: src/routes/index.tsx の `buildItemNbt` 実装と `bun run build` 成功確認。

