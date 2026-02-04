# ========== Phase 1.5: Lock File Strategy Decision ==========
Write-Host "========== Phase 1.5: Lock File Strategy ==========`n"

function Get-SemanticVersion {
    param($VersionString)
    if ($VersionString -match '(\d+\.\d+\.\d+)') {
        return [version]$matches[1]
    }
    return [version]"0.0.0"
}

function Test-LockFile {
    param($BranchName)
    
    Write-Host "評価中: $BranchName lock..."
    
    if ($BranchName -eq "main") {
        git checkout main -- package-lock.json
    }
    else {
        git show "${BranchName}:package-lock.json" > package-lock.json
    }
    
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
    npm ci 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm ci失敗 - フォールバック: npm install" -ForegroundColor Yellow
        Remove-Item package-lock.json -ErrorAction SilentlyContinue
        npm install 2>&1 | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ npm install も失敗 - このlockは使用不可" -ForegroundColor Red
            return @{
                Errors       = 999999
                TsVersion    = [version]"0.0.0"
                BuildSuccess = $false
            }
        }
    }
    
    # 型エラー数
    $errors = (npm run type-check 2>&1 | Select-String "error TS").Count
    
    # TypeScriptバージョン
    $tsVersionStr = (npm list typescript --depth=0 2>&1 | Select-String "typescript@").ToString()
    $tsVersion = Get-SemanticVersion $tsVersionStr
    
    # ビルド成功
    $hasBuildScript = (Get-Content package.json | Select-String '"build"').Count -gt 0
    if ($hasBuildScript) {
        npm run build 2>&1 | Out-File -FilePath "temp-${BranchName}-build.log"
        $buildSuccess = $LASTEXITCODE -eq 0
    }
    else {
        $buildSuccess = $true
    }
    
    Write-Host "$BranchName`: $errors errors, TS=$tsVersion, build=$buildSuccess`n"
    
    return @{
        Errors       = $errors
        TsVersion    = $tsVersion
        BuildSuccess = $buildSuccess
    }
}

# Step 1 & 2: 両ブランチ評価
$mainResult = Test-LockFile "main"
$featureResult = Test-LockFile "feature-restoration"

# Step 3: 多面的評価
$useFeature = $false
$reason = ""

if ($featureResult.Errors -lt $mainResult.Errors) {
    if ($featureResult.TsVersion -ge $mainResult.TsVersion) {
        if ($featureResult.BuildSuccess) {
            $useFeature = $true
            $reason = "型エラー減少($($featureResult.Errors) < $($mainResult.Errors)), TSバージョン維持, ビルド成功"
        }
        else {
            $reason = "❌ feature-restoration: ビルド失敗"
        }
    }
    else {
        $reason = "❌ feature-restoration: TypeScriptバージョン後退"
    }
}
else {
    $reason = "型エラー非改善($($featureResult.Errors) >= $($mainResult.Errors))"
}

# 最終判断
if ($useFeature) {
    Write-Host "✅ feature-restoration lockを採用" -ForegroundColor Green
    git show feature-restoration:package-lock.json > package-lock.json
}
else {
    Write-Host "✅ main lockを採用（安全策）" -ForegroundColor Yellow
    git checkout main -- package-lock.json
}

Write-Host "理由: $reason`n"

# 最終npm ci
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm ci

# クリーンアップ
Remove-Item temp-*-build.log -ErrorAction SilentlyContinue

Write-Host "========== Phase 1.5 完了 ==========`n"
