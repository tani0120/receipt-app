# Google API Key 再生成手順

**作成日**: 2026-01-24  
**対象キー**: Firebase Web API Key（`***REMOVED***`）  
**理由**: GitHubに一度漏洩したため、セキュリティ上の理由で再生成

---

## ⚠️ 重要な前提知識

### Firebase API Key と Google API Key の関係

- **Firebase API Key** = **Google Cloud Platform (GCP) の Web API Key**
- `AIzaSy...` で始まるキーは、GCP の認証情報
- Firebase は Google Cloud の一部サービス
- GitHubが「Google API Key」として検出したのは、このキーのこと

### なぜ再生成が必要か

1. ✅ **一度公開リポジトリに漏洩した**
2. ⚠️ 第三者が悪意を持って使用する可能性
3. ⚠️ 使用量の監視が必要（不正使用によるコスト増加リスク）
4. ✅ **ベストプラクティス**: 漏洩したキーは即座に無効化・再生成

---

## 📋 全体の流れ（所要時間: 10-15分）

1. **新しいAPIキーを作成** （5分）
2. **アプリケーションで新しいキーをテスト** （3分）
3. **旧キーを削除** （2分）
4. **動作確認** （3分）

---

## 🔧 Step 1: Google Cloud Console で新しいAPIキーを作成

### 1-1. Google Cloud Console にアクセス

**URL**: https://console.cloud.google.com/apis/credentials?project=sugu-suru

- Googleアカウントでログイン
- プロジェクト `sugu-suru` を選択（既に選択されているはず）

### 1-2. 認証情報ページを開く

1. 左側メニューの **「APIとサービス」** → **「認証情報」** をクリック
2. 既存のAPIキーが一覧表示される

### 1-3. 新しいAPIキーを作成

1. 上部の **「+ 認証情報を作成」** ボタンをクリック
2. **「APIキー」** を選択
3. 新しいAPIキーが自動生成される
   ```
   ***REMOVED*** （新しいキー）
   ```
4. **重要**: このキーをコピーしてテキストエディタに保存

### 1-4. APIキーに制限を設定（セキュリティ強化）

> **推奨**: 無制限のAPIキーは危険です。以下の制限を設定してください。

#### アプリケーションの制限

1. 生成されたキーの横にある **「編集」** アイコン（鉛筆マーク）をクリック
2. **「アプリケーションの制限」** セクションで：
   - **「HTTPリファラー（ウェブサイト）」** を選択
   - **「ウェブサイトの制限」** に以下を追加：
     ```
     http://localhost:*
     https://localhost:*
     https://your-production-domain.com/*
     ```
     （本番ドメインがある場合は追加）

#### API の制限

1. **「APIの制限」** セクションで：
   - **「キーを制限」** を選択
   - 以下のAPIのみを選択：
     - ✅ **Firebase Authentication API**
     - ✅ **Cloud Firestore API**
     - ✅ **Firebase Storage API**（使用している場合）

2. **「保存」** ボタンをクリック

---

## 🔄 Step 2: アプリケーションで新しいキーをテスト

### 2-1. `.env.local` を更新

1. `.env.local` ファイルを開く
   ```bash
   C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti\.env.local
   ```

2. `VITE_FIREBASE_API_KEY` を更新
   ```env
   # 旧キー（削除）
   # VITE_FIREBASE_API_KEY=***REMOVED***

   # 新キー
   VITE_FIREBASE_API_KEY=***REMOVED*** （Step 1で作成したキー）
   ```

3. ファイルを保存

### 2-2. 開発サーバーを再起動

```bash
# 現在のサーバーを停止（Ctrl+C）
# 再起動
npm run dev
```

### 2-3. 動作確認

1. ブラウザで `http://localhost:5173` を開く
2. **Firebase認証が動作するか確認**：
   - ログインページが表示される
   - `***REMOVED***` / `***REMOVED***` でログイン
   - ✅ ログイン成功 → 新キーは正常に動作
   - ❌ ログイン失敗 → キーの設定を確認

3. **Firestoreへのアクセスを確認**：
   - データが正常に読み込まれるか確認
   - エラーが表示されないか確認

---

## 🗑️ Step 3: 旧キーを削除

> **重要**: 新しいキーが正常に動作することを確認してから、旧キーを削除してください。

### 3-1. Google Cloud Console で旧キーを削除

1. https://console.cloud.google.com/apis/credentials?project=sugu-suru にアクセス
2. **APIキー一覧** から、旧キーを探す
   - キー名: `(自動生成された名前)`
   - キー: `***REMOVED***` で始まるもの

3. 旧キーの横にある **「︙」（3点メニュー）** → **「削除」** をクリック
4. 確認ダイアログで **「削除」** をクリック

### 3-2. 削除の確認

- APIキー一覧から旧キーが消えていることを確認
- **これで旧キーは完全に無効化されます**

---

## ✅ Step 4: 最終確認

### 4-1. 本番環境のテスト

開発環境で動作確認が完了したら：

1. `.env.local` の変更を本番環境にも反映
   - **注意**: `.env.local` はGitにコミットしない
   - 本番環境の環境変数設定で新しいキーを設定

2. 本番環境でログイン・データアクセスをテスト

### 4-2. GitHub Secret Scanning アラートの確認

- 6-24時間後に GitHub のアラートを確認
- 旧キーのアラートが残っている場合：
  - **「このアラートを無視」** を選択
  - または、GitHubサポートに「キーを再生成・削除した」と報告

---

## 📊 チェックリスト

作業完了後、以下を確認してください：

- [ ] 新しいAPIキーを作成した
- [ ] 新しいキーに適切な制限を設定した
  - [ ] HTTPリファラー制限
  - [ ] API制限（Firebase/Firestore のみ）
- [ ] `.env.local` を更新した
- [ ] 開発環境で動作確認した
  - [ ] ログインが成功
  - [ ] Firestoreアクセスが正常
- [ ] 旧キーを削除した
- [ ] 旧キーが無効化されていることを確認した

---

## 🚨 トラブルシューティング

### 問題1: 新しいキーでログインできない

**原因**: APIキーの制限設定が厳しすぎる

**解決方法**:
1. Google Cloud Console でAPIキーの設定を確認
2. 一時的に「アプリケーションの制限」を **「なし」** に変更
3. 動作確認後、再度制限を設定

### 問題2: Firestoreへのアクセスエラー

**エラー**: `Permission denied` または `Missing or insufficient permissions`

**原因**: 
- APIキーの制限で `Cloud Firestore API` が有効になっていない
- Firestoreルールの問題

**解決方法**:
1. Google Cloud Console で `Cloud Firestore API` が有効か確認
2. Firebase Console でセキュリティルールを確認

### 問題3: 開発サーバーがエラーを出す

**エラー**: `Invalid API key`

**原因**: `.env.local` の設定ミス

**解決方法**:
1. `.env.local` のAPIキーを確認（スペースや改行がないか）
2. 開発サーバーを再起動

---

## 📋 参考リンク

- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials?project=sugu-suru
- **Firebase Console**: https://console.firebase.google.com/project/sugu-suru
- **Firebase API Key のベストプラクティス**: https://firebase.google.com/docs/projects/api-keys

---

## ⏱️ 作業時間の目安

| ステップ | 所要時間 |
|---------|---------|
| Step 1: 新キー作成 | 5分 |
| Step 2: テスト | 3分 |
| Step 3: 旧キー削除 | 2分 |
| Step 4: 最終確認 | 3分 |
| **合計** | **約15分** |

---

**準備ができたら、Step 1 から開始してください。**

何か質問があれば、いつでもお聞きください。
