$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskPidFile = Join-Path $taskRoot '.runtime\server.pid'
if(Test-Path -LiteralPath $taskPidFile){
 $taskProcessId=[int](Get-Content -LiteralPath $taskPidFile)
 $taskProcess=Get-CimInstance Win32_Process -Filter "ProcessId=$taskProcessId"
 $taskExpected=Join-Path $taskRoot '.runtime\node-v22.23.4-win-x64\node.exe'
 $taskScript=Join-Path $PSScriptRoot 'serve.mjs'
 if($taskProcess -and $taskProcess.ExecutablePath -eq $taskExpected -and $taskProcess.CommandLine.Contains($taskScript)){Stop-Process -Id $taskProcessId}
 Remove-Item -LiteralPath $taskPidFile
}
