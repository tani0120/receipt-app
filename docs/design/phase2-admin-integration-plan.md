# Phase 2: Admin/System設定統合 - Implementation Plan

**作成日**: 2026-01-17  
**最終更新**: 2026-01-17  
**ステータス**: Planning  
**関連**: property-integration-map.md, complete-property-checklist.md

---

## 問題の概要

property-integration-map.mdで以下が判明：

1. **Admin/System ドメイン**: 公開とローカルで最大の不整合
   - 公開のみ: Phase分離設定、GCS Bucket設定
   - ローカルのみ: ジョブ間隔設定、コスト計算設定、デバッグモード
   - これらはL0（運用ポリシー）レベルのプロパティで、業務の根幹に影響

2. **Client ドメイン**: 税務設定が型定義のみ（UI未反映）
   - defaultTaxRate, taxMethod, isInvoiceRegistered等
   - UI反映 + L2 Semantic Guard実装が必要

3. **その他**: 韓国語プロパティ `담당자Id` の削除判断

---

## User Review Required

> [!IMPORTANT]
> **Admin/System設定の統合方針決定が必要**
> 
> 以下のプロパティについて、人間の判断が必要です：

### Admin/System設定（最優先）

| Property | 現状 | 質問 |
|----------|------|------|
| `phase1_aiProvider` | 公開のみ存在（Gemini API / Vertex AI選択） | ローカルに統合すべきか？ |
| `phase1_processingMode` | 公開のみ存在（通常 / Batch API選択） | ローカルに統合すべきか？ |
| `phase2_aiProvider` | 公開のみ存在 | ローカルに統合すべきか？ |
| `phase2_processingMode` | 公開のみ存在 | ローカルに統合すべきか？ |
| `gcsBucketInput` | 公開のみ存在（GCS Bucket Input） | ローカルに統合すべきか？ |
| `gcsBucketOutput` | 公開のみ存在（GCS Bucket Output） | ローカルに統合すべきか？ |
| `jobRegistrationInterval` | ローカルのみ存在（15分等） | 本番環境で必要か？ |
| `jobExecutionInterval` | ローカルのみ存在（5分等） | 本番環境で必要か？ |
| `exchangeRate` | ローカルのみ存在（為替レート） | API自動取得 or 手動設定？ |
| `apiInputPrice` | ローカルのみ存在（API単価） | API自動取得 or 手動設定？ |
| `apiKey` | ローカルのみ存在（GEMINI_API_KEY） | 環境変数に移行すべき（本番環境） |
| `debugMode` | ローカルのみ存在 | 削除すべき（本番環境では無効化） |

### Client税務設定（中優先）

| Property | 現状 | 質問 |
|----------|------|------|
| `defaultTaxRate` | 型のみ存在 | UI反映すべきか？ |
| `taxMethod` | 型のみ存在 | UI反映すべきか？ |
| `isInvoiceRegistered` | 型のみ存在 | UI反映すべきか？ |
| `invoiceRegistrationNumber` | 型のみ存在 | UI反映すべきか？ |
| `roundingSettings` | 型のみ存在（floor/round/ceil） | UI反映すべきか？ |
| `consumptionTaxMode` | 型のみ存在（general/simplified/exempt） | UI反映すべきか？ |
| `simplifiedTaxCategory` | 型のみ存在 | UI反映すべきか？ |
| `taxFilingType` | 型のみ存在 | UI反映すべきか？ |

### その他

| Property | 現状 | 質問 |
|----------|------|------|
| `담당자Id` | 韓国語プロパティ（ClientSchema L13/L26） | 削除 or rename（英語化）？ |

> [!WARNING]
> **実装前の判断が必要な理由**
> 
> - Admin/System設定は運用ポリシー（L0）レベル
> - 実装してからの変更はコストが高い
> - 人間の業務判断が必要

---

## Proposed Changes

### 1. Admin/System設定の統合（ユーザー判断後）

#### [MODIFY] [admin-settings.vue](file:///未確認)

**想定される変更**:
- 公開URL観察で確認したPhase分離UI（phase1_aiProvider等）をローカルに統合
- GCS Bucket設定UIを追加
- ジョブ間隔設定の本番環境での要否に応じて保持 or 削除
- デバッグモードUIを削除（本番環境では環境変数で制御）

---

### 2. Client税務設定のUI反映（ユーザー判断後）

#### [MODIFY] [ScreenA_Clients.vue](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/src/views/ScreenA_Clients.vue)

**想定される変更**:
- Edit Modalに税務設定フィールドを追加
  - defaultTaxRate（デフォルト税率）
  - taxMethod（税区分方式）
  - isInvoiceRegistered（インボイス登録）
  - roundingSettings（端数処理）
  - consumptionTaxMode（消費税区分）
  - etc.

---

### 3. Client Semantic Guard拡張（ユーザー判断後）

#### [MODIFY] [ClientSemanticGuard.ts](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/src/features/client/ClientSemanticGuard.ts)

**想定される変更**:
- 税務設定の業務ルール追加
  - isInvoiceRegistered = true の場合、invoiceRegistrationNumber必須
  - consumptionTaxMode = "simplified" の場合、simplifiedTaxCategory必須
  - etc.

---

### 4. 韓国語プロパティの削除 or rename

#### [MODIFY] [ClientSchema.ts](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/src/features/client/ClientSchema.ts)

**想定される変更**（ユーザー判断に応じて）:
- `담당자Id` を削除
- または `staffId` に rename

---

## Verification Plan

### Manual Verification

> [!CAUTION]
> **このPlanは実装を伴わない**
> 
> ユーザーの判断を仰ぐための計画書です。実装は判断後に行います。

1. **ユーザーレビュー**: property-integration-map.mdとこのImplementation Planを確認
2. **PENDING項目の判断**: 上記の質問に回答
3. **Full Freeze判定**: 判断完了後、Freeze可能範囲を確定
4. **Phase 2実装**: 判断に基づき、Admin/System設定統合とClient税務設定UI反映を実装

---

## 推奨アクション

**今回は実装せず、ユーザーの判断を待つべき理由**:

1. **Admin/System設定は運用ポリシー（L0）レベル**
   - 公開環境の設計思想を理解せずに統合すると、運用が壊れる可能性
   - Phase分離の意図（Phase 1/2で異なるAI Provider使用など）が不明

2. **Client税務設定は計算ロジックに直結**
   - UI反映だけでなく、L2 Semantic Guardの業務ルール実装が必要
   - 税務処理の正確性は業務の根幹

3. **韓国語プロパティの扱い**
   - 国際化対応の方針が不明
   - 単純削除すると、既存データが壊れる可能性

---

**作成日**: 2026-01-17  
**ステータス**: User Review待ち  
**次ステップ**: ユーザーにPENDING項目の判断を依頼
