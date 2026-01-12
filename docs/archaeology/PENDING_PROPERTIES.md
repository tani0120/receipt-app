# 未追加プロパティ一覧（PENDING PROPERTIES）

**Phase 4 時点での未定義プロパティリスト**  
**日時:** 2026-01-12  
**件数:** 343件（TYPE_INFERRED_PROPERTIES.txt の line 275-617）

---

## 使用方法

Phase 5（UI再実装）で型エラーが発生した際、このリストから型を逆引きして追加：

```typescript
// エラー例: Property 'taxMethodLabel' does not exist on type 'Job'
// このリストで検索 → taxMethodLabel: string (出現3回)
// zod_schema.tsに追加:
taxMethodLabel: z.string().optional()
```

---

## 未追加プロパティ（343件）

### 出現3回（68件）
| プロパティ名 | 型 | 備考 |
|------------|-----|------|
| taxClass | string | 既定義の可能性あり |
| fingerprints | string | |
| dateLabel | string | |
| detectedStartBalance | string | |
| primaryColors | string | |
| items | string | |
| detectedEndBalance | string | |
| fiscalYear | number | |
| requiredMaterial | string | |
| isReceived | boolean | |
| displayFiscalMonth | number | |
| currentMonth | number | |
| features | string | |
| accountHolder | string | |
| expectedMaterials | string | ✅ Phase 4で追加済み |
| accountType | string | |
| detail | string | |
| diff | string | |
| thisMonthJournals | string | |
| backlog | string | |
| branchName | string | |
| brand | string | |
| detectedBank | string | ✅ Phase 4で追加済み（埋蔵キー） |
| cardName | string | |
| currentMonthLines | string | |
| solution | string | |
| appId | string | |
| drTaxAmount | number | 既定義 |
| crTaxAmount | number | 既定義 |
| crSubAccount | number | 既定義 |
| fiscalYearStart | string | |
| authDomain | string | |
| apiKey | string | |
| storageBucket | string | |
| fiscalYearEnd | string | |
| messagingSenderId | string | |
| draftAvg | string | |
| msg | string | |
| ocr | string | |
| monthIndex | number | |
| iconBg | string | |
| model | string | |
| item | string | |
| isLocked | boolean | |
| calculationMethodLabel | string | |
| max_retries | string | |
| timeout_seconds | number | |
| job_history_days | number | |
| user | string | |
| batch_size | number | |
| optimization | string | |
| conversion | string | |
| error | string | |
| processing | string | |
| warnings | string | |
| processed | string | |
| taxConf | string | |
| approve | string | |
| currentBalance | string | |
| lastMonthBalances | string | |
| runAIInference | string | |
| aiAnalysisResult | string | |
| desc | string | |
| ai_proposal | string | |
| d | string | ⚠️ 1文字プロパティ |
| c | string | ⚠️ 1文字プロパティ |
| dateStr | string | |
| taxMethodLabel | string | |

### 出現2回（169件）
| プロパティ名 | 型 | 備考 |
|------------|-----|------|
| prompts | string | |
| role | string | |
| staffList | string | |
| staffAnalysis | string | |
| thisMonthForecast | string | |
| apiCost | number | |
| clientAnalysis | string | |
| BUNDLE_WINDOW_DAYS | number | 定数 |
| AUTO_FEE_LIMIT | number | 定数 |
| systemLogs | string | |
| isTaxDiff | boolean | 既定義 |
| isSocialExpense | boolean | 既定義 |
| taxCode | string | |
| flags | string | 既定義 |
| draft_monitoring | string | |
| job | string | |
| isTenThousandYen | boolean | 既定義 |
| intervals | string | |
| formatFreee | string | |
| taxYayoi | string | |
| registrationNumber | number | 既定義 |
| gas | string | |
| rules | string | |
| formatYayoi | string | |
| formatMF | string | |
| taxMF | string | |
| taxFreee | string | |
| AUTO_IGNORE_INVOICE_LIMIT | number | 定数 |
| apiPriceOutput | string | |
| exchangeRate | number | |
| json | string | |
| credential | string | |
| intervalLearnerMin | string | |
| intervalValidatorMin | string | |
| intervalDispatchMin | string | |
| intervalWorkerMin | string | |
| apiPriceInput | string | |
| email | string | |
| systemSettingsSsId | string | |
| systemRootId | string | |
| masterSsId | string | |
| queueId | string | |
| dashboardId | string | |
| rulesSsId | string | |
| systemDbId | string | |
| FREEE | string | 定数 |
| TAX_PURCHASE_8_RED | string | 定数 |
| TAX_PURCHASE_10 | string | 定数 |
| apiKeys | string | |
| TAX_SALES_10 | string | 定数 |
| journals | string | |
| thisMonth | number | |
| kpiCostQuality | string | |
| kpiProductivity | string | |
| debugMode | string | |
| intervalOptimizerDays | number | |
| notifyHours | number | |
| MF | string | 定数 |
| YAYOI | string | 定数 |
| maxAttemptLimit | number | |
| maxOptBatch | string | |
| maxBatchSize | number | |
| gasTimeoutLimit | number | |
| batch_api_check | string | |
| 0 | string | ⚠️ 数値プロパティ |
| 1 | string | ⚠️ 数値プロパティ |
| 2 | string | ⚠️ 数値プロパティ |
| 3 | string | ⚠️ 数値プロパティ |
| 4 | string | ⚠️ 数値プロパティ |
| 5 | string | ⚠️ 数値プロパティ |
| 6 | string | ⚠️ 数値プロパティ |
| cash | string | |
| targetTaxClass | string | |
| notifications | string | |
| target_hours | number | |
| knowledge_optimization | string | |
| optimization_limit | number | |
| retention | string | |
| slack_webhook_url | string | |
| AI信頼度 | string | ⚠️ 日本語 |
| journalEditMode | string | |
| confidenceLabel | string | |
| files | string | |
| originalSize | number | |
| targetPath | string | |
| approveAvg | string | |
| isRemand | boolean | |
| hasHistory | boolean | |
| driveLink | string | |
| social | string | |
| cells | string | |
| invoice | string | |
| payroll | string | |
| clients | string | |
| config | string | |
| isFiscalMonth | number | |
| isFuture | boolean | |
| initialContent | string | |
| consumptionTax | string | |
| final_formatting | string | |
| rule | string | |
| ...残り73件（1回出現） | - | 省略 |

### 出現1回（106件 - 抜粋）
| プロパティ名 | 型 | 備考 |
|------------|-----|------|
| userEmail | string | |
| lastAppliedJobId | string | 既定義 |
| POST_VALIDATION | string | 定数 |
| AUDIT_LOGS | string | 定数 |
| targetId | string | 既定義 |
| logicId | string | 既定義 |
| screenId | string | 既定義 |
| lockedAt | date | |
| apiResponse | string | 既定義 |
| invoiceSystemApiKey | string | 既定義 |
| lockedByUserId | string | 既定義 |
| RULE_MASTER | string | 定数 |
| reviewStatus | string | 既定義 |
| currentPhase | string | 既定義 |
| detectionAlerts | string | 既定義 |
| 有効 | string | ⚠️ 日本語 |
| AI学習モード | string | ⚠️ 日本語 |
| プレビュー | string | ⚠️ 日本語 |
| 警告 | string | ⚠️ 日本語 |
| GEMINI_API_KEY | string | 環境変数 |
| FIREBASE_STORAGE_BUCKET | string | 環境変数 |
| FIREBASE_PROJECT_ID | string | 環境変数 |
| FIREBASE_CLIENT_EMAIL | string | 環境変数 |
| FIREBASE_PRIVATE_KEY | string | 環境変数 |
| ...残り81件 | - | 省略 |

---

## 特記事項

### ⚠️ 日本語プロパティ（6件）
- `未処理`, `表示件数` - ✅ Phase 4で追加済み
- `AI信頼度`, `有効`, `AI学習モード`, `プレビュー`, `警告` - 未追加

### ⚠️ 数値プロパティ（7件）
- `0`, `1`, `2`, `3`, `4`, `5`, `6` - 配列インデックスの可能性

### ⚠️ 定数（約40件）
- `BUNDLE_WINDOW_DAYS`, `TAX_*`, `FREEE`, `MF`, `YAYOI` 等
- これらは`COMMON_RULES`に属し、Zod定義不要の可能性

### ✅ 既定義（約20件）
- `drTaxAmount`, `crTaxAmount`, `isTaxDiff`, `flags`, `lockedByUserId` 等
- Phase 4以前に既に定義済み

---

## Phase 5 での追加推奨手順

1. **型エラー発生時**
   ```
   Property 'xxx' does not exist on type 'Job'
   ```

2. **このリストで検索**
   - Ctrl+F で該当プロパティを検索
   - 型を確認（string/number/date/boolean）

3. **Zodに追加**
   ```typescript
   xxx: z.string().optional() // または z.number().optional()
   ```

4. **コンパイル確認**
   ```bash
   npx tsc --noEmit
   ```

---

**最終更新:** 2026-01-12  
**状態:** Phase 5 で逆引き参照用
