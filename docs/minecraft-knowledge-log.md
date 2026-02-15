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

- Context: `make mc-cmd` を backup 側 `mcrcon` 実行へ置換
- Finding: `mc-cmd` は `backup` コンテナ内 `mcrcon -H minecraft` を使う形に変更でき、Python実装とコンテナIP解決は不要になる。
- Impact: 運用上、`make mc-cmd` 実行には `minecraft` と `backup` の両サービス起動が前提になる。
- Source: `Makefile:14`, `Makefile:18`, `Makefile:31`

- Context: backupコンテナの起動失敗調査（`mcrcon` 導入可否）
- Finding: `alpine:3.20` では `apk add mcrcon` が解決できず、バックアップコンテナは起動ループになる。
- Impact: Alpine前提で `mcrcon` を直接使う設計は成立しないため、別パッケージ系統（Ubuntu `rcon` など）への切替が必要。
- Source: `docker compose logs --since=10m backup` の `mcrcon (no such package)` エラー

- Context: Ubuntu化後のRCONクライアント選定
- Finding: Ubuntu 24.04 では `rcon` パッケージで `rconclt` が提供され、`<password>@<host>:<port>` 形式でMinecraft RCONへ接続できる。
- Impact: backup・mc-cmdともに `rconclt` 経路へ統一でき、Python独自スクリプトを不要化できる。
- Source: `docker run --rm ubuntu:24.04 ... apt-cache search rcon`, `dpkg -L rcon`, `rconclt --help`

- Context: Ubuntu版backupへの切替後の実動作確認
- Finding: `make mc-cmd CMD='list'` で `There are 0 of a max of 20 players online:` が返り、`rconclt` 経由のRCON実行が成功した。
- Impact: サーバーコマンド実行経路は Python なしで運用可能と確認できた。
- Source: `docker compose up -d backup`, `make mc-cmd CMD='list'`
