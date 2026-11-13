#!/bin/bash
source "$(dirname "$0")/macos-common.sh"
if [ ! -f "$task_pidfile" ]; then echo 'No server started by this Mac launcher is recorded.'; exit 0; fi
task_pid="$(cat "$task_pidfile")"
if task_owns_pid "$task_pid"; then
 kill "$task_pid"
 echo 'Chessmate stopped. Your progress remains in your browser.'
else
 echo 'The recorded process is gone or belongs to another program; nothing was stopped.'
fi
rm -f "$task_pidfile"
