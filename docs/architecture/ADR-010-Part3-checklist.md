# ADR-010-Part3: 移行チェックリスト

**親ドキュメント**: [ADR-010](./ADR-010-ai-api-migration.md)

---

## Phase 1: 準備（今すぐ実施） - 所要時間: 2-3時間

### チェックリスト

- [ ] **1. 依存関係インストール**
  ```bash
  npm install @google/generative-ai
  ```

- [ ] **2. ディレクトリ作成**
  ```bash
  mkdir -p src/services/ai
  ```

- [ ] **3. ファイル作成（5ファイル）**
  - [ ] `src/services/ai/types.ts`
  - [ ] `src/services/ai/AIServiceInterface.ts`
  - [ ] `src/services/ai/GeminiAPIService.ts`
  - [ ] `src/services/ai/VertexAIService.ts`
  - [ ] `src/services/ai/createAIService.ts`

- [ ] **4. Gemini API Key取得**
  - [ ] https://makersuite.google.com/app/apikey にアクセス
  - [ ] 「Create API Key」クリック
  - [ ] API Keyをコピー

- [ ] **5. 環境変数設定**
  - [ ] `.env.local`ファイル作成
  - [ ] `VITE_USE_VERTEX_AI=false`追加
  - [ ] `VITE_GEMINI_API_KEY=...`追加（APIKeyペースト）
  - [ ] `.gitignore`に`.env.local`追加

- [ ] **6. Vueコンポーネント作成または修正**
  - [ ] `src/components/ReceiptUpload.vue`作成
  - [ ] `createAIService()`をimport
  - [ ] アップロード処理実装

- [ ] **7. 動作確認**
  - [ ] `npm run dev`実行
  - [ ] ブラウザでlocalhost:5173開く
  - [ ] 領収書画像アップロード
  - [ ] コンソールに「Gemini APIを使用」表示確認
  - [ ] 解析結果が正しく表示されることを確認

### 完了基準

✅ テスト環境でGemini APIを使用した解析が成功する  
✅ コンソールに「GeminiAPI」と表示される  
✅ APIエラーが発生しない

---

## Phase 2: 本番環境移行（MVP完成後） - 所要時間: 1日

### いつ移行するか

**移行タイミング（以下のいずれか）**:
1. **顧問先の実データを扱う時**（最優先）
2. ファインチューニングが必要になった時
3. 守秘義務が法的に必要になった時

### Step 1: Firebaseアップグレード（30分）

- [ ] **Firebase ConsoleでBlaze Planへ**
  - [ ] Firebase Console → プロジェクト設定
  - [ ] 「使用量と請求額」タブ
  - [ ] 「プランをアップグレード」クリック
  - [ ] Blazeプラン選択
  - [ ] クレジットカード情報入力
  - [ ] 予算アラート設定（推奨: $20/月）

- [ ] **確認**
  - [ ] Blazeプランに変更されたか確認
  - [ ] 予算アラート受信先メール確認

### Step 2: Cloud Functions初期化（30分）

- [ ] **Firebase CLIでCloud Functions初期化**
  ```bash
  firebase init functions
  ```
  - [ ] TypeScript選択
  - [ ] ESLintあり選択
  - [ ] 依存関係インストール: はい

- [ ] **依存関係追加**
  ```bash
  cd functions
  npm install @google-cloud/vertexai
  ```

- [ ] **ファイル作成**
  - [ ] `functions/src/types.ts`
  - [ ] `functions/src/analyzeReceipt.ts`
  - [ ] `functions/src/index.ts`（既存を上書き）

- [ ] **環境変数設定**
  - [ ] `functions/.env`作成
  - [ ] `GCP_PROJECT_ID=your-project`設定
  - [ ] `VERTEX_AI_LOCATION=us-central1`設定

- [ ] **ビルド確認**
  ```bash
  npm run build
  ```

### Step 3: Google Cloud Platform設定（1時間）

- [ ] **Vertex AI API有効化**
  - [ ] Google Cloud Console → APIとサービス → ライブラリ
  - [ ] 「Vertex AI API」検索 → 有効化
  - [ ] 「Generative Language API」検索 → 有効化

- [ ] **確認コマンド**
  ```bash
  gcloud services list --enabled --project=your-project | grep -E "(vertex|generativelanguage)"
  ```

- [ ] **Service Account作成**
  ```bash
  gcloud iam service-accounts create vertex-ai-service \
    --display-name="Vertex AI Service Account" \
    --project=your-project
  ```

- [ ] **権限付与**
  ```bash
  # Vertex AI使用権限
  gcloud projects add-iam-policy-binding your-project \
    --member="serviceAccount:vertex-ai-service@your-project.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"
  
  # Cloud Functions呼び出し権限
  gcloud projects add-iam-policy-binding your-project \
    --member="serviceAccount:vertex-ai-service@your-project.iam.gserviceaccount.com" \
    --role="roles/cloudfunctions.invoker"
  ```

- [ ] **確認**
  ```bash
  gcloud iam service-accounts list --project=your-project
  gcloud projects get-iam-policy your-project | grep vertex-ai-service
  ```

### Step 4: Cloud Functionsデプロイ（30分）

- [ ] **ローカルテスト（Firebase Emulator）**
  ```bash
  cd functions
  npm run serve
  ```
  - [ ] Emulatorが起動することを確認
  - [ ] http://localhost:5001/... にアクセス可能か確認

- [ ] **デプロイ**
  ```bash
  firebase deploy --only functions
  ```

- [ ] **デプロイ確認**
  ```bash
  firebase functions:list
  ```
  - [ ] `analyzeReceipt`が表示されることを確認
  - [ ] URLをコピー（例: https://us-central1-your-project.cloudfunctions.net/analyzeReceipt）

### Step 5: フロントエンド環境変数変更（10分）

- [ ] **`.env.production`作成**
  ```bash
  VITE_USE_VERTEX_AI=true
  # その他のFirebase設定は.env.localと同じ
  ```

- [ ] **`.env.local`バックアップ**
  ```bash
  cp .env.local .env.local.backup
  ```

- [ ] **`.gitignore`確認**
  - [ ] `.env.production`が含まれているか確認

### Step 6: 本番ビルド・デプロイ（30分）

- [ ] **本番ビルド**
  ```bash
  npm run build
  ```
  - [ ] `dist/`ディレクトリ作成確認
  - [ ] エラーがないか確認

- [ ] **Firebase Hostingデプロイ**
  ```bash
  firebase deploy --only hosting
  ```
  - [ ] デプロイ完了確認
  - [ ] URLコピー（例: https://your-project.web.app）

### Step 7: 本番環境動作確認（30分）

- [ ] **本番URLにアクセス**
  - [ ] https://your-project.web.app

- [ ] **ログイン**
  - [ ] Firebase Authenticationでログイン成功

- [ ] **領収書アップロード**
  - [ ] テスト用領収書をアップロード
  - [ ] コンソールに「Vertex AIを使用」表示確認

- [ ] **解析結果確認**
  - [ ] 解析結果が正しく表示される
  - [ ] 店名、日付、金額、内容、勘定科目が取得できる

- [ ] **Firebase Console確認**
  - [ ] Functions → ログ
  - [ ] 「領収書解析開始」ログ確認
  - [ ] 「領収書解析成功」ログ確認
  - [ ] エラーがないか確認

- [ ] **コスト確認**
  - [ ] Firebase Console → 使用量と請求額
  - [ ] Functions実行回数確認
  - [ ] Vertex AI呼び出し回数確認
  - [ ] 初回: $0.01以下を確認

### Step 8: 監視・アラート設定（30分）

- [ ] **Firebase Console → 使用量と請求額**
  - [ ] 予算アラート確認
  - [ ] アラート通知先メールアドレス確認

- [ ] **Cloud Monitoring設定（推奨）**
  - [ ] Google Cloud Console → Monitoring
  - [ ] アラートポリシー作成:
    - [ ] Functions実行回数 > 1000/日
    - [ ] Functions実行時間 > 10秒
    - [ ] エラー率 > 5%

- [ ] **ログ確認スクリプト作成**
  ```bash
  # logs.sh
  firebase functions:log --only analyzeReceipt --limit 50
  ```

### 完了基準

✅ 本番環境でVertex AIを使用した解析が成功する  
✅ コンソールに「VertexAI」と表示される  
✅ Functionsログにエラーがない  
✅ コストが想定範囲内（初回: $0.01以下）  
✅ 予算アラート設定完了

---

## トラブルシューティング

### テスト環境でのエラー

#### 「API Key が無効です」

**解決方法**:
1. https://makersuite.google.com/app/apikey でAPI Key再確認
2. `.env.local`の`VITE_GEMINI_API_KEY`を確認
3. Viteを再起動 (`npm run dev`を再実行)

#### 「JSON形式のレスポンスが見つかりません」

**解決方法**:
1. プロンプトを明確にする
2. レスポンスをコンソールに出力して確認
3. JSON抽出の正規表現を調整

### 本番環境でのエラー

#### 「認証が必要です」

**解決方法**:
1. ログイン画面でログイン
2. `auth.currentUser`がnullでないか確認

#### 「Cloud Functionsが見つかりません」

**解決方法**:
1. `firebase functions:list`で確認
2. デプロイ実施: `firebase deploy --only functions`

#### 「Vertex AI API が有効化されていません」

**解決方法**:
1. Google Cloud Console → APIとサービス
2. 「Vertex AI API」を検索 → 有効化

#### 「Service Account の権限がありません」

**解決方法**:
```bash
gcloud projects add-iam-policy-binding your-project \
  --member="serviceAccount:vertex-ai-service@your-project.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

---

## 次に読むドキュメント

→ [ADR-010-Part4: コストとセキュリティ](./ADR-010-Part4-cost-security.md)
