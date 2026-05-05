# data/ ディレクトリ

実行時に生成・更新されるデータファイルを格納するディレクトリ。
**このディレクトリ内のファイルはgit管理対象外です。**

## 格納されるファイル

| ファイル | 内容 |
|---|---|
| `journals-*.json` | 顧問先別の仕訳データ |
| `confirmed_journals.json` | 過去仕訳CSV（確定済み仕訳） |
| `documents.json` | 証票データ |
| `export-*.json` | エクスポート履歴・CSV出力 |
| `clients.json` | 顧問先マスタ |
| `vendors.json` | 取引先マスタ（永続化） |
| `learning-rules.json` | 学習ルール（永続化） |
| `staff.json` | スタッフデータ |
| `activity-log.json` | 操作ログ |
| `notifications.json` | 通知データ |
| `storage/` | 証票画像・PDFのストレージ |
| `uploads/` | アップロード一時保存 |
| `csv_samples/` | テスト用CSVサンプル |

## 初回セットアップ

サーバー起動時にAPIが自動生成するため、手動作成は不要。
`npm run dev` でサーバーを起動すれば初期データが作成されます。
