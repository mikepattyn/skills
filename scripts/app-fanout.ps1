#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Script = Join-Path $Root "scripts/app-fanout.mjs"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "node is required to plan app-fanout skill runs"
    exit 1
}

& node $Script @args
exit $LASTEXITCODE
