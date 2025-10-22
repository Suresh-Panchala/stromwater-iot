# StromWater - Download Installers Script
# Run this in PowerShell to download PostgreSQL and Mosquitto installers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "StromWater - Downloading Installers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create downloads folder
$downloadPath = "$env:USERPROFILE\Downloads\StromWater-Installers"
if (-not (Test-Path $downloadPath)) {
    New-Item -ItemType Directory -Path $downloadPath | Out-Null
    Write-Host "[Created] Download folder: $downloadPath" -ForegroundColor Green
}

Set-Location $downloadPath

Write-Host ""
Write-Host "Downloading installers to: $downloadPath" -ForegroundColor Yellow
Write-Host ""

# Download PostgreSQL
Write-Host "[1/2] Downloading PostgreSQL 15..." -ForegroundColor Cyan
$postgresUrl = "https://get.enterprisedb.com/postgresql/postgresql-15.9-1-windows-x64.exe"
$postgresFile = "postgresql-15.9-windows-x64.exe"

try {
    # Check if file already exists
    if (Test-Path $postgresFile) {
        Write-Host "      PostgreSQL installer already exists, skipping download" -ForegroundColor Yellow
    } else {
        Write-Host "      This may take 5-10 minutes (file size: ~300 MB)..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $postgresUrl -OutFile $postgresFile -UseBasicParsing
        Write-Host "      [OK] PostgreSQL downloaded successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "      [FAILED] Could not download PostgreSQL" -ForegroundColor Red
    Write-Host "      Please download manually from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
}

Write-Host ""

# Download Mosquitto
Write-Host "[2/2] Downloading Mosquitto..." -ForegroundColor Cyan
$mosquittoUrl = "https://mosquitto.org/files/binary/win64/mosquitto-2.0.18-install-windows-x64.exe"
$mosquittoFile = "mosquitto-2.0.18-install-windows-x64.exe"

try {
    # Check if file already exists
    if (Test-Path $mosquittoFile) {
        Write-Host "      Mosquitto installer already exists, skipping download" -ForegroundColor Yellow
    } else {
        Write-Host "      This should take less than 1 minute (file size: ~4 MB)..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $mosquittoUrl -OutFile $mosquittoFile -UseBasicParsing
        Write-Host "      [OK] Mosquitto downloaded successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "      [FAILED] Could not download Mosquitto" -ForegroundColor Red
    Write-Host "      Please download manually from: https://mosquitto.org/download/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Download Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Show what to do next
if (Test-Path $postgresFile) {
    Write-Host "[PostgreSQL Installer]" -ForegroundColor Green
    Write-Host "  Location: $downloadPath\$postgresFile" -ForegroundColor White
    Write-Host "  Size: $((Get-Item $postgresFile).Length / 1MB) MB" -ForegroundColor Gray
    Write-Host ""
}

if (Test-Path $mosquittoFile) {
    Write-Host "[Mosquitto Installer]" -ForegroundColor Green
    Write-Host "  Location: $downloadPath\$mosquittoFile" -ForegroundColor White
    Write-Host "  Size: $((Get-Item $mosquittoFile).Length / 1MB) MB" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Run PostgreSQL installer:" -ForegroundColor White
Write-Host "   - Set password: postgres" -ForegroundColor Gray
Write-Host "   - Use default settings" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run Mosquitto installer:" -ForegroundColor White
Write-Host "   - Use default settings" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Follow the detailed guide:" -ForegroundColor White
Write-Host "   - Open: install-prerequisites.md" -ForegroundColor Gray
Write-Host ""

# Open the download folder
Write-Host "Opening download folder..." -ForegroundColor Cyan
Start-Process explorer.exe $downloadPath

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
