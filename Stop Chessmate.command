#!/bin/bash
/bin/bash "$(dirname "$0")/scripts/stop-macos.sh"
task_status=$?
if [ "$task_status" -ne 0 ]; then read -r -p 'Press Return to close… ' _; fi
exit "$task_status"
