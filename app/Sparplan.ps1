# Sparplan desktop app launcher.
# Serves the app from .\web and ..\market-data.json on http://localhost:47615 (loopback only), opens it in an
# Edge app window with its own profile, refreshes stale data with ..\refresh-data.ps1, and exits when the window closes.
# Run hidden via Start-Sparplan.vbs (what the Start-menu shortcut does), or directly:
#   powershell -ExecutionPolicy Bypass -File Sparplan.ps1
# -NoWindow starts only the server (for testing in another browser at http://localhost:47615).
param([switch]$NoWindow)
$ErrorActionPreference = 'Stop'
$app   = $PSScriptRoot
$web   = Join-Path $app 'web'
$root  = Split-Path $app -Parent
$data  = Join-Path $root 'market-data.json'
$refreshScript = Join-Path $root 'refresh-data.ps1'
$port  = 47615
$base  = "http://localhost:$port/"
$state = Join-Path $env:LOCALAPPDATA 'Sparplan'
New-Item -ItemType Directory -Force $state | Out-Null
$log   = Join-Path $state 'refresh.log'

$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") |
  Where-Object { Test-Path $_ } | Select-Object -First 1

function Show-Error($msg) {
  Add-Type -AssemblyName PresentationFramework
  [void][Windows.MessageBox]::Show($msg, 'Sparplan', 'OK', 'Error')
}
function Open-Window {
  # A separate Edge profile keeps the app's saved plans and watchlist apart from normal browsing.
  Start-Process $edge -ArgumentList "--app=$base", "--user-data-dir=`"$state\Edge`"", '--window-size=1360,900', '--no-first-run', '--no-default-browser-check'
}
if (-not $edge) { Show-Error 'Microsoft Edge was not found. Sparplan opens in an Edge app window.'; exit 1 }

$listener = New-Object Net.HttpListener
$listener.Prefixes.Add($base)
try { $listener.Start() }
catch {
  # Already running: just open another window onto it. Anything else on the port is not ours.
  try { $pong = Invoke-RestMethod "${base}api/ping" -TimeoutSec 3 } catch { $pong = $null }
  if ($pong -and $pong.app -eq 'sparplan') { Open-Window; exit 0 }
  Show-Error "Port $port is in use by another program, so Sparplan can't start."; exit 1
}

$token = [guid]::NewGuid().ToString('N')
$refresh = @{ proc = $null; started = $null; finished = $null; ok = $null; auto = $false }

function Start-Refresh([bool]$auto) {
  if ($refresh.proc -and -not $refresh.proc.HasExited) { return }
  # -NoNewWindow shares this script's hidden console, so no window flashes up
  $refresh.proc = Start-Process powershell.exe -NoNewWindow -PassThru `
    -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$refreshScript`"" `
    -RedirectStandardOutput $log -RedirectStandardError "$log.err"
  $refresh.started = Get-Date; $refresh.finished = $null; $refresh.ok = $null; $refresh.auto = $auto
}
function Get-Status {
  $p = $refresh.proc
  if ($p -and $p.HasExited -and -not $refresh.finished) {
    $refresh.finished = Get-Date; $refresh.ok = ($p.ExitCode -eq 0)
  }
  $running = [bool]($p -and -not $p.HasExited)
  $err = $null
  if ($refresh.ok -eq $false -and (Test-Path "$log.err")) { $err = ((Get-Content "$log.err" -Raw) -split "`r?`n" | Where-Object { $_ } | Select-Object -First 1) }
  [ordered]@{ app = 'sparplan'; running = $running; auto = $refresh.auto
    started = if ($refresh.started) { $refresh.started.ToString('o') } else { $null }
    finished = if ($refresh.finished) { $refresh.finished.ToString('o') } else { $null }
    ok = $refresh.ok; error = $err
    dataTime = if (Test-Path $data) { (Get-Item $data).LastWriteTime.ToString('o') } else { $null } }
}
# Data counts as stale once a weekday's Stockholm close (18:30 local, after the scheduled refresh) has passed since it was written.
function Test-Stale {
  if (-not (Test-Path $data)) { return $true }
  $t = Get-Date; $c = $t.Date.AddHours(18.5)
  if ($t -lt $c) { $c = $c.AddDays(-1) }
  while ($c.DayOfWeek -in 'Saturday', 'Sunday') { $c = $c.AddDays(-1) }
  (Get-Item $data).LastWriteTime -lt $c
}

$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.png' = 'image/png'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'
  '.woff2' = 'font/woff2'; '.webmanifest' = 'application/manifest+json'; '.txt' = 'text/plain; charset=utf-8' }
function Send($res, [int]$code, [byte[]]$body, [string]$type) {
  $res.StatusCode = $code
  if ($type) { $res.ContentType = $type }
  $res.Headers['Cache-Control'] = 'no-store'
  $res.Headers['X-Content-Type-Options'] = 'nosniff'
  $res.ContentLength64 = $body.Length
  if ($body.Length) { $res.OutputStream.Write($body, 0, $body.Length) }
  $res.Close()
}
function SendJson($res, $obj) { Send $res 200 ([Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Compress))) $types['.json'] }

if (Test-Stale) { Start-Refresh $true }
if (-not $NoWindow) { Open-Window }
$lastPing = Get-Date; $bye = $null
$webFull = [IO.Path]::GetFullPath($web).TrimEnd('\') + '\'

while ($true) {
  $task = $listener.GetContextAsync()
  # Exit when the window has gone: a goodbye beacon not followed by a reload, or no heartbeat for 150 seconds
  # (a minimised window's timers can slow to once a minute).
  while (-not $task.AsyncWaitHandle.WaitOne(1000)) {
    $now = Get-Date
    if (($bye -and ($now - $bye).TotalSeconds -gt 8) -or ($now - $lastPing).TotalSeconds -gt 150) { $listener.Stop(); exit 0 }
  }
  $ctx = $task.Result; $req = $ctx.Request; $res = $ctx.Response
  try {
    # Loopback only, and refuse other host names so a web page can't reach this server through DNS rebinding.
    if ($req.Headers['Host'] -notin @("localhost:$port", "127.0.0.1:$port")) { Send $res 403 @() $null; continue }
    $path = $req.Url.AbsolutePath
    $authed = ($req.Headers['X-Sparplan-Token'] -eq $token) -or ($req.QueryString['t'] -eq $token)
    if ($path.StartsWith('/api/')) {
      if ($path -eq '/api/ping') { $lastPing = Get-Date; if ($authed) { $bye = $null }; SendJson $res @{ app = 'sparplan' }; continue }
      if ($req.HttpMethod -ne 'POST' -or -not $authed) { Send $res 403 @() $null; continue }
      switch ($path) {
        '/api/status'  { $lastPing = Get-Date; $bye = $null; SendJson $res (Get-Status) }
        '/api/refresh' { Start-Refresh $false; SendJson $res (Get-Status) }
        '/api/bye'     { $bye = Get-Date; Send $res 204 @() $null }
        default        { Send $res 404 @() $null }
      }
      continue
    }
    if ($path -eq '/market-data.json') {
      if (Test-Path $data) { Send $res 200 ([IO.File]::ReadAllBytes($data)) $types['.json'] } else { Send $res 404 @() $null }
      continue
    }
    if ($path -eq '/') { $path = '/index.html' }
    $file = [IO.Path]::GetFullPath((Join-Path $web ($path.TrimStart('/') -replace '/', '\')))
    if (-not $file.StartsWith($webFull, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $file -PathType Leaf)) { Send $res 404 @() $null; continue }
    $ext = [IO.Path]::GetExtension($file).ToLower()
    if ($ext -eq '.html') {
      $html = [IO.File]::ReadAllText($file).Replace('__SPARPLAN_TOKEN__', $token)
      Send $res 200 ([Text.Encoding]::UTF8.GetBytes($html)) $types[$ext]
    } else { Send $res 200 ([IO.File]::ReadAllBytes($file)) $types[$ext] }
  } catch {
    try { $res.Abort() } catch {}
  }
}
