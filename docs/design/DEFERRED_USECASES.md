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

## NormalizeAccountCode（科目コード正規化）

### 削除判断の経緯

**削除日:** 2026-01-12  
**Phase:** 4.5（UseCase Schema確立）

### 削除理由

1. **既存実装が存在しない**
   - 現コードにロジックなし
   - 呼び出し元なし
   - テストなし
   - Reality Layer（現実層）に存在しない

2. **古い設計書ベース & GAS前提**
   - 出典: 旧GAS設計書（データクレンジング定義）
   - 技術前提が崩壊（GAS → Zod / Hono / 型集約）
   - 当時の制約条件（CSV精度・文字コード問題）が変化
   - 歴史的資料であって、契約ではない

3. **Phase 4.5の原則に合わない**
   - 「どこまで正規化するか」= 判断を含む
     - 全角→半角？
     - ハイフン除去？
     - コード体系の統一？
   - 仕様が存在しない = 判断の塊

4. **代替が存在する**
   - バリデーションで弾く
   - ImportJournalCSV内部で局所対応
   - 将来 Phase 6で必要になったら作れる

### 正しい扱い

#### ❌ やってはいけないこと
- usecase_schemas.tsに残す
- TODOコメントで居座らせる
- 「いつか使うかも」で箱を作る

#### ✅ やったこと
- Phase 4.5から完全削除
- 設計履歴として記録（本ファイル）

### 再検討条件

将来、以下の実害が出た場合に再検討:

1. **CSV取込で実害が発生**
   - 科目コード不整合による取込エラー多発
   - 全角/半角混在による照合失敗

2. **マスタ照合で失敗が多発**
   - ユーザー入力と科目マスタの不一致
   - 検索精度の低下

3. **Phase 6以降で具体的な要求**
   - UIで正規化機能が必要
   - 既存実装を観測済み
   - Input/Outputが確定

### 補足: これは思想の否定ではない

**削除の意味:**
- ❌「昔の設計は間違いだった」
- ✅「今のフェーズの契約空間に置くべきではない」

**削除が正解である理由:**
- 「嘘の箱を作らない」という健全な判断
- 必要になった瞬間に、正しい形で作れる

---

## FormatDateString（日付文字列形式変換）

### 削除判断の経緯

**削除日:** 2026-01-12  
**Phase:** 4.5（UseCase Schema確立）

### 削除理由

1. **既存実装が存在する**
   - `AIRulesMapper.formatDate()` (L12-24)
   - 機能: Firestore Timestamp/Date → ISO形式（`YYYY-MM-DD`）
   - 十分に機能している

2. **GAS時代の遺物**
   - 出典: 旧GAS設計書（日付標準化処理）
   - 当時の問題: 領収書OCRで和暦・西暦混在
   - 現在: Vision AI → 構造化データ直接取得
   - 日付文字列の手動正規化は不要

3. **必要な機能レベル = Phase 4.5不適**
   - ユーザー回答: 「C（複雑：和暦、自動判定含む）」
   - 和暦変換（令和6年 → 2024） = 判断を含む
   - 自動判定（01/15/2024 → 月/日？日/月？） = 判断を含む
   - ゼロパディング・形式推論 = 判断を含む

4. **JavaScript標準で代替可能**
   ```javascript
   new Date('2024-01-15').toISOString().split('T')[0]  // ISO形式
   new Date('2024-01-15').toLocaleDateString('ja-JP')  // 日本語形式
   ```

### 既存実装の詳細

**場所:**
- `src/composables/AIRulesMapper.ts` L12-24

**機能:**
```typescript
const formatDate = (ts: unknown): string | undefined => {
  // Firestore Timestamp → ISO形式
  if (ts && typeof (ts as any).toDate === 'function') {
    return (ts as any).toDate().toISOString().split('T')[0];
  }
  // raw seconds object → ISO形式
  if (ts && typeof ts === 'object' && 'seconds' in ts) {
    return new Date((ts as any).seconds * 1000).toISOString().split('T')[0];
  }
  return undefined;
};
```

**使用箇所:**
- AIRulesMapper（AI学習ルールの日付整形）

### 正しい扱い

#### ❌ やってはいけないこと
- usecase_schemas.tsに新規UseCase追加
- 既存実装を無視して別実装を作る
- 「いつか必要かも」で箱を作る

#### ✅ やったこと
- Phase 4.5から完全削除
- 既存実装の活用を推奨
- 設計履歴として記録（本ファイル）

### 再検討条件

将来、以下の要求が出た場合に再検討:

1. **和暦・西暦相互変換が必要**
   - OCR精度向上で和暦混在が再発
   - 帳票出力で和暦表示が必須

2. **多様な形式の統一変換が必要**
   - 会計ソフトごとに異なる日付形式
   - CSV取込で形式不統一による実害

3. **Phase 6以降で具体的な要求**
   - UIで日付形式変換機能が必要
   - 既存実装を拡張する必要性
   - Input/Outputが確定

### 補足: これは思想の否定ではない

**削除の意味:**
- ❌「昔の設計は間違いだった」
- ✅「既存実装があり、Phase 4.5で新規作成する必然性がない」

**削除が正解である理由:**
- 既存実装を活用すべき（DRY原則）
- Phase 4.5は「判断しない純変換」に集中
- 必要になったら既存実装を拡張できる

---

## 更新履歴

- 2026-01-12: DetectBank削除、CalculateTotalAmount見送り記録
- 2026-01-12: NormalizeAccountCode削除記録追加
- 2026-01-12: FormatDateString削除記録追加
