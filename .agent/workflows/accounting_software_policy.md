# 会計ソフト別対応方針

## 対応順序

1. **MF（マネーフォワード）を最優先で完成させる**
2. freee・弥生はMF完了後に着手

## 理由

- MFはMCP API連携があり、科目・税区分の同期が自動化できる
- freee・弥生はAPI連携なし。CSV出力→手動インポートの運用
- freee・弥生にMF形式CSVをインポートする場合、CSV列構造の変換が必要（そのままでは取り込めない）
- 科目名・税区分名の不一致時は会計ソフト側で手動マッピングが必要
- この変換・マッピング対応は工数が大きく、MF完成前に着手する意味がない

## 現状の出力

- CSVエクスポートはMF形式のみ（exportMfCsv.ts）
- 弥生・freee用のCSV列定義は定義済み（accountingConstants.ts SOFTWARE_EXPORT_CSV_SCHEMAS）
- 弥生・freee用の税区分変換マッピング定義も定義済み（accountingConstants.ts SOFTWARE_TAX_MAPPINGS_TEXT）
- ただし上記定義を使うCSV出力コードは未実装（TaxCodeMapper.ts, CsvExportService.tsは削除済み）

## freee・弥生対応時にやること（MF完了後）

- 弥生インポート形式のCSV出力関数を実装
- freeeインポート形式のCSV出力関数を実装
- 税区分名の変換（MF名→弥生名/freee名）を実装
- 顧問先のaccountingSoftwareに応じて出力形式を切り替え
