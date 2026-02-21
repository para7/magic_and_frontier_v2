# SolidStart Server Layering Convention

## 1. Purpose

このドキュメントは、SolidStart アプリのサーバー側処理を `src/server` に集約し、`usecases` と `repositories` の 2 層で管理するための規約を定義する。

- 対象: `query` / `action` から呼ばれるサーバー処理
- 目的: 責務分離、変更影響範囲の縮小、テスト容易性の向上
- 非対象: Hono の導入、ルーティング方式の変更

## 2. Directory Convention

```txt
src/
  routes/                  # SolidStart entrypoint layer (thin)
  server/
    repositories/          # data access layer
    usecases/              # business rule layer
    services/              # dependency composition layer
```

今回の規約では「全体レイヤー別」を採用する。

- `src/server/repositories/*`
- `src/server/usecases/*`
- `src/server/services/*`

## 3. Responsibility Boundaries

### 3.1 routes (`src/routes/*.tsx`)

`query` / `action` はエントリポイント層として最小責務に限定する。

- フォーム境界の変換（`FormData` -> usecase input）
- usecase 呼び出し
- SolidStart 固有処理（`revalidate` など）

禁止事項:

- 永続化 I/O の直接実行
- 業務ルール（判定・変換・検証）の実装

### 3.2 usecases (`src/server/usecases/*`)

アプリケーション固有の業務ルールを担う。

- 入力検証（主責務）
- 作成/更新判定、存在確認などの業務判断
- NBT 組み立てなどのドメインロジック
- repository 呼び出しのオーケストレーション

禁止事項:

- HTTP や `FormData` に依存した I/F 公開
- ストレージ固有都合の露出

### 3.3 repositories (`src/server/repositories/*`)

データアクセス層。I/O と永続化都合の吸収に限定する。

- ファイル読み書きなどの I/O
- 永続化形式とアプリ型の整合

禁止事項:

- 業務バリデーション
- 業務エラー文言の生成

### 3.4 services (`src/server/services/*`)

依存組み立て層。Usecase と Repository の接続を 1 箇所で管理する。

- `createServerServices()` のようなファクトリを提供
- `query` / `action` はこのファクトリ経由で usecase を取得

## 4. Interface Rules

### 4.1 Repository Interface (example)

```ts
export interface ItemStateRepository {
  loadItemState(): Promise<ItemState>;
  saveItemState(state: ItemState): Promise<void>;
}
```

### 4.2 Usecase Interface (example)

```ts
export interface ItemUsecase {
  loadItems(): Promise<ItemState>;
  saveItem(input: SaveItemInput): Promise<SaveItemResult>;
  deleteItem(input: DeleteItemInput): Promise<DeleteItemResult>;
}
```

### 4.3 Dependency Composition Interface (example)

```ts
export type ServerServices = {
  itemUsecase: ItemUsecase;
};

export function createServerServices(): ServerServices;
```

### 4.4 Type Boundary Rules

- `FormData` は `routes` 層で閉じる
- `SaveItemInput` 等のアプリ型は usecase 層で管理する
- repository は `FormData` を受け取らない

## 5. Call Sequence

`query/action -> usecase -> repository` の順で呼び出す。

```txt
route action/query
  -> createServerServices()
  -> itemUsecase.<operation>(input)
     -> itemRepository.<io>()
  -> revalidate(...)
```

## 6. Naming Rules

- Usecase: `*Usecase` / `create*Usecase`
- Repository: `*Repository` / `create*Repository`
- Service Factory: `createServerServices`

## 7. Review Checklist

レビュー時は次を満たすこと。

1. `src/routes/*.tsx` に永続化 I/O がない
2. バリデーションが usecase に集約されている
3. repository が業務判断を持っていない
4. `query/action` が薄い（境界変換 + 呼び出し + `revalidate`）

## 8. Notes

- この規約は責務方針レベルを固定するもので、実装詳細の完全固定はしない。
- 参考にした構造は repository/usecase 分離と組み立て層の方針であり、Hono 依存は採用しない。
