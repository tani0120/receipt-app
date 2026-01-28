# Google Cloud Console でデプロイ（gcloud CLI不要）

## 前提条件

### 1. 課金アカウントの設定

1. https://console.cloud.google.com/billing にアクセス
2. 「請求先アカウントをリンク」をクリック
3. プロジェクト `sugu-suru` を選択して課金アカウントをリンク

**注意**: Cloud Runは無料枠がありますが、課金設定は必須です。

---

## デプロイ手順

### 方法1: GitHubから直接デプロイ（推奨）

#### ステップ1: Cloud Runページにアクセス
https://console.cloud.google.com/run?project=sugu-suru

#### ステップ2: サービスを選択
- 既存のサービス（`receipt-api-8339700410`など）があれば、それをクリック
- 「新しいリビジョンを編集してデプロイ」をクリック

#### ステップ3: ソースを選択
- 「リポジトリから継続的にデプロイ」を選択
-  「CLOUD BUILDを設定」をクリック

#### ステップ4: GitHubを接続
1. 「リポジトリプロバイダ」→「GitHub」を選択
2. GitHubアカウントを認証
3. リポジトリを選択
4. ブランチ: `feature-restoration`（または `main`）
5. ビルドタイプ: Dockerfile
6. 「保存」をクリック

#### ステップ5: 設定
- **リージョン**: `asia-northeast1`
- **認証**: 「未認証の呼び出しを許可」にチェック
- **Container port**: `8080`

#### ステップ6: 環境変数を設定
「変数とシークレット」→「変数を追加」

```
VITE_FIREBASE_API_KEY=<GitHub Secretsから取得>
VITE_GEMINI_API_KEY=<GitHub Secretsから取得>
VITE_USE_VERTEX_AI=true
```

#### ステップ7: デプロイ
- 「作成」または「デプロイ」をクリック
- 5-10分待つ

---

### 方法2: ローカルでビルド→手動アップロード

#### ステップ1: Dockerイメージをビルド
```powershell
docker build -t gcr.io/sugu-suru/receipt-api .
```

#### ステップ2: Container Registryにプッシュ
```powershell
docker push gcr.io/sugu-suru/receipt-api
```

#### ステップ3: Cloud Consoleからデプロイ
1. https://console.cloud.google.com/run?project=sugu-suru
2. 「サービスを作成」
3. 「既存のコンテナイメージから1つのリビジョンをデプロイする」
4. イメージURL: `gcr.io/sugu-suru/receipt-api`
5. 設定は方法1と同じ

---

## デプロイ後の確認

### URLにアクセス
デプロイ完了後、サービスURLが表示されます:
```
https://receipt-api-xxxxxxxxxx.asia-northeast1.run.app
```

### 自動ログインをテスト
1. URLにアクセス
2. 自動的にログインして`/journal-status`にリダイレクトされることを確認

---

## トラブルシューティング

### エラー: 課金アカウントが設定されていない
- https://console.cloud.google.com/billing で課金設定

### エラー: APIが有効になっていない
- Cloud Run API
- Cloud Build API
- Container Registry API

これらを有効化: https://console.cloud.google.com/apis/library

### デプロイが失敗する
- ログを確認: Cloud Console → Cloud Run → サービス → ログ
- Dockerfileが正しいか確認
