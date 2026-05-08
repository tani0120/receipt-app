# 31. 顧問先管理 — Kintoneスタイル リニューアル

## 概要

`ClientEditPage.vue` をKintoneの顧問先管理画面に近づけてリニューアルする。
デザインの模倣＋不足フィールドの追加＋ステータス管理UI追加。**全フィールド一括実装**。

## 対象ページ

- `/master/clients/:clientId` → `ClientEditPage.vue`（顧問先詳細・編集）
- `/master/clients` → `MockMasterClientsPage.vue`（顧問先一覧 — ハードコード統合のみ）

---

## データフロー

```
clients.json → サーバー起動時にメモリ読込
→ GET /api/clients でフロント取得
→ useClients.ts の ref にキャッシュ
→ ClientEditPage.vue が .find() で1件取得
→ Object.assign(form, ...) でフォームに展開
→ 保存時は PUT /api/clients/:clientId
→ clientStore が clients.json に書き戻し
```

既存APIは `PUT /api/clients/:clientId` で `Partial<Client>` を受け取る設計。
`Client` 型にフィールドを `?` で追加するだけで、**APIルート側の変更は不要**。

---

## デザイン方針（Kintone模倣）

| 項目 | 実装方針 |
|---|---|
| セクションヘッダー | `background: #5b9bd5; color: #fff`（青帯＋白文字） |
| フィールド配置 | 横5〜6列並び（ラベル上・値下の2段構成） |
| フィールド枠線 | 閲覧モードも `border: 1px solid #ccc` |
| テーブル | 青ヘッダーの小テーブル（連絡先、過去担当者） |
| 注意書き | 赤文字注釈（例:「※マイナンバーは入れない」） |
| コメントパネル | **現状維持**（右カラム固定表示） |

---

## ハードコード排除

### [NEW] `src/constants/clientOptions.ts`

全ドロップダウン選択肢を1ファイルに集約。現在4ファイルにコピペ散乱している業種リスト・会計ソフト等も統合。

**定義する定数:**

| 定数名 | 内容 |
|---|---|
| `TYPE_OPTIONS` | 法人/個人事業/個人 |
| `STATUS_OPTIONS` | 契約中/休眠中/契約終了 |
| `INDUSTRY_OPTIONS` | 業種24項目 |
| `ACCOUNTING_SOFTWARE_OPTIONS` | MF/freee/弥生/TKC/その他 |
| `TAX_FILING_OPTIONS` | 青色/白色 |
| `TAX_MODE_OPTIONS` | 原則課税/簡易課税/免税 |
| `SIMPLIFIED_CATEGORY_OPTIONS` | 第一種〜第六種 |
| `TAX_METHOD_OPTIONS` | 税込/税抜 |
| `CALCULATION_METHOD_OPTIONS` | 発生主義/現金主義/中間現金主義 |
| `DEFAULT_PAYMENT_OPTIONS` | 現金/事業主借/買掛金 |
| `CONSUMPTION_TAX_INTERIM_OPTIONS` | 不要/1回/3回/11回 |
| `NEEDS_OPTIONS` | 未確認/あり/なし |
| `CONTRACT_SCOPE_OPTIONS` | 決算のみ/顧問/年1〜12回 |
| `BOOKKEEPING_TYPE_OPTIONS` | 自計化/記帳代行 |
| `YES_NO_OPTIONS` | なし/あり |
| `PAYMENT_METHOD_OPTIONS` | 紙/口座引落し |
| `PAYMENT_DAY_OPTIONS` | 8日/その他 |
| `CONTACT_METHOD_OPTIONS` | メール/電話/チャットワーク |

**汎用関数:** `getLabel(options, value)` — value→labelの変換を共通化

### 統合対象（4ファイル）

| ファイル | 変更 |
|---|---|
| `ClientEditPage.vue` | `industryOptions` ハードコード + `<option>` 直書き → import |
| `MockMasterClientsPage.vue` | `industryOptions` + `softwareLabel()` → import + `getLabel()` |
| `LeadListPage.vue` | 同上 |
| `LeadEditPage.vue` | 同上 |

---

## 既存フィールドの変更

| フィールド | 変更内容 |
|---|---|
| `type` | 選択肢追加: `'corp' \| 'individual' \| 'sole_proprietor'`（法人/個人/個人事業）ドロップダウン化 |
| `sharedEmail` | **編集不可**。ラベル「顧問先ログインメール（自動取得）」に変更 |
| `chatRoomUrl` | ラベルを「社内チャットURL」に変更 |
| `sharedChatUrl` | ラベルを「顧問先共有チャットURL」に変更 |
| 担当者（`staffId` / `subStaffId` / `payrollStaffId`） | 全て**名前検索付きドロップダウン**に |

### 自動生成URL（保存不要・表示のみ）

| 表示名 | URL生成ルール |
|---|---|
| 社内用アップロードURL | `{origin}/#/upload/{clientId}/staff`（コピーボタン付き） |
| 顧問先用アップロードURL | `{origin}/#/guest/{clientId}`（コピーボタン付き） |
| 進捗管理リンク | `{origin}/#/journal-list/{clientId}`（リンクボタン） |

---

## 不要と判断されたフィールド

| フィールド | 理由 |
|---|---|
| ~~`contractCode`（契約コード）~~ | 不要 |
| ~~`repBirthDate`（代表生年月日）~~ | 不要 |
| ~~`businessSuccession`（事業承継M&A）~~ | 不要 |
| ~~`invoiceApplicationDate`（インボイス申請日）~~ | 不要 |
| ~~`outsourcedTaxAccountant`（外注税理士有無）~~ | 不要 |
| ~~`outsourcedTaxAccountantName`（外注税理士名）~~ | 不要 |
| ~~`hasSystemService`（システム契約有無）~~ | 不要 |

---

## 追加フィールド一覧

### 基本情報

| フィールド名 | 型 | UI形式 |
|---|---|---|
| `engagementStartDate`（関与開始日） | `string?` | 日付入力 |
| `engagementEndDate`（関与終了日） | `string? \| null` | 日付入力 |
| `subStaffId`（副担当 / 記帳担当） | `string? \| null` | 名前検索ドロップダウン |
| `payrollStaffId`（給与社保担当） | `string? \| null` | 名前検索ドロップダウン |
| `corporateNumber`（法人番号） | `string?` | テキスト（※赤文字「マイナンバー入れない」） |
| `repTitle`（代表肩書） | `string?` | テキスト |
| `websiteUrl`（WebサイトURL） | `string?` | URL入力 |
| `annualRevenue`（売上高） | `string?` | テキスト |
| `employeeCount`（総従業員数） | `number? \| null` | 数値入力 |
| `businessDescription`（事業内容） | `string?` | 複数行テキスト |
| `parentCompany`（グループ会社） | `string?` | テキスト |
| `memo`（備考） | `string?` | 複数行テキスト |

### 過去担当者テーブル

```typescript
interface PastStaffEntry {
  staffId: string;    // スタッフID
  role: string;       // 区分（主担当/副担当）
  endDate: string;    // 期間（まで）ISO日付
  memo: string;       // 備考
}
```

### 連絡先テーブル

```typescript
interface ClientContact {
  name: string;       // 担当者名
  method: string;     // 種別（メール/電話/チャットワーク）
  value: string;      // 連絡先値
  usage: string;      // 利用方法
  memo: string;       // 備考
}
```

### ニーズ管理

| フィールド名 | 型 | 選択肢 |
|---|---|---|
| `needsInsurance`（保険） | `string?` | 未確認/あり/なし |
| `needsTaxSaving`（節税） | `string?` | 未確認/あり/なし |
| `needsSubsidy`（補助金） | `string?` | なし/あり |
| `needsLoan`（借入） | `string?` | なし/あり |
| `needsRealEstate`（不動産） | `string?` | なし/あり |

### 税務関連

| フィールド名 | 型 | 選択肢 |
|---|---|---|
| `consumptionTaxInterim`（消費税中間） | `string?` | 不要/1回/3回/11回 |

### システム導入状況

| フィールド名 | 型 |
|---|---|
| `accountingSoftwareMemo`（会計ソフト備考） | `string?` |
| `payrollSoftware`（給与計算ソフト） | `string?` |
| `payrollSoftwareMemo`（給与計算備考） | `string?` |
| `attendanceSystem`（勤怠管理システム） | `string?` |
| `attendanceSystemMemo`（勤怠管理備考） | `string?` |
| `otherSystem`（その他システム） | `string?` |
| `otherSystemMemo`（その他システム備考） | `string?` |

### 報酬情報の拡張

| フィールド名 | 型 | UI形式 |
|---|---|---|
| `contractScope`（契約内容） | `string?` | ドロップダウン（決算のみ/顧問/年1〜12回） |
| `bookkeepingType`（記帳代行・自計化） | `string?` | ドロップダウン |
| `hasSocialInsuranceContract`（社労士契約） | `string?` | ドロップダウン（なし/あり） |
| `hasPayrollService`（給与） | `string?` | ドロップダウン |
| `hasAccountingService`（経理代行） | `string?` | ドロップダウン |
| `socialInsuranceFee`（社労士報酬） | `number?` | 金額入力 |
| `payrollFee`（給与報酬） | `number?` | 金額入力 |
| `accountingServiceFee`（経理代行報酬） | `number?` | 金額入力 |
| `systemFee`（システム報酬） | `number?` | 金額入力 |
| `contractDocUrl`（契約書リンク） | `string?` | URL入力 |
| `paymentMethod`（引き落とし方法） | `string?` | ドロップダウン（紙/口座引落し） |
| `paymentDay`（引き落とし日） | `string?` | ドロップダウン（8日/その他） |
| `feeNotes`（報酬備考） | `string?` | 複数行テキスト |
| `attachmentFiles`（添付ファイル） | `AttachmentFile[]?` | ファイル添付UI |

```typescript
interface AttachmentFile {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}
```

---

## セクション構成

```
██ 基本情報 ██████████████████████████████████████████████████████
├── 契約状況 / 区分 / 関与開始日 / 関与終了日
├── 税・担当者 / 副担当（記帳担当）/ 給与社保担当
├── [テーブル] 過去担当者（区分・期間・備考）← 自動記録
├── 進捗管理リンク → /journal-list/:clientId
├── 内部ID / 3コード / 会社名 / 会社名（カナ）
├── 法人番号  ※赤文字「マイナンバーは入れない」
├── 代表肩書 / 代表者名 / 代表者名（カナ）
├── 保険ニーズ / 節税ニーズ / 補助金ニーズ / 借入ニーズ / 不動産ニーズ
├── 決算月・決算日 / 消費税中間申告 / インボイス登録 / 登録番号
├── 備考（複数行）
├── WebサイトURL / 顧問先ログインメール（自動・編集不可）
├── 社内用アップロードURL（自動） / 顧問先用アップロードURL（自動）
├── 売上高 / 総従業員数 / 業種
├── 事業内容（複数行）
└── 親号先/グループ会社

██ 連絡先 ████████████████████████████████████████████████████████
├── 電話番号 / メール / 社内チャットURL / 顧問先共有チャットURL
└── [テーブル] 担当者名 / 種別 / 連絡先 / 利用方法 / 備考

██ 会計設定 ██████████████████████████████████████████████████████
├── 会計ソフト / 確定申告 / 課税方式 / 事業区分（簡易時）
├── 税込/税抜 / 経理方式 / デフォルト支払方法
└── 部門管理 / 不動産所得（個人のみ）

██ システム導入状況 ██████████████████████████████████████████████
├── 会計ソフト名(既存) / 会計ソフト備考
├── 給与計算ソフト / 給与計算備考
├── 勤怠管理システム / 勤怠管理備考
└── その他システム / その他システム備考

██ 報酬情報 ██████████████████████████████████████████████████████
├── 契約内容 / 記帳代行・自計化 / 社労士契約 / 給与 / 経理代行
├── 顧問報酬 / 記帳代行報酬 / 社労士報酬 / 給与報酬 / 経理代行報酬 / システム報酬
├── 決算報酬 / 消費税申告報酬
├── 月次合計（自動） / 年間総報酬（自動）
├── 契約書リンク / 引き落とし方法 / 引き落とし日
├── 報酬備考（複数行）
└── 添付ファイル

                                          ┃ コメントパネル（右カラム固定）
```

---

## 変更対象ファイル

| 操作 | ファイル | 内容 |
|---|---|---|
| NEW | `src/constants/clientOptions.ts` | 全選択肢定数 + `getLabel()` |
| MODIFY | `src/repositories/types.ts` | Client型拡張 + 新インターフェース |
| MODIFY | `src/views/master/ClientEditPage.vue` | デザイン全面刷新 + 全フィールドUI |
| MODIFY | `src/views/master/MockMasterClientsPage.vue` | ハードコード→import統合 |
| MODIFY | `src/views/master/LeadListPage.vue` | ハードコード→import統合 |
| MODIFY | `src/views/master/LeadEditPage.vue` | ハードコード→import統合 |
| MODIFY | `src/features/client-management/composables/useClients.ts` | emptyClientForm拡張 + 過去担当者ロジック |
| MODIFY | `data/clients.json` | サンプルデータ充実 |
| MODIFY | `src/api/routes/clientRoutes.ts` | 添付ファイルエンドポイント追加 |

---

## 検証計画

### コンパイル
- `tsc --noEmit` エラーなし

### ハードコード排除確認
- `grep -r "const industryOptions" src/` → `clientOptions.ts` 以外にヒットしない
- `grep -r 'value="mf"' src/` → テンプレート直書きが残っていない

### ブラウザ検証
- 閲覧モード: 全フィールドが枠線付きで表示
- 編集モード: 全ドロップダウン・テキスト入力・テーブル行追加が動作
- sharedEmailが編集不可
- 自動生成URL（社内用/顧問先用）が正しく表示
- 担当者変更時に過去担当者テーブルに自動追記
- ステータス変更（休眠/契約終了/復帰）が正常動作
- 添付ファイルのアップロード/削除が動作
- コメントパネルが右カラムに正常表示
- 顧問先一覧・見込先一覧/編集のドロップダウンが正常動作
