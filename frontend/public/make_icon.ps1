Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(10, 14, 23))

$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(37, 99, 235))
$g.FillEllipse($brush, 28, 28, 200, 200)

$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(6, 182, 212), 12)
$g.DrawEllipse($pen, 36, 36, 184, 184)

$font = New-Object System.Drawing.Font('Arial', 72, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString('RX', $font, $textBrush, 128, 128, $sf)

$pngPath = Join-Path $PSScriptRoot "icon.png"
$icoPath = Join-Path $PSScriptRoot "icon.ico"

$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

$hIcon = $bmp.GetHicon()
$ico = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$ico.Save($fs)
$fs.Close()
$g.Dispose()
$bmp.Dispose()
Write-Host "256x256 Icon generated successfully at $icoPath"
