param(
    [ValidateSet('patch','minor','major','none')]
    [string]$Bump = 'patch',

    [string]$MarketplaceReadme = 'MARKETPLACE.md'
)

$ErrorActionPreference = 'Stop'

$gitExecutable = $null
try {
    $gitCommand = Get-Command git.exe -ErrorAction Stop
    $gitExecutable = $gitCommand.Source
} catch {
    $gitExecutable = $null
}

function Get-GitValue {
    param(
        [string[]]$GitArgs
    )

    if (eal-not $gitExecutable) {
        return 'N/A'
    }

    try {
        $value = & $gitExecutable @GitArgs 2>$null
        if ($LASTEXITCODE -ne 0) {
            return 'N/A'
        }
        return ($value | Out-String).Trim()
    } catch {
        return 'N/A'
    }
}

Write-Host "== AI4PB VSIX Release =="
Write-Host "Workspace: $PWD"
Write-Host "Version bump: $Bump"

if ($Bump -ne 'none') {
    Write-Host "Bumping version ($Bump)..."
    npm version $Bump --no-git-tag-version
}

Write-Host "Compiling extension..."
npm run compile

$packageJsonPath = Join-Path $PWD 'package.json'
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$extensionName = $packageJson.name
$extensionVersion = $packageJson.version

$releaseDir = Join-Path $PWD 'release'
if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

$vsixPath = Join-Path $releaseDir ("{0}-{1}.vsix" -f $extensionName, $extensionVersion)

$readmePath = Join-Path $PWD 'README.md'
$marketplaceReadmePath = Join-Path $PWD $MarketplaceReadme
$shouldSwapReadme = (Test-Path $readmePath) -and (Test-Path $marketplaceReadmePath)
$originalReadmeContent = $null

if ($shouldSwapReadme) {
    Write-Host "Marketplace README detected. Temporarily using: $marketplaceReadmePath"
    $originalReadmeContent = Get-Content -LiteralPath $readmePath -Raw -Encoding UTF8
}
else {
    Write-Host "Marketplace README not found. Using current README.md"
}

try {
    if ($shouldSwapReadme) {
        $marketplaceReadmeContent = Get-Content -LiteralPath $marketplaceReadmePath -Raw -Encoding UTF8
        Set-Content -LiteralPath $readmePath -Value $marketplaceReadmeContent -Encoding UTF8
    }

    Write-Host "Packaging VSIX: $vsixPath"
    npx @vscode/vsce package --out $vsixPath --allow-missing-repository --skip-license
}
finally {
    if ($shouldSwapReadme -and $null -ne $originalReadmeContent) {
        Set-Content -LiteralPath $readmePath -Value $originalReadmeContent -Encoding UTF8
        Write-Host "README.md restored after packaging."
    }
}

$nowLocal = Get-Date
$nowUtc = (Get-Date).ToUniversalTime()
$gitCommitFull = Get-GitValue @('rev-parse', 'HEAD')
$gitCommitShort = Get-GitValue @('rev-parse', '--short', 'HEAD')
$gitBranch = Get-GitValue @('rev-parse', '--abbrev-ref', 'HEAD')
$gitStatus = Get-GitValue @('status', '--porcelain')
$gitDirty = if ($gitStatus -eq 'N/A') { 'N/A' } elseif ([string]::IsNullOrWhiteSpace($gitStatus)) { 'clean' } else { 'dirty' }

$nodeVersion = (node --version | Out-String).Trim()
$npmVersion = (npm --version | Out-String).Trim()

$releaseInfoPath = Join-Path $releaseDir ("{0}-{1}-release-info.md" -f $extensionName, $extensionVersion)

$releaseInfo = @"
# Release Info

- Extension Name: $extensionName
- Version: $extensionVersion
- Publisher: $($packageJson.publisher)
- VSIX Path: $vsixPath
- Release Time (Local): $($nowLocal.ToString('yyyy-MM-dd HH:mm:ss zzz'))
- Release Time (UTC): $($nowUtc.ToString('yyyy-MM-dd HH:mm:ss'))
- Version Bump Mode: $Bump

## Git Metadata

- Commit (Full): $gitCommitFull
- Commit (Short): $gitCommitShort
- Branch: $gitBranch
- Working Tree: $gitDirty

## Build Environment

- Node.js: $nodeVersion
- npm: $npmVersion
- OS: $([System.Environment]::OSVersion.VersionString)
- Workspace: $PWD
"@

Set-Content -Path $releaseInfoPath -Value $releaseInfo -Encoding UTF8

Write-Host "Done. VSIX generated: $vsixPath"
Write-Host "Release info generated: $releaseInfoPath"
