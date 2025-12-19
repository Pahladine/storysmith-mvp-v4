try {
  $path = Join-Path (Get-Location).Path "pages\api\regenerate-scene.ts"
  if (!(Test-Path $path)) { throw "Missing file: $path" }

  # Backup
  $bak = "$path.bak_{0}" -f (Get-Date -Format "yyyyMMdd_HHmmss")
  Copy-Item $path $bak -Force
  Write-Host ("Backup: {0}" -f $bak)

  $lines = Get-Content -LiteralPath $path

  if ($lines -match "QUALITY MANDATE:") {
    Write-Host "Already patched (QUALITY MANDATE found). No changes made."
    return
  }

  $out = New-Object System.Collections.Generic.List[string]
  $systemInjected = $false
  $userInjected = $false

  foreach ($line in $lines) {

    # SYSTEM injection: replace the Audience line with a block
    if (-not $systemInjected -and $line -match '^\s*"Audience:\s*children\s*\+\s*a\s*tired\s*adult\s*reader;') {
      $out.Add('    "Audience: children + a tired adult reader; warm, safe, non-scary, gently playful.",')
      $out.Add('    "QUALITY MANDATE: improve pacing (match rhythm to action) and clarity without changing the core events.",')
      $out.Add('    "QUALITY MANDATE: include at least TWO sensory details (sound/smell/touch/taste) and a simple emotional arc stated plainly.",')
      $out.Add('    "QUALITY MANDATE: preserve continuity with the outline summary; do not introduce new named characters.",')
      $out.Add('    "STYLE: warm, inviting, lightly theatrical, zero jargon, never condescending. No peril or scary imagery.",')
      $out.Add('    "STYLE: keep names consistent; never duplicate names; never output repeated name sequences.",')
      $systemInjected = $true
      continue
    }

    # USER injection: insert mandate lines immediately BEFORE the "Also provide a concise" line
    if (-not $userInjected -and $line -match '^\s*"Also provide a concise') {
      $out.Add('    "Add at least two sensory details (sound/smell/touch/taste) and clearly state the hero feelings in simple words.",')
      $out.Add('    "If this is not the first scene, start with a gentle transition that connects from what just happened before.",')
      $out.Add('    "Keep it gentle, playful, and safe for kids. Avoid violence, horror, or threats.",')
      $userInjected = $true
      # fall through to keep the original "Also provide..." line
    }

    $out.Add($line)
  }

  if (-not $systemInjected) { throw "Did not find Audience line. File differs from expected structure." }
  if (-not $userInjected)   { throw "Did not find the 'Also provide a concise' line. File differs from expected structure." }

  # Write UTF-8 no BOM (explicit)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllLines($path, $out.ToArray(), $utf8NoBom)

  Write-Host ("Patched successfully: {0}" -f $path)
}
catch {
  Write-Host "PATCH FAILED:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
}