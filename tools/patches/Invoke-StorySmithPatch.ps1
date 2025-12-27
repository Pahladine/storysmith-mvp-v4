param(
  [ValidateSet("RepoState","InspectImmersive","PatchImmersiveDeclutter")]
  [string]$Task = "RepoState"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RepoRoot {
  $root = (& git rev-parse --show-toplevel 2>$null)
  if (-not $root) { throw "Not a git repo (cannot resolve repo root)." }
  return $root.Trim()
}

function Hdr([string]$t) {
  Write-Host ""
  Write-Host ("="*78)
  Write-Host $t
  Write-Host ("="*78)
}

function Warn([string]$t) { Write-Host ("WARN: " + $t) -ForegroundColor Yellow }

function Assert-CleanTracked {
  $porcelain = @(& git status --porcelain)
  $tracked = @($porcelain | Where-Object { $_ -and ($_ -notmatch '^\?\? ') })
  if ($tracked.Count -gt 0) {
    Write-Host ""
    Write-Host "Tracked changes detected (abort):" -ForegroundColor Yellow
    $tracked | ForEach-Object { Write-Host ("  " + $_) }
    throw "Commit or restore tracked changes, then rerun."
  }
}

function Backup-FileAbs([string]$absFilePath) {
  $stamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
  $bak = "$absFilePath.pre_$stamp"
  Copy-Item -LiteralPath $absFilePath -Destination $bak -Force
  return $bak
}

function Write-Utf8NoBomAbs([string]$absPath, [string[]]$lines) {
  $dir = Split-Path -Parent $absPath
  if ($dir -and !(Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  $content = ($lines -join "`r`n") + "`r`n"
  [System.IO.File]::WriteAllText($absPath, $content, $utf8NoBom)
}

# --- Begin ---
$root = Get-RepoRoot
Set-Location $root

Hdr "Repo State"
Write-Host ("Root:   " + $root)
Write-Host ("Branch: " + ((& git branch --show-current).Trim()))
Write-Host ("HEAD:   " + ((& git rev-parse --short HEAD).Trim()))
Write-Host ""
Write-Host "git status --porcelain:"
@(& git status --porcelain) | ForEach-Object { Write-Host ("  " + $_) }

$rel = "components/wizard/ChatWizard.tsx"
$abs = Join-Path $root $rel

if ($Task -eq "RepoState") {
  Hdr "Ready"
  Write-Host "Invoke with:"
  Write-Host "  -Task InspectImmersive"
  Write-Host "  -Task PatchImmersiveDeclutter"
  return
}

if ($Task -eq "InspectImmersive") {
  Hdr "Inspect (quick)"
  & git grep -n "onClick={() => setTranscriptOpen" $rel
  & git grep -n "data-ss-stage-continue" $rel
  & git grep -n "You can change choices later" $rel
  return
}

if ($Task -eq "PatchImmersiveDeclutter") {
  Assert-CleanTracked

  Hdr "Patch: Immersive Declutter v7"
  if (-not (Test-Path -LiteralPath $abs)) { throw ("Missing: " + $abs) }

  $bak = Backup-FileAbs $abs
  Write-Host ("Backup: " + $bak)

  $lines = Get-Content -LiteralPath $abs -Encoding UTF8
  $beforeHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $abs).Hash

  # A) Wrap the transcript toggle BUTTON in {!isImmersive && ( ... )}
  # Find the FIRST line that looks like the transcript toggle onClick (avoid the useState line).
  $hitIdx = -1
  for ($i=0; $i -lt $lines.Count; $i++) {
    $t = $lines[$i]
    if ($t -match 'onClick=\{\(\)\s*=>\s*setTranscriptOpen' -and $t -match 'setTranscriptOpen') {
      $hitIdx = $i
      break
    }
  }
  if ($hitIdx -lt 0) {
    throw "Could not find transcript toggle onClick line (onClick => setTranscriptOpen) in ChatWizard.tsx."
  }

  # Walk up to the <button
  $startIdx = $hitIdx
  while ($startIdx -ge 0 -and ($lines[$startIdx] -notmatch '<button\b')) { $startIdx-- }
  if ($startIdx -lt 0) { throw "Found onClick line but could not locate opening <button> above it." }

  # Walk down to </button>
  $endIdx = $hitIdx
  while ($endIdx -lt $lines.Count -and ($lines[$endIdx] -notmatch '</button>')) { $endIdx++ }
  if ($endIdx -ge $lines.Count) { throw "Found <button> but could not locate closing </button> after it." }

  # If already wrapped, skip
  $prev = if ($startIdx -gt 0) { $lines[$startIdx-1] } else { "" }
  if ($prev -match '\{!isImmersive\s*&&\s*\(') {
    Warn "Transcript button already wrapped; skipping transcript wrap."
  } else {
    $indent = ([regex]::Match($lines[$startIdx], '^\s*')).Value
    $block = $lines[$startIdx..$endIdx]

    $newLines = @()
    $newLines += $lines[0..($startIdx-1)]
    $newLines += ($indent + "{!isImmersive && (")
    $newLines += $block
    $newLines += ($indent + ")}")
    if ($endIdx + 1 -le $lines.Count-1) {
      $newLines += $lines[($endIdx+1)..($lines.Count-1)]
    }
    $lines = $newLines
  }

  # B) Gate helper line out of immersive (best-effort)
  $helperExact = '<div className="mt-3 text-sm opacity-60">You can change choices later.</div>'
  $foundHelper = $false
  for ($i=0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -eq $helperExact) {
      $lines[$i] = '{!isImmersive ? <div className="mt-3 text-sm opacity-60">You can change choices later.</div> : null}'
      $foundHelper = $true
      break
    }
  }
  if (-not $foundHelper) { Warn "Helper line not found exactly; skipping helper gating." }

  # C) Align stage continue (best-effort)
  $aligned = $false
  for ($i=0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'data-ss-stage-continue' -and $lines[$i] -match 'className="mt-4 flex justify-end"') {
      $lines[$i] = $lines[$i].Replace('className="mt-4 flex justify-end"', 'className="mt-3 max-w-4xl mx-auto flex justify-end"')
      $aligned = $true
      break
    }
  }
  if (-not $aligned) { Warn "Stage-continue mt-4 alignment string not found; skipping alignment." }

  Write-Utf8NoBomAbs $abs $lines

  $afterHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $abs).Hash
  if ($afterHash -eq $beforeHash) { throw "No changes written (file hash unchanged). Aborting." }

  Write-Host "OK: Applied immersive declutter v7 (transcript button removed in immersive, plus best-effort tweaks)." -ForegroundColor Green

  Hdr "Verify"
  & git diff --stat
  Write-Host ""
  & git grep -n "onClick={() => setTranscriptOpen" $rel
  & git grep -n "{!isImmersive && (" $rel
  & git grep -n "You can change choices later" $rel
  & git grep -n "data-ss-stage-continue" $rel

  Hdr "Build"
  & npm run build
  if ($LASTEXITCODE -ne 0) { throw ("npm run build failed with exit code " + $LASTEXITCODE) }
  Write-Host "BUILD: OK"

  Hdr "Test checklist"
  Write-Host "1) npm run dev"
  Write-Host "2) /start  -> transcript toggle should exist + work."
  Write-Host "3) /start?ui=immersive -> transcript toggle button should be gone (no click target)."
  return
}

throw "Unhandled task: $Task"
