# AI会計システム 基本設計書

**Version:** 1.0.0
**Last Updated:** 2025/12/27
**Status:** Active

## 1. システム概要
本システムは、顧問先の証憑（領収書・請求書等）をAIが解析し、会計ソフト（弥生会計、MFクラウド、freee等）に取り込み可能な仕訳データを自動生成する業務支援プラットフォームです。

### 1.1 アーキテクチャ構成
本システムは、以下の「3層構造 ＋ ハイブリッドDB」により構成されています。

*   **Frontend (Vue.js 3 + TypeScript)**
    *   **プレゼンテーション層**: 実務者が操作するUI。
    *   **役割**: データの閲覧、修正、承認操作。
*   **Backend / Batch (Google Apps Script - 計画)**
    *   **役割**: Google Drive上のファイル操作、定期的なAI解析バッチ、ファイル移動。
    *   **注意**: 現行フェーズではVueアプリ内のMock/Service層でシミュレーション中。
*   **Database (Hybrid)**
    *   **Firestore**: UI表示用の高速NoSQLデータベース。リアルタイム同期を担当。
    *   **Google Spreadsheets/Drive**: 原本データの保管、およびGASバッチ処理の基盤。

## 2. 業務フローとフェーズ定義
設計書の「論理地図」に基づき、以下のフェーズで処理が進行します。

### Phase 1: 受領・前処理
*   **ファイル回収**: 顧問先共有フォルダからファイルを収集。
*   **重複除外**: MD5ハッシュによる重複チェック（L-002）。
*   **期間外判定**: 決算期に基づき当期以外のデータを隔離（L-003）。
*   **【拡張】Phase 1.5**: 支払い方法判定（クレカ領収書等の特定ロジック）。

### Phase 2〜5: AI解析・推論
*   **AIモデル**: Gemini 1.5 Flash (Vision) を採用（予定）。
*   **知識注入 (RAG)**:
    *   **共通ルール**: 全社的な経理規定。
    *   **個別ルール**: 顧問先ごとのマスタ（01-W）および過去の修正履歴（学習データ）。
*   **論理処理**:
    *   日付、金額、取引先、内容の抽出。
    *   **貸借補完**: 貸方不明時は「標準決済手段（未払金等）」を自動補完（L-006）。

### Phase 6: CSV出力・コンバージョン
各会計ソフトの仕様（Spec Sheet）に基づき、中間データを変換します。

#### 2.1 対応ソフトウェア
| ソフトウェア | 出力形式 | 特記事項 |
| :--- | :--- | :--- |
| **弥生会計** | 仕訳日記帳 (CSV) | 識別フラグ「2111/2000」付与、Shift_JIS/BOM考慮。 |
| **MFクラウド** | 仕訳帳 (CSV) | 税区分ラベル変換（例: `課対仕入10%` → `課仕 10%`）。 |
| **freee** | 取引インポート (CSV) | 勘定科目・税区分の独自マッピング適用。 |

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
  files: string[];        // 原本フィルパス/ID
  status: JobStatus;      // AI_PENDING, REVIEW, APPROVED, etc.
  
  // 仕訳データ (AI解析結果 + 人間修正)
  journalEntries: JournalEntryItem[];
  
  // メタデータ
  aiConfidence: number;   // AI信頼度
  isCreditCard?: boolean; // 【拡張】クレカ判定フラグ
  detectedBank?: string;  // 【拡張】推論された銀行名
}

interface JournalEntryItem {
  date: string;
  debit: { account: string; subAccount?: string; amount: number; taxType: string; };
  credit: { account: string; subAccount?: string; amount: number; taxType: string; };
  description: string;
}

## 4. 拡張ロジック定義 (Optimized Logic)

### 4.1 AI検証・検知ロジック (Comprehensive Detection Logic)
発生主義への対応、リスク管理、資料回収不足を網羅する以下の「検知・アクション統合表」を実装しています。

| カテゴリ | 検知項番 | 検知ロジック (AI Trigger) | リスト/アクション |
| :--- | :--- | :--- | :--- |
| **A. 資金・取引** | 1 | **融資・借入**: 100万円以上の非売上入金 | **【不足資料】** 返済予定表、契約書 |
| | 2 | **資産購入**: 30万円以上の物品購入 | **【不足資料】** 見積書、カタログ（固定資産判定） |
| | 3 | **新規口座**: 未知の残高推移・外観 | **【自動検知マスタ】** 仮ID発行 → リネーム依頼 |
| | 4 | **初回取引**: 過去実績のない新規取引先 | **【要確認】** 科目提案（消耗品費等）の承認 |
| **B. 内容確認** | 5 | **明細不明**: EC/決済サービス (Amazon, PayPay, Stripe等)<br><ul><li>**決済・QR**: d払い, au PAY, 楽天ペイ, R Pay, Pay-easy</li><li>**カード表記**: VISA, MASTER, JCB, AMEX, DINERS, ETC, VIEW, LUMINE</li><li>**EC**: Qoo10, ZOZO, BASE, STORES</li><li>**サブスク**: Google, Apple, Adobe, Microsoft, Zoom, AWS, Xserver</li><li>**キャリア**: SoftBank, KDDI, NTT DOCOMO, NTTファイナンス（合算請求の可能性が高いため）</li></ul> | **【不足資料】** 購入明細(Invoice)、内訳書 |
| | 6 | **資金移動疑義**: 「振替」「自分」のキーワード | **【要確認】** 売上/経費 vs 資金移動 |
| | 7 | **交際費**: 飲食店 > 5,000円 | **【要確認】** 参加人数、目的（会議費判定） |
| | 8 | **保険・寄付**: 保険料、NPO等 | **【要確認】** 証券内容、寄付先詳細 |
| **C. リスク管理** | 9 | **二重払い**: 近接日・同額・同相手 | **【警告】** 重複支払の可能性 |
| | 10 | **インボイス**: T番号なし (Metadata判定) | **【警告】** 経過措置確認 |
| | 11 | **源泉徴収**: 個人宛報酬 > 5万円 | **【警告】** 源泉徴収の要否 |
| | 12 | **期ズレ**: 日付が決算期間外 | **【要確認】** 未払/前払処理または除外 |
| **D. 売掛・買掛** | 13 | **前期繰越**: 前期末残高と一致 | **【消込提案】** 前期売掛金の回収として処理 |
| | 14 | **当期未消込**: 既存AR/AP残高と一致 | **【消込提案】** 買掛金の支払として処理 |
| | 15 | **期中消込**: 発生主義での現金処理検知 | **【消込提案】** 売上→売掛金回収への振替提案 |
| **E. 定例回収** | 16 | **毎月定例**: 家賃・リース等の欠落 | **【資料不足】** 「〇月分の家賃資料がありません」 |
| | 17 | **季節性**: 税務カレンダー (自動車税等) | **【季節性リスト】** 「5月の自動車税納付書」 |

### 4.2 拡張データスキーマ (New Schemas)

#### A. AccountBalance (総勘定元帳履歴)
`clients/{id}/account_balances/{fy_month_accId}`
*   過去の残高（期首・期末）を保持し、**残高連続性チェック (Balance Continuity)** に使用。
*   定例取引のパターン分析（頻度ベース）にも利用。

#### B. InstitutionFingerprint (金融機関指紋)
`institution_fingerprints/{id}`
*   **Visual Fingerprint**: カラーコード、キーワード、ヘッダー位置特徴量。
*   未知の通帳画像を特定するために使用。

### 4.3 資料回収管理 (Material Collection)
*   **Missing List**: `RecurringLogic` により、過去の元帳データから「毎月あるはずの取引」を特定し、当月分が欠落している場合にアラートを生成。



## 5. 運用ルール (Project Policy)
1.  **設計書優先**: 実装は `00_管理用_AI会計システム本体.xlsx` を正とする。
2.  **Web連携**: 外部仕様（CSV等）は設計書を参考にしつつ、必要に応じて公式ドキュメントで裏付けを取る。
3.  **記憶の維持**: 重要な仕様変更は本ドキュメントおよび `implementation_plan.md` に記録する。
4.  **【最重要】行動規範の遵守**: 開発者は `docs/dev_guide.md` に定義された「行動規範（Anti-Rebellion Protocol）」を絶対遵守すること。無許可の作業、報告の省略、本番直接編集は厳禁とする。
