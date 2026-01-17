# プロパティ統合マップ（Phase 2）

**作成日**: 2026-01-17  
**最終更新**: 2026-01-17  
**ステータス**: Phase 2 マッピング中  
**関連**: complete-property-checklist.md, ADR-004, ADR-005, task.md

---

## 目的

**complete-property-checklist.md**（ソースコード解析 + 公開URL観察）と**議論済みプロパティ体系**（PROPERTY_CATALOG, ADR-004/005）を突き合わせ、以下を明確化する：

1. **すべてのプロパティの議論結果**（確定/修正/廃止/PENDING）
2. **Lレイヤー帰属**（L1/L2/L3/L4/L5）
3. **Phase 2の対応アクション**
4. **Freeze可能範囲とPENDING項目の可視化**

---

## 判定ステータス定義【Freeze】

| ステータス | 意味 | 対応 |
|----------|------|------|
| **確定** | Freeze対象。変更不可。 | 実装済み。テストのみ。 |
| **修正** | 名前・意味変更が必要。 | 議論 → 修正 → Full Freeze |
| **廃止** | 削除予定。 | 議論 → 削除 |
| **PENDING** | 議論待ち（UI or 業務）。 | 人間が判断 → 確定/修正/廃止 |

---

## マップ構造

```
Domain (ドメイン)
 ├─ Entity（意味的まとまり）
 │   ├─ Property（業務プロパティ）
 │   │   ├─ 意味
 │   │   ├─ 現状（公開 / ローカル / 両方）
 │   │   ├─ 出典（template / script / schema / types）
 │   │   ├─ 議論結果（確定 / 修正 / 廃止 / PENDING）
 │   │   ├─ L1 / L2 / L3 / L4 / L5 帰属
 │   │   └─ 対応アクション
```

---

# 1. Client ドメイン（顧問先）

## Entity: Client（顧問先）

### 基本識別情報

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **id** | 顧問先UUID | 両方 | ClientSchema L9/L22 | **確定** | **L1** | Freeze |
| **clientCode** | 顧問先主キー（外部キー） | 両方 | ScreenA template L65/L78, ClientUi L185 | **確定** | **L1, L3** | Freeze |
| **companyName** | 会社名 | 両方 | ScreenA template L66/L83, ClientUi L186, ClientSchema | **確定** | **L1, L3** | Freeze |
| **repName** | 代表者名 | 両方 | ScreenA template L66/L84, ClientUi L187 | **確定** | **L3** | Freeze |
| **fiscalMonth** | 決算月（税務処理の基準） | 両方 | ScreenA template L67/L89, ClientUi L190 | **確定** | **L1, L3** | Freeze |

### 業務状態・契約情報

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **status** | 稼働状態（active/inactive/suspension） | 両方 | ScreenA template L68/L93-98, ClientUi L191, ClientSchema | **確定** | **L2, L3** | Freeze（L2 Semantic Guard実装済み） |
| **active** | アクティブフラグ | 両方 | ClientSchema L14/L27 | **確定** | **L2** | Freeze（L2でApproved時true必須） |
| **contractDate** | 契約開始日 | 両方 | ClientSchema L12/L25 | **確定** | **L1, L2** | Freeze（L2で未来日付禁止） |
| **createdAt** | 作成日時（監査ログ） | 両方 | ClientSchema L15/L28 | **確定** | **L1** | Freeze |
| **updatedAt** | 更新日時（監査ログ） | 両方 | ClientSchema L16/L29 | **確定** | **L1** | Freeze |

### Drive連携・フォルダ管理

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **sharedFolderId** | Drive連携ID（資料保存先） | 両方 | ScreenA template L69/L102-106, ClientUi L225 | **確定** | **L1, L3** | Freeze |
| **driveLinked** | Drive連携状態 | 型のみ | ClientUi L209 | **PENDING** | **L3** | UI反映を議論 |
| **driveLinks.storage** | ストレージフォルダリンク | 型のみ | ClientUi L210-215 | **PENDING** | **L3** | UI反映を議論 |
| **driveLinks.journalOutput** | 仕訳出力フォルダリンク | 型のみ | ClientUi L210-215 | **PENDING** | **L3** | UI反映を議論 |
| **processingFolderId** | 処理中フォルダID | 型のみ | ClientUi L226-231 | **PENDING** | **L1** | UI反映を議論 |
| **archivedFolderId** | アーカイブフォルダID | 型のみ | ClientUi L226-231 | **PENDING** | **L1** | UI反映を議論 |

### 税務設定

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **accountingSoftware** | 会計ソフト（yayoi/freee/mf） | 両方 | ScreenA template L70/L108-109, ClientUi L233 | **確定** | **L1, L3** | Freeze |
| **defaultTaxRate** | デフォルト税率 | 型のみ | ClientUi L234 | **PENDING** | **L2** | UI反映 + 計算ロジック確認 |
| **taxMethod** | 税区分方式 | 型のみ | ClientUi L235 | **PENDING** | **L2** | UI反映 + 計算ロジック確認 |
| **taxCalculationMethod** | 税額計算方式 | 型のみ | ClientUi L236 | **PENDING** | **L2** | UI反映 + 計算ロジック確認 |
| **isInvoiceRegistered** | インボイス登録 | 型のみ | ClientUi L237 | **PENDING** | **L2** | UI反映 + L2判定ロジック追加 |
| **invoiceRegistrationNumber** | インボイス登録番号 | 型のみ | ClientUi L239 | **PENDING** | **L1** | UI反映 |
| **roundingSettings** | 端数処理（floor/round/ceil） | 型のみ | ClientUi L238 | **PENDING** | **L2** | UI反映 + 計算ロジック確認 |
| **consumptionTaxMode** | 消費税区分（general/simplified/exempt） | 型のみ | ClientUi L242 | **PENDING** | **L2** | UI反映 + L2判定ロジック追加 |
| **simplifiedTaxCategory** | 簡易課税区分 | 型のみ | ClientUi L243 | **PENDING** | **L2** | UI反映 |
| **taxFilingType** | 税務申告種別 | 型のみ | ClientUi L244 | **PENDING** | **L2** | UI反映 |

### 担当者・連絡先

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **staffName** | 担当者名 | 型のみ | ClientUi L188 | **PENDING** | **L3** | UI反映を議論 |
| **담당자Id** | 担当者ID（韓国語プロパティ、痕跡） | ローカルのみ | ClientDraftSchema L13, ClientSchema L26 | **廃止候補** | **L1** | 削除 or rename（韓国語→英語） |
| **type** | 法人/個人（corp/individual） | 型のみ | ClientUi L189 | **PENDING** | **L1, L2** | UI反映 + 税務処理ロジック確認 |
| **contact.type** | 連絡先種別（email/chatwork/none） | 型のみ | ClientUi L197-200 | **PENDING** | **L1** | UI反映を議論 |
| **contact.value** | 連絡先値 | 型のみ | ClientUi L197-200 | **PENDING** | **L1** | UI反映を議論 |

### UI専用・補助プロパティ

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **searchQuery** | 検索クエリ（filteredClientsに使用） | 両方 | useClientListRPC L19 | **確定** | **L3** | Freeze |
| **totalCount** | 総顧問先数（経営指標） | 両方 | useClientListRPC L53 (computed) | **確定** | **L3** | Freeze |

---

# 2. Job ドメイン（仕訳・業務フロー）

## Entity: Job（業務単位）

### 基本識別情報

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **id** | 仕訳UUID | 両方 | JobUi L90 | **確定** | **L1** | Freeze |
| **clientCode** | 顧問先コード | 両方 | JobUi L91 | **確定** | **L1** | Freeze |
| **clientName** | 顧問先名 | 両方 | JobUi L92 | **確定** | **L3** | Freeze |

### 業務状態・フロー制御

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **status** | 仕訳状態 | 両方 | JobUi L99 | **確定** | **L2, L3** | Freeze（State Machine実装必要） |
| **statusLabel** | 状態ラベル | 両方 | JobUi L100 | **確定** | **L3** | Freeze |
| **statusColor** | 状態カラーコード | 両方 | JobUi L103 | **確定** | **L3, L4** | Freeze（Visual Guard確認） |
| **priority** | 優先度（high/normal/low） | 両方 | JobUi L108 | **確定** | **L2, L3** | Freeze |

### STEPフロー管理（L2/L3の核心）

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **steps.receipt** | STEP 1: 資料受領 | 両方 | JobUi L135-143, 公開URL観察 | **確定** | **L2, L3** | Freeze（State Machine必須） |
| **steps.aiAnalysis** | STEP 2: AI解析 | 両方 | JobUi L135-143, 公開URL観察 | **確定** | **L2, L3** | Freeze |
| **steps.journalEntry** | STEP 3: 1次仕訳 | 両方 | JobUi L135-143, 公開URL観察 | **確定** | **L2, L3** | Freeze |
| **steps.approval** | STEP 4: 最終承認 | 両方 | JobUi L135-143, 公開URL観察 | **確定** | **L2, L3** | Freeze |
| **steps.remand** | STEP 5: 差戻対応 | 両方 | JobUi L135-143, 公開URL観察 | **確定** | **L2, L3** | Freeze |
| **steps.export** | STEP 6: CSV出力 | 両方 | JobUi L135-143, 公開URL観察 | **確定** | **L2, L3** | Freeze |
| **steps.archive** | STEP 7: 仕訳外移動 | 両方 | JobUi L135-143, 公開URL観察 | **確定** | **L2, L3** | Freeze |

### アクション・編集制御

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **primaryAction** | 主要アクション | 両方 | JobUi L145 | **確定** | **L3** | Freeze |
| **nextAction** | 次のアクション | 両方 | JobUi L147, 公開URL観察 | **確定** | **L3** | Freeze |
| **journalEditMode** | 編集モード（work/remand/approve/locked） | 両方 | JobUi L150, ScreenE template | **確定** | **L3** | Freeze |
| **canEdit** | 編集可否 | 両方 | JobUi L152, ScreenE template | **確定** | **L3** | Freeze |
| **isLocked** | ロック状態 | 両方 | JobUi L132, ScreenE template | **確定** | **L3** | Freeze（State Machine必須） |

### 仕訳データ

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **lines** | 仕訳行（JournalLineUi配列） | 両方 | JobUi L130 | **確定** | **L1, L2** | Freeze（貸借一致L2必須） |
| **transactionDate** | 取引日付 | 両方 | JobUi L111, ScreenE template | **確定** | **L1** | Freeze |
| **totalAmount** | 合計金額 | 型のみ | ScreenE computed L117 | **確定** | **L2** | Freeze（計算検証必須） |

### AI提案・信頼度

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **confidenceScore** | AI信頼度 | 両方 | JobUi L115 | **確定** | **L2** | Freeze（L2閾値0.8） |
| **hasAiResult** | AI結果有無 | 両方 | JobUi L116 | **確定** | **L3** | Freeze |
| **aiProposal.hasProposal** | AI提案有無 | 両方 | JobUi L155-163, ScreenE template | **確定** | **L3** | Freeze |
| **aiProposal.reason** | AI推論理由 | 両方 | JobUi L155-163 | **確定** | **L3** | Freeze |
| **aiProposal.confidenceLabel** | 信頼度ラベル | 両方 | JobUi L155-163 | **確定** | **L3, L4** | Freeze |
| **aiProposal.debits** | AI提案・借方 | 両方 | JobUi L155-163 | **確定** | **L2, L3** | Freeze |
| **aiProposal.credits** | AI提案・貸方 | 両方 | JobUi L155-163 | **確定** | **L2, L3** | Freeze |
| **aiProposal.summary** | AI提案・摘要 | 両方 | JobUi L155-163 | **確定** | **L3** | Freeze |

### 検証・アラート

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **alerts** | アラート配列（error/warning/info） | 両方 | JobUi L151, ScreenE template | **確定** | **L2, L3** | Freeze |
| **errorMessage** | エラーメッセージ | 両方 | JobUi L118 | **確定** | **L2, L3** | Freeze |
| **invoiceValidationLog** | インボイス検証ログ | 両方 | JobUi L166-171 | **確定** | **L2** | Freeze |

### AI使用統計・コスト管理

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **aiUsageStats.inputTokens** | 入力トークン数 | 両方 | JobUi L173-178 | **確定** | **L1** | Freeze |
| **aiUsageStats.outputTokens** | 出力トークン数 | 両方 | JobUi L173-178 | **確定** | **L1** | Freeze |
| **aiUsageStats.estimatedCostUsd** | 推定コスト（USD） | 両方 | JobUi L173-178 | **確定** | **L1, L2** | Freeze |
| **aiUsageStats.modelName** | 使用モデル名 | 両方 | JobUi L173-178 | **確定** | **L1** | Freeze |

### Drive・証憑

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **driveFileUrl** | Drive証憑URL | 両方 | JobUi L153, ScreenE template | **確定** | **L1** | Freeze |

### 日付・メタデータ

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **createdAt** | 作成日時 | 両方 | JobUi L112 | **確定** | **L1** | Freeze |
| **updatedAt** | 更新日時 | 両方 | JobUi L113 | **確定** | **L1** | Freeze |
| **softwareLabel** | 会計ソフトラベル | 両方 | JobUi L105 | **確定** | **L3** | Freeze |
| **fiscalMonthLabel** | 決算月ラベル | 両方 | JobUi L106 | **確定** | **L3** | Freeze |

---

# 3. Admin / System ドメイン（最大論点）

## Entity: SystemConfig（システム設定）

### Dashboard表示項目（経営指標）

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **registeredClients** | 登録顧問先数 | 両方 | 公開URL観察 | **確定** | **L1** | Freeze |
| **activeClients** | 稼働中顧問先数 | 両方 | 公開URL観察 | **確定** | **L1** | Freeze |
| **staffCount** | 担当者数 | 両方 | 公開URL観察 | **確定** | **L1** | Freeze |
| **monthlyJournals** | 月仕訳数 | 両方 | 公開URL観察 | **確定** | **L1** | Freeze |
| **apiCost** | API費用 | 両方 | 公開URL観察 | **確定** | **L1** | Freeze |

### Phase別AI設定（公開のみ存在）【最大論点】

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **phase1_aiProvider** | Phase1 AIプロバイダー（Gemini API / Vertex AI） | **公開のみ** | 公開URL観察 | **PENDING** | **L0, L1** | **議論 → ローカル統合** |
| **phase1_processingMode** | Phase1 処理モード（通常 / Batch API） | **公開のみ** | 公開URL観察 | **PENDING** | **L0** | **議論 → ローカル統合** |
| **phase2_aiProvider** | Phase2 AIプロバイダー | **公開のみ** | 公開URL観察 | **PENDING** | **L0, L1** | **議論 → ローカル統合** |
| **phase2_processingMode** | Phase2 処理モード | **公開のみ** | 公開URL観察 | **PENDING** | **L0** | **議論 → ローカル統合** |

### GCS Bucket設定（公開のみ存在）【最大論点】

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **gcsBucketInput** | GCS Bucket Input（ストレージ統合） | **公開のみ** | 公開URL観察 | **PENDING** | **L0, L1** | **議論 → 統合** |
| **gcsBucketOutput** | GCS Bucket Output（ストレージ統合） | **公開のみ** | 公開URL観察 | **PENDING** | **L0, L1** | **議論 → 統合** |

### モデル名設定（両方に存在）

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **phase1_modelName** | Phase1 使用モデル名（gemini-3-pro-001等） | 両方 | 公開URL + ローカルUI | **確定** | **L1** | Freeze |
| **phase2_modelName** | Phase2 使用モデル名 | 両方 | 公開URL + ローカルUI | **確定** | **L1** | Freeze |

### ジョブ間隔設定（ローカルのみ存在）【論点】

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **jobRegistrationInterval** | ジョブ登録間隔（15分等） | **ローカルのみ** | ローカルURL観察 | **PENDING** | **L0** | **設計判断（本番必要性）** |
| **jobExecutionInterval** | ジョブ実行間隔（5分等） | **ローカルのみ** | ローカルURL観察 | **PENDING** | **L0** | **設計判断（本番必要性）** |

### コスト計算設定（ローカルのみ存在）

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **exchangeRate** | 為替レート（JPY/USD） | **ローカルのみ** | ローカルURL観察 | **PENDING** | **L0** | **議論（自動取得 or 手動設定）** |
| **apiInputPrice** | API入力単価（$/1M Token） | **ローカルのみ** | ローカルURL観察 | **PENDING** | **L0** | **議論（自動取得 or 手動設定）** |

### 開発専用設定（ローカルのみ存在）

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **apiKey** | GEMINI_API_KEY | **ローカルの み** | ローカルURL観察 | **PENDING** | **L0** | **本番環境では削除** |
| **debugMode** | デバッグモード | **ローカルのみ** | ローカルURL観察 | **廃止** | **L0** | **削除（本番では無効化すべき）** |

---

# 4. その他ドメイン

## Screen C（資料回収状況）

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **monthlyStatus（24ヶ月）** | 月別回収状態（2025/1〜2026/12） | 両方 | ScreenC template L299-306 | **確定** | **L2, L3** | Freeze |
| **banks** | 銀行口座配列 | 両方 | ScreenC template L60-80 | **確定** | **L1** | Freeze |
| **creditCards** | クレジットカード配列 | 両方 | ScreenC template L94-114 | **確定** | **L1** | Freeze |
| **materialStatuses** | その他資料（年末調整対応等） | 両方 | ScreenC template L128-142 | **確定** | **L2** | Freeze |
| **c_config** | クイック設定（cash/payroll/social/invoice監視） | 両方 | ScreenC template L212-240 | **確定** | **L3** | Freeze |

## Screen D（AIルール）

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **priority** | ルール優先度（数値） | 両方 | useAIRules composable | **確定** | **L2** | Freeze |
| **condition** | 適用条件（摘要キーワード等） | 両方 | useAIRules composable | **確定** | **L2** | Freeze |
| **result** | 推論結果（勘定科目、税区分） | 両方 | useAIRules composable | **確定** | **L2** | Freeze |
| **status** | ルール状態（active/draft） | 両方 | useAIRules composable | **確定** | **L3** | Freeze |
| **usageCount** | 適用回数（業務実績） | 両方 | 公開URL観察 | **確定** | **L1** | Freeze |

## Screen G（データ変換）

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **clientName** | 顧問先名 | 両方 | ScreenG template L31 | **確定** | **L1** | Freeze |
| **sourceSoftware** | 移行前の会計ソフト名 | 両方 | ScreenG template L37 | **確定** | **L1** | Freeze |
| **targetSoftware** | 移行先（Yayoi/MF/Freee） | 両方 | ScreenG template L46-48 | **確定** | **L1** | Freeze |
| **logs** | 変換履歴（ConversionLogUi型配列） | 両方 | ConversionLogUi L308-338 | **確定** | **L1** | Freeze |

## Screen H（タスクダッシュボード）

| Property | 意味 | 現状 | 出典 | 議論結果 | レイヤー | 対応アクション |
|----------|------|------|------|----------|----------|----------------|
| **missingCount** | 未回収件数 | 両方 | ScreenH template L31-45 | **確定** | **L1** | Freeze |
| **alertCount** | 要確認リスク件数 | 両方 | ScreenH template L47-62 | **確定** | **L1** | Freeze |
| **draftCount** | 作業待ち件数 | 両方 | ScreenH template L65-79 | **確定** | **L1** | Freeze |
| **approvalCount** | 承認待ち件数 | 両方 | ScreenH template L82-96 | **確定** | **L1** | Freeze |
| **exportCount** | 出力待ち件数 | 両方 | ScreenH template L99-113 | **確定** | **L1** | Freeze |
| **filingCount** | 移動待ち件数 | 両方 | ScreenH template L116-128 | **確定** | **L1** | Freeze |
| **learningCount** | 学習候補件数 | 両方 | ScreenH template L131-143 | **確定** | **L1** | Freeze |
| **reconcileCount** | 消込未完了件数 | 両方 | ScreenH template L146-160 | **確定** | **L1** | Freeze |

---

# Phase 2 アクション優先順位

## 1. Admin/System ドメインの統合【最優先】

**理由**: 公開とローカルで最大の不整合が存在。

### 即時議論が必要なプロパティ

| Property | 理由 |
|----------|------|
| **phase1_aiProvider** | L0（運用ポリシー）レベル。公開のみ存在。ローカルに統合が必要。 |
| **phase1_processingMode** | 同上。 |
| **phase2_aiProvider** | 同上。 |
| **phase2_processingMode** | 同上。 |
| **gcsBucketInput** | ストレージ統合の根幹。公開のみ存在。 |
| **gcsBucketOutput** | 同上。 |
| **jobRegistrationInterval** | ローカルのみ存在。本番環境で必要か議論。 |
| **jobExecutionInterval** | 同上。 |
| **exchangeRate** | コスト計算に影響。API自動取得 or 手動設定を決定。 |
| **apiInputPrice** | 同上。 |
| **apiKey** | 本番環境では環境変数に移行すべき。 |
| **debugMode** | 本番環境では削除すべき。 |

---

## 2. Client ドメインのPENDING項目【中優先】

**理由**: 税務設定・Drive連携は業務判断に直結。

### 議論が必要なプロパティ

| Property | 理由 |
|----------|------|
| **担당者Id** | 韓国語プロパティ。削除 or rename（英語化）を決定。 |
| **staffName** | 型のみ存在。UI反映の必要性を議論。 |
| **type** | 法人/個人。税務処理に影響。UI反映＋L2ロジック確認が必要。 |
| **contact.type / contact.value** | 連絡先。業務コミュニケーションに使用。UI反映を議論。 |
| **driveLinked** | Drive連携状態。UI反映を議論。 |
| **driveLinks.*** | Drive各種フォルダリンク。UI反映を議論。 |
| **processingFolderId / archivedFolderId** | 各種フォルダID。UI反映を議論。 |
| **defaultTaxRate** | デフォルト税率。UI反映 + 計算ロジック確認。 |
| **taxMethod / taxCalculationMethod** | 税区分・計算方式。UI反映 + 計算ロジック確認。 |
| **isInvoiceRegistered / invoiceRegistrationNumber** | インボイス登録。UI反映 + L2判定ロジック追加。 |
| **roundingSettings** | 端数処理。UI反映 + 計算ロジック確認。 |
| **consumptionTaxMode / simplifiedTaxCategory / taxFilingType** | 消費税設定。UI反映 + L2判定ロジック追加。 |

---

## 3. Job ドメイン【後回し】

**理由**: ほぼすべてのプロパティが「確定」。State MachineとSemantic Guardの実装のみが残タスク。

### 残タスク

- [ ] Job State Machine実装（L3）
- [ ] Job Semantic Guard実装（L2）
  - 貸借一致検証
  - AI信頼度閾値検証（0.8）
  - 計算ロジック検証（totalAmount）

---

# Freeze可能範囲とPENDING項目の可視化

## ✅ Freeze可能（即座に実装可）

### Client ドメイン
- 基本識別情報（id, clientCode, companyName, repName, fiscalMonth）
- 業務状態・契約情報（status, active, contractDate, createdAt, updatedAt）
- 主要Drive連携（sharedFolderId）
- 会計ソフト（accountingSoftware）
- UI補助プロパティ（searchQuery, totalCount）

### Job ドメイン
- ほぼすべてのプロパティ（80+ properties）
- State MachineとSemantic Guardの実装のみが残タスク

### その他ドメイン（C, D, G, H）
- すべてのプロパティが確定

---

## ⚠️ PENDING（議論が必要）

### 最優先（Admin/System）
- Phase分離設定（phase1_aiProvider, phase1_processingMode等）
- GCS Bucket設定（gcsBucketInput, gcsBucketOutput）
- ジョブ間隔設定（jobRegistrationInterval, jobExecutionInterval）
- コスト計算設定（exchangeRate, apiInputPrice）
- 開発専用設定（apiKey, debugMode）

### 中優先（Client）
- 担当者Id（削除 or rename）
- 税務設定（defaultTaxRate, taxMethod, isInvoiceRegistered等）
- Drive連携詳細（driveLinks.*, processingFolderId等）
- 連絡先・担当者（staffName, type, contact.*）

---

## 🚫 廃止候補

- **담당자Id**: 韓国語プロパティ。削除 or rename（英語化）を議論。
- **debugMode**: 本番環境では削除すべき。

---

# 次のステップ

1. **Implementation Plan作成**: Admin/System PENDINGプロパティの統合計画
2. **User Review**: このマップをユーザーに提示し、PENDING項目の判断を依頼
3. **Full Freeze判定**: 議論完了後、Freeze可能範囲を確定
4. **実装**: Freeze済みプロパティのState Machine/Semantic Guard実装

---

**作成日**: 2026-01-17  
**ステータス**: Phase 2 マッピング完了  
**次ステップ**: User Review（PENDING項目の判断依頼）
