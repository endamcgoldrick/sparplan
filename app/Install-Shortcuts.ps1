# Draws the Sparplan icon and adds Start-menu and desktop shortcuts. Run once:
#   powershell -ExecutionPolicy Bypass -File Install-Shortcuts.ps1
# To remove: delete "Sparplan.lnk" from the Start menu and desktop, and %LOCALAPPDATA%\Sparplan.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$app = $PSScriptRoot
$web = Join-Path $app 'web'

# Icon: the app's 7-step risk meter on an ink tile, bars coloured by horizon (short blue, medium green, long amber).
function New-IconPng([int]$s) {
  $bmp = New-Object Drawing.Bitmap $s, $s
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.Clear([Drawing.Color]::Transparent)
  $r = [int]($s * 0.22); $path = New-Object Drawing.Drawing2D.GraphicsPath
  $path.AddArc(0, 0, $r, $r, 180, 90); $path.AddArc($s - $r - 1, 0, $r, $r, 270, 90)
  $path.AddArc($s - $r - 1, $s - $r - 1, $r, $r, 0, 90); $path.AddArc(0, $s - $r - 1, $r, $r, 90, 90); $path.CloseFigure()
  $g.FillPath((New-Object Drawing.SolidBrush ([Drawing.ColorTranslator]::FromHtml('#1c2026'))), $path)
  $cols = '#80b1e6', '#80b1e6', '#67c4a0', '#67c4a0', '#e6a65c', '#e6a65c', '#e6a65c'
  $pad = $s * 0.17; $gap = $s * 0.035; $bw = ($s - 2 * $pad - 6 * $gap) / 7; $bottom = $s - $pad
  for ($i = 0; $i -lt 7; $i++) {
    $h = ($s - 2 * $pad) * (0.28 + 0.12 * $i)
    $g.FillRectangle((New-Object Drawing.SolidBrush ([Drawing.ColorTranslator]::FromHtml($cols[$i]))), [float]($pad + $i * ($bw + $gap)), [float]($bottom - $h), [float]$bw, [float]$h)
  }
  $g.Dispose(); $ms = New-Object IO.MemoryStream; $bmp.Save($ms, [Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
  , $ms.ToArray()
}
$sizes = 16, 24, 32, 48, 64, 256
$pngs = $sizes | ForEach-Object { , (New-IconPng $_) }
[IO.File]::WriteAllBytes((Join-Path $web 'icon.png'), (New-IconPng 192))

# .ico with PNG-compressed images (supported since Windows Vista)
$ico = Join-Path $app 'sparplan.ico'
$fs = [IO.File]::Create($ico); $w = New-Object IO.BinaryWriter $fs
$w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $d = if ($sizes[$i] -ge 256) { 0 } else { $sizes[$i] }
  $w.Write([byte]$d); $w.Write([byte]$d); $w.Write([byte]0); $w.Write([byte]0)
  $w.Write([uint16]1); $w.Write([uint16]32); $w.Write([uint32]$pngs[$i].Length); $w.Write([uint32]$offset)
  $offset += $pngs[$i].Length
}
foreach ($p in $pngs) { $w.Write($p) }
$w.Close()

$shell = New-Object -ComObject WScript.Shell
$targets = @([Environment]::GetFolderPath('Programs'), [Environment]::GetFolderPath('Desktop'))
foreach ($dir in $targets) {
  $lnk = $shell.CreateShortcut((Join-Path $dir 'Sparplan.lnk'))
  $lnk.TargetPath = "$env:SystemRoot\System32\wscript.exe"
  $lnk.Arguments = "`"$(Join-Path $app 'Start-Sparplan.vbs')`""
  $lnk.WorkingDirectory = $app
  $lnk.IconLocation = "$ico,0"
  $lnk.Description = 'Sparplan: Swedish savings options ranked by real risk'
  $lnk.Save()
  Write-Host "Shortcut: $(Join-Path $dir 'Sparplan.lnk')"
}
