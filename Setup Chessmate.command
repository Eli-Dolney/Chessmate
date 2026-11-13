#!/bin/bash
/bin/bash "$(dirname "$0")/scripts/setup-macos.sh"
task_status=$?
if [ "$task_status" -ne 0 ]; then echo 'Setup did not finish. Read the message above.'; fi
read -r -p 'Press Return to close… ' _
exit "$task_status"
