#!/bin/bash
set -euo pipefail
task_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
if [ "$(uname -s)" != Darwin ]; then echo 'These launchers are for macOS. On Windows use the .cmd launchers.' >&2; exit 1; fi
task_arch="$(uname -m)"
if [ "$(sysctl -n hw.optional.arm64 2>/dev/null || true)" = 1 ]; then task_arch=arm64; fi
case "$task_arch" in
 arm64) task_sha=c9e1dbc748b33ed2d14f42445191ecaf14c56259c7a9a26d0042c49ec2b66428 ;;
 x86_64) task_arch=x64; task_sha=efcc2b0db6f94bf53eddb038fe2b370277a042bd29e4f19b8f8e23598795b819 ;;
 *) echo "Unsupported Mac architecture: $task_arch" >&2; exit 1 ;;
esac
task_runtime="$task_root/.runtime"
task_node_dir="$task_runtime/node-v22.23.4-darwin-$task_arch"
task_node="$task_node_dir/bin/node"
task_pidfile="$task_runtime/server-macos.pid"
task_url=http://127.0.0.1:4173
task_server="$task_root/scripts/serve.mjs"
task_health() {
 local response
 response="$(curl --noproxy '*' -fsS --max-time 2 "$task_url/health" 2>/dev/null)" || return 1
 "$task_node" -e 'try { const h=JSON.parse(process.argv[1]);process.exit(["Chessmate","LTW-Chess"].includes(h.app)?0:1); } catch { process.exit(1); }' "$response"
}
task_owns_pid() {
 local pid="$1" command
 case "$pid" in ''|*[!0-9]*) return 1 ;; esac
 [ "$pid" -gt 1 ] || return 1
 command="$(ps -p "$pid" -o command= 2>/dev/null)" || return 1
 [ "$command" = "$task_node $task_server" ]
}
