const fs = require('fs');
const path = 'C:/Users/kazen/OneDrive/ドキュメント/WindowsPowerShell/Microsoft.PowerShell_profile.ps1';
const content = [
  '# PS5 Blocker - Set-Content/Out-File/Add-Content disabled',
  '# Prevents Japanese file corruption by PowerShell 5.1',
  '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
  '$OutputEncoding = [System.Text.Encoding]::UTF8',
  "$PSDefaultParameterValues['*:Encoding'] = 'utf8'",
  "if (Get-Command pwsh -ErrorAction SilentlyContinue) { Write-Warning '[PS5] Use pwsh instead.' }",
  "Set-Alias -Name 'Set-Content' -Value 'Write-Error' -Scope Global -Force",
  "Set-Alias -Name 'Out-File' -Value 'Write-Error' -Scope Global -Force", 
  "Set-Alias -Name 'Add-Content' -Value 'Write-Error' -Scope Global -Force",
  '',
].join('\n');
fs.writeFileSync(path, content, { encoding: 'utf8' });
console.log('Profile written:', content.length, 'bytes');
