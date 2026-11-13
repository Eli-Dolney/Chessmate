# Isolated Windows checks: copies the launcher to a path with spaces and changes
# only that fixture's port. Running Chessmate installations remain untouched.
$ErrorActionPreference = 'Stop'
$taskProject = Split-Path -Parent $PSScriptRoot
$taskRuntimeNode = Join-Path $taskProject '.runtime\node-v22.23.4-win-x64\node.exe'
if (!(Test-Path -LiteralPath $taskRuntimeNode)) { throw 'Run Setup Chessmate.cmd before the launcher checks.' }
$taskFixture = Join-Path $taskProject ('.runtime\launcher audit ' + [guid]::NewGuid().ToString('N'))
$taskFixtureScripts = Join-Path $taskFixture 'scripts'
$taskFixtureRuntime = Join-Path $taskFixture '.runtime'
$taskFixtureNodeDir = Join-Path $taskFixtureRuntime 'node-v22.23.4-win-x64'
$taskFixtureNode = Join-Path $taskFixtureNodeDir 'node.exe'
$taskPidFile = Join-Path $taskFixtureRuntime 'server.pid'
$taskFixtureLaunch = Join-Path $taskFixtureScripts 'launch.ps1'
$taskFixtureStop = Join-Path $taskFixtureScripts 'stop.ps1'
$taskOwnedProcesses = [System.Collections.Generic.List[int]]::new()
$taskChecks = 0
function Assert-Check([bool]$Condition, [string]$Message) {
 if (!$Condition) { throw $Message }
 $script:taskChecks++
}
function Expect-Failure([scriptblock]$Action, [string]$Message) {
 $taskFailure = $null
 try { & $Action | Out-Null } catch { $taskFailure = $_.Exception.Message }
 Assert-Check ($taskFailure -like ('*' + $Message + '*')) ('Expected failure: ' + $Message + '; got: ' + $taskFailure)
}
function Start-FixtureNode([string]$Script, [string]$Extra = '') {
 $taskChild = Start-Process -FilePath $taskFixtureNode -ArgumentList ('"' + $Script + '"' + $Extra) -WorkingDirectory $taskFixture -WindowStyle Hidden -PassThru
 $taskOwnedProcesses.Add($taskChild.Id)
 return $taskChild
}
function Is-Running([int]$ProcessId) { return $null -ne (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue) }
try {
 foreach ($taskPath in Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.ps1') {
  $taskTokens = $null; $taskParseErrors = $null
  [System.Management.Automation.Language.Parser]::ParseFile($taskPath.FullName, [ref]$taskTokens, [ref]$taskParseErrors) | Out-Null
  Assert-Check ($taskParseErrors.Count -eq 0) ('PowerShell syntax failed: ' + $taskPath.Name)
 }
 New-Item -ItemType Directory -Path $taskFixtureScripts, $taskFixtureNodeDir, (Join-Path $taskFixture 'dist') -Force | Out-Null
 $taskListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
 $taskListener.Start()
 $taskPort = $taskListener.LocalEndpoint.Port
 $taskListener.Stop()
 Assert-Check ($taskPort -notin @(4173, 4174)) 'The fixture must not use a running app port.'
 $taskUrl = "http://127.0.0.1:$taskPort"
 [System.IO.File]::WriteAllText($taskFixtureLaunch, (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'launch.ps1') -Raw).Replace('4173', [string]$taskPort))
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'stop.ps1') -Destination $taskFixtureStop
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'serve.mjs') -Destination (Join-Path $taskFixtureScripts 'serve.mjs')
 [System.IO.File]::WriteAllText((Join-Path $taskFixture 'dist\index.html'), 'Isolated Chessmate launcher fixture')
 Expect-Failure { & $taskFixtureLaunch -NoBrowser } 'Run Setup'
 Copy-Item -LiteralPath $taskRuntimeNode -Destination $taskFixtureNode
 $taskListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $taskPort)
 $taskListener.Start()
 try { Expect-Failure { & $taskFixtureLaunch -NoBrowser } 'occupied by another service' } finally { $taskListener.Stop() }
 # An inherited developer override must not change the launcher's fixed origin.
 $taskPreviousPort = $env:CHESSMATE_PORT
 try { $env:CHESSMATE_PORT = '4173'; & $taskFixtureLaunch -NoBrowser | Out-Null } finally { $env:CHESSMATE_PORT = $taskPreviousPort }
 $taskServerId = [int](Get-Content -LiteralPath $taskPidFile)
 $taskOwnedProcesses.Add($taskServerId)
 Assert-Check ((Invoke-RestMethod "$taskUrl/health" -TimeoutSec 2).app -eq 'Chessmate') 'Fixture server health failed.'
 $taskServer = Get-CimInstance Win32_Process -Filter "ProcessId=$taskServerId"
 Assert-Check ($taskServer.ExecutablePath -eq $taskFixtureNode) 'Server used a different Node runtime.'
 & $taskFixtureLaunch -NoBrowser | Out-Null
 Assert-Check ([int](Get-Content -LiteralPath $taskPidFile) -eq $taskServerId) 'Repeated launch did not reuse the server.'
 & $taskFixtureStop | Out-Null
 Start-Sleep -Milliseconds 200
 Assert-Check (!(Is-Running $taskServerId)) 'Stop did not terminate its own server.'
 Assert-Check (!(Test-Path -LiteralPath $taskPidFile)) 'Stop left its PID record behind.'
 foreach ($taskBadPid in @('', 'not-a-pid', '-1', '0', '1', '2147483648')) {
  [System.IO.File]::WriteAllText($taskPidFile, $taskBadPid)
  & $taskFixtureStop | Out-Null
  Assert-Check (!(Test-Path -LiteralPath $taskPidFile)) ('Malformed PID was not handled: ' + $taskBadPid)
 }
 & $taskFixtureStop | Out-Null
 Assert-Check $true 'Missing PID file should be harmless.'
 # Both examples used to satisfy the substring ownership check.
 foreach ($taskOtherName in @('serve.mjs.other.mjs', 'unrelated.mjs')) {
  $taskOtherScript = Join-Path $taskFixtureScripts $taskOtherName
  [System.IO.File]::WriteAllText($taskOtherScript, 'setInterval(() => {}, 1000);')
  $taskExtra = if ($taskOtherName -eq 'unrelated.mjs') { ' "' + (Join-Path $taskFixtureScripts 'serve.mjs') + '"' } else { '' }
  $taskOther = Start-FixtureNode $taskOtherScript $taskExtra
  Start-Sleep -Milliseconds 200
  [System.IO.File]::WriteAllText($taskPidFile, [string]$taskOther.Id)
  & $taskFixtureStop | Out-Null
  Assert-Check (Is-Running $taskOther.Id) ('Stop touched another script: ' + $taskOtherName)
 }
 Write-Output "Passed $taskChecks isolated Windows launcher checks (including paths with spaces)."
} finally {
 # Clean up only the helper processes started by this test and still verified
 # against its unique fixture. Never read or stop another install's server PID.
 if (Test-Path -LiteralPath $taskPidFile) {
  $taskRecordedId = 0
  if ([int]::TryParse([string](Get-Content -LiteralPath $taskPidFile -Raw), [ref]$taskRecordedId) -and $taskRecordedId -gt 1 -and !$taskOwnedProcesses.Contains($taskRecordedId)) { $taskOwnedProcesses.Add($taskRecordedId) }
 }
 foreach ($taskChildId in $taskOwnedProcesses) {
  $taskChild = Get-CimInstance Win32_Process -Filter "ProcessId=$taskChildId"
  if ($taskChild -and $taskChild.ExecutablePath -eq $taskFixtureNode -and $taskChild.CommandLine.Contains($taskFixtureScripts)) { Stop-Process -Id $taskChildId; Wait-Process -Id $taskChildId -Timeout 5 -ErrorAction SilentlyContinue }
 }
 if (Test-Path -LiteralPath $taskFixtureNode) { Remove-Item -LiteralPath $taskFixtureNode }
 Write-Output "Fixture logs retained at: $taskFixture"
}
