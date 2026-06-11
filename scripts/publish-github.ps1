# Matrix Smart Makkah - publish to GitHub
$ErrorActionPreference = "Stop"
$repoName = "matrix-smart-makkah"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) { gh auth login --hostname github.com --git-protocol https --web }
$user = (gh api user --jq .login).Trim()
$remoteUrl = "https://github.com/$user/$repoName.git"
Write-Host "GitHub user: $user"
$exists = gh repo view "$user/$repoName" 2>$null
if ($LASTEXITCODE -ne 0) {
  gh repo create $repoName --public --description "Matrix Smart Makkah Smart City OS by Abdulaziz AlAmawi" --source . --remote origin --push
} else {
  git remote set-url origin $remoteUrl
  git push -u origin main
}
Write-Host "Done: https://github.com/$user/$repoName"
