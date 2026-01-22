# ADR-010: AI API移行戦略（Gemini API → Vertex AI）

**Status**: Accepted  
**Date**: 2026-01-22  
**Owner**: 司令官  
**関連**: UC-186, SYSTEM_PHILOSOPHY.md, ADR-009

---

## 重要な結論（最初に読むこと）

### テスト環境（開発段階・今）

| 項目 | 使用するもの |
|------|------------|
| **AI API** | Gemini API（ブラウザから直接） |
| **Firebase** | Spark Plan（無料版） |
| **コスト** | 0円 |
| **データ** | テストデータのみ（実データ禁止） |

### 本番環境（運用開始後・将来）

| 項目 | 使用するもの |
|------|------------|
| **AI API** | Vertex AI（Cloud Functions経由） |
| **Firebase** | **Blaze Plan（有料版）必須** |
| **コスト** | 約$12/月（約1,800円） |
| **データ** | 顧問先の実データ |

---

## なぜ2つの環境が必要か

### UC-186の結論

**usecase-workbook.md（3243行目）**:
```
「守秘義務・ファインチューニング・MLOps・IAMの観点からVertex AI一択」
```

### 問題

- Vertex AIは**Cloud Functions必須**
- Cloud Functionsは**Blaze Plan（有料版）必須**
- Blaze Planは**開発段階では不要なコスト**

### 解決策

**開発段階はGemini API（無料）、本番環境でVertex AIに移行**

---

## 詳細ドキュメント

本ADRの詳細は以下のファイルに分割して記載：

1. [ADR-010-Part1: 環境比較](./ADR-010-Part1-environment-comparison.md)
   - テスト環境の詳細
   - 本番環境の詳細
   - アーキテクチャ図

2. [ADR-010-Part2: 実装手順](./ADR-010-Part2-implementation.md)
   - 抽象化層の実装
   - ファイル構成
   - コード例

3. [ADR-010-Part3: 移行チェックリスト](./ADR-010-Part3-checklist.md)
   - Phase 1: 準備（今すぐ）
   - Phase 2: 本番移行（MVP完成後）
   - 完全なチェックリスト

4. [ADR-010-Part4: コストとセキュリティ](./ADR-010-Part4-cost-security.md)
   - コスト詳細
   - セキュリティ対策
   - トラブルシューティング

---

## 今すぐやること

1. ✅ ADR-010-Part1を読む（環境理解）
2. ✅ ADR-010-Part2を読む（実装方法理解）
3. ✅ ADR-010-Part3のPhase 1実施（2-3時間）

---

## 変更履歴

| 日付 | 変更内容 | 変更者 |
|------|---------|--------|
| 2026-01-22 | 初版作成（4部構成） | 司令官 + AI |
