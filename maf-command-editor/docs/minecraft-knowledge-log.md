- Context: アイテム編集UIをmcstacker風にし、入力値からNBTを生成して保存する実装。
- Finding: エンチャント入力は `minecraft:sharpness 5` のように `ID + レベル` の1行形式に正規化すると、`Enchantments:[{id:"minecraft:sharpness",lvl:5s}]` へ安定して変換できる。
- Impact: フリーフォーマットを許可するとNBT生成時の失敗が増えるため、行単位のフォーマット制約と保存前バリデーションが必要。
- Source: src/routes/index.tsx の `buildItemNbt` 実装と `bun run build` 成功確認。

- Context: Minecraftコマンド編集ツールの運用ランタイムを Node.js から Bun へ統一する作業。
- Finding: サーバー側の状態保存は `node:fs/promises` 依存を残さず、`Bun.file(...).text()` と `Bun.write(...)` に統一すると Bun 実行環境で直接運用できる。
- Impact: 実行手順とエンジン要件を Bun 前提にそろえることで、運用時のランタイム差分による不具合調査コストを減らせる。
- Source: src/routes/index.tsx の保存/読込処理変更、package.json の engines 更新、bun run build 成功確認。
