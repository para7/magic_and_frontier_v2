- Context: `make mc-cmd` の Python 依存置換可否を調査
- Finding: バックアップ処理では `mcrcon` を使って `list` / `save-off` / `save-all flush` / `save-on` などMinecraftコマンドをRCON実行している。
- Impact: `scripts/rcon.py` を使わなくても、既存の `mcrcon` 経路でMinecraftコマンド実行を統一できる。
- Source: `backup/backup.sh:18`, `backup/backup.sh:61`, `backup/backup.sh:62`, `backup/backup.sh:70`

- Context: RCON接続先の扱いを調査（置換時の接続方式確認）
- Finding: バックアップ側のRCON接続先は `RCON_HOST=minecraft`（Composeサービス名）で、コンテナIP直指定は不要な構成になっている。
- Impact: 置換時は `docker inspect` によるIP取得を省略でき、サービス名ベース接続で運用を簡素化できる。
- Source: `compose.yml:48`, `backup/backup.sh:4`

- Context: `mcrcon` 利用可能性の確認
- Finding: バックアップコンテナ起動時に `apk add ... mcrcon` を実行しており、コンテナ内にはRCONクライアントが導入される設計である。
- Impact: ホストに新規パッケージを入れず、`docker compose exec -T backup mcrcon ...` で即時にPython代替の実行経路を作れる。
- Source: `compose.yml:61`
