$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$taskRuntime = Join-Path $taskRoot '.runtime'
$taskNodeDir = Join-Path $taskRuntime 'node-v22.23.4-win-x64'
if (!(Test-Path -LiteralPath (Join-Path $taskNodeDir 'node.exe'))) {
 New-Item -ItemType Directory -Path $taskRuntime -Force | Out-Null
 $taskZip = Join-Path $taskRuntime 'node.zip'
 Invoke-WebRequest 'https://nodejs.org/dist/v22.23.4/node-v22.23.4-win-x64.zip' -OutFile $taskZip
 if ((Get-FileHash -LiteralPath $taskZip -Algorithm SHA256).Hash -ne 'cbc74b5e0982c9dbb41525fd8fb5dcd32fbee237863f7829072f4639a1ce5f20') {throw 'Node download checksum mismatch.'}
 Expand-Archive -LiteralPath $taskZip -DestinationPath $taskRuntime -Force
 Remove-Item -LiteralPath $taskZip
}
$env:PATH = "$taskNodeDir;$env:PATH"
& (Join-Path $taskNodeDir 'npm.cmd') ci --no-fund --no-audit
if($LASTEXITCODE -ne 0){throw 'Dependency installation failed.'}
& (Join-Path $taskNodeDir 'npm.cmd') run build
if($LASTEXITCODE -ne 0){throw 'Build failed.'}
Write-Output 'Ready! Double-click Launch Chessmate.cmd. No internet is needed to play.'
