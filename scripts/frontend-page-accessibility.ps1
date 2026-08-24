#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Script = Join-Path $Root "scripts/frontend-page-accessibility.mjs"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "node is required to plan frontend page-accessibility runs"
    exit 1
}

& node $Script @args
exit $LASTEXITCODE
