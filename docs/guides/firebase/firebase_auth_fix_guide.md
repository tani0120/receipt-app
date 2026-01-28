# Firebase認証エラー修正ガイド

**作成日**: 2026-01-24  
**エラー**: `auth/invalid-credential` (ステータス400)  
**影響**: UIからFirestoreへのデータアクセスが失敗

---

## 🎯 修正の目的

開発環境でのテストユーザー自動ログインを正常に機能させる。

---

## 📋 現在の状況

### 設定内容（`.env.local`）
```env
VITE_TEST_USER_EMAIL=***REMOVED***
VITE_TEST_USER_PASSWORD=***REMOVED***
```

### エラー内容
- 自動ログイン時に `auth/invalid-credential` エラーが発生
- データの動的な取得ができない
- 画面遷移後にコンテンツが表示されない

---

## 🔧 修正手順

### Step 1: Firebaseコンソールにアクセス

1. ブラウザで以下のリンクを開く：
   - [Firebase Console](https://console.firebase.google.com/)

2. Googleアカウントでログイン
   - プロジェクト作成時に使用したアカウントでログイン

3. プロジェクト「**sugu-suru**」を選択

---

### Step 2: Authentication設定を確認

1. 左メニューから「**Authentication**」（認証）をクリック

2. 「**Sign-in method**」（ログイン方法）タブを確認
   - 「**Email/Password**」が「**有効**」になっているか確認
   - 無効の場合: クリックして有効化

---

### Step 3: テストユーザーを確認・作成

#### 3-A: ユーザーの存在確認

1. 「**Users**」タブをクリック

2. ユーザー一覧で `***REMOVED***` を検索

#### 3-B: シナリオ1 - ユーザーが存在する場合

**パスワードのリセット**:

1. ユーザー行の「**⋮**」（三点リーダー）をクリック
2. 「**Reset password**」を選択
3. 新しいパスワードを設定（例: `***REMOVED***`）
4. `.env.local` のパスワードを更新（必要に応じて）

#### 3-C: シナリオ2 - ユーザーが存在しない場合

**新規ユーザー作成**:

1. 「**Add user**」ボタンをクリック

2. ユーザー情報を入力:
   ```
   Email: ***REMOVED***
   Password: ***REMOVED***
   ```

3. 「**Add user**」をクリックして保存

---

### Step 4: 動作確認

#### 4-A: 開発サーバーを再起動

```bash
# 既存のサーバーを停止（Ctrl+C）
# 再度起動
npm run dev
```

#### 4-B: ブラウザで確認

1. `http://localhost:5173` にアクセス

2. ブラウザのコンソールを開く（F12 → Console）

3. 以下のログが表示されることを確認:
   ```
   [testAuth] テストユーザーでログインしました: ***REMOVED***
   ```

4. エラーが消え、データが正常に表示されることを確認:
   - B:全社仕訳のデータが表示
   - タブ切り替え後もデータが表示

---

## ✅ 成功の確認

### 期待される動作

1. **コンソールログ**:
   - ✅ `[testAuth] テストユーザーでログインしました`
   - ❌ `auth/invalid-credential` エラーなし

2. **UI表示**:
   - ✅ B:全社仕訳に仕訳データが表示
   - ✅ タブ切り替え後もコンテンツが表示
   - ✅ A:顧問先管理に顧問先データが表示

---

## 🚨 トラブルシューティング

### ケース1: 「Email/Password」が無効になっている

**症状**: ユーザー作成時に「Email/Password authentication is disabled」エラー

**解決**:
1. 「Sign-in method」タブを開く
2. 「Email/Password」をクリック
3. トグルスイッチを「有効」に変更
4. 「保存」をクリック

### ケース2: パスワードがわからない

**解決**:
1. Firebase Consoleで該当ユーザーを削除
2. 新規にユーザーを作成（上記手順3-C）
3. `.env.local` と同じパスワードを設定

### ケース3: 再起動してもエラーが消えない

**確認事項**:
1. `.env.local` のメールアドレスとパスワードが正しいか確認
2. ブラウザのキャッシュをクリア（Ctrl+Shift+Delete）
3. Firebase Consoleでユーザーのステータスが「有効」か確認

---

## 📌 次のステップ

認証エラーが解決したら:

1. ✅ UI動作確認を完了
2. Step 4: 仕訳表示UI実装に進む
3. Phase 1実装計画を継続

---

## 関連ファイル

- [.env.local](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/.env.local) - 環境変数設定
- [testAuth.ts](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/src/utils/testAuth.ts) - 認証処理
- [FIREBASE_SECURITY_SETUP.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/FIREBASE_SECURITY_SETUP.md) - Firebase設定手順書
