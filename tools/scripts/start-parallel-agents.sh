#!/usr/bin/env bash
set -euo pipefail

SESSION="${SESSION:-maf-parallel}"
ROOT="${ROOT:-/home/para7/workspaces/minecraft-docker/tools}"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux not found. Install tmux first."
  exit 1
fi

if [[ ! -d "$ROOT" ]]; then
  echo "ROOT does not exist: $ROOT"
  exit 1
fi

if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux new-session -d -s "$SESSION" -n agents -c "$ROOT"
fi

if ! tmux list-panes -t "$SESSION":agents >/dev/null 2>&1; then
  tmux new-window -t "$SESSION" -n agents -c "$ROOT"
fi

pane_count="$(tmux list-panes -t "$SESSION":agents | wc -l | tr -d ' ')"
while (( pane_count < 6 )); do
  if ! tmux split-window -f -t "$SESSION":agents.0 -c "$ROOT" >/dev/null 2>&1; then
    echo "Could not create 6 panes in current terminal size. Created $pane_count pane(s)."
    echo "Please enlarge the terminal and run: tmux select-layout -t $SESSION:agents tiled"
    break
  fi
  pane_count=$((pane_count + 1))
done

tmux select-layout -t "$SESSION":agents tiled

branches=(
  "feat/agent-a-domain"
  "feat/agent-b-server"
  "feat/agent-c-export"
  "feat/agent-d-frontend"
  "feat/agent-e-tests"
  "feat/integration-main"
)

prompts=(
  "A-domain"
  "B-server"
  "C-export"
  "D-frontend"
  "E-tests"
  "Integrator"
)

for i in "${!branches[@]}"; do
  if tmux list-panes -t "$SESSION":agents."$i" >/dev/null 2>&1; then
    tmux send-keys -t "$SESSION":agents."$i" "git switch ${branches[$i]} 2>/dev/null || git switch -c ${branches[$i]}" C-m
    tmux send-keys -t "$SESSION":agents."$i" "printf '\nOpen: docs/agent-prompts/${prompts[$i]}.md\n'" C-m
  fi
done

tmux select-window -t "$SESSION":agents
tmux select-pane -t "$SESSION":agents.0

echo "tmux session ready: $SESSION"
echo "Attach with: tmux attach -t $SESSION"
echo "Common prompt: docs/agent-prompts/00-common.md"

tmux attach -t "$SESSION"
