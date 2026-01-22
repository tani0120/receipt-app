# AI会計システム　システム哲学

**Version**: 2.0  
**Last Updated**: 2026-01-16  
**Status**: Active

---

## 📋 変更履歴（最近3回分）

### v2.1 (2026-01-16): 開発原則の追加

**変更箇所**:
- **Section 5**: 開発原則を新規追加
  - 5.1: 型安全の徹底（ADR-001）
  - 5.2: 段階的UI実装（ADR-002）

**変更理由**:
SYSTEM_PHILOSOPHY.mdにADR-001, ADR-002の原則を参照する必要があると判断。詳細な技術仕様は各ADRに記載されているが、哲学文書では原則のみを明記。

**議論の背景**:
ユーザーからの質問「ADR-001, ADR-002の概念は追記すべきか？」に対し、「原則のみ追記」と判断。

**哲学の進化**:
- 開発原則が明文化されていない → 型安全・段階的実装の原則を明記

**影響範囲**:
- なし（既存セクションに影響なし）

**関連**:
- [ADR-001-type-safe-mapping.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-001-type-safe-mapping.md)
- [ADR-002-gradual-ui-implementation.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-002-gradual-ui-implementation.md)

---

### v2.0 (2026-01-16): 人間承認・タスク化の概念を追加

**変更箇所**:
- Section 1: システム概要を全面改訂
- Section 1.2: 人間とAIの協働モデルを新規追加
- Section 1.1: Frontend役割にタスク化を追記

**変更理由**:
本日の議論で、「AIが全自動で処理」という誤解が判明。システムの本質は「AI×人間の協働」であり、人間の承認・タスク化・可視化が重要であると再定義。

**議論の背景**:
- ユーザーの指摘: 「人間の承認、それを補助、タスク化も同時に実行という概念が不足している」
- 問題: 従来の記述は「自動生成」のみで、人間の役割が曖昧
- 決定: システムの核心は「人間が最終判断を下す協働型」

**哲学の進化**:
- v1.0: AI単独での自動化を重視
- v2.0: 人間の承認・タスク化を核心に据える

**関連**:
- SESSION_20260115.md

---

### v1.0 (2025-12-27): 初版作成

**内容**: system_design.mdをベースに作成

---

## 1. システム概要

本システムは、顧問先の証憑（領収書・請求書等）をAIが解析し、**人間が承認**した仕訳データを会計ソフト（弥生会計、MFクラウド、freee等）に取り込む、**AI×人間協働の業務支援プラットフォーム**です。

### 1.1 アーキテクチャ構成

本システムは、以下の「3層構造 ＋ ハイブリッドDB」により構成されています。

*   **Frontend (Vue.js 3 + TypeScript)**
    *   **プレゼンテーション層**: 実務者が操作するUI
    *   **役割**: 
        - 処理すべき領収書を**タスクとして管理**
        - データの閲覧、修正、承認操作
        - 誰が、いつ、何を処理したかを記録（可視化）
        
*   **Backend / Batch (Google Apps Script - 計画)**
    *   **役割**: Google Drive上のファイル操作、定期的なAI解析バッチ、ファイル移動
    *   **注意**: 現行フェーズではVueアプリ内のMock/Service層でシミュレーション中
    
*   **Database (Hybrid)**
    *   **Firestore**: UI表示用の高速NoSQLデータベース。リアルタイム同期を担当
    *   **Google Spreadsheets/Drive**: 原本データの保管、およびGASバッチ処理の基盤

*   **認証層 (Firebase Authentication)**
    *   **役割**: ユーザー認証管理、Firestoreアクセス制御
    *   **開発環境**: テストユーザー自動ログイン（`admin@sugu-suru.com`）
    *   **本番環境**: ログインUIによるメール/パスワードまたはGoogle認証
    *   **セキュリティ**: Firestoreセキュリティルールで認証済みユーザーのみアクセス可能

---

### 1.2 人間とAIの協働モデル

#### **フロー**

```
1. AI解析 → 2. タスク化 → 3. 人間確認 → 4. 承認 → 5. 記録・可視化
```

#### **役割分担**

| 工程 | AI | 人間 |
|------|-----|------|
| **解析** | 領収書から仕訳を推論 | - |
| **タスク化** | 処理すべき項目をリスト化 | - |
| **確認** | - | AIの推論結果を確認 |
| **修正** | - | 誤りを修正 |
| **承認** | - | 最終判断を下す |
| **記録** | 処理履歴をusage_logsに保存 | - |
| **可視化** | ROI分析、5次元分析を提供 | 経営判断に活用 |

#### **重要な原則**

> **「AIは補助、人間が最終判断」**

- AIはあくまで「提案」を行う
- 人間が承認しない限り、データは確定しない
- タスク化により、未処理・処理済みが明確

---

## 2. 業務フローとフェーズ定義

設計書の「論理地図」に基づき、以下のフェーズで処理が進行します。

### Phase 1: 受領・前処理
*   **ファイル回収**: 顧問先共有フォルダからファイルを収集
*   **重複除外**: MD5ハッシュによる重複チェック（L-002）
*   **期間外判定**: 決算期に基づき当期以外のデータを隔離（L-003）
*   **【拡張】Phase 1.5**: 支払い方法判定（クレカ領収書等の特定ロジック）

### Phase 2〜5: AI解析・推論

*   **AIモデル**: Gemini 1.5 Flash (Vision) を採用（予定）
    * **テスト環境**: Gemini API（ブラウザ直接呼び出し）
    * **本番環境**: Vertex AI（Cloud Functions経由、守秘義務保証）
    * **詳細**: [ADR-010: AI API移行戦略](./ADR-010-ai-api-migration.md)
*   **知識注入 (RAG)**:
    *   **共通ルール**: 全社的な経理規定
    *   **個別ルール**: 顧問先ごとのマスタ（01-W）および過去の修正履歴（学習データ）
*   **論理処理**:
    *   日付、金額、取引先、内容の抽出
    *   **貸借補完**: 貸方不明時は「標準決済手段（未払金等）」を自動補完（L-006）
*   **タスク化**: 解析結果をTaskとして登録（status: AI_PENDING）

### Phase 6: 人間確認・承認
*   **タスクリスト表示**: 未処理の領収書を一覧表示
*   **確認**: AIの推論結果を確認
*   **修正**: 必要に応じて修正
*   **承認**: 人間が承認（status: APPROVED）

### Phase 7: CSV出力・コンバージョン
各会計ソフトの仕様（Spec Sheet）に基づき、承認済みデータを変換します。

#### 2.1 対応ソフトウェア
| ソフトウェア | 出力形式 | 特記事項 |
| :--- | :--- | :--- |
| **弥生会計** | 仕訳日記帳 (CSV) | 識別フラグ「2111/2000」付与、Shift_JIS/BOM考慮 |
| **MFクラウド** | 仕訳帳 (CSV) | 税区分ラベル変換（例: `課対仕入10%` → `課仕 10%`） |
| **freee** | 取引インポート (CSV) | 勘定科目・税区分の独自マッピング適用 |

---

## 3. データモデル (Schema)

### 3.1 顧問先 (Client)
Firestore Collection: `clients`
```typescript
interface Client {
  id: string;             // システムID
  code: string;           // 3コード (例: AMT)
  name: string;           // 会社名
  fiscalMonth: number;    // 決算月
  accountingSoft: 'yayoi' | 'freee' | 'mf'; // 利用ソフト
  driveLinked: boolean;   // Drive連携状態
  status: 'active' | 'inactive'; // 稼働状況
  knowledgePrompt?: string; // 個別AI知識
}
```

### 3.2 ジョブ/仕訳 (Job / JournalEntry)
Firestore Collection: `jobs`
```typescript
interface Job {
  id: string;
  clientId: string;
  files: string[];        // 原本ファイルパス/ID
  status: JobStatus;      // AI_PENDING, REVIEW, APPROVED, etc.
  
  // 仕訳データ (AI解析結果 + 人間修正)
  journalEntries: JournalEntryItem[];
  
  // メタデータ
  aiConfidence: number;   // AI信頼度
  humanApprovedBy?: string; // 承認者ID
  humanApprovedAt?: Date;   // 承認日時
}

interface JournalEntryItem {
  date: string;
  debit: { account: string; subAccount?: string; amount: number; taxType: string; };
  credit: { account: string; subAccount?: string; amount: number; taxType: string; };
  description: string;
}
```

---

## 5. 開発原則

本システムの開発は、以下の原則に基づきます。

### 5.1 型安全の徹底 (ADR-001)

**原則**:
> **「壊せない型安全性」**

**概要**:
- Zodスキーマを唯一の真実の源泉（Single Source of Truth）とする
- Lv.2.5（keyof().enum）による型安全マッピング
- 手動ハードコード（Lv.1）は絶滅危惧種

**具体例**:
```typescript
// ❌ Lv.1: 手動ハードコード（絶滅危惧種）
<input name="total" />

// ✅ Lv.2.5: 型安全マッピング
const Keys = ReceiptSchema.keyof().enum;
<input :name="Keys.total" />
```

**効果**:
- タイポによる不整合を物理的に防止
- IDEが補完・検知
- リファクタリングが安全

**詳細**: [ADR-001-type-safe-mapping.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-001-type-safe-mapping.md)

---

### 5.2 段階的UI実装 (ADR-002)

**原則**:
> **「Screen A First Approach + UI Freeze」**

**概要**:
- 最もシンプルな画面（Screen A）から始める
- データ契約を確定してからUI Freeze
- Freezeにより、後続開発の安全性を保証

**フロー**:
```
1. Screen A実装 → 2. データ契約確定 → 3. UI Freeze → 4. 後続画面を安全に実装
```

**UI Freezeとは**:
- UIスキーマ・Mapperの変更を禁止
- 変更が必要な場合は、緊急会議で承認が必要
- 後続画面の開発者が安心して依存できる

**効果**:
- 手戻りを最小化
- 並行開発が可能
- 「壊せない設計」の実現

**詳細**: [ADR-002-gradual-ui-implementation.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-002-gradual-ui-implementation.md)

---

## 6. 運用ルール (Project Policy)

1.  **設計書優先**: 実装は `00_管理用_AI会計システム本体.xlsx` を正とする
2.  **Web連携**: 外部仕様（CSV等）は設計書を参考にしつつ、必要に応じて公式ドキュメントで裏付けを取る
3.  **記憶の維持**: 重要な仕様変更は本ドキュメントおよび `CHANGELOG_SYSTEM_PHILOSOPHY.md` に記録する
4.  **型安全の厳守**: ADR-001で定義された型安全マッピング戦略（Lv.2.5）を遵守

---

## 7. 本ファイルの更新ルール

### 更新フロー
1. 議論中にAIが「このファイルの更新が必要」と判断
2. AIが修正案を提示（差分形式）
3. 人間が承認
4. AIが修正実行
5. CHANGELOG_SYSTEM_PHILOSOPHY.mdを更新

### 更新トリガー
- システムの本質に関わる決定事項
- ADRとの整合性が必要な変更
- 人間が「必読ファイルを更新して」と指示

---

**過去の全変更履歴は [archive/](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/archive/) を参照**
