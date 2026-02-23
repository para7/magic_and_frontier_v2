- Context: アイテム編集UIをmcstacker風にし、入力値からNBTを生成して保存する実装。
- Finding: エンチャント入力は `minecraft:sharpness 5` のように `ID + レベル` の1行形式に正規化すると、`Enchantments:[{id:"minecraft:sharpness",lvl:5s}]` へ安定して変換できる。
- Impact: フリーフォーマットを許可するとNBT生成時の失敗が増えるため、行単位のフォーマット制約と保存前バリデーションが必要。
- Source: src/routes/index.tsx の `buildItemNbt` 実装と `bun run build` 成功確認。

- Context: フロントの「データ保存」ボタン押下時に `データ保存の実行に失敗しました。` が表示される不具合調査。
- Finding: エクスポート前に状態ファイル存在チェックを必須化すると、`grimoire-state.json` 未作成環境で保存処理が失敗する。状態リポジトリは未作成時に空データへフォールバックできるため、Minecraftデータパック生成では「未作成=空状態」を許容した方が運用に合う。
- Impact: 画面でまだ編集していない機能（例: grimoire）の状態ファイルがないだけで全体保存が止まる障害を防げる。新規環境でも初回エクスポートが成功しやすくなる。
- Source: `server/src/export/index.ts` の事前存在チェックと `server/src/repositories/json-file-repositories.ts` の `ENOENT -> defaultState` 挙動の突合。
