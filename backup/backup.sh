#!/usr/bin/env bash
set -u

RCON_HOST="${RCON_HOST:-minecraft}"
RCON_PORT="${RCON_PORT:-25575}"
RCON_PASSWORD="${RCON_PASSWORD:-}"
DATA_DIR="${DATA_DIR:-/data}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-minecraft-world}"
BACKUP_INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-24}"
BACKUP_RETENTION="${BACKUP_RETENTION:-7}"
STARTUP_DELAY_SECONDS="${STARTUP_DELAY_SECONDS:-120}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %z')" "$*"
}

rcon() {
  mcrcon -H "$RCON_HOST" -P "$RCON_PORT" -p "$RCON_PASSWORD" "$@"
}

wait_for_rcon() {
  local attempts=0
  local max_attempts=60
  while (( attempts < max_attempts )); do
    if rcon "list" >/dev/null 2>&1; then
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 5
  done
  return 1
}

prune_backups() {
  if (( BACKUP_RETENTION < 1 )); then
    log "BACKUP_RETENTION must be >= 1. Skip pruning."
    return
  fi

  mapfile -t archives < <(ls -1t "${BACKUP_DIR}/${BACKUP_PREFIX}"_*.tgz 2>/dev/null || true)
  if (( ${#archives[@]} <= BACKUP_RETENTION )); then
    return
  fi

  local to_delete
  for ((to_delete = BACKUP_RETENTION; to_delete < ${#archives[@]}; to_delete++)); do
    rm -f -- "${archives[$to_delete]}"
    log "Deleted old backup: ${archives[$to_delete]}"
  done
}

run_backup() {
  local timestamp archive
  timestamp="$(date '+%Y%m%d_%H%M%S')"
  archive="${BACKUP_DIR}/${BACKUP_PREFIX}_${timestamp}.tgz"

  mkdir -p "$BACKUP_DIR"

  log "Starting backup: ${archive}"
  rcon "save-off" >/dev/null 2>&1 || log "Warning: failed to run save-off"
  rcon "save-all flush" >/dev/null 2>&1 || log "Warning: failed to run save-all flush"

  if tar -czf "$archive" -C "$DATA_DIR" .; then
    log "Backup completed: ${archive}"
  else
    log "Backup failed while creating archive."
  fi

  rcon "save-on" >/dev/null 2>&1 || log "Warning: failed to run save-on"
  prune_backups
}

if [[ -z "$RCON_PASSWORD" ]]; then
  log "RCON_PASSWORD is required."
  exit 1
fi

log "Initial startup delay: ${STARTUP_DELAY_SECONDS}s"
sleep "$STARTUP_DELAY_SECONDS"

while true; do
  if wait_for_rcon; then
    run_backup
  else
    log "RCON is unavailable. Skip this cycle."
  fi
  log "Sleeping for ${BACKUP_INTERVAL_HOURS} hour(s)."
  sleep "${BACKUP_INTERVAL_HOURS}h"
done
