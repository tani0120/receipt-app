# インフラ・セキュリティ

**作成日**: 2026-02-27
**目的**: 開発環境設定・セキュリティに関する未解決事項を管理
**解決時期**: Phase B〜C
**出典**: `setup_status_report_260211.md`, `supabase_security_report_260214.md`

---

## IS-1: Firebase CLI認証エラー

- **出典**: [setup_status_report_260211.md](file:///C:/dev/receipt-app/docs/genzai/01_tools_and_setups/setup_status_report_260211.md)
- **現状**: Firebase CLI認証が失敗する。再ログインが必要
- **影響**: Firebase関連の操作（デプロイ等）が実行不可
- **対応**: `firebase login`で再認証

---

## IS-2: ggshield pre-commit hook未インストール

- **出典**: [setup_status_report_260211.md](file:///C:/dev/receipt-app/docs/genzai/01_tools_and_setups/setup_status_report_260211.md)
- **現状**: ggshieldのpre-commit hookが設定されていない
- **影響**: コミット時にシークレット検出が自動実行されない
- **対応**: `ggshield install -m local`でpre-commit hookインストール

---

## IS-3: receiptsテーブルRLSポリシーが過剰に許可的

- **出典**: [supabase_security_report_260214.md](file:///C:/dev/receipt-app/docs/genzai/01_tools_and_setups/supabase_security_report_260214.md)
- **現状**: `receipts`テーブルのRLSポリシーが警告レベル（過剰に許可的）
- **影響**: 本番環境でデータアクセス制御が不十分になる可能性
- **対応**: client_idベースのフィルタリングポリシーに修正（Phase C RLS本番化時に対処）

---

## チェックリスト

- [ ] IS-1: Firebase CLI再認証
- [ ] IS-2: ggshield pre-commit hookインストール
- [ ] IS-3: receiptsテーブルRLSポリシー修正
