<#
Export-StorySmithHandoffZip.ps1
Creates a curated zip snapshot of a Next.js/TS repo for AI handoff:
- Includes: pages/, components/, src/, lib/, styles/, config files, docs
- Optionally includes: public/
- Excludes: node_modules/, .next/, .git/, out/, dist/, build/, coverage/, .vercel/, etc.
- Produces: ZIP + manifest CSV + manifest TXT
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory=$false)]
  [string]$RepoRoot = (Get-Location).Path,

  [Parameter(Mandatory=$false)]
  [string]$OutDir = (Join-Path (Get-Location).Path "_handoff"),

  [Parameter(Mandatory=$false)]
  [switch]$IncludePublic,

  [Parameter(Mandatory=$false)]
  [switch]$KeepTemp,

  [Parameter(Mandatory=$false)]
  [switch]$IncludeBackups
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RelPath {
  param([string]$Root, [string]$Full)
  $rootFull = (Resolve-Path $Root).Path.TrimEnd('\','/')
  $fullPath = (Resolve-Path $Full).Path
  if ($fullPath.Length -le $rootFull.Length) { return "" }
  return $fullPath.Substring($rootFull.Length).TrimStart('\','/')
}

function Test-IsUnderTopFolder {
  param([string]$Rel, [string[]]$TopFolders)
  foreach ($f in $TopFolders) {
    if ($Rel -like "$f\*" -or $Rel -eq $f) { return $true }
  }
  return $false
}

function Get-Bucket {
  param([string]$RelPath)

  # Normalize slashes for matching
  $p = $RelPath -replace '/', '\'

  if ($p -like "pages\api\*") { return "API_ROUTES" }
  if ($p -like "pages\*") { return "PAGES_ROUTES" }
  if ($p -like "components\*") { return "COMPONENTS" }
  if ($p -like "src\*") { return "SRC_LIB" }
  if ($p -like "lib\*") { return "SRC_LIB" }
  if ($p -like "styles\*") { return "STYLES" }
  if ($p -like "public\*") { return "PUBLIC" }
  if ($p -like "acts\*") { return "ACTS" }
  if ($p -like "tools\*") { return "TOOLS" }# Config / root files
  $leaf = Split-Path $p -Leaf
  $rootConfig = @(
    "package.json","package-lock.json","yarn.lock","pnpm-lock.yaml",
    "tsconfig.json","jsconfig.json",
    "next.config.js","next.config.mjs","next.config.ts",
    "tailwind.config.js","tailwind.config.cjs","tailwind.config.ts",
    "postcss.config.js","postcss.config.cjs",
    ".eslintrc",".eslintrc.js",".eslintrc.cjs",".eslintrc.json",
    ".prettierrc",".prettierrc.js",".prettierrc.json",
    "vercel.json",
    ".env.example",".env.local.example",".env.template"
  )
  if ($rootConfig -contains $leaf) { return "CONFIG" }

  # Docs
  if ($p -match '\.(md|txt)$') { return "DOCS" }

  return "OTHER"
}

# --- Validate repo root ---
$RepoRoot = (Resolve-Path $RepoRoot).Path
if (-not (Test-Path $RepoRoot)) { throw "RepoRoot not found: $RepoRoot" }

# --- Excluded directories (anywhere in path) ---
$ExcludedDirNames = @(
  "node_modules",".next",".git",".vercel","out","dist","build","coverage",
  ".turbo",".cache",".swc",".pnpm-store",".yarn"
)

# --- Included top folders ---
$IncludeTopFolders = @("pages","components","src","lib","styles","acts","tools")
if ($IncludePublic) { $IncludeTopFolders += "public" }

# --- Always-include root-ish files by name ---
$IncludeRootFiles = @(
  "package.json","package-lock.json","yarn.lock","pnpm-lock.yaml",
  "tsconfig.json","jsconfig.json",
  "next.config.js","next.config.mjs","next.config.ts",
  "tailwind.config.js","tailwind.config.cjs","tailwind.config.ts",
  "postcss.config.js","postcss.config.cjs",
  ".eslintrc",".eslintrc.js",".eslintrc.cjs",".eslintrc.json",
  ".prettierrc",".prettierrc.js",".prettierrc.json",
  "vercel.json",
  ".env.example",".env.local.example",".env.template",  "README.md",
  ".gitignore",
  "next-env.d.ts",
  "Export-StorySmithHandoffZip.ps1"
)

# --- Excluded file extensions (large/binary/noisy) ---
$ExcludedExtensions = @(".zip",".7z",".rar",".mp4",".mov",".mkv",".psd",".ai",".sketch")

# --- Find candidate files ---
$allFiles = Get-ChildItem -Path $RepoRoot -Recurse -File -Force

# Filter out excluded dirs
$filtered = $allFiles | Where-Object {
  $full = $_.FullName
  foreach ($d in $ExcludedDirNames) {
    if ($full -match [regex]::Escape("\$d\")) { return $false }
  }
  return $true
}

# Filter out excluded extensions
$filtered = $filtered | Where-Object {
  $ext = $_.Extension.ToLowerInvariant()
  return -not ($ExcludedExtensions -contains $ext)
}

# Exclude backup artifacts unless explicitly requested
if (-not $IncludeBackups) {
  $filtered = $filtered | Where-Object {
    $n = $_.Name
    # excludes: foo.bak_*, foo.bak.*, foo.tsx.bak, etc.
    return ($n -notmatch '\.bak([_.].+)?$')
  }
}

# Select included set:
# - anything under included top folders
# - OR root included files by name (any depth, but typically root)
# - OR docs (.md/.txt) anywhere (helps with blueprints/manifests)
$selected = $filtered | Where-Object {
  $rel = Get-RelPath -Root $RepoRoot -Full $_.FullName
  $bucket = Get-Bucket -RelPath $rel

  if (Test-IsUnderTopFolder -Rel $rel -TopFolders $IncludeTopFolders) { return $true }
  if ($IncludeRootFiles -contains (Split-Path $rel -Leaf)) { return $true }
  if ($bucket -eq "DOCS") { return $true }

  return $false
}

# Build manifest records
$records = foreach ($f in $selected) {
  $rel = Get-RelPath -Root $RepoRoot -Full $f.FullName
  [PSCustomObject]@{
    Bucket       = (Get-Bucket -RelPath $rel)
    RelativePath = $rel
    SizeKB       = [math]::Round(($f.Length / 1KB), 2)
    LastWrite    = $f.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
  }
}

# Sort for readability
$records = $records | Sort-Object Bucket, RelativePath

# Output locations
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipPath = Join-Path $OutDir "storysmith_handoff_$stamp.zip"
$csvPath = Join-Path $OutDir "storysmith_handoff_$stamp.manifest.csv"
$txtPath = Join-Path $OutDir "storysmith_handoff_$stamp.manifest.txt"

# Write manifests
$records | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $csvPath

$summary = @()
$summary += "StorySmith Handoff Snapshot"
$summary += "RepoRoot: $RepoRoot"
$summary += "IncludePublic: $IncludePublic"
$summary += "SelectedFiles: $($records.Count)"
$summary += ""
$summary += "Counts by bucket:"
$bucketCounts = $records | Group-Object Bucket | Sort-Object Name
foreach ($b in $bucketCounts) { $summary += ("- {0}: {1}" -f $b.Name, $b.Count) }
$summary += ""
$summary += "First 200 files (Bucket | RelativePath):"
$preview = $records | Select-Object -First 200
foreach ($r in $preview) { $summary += ("{0} | {1}" -f $r.Bucket, $r.RelativePath) }
if ($records.Count -gt 200) { $summary += "... (see CSV for full list)" }

$summary | Out-File -Encoding UTF8 -FilePath $txtPath

# Stage files into temp directory preserving relative paths
$tempRoot = Join-Path $env:TEMP "ssv4_handoff_stage_$stamp"
New-Item -ItemType Directory -Path $tempRoot | Out-Null

foreach ($r in $records) {
  $src = Join-Path $RepoRoot $r.RelativePath
  $dest = Join-Path $tempRoot $r.RelativePath
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  Copy-Item -Path $src -Destination $dest -Force
}

# Also include manifests in the zip
Copy-Item -Path $csvPath -Destination (Join-Path $tempRoot (Split-Path $csvPath -Leaf)) -Force
Copy-Item -Path $txtPath -Destination (Join-Path $tempRoot (Split-Path $txtPath -Leaf)) -Force

# Create zip
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $tempRoot "*") -DestinationPath $zipPath -Force

# Cleanup
if (-not $KeepTemp) {
  Remove-Item -Path $tempRoot -Recurse -Force
}

Write-Host ""
Write-Host "Done."
Write-Host "ZIP:  $zipPath"
Write-Host "CSV:  $csvPath"
Write-Host "TXT:  $txtPath"
Write-Host "Files included: $($records.Count)"

