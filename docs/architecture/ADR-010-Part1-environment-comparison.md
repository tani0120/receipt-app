# ADR-010-Part1: 環境比較

**親ドキュメント**: [ADR-010](./ADR-010-ai-api-migration.md)

---

## テスト環境（開発段階）の詳細

### アーキテクチャ図

```
┌─────────────────────┐
│  ブラウザ (Vue.js)   │
│  localhost:5173     │
└──────────┬──────────┘
           │ HTTPS
           │ API Key: VITE_GEMINI_API_KEY
           │ 直接呼び出し
           ↓
┌─────────────────────┐
│  Gemini API         │
│  generativelanguage.googleapis.com
│  無料枠: 月1,500リクエスト
└─────────────────────┘
```

### Firebase構成

| サービス | プラン | 使用内容 |
|---------|--------|---------|
| Firebase Hosting | Spark（無料） | 開発サーバー |
| Firestore | Spark（無料） | テストデータのみ |
| Authentication | Spark（無料） | Gmail認証 |
| Cloud Functions | **使用しない** | - |

### 使用するAPI

**Gemini API**:
- エンドポイント: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- 認証: API Key
- モデル: gemini-1.5-flash
- 無料枠: 月1,500リクエスト

### 環境変数（.env.local）

```bash
# AI API設定
VITE_USE_VERTEX_AI=false
VITE_GEMINI_API_KEY=AIzaSy...（実際のAPI Key）

# Firebase設定
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### セキュリティリスク（許容）

| リスク | 詳細 | 対策 |
|--------|------|------|
| **API Key露出** | ブラウザのDevToolsで見える | ⚠️ テストデータのみ使用 |
| **データ学習** | Googleが学習に使用する可能性 | ⚠️ 実データを使わない |
| **守秘義務違反** | 顧問先データの漏洩リスク | ❌ 本番では使用禁止 |

### 対象データ（重要）

✅ **使用可能**:
- テスト用の架空領収書（サンプル画像）
- 開発者が作成したモックデータ

❌ **絶対に使用禁止**:
- 顧問先の実データ
- 個人情報を含むデータ
- 機密情報

---

## 本番環境（運用開始後）の詳細

### アーキテクチャ図

```
┌─────────────────────┐
│  ブラウザ (Vue.js)   │
│  your-app.web.app   │
└──────────┬──────────┘
           │ HTTPS
           │ Firebase Auth Token
           │ callFunction('analyzeReceipt')
           ↓
┌─────────────────────┐
│  Cloud Functions    │
│  us-central1        │
│  Node.js 18         │
└──────────┬──────────┘
           │ Service Account認証
           │ IAM Role: aiplatform.user
           ↓
┌─────────────────────┐
│  Vertex AI          │
│  us-central1        │
│  gemini-1.5-flash   │
│  ファインチューニング可能
└─────────────────────┘
```

### Firebase構成

| サービス | プラン | 使用内容 |
|---------|--------|---------|
| Firebase Hosting | **Blaze（有料）** | 本番サイト |
| Firestore | **Blaze（有料）** | 実データ |
| Authentication | **Blaze（有料）** | Gmail + 独自ドメイン |
| Cloud Functions | **Blaze（有料）必須** | Vertex AI呼び出し |

### 使用するAPI

**Vertex AI**:
- エンドポイント: `https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent`
- 認証: Service Account（IAM）
- モデル: gemini-1.5-flash（カスタムモデル可）
- 料金: 従量課金

### 環境変数（.env.production）

```bash
# AI API設定
VITE_USE_VERTEX_AI=true
# VITE_GEMINI_API_KEY は不要（Cloud Functions経由）

# Firebase設定
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### セキュリティ対策（完備）

| リスク | 対策 |
|--------|------|
| **API Key露出** | ✅ Cloud Functions経由で隠蔽 |
| **データ学習** | ✅ Vertex AIは学習に使用しない保証 |
| **守秘義務** | ✅ VPC内にデータを閉じ込め可能 |
| **不正アクセス** | ✅ Firebase Auth + IAM認証 |
| **権限管理** | ✅ Service Accountで最小権限 |

### 対象データ

✅ **使用可能**:
- 顧問先の実際の領収書
- 過去1万件のCSVデータ（学習用）
- 機密情報（税理士事務所の業務データ）

---

## Gemini API vs Vertex AI 比較表

| 項目 | Gemini API（テスト） | Vertex AI（本番） |
|------|-------------------|----------------|
| **エンドポイント** | generativelanguage.googleapis.com | aiplatform.googleapis.com |
| **認証** | API Key | Service Account（IAM） |
| **呼び出し方法** | ブラウザ直接 | Cloud Functions経由 |
| **無料枠** | 月1,500リクエスト | なし |
| **料金** | $0.00035/1000トークン | 同額 |
| **守秘義務保証** | ❌ なし | ✅ **あり** |
| **ファインチューニング** | ❌ 不可 | ✅ **可能** |
| **VPC** | ❌ 不可 | ✅ **可能** |
| **IAM** | ❌ API Keyのみ | ✅ **詳細な権限管理** |
| **MLOps** | ❌ なし | ✅ **Model Monitoring** |
| **Batch API** | ✅ あり（50%OFF） | ✅ あり（50%OFF） |
| **Firebase Plan** | Spark（無料） | **Blaze（有料）必須** |
| **適用** | 開発・試作 | **本番環境** |

---

## いつ移行するか

### Phase 1: テスト環境（今）

**期間**: MVP実装中

**判断基準**:
- ✅ テストデータのみ使用
- ✅ 機能検証中
- ❌ 実データは使わない

### Phase 2: 本番環境（将来）

**移行タイミング**:
1. **顧問先の実データを扱う時**（最優先）
2. ファインチューニングが必要になった時
3. 守秘義務が法的に必要になった時

**判断基準**:
- ❌ テストデータでは不十分
- ✅ 実運用を開始する直前

---

## 次に読むドキュメント

→ [ADR-010-Part2: 実装手順](./ADR-010-Part2-implementation.md)
