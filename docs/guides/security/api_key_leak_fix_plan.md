# APIキー漏洩修正計画（5層防御）

**作成日**: 2026-01-26  
**緊急度**: 最高  
**対象**: 3回目のAPIキー漏洩 `***REMOVED***`

---

## 📊 現在の状況

### ✅ 確認済み

**Dockerfile (Line 10-16)**: APIキーがハードコードされている
```dockerfile
RUN VITE_FIREBASE_API_KEY=***REMOVED*** \
    VITE_FIREBASE_AUTH_DOMAIN=sugu-suru.firebaseapp.com \
    ...
    npm run build:frontend
```

**GitHubリポジトリ**: 公開リポジトリ `tani0120/receipt-app`  
**コミット**: `fd814d1` でDockerfileに追加

### 🔍 確認が必要

- [ ] Docker Hubにイメージをpushしたか？
- [ ] Google Container Registryにイメージをpushしたか？
- [ ] Cloud Runにデプロイしたか？

---

## 🛡️ 5層防御アーキテクチャ

### Layer 1: GitHub Secret Scanning（最優先、今すぐ実施）

**所要時間**: 3分  
**効果**: GitHub側で自動的にAPIキーを検出、過去の履歴もスキャン

**手順**:
1. https://github.com/tani0120/receipt-app/settings/security_analysis
2. "Secret scanning" → Enable
3. "Push protection" → Enable

---

### Layer 2: Branch Protection Rules（次、5分で完了）

**所要時間**: 5分  
**効果**: mainブランチへの直接push禁止、PRでレビュー必須

**手順**:
1. https://github.com/tani0120/receipt-app/settings/branches
2. "Add branch protection rule"
3. Branch name pattern: `main`
4. 設定:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging

---

### Layer 3: Gitleaks（GitHub Actions、15分で完了）

**所要時間**: 15分  
**効果**: 600種類以上の秘密情報パターンを自動検出

**ファイル**: `.github/workflows/secrets-check.yml`

```yaml
name: Security Check (AI Defense)
on: [push, pull_request]

jobs:
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      # Gitleaksでシークレットスキャン
      - name: Gitleaks scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      # Dockerfileの環境変数チェック
      - name: Check Dockerfile for hardcoded secrets
        run: |
          if grep -rE "VITE_.*=AIza|VITE_.*=sk-" Dockerfile* 2>/dev/null; then
            echo "❌ ハードコードされたAPIキーを検出"
            exit 1
          fi
      
      # .envファイルの誤コミットチェック
      - name: Check for .env files
        run: |
          if git ls-files | grep -E "^\.env$|\.env\.production$|\.env\.local$"; then
            echo "❌ .envファイルがコミットされています"
            exit 1
          fi
```

---

### Layer 4: Trivy Container Scan（20分で完了）

**所要時間**: 20分  
**効果**: Dockerイメージ内の秘密情報を検出（最終防衛線）

**ファイル**: `.github/workflows/container-scan.yml`

```yaml
name: Container Security Scan
on: [push, pull_request]

jobs:
  scan-image:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Dockerイメージをビルド（秘密情報なしでテスト）
      - name: Build Docker image
        run: |
          docker build \
            --build-arg VITE_FIREBASE_API_KEY=test \
            --build-arg VITE_FIREBASE_AUTH_DOMAIN=test \
            --build-arg VITE_FIREBASE_PROJECT_ID=test \
            --build-arg VITE_FIREBASE_STORAGE_BUCKET=test \
            --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=test \
            --build-arg VITE_FIREBASE_APP_ID=test \
            -t receipt-app:test .
      
      # Trivyでシークレットスキャン
      - name: Scan for secrets in image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'receipt-app:test'
          format: 'sarif'
          output: 'trivy-results.sarif'
          scanners: 'secret'
          severity: 'CRITICAL,HIGH'
      
      # 結果をアップロード
      - name: Upload Trivy results
        if: always()
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

### Layer 5: Dockerfile修正（30分で完了）

**所要時間**: 30分  
**効果**: ビルド時引数を使用、イメージ内に秘密情報が残らない

**修正前**（危険）:
```dockerfile
RUN VITE_FIREBASE_API_KEY=***REMOVED*** \
    npm run build:frontend
```

**修正後**（安全）:
```dockerfile
# ビルド時引数として受け取る
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# フロントエンドビルド
RUN npm run build:frontend
```

**Cloud Runデプロイ時**:
```bash
# GitHub Secretsを使用
gcloud run deploy receipt-api \
  --source . \
  --set-env-vars="VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY" \
  --region=asia-northeast1
```

---

## 🚨 緊急アクション（今すぐ実施）

### Step 1: APIキー無効化（5分）

1. Google Cloud Console → APIとサービス → 認証情報
2. `***REMOVED***` を削除
3. 新しいAPIキーを生成
4. アプリケーション制限: Firebase（sugu-suru）のみ

### Step 2: 新しいAPIキーをGitHub Secretsに保存

1. https://github.com/tani0120/receipt-app/settings/secrets/actions
2. New repository secret
3. Name: `VITE_FIREBASE_API_KEY`
4. Value: 新しいAPIキー

### Step 3: `.env.local`を更新

```bash
# ローカル環境のみ
VITE_FIREBASE_API_KEY=<新しいAPIキー>
```

---

## 📋 実装チェックリスト

### 🔴 今日中に実施（30分）
- [ ] APIキー無効化
- [ ] 新しいAPIキー生成
- [ ] GitHub Secret Scanning有効化
- [ ] Push Protection有効化
- [ ] Branch Protection Rules設定

### 🟡 今週中に実施（1時間）
- [ ] Gitleaks GitHub Actions作成
- [ ] Trivy Container Scan GitHub Actions作成
- [ ] Dockerfile修正（ARG/ENV使用）
- [ ] `.dockerignore`に`.env*`追加
- [ ] Git履歴クリーニング（BFG Repo-Cleaner）

### 🟢 余裕があれば
- [ ] Husky + Pre-commit hooks設定
- [ ] 既存のDockerイメージ削除・再ビルド

---

## 🎯 成功の定義

1. ✅ GitHub Secret Scanningが有効（過去の漏洩も検出）
2. ✅ mainへの直接push不可（Branch Protection）
3. ✅ Gitleaks CIが動作（PR時に自動チェック）
4. ✅ Trivy CIが動作（コンテナイメージスキャン）
5. ✅ Dockerfileにハードコードなし（ARG使用）
6. ✅ 新しいAPIキーで運用開始

---

**このプランで二度と同じ過ちを繰り返さない仕組みを構築します。**
