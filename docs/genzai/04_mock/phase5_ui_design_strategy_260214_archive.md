# Phase 5 UIモックアップ デザイン方針（2026-02-14）

**作成日**: 2026-02-14  
**目的**: ステップ3.2b-1（静止画UIモックアップ作成）の設計方針策定  
**参考資料**: Streamed UI、既存アプリUI（AI会計システム）

---

## 🎨 現在のアプリのデザイン要素

### **抽出されたコーポレートカラー**

| 要素 | カラーコード | 用途 |
|------|-------------|------|
| **メインカラー** | `#667EEA` → `#764BA2`（グラデーション） | ログインボタン、背景 |
| **背景色** | 青紫グラデーション（本体）、白（カード） | 全体背景、コンテンツエリア |
| **テキストカラー** | `#333333`（メイン）、`#6B7280`（グレー） | 本文、メニュー |
| **アクセントカラー** | オレンジ（`#FFEDD5`）、レッド（`#FEE2E2`） | 開発用ボタン、緊急停止 |

### **フォント**

- **フォントファミリー**: `"Noto Sans JP"`, `"Hiragino Sans"`, `Meiryo`, `sans-serif`
- **デザイン印象**: モダンなSaaSスタイル、視認性が高い

---

## 📊 Streamed UIの分析

### **観察されたUI要素**（添付画像より）

| 要素 | Streamedの実装 |
|------|---------------|
| **ヘッダーカラー** | 緑系（#48BB78 付近） |
| **テーブル背景** | 白、黄色（ハイライト） |
| **アイコン** | 多種多様（車、領収書、警告、✓、×、鉛筆など） |
| **列構成** | No / 日付 / 摘要 / 税区分 / 借方 / 貸方 / 取引先 / 金額 / 複数アイコン列 |
| **複合仕訳** | 複数行表示（グレー背景で区別）|
| **ホバー** | 詳細情報表示（推測） |

### **Streamedの強み**

- 情報密度が高い
- アイコンによる視覚的な情報伝達
- 複合仕訳の視覚的区別

---

## 🎯 差別化ポイント（まるぱくり防止）

### **1. カラースキーム**

| 項目 | Streamed | 当アプリ（独自路線） |
|------|----------|---------------------|
| **メインカラー** | 緑系（#48BB78付近） | **紫〜青グラデーション（#667EEA〜#764BA2）** |
| **ヘッダー背景** | 緑 | **紫〜青グラデーション** |
| **テーブルヘッダー** | 緑背景 | **紫系（#764BA2の薄め、#E9D5FF等）** |
| **ハイライト（未読）** | 黄色 | **薄い青紫（#EDE9FE等）** |
| **グレー（exported）** | グレー | **グレー（同じ）** |

**方針**: 緑系を完全に排除し、紫〜青のグラデーションを全体に適用

---

### **2. アイコン**

| 項目 | Streamed | 当アプリ（独自路線） |
|------|----------|---------------------|
| **アイコンセット** | 独自アイコン（車🚗、領収書📄等） | **Font Awesome / Material Icons を使用** |
| **証憑種類** | 車、領収書、コンビニ等 | **🚗（交通費）、🍴（接待費）、📦（経費）、💼（会議費）** |
| **エラー** | 赤△ | **🔴（赤丸）、⚠️（警告マーク）** |
| **ルール適用** | 学習マーク | **🎓（学習済み）、💡（適用可能）** |
| **インボイス** | ⭕❌ | **✅❌ または ✓✗（フォント変更）** |
| **メモ** | 📝 | **💬（吹き出し）または✏️（鉛筆）** |

**方針**: Emoji + Font Awesomeで独自アイコンセット構築

---

### **3. レイアウト・列構成**

| 項目 | Streamed | 当アプリ（独自路線） |
|------|----------|---------------------|
| **列の順序** | No / 日付 / 摘要 / 税区分 / 借方 / 貸方 / 取引先 / 金額 / アイコン | **No / 日付 / アイコン列（5種） / 取引先 / 借方科目 / 貸方科目 / 金額** |
| **複合仕訳** | グレー背景 | **インデント+薄い背景色（#F9FAFB等）** |
| **ソート** | 不明 | **各列ヘッダーにソートアイコン表示** |
| **フィルター** | 上部に配置 | **右上に独立したフィルターボタン** |

**方針**: アイコン列を左寄せに集約、科目名を中央配置

---

### **4. テーブルスタイル**

| 項目 | Streamed | 当アプリ（独自路線） |
|------|----------|---------------------|
| **ヘッダー** | 緑背景 + 白文字 | **紫グラデーション背景（#764BA2の20%）+ グレー文字（#6B7280）** |
| **行の罫線** | 細い実線 | **点線（border-dotted）またはより細い実線** |
| **ホバー効果** | 不明 | **薄い紫背景（#F5F3FF）+ カーソル変更** |
| **角丸** | 不明 | **テーブル全体に角丸（8px）適用** |

**方針**: より洗練されたモダンUIスタイル（角丸、グラデーション）

---

### **5. 背景色ロジック（定義B準拠）**

| 状態 | Streamed | 当アプリ（独自、定義B準拠） |
|------|----------|---------------------------|
| **未読（is_read=false）** | 黄色（#FFF9E6付近） | **薄い青紫（#EDE9FE）** |
| **既読（is_read=true）** | 白 | **白（#FFFFFF）** |
| **出力済み（status=exported）** | グレー | **薄いグレー（#F3F4F6）** |

**方針**: 黄色を排除、紫系カラーで統一

---

## 🎨 UIモックアップのカラーパレット

### **メインカラー**

| 用途 | カラーコード | カラー名 |
|------|-------------|---------|
| **プライマリ（濃）** | `#764BA2` | パープル（Streamed緑の代替） |
| **プライマリ（中）** | `#667EEA` | ブルーパープル |
| **グラデーション背景** | `linear-gradient(135deg, #667EEA 0%, #764BA2 100%)` | - |

### **背景色**

| 用途 | カラーコード | カラー名 |
|------|-------------|---------|
| **未読ハイライト** | `#EDE9FE` | 薄い青紫（Violet-100） |
| **既読（通常）** | `#FFFFFF` | 白 |
| **出力済み** | `#F3F4F6` | 薄いグレー（Gray-100） |
| **複合仕訳** | `#F9FAFB` | 極薄グレー（Gray-50） |

### **テキストカラー**

| 用途 | カラーコード | カラー名 |
|------|-------------|---------|
| **見出し** | `#1F2937` | ダークグレー（Gray-800） |
| **本文** | `#4B5563` | ミディアムグレー（Gray-600） |
| **補助** | `#6B7280` | ライトグレー（Gray-500） |

### **アクセントカラー**

| 用途 | カラーコード | カラー名 |
|------|-------------|---------|
| **成功・適格** | `#10B981` | エメラルドグリーン |
| **警告** | `#F59E0B` | アンバー |
| **エラー・緊急** | `#EF4444` | レッド |

---

## 📐 UIモックアップの仕様

### **テーブル列構成（30件表示）**

| No | 列名 | 幅 | 説明 |
|----|------|-----|------|
| 1 | No | 40px | 行番号 |
| 2 | 日付 | 80px | `MM/DD` 形式 |
| 3 | 証憑種類 | 30px | 🚗🍴📦💼 |
| 4 | エラー | 30px | 🔴⚠️（labels配列） |
| 5 | ルール | 30px | 🎓💡 |
| 6 | インボイス | 30px | ✅❌ |
| 7 | メモ | 30px | 💬✏️ |
| 8 | 取引先 | 150px | テキスト |
| 9 | 借方科目 | 120px | テキスト |
| 10 | 貸方科目 | 120px | テキスト |
| 11 | 金額 | 100px | `¥X,XXX` 形式 |

**総幅**: 約900px（横スクロールなし）

---

### **アイコンロジック**

#### **証憑種類アイコン**（labels配列に基づく）

- `TRANSPORTATION_EXPENSE`: 🚗（赤）
- `ENTERTAINMENT_EXPENSE`: 🍴（オレンジ）
- `SUPPLY_EXPENSE`: 📦（青）
- `MEETING_EXPENSE`: 💼（緑）

#### **エラーアイコン**（labels配列に基づく）

- `DEBIT_CREDIT_MISMATCH`: 🔴
- `TAX_CALCULATION_ERROR`: ⚠️（赤）
- `DUPLICATE_TRANSACTION`: ⚠️（黄）

#### **ルールアイコン**

- `RULE_APPLIED`: 🎓（青）
- `RULE_AVAILABLE`: 💡（黄）

#### **インボイスアイコン**

- `INVOICE_QUALIFIED`: ✅（緑）
- `INVOICE_NOT_QUALIFIED`: ❌（赤）

#### **メモアイコン**

- `HAS_MEMO`: 💬（青）

---

### **ホバー表示（ツールチップ）**

| アイコン | ホバー内容 |
|---------|-----------|
| **ルール🎓** | ルール名、適用日時、信頼度 |
| **インボイス✅** | インボイス番号、適格/不適格理由 |
| **メモ💬** | メモ内容（編集可能） |

---

## 🖼️ UIモックアップ作成指示（generate_image用）

### **プロンプト案**

```
Create a modern accounting software UI mockup for a journal entry list (Level 3).

DESIGN SPECIFICATIONS:
- Color scheme: Purple-to-blue gradient (#667EEA to #764BA2)
- Header: Gradient purple background with white text
- Table: 30 rows, 11 columns
- Font: Noto Sans JP, clean and modern
- Style: SaaS-style, professional, high contrast

TABLE COLUMNS (left to right):
1. No (40px): Row number (1-30)
2. Date (80px): MM/DD format (e.g., "24/05/20")
3-7. Icon columns (30px each):
   - 🚗 Transportation
   - 🔴 Error warning
   - 🎓 Rule applied
   - ✅ Invoice qualified
   - 💬 Memo
8. Vendor (150px): Company name in Japanese
9. Debit Account (120px): Account name
10. Credit Account (120px): Account name
11. Amount (100px): ¥X,XXX format

BACKGROUND COLOR LOGIC (definition B):
- Unread (is_read=false): Light purple (#EDE9FE)
- Read (is_read=true): White (#FFFFFF)
- Exported (status=exported): Light gray (#F3F4F6)

SPECIAL ROWS:
- Row 1-20: Normal entries (mix of purple and white backgrounds)
- Row 21-27: Warning entries (some with 🔴⚠️ icons)
- Row 28-30: Error entries (red background highlight)
- Row 2, 7, 24: Composite entries (2-line display with indent)

ICONS TO USE:
- 🚗 (red) - Transportation
- 🍴 (orange) - Entertainment
- 📦 (blue) - Supplies
- 💼 (green) - Meeting
- 🔴 (red) - Error
- ⚠️ (yellow/orange) - Warning
- 🎓 (blue) - Rule applied
- 💡 (yellow) - Rule available
- ✅ (green) - Invoice qualified
- ❌ (red) - Invoice not qualified
- 💬 (blue) - Has memo

LAYOUT:
- Table header: Gradient purple (#764BA2 20% opacity) with gray text (#6B7280)
- Row borders: Thin dotted lines
- Hover effect: Light purple background (#F5F3FF)
- Corner radius: 8px on table
- Padding: Comfortable spacing between icons and text

STYLE NOTES:
- Do NOT use green colors (differentiates from Streamed)
- Use purple-blue gradient consistently
- Modern, clean, professional appearance
- High information density but readable
```

---

## ✅ 次のアクション

1. **generate_imageツールでUIモックアップ作成**
2. **ユーザー確認**（デザイン方向性OK?）
3. **OKの場合**: ステップ3.2b-2（Vueコンポーネント実装）へ
4. **NGの場合**: デザイン調整

---

**最終更新**: 2026-02-14  
**ステータス**: デザイン方針確定完了、UIモックアップ作成準備完了
