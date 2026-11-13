param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskNode = Join-Path $taskRoot '.runtime\node-v22.23.4-win-x64\node.exe'
if (!(Test-Path -LiteralPath $taskNode) -or !(Test-Path -LiteralPath (Join-Path $taskRoot 'dist\index.html'))) { throw 'Run Setup Chessmate.cmd once before launching.' }
$taskReady = $false
try { $taskHealth = Invoke-RestMethod 'http://127.0.0.1:4173/health' -TimeoutSec 2; if ($taskHealth.app -notin @('Chessmate','LTW-Chess')) {throw 'Port occupied'}; $taskReady=$true } catch {}
if (!$taskReady) {
 $taskSocket = [System.Net.Sockets.TcpClient]::new()
 try { $taskSocket.Connect('127.0.0.1',4173); $taskOccupied=$true } catch { $taskOccupied=$false } finally { $taskSocket.Dispose() }
 if ($taskOccupied) { throw 'Port 4173 is occupied by another service. Close that service and try again.' }
 $env:CHESSMATE_PORT='4173'
 $taskScript = Join-Path $PSScriptRoot 'serve.mjs'
 $taskProcess = Start-Process -FilePath $taskNode -ArgumentList ('"' + $taskScript + '"') -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskRoot '.runtime\server.log') -RedirectStandardError (Join-Path $taskRoot '.runtime\server-error.log')
 Set-Content -LiteralPath (Join-Path $taskRoot '.runtime\server.pid') -Value $taskProcess.Id
 for ($taskAttempt=0; $taskAttempt -lt 30; $taskAttempt++) { Start-Sleep -Milliseconds 200; try {$taskHealth=Invoke-RestMethod 'http://127.0.0.1:4173/health' -TimeoutSec 1; if($taskHealth.app -in @('Chessmate','LTW-Chess')) {$taskReady=$true;break}}catch{}; if($taskProcess.HasExited){break} }
}
if (!$taskReady) {throw 'Chessmate could not start. Port 4173 may be occupied. See .runtime\server-error.log.'}
if (!$NoBrowser) { Start-Process 'http://127.0.0.1:4173' }
