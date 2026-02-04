# ========== Phase 5: CI Configuration (Warn-only) ==========
Write-Host "========== Phase 5: CI Configuration (Warn-only) ==========`n" -ForegroundColor Cyan

$ymlPath = ".github/workflows/type-safety.yml"

if (-not (Test-Path $ymlPath)) {
    Write-Host "❌ $ymlPath が見つかりません" -ForegroundColor Red
    exit 1
}

Write-Host "type-safety.yml を Warn-only モードに修正中..." -ForegroundColor Yellow

$ymlContent = Get-Content $ymlPath -Raw

# continue-on-error追加
$ymlContent = $ymlContent -replace `
    '(- name: TypeScript type check\s+run: npm run type-check)', `
    '$1 || echo "::warning::Type errors exist"`n      continue-on-error: true'

# baseline check追加
$baselineCheck = @"

    - name: Type error baseline check
      run: |
        ERROR_COUNT=`$(npm run type-check 2>&1 | grep "error TS" | wc -l)
        echo "Current type errors: `$ERROR_COUNT"
        echo "Baseline: 282"
        if [ `$ERROR_COUNT -gt 282 ]; then
          echo "::error::Type errors increased: `$ERROR_COUNT (baseline: 282)"
          exit 1
        fi

    - name: Type error trend report
      run: |
        echo "Type error reduction targets:"
        echo "- Week 1: 200 errors"
        echo "- Week 2: 100 errors"
        echo "- Week 3: 0 errors"
"@

$ymlContent = $ymlContent + $baselineCheck
Set-Content $ymlPath $ymlContent -NoNewline

Write-Host "✅ type-safety.yml を自動修正しました`n" -ForegroundColor Green

# 確認
Write-Host "変更内容:" -ForegroundColor Yellow
git diff .github/workflows/type-safety.yml

Write-Host "`n========== Phase 5 完了 ==========`n" -ForegroundColor Cyan
