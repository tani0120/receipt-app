# ✅ Cloud Run デプロイ最終手順（確実な方法）

## 問題

gcloud CLIでの権限エラーが解決できない。

## 解決策

**Cloud Console（ブラウザ）から直接デプロイ**

---

## 手順（3ステップ）

### 1. Cloud Runページを開く

URLをブラウザで開く：
```
https://console.cloud.google.com/run/create?project=sugu-suru
```

### 2. 設定を入力

#### ソース
- **リポジトリから継続的にデプロイ** を選択
- 「CLOUD BUILDを設定」をクリック

#### GitHub接続
1. リポジトリプロバイダ：**GitHub**
2. GitHubを認証
3. リポジトリを選択
4. ブランチ：**feature-restoration**
5. ビルドタイプ：**Dockerfile**
6. 「保存」

#### サービス設定
- サービス名：**receipt-api**(または既存の`receipt-api-8339700410`)
- リージョン：**asia-northeast1**
- CPU allocation: **CPU is only allocated during request processing**
- 認証：**未認証の呼び出しを許可** ✅
- Container port: **8080**

#### 環境変数（任意）
「変数とシークレット」→「変数を追加」

```
VITE_FIREBASE_API_KEY=<GitHub Secretsから取得>
VITE_FIREBASE_AUTH_DOMAIN=sugu-suru.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sugu-suru
VITE_FIREBASE_STORAGE_BUCKET=sugu-suru.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=8339700410
VITE_FIREBASE_APP_ID=1:8339700410:web:f20e67b02e95a3a4b6dee8
VITE_TEST_USER_EMAIL=***REMOVED***
VITE_TEST_USER_PASSWORD=***REMOVED***
```

### 3. デプロイ

「作成」ボタンをクリック

**5-10分待つ**

---

## デプロイ完了後

サービスURLが表示されます：
```
https://receipt-api-xxxxxxxxxx.asia-northeast1.run.app
```

このURLにアクセスして動作確認。

---

## なぜこの方法か？

- ✅ 権限エラーを完全に回避
- ✅ GitHub連携で今後の自動デプロイも可能
- ✅ ブラウザだけで完結
- ✅ gcloud CLIの複雑な設定不要
