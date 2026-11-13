#!/bin/bash
source "$(dirname "$0")/macos-common.sh"
if [ ! -x "$task_node" ] || [ ! -f "$task_root/dist/index.html" ]; then echo 'Run Setup Chessmate.command first.' >&2; exit 1; fi
if ! task_health; then
 if lsof -nP -iTCP:4173 -sTCP:LISTEN >/dev/null 2>&1; then echo 'Port 4173 is occupied by another service. Close that service and try again.' >&2; exit 1; fi
 mkdir -p "$task_runtime"
 # Fix the origin even when a developer override exists in the parent shell.
 CHESSMATE_PORT=4173 nohup "$task_node" "$task_server" >"$task_runtime/server-macos.log" 2>"$task_runtime/server-macos-error.log" </dev/null &
 task_pid=$!
 printf '%s\n' "$task_pid" > "$task_pidfile"
 task_ready=false
 for ((task_attempt=0; task_attempt<30; task_attempt++)); do
  if task_health; then task_ready=true; break; fi
  kill -0 "$task_pid" 2>/dev/null || break
  sleep 0.2
 done
 if [ "$task_ready" != true ]; then echo "Chessmate could not start. See $task_runtime/server-macos-error.log" >&2; exit 1; fi
fi
if [ "${1:-}" != --no-browser ]; then open "$task_url/"; fi
echo "Chessmate is ready at $task_url/"
