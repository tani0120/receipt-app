# 理想層深層考古学監査 (Ideal Layer Audit)

**執行日時:** 2026-01-12
**考古学者:** Antigravity Agent
**ベース:** 厳密仕様書 (Strict Specs) の目視抽出

本ドキュメントは、仕様書（理想）において「どのようなデータ項目」や「指標」が定義されているかを物理的に記録したものである。

---

## 1. 仕様書上のテーブル定義 (Table Structures)

### 1-1. Screen B: 仕訳進捗管理 (`ScreenB_Strict_Spec.md`)
*   **ヘッダー定義:**
    *   `Client Info`: 顧問先情報 (Code, Name, Software, Fiscal Month)
    *   `Step Grid`: 7ステップ進捗
        1.  資料受領 (Receipt)
        2.  AI解析 (AI Analysis)
        3.  1次仕訳 (Journal Entry) - "残り X件"
        4.  最終承認 (Approval) - "未承認"
        5.  差戻対応 (Remand) - "差戻対応"
        6.  CSV出力 (Export)
        7.  原本整理 (Archive)
    *   `Action`: 次のアクション (Dynamic Button)
*   **観察:** 「進捗」と「アクション」に特化しており、**「売上」「原価」「利益」等の経営項目は一切定義されていない**。

### 1-2. Screen A: 顧問先管理 (`ScreenA_UI_Spec_v2.0.md`)
*   **カラム定義:**
    1.  設定状況 (Status)
    2.  3コード (Code)
    3.  会社名 (Name)
    4.  担当 (Staff)
    5.  連絡 (Contact)
    6.  決算月 (Fiscal Month)
    7.  ソフト/税/基準 (Settings)
    8.  Drive連携 (Drive Link)
    9.  編集 (Edit)
*   **観察:** 連絡手段やソフト設定といった「実務情報」は完備されているが、**「契約金額」や「想定仕訳数」といった契約管理項目は存在しない**。

### 1-3. Admin Dashboard (`Admin_Strict_Spec.md`)
*   **KPI パネル:**
    *   月間仕訳数 (Monthly Journals)
    *   AI 自動化率 (Auto Conversion Rate)
    *   AI 精度 (AI Accuracy)
    *   進捗状況 (Process Funnel)
*   **担当者パフォーマンス (Staff Table):**
    *   担当者名 (Name)
    *   残件数 (Backlog)
    *   処理速度 (Velocity - draftAvg/h)
*   **観察:** 「処理速度 (Velocity)」という生産性指標は辛うじて存在するが、それを「金額 (Money)」に換算する計算式は仕様書上にも存在しない。

---

## 2. 仕様書上の計算式・指標 (Formulas & Logic)

### 2-1. Admin Dashboard
*   **AI自動化率:** `autoConversionRate` (前月比トレンドあり)
*   **処理速度:** `velocity.draftAvg` ("/h")
*   **プログレスバー:** `style="width: ${(staff.backlogs.draft / staff.backlogs.total) * 100}%"`
*   **システム稼働:** `systemStatus` (ACTIVE/PAUSE toggle)

### 2-2. Screen B
*   **残り件数:** `card.pendingCount` (推定)
*   **新着バッジ:** `client.isNew`

---

## 3. ギャップ分析 (The Ideal Gap)

仕様書（理想層）においても、以下の概念は **定義すらされていない (Undefined)** ことが確定した。

1.  **ROI (Return On Investment):**
    *   `ROI = (顧問料 - 原価) / 原価` などの計算式はどこにもない。
2.  **Unit Price (単価):**
    *   1仕訳あたりの単価設定がない。
3.  **Cost (原価):**
    *   スタッフの時給、AIトークンコスト、システム利用料の計算式がない。

**結論:**
このシステムは「理想（Spec）」の段階からして「業務処理（Operation）」の効率化のみを目的として設計されており、「経営管理（Management）」を行うための設計図が存在しない。V2.8 での実装は、単なる機能追加ではなく、「仕様の再定義」と同義である。
