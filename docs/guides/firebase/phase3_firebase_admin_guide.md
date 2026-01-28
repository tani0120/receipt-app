# Phase 3: Firebase Admin SDK統合 実施手順（人間向け）

**作成日**: 2026-01-25  
**所要時間**: 15-30分  
**リスク**: 低  
**目的**: バックエンド（Cloud Run）でFirebase認証とFirestoreを使用可能にする

---

## 📋 前提条件

- ✅ Phase 0-2完了（Cloud Run起動、APIエンドポイント、静的ファイル提供）
- ✅ ローカル開発環境でNode.js 20インストール済み
- ⚠️ 組織ポリシー問題（allUsersアクセス制限）は別途対処

---

## 🎯 実施する内容

### Phase 3の目的

```
現状: Cloud Runでフロントエンド提供のみ
  ↓
Phase 3: Firebase Admin SDKを統合
  ↓
結果: バックエンドでFirestore・Firebase Auth使用可能
```

**具体的な変更**:
1. `firebase-admin` パッケージを本番依存関係に追加
2. `src/server.ts` でFirebase Admin SDK初期化
3. サービスアカウントキーの設定
4. ローカルテスト
5. Cloud Runデプロイ

---

## ステップ1: firebase-adminパッケージ追加（5分）

### コマンド実行

```powershell
# プロジェクトディレクトリに移動
cd C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti

# firebase-adminをインストール（本番依存関係として）
npm install firebase-admin
```

### 確認

```powershell
# package.jsonを確認
cat package.json | Select-String "firebase-admin"
```

**期待される出力**:
```json
"firebase-admin": "^12.0.0"
```

---

## ステップ2: サービスアカウントキーの取得（5分）

### Google Cloud Consoleから取得

1. https://console.cloud.google.com/iam-admin/serviceaccounts?project=sugu-suru にアクセス
2. デフォルトのサービスアカウント（`sugu-suru@appspot.gserviceaccount.com`）をクリック
3. 「キー」タブをクリック
4. 「鍵を追加」→「新しい鍵を作成」をクリック
5. キーのタイプ: JSON
6. 「作成」をクリック
7. ダウンロードされたJSONファイルを保存

### ファイル配置

```powershell
# サービスアカウントキーをプロジェクトルートに配置
# ダウンロードされたファイル名を変更
mv ダウンロード\sugu-suru-XXXXX.json C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti\service-account-key.json
```

### .gitignoreに追加（セキュリティ対策）

```powershell
# .gitignoreにservice-account-key.jsonを追加（既に追加済みの可能性あり）
echo "service-account-key.json" >> .gitignore
```

---

## ステップ3: src/server.ts の修正（10分）

### 変更内容

`src/server.ts` の冒頭にFirebase Admin SDK初期化コードを追加します。

```typescript
// src/server.ts
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import admin from 'firebase-admin'

// Phase 3: Firebase Admin SDK初期化
if (!admin.apps.length) {
  if (process.env.NODE_ENV === 'production') {
    // Cloud Run環境: Application Default Credentials使用
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'sugu-suru'
    })
    console.log('✅ Firebase Admin initialized (Cloud Run mode)')
  } else {
    // ローカル環境: サービスアカウントキー使用
    const serviceAccount = require('../service-account-key.json')
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'sugu-suru'
    })
    console.log('✅ Firebase Admin initialized (Local mode)')
  }
}

const app = new Hono()
const port = parseInt(process.env.PORT || '8080')

// ... 以下既存のコード
```

### エディタで実施

1. Visual Studio Codeで `src/server.ts` を開く
2. `import { Hono } from 'hono'` の下に上記のコードを追加
3. 保存（Ctrl+S）

---

## ステップ4: ローカルテスト（5分）

### 開発サーバー起動

```powershell
# ローカル開発サーバー起動
npm run dev
```

### 確認

**コンソール出力を確認**:
```
✅ Firebase Admin initialized (Local mode)
🚀 Server starting...
```

**ブラウザでアクセス**:
```
http://localhost:5173/
```

**期待される動作**:
- ✅ ログインページまたはホーム画面が表示される
- ✅ Firebase認証が動作する
- ✅ エラーがない

### 停止

```powershell
# Ctrl+C でサーバー停止
```

---

## ステップ5: Cloud Runデプロイ（10分）

### ビルド

```powershell
# フロントエンドビルド
npm run build:frontend

# バックエンドビルド
npm run build:backend
```

### Cloud Build

```powershell
# Dockerイメージ作成
gcloud builds submit --tag gcr.io/sugu-suru/receipt-api
```

**所要時間**: 3-5分

### Cloud Run Deploy

```powershell
# Cloud Runデプロイ
gcloud run deploy receipt-api `
  --image gcr.io/sugu-suru/receipt-api `
  --region asia-northeast1 `
  --platform managed `
  --allow-unauthenticated
```

**期待される出力**:
```
✓ Creating Revision...
✓ Routing traffic...
Service URL: https://receipt-api-985123156988.asia-northeast1.run.app
Exit code: 0
```

---

## ステップ6: Cloud Runでの動作確認（5分）

### 環境変数の設定（Cloud Run用）

Cloud Runでは自動的に `NODE_ENV=production` が設定され、Application Default Credentials（ADC）が使用されます。追加の設定は不要です。

### ログ確認

```powershell
# Cloud Runのログを確認
gcloud run services logs read receipt-api --region=asia-northeast1 --limit=50
```

**期待される出力**:
```
✅ Firebase Admin initialized (Cloud Run mode)
🚀 Server starting...
```

### アクセステスト

⚠️ **注意**: 組織ポリシー問題により、現時点では403 Forbiddenが表示されます。これは正常です。

組織ポリシー解除後、以下のURLにアクセス:
```
https://receipt-api-985123156988.asia-northeast1.run.app/
```

**期待される動作**（組織ポリシー解除後）:
- ✅ ログインページまたはホーム画面が表示される
- ✅ Firebase認証が動作する

---

## ✅ 成功確認チェックリスト

- [ ] `firebase-admin` パッケージがインストール済み
- [ ] サービスアカウントキーが `service-account-key.json` として配置済み
- [ ] `src/server.ts` にFirebase Admin SDK初期化コードを追加済み
- [ ] ローカル開発サーバーでFirebase Admin初期化成功メッセージ確認
- [ ] ローカルでログイン・Firebase機能が動作
- [ ] Cloud Buildが成功（Exit code: 0）
- [ ] Cloud Runデプロイが成功（Exit code: 0）
- [ ] Cloud RunログでFirebase Admin初期化成功メッセージ確認

---

## 🚨 トラブルシューティング

### エラー1: `Cannot find module 'firebase-admin'`

**原因**: firebase-adminがインストールされていない

**対処**:
```powershell
npm install firebase-admin
```

### エラー2: `service-account-key.json not found`

**原因**: サービスアカウントキーが正しい場所に配置されていない

**対処**:
1. サービスアカウントキーをダウンロード
2. `C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti\service-account-key.json` として配置
3. ファイルパスを確認

### エラー3: Cloud Runで `Firebase Admin initialization failed`

**原因**: Cloud RunでApplication Default Credentialsが使用できない

**対処**:
1. Cloud RunサービスアカウントにFirebase Admin権限を付与
2. Google Cloud Console > IAM > サービスアカウント
3. `sugu-suru@appspot.gserviceaccount.com` に `Firebase Admin SDK Administrator Service Agent` ロールを追加

---

## 📋 次のステップ

Phase 3完了後:
- ✅ Phase 4: API Routes統合（30-60分）
- ✅ 組織ポリシー解除（別途実施）

---

**実施完了後、成功/失敗を報告してください。**
