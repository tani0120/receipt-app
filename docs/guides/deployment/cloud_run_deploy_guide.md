# Cloud Run デプロイ手順

## 方法1: Google Cloud Console（ブラウザ）

1. https://console.cloud.google.com/run にアクセス
2. プロジェクト `sugu-suru` を選択
3. 既存のサービス `receipt-api-8339700410` をクリック
4. 「新しいリビジョンを編集してデプロイ」をクリック
5. 「ソースリポジトリ」→「GitHub」を選択
6. リポジトリを接続してデプロイ

## 方法2: GitHub Actionsで自動デプロイ

`.github/workflows/deploy.yml` を作成して、GitHubにプッシュするだけでデプロイ

## 方法3: gcloud CLI（要インストール）

```powershell
# gcloud CLIのインストール（初回のみ）
winget install Google.CloudSDK

# デプロイ
gcloud run deploy receipt-api-8339700410 --source . --region=asia-northeast1
```

---

## 推奨: 方法2（GitHub Actions）

- **メリット**: 自動化、履歴管理、ロールバック可能
- **デメリット**: 初回設定が必要

## または

- Dockerfileと.dockerignoreを作成済み
- 手動でGitにコミット→プッシュ→Cloud Consoleで手動デプロイ
