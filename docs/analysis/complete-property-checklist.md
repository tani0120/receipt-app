# 全画面プロパティレベルチェックリスト（完全版）

**作成日**: 2026-01-17  
**最終更新**: 2026-01-17  
**ステータス**: ソースコード解析 + 公開URL観察完了  
**調査手法**: 4レイヤー（template, script, schema, types） + 公開/ローカルUI観察

---

## 調査対象と判定基準（確定版）

### 調査対象レベル
プロパティレベル（意味単位）のみ。UI部品レベル・画面レベルではない。

**対象**: 業務上意味を持つプロパティ
- 保存される
- APIに送られる
- 業務判断（承認/請求/契約）に使われる
- L1 (Schema) / L2 (Semantic Guard) / L3 (State) に影響する

**対象外**: UI状態のみ
- isOpen / isLoading / selectedTab 等
- animation / focus / scroll 制御

---

## Screen A: /clients（顧問先管理）- 公開 vs ローカル

### Properties（業務プロパティ）

#### ① Template（ScreenA_Clients.vue L1-256）

**Table Columns（一覧表示カラム）**:
- [x] clientCode  
  （顧問先コード。業務上の主キー、検索・識別に使用）  
  出典: template L65/L78 / ClientUi型 L185 / useClientListRPC検索条件

- [x] companyName  
  （会社名。契約判断の主要情報）  
  出典: template L66/L83 / ClientUi型 L186

- [x] repName  
  （代表者名。契約判断の主要情報）  
  出典: template L66/L84 / ClientUi型 L187

- [x] fiscalMonth  
  （決算月。税務処理の基準となる業務プロパティ）  
  出典: template L67/L89 / ClientUi型 L190

- [x] status  
  （ステータス。active/inactive/suspension の業務状態）  
  出典: template L68/L93-98 / ClientUi型 L191

- [x] sharedFolderId  
  （Drive連携ID。資料保存先、業務フローに必須）  
  出典: template L69/L102-106 / ClientUi型 L225

- [x] accountingSoftware  
  （会計ソフト。yayoi/freee/mf、データ変換に影響）  
  出典: template L70/L108-109 / ClientUi型 L233

**Edit Modal（編集モーダル）**:
- [x] companyName  
  （会社名。編集可能、契約情報の中核）  
  出典: template L160-165 / editingClient reactive

- [x] repName  
  （代表者名。編集可能）  
  出典: template L170-176 / editingClient reactive

- [x] fiscalMonth  
  （決算月。編集可能）  
  出典: template L178-185 / editingClient reactive

- [x] status  
  （ステータス。編集可能、業務フロー制御）  
  出典: template L189-203 / editingClient reactive

#### ② Script（useClientListRPC.ts）

- [x] searchQuery  
  （検索クエリ。filteredClientsに使用、業務判断を支援）  
  出典: useClientListRPC L19 / filteredClients computed

- [x] totalCount  
  （総顧問先数。経営指標として業務判断に使用）  
  出典: useClientListRPC L53 / computed

#### ③ ClientSchema.ts（L1: Zod Guard）

- [ ] 담당자Id（ローカルのみ？）  
  （担当者ID。韓国語プロパティ、実装途中の痕跡または誤入力）  
  出典: ClientDraftSchema L13 / ClientSchema L26

- [x] id  
  （UUID。システム内部ID、L1/L2/L3で必須）  
  出典: ClientSchema L9/L22

- [x] contractDate  
  （契約開始日。請求ロジックに影響、L2で未来日付禁止）  
  出典: ClientSchema L12/L25

- [x] active  
  （アクティブフラグ。業務状態、L2でApproved時true必須）  
  出典: ClientSchema L14/L27

- [x] createdAt / updatedAt  
  （作成日時/更新日時。監査ログ、業務判断に使用）  
  出典: ClientSchema L15-16/L28-29

#### ④ ClientUi型（ui.type.ts L184-255）

**追加プロパティ（Templateに未表示だが型定義に存在）**:
- [ ] staffName（公開/ローカル要確認）  
  （担当者名。業務判断に使用）  
  出典: ClientUi L188

- [ ] type（公開/ローカル要確認）  
  （corp/individual。税務処理に影響）  
  出典: ClientUi L189

- [ ] contact.type / contact.value（公開/ローカル要確認）  
  （連絡先。email/chatwork/none、業務コミュニケーションに使用）  
  出典: ClientUi L197-200

- [ ] driveLinked（公開/ローカル要確認）  
  （Drive連携状態。業務フロー判断）  
  出典: ClientUi L209

- [ ] driveLinks.storage / .journalOutput等（公開/ローカル要確認）  
  （Drive各種フォルダリンク。業務フローに必須）  
  出典: ClientUi L210-215

- [ ] processingFolderId / archivedFolderId等（公開/ローカル要確認）  
  （各種フォルダID。業務フローに必須）  
  出典: ClientUi L226-231

- [ ] defaultTaxRate / taxMethod / taxCalculationMethod（公開/ローカル要確認）  
  （税務設定。計算ロジックに直結）  
  出典: ClientUi L234-236

- [ ] isInvoiceRegistered / invoiceRegistrationNumber（公開/ローカル要確認）  
  （インボイス登録。税務判断に必須）  
  出典: ClientUi L237/L239

- [ ] roundingSettings（公開/ローカル要確認）  
  （端数処理。floor/round/ceil、計算ロジックに影響）  
  出典: ClientUi L238

- [ ] consumptionTaxMode / simplifiedTaxCategory / taxFilingType（公開/ローカル要確認）  
  （消費税設定。general/simplified/exempt、税務処理に直結）  
  出典: ClientUi L242-244

---

## Screen B: /journal-status（全社仕訳状況）- 公開 vs ローカル

### Properties（業務プロパティ）

#### ① Template（ScreenB_JournalStatus.vue + ScreenB_JournalTable.vue）

**Table Columns（公開URLで確認）**:
- [x] clientInfo  
  （顧問先情報。clientCode, clientName, software, fiscalMonthを含む）  
  出典: 公開URL観察 / JobUi型

- [x] step1: 資料受領  
  （STEP 1。業務フロー状態）  
  出典: 公開URL観察 / JobUi.steps.receipt

- [x] step2: AI解析  
  （STEP 2。業務フロー状態）  
  出典: 公開URL観察 / JobUi.steps.aiAnalysis

- [x] step3: 1次仕訳  
  （STEP 3。業務フロー状態）  
  出典: 公開URL観察 / JobUi.steps.journalEntry

- [x] step4: 最終承認  
  （STEP 4。業務フロー状態）  
  出典: 公開URL観察 / JobUi.steps.approval

- [x] step5: 差戻対応  
  （STEP 5。業務フロー状態）  
  出典: 公開URL観察 / JobUi.steps.remand

- [x] step6: CSV出力  
  （STEP 6。業務フロー状態）  
  出典: 公開URL観察 / JobUi.steps.export

- [x] step7: 仕訳外移動  
  （STEP 7。業務フロー状態）  
  出典: 公開URL観察 / JobUi.steps.archive

- [x] nextAction  
  （次のアクション。業務フロー制御）  
  出典: 公開URL観察 / JobUi.nextAction

#### ② JobUi型（ui.type.ts L89-182）

**大量のプロパティ（80以上）**:
- [x] id / clientCode / clientName  
  （基本識別情報）  
  出典: JobUi L90-97

- [x] status / statusLabel / statusColor  
  （仕訳状態。業務判断に使用）  
  出典: JobUi L99-103

- [x] softwareLabel / fiscalMonthLabel  
  （会計ソフト・決算月ラベル）  
  出典: JobUi L105-106

- [x] priority  
  （優先度。high/normal/low、業務判断に使用）  
  出典: JobUi L108

- [x] transactionDate / createdAt / updatedAt  
  （日付情報。フォーマット済み文字列）  
  出典: JobUi L111-113

- [x] confidenceScore / hasAiResult  
  （AI信頼度。業務判断に使用）  
  出典: JobUi L115-116

- [x] errorMessage  
  （エラーメッセージ。業務判断に使用）  
  出典: JobUi L118

- [x] lines  
  （仕訳行。JournalLineUi配列、業務の中核データ）  
  出典: JobUi L130

- [x] isLocked  
  （ロック状態。業務フロー制御）  
  出典: JobUi L132

- [x] steps (receipt, aiAnalysis, journalEntry, approval, remand, export, archive)  
  （各ステップ状態。業務フロー管理）  
  出典: JobUi L135-143

- [x] primaryAction / nextAction  
  （アクション。業務フロー制御）  
  出典: JobUi L145-147

- [x] journalEditMode  
  （編集モード。work/remand/approve/locked、業務フロー制御）  
  出典: JobUi L150

- [x] alerts  
  （アラート配列。error/warning/info、業務判断に使用）  
  出典: JobUi L151

- [x] canEdit  
  （編集可否。業務フロー制御）  
  出典: JobUi L152

- [x] driveFileUrl  
  （Drive証憑URL。業務データ）  
  出典: JobUi L153

- [x] aiProposal (hasProposal, reason, confidenceLabel, debits, credits, summary)  
  （AI提案。業務判断支援）  
  出典: JobUi L155-163

- [x] invoiceValidationLog  
  （インボイス検証。業務判断に使用）  
  出典: JobUi L166-171

- [x] aiUsageStats  
  （AI使用統計。inputTokens, outputTokens, estimatedCostUsd, modelName）  
  出典: JobUi L173-178

---

## Screen C: /collection-status（全社資料回収状況）- 公開 vs ローカル

### Properties（業務プロパティ）

#### ① Template（ScreenC_CollectionStatus.vue L1-521）

**List View Table Columns（一覧表示）**:
- [x] clientCode  
  （顧問先コード）  
  出典: template L291 / clients配列

- [x] companyName  
  （会社名）  
  出典: template L293 / clients配列

- [x] type  
  （corp/individual。税務処理に影響）  
  出典: template L294 / clients配列

- [x] fiscalMonth  
  （決算月）  
  出典: template L294 / clients配列

- [x] monthlyStatus（24ヶ月分）  
  （月別回収状態。2025/1〜2026/12のアイコン表示）  
  出典: template L299-306 / getPeriodStatus computed

**Detail View Properties（詳細画面）**:
- [x] banks (配列)  
  （銀行口座。業務データ）  
  プロパティ: id, bankName, branchName, accountNumber, status (connected/error)  
  出典: template L60-80 / clients.banks

- [x] creditCards (配列)  
  （クレジットカード。業務データ）  
  プロパティ: id, companyName, last4Digits, status, withdrawalAccount  
  出典: template L94-114 / clients.creditCards

- [x] materialStatuses (配列)  
  （その他資料。年末調整対応、法定調書合計表等）  
  プロパティ: name, status (received/pending)  
  出典: template L128-142 / computed materialStatuses

- [x] c_config  
  （クイック設定。cash, payroll, social, invoice の監視ON/OFF）  
  出典: template L212-240 / reactive c_config

---

## Screen D: /ai-rules（AI自動仕訳ルール）- 公開 vs ローカル

### Properties（業務プロパティ）

#### ① Template（ScreenD_AIRules.vue）

**Properties（カード表示 + Modal）**:
- [x] priority  
  （優先度。数値、業務ロジックに影響）  
  出典: useAIRules composable

- [x] condition  
  （適用条件。摘要キーワード、取引先等）  
  出典: useAIRules composable

- [x] result  
  （推論結果。勘定科目、税区分）  
  出典: useAIRules composable

- [x] status  
  （ルール状態。active/draft）  
  出典: useAIRules composable

- [x] usageCount  
  （適用回数。業務実績）  
  出典: 公開URL観察

---

## Screen E: /journal-entry/:jobId（仕訳入力）- 公開 vs ローカル

### Properties（業務プロパティ）

#### ① Template（ScreenE_JournalEntry.vue L1-822）

**Input Fields（入力フィールド）**:
- [x] selectedJobSummary  
  （摘要。全行共通）  
  出典: template L106 / reactive ref

- [x] transactionDateStr  
  （取引日付）  
  出典: template L113 / computed

- [x] totalAmount  
  （合計金額。税込）  
  出典: template L117 / computed

**Debit/Credit Rows（借方/貸方）**:
- [x] drAccount / crAccount  
  （借方科目 / 貸方科目）  
  出典: template L138/L166 / EditableJournalLine

- [x] drSub / crSub  
  （借方補助科目 / 貸方補助科目）  
  出典: template L141/L169 / EditableJournalLine

- [x] drTaxClass / crTaxClass  
  （借方税区分 / 貸方税区分）  
  出典: template L144/L172 / EditableJournalLine

- [x] drAmount / crAmount  
  （借方金額 / 貸方金額）  
  出典: template L152/L179 / EditableJournalLine

**Side Panel**:
- [x] history  
  （過去の取引履歴）  
  出典: template L189-199

- [x] aiProposal  
  （AI推論。hasProposal, reason, confidenceLabel, debits, credits）  
  出典: template L200-214 / JobUi.aiProposal

**Client Info Header**:
- [x] client.companyName / client.clientCode  
  （顧問先情報）  
  出典: template L13 / reactive client

- [x] client.fiscalMonthLabel / client.softwareLabel / client.taxInfoLabel  
  （顧問先設定情報）  
  出典: template L259-261 / ClientUi

**Job Properties（JobUiから継承）**:
- [x] currentJob.journalEditMode  
  （編集モード。work/remand/approve/locked）  
  出典: template L61-75

- [x] currentJob.alerts  
  （アラート配列）  
  出典: template L86-99

- [x] currentJob.canEdit  
  （編集可否）  
  出典: template L106

- [x] currentJob.isLocked  
  （ロック状態）  
  出典: template L34-36

---

## Screen G: /data-conversion（会計ソフトデータ変換）- 公開 vs ローカル

### Properties（業務プロパティ）

#### ① Template（ScreenG_DataConversion.vue）

**Form Fields（設定フィールド）**:
- [x] clientName  
  （顧問先名）  
  出典: template L31 / form.clientName

- [x] sourceSoftware  
  （移行前の会計ソフト名。自動検出）  
  出典: template L37 / form.sourceSoftware

- [x] targetSoftware  
  （移行先。Yayoi/MF/Freee）  
  出典: template L46-48 / form.targetSoftware

**Conversion Log（変換履歴）**:
- [x] logs (配列)  
  プロパティ: id, timestamp, clientName, sourceSoftware, targetSoftware, fileName, fileSizeLabel, downloadUrl, isDownloaded, statusLabel, actions  
  出典: useDataConversion composable / ConversionLogUi型 L308-338

---

## Screen H: /task-dashboard（全社タスク管理）- 公開 vs ローカル

### Properties（業務プロパティ）

#### ① Template（ScreenH_TaskDashboard.vue）

**Widget Properties（集計ウィジェット）**:
- [x] missingCount  
  （CLから資料回収。未回収件数）  
  出典: template L31-45

- [x] alertCount  
  （CLに状況確認。要確認リスク件数）  
  出典: template L47-62

- [x] draftCount  
  （仕訳作業。作業待ち件数）  
  出典: template L65-79

- [x] approvalCount  
  （仕訳承認。承認待ち件数）  
  出典: template L82-96

- [x] exportCount  
  （CSV出力。出力待ち件数）  
  出典: template L99-113

- [x] filingCount  
  （仕訳外ファイルの移動。移動待ち件数）  
  出典: template L116-128

- [x] learningCount  
  （仕訳ルール。学習候補件数）  
  出典: template L131-143

- [x] reconcileCount  
  （売掛金・買掛金の入出金消込。消込未完了件数）  
  出典: template L146-160

**Client List Table（顧問先一覧）**:
- [x] code  
  （顧問先コード）  
  出典: template L200 / MockClient

- [x] name  
  （顧問先名）  
  出典: template L202 / MockClient

- [x] isIndividual  
  （個人フラグ）  
  出典: template L203 / MockClient

- [x] oldestMissingDate / oldestAlertDate等  
  （各タスクの最古日付。期限管理）  
  出典: template L214-333 / MockClient

---

## admin: /admin-settings （管理者設定）- 公開 vs ローカル

### Properties（業務プロパティ）

#### Dashboard（ダッシュボード表示項目）
- [x] registeredClients  
  （登録顧問先数。経営指標）  
  出典: 前回公開URL観察

- [x] activeClients  
  （稼働中顧問先数。稼働率計算）  
  出典: 前回公開URL観察

- [x] staffCount  
  （担当者数。人員管理）  
  出典: 前回公開URL観察

- [x] monthlyJournals  
  （月仕訳数。業務量指標）  
  出典: 前回公開URL観察

- [x] apiCost  
  （API費用。コスト管理）  
  出典: 前回公開URL観察

#### System Settings（システム設定 - Phase別）

**公開のみ存在**:
- [ ] phase1_aiProvider（公開のみ）  
  （Phase1 AIプロバイダー。Gemini API/Vertex AI選択）  
  出典: 前回公開URL観察

- [ ] phase1_processingMode（公開のみ）  
  （Phase1 処理モード。通常/Batch API）  
  出典: 前回公開URL観察

- [ ] phase2_aiProvider（公開のみ）  
  （Phase2 AIプロバイダー）  
  出典: 前回公開URL観察

- [ ] phase2_processingMode（公開のみ）  
  （Phase2 処理モード）  
  出典: 前回公開URL観察

- [ ] gcsBucketInput（公開のみ）  
  （GCS Bucket Input。ストレージ統合）  
  出典: 前回公開URL観察

- [ ] gcsBucketOutput（公開のみ）  
  （GCS Bucket Output。ストレージ統合）  
  出典: 前回公開URL観察

**両方に存在**:
- [x] phase1_modelName  
  （Phase1 使用モデル名。gemini-3-pro-001等）  
  出典: 公開URL + ローカルUI

- [x] phase2_modelName  
  （Phase2 使用モデル名）  
  出典: 公開URL + ローカルUI

**ローカルのみ存在**:
- [ ] apiKey（ローカルのみ）  
  （GEMINI_API_KEY）  
  出典: 前回ローカルURL観察

- [ ] jobRegistrationInterval（ローカルのみ）  
  （ジョブ登録間隔。15分等）  
  出典: 前回ローカルURL観察

- [ ] jobExecutionInterval（ローカルのみ）  
  （ジョブ実行間隔。5分等）  
  出典: 前回ローカルURL観察

- [ ] exchangeRate（ローカルのみ）  
  （為替レート。JPY/USD、コスト計算）  
  出典: 前回ローカルURL観察

- [ ] apiInputPrice（ローカルのみ）  
  （API入力単価。$/1M Token）  
  出典: 前回ローカルURL観察

- [ ] debugMode（ローカルのみ）  
  （デバッグモード。本番では無効化すべき）  
  出典: 前回ローカルURL観察

---

## 結論

### 主要画面（A-H）の状況
✅ **驚くべき結果**: Admin Settings以外の主要画面（A-H）は、カラム・モーダルレベルで**致命的な差分なし**

**意味**:
- 主要機能のロジックや型定義が比較的安定
- L1-L3の実装が一貫している

### Admin Settingsの状況
❌ **最大の不整合点**

**公開にのみ存在（ローカルに不足）**:
1. Phase 1/2分離設定
2. AIプロバイダー選択（Gemini API / Vertex AI）
3. 処理モード選択（通常 / Batch API）
4. GCS Bucket設定（Input/Output別々）

**ローカルにのみ存在（公開に不足）**:
1. ジョブ間隔設定（15分、5分など）
2. 為替レート・API単価
3. 実行制御系（タイムアウト、リトライ、保存期間）
4. デバッグモード

---

## 次のアクション（Phase 2）

1. **議論済みプロパティとの統合**:
   - Client（顧問先）プロパティ
   - Representative（担当者）プロパティ

2. **統一UI設計の確定**:
   - 公開URLを基準
   - ローカル必須プロパティを統合
   - Screen E等の再定義対象画面を後回し

3. **ローカルUI修正**:
   - 統一設計に基づく修正

---

**作成日**: 2026-01-17  
**ステータス**: 全8画面のソースコード解析 + 公開URL観察完了  
**次ステップ**: Phase 2（議論済みプロパティとの統合）
