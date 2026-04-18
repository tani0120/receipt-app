# セットアップ状況調査レポート

**調査日時**: 2026-02-11 08:16  
**目的**: 実環境のツール・セットアップ状況確認

---

## ✅ セットアップ完了済み

### 1. **環境変数 (.env.local)** ✅ 完全設定済み

```bash
# Firebase（2026-04-18 廃止。Supabase Authに移行済み）
# VITE_FIREBASE_API_KEY=（削除済み）
# VITE_FIREBASE_AUTH_DOMAIN=（削除済み）

# テストユーザー（Supabase Auth用）
VITE_TEST_USER_EMAIL=your_test_email@example.com
VITE_TEST_USER_PASSWORD=your_test_password

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Vertex AI
VITE_API_PROVIDER=vertex
VERTEX_PROJECT_ID=sugu-suru
VERTEX_LOCATION=asia-northeast1

# Supabase（サーバー側）
SUPABASE_URL=https://your_project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Supabase（ブラウザ側 = Vite用。認証・RLS）
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# フラグ設定
ENABLE_OCR=false         # ローカル開発では無効化
# ENABLE_FIRESTORE=false  # 廃止（2026-04-18）
```

**状態**: ✅ **完璧に設定済み**

---

### 2. **Google Cloud SDK** ✅ 設定済み

```bash
# プロジェクト確認
$ gcloud config get-value project
→ sugu-suru ✅

# ADC認証状態
認証済み（Application Default Credentials設定完了）
```

**状態**: ✅ **稼働中**

---

### 3. **ggshield** ✅ インストール済み

```bash
$ ggshield --version
→ ggshield, version 1.47.0 ✅
```

**状態**: ✅ **インストール完了**

---

### 4. **Firebase CLI** ❌ 廃止（2026-04-18）

```
Firebase Auth / Firestore / Storage → Supabaseに全面移行済み
Firebase CLIは不要。
```

**状態**: ❌ **廃止**

---

### 5. **ggshield Pre-commit Hook** ❌ 未インストール

```bash
$ Test-Path .git\hooks\pre-commit
→ False ❌
```

**状態**: ❌ **Hookファイルが存在しない**

**対処方法**:
```bash
ggshield install -m local
```

---

## 📊 セットアップ状況サマリ

| ツール | 状態 | アクション |
|---|---|---|
| **環境変数（.env.local）** | ✅ 完璧 | 不要 |
| **Supabase** | ✅ 完全設定済み | 不要 |
| **Supabase Auth** | ✅ 移行完了 | 不要 |
| **Supabase Storage** | ✅ 移行完了 | 不要 |
| **Google OAuth（Supabase経由）** | ✅ 設定完了 | 不要 |
| **GCP OAuth同意画面** | ✅ 公開済み | 不要 |
| **Drive API SA権限** | ✅ 共有ドライブ「管理者」 | 不要 |
| **Vertex AI** | ✅ 設定済み | 不要 |
| **Google Cloud SDK** | ✅ 稼働中 | 不要 |
| **ggshield** | ✅ インストール済み | 不要 |
| **Firebase CLI** | ❌ 廃止 | 不要（Supabase移行済み） |
| **Firebase SDK（npm）** | ❌ 削除済み | 不要 |
| **Timestamp型（firebase/firestore）** | ❌ 廃止 → Date型に移行 | 不要 |
| **Pre-commit Hook** | ❌ 未設定 | インストール必要 |

---

## 🔧 必要なアクション

### 優先度: 中

#### 1. ~~Firebase CLI 再認証~~ → 廃止（Supabase移行済み）

#### 2. ggshield Pre-commit Hook インストール
```bash
ggshield install -m local

# 確認
Test-Path .git\hooks\pre-commit  # → True になればOK
```

---

## ✅ 結論

**コア機能は全て稼働中**:
- Supabase（PostgreSQL）: ✅ 完全稼働
- Supabase Auth: ✅ 移行完了（2026-04-18）
- Supabase Storage: ✅ 移行完了（2026-04-18）
- Vertex AI（Gemini）: ✅ 完全稼働  
- 環境変数: ✅ 完璧に設定済み
- Google Cloud SDK: ✅ 認証済み

**Firebase依存**: 完全排除済み（2026-04-18）— import残存0件、npm削除済み

**Google OAuth**: 設定完了（2026-04-18）
- GCPプロジェクト「sugu-suru」にOAuthクライアントID「Supabase Auth」作成済み
- Supabaseダッシュボード Googleプロバイダー Enabled
- GCP OAuth同意画面「公開」設定済み（基本スコープのみ、審査不要）
- アクセス制御: スタッフマスタ（/master/staff）登録メールのみログイン許可
- admin@sugu-suru.com: 必須ユーザー（削除不可）

**Drive API SA権限**: 共有ドライブ「管理者」に昇格（2026-04-18）
- SA: `sugu-suru@gen-lang-client-0837543731.iam.gserviceaccount.com`
- 共有ドライブID: `0AIOLCboQ_R-nUk9PVA`
- 目的: 顧問先メール登録時にDrive APIでメンバー自動追加/削除（permissions.createにorganizer権限が必要）

**型定義移行**: Timestamp → Date 完了（2026-04-18）
- firebase/firestore の Timestamp 型を全て Date 型に置換（9ファイル）
- TimestampSchema（zod）を Date 互換に書き換え（toDate()後方互換あり）

**軽微な修正が必要**:
- Pre-commit Hook: 1コマンドでインストール

---

**最終更新**: 2026-04-18 13:17
