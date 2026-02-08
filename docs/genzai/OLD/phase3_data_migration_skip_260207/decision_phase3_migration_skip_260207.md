# Phase 3: データ移行スキップの決定

**決定日**: 2026-02-07  
**Phase**: Phase 3（データ移行調査）

---

## 決定内容

**Phase 3（データ移行）をスキップ**

---

## 決定理由

### 1. 移行対象データが存在しない

**調査結果**:
- Firestoreに`receipts`コレクションなし
- `firestoreRepository.ts`に`receipts`への参照なし
- Receipt型定義なし

**結論**: **移行すべきデータ = 0件**

---

### 2. 設計的に正しい状態

**Receiptドメイン**:
- データソース: Supabase専用
- Phase 1でテーブル作成済み
- 最初からSource of Truth

**Journalドメイン**（別ドメイン）:
- データソース: Firestore（`jobs`コレクション）
- receiptとは別の責務
- DDD原則を遵守

**結論**: ドメイン境界が正しく分離されている

---

### 3. 時間の節約

**不要な作業**:
- 存在しないデータの移行スクリプト作成
- テストデータ生成
- 移行検証

**効果**: Phase 4（Journal UI再設計）に集中可能

---

## 棄却した選択肢

### 選択肢A: Journalドメインの移行

**理由**:
- Firestoreの`jobs`コレクション（Journal Entry）をSupabaseに移行
- これは「receiptデータ移行」ではない
- 別ドメインの移行プロジェクト（Phase 3のスコープ外）

**判断**: 将来のPhaseで検討（Phase 4以降）

---

## 影響範囲

### 変更なし

- ✅ ReceiptドメインはSupabase専用（変更なし）
- ✅ Journalドメイン（Firestore）は継続使用
- ✅ UI設計に影響なし

---

## 完了条件の確認

### Phase 2で達成済み

- ✅ UIはFirestore構造を一切参照していない
- ✅ `receipt.status`がUIの唯一の判断軸
- ✅ ViewModelが完成形

---

## 次のアクション

1. Phase 3スキップを記録
2. Phase 4（Journal UI再設計）に進む
3. 将来、Journalドメイン移行が必要になった場合は別Phaseで計画

---

**Phase 3はスキップが最適な判断。**
