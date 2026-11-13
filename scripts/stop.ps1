$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskPidFile = Join-Path $taskRoot '.runtime\server.pid'
if (!(Test-Path -LiteralPath $taskPidFile)) {
 Write-Output 'No server started by this Windows launcher is recorded.'
 return
}
$taskProcessId = 0
[string]$taskRecordedPid = Get-Content -LiteralPath $taskPidFile -Raw
if ($taskRecordedPid) { $taskRecordedPid = $taskRecordedPid.Trim() }
$taskProcess = $null
if ([int]::TryParse($taskRecordedPid, [ref]$taskProcessId) -and $taskProcessId -gt 1) {
 $taskProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$taskProcessId"
}
$taskExpected = Join-Path $taskRoot '.runtime\node-v22.23.4-win-x64\node.exe'
$taskScript = Join-Path $PSScriptRoot 'serve.mjs'
# Match the complete launcher command, not a script-path prefix or an argument
# belonging to another program that happens to use this copy's Node runtime.
$taskExecutablePattern = [regex]::Escape($taskExpected)
$taskScriptPattern = [regex]::Escape($taskScript)
$taskCommandPattern = '^\s*(?:"' + $taskExecutablePattern + '"|' + $taskExecutablePattern + ')\s+(?:"' + $taskScriptPattern + '"|' + $taskScriptPattern + ')\s*$'
if ($taskProcess -and $taskProcess.ExecutablePath -eq $taskExpected -and $taskProcess.CommandLine -match $taskCommandPattern) {
 Stop-Process -Id $taskProcessId
 Write-Output 'Chessmate stopped. Your progress remains in your browser.'
} else {
 Write-Output 'The recorded process is gone or belongs to another program; nothing was stopped.'
}
Remove-Item -LiteralPath $taskPidFile
