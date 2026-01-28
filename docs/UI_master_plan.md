<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- CRITICAL: AI TYPE SAFETY RULES - MUST FOLLOW WITHOUT EXCEPTION             -->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- 
【型安全性ルール - AI必須遵守事項】

## ❌ 禁止事項（6項目）- NEVER DO THESE:
1. Partial<T> + フォールバック値 (client.name || 'XXX') - TYPE CONTRACT DESTRUCTION
2. any型（実装済み機能） - TYPE SYSTEM ABANDONMENT
3. status フィールドの無視 - AUDIT TRAIL DESTRUCTION
4. Zodスキーマでのany型 (z.any()) - SCHEMA LEVEL TYPE ABANDONMENT
5. 型定義ファイルでのany型 (interface { field: any }) - INTERFACE LEVEL DESTRUCTION
6. 型定義の二重管理（新旧スキーマ混在） - TYPE DEFINITION CONFLICT

## ✅ 許可事項（3項目）- ALLOWED:
1. 将来のフェーズ未実装機能でのeslint-disable + throw new Error()
2. unknown型の使用（型ガードと組み合わせて）
3. 必要最小限の型定義（Pick<T>, Omit<T>等）

## 📋 類型分類（9種）:
| 類型 | 今すぐ修正 | 将来Phase | 修正不要 |
|------|-----------|----------|---------|
| 1. Partial+フォールバック | ✅ | - | - |
| 2. any型（実装済み） | ✅ | - | - |
| 3. status未使用 | ✅ | - | - |
| 4. eslint-disable | - | - | ✅ |
| 5. Zod.strict()偽装 | ※1+2 | - | - |
| 6. Zodスキーマany型 | ✅ | - | - |
| 7. 型定義any型 | ✅ | - | - |
| 8. 全体any型濫用 | - | ✅ | - |
| 9. 型定義不整合 | ✅ | - | - |

詳細: complete_evidence_no_cover_up.md
-->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->

# Phase 1実装計画（小さく開発）

**作成日**: 2026-01-22  
**最終更新**: 2026-01-24  
**目的**: Phase 1（テスト環境）の実装計画

**参照**: [TERMINOLOGY.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/TERMINOLOGY.md)

---

## Phase/Step/Milestoneの定義

### Phase（フェーズ）

**意味**: プロジェクト全体の大きな区切り  
**特徴**: 開発環境・技術スタックが変わる  
**例**: Phase 1（Gemini API、無料版）、Phase 2（Vertex AI、有料版）

### Milestone（マイルストーン）

**意味**: Phase内の価値提供単位  
**特徴**: ユーザーに見せられる機能の完成  
**例**: Milestone 1.1（OCR→仕訳表示）、Milestone 1.2（仕訳編集）

### Step（ステップ）

**意味**: Milestone内の作業手順  
**特徴**: 順序がある、所要時間: 数時間〜数日  
**例**: Step 1（スコープ決定）、Step 2（L1-3定義）

---

## プロジェクト状況

| 項目 | 内容 |
|------|------|
| **開発規模** | 個人開発（1名） |
| **認知負荷** | 1人で設計・実装・テスト |
| **価値提供** | 機能単位で段階的に提供 |
| **実装方針** | 言語化できている要件を最小限に |

---

## Phase 1（テスト環境）

### 環境

| 項目 | 内容 |
|------|------|
| **AI API** | Gemini API（無料版、同期処理） |
| **Firebase** | Spark Plan（無料版） |
| **アップロード** | 手動（Vue UI） |
| **コスト** | $0 |

### 実装する機能（3つ）

1. 領収書手動アップロード → AI仕訳 → CSV出力
2. 顧問先CRUD（既存Client L1-3活用）
3. スタッフCRUD（既存Staff L1-3活用）

### 実装しない機能（Phase 2に延期）

- Google Drive自動監視（GAS）
- Vertex AI Batch API
- 設定管理UI（デフォルト値使用）

---

## Milestone 1.1: OCR→仕訳表示（2-3日）

**目的**: 領収書をアップロードしてAI仕訳結果を表示

**価値**: すぐに動くものが見える

### Step 1: スコープ決定（完了）

**所要時間**: 1-2時間  
**状態**: ✅ 完了

**成果物**:
- implementation_plan.md作成
- Phase 1/2の分割決定
- Milestone定義

---

### Step 2: L1-3定義（最小限）

**所要時間**: 2-3時間

**実施内容**:

#### L3（データ層）: スキーマ定義

```typescript
// src/features/journal/JournalEntrySchema.ts
export const JournalEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  description: z.string(),
  lines: z.array(z.object({
    accountCode: z.string(),
    debit: z.number().optional(),
    credit: z.number().optional(),
  })).min(2),
  status: z.enum(['draft', 'submitted']),
});
```

**最小限にする部分**:
- ❌ 日付フォーマット検証（後で）
- ❌ 状態遷移の詳細（'approved'は後で）
- ❌ 金額の詳細検証（後で）

#### L2（ロジック層）: 業務ルール

```typescript
// src/features/journal/JournalService.ts
export class JournalService {
  static validate(entry: unknown): JournalEntry {
    // 型チェックのみ
    const result = JournalEntrySchema.safeParse(entry);
    if (!result.success) {
      throw new Error('型エラー');
    }
    
    // 借方=貸方のみ
    if (!this.isBalanced(result.data.lines)) {
      throw new Error('貸借不一致');
    }
    
    return result.data;
  }
  
  private static isBalanced(lines: JournalLine[]): boolean {
    const debitTotal = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const creditTotal = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    return debitTotal === creditTotal;
  }
}
```

**最小限にする部分**:
- ❌ State Machine（switch文で十分）
- ❌ 詳細な業務ルール検証（日付、金額等）
- ❌ エラーメッセージの詳細化

#### L1（UI層）: Vueコンポーネント

```vue
<!-- src/components/ReceiptUpload.vue -->
<!-- 最小限の実装 -->
```

**成果物**:
- `src/features/journal/` ディレクトリ
- JournalEntrySchema.ts
- JournalService.ts
- types.ts

---

### Step 3: AI API実装

**所要時間**: 2-3時間

**実施内容**:

1. **Gemini API呼び出し**

```typescript
// src/services/ai/GeminiAPIService.ts
export class GeminiAPIService {
  async analyzeReceipt(imageData: string): Promise<JournalEntry> {
    const prompt = `
      領収書を分析して、以下のJSON形式で仕訳を返してください：
      ${JSON.stringify(JournalEntrySchema.shape)}
    `;
    
    const result = await this.callGeminiAPI(prompt, imageData);
    
    // L1で検証
    return JournalService.validate(result);
  }
}
```

2. **環境変数設定**

```env
VITE_USE_VERTEX_AI=false
VITE_GEMINI_API_KEY=...
```

**成果物**:
- `src/services/ai/` ディレクトリ
- GeminiAPIService.ts
- AIServiceInterface.ts
- createAIService.ts

**参照**: [ADR-010-Part3](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-Part3-checklist.md)

---

### Step 4: 仕訳表示UI（読み取り専用）

**所要時間**: 2-3時間

**実施内容**:

```vue
<!-- src/components/JournalEntryView.vue -->
<template>
  <div>
    <h2>仕訳結果</h2>
    <p>日付: {{ entry.date }}</p>
    <p>摘要: {{ entry.description }}</p>
    <table>
      <tr v-for="line in entry.lines">
        <td>{{ line.accountCode }}</td>
        <td>{{ line.debit || '-' }}</td>
        <td>{{ line.credit || '-' }}</td>
      </tr>
    </table>
  </div>
</template>
```

**最小限にする部分**:
- ❌ 編集機能（Milestone 1.2で）
- ❌ 複雑なUI（シンプルな表示のみ）

**成果物**:
- ReceiptUpload.vue
- JournalEntryView.vue

---

## Milestone 1.2: マスターデータ管理（2-3日）

**目的**: 顧問先・スタッフの登録・編集

**価値**: 実際の業務データを扱える

### Step 5: 顧問先CRUD

**所要時間**: 1日

**実施内容**:
- 既存Client L1-3を活用
- ClientList.vue（一覧）
- ClientForm.vue（登録・編集）
- ClientDetail.vue（詳細）

**成果物**:
- 顧問先CRUD画面

---

### Step 6: スタッフCRUD

**所要時間**: 1日

**実施内容**:
- 既存Staff L1-3を活用
- StaffList.vue（一覧）
- StaffForm.vue（登録・編集）
- StaffDetail.vue（詳細）

**成果物**:
- スタッフCRUD画面

---

## Milestone 1.3: 仕訳編集（2-3日）

**目的**: AI仕訳結果を編集・保存

**価値**: 手動修正が可能になる

### Step 7: 仕訳編集UI

**所要時間**: 2日

**実施内容**:
- JournalEntryForm.vue（編集可能版）
- 行の追加・削除
- L2検証（借方=貸方のみ）
- 保存機能

**成果物**:
- 仕訳編集画面

---

## Milestone 1.4: CSV出力（1-2日）

**目的**: MF/Freee/弥生形式でCSV出力

**価値**: 実際の会計システムに取り込める

### Step 8: CSV出力実装

**所要時間**: 1日

**実施内容**:
1. **CSV形式定義**
   - MF形式
   - Freee形式
   - 弥生形式

2. **変換ロジック**
   - JournalEntry → CSV

3. **Vue UI**
   - 形式選択
   - ダウンロード

**成果物**:
- CSVExport.vue
- CSVFormatter.ts

---

### Step 9: E2Eテスト

**所要時間**: 1日

**実施内容**:
1. **フロー検証**
   - 領収書アップロード → AI仕訳 → 編集 → CSV出力
   - 顧問先登録 → 領収書アップロード
   - スタッフ登録 → アクセス権限確認

2. **バグ修正**

**成果物**:
- Phase 1完成

---

## Phase 1スケジュール

| Milestone | 内容 | 所要時間 | 累積 |
|-----------|------|---------|------|
| **1.1** | OCR→仕訳表示 | 2-3日 | 2-3日 |
| **1.2** | マスターデータ管理 | 2-3日 | 4-6日 |
| **1.3** | 仕訳編集 | 2-3日 | 6-9日 |
| **1.4** | CSV出力 + E2Eテスト | 2日 | 8-11日 |

**合計所要時間**: 8-11日（稼働日）

---

## Phase 2（本番環境・将来）

### 環境

| 項目 | 内容 |
|------|------|
| **AI API** | Vertex AI（有料版、非同期処理） |
| **Firebase** | Blaze Plan（有料版） |
| **アップロード** | GAS自動監視（Google Drive） |
| **コスト** | 約$12/月 |

### 追加機能

1. **Google Drive自動監視**（2-3日）
   - GAS実装
   - 未処理の領収書を検知
   - ジョブ作成

2. **Vertex AI Batch API**（2-3日）
   - 非同期処理
   - コスト削減（50%）

3. **設定管理UI**（2-3日）
   - Admin画面
   - 間隔・パラメータ調整

4. **業務ルール完全版**（1週間）
   - State Machine完全版
   - 詳細な検証ルール
   - エラーハンドリング完全版

**合計所要時間**: 2-3週間

---

## 簡易版 vs 将来の拡張

### Phase 1（簡易版・最小限）

**実装する**:
- ✅ 型チェック（Zod）
- ✅ 借方=貸方検証のみ
- ✅ シンプルなUI
- ✅ 同期処理（Gemini API）

**実装しない**:
- ❌ State Machine
- ❌ 詳細な業務ルール検証
- ❌ GAS自動監視
- ❌ Batch API

---

### Phase 2（将来の拡張）

**追加する**:
- State Machine完全版
- 詳細な業務ルール（日付、金額、勘定科目等）
- エラーハンドリング完全版
- GAS自動監視
- Vertex AI Batch API
- 設定管理UI

---

## ADR-009との整合性

**準拠する部分**:
- ✅ L1/L2/L3のみ（L4/L5は永久に不採用）
- ✅ シンプルな3層構成
- ✅ Evidence ID、AllowedCallers不使用

**段階的実装の定義**:
- Phase 1: 最小限の機能で動く
- Phase 2: 業務ルール完全版

**参照**: [ADR-009](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-009-simple-architecture.md)

---

## 原則

### 人間が主、AIが従

**L1-3定義を先に実施**:
- 人間が必要とするデータ構造を先に決める
- AIはL1スキーマに従って出力を整形

**参照**: [UNRESOLVED_DISCUSSIONS.md #6](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/UNRESOLVED_DISCUSSIONS.md)

---

## 次のアクション

**次回セッション**:
- Step 2開始: L1-3定義（最小限、2-3時間）
