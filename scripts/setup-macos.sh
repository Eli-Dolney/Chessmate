#!/bin/bash
source "$(dirname "$0")/macos-common.sh"
mkdir -p "$task_runtime"
if [ ! -x "$task_node" ]; then
 task_download="$(mktemp -d "$task_runtime/download.XXXXXX")"
 task_archive="node-v22.23.4-darwin-$task_arch.tar.gz"
 echo "Downloading the project-local Node runtime for $task_arch…"
 curl --fail --location --proto '=https' --tlsv1.2 "https://nodejs.org/dist/v22.23.4/$task_archive" -o "$task_download/$task_archive"
 printf '%s  %s\n' "$task_sha" "$task_download/$task_archive" | shasum -a 256 -c -
 tar -xzf "$task_download/$task_archive" -C "$task_download"
 [ "$("$task_download/node-v22.23.4-darwin-$task_arch/bin/node" --version)" = v22.23.4 ]
 if [ -e "$task_node_dir" ]; then echo "Incomplete runtime at $task_node_dir. Move that directory aside, then run Setup again." >&2; exit 1; fi
 mv "$task_download/node-v22.23.4-darwin-$task_arch" "$task_node_dir"
 rm -f "$task_download/$task_archive"
 rmdir "$task_download"
fi
export PATH="$task_node_dir/bin:$PATH"
cd "$task_root"
"$task_node_dir/bin/npm" ci --no-fund --no-audit
"$task_node_dir/bin/npm" run build
chmod +x "$task_root/Setup Chessmate.command" "$task_root/Launch Chessmate.command" "$task_root/Stop Chessmate.command"
echo 'Ready! Open Launch Chessmate.command. Internet is no longer needed to play.'
