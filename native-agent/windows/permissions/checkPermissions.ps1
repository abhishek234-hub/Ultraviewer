# RemoteX Windows Permission & Display Diagnostic Utility
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " RemoteX Windows Environment Diagnostics  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check OS Version
$os = Get-CimInstance Win32_OperatingSystem
Write-Host "Operating System : $($os.Caption) ($($os.OSArchitecture))" -ForegroundColor Green

# 2. Check Display Metrics
Add-Type -AssemblyName System.Windows.Forms
$screens = [System.Windows.Forms.Screen]::AllScreens
Write-Host "Connected Displays: $($screens.Count)" -ForegroundColor Green
foreach ($s in $screens) {
    Write-Host "  - $($s.DeviceName): $($s.Bounds.Width)x$($s.Bounds.Height) (Primary: $($s.Primary))" -ForegroundColor Gray
}

# 3. Check Native Helper
$helperPath = Join-Path $PSScriptRoot "..\input\bin\RemoteXInputHelper.exe"
if (Test-Path $helperPath) {
    Write-Host "Native Input Helper : Present ($helperPath)" -ForegroundColor Green
} else {
    Write-Host "Native Input Helper : Missing, please build first" -ForegroundColor Red
}

Write-Host "Diagnostics completed successfully." -ForegroundColor Cyan
