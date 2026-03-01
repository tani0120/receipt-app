# 09_streamed 命名ルール

## ファイル命名規則

このフォルダ内のファイルには全て `streamed_` プレフィックスを付与する。

### 形式

```
streamed_[内容を示す名前].[拡張子]
```

### 例

| ファイル名 | 内容 |
|-----------|------|
| `streamed_design_policy.md` | STREAMED型エンジン設計方針書 |
| `streamed_mf_csv_spec.md` | MF CSVインポート仕様書 |
| `streamed_account_mapping.md` | 勘定科目マッピング表（現enum → MF科目名） |
| `streamed_tax_mapping.md` | 税区分マッピング表（現enum → MF税区分名） |
| `streamed_migration_log.md` | 移行ログ（変更履歴） |

### 理由

- 他フォルダのファイルと混在しても即座にSTREAMED型移行の成果物と判別可能
- grepで `streamed_` を検索すれば関連ファイルを一括抽出可能
