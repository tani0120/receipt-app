$body = @{ text = "__exec__:sync_mf_data:科目マスタのみ:latest"; clientId = "c_wTdnMKDO" } | ConvertTo-Json -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
$resp = Invoke-RestMethod -Uri "http://localhost:8080/api/ai-command" -Method POST -ContentType "application/json; charset=utf-8" -Body $bytes
$resp | ConvertTo-Json -Depth 5
