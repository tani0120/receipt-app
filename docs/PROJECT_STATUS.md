# プロジェクト状況報告（L0：最上位）

**最終更新**: 2026-01-26 01:33  
**情報源**: 14ファイル全文読み込み（11,559行）  
**階層**: L0（最上位、横断的な全体像）

---

## 📊 現在の進捗状況

### Phase 1全体進捗: 3/9 Step完了（33%）

```
Phase 1（7-8日）

Milestone 1.1: OCR→仕訳表示（2-3日）- 75%完了
  ✅ Step 1: スコープ決定（1-2時間）
  ✅ Step 2: L1-3定義（3-4時間）
  ✅ Step 3: AI API実装（4-5時間、TD-001あり）
  ⏳ Step 4: UIモック（4-6時間）← 次のステップ

Milestone 1.2: マスターデータ管理（2-3日）- 0%
  ⏸️ Step 5: 顧問先CRUD実装（1日）
  ⏸️ Step 6: スタッフCRUD実装（1日）

Milestone 1.3: 仕訳編集（2-3日）- 0%
  ⏸️ Step 7: 仕訳入力画面実装（2-3日）

Milestone 1.4: CSV出力＋E2Eテスト（1-2日）- 0%
  ⏸️ Step 8: CSV出力実装（1日）
  ⏸️ Step 9: E2Eテスト（1日）
```

**Milestone 1.1進捗**: 3/4 Step完了（**75%**）  
**Phase 1全体進捗**: 3/9 Step完了（**33%**）

---

## ⏳ 次のステップ

### Step 4: UIモック（Milestone 1.1）← **今すぐ着手**

**所属**: Milestone 1.1: OCR→仕訳表示  
**予定開始**: 2026-01-26以降  
**所要時間**: 4-6時間（予定）

#### 実装内容

**1. 仕訳一覧画面**
- 日付 | 摘要 | 勘定科目 | 金額 | 警告 | 確認
- 税額は非表示（情報量削減）
- ズレがある行のみ⚠️アラート表示
- 確認済みフラグ（`isConfirmed`）

**2. 仕訳詳細モーダル（税額確認画面）**
- 【左】証憑画像（消費税: 33円 ← 証憑に記載）
- 【右】仕訳詳細
  - ✅ 証憑記載: 33円 ← FROM_DOCUMENT
  - ℹ️ 計算値: 32円 ← 参考
  - ⚠️ ズレ: 1円 ← 警告
- 採用する税額: ○証憑の値 / ○計算値 / ○手入力
- 証憑画像と仕訳データの並列表示

**3. 顧問先登録モーダル（Step 5用）**
- **既に33項目完成** ✅（2026-01-23）
- 基本情報（13項目）、会計設定（12項目）、報酬設定（6項目）、Google Drive連携（2項目）
- デフォルト値設定済み

#### Step 4完了後
**Milestone 1.1完了** → **Milestone 1.2へ移行**

---

## ✅ 完了済みタスク（～2026-01-24）

### Milestone 1.1: OCR→仕訳表示（3/4完了、75%）

**Step 1: スコープ決定** ✅ 完了（2026-01-22）
- Phase 1実装計画確定
- Milestone 1.1-1.4定義
- 所要時間: 1-2時間

**Step 2: L1-3定義** ✅ 完了（2026-01-23）
- JournalEntry: 19プロパティ完成
- JournalLine: 16プロパティ完成
- 税額判定戦略C採用（OCR抽出値を採用）
- UI表示方針確定（税額非表示、ズレ検出⚠️アラート）
- Phase 2延期: `approvedBy/approvedAt`, `exportHistory`, `aiConfidenceBreakdown`
- 所要時間: 3-4時間

**Step 3: AI API実装** ✅ 完了（2026-01-24、**TD-001あり**）
- 8ファイル作成完了:
  1. GeminiVisionService.ts - AI処理
  2. FileTypeDetector.ts - ファイル形式判定（7種類）
  3. NormalizationService.ts - NFKC正規化
  4. TaxCodeMapper.ts - 税区分マッピング（MF形式、11種類）
  5. TaxResolutionService.ts - 税額解決
  6. CsvValidator.ts - CSV物理制約チェック
  7. CsvExportService.ts - MF用CSV出力
  8. JournalEntrySchema.ts - Draft/確定スキーマ
- **型定義ミスマッチ（TD-001）発見** → Phase 2で修正
- 所要時間: 4-5時間

### インフラ完了タスク

**Firebase認証設定** ✅ 完了（2026-01-21）
- Gmail認証実装
- Router Guard実装
- 自動ログイン機能（環境変数`VITE_AUTO_LOGIN`）
- 10ファイル作成・更新
- 所要時間: 1-2時間

**Cloud Runデプロイ** ✅ 完了（2026-01-25）
- 18時間（18回の試行）でサーバー起動成功
- Phase 0: keep-alive実装（Gemini推奨）
- Phase 1: `/api/hello` エンドポイント追加
- Phase 4: API Routes統合（8/10ルート成功、80%）
- Service URL: `https://receipt-api-52y2r7k62a-an.a.run.app`
- **組織ポリシーで失敗** → Phase 2で対応

**ADR-011型安全防御アーキテクチャ** ✅ 完了（2026-01-24）
- 5層防御アーキテクチャ実装
- 型安全性破壊リスク95%削減（推定）
- 8ファイル作成・更新

---

## 🔮 Phase 2タスク（将来）

### 最優先: TD-001型定義ミスマッチ修正

**重要度**: 最高  
**所要時間**: 1-2時間

**影響箇所（3ファイル）**:
1. CsvValidator.ts - `JournalEntry` に `description`, `date` が存在しない
2. FileTypeDetector.ts - `Client` に `clientCode` が存在しない
3. CsvExportService.ts - `JournalEntry` に複数の必須フィールドが欠落

**対応タスク**:
- [ ] `types/journal.ts` 再設計
- [ ] `types/client.ts` 再設計
- [ ] CsvValidator.ts修正
- [ ] FileTypeDetector.ts修正
- [ ] CsvExportService.ts修正
- [ ] 型整合性テスト実施

### Phase 1残タスク（Milestone 1.2-1.4）

**Step 5: 顧問先CRUD実装**（Milestone 1.2、1日）
- 33項目プロパティ実装 ✅ 完成（2026-01-23）
- 顧問先登録モーダル（3セクション）
- Google Drive自動フォルダ作成
- 顧問先一覧画面（10カラム）

**Step 6: スタッフCRUD実装**（Milestone 1.2、1日）
- スタッフ登録モーダル
- スタッフ一覧画面

**Step 7: 仕訳入力画面実装**（Milestone 1.3、2-3日）
- 仕訳一覧画面
- 仕訳詳細モーダル
- 税額確認機能

**Step 8: CSV出力実装**（Milestone 1.4、1日）
- MF形式CSV出力
- Shift-JIS変換

**Step 9: E2Eテスト**（Milestone 1.4、1日）
- 領収書→仕訳→CSV出力の全体テスト

### Phase 2バックエンドタスク

**any型の使用修正**（6箇所）
- CsvValidator.ts: `validateFreee()`, `validateYayoi()`
- CsvExportService.ts: `convertToCsv()`
- GeminiVisionService.ts: L100, L125
- Freee/弥生のCSV仕様確認必要

**Client型のPartial問題修正**
- `ClientMinimal` 型定義作成
- FileTypeDetector.ts修正
- GeminiVisionService.ts修正

**unknown型への変更**（優先度4）
- GeminiVisionService.ts L78, L87
- 型ガードで安全に扱う
- 優先度低（@type-audit対応済み）

**Cloud Functions実装**（3-4時間）
- Vertex AI SDK導入
- OAuth 2.1実装
- Service Account認証
- VPC対応

**API統合**
- MF API連携（マスタ取得、NFKC正規化連動）
- Freee API連携（REST API OAuth 2.1）
- 弥生 API連携（API仕様確認）

### Phase 2インフラタスク

**Vertex AI移行**（3-4時間）
- Cloud Functions実装
- Service Account認証設定
- VPC対応設定
- Vertex AI SDK導入
- 本番環境テスト

**組織ポリシー除外**
- `requires-oslogin`ポリシーで`allUsers`アクセス拒否問題解決
- 組織管理者に連絡
- ポリシー除外リクエスト
- 本番公開時に対応

**Firebase Hosting最適化**
- 静的ファイル提供最適化
- Cloud Run認証設定
- firestoreRepository.ts → Admin SDK化

---

## ❓ 未解決議論（5件）

### 1. 開発用Firebaseプロジェクト作成（中断）

**議論の経緯**:
- 本番データ保護のため、開発用Firebaseプロジェクト（`sugu-suru-dev`）作成を提案
- `implementation_plan.md`に詳細な手順を作成
- ユーザーから「本番データがまだないので不要」との判断 → **中断**

**再開条件**:
- 本番環境に顧問先の実際のデータが追加されたとき
- 機密情報（領収書等）を扱い始めたとき

---

### 2. バックエンドアーキテクチャ実装計画（未定）

**議論の経緯**:
- 当初「Firestore直接アクセスで問題ない」と判断
- ユーザーからの指摘:
  - AI処理が必要（Gemini API呼び出し）
  - 複雑な集計処理が必要
  - バッチ処理が必要
  - 機密情報を扱う（顧問先の領収書等）
- SYSTEM_PHILOSOPHY.mdを確認:
  - **GAS (Google Apps Script)**: Google Driveファイル操作 + AI解析バッチ + ファイル移動
  - **現状**: VueアプリのMock/Service層でシミュレーション中
- → **結論**: GASが必要だが、実装計画は未定

**問題点**:
- GASをいつ、どのように実装するか未定義
- `src/server.ts`、`src/api/`の扱いが曖昧（Mockなのか、本番用なのか）

**再開条件**:
- AI解析バッチ実装が必要になったとき
- Google Driveのファイル操作が必要になったとき

**次のアクション**:
- ADR-008: バックエンドアーキテクチャ戦略（GAS vs Node.js）を作成すべきか検討
- または、TASK_MASTER.mdに「GAS実装」タスクを追加

---

### 3. 本番環境の認証・API問題（Phase 2で解決予定）

**議論の経緯**:
- 本番環境でログインできない問題を調査
- `.env.local`のパスワード（`0120tani`）が本番環境と異なることを発見
- JavaScriptバンドル解析により正しいパスワード（`***REMOVED***`）を特定
- Firestoreセキュリティルールを再デプロイ
- **新たな問題発見**: バックエンドAPI（Cloud Run）が404エラー

**中断理由**:
- 本番環境のバックエンド（Cloud Run）がデプロイされていない、または設定不備
- フロントエンドのみが存在し、バックエンドが未実装
- Phase 1（Step 2-9）では**ローカル環境**で開発を進める方針に決定

**完了した対応**:
- ✅ Firebase CLI再ログイン
- ✅ 本番環境ユーザー確認（`***REMOVED***`が存在）
- ✅ Firestoreセキュリティルールデプロイ
- ✅ `.env.local`修正（パスワード→`***REMOVED***`）

**保留した問題**:
- ❌ バックエンドAPI（Cloud Run）の404エラー
- ❌ Firebase権限エラー（一部残存）

**再開条件**:
- Phase 2「バックエンド実装」フェーズで対応
- Cloud Runへのバックエンドデプロイ時

---

### 4. Step 2のL1-3定義での設計決定 ✅ **解決済み**（2026-01-23）

**解決内容**:
1. **データ構造の確定**: JournalEntry 19プロパティ、JournalLine 16プロパティ
2. **税額判定戦略C採用**: OCR抽出値を採用、計算値とのズレを検出
3. **UI表示方針**: 税額非表示、ズレ検出⚠️アラート、詳細モーダルで並列表示
4. **Phase 2延期**: `approvedBy/approvedAt`, `exportHistory`, `aiConfidenceBreakdown`

---

### 5. 未解決の技術的問題（5件）

#### 問題1: ファイル形式別プロンプト未実装 ❌
- **重要度**: 高
- **問題**: 単一のプロンプト（RECEIPT_TO_JOURNAL_PROMPT）しか用意していない
- **対応**: 7種類のプロンプトを作成（RECEIPT、INVOICE、BANK_CSV、BANK_IMAGE、CREDIT_CSV、CREDIT_IMAGE、OTHER）
- **所要時間**: 2時間

#### 問題2: 計算期間外チェック欠如 ❌
- **重要度**: 中
- **問題**: `fiscalMonth`（決算月）が定義されているが、会計期間のチェック機能がない
- **対応**: JournalLineに `isOutOfPeriod` フラグ追加
- **所要時間**: 1.5時間
- **Phase 2延期も検討可能**

#### 問題3: 重複検知機能欠如 ❌
- **重要度**: 中
- **問題**: UC-013「重複排除」が記載されているが、重複検知機能がない
- **対応**: JournalEntryに `duplicateCheckHash` 追加
- **所要時間**: 2時間
- **UC-013に記載あり、実装必須**

#### 問題4: 型定義の厳密性不足 ❌
- **重要度**: 高
- **問題**: Gemini APIが想定外のフィールドを返した場合の処理が不明確
- **対応**: Zodの `.strict()` モード使用、エラー時の再試行ロジック実装（最大3回）
- **所要時間**: 1.5時間
- **データ整合性の根幹**

#### 問題5: AIプロンプトの設計が不適切 ❌
- **重要度**: 高
- **問題**: 税額の三重構造が不明確、勘定科目の選択基準が不明確、顧問先情報がプロンプトに含まれていない
- **対応**: 税額の三重構造を明確化、勘定科目マッピングルール追加
- **所要時間**: 2時間
- **AI精度に直結**

**推奨対応順序**:
1. 問題4（型定義の厳密性）← まずこれを修正
2. 問題5（プロンプト設計）← 次にプロンプトを全面見直し
3. 問題1（ファイル形式別プロンプト）← プロンプトを7種類作成
4. 問題3（重複検知）← UseCaseに記載あり、実装必須
5. 問題2（計算期間外チェック）← Phase 2延期も検討

---

## 📈 タイムライン

**Phase 1残り**: 6/9 Step（約5-7日）
- Step 4: UIモック（4-6時間）← **次**
- Step 5: 顧問先CRUD（1日）
- Step 6: スタッフCRUD（1日）
- Step 7: 仕訳入力画面（2-3日）
- Step 8: CSV出力（1日）
- Step 9: E2Eテスト（1日）

**Phase 2**: TD-001修正 + 5つの技術的問題 + バックエンド実装
- TD-001型定義修正（1-2時間、**最優先**）
- 技術的問題5件（約9時間）
- Cloud Functions実装（3-4時間）
- API統合（時間未定）
- Vertex AI移行（3-4時間）

---

## 📚 関連ファイル

### L1マスターファイル（カテゴリー別）
- [UI_MASTER.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/UI_MASTER.md) - UI要件
- [BACKEND_MASTER.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/BACKEND_MASTER.md) - バックエンド要件
- [DEPLOY_MASTER.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/DEPLOY_MASTER.md) - デプロイ手順

### L2カテゴリー別タスク
- [task_ui.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/task_ui.md) - UI実装タスク
- [task_backend.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/task_backend.md) - バックエンド実装タスク
- [task_deploy.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/task_deploy.md) - デプロイ・インフラタスク

### セッション記録
- [SESSION_20260125.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260125.md) - Cloud Runデプロイ完全記録
- [SESSION_20260124.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260124.md) - Step 3完了、TD-001発見
- [SESSION_20260123.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260123.md) - Step 2完了
- [UNRESOLVED_DISCUSSIONS.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/UNRESOLVED_DISCUSSIONS.md) - 未解決議論5件

### 技術課題
- [TECH-DEBT.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/TECH-DEBT.md) - TD-001詳細
- [step3_validation_issues.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/step3_validation_issues.md) - 技術的問題5件
- [phase2_postponed_issues.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/phase2_postponed_issues.md) - Phase 2延期事項

---

## 🚨 緊急対応：APIキー漏洩対策（2026-01-27）

### 発覚と対応

**発覚経緯**:
- GitHub Secret Scanningアラート
- コミット`fd814d17`のDockerfileにAPIキーハードコーディング発見

**漏洩したAPIキー（2つ）**:
1. `***REMOVED***`（Firebase API Key）
2. `***REMOVED***`（別のAPI Key）


### 実施した対策

#### 1. Git履歴からAPIキー完全削除 ✅
- **ツール**: `git-filter-repo`
- **実行時間**: 19.64秒
- **対象**: すべてのブランチとタグ
- **結果**: GitHubに強制push完了

#### 2. 古いAPIキーの無効化 ✅
- Google Cloud Consoleで削除
- 削除済みリストに移動（30日以内復元可能だが無効化済み）

#### 3. 新しいAPIキーの安全性確認 ✅
- `***REMOVED***` (Firebase API Key) - 漏洩なし ✅
- `***REMOVED***` (Gemini API Key) - 漏洩なし ✅
- Git履歴・GitHubリモート・ローカルファイルすべてで確認済み

#### 4. GitHubキャッシュ問題 ⚠️
- **問題**: 古いコミット`fd814d17`がまだGitHubでアクセス可能
- **原因**: GitHubは削除されたコミットを90日間キャッシュ保持
- **対応**: GitHub Supportへの連絡が必要

### 馬鹿AIの漏洩対策（再発防止）

#### 1. `.gitignore`厳格化 ✅ 完了
```gitignore
# Environment & Credentials
.env
.env.*
!.env.example
certs/
service-account.json
```

#### 2. Dockerfileのベストプラクティス徹底
- ❌ **ハードコーディング禁止**（絶対）
- ✅ **ビルド時引数（ARG）使用**
- ✅ **GitHub Secretsから環境変数注入**

#### 3. 今後の対策（推奨）
- [ ] pre-commitフック導入（`detect-secrets`）
- [ ] GitHub Secret Scanning有効化（既存）
- [ ] API制限設定（HTTPリファラー制限）

### 次のアクション

| 優先度 | タスク | 期限 |
|--------|--------|------|
| 高 | GitHub Supportに連絡（キャッシュクリア） | 即座 |
| 中 | pre-commitフック導入 | Phase 2 |
| 低 | GitHub Secret Scanningアラート確認 | Phase 2 |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-26 01:33 | 初版作成：14ファイル全文読み込み（11,559行）から抽出、Phase 1全体進捗33%、Milestone 1.1-1.4進捗、未解決議論5件、タイムライン、次のステップを網羅 |
