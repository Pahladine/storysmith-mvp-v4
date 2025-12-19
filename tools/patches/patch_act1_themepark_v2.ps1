param()

$ErrorActionPreference = "Stop"

function WriteFileUtf8Bom([string]$path, [string]$content) {
  $dir = Split-Path -Parent $path
  if ($dir -and !(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  # Windows PowerShell's -Encoding utf8 writes BOM (good for 5.1)
  Set-Content -Path $path -Value $content -Encoding utf8
}

function Patch-ReplaceRegex([string]$path, [string]$pattern, [string]$replacement, [string]$label) {
  if (!(Test-Path $path)) { Write-Warning "SKIP ($label): missing file $path"; return }
  $raw = Get-Content $path -Raw
  if ($raw -notmatch $pattern) {
    Write-Warning "SKIP ($label): pattern not found in $path"
    return
  }
  $patched = [regex]::Replace($raw, $pattern, $replacement, "Singleline")
  WriteFileUtf8Bom $path $patched
  Write-Host "OK: $label"
}

# --- 1) Patch Act 1 script (Theme Park UX) ---
$act1 = Join-Path (Get-Location) "acts\act1.script.ts"
if (Test-Path $act1) {

  # A) Reader question: explicitly allow "same as hero"
  Patch-ReplaceRegex `
    $act1 `
    'host:\s*\(\)\s*=>\s*\[\s*"And who is the story being made for[^"]*"\s*\]' `
    'host: () => ["Who will read this story (the reader''s name)? It can be the hero (same child), or anyone you love." ]' `
    "Act1 reader prompt"

  # B) Relationship choices: add self-read option (robust against spacing/newlines)
  Patch-ReplaceRegex `
    $act1 `
    '(id:\s*"relationship"[\s\S]*?choices:\s*\[\s*)([\s\S]*?)(\s*\]\s*,)' `
    '$1$2, { label: "Same person (the hero reads their own story)", value: "Self" }$3' `
    "Act1 add self relationship option"

  # C) Companion prompt: ask type + name, with examples (handle smart quotes variations)
  Patch-ReplaceRegex `
    $act1 `
    'What.?s the companion.?s name\?\s*\(Optional[\s\S]*?invent one\.\)' `
    'What kind of companion is it, and what''s its name? (Optional - examples: "a baby axolotl named Billy", "Luna the playful puppy", "a tiny robot called Spark". Leave blank and I will invent one.)' `
    "Act1 companion prompt"

  # D) Vibe labels: make meaning explicit (match on value fields; safe even if labels differ)
  Patch-ReplaceRegex `
    $act1 `
    '\{\s*label:\s*"Gentle\s*&\s*cozy"\s*,\s*value:\s*"Gentle"\s*\}' `
    '{ label: "Gentle & cozy (bedtime-soft, reassuring, calm)", value: "Gentle" }' `
    "Act1 vibe label Gentle"

  Patch-ReplaceRegex `
    $act1 `
    '\{\s*label:\s*"Playful\s*&\s*silly"\s*,\s*value:\s*"Playful"\s*\}' `
    '{ label: "Playful & silly (funny, curious, lighthearted)", value: "Playful" }' `
    "Act1 vibe label Playful"

  Patch-ReplaceRegex `
    $act1 `
    '\{\s*label:\s*"Brave\s*&\s*bright"\s*,\s*value:\s*"Brave"\s*\}' `
    '{ label: "Brave & bright (bold but safe, hopeful, inspiring)", value: "Brave" }' `
    "Act1 vibe label Brave"

  # E) Place options: expand to 5 (including castle)
  Patch-ReplaceRegex `
    $act1 `
    '(id:\s*"place"[\s\S]*?choices:\s*\[)[\s\S]*?(\]\s*,)' `
    '$1
        { label: "A whispery forest (soft paths, friendly critters)", value: "Forest" },
        { label: "A sunny beach (sparkly waves, seashell secrets)", value: "Beach" },
        { label: "A cozy castle (warm halls, hidden doors)", value: "Castle" },
        { label: "An underwater reef (bubbles, colorful fish)", value: "Underwater" },
        { label: "A friendly corner of space (glowing stars, gentle planets)", value: "Space" }
      $2' `
    "Act1 place choices x5"

  Write-Host "Act1 patching complete."
} else {
  Write-Warning "acts\act1.script.ts not found; skipping Act1 patch."
}

# --- 2) Patch ChatWizard font sizing (best-effort; warns if patterns not found) ---
$wiz = Join-Path (Get-Location) "components\wizard\ChatWizard.tsx"
if (Test-Path $wiz) {
  $raw = Get-Content $wiz -Raw
  $patched = $raw

  # Common Tailwind text sizes in chat bubbles; we upscale them.
  $patched = $patched -replace 'text-sm', 'text-base md:text-lg'
  $patched = $patched -replace 'text-xs', 'text-sm'

  if ($patched -ne $raw) {
    Set-Content -Path $wiz -Value $patched -Encoding utf8
    Write-Host "OK: ChatWizard font upscale"
  } else {
    Write-Warning "ChatWizard found, but no text-sm/text-xs patterns matched. You may be using different classes."
  }
} else {
  Write-Warning "components\wizard\ChatWizard.tsx not found; skipping font patch."
}

Write-Host "DONE. Now run: npm run build"
