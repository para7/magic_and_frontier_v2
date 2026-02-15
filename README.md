# Minecraft Server on Docker

既存の `server_1_21_11.jar` を使って Minecraft サーバーを起動し、ワールドデータをバインドマウントで保持します。  
データパックは `./datapacks` を `world/datapacks` にマウントして管理します。  
バックアップは 24 時間ごとに `tgz` を作成し、デフォルトで最新 7 世代を保持します。

## 構成

- サーバーデータ: `./data`
- データパック: `./datapacks`
- バックアップ: `./backups`
- サーバーJAR: `./server_1_21_11.jar`

## セットアップ

```bash
cp .env.example .env
mkdir -p data backups datapacks
```

`.env` の `RCON_PASSWORD` は必ず変更してください。

EULA 同意は自動化していません。初回起動後に `data/eula.txt` を編集して `eula=true` にしてください。

## 起動

```bash
docker compose up -d
```

初回は EULA 未同意で停止するため、以下を実行して再起動します。

```bash
sed -i 's/^eula=false/eula=true/' data/eula.txt
docker compose up -d
```

## 確認

```bash
docker compose logs -f minecraft
docker compose logs -f backup
```

バックアップファイルは `backups/` 配下に `minecraft-world_YYYYmmdd_HHMMSS.tgz` 形式で生成されます。

サンプルデータパック:

- `datapacks/sample_pack` を同梱しています。
- サーバー起動時または `/reload` 実行時に `say sample_pack_loaded` を実行する最小構成です。

データパックの動作確認:

```bash
docker compose restart minecraft
rg 'Found new data pack file/sample_pack|sample_pack_loaded' data/logs/latest.log
```

`Found new data pack file/sample_pack` または `sample_pack_loaded` が表示されれば、`./datapacks` のマウント経由でデータパックが読み込まれています。

## 主要な環境変数

- `MC_XMS` / `MC_XMX`: JVMメモリ
- `RCON_PASSWORD`: RCONパスワード（必須）
- `BACKUP_INTERVAL_HOURS`: バックアップ間隔（デフォルト `24`）
- `BACKUP_RETENTION`: 保持世代数（デフォルト `7`）
- `BACKUP_PREFIX`: バックアップファイル接頭辞

## 復元手順

1. `docker compose stop minecraft`
2. `data/` を退避
3. 復元したい `tgz` を `data/` に展開
4. `docker compose start minecraft`

例:

```bash
tar -xzf backups/minecraft-world_20260215_120000.tgz -C data
```
