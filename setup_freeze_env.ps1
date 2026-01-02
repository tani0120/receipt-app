$units = @(
    "ScreenA",
    "ScreenA_Detail",
    "ScreenA_Modal",
    "ScreenB",
    "ScreenB_Status",
    "ScreenC",
    "ScreenD",
    "ScreenE",
    "ScreenG",
    "ScreenH",
    "ScreenZ"
)

$gitHash = git rev-parse HEAD
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# 1. Create freeze root & Dashboard
New-Item -ItemType Directory -Force -Path "freeze" | Out-Null
Write-Host "Created freeze/ directory."

$dashboardHeader = @"
# UI Freeze Dashboard

| Unit ID | Phase A (Visual) | Phase B (Refactor) | Phase C (Contract) | Freeze Status |
| :--- | :--- | :--- | :--- | :--- |
"@

$dashboardRows = ""
foreach ($unit in $units) {
    $dashboardRows += "| **$unit** | - | - | - | - |`n"
}

$dashboardContent = "$dashboardHeader`n$dashboardRows"
$dashboardContent | Out-File -FilePath "freeze/README.md" -Encoding utf8
Write-Host "Created freeze/README.md (Dashboard)."

# 2. Loop for each unit
foreach ($unit in $units) {
    $dir = "freeze/$unit"
    
    # Create directories
    New-Item -ItemType Directory -Force -Path "$dir/screenshots" | Out-Null
    New-Item -ItemType Directory -Force -Path "$dir/technical-proofs" | Out-Null
    
    # Generate Unit README
    $readmeContent = @"
# UI Freeze Evidence: $unit
- Freeze Version: v1
- Captured At: $timestamp
- Commit Hash: $gitHash
"@
    $readmeContent | Out-File -FilePath "$dir/README.md" -Encoding utf8
    
    # Copy binding documents
    if (Test-Path "ui-freeze-checklist.yaml") {
        Copy-Item "ui-freeze-checklist.yaml" -Destination "$dir/ui-freeze-checklist.yaml" -Force
    } else {
        Write-Warning "Source ui-freeze-checklist.yaml not found!"
    }

    if (Test-Path "ui-freeze-appendix-b.md") {
        Copy-Item "ui-freeze-appendix-b.md" -Destination "$dir/ui-freeze-appendix-b-signed.md" -Force
    } else {
        Write-Warning "Source ui-freeze-appendix-b.md not found!"
    }

    Write-Host "Initialized $unit"
}

Write-Host "UI Freeze Environment Setup Completed."
