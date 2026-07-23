$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 5500
$prefix = "http://localhost:$port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try {
    $listener.Start()
} catch {
    Write-Host ""
    Write-Host "[!] Khong the mo cong $port : $_"
    Write-Host "    Co the cong dang bi chiem. Hay dong ung dung dang dung cong 5500 roi thu lai."
    Read-Host "Nhan Enter de dong"
    exit 1
}

Write-Host "============================================"
Write-Host "  Hoc toan cung Minh dang chay tai: $prefix"
Write-Host "  Thu muc goc: $root"
Write-Host "  De DUNG may chu: dong cua so nay (hoac Ctrl+C)."
Write-Host "============================================"

Start-Process $prefix

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "text/javascript; charset=utf-8"
    ".mjs"  = "text/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".pdf"  = "application/pdf"
    ".mp4"  = "video/mp4"
}

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
    } catch {
        break
    }
    $req = $ctx.Request
    $res = $ctx.Response
    $res.Headers.Add("Cache-Control", "no-store")
    $path = $req.Url.LocalPath
    if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }
    $rel = $path.TrimStart("/") -replace "/", "\"
    $file = Join-Path $root $rel
    try {
        if (Test-Path -LiteralPath $file -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($file).ToLower()
            $ct = $mime[$ext]
            if (-not $ct) { $ct = "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($file)
            $res.ContentType = $ct
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
            $res.OutputStream.Write($msg, 0, $msg.Length)
        }
    } catch {
        $res.StatusCode = 500
    } finally {
        $res.OutputStream.Close()
    }
}
