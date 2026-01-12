# 見送りUseCase一覧

Phase 4.5で定義を見送ったUseCaseの記録。

---

## DetectBank（銀行名自動検知）

### 削除判断の経緯

**削除日:** 2026-01-12  
**Phase:** 4.5（UseCase Schema確立）

### 削除理由

1. **判断を含む**
   - `confidence: number` - AI/ルールの信頼度
   - `reasons: string[]` - 判定過程の説明
   - `alternatives: BankCandidate[]` - 複数候補
   - `detectedBankId?: string` - optional = 不確実性
   
   → これらは全て「世界をどう解釈するか」の判断を含む

2. **既存実装との不整合**
   - 作成したスキーマ: `rawText` → `detectedBankId`
   - 既存実装（useBankLogic.ts）:
     ```typescript
     identifyBank(
       aiAnalysisResult: string,
       currentBalance: number | null,
       lastMonthBalances: Record<string, number>
     ): { 
       bankName: string | null;
       confidence: number;
       detectionMethod: 'fingerprint' | 'balance' | null 
     }
     ```
   - 全く異なる構造（机上の空論）

3. **Phase 4.5の原則違反**
   - optional = 0 → 違反（4個のoptional）
   - 判断なし（純変換） → 違反（AI判定含む）
   - 実装観測済み → 未実施

### 正しい扱い

#### ❌ やってはいけないこと
- コード内にTODOコメントを残す
- 「見送り」としてスキーマを残す
- optional付きで存在させる

#### ✅ やったこと
- usecase_schemas.ts から完全削除
- 設計ログ（本ファイル）に履歴を記録
- Gitコミットメッセージに理由を記載

### 再開条件（Phase 4.6以降）

DetectBankを再定義する際の最低条件:

1. **既存実装の観測完了**
   - `useBankLogic.ts` の動作確認
   - 実際の入力データ確認
   - 実際の出力データ確認

2. **判断の分解**
   - DetectBank（純判定のみ）
   - ExplainBankDetection（説明生成）
   - RankBankCandidates（候補順位付け）
   - 別UseCaseに分離

3. **Phase 4.6以降で実施**
   - Phase 4.5: 判断を含むUseCaseは作らない
   - Phase 5: 実装を観測しながら分解
   - Phase 4.6+: 観測完了後に定義

---

## 「判断を含む」の定義

以下のいずれかが含まれる場合、そのUseCaseは「判断を含む」:

### 1. 複数の正解候補
```typescript
alternatives: Candidate[]
```
→ 「どれが正しいか」を選ぶ必要がある

### 2. 確率・信頼度
```typescript
confidence: number (0.0-1.0)
```
→ モデル・ルール・閾値に依存

### 3. 理由・説明
```typescript
reasons: string[]
```
→ 判断過程そのもの

### 4. 推論・ヒューリスティック
```typescript
detectedValue?: T  // optional
```
→ 不確実性を含む

---

## Phase別ルール

| Phase | 判断を含むUseCase | 扱い |
|-------|------------------|------|
| Phase 4 | ❌ 作らない | Domain Schemaのみ |
| Phase 4.5 | ❌ 存在させない | 純変換のみ |
| Phase 5 | △ 観測しながら分解 | UI検証フェーズ |
| Phase 4.6+ | ✅ 作ってよい | 観測完了後 |

---

## CalculateTotalAmount（合計金額計算）

### 見送り判断の経緯

**見送り日:** 2026-01-12  
**Phase:** 4.5（UseCase Schema確立）

### 見送り理由

1. **派生値の再計算**
   - 一次真実: `JournalLine[].drAmount / crAmount`
   - `totalAmount` = `Math.max(drTotal, crTotal)` （計算結果）
   - Phase 4.5は「純変換」のみ、「再計算」は範囲外

2. **型での扱い**
   - `JournalEntry.totalAmount`: 必須（UI表示用）
   - `Job.totalAmount`: optional（派生値）
   - 一次真実ではない

### 代替案

必要であれば以下のUseCaseに分解:

- `ValidateJournalBalance`: 貸借一致確認（検証のみ）
- `SumJournalLines`: JournalLine[]の集計（純計算）
- `CalculateJobAmount`: UI表示用の代表金額（派生値生成）

### 再開条件

Phase 5以降で「UI表示用の派生値生成」として再定義可能。

---

## 設計原則（持ち帰り用）

### 判断を含む箱の危険性

判断を含む箱を先に作ると:

1. 実装前に思想が固定される
2. 既存実装と照合されていない思想
3. スキーマが「嘘」になる
4. 他の設計を誤誘導する

### 箱の純度を見抜く基準

**判断しない箱（Phase 4.5 OK）:**
- 入力が決まれば出力が一意
- 実装方法が変わっても契約は変わらない
- 人・AI・ルールの違いが結果に影響しない

**判断を含む箱（Phase 4.5 NG）:**
- 上記の「判断を含む」定義に該当
- 不確実性を含む（optional多用）
- モデル・推論に依存

---

## 更新履歴

- 2026-01-12: DetectBank削除、CalculateTotalAmount見送り記録
