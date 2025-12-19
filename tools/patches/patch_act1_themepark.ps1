$ErrorActionPreference = "Stop"

function Find-FirstFile($relativeHint, $filename) {
  $hint = Join-Path (Get-Location) $relativeHint
  if (Test-Path $hint) { return (Resolve-Path $hint).Path }

  $match = Get-ChildItem -Recurse -File -Filter $filename | Select-Object -First 1
  if ($null -ne $match) { return $match.FullName }

  throw "Could not find $filename (looked for $relativeHint and then searched recursively). Run this from the repo root."
}

$path = Find-FirstFile "acts\act1.script.ts" "act1.script.ts"
Write-Host "Patching: $path"

# Read (UTF-8) and strip BOM if present
$raw = Get-Content -Path $path -Raw -Encoding UTF8
if ($raw.Length -gt 0 -and $raw[0] -eq [char]0xFEFF) { $raw = $raw.Substring(1) }

# -------------------------------------------------------------------
# 1) Add "Self" to relationship union type (Act1State)
# -------------------------------------------------------------------
$raw = $raw -replace '"Parent"\s*\|\s*"Grandparent"\s*\|\s*"Friends"\s*\|\s*"Other"',
                    '"Parent" | "Grandparent" | "Friends" | "Self" | "Other"'

# -------------------------------------------------------------------
# 2) Insert relationship choice: Self-reader
# -------------------------------------------------------------------
$raw = [regex]::Replace(
  $raw,
  '(?s)(id:\s*"relationship",\s*.*?choices:\s*\[\s*)(.*?)(\s*\]\s*,)',
  {
    param($m)
    $head = $m.Groups[1].Value
    $body = $m.Groups[2].Value
    $tail = $m.Groups[3].Value

    if ($body -match 'value:\s*"Self"') { return $m.Value }

    $insert = '      { label: "Same person (the hero will read it)", value: "Self" },' + "`r`n"
    return $head + $insert + $body + $tail
  },
  1
)

# -------------------------------------------------------------------
# 3) Upgrade companion prompt to ask "type + name"
# -------------------------------------------------------------------
$oldCompanion = "What is the companion's name? (Optional — I can invent one.)"
$newCompanion = "What kind of companion is it, and what's its name? (Optional - examples: 'a baby axolotl named Billy', 'Luna the playful puppy', 'a tiny robot called Spark'. Leave blank and I'll invent one.)"
if ($raw -like "*$oldCompanion*") {
  $raw = $raw.Replace($oldCompanion, $newCompanion)
} else {
  Write-Warning "Did not find the exact companion prompt line to replace. No change made for companion prompt."
}

# -------------------------------------------------------------------
# 4) Make vibe choices self-explanatory (labels only)
# -------------------------------------------------------------------
$raw = $raw.Replace('{ label: "Gentle & cozy", value: "Gentle" },',
                    '{ label: "Gentle & cozy (bedtime-soft, reassuring)", value: "Gentle" },')
$raw = $raw.Replace('{ label: "Playful & silly", value: "Playful" },',
                    '{ label: "Playful & silly (funny, curious, lighthearted)", value: "Playful" },')
$raw = $raw.Replace('{ label: "Brave & bright", value: "Brave" },',
                    '{ label: "Brave & bright (bold but safe, hopeful)", value: "Brave" },')

# -------------------------------------------------------------------
# 5) Expand place union + choices (adds Castle, Village, Mountains)
# -------------------------------------------------------------------
$raw = $raw -replace '"Forest"\s*\|\s*"Beach"\s*\|\s*"Space"',
                    '"Forest" | "Beach" | "Space" | "Castle" | "Village" | "Mountains"'

$raw = [regex]::Replace(
  $raw,
  '(?s)(id:\s*"place",\s*.*?choices:\s*\[\s*)(.*?)(\s*\]\s*,)',
  {
    param($m)
    $head = $m.Groups[1].Value
    $body = $m.Groups[2].Value
    $tail = $m.Groups[3].Value

    if ($body -match 'value:\s*"Castle"' ) { return $m.Value }

    $add = @(
      '      { label: "A storybook castle", value: "Castle" },'
      '      { label: "A friendly little village", value: "Village" },'
      '      { label: "A gentle mountain trail", value: "Mountains" },'
    ) -join "`r`n"

    # Insert after the first existing choice block line for nicer ordering
    return $head + $body.TrimEnd() + "`r`n" + $add + "`r`n" + $tail
  },
  1
)

# Write UTF-8 (no BOM)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($path, $raw, $utf8NoBom)

Write-Host "Patched OK: $path"
