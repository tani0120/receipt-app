# Cloud Build 権限設定（トグルスイッチで解決）

## エラー内容

```
ERROR: (gcloud.builds.submit) INVALID_ARGUMENT: 
could not create build: generic::permission_denied: 
'create' denied on resource (or it may not exist)., forbidden
```

---

## ✅ 解決方法（2分で完了）

### ステップ1: Cloud Build設定ページを開く

URLを開く：
```
https://console.cloud.google.com/cloud-build/settings/service-account?project=sugu-suru
```

### ステップ2: 権限を有効化

表が表示されるので、以下をすべて**「有効」**に切り替え：

- [ ] **Cloud Run** → 有効
- [ ] **Service Accounts** → 有効  
- [ ] **Secret Manager** → 有効（任意）

### ステップ3: 保存

「保存」をクリック

---

## 再デプロイ

権限を有効化したら、再度ビルドを実行：

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
gcloud builds submit --tag gcr.io/sugu-suru/receipt-api --project=sugu-suru
```

---

## なぜこの方法が確実か？

- ✅ 画面で直感的に設定できる
- ✅ 必要な権限がすべて一括で付与される
- ✅ IAMの複雑な設定が不要
- ✅ Google推奨の方法

---

## 参考：手動でIAMを設定する場合

もしトグルスイッチが見つからない場合：

```powershell
# プロジェクト番号を確認
$PROJECT_NUMBER = (gcloud projects describe sugu-suru --format="value(projectNumber)")

# Cloud Run権限
gcloud projects add-iam-policy-binding sugu-suru `
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
  --role="roles/run.admin"

# サービスアカウント権限
gcloud projects add-iam-policy-binding sugu-suru `
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
  --role="roles/iam.serviceAccountUser"

# Artifact Registry権限
gcloud projects add-iam-policy-binding sugu-suru `
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
  --role="roles/artifactregistry.writer"
```
