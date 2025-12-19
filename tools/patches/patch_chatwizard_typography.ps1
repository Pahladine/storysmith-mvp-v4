$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$path = Join-Path $PSScriptRoot "components\wizard\ChatWizard.tsx"
if (!(Test-Path $path)) { throw "Missing file: $path" }

$raw = Get-Content -Raw -Encoding UTF8 $path

# Bigger overall container text
$raw = $raw.Replace("max-w-3xl px-4 py-6 text-base md:text-lg", "max-w-3xl px-4 py-6 text-lg md:text-xl")

# Bigger persona header card + cleaner class duplicates
$raw = $raw.Replace("mb-4 rounded-2xl border bg-white p-4 shadow-sm text-base md:text-lg", "mb-4 rounded-2xl border bg-white p-5 shadow-sm text-lg md:text-xl")
$raw = $raw.Replace("text-base md:text-lg font-semibold text-base md:text-lg", "text-2xl md:text-3xl font-semibold")
$raw = $raw.Replace("text-sm opacity-80 text-base md:text-lg", "text-lg md:text-xl opacity-80")

# Bigger “host” labels inside messages
$raw = $raw.Replace("text-sm font-medium opacity-80 text-base md:text-lg", "text-lg md:text-xl font-medium opacity-80")
$raw = $raw.Replace("mt-1 text-black/90 text-base md:text-lg", "mt-2 text-lg md:text-xl text-black/90 leading-relaxed")

# Bigger chat bubbles
$raw = $raw.Replace("rounded-2xl border bg-white p-3 shadow-sm text-base md:text-lg", "rounded-2xl border bg-white p-4 shadow-sm text-lg md:text-xl leading-relaxed")

# Write UTF-8 no BOM (prevents odd glyph issues)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($path, $raw, $utf8NoBom)

Write-Host "Patched typography: $path" -ForegroundColor Green
