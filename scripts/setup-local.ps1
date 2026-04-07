param(
  [switch]$RunChecks,
  [switch]$RunTests,
  [switch]$StartBot
)

$ErrorActionPreference = "Stop"

function Assert-Command {
  param([string]$Name)
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Required command not found: $Name"
  }
  return $cmd
}

Write-Host "Checking local prerequisites..." -ForegroundColor Cyan
Assert-Command node | Out-Null
Assert-Command npm | Out-Null

Write-Host "Node and npm detected." -ForegroundColor Green

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host ".env created from .env.example" -ForegroundColor Yellow
}

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

if ($RunChecks) {
  Write-Host "Running syntax checks..." -ForegroundColor Cyan
  npm run check
}

if ($RunTests) {
  Write-Host "Running tests..." -ForegroundColor Cyan
  npm test
}

if ($StartBot) {
  Write-Host "Starting bot..." -ForegroundColor Cyan
  npm run start
}
