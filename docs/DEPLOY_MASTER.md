# デプロイマスター

**作成日**: 2026-01-25  
**最終更新**: 2026-01-25 21:53  
**ステータス**: Active  
**関連ファイル**: walkthrough.md, ADR-010, phase3_firebase_admin_guide.md

---

## 🚀 Cloud Runデプロイ（2026-01-25完了）

### 教訓（18時間の試行錯誤）

**Phase 4: 8/10 API Routes成功**
- コンソールからのデプロイで成功
- `serve()`のkeep-alive実装が決定的
- Firebase Admin初期化問題を解決

**Phase 5: 組織ポリシーで失敗**
- `requires-oslogin`ポリシーで`allUsers`アクセス拒否
- 403 Forbiddenエラー
- ポリシー除外が必要（未実施）

### 成功の鍵

```typescript
// server.ts - keep-alive実装
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received');
  process.exit(0);
});

setInterval(() => {
  console.log('💓 Server heartbeat - still running');
}, 30000);
```

**なぜこれで成功したのか**:
- `serve()`が即座にリターンしてプロセスが終了するのを防止
- `setInterval()`でイベントループをアクティブに保持
- Cloud RunのSTARTUP probeがタイムアウトする前に応答可能に

### 成功手順

1. **コンソールからデプロイ**: `gcloud run deploy`
2. **Cloud Build権限修正**: Service Accountに必要な権限追加
3. **Firebase Admin初期化**: 環境変数 `GOOGLE_APPLICATION_CREDENTIALS`
4. **keep-alive実装**: `setInterval()`でプロセス維持

### 詳細
- [walkthrough.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/walkthrough.md) - 18時間の完全記録、全試行の詳細
- [deployment_status_15hours.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/deployment_status_15hours.md) - 15時間時点のステータス
- [phase4_lessons_learned.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/phase4_lessons_learned.md) - Phase 4の教訓

---

## 🔧 デプロイ手順・ガイド

### Cloud Run
- [cloud_run_deploy_console_guide.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/cloud_run_deploy_console_guide.md) - コンソールからのデプロイ手順
- [cloud_run_deploy_guide.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/cloud_run_deploy_guide.md) - 基本デプロイガイド
- [cloud_run_final_deploy_guide.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/cloud_run_final_deploy_guide.md) - 最終版デプロイガイド
- [cloud_build_permission_fix.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/cloud_build_permission_fix.md) - Cloud Build権限修正

### Firebase
- [phase3_firebase_admin_guide.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/phase3_firebase_admin_guide.md) - Firebase Admin初期化ガイド
- [fireb ase_auth_fix_guide.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/firebase_auth_fix_guide.md) - Firebase認証修正
- [firebase_dynamic_require_emergency.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/firebase_dynamic_require_emergency.md) - Firebase dynamic require緊急対応
- [authentication_implementation_plan.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/authentication_implementation_plan.md) - 認証実装計画

### 組織ポリシー・セキュリティ
- [organization_policy_removal_guide.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/organization_policy_removal_guide.md) - 組織ポリシー除外ガイド
- [security_audit_report.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/security_audit_report.md) - セキュリティ監査レポート
- [cicd_vulnerability_analysis.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/cicd_vulnerability_analysis.md) - CI/CD脆弱性分析

### API Key管理
- [gemini_api_key_rotation_guide.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/gemini_api_key_rotation_guide.md) - Gemini APIキーローテーション
- [google_api_key_rotation_guide.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/google_api_key_rotation_guide.md) - Google APIキーローテーション
- [safe_api_key_deletion_guide.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/safe_api_key_deletion_guide.md) - 安全なAPIキー削除

---

## 🐛 エラー調査（参照用）

### 本番環境問題
- [production_issues_report.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/production_issues_report.md) - 本番環境問題レポート
- [error_31_investigation.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/error_31_investigation.md) - エラー31調査

### ビルド・デプロイエラー
- [build_error_for_gemini.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/build_error_for_gemini.md) - ビルドエラー
- [cloud_run_error_for_gemini.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/cloud_run_error_for_gemini.md) - Cloud Runエラー
- [typescript_esm_import_error_final.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/typescript_esm_import_error_final.md) - TypeScript ESMインポートエラー
- [esbuild_dotenv_error_final.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/esbuild_dotenv_error_final.md) - esbuild dotenvエラー

### 調査報告
- [final_14hour_report_for_gemini.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/final_14hour_report_for_gemini.md) - 14時間調査報告
- [gemini_consultation_full_error.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/gemini_consultation_full_error.md) - Gemini相談（完全エラー）
- [document_consistency_report.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/document_consistency_report.md) - ドキュメント整合性レポート

---

## 📖 ADR（Architecture Decision Record）

- [ADR-010-ai-api-migration.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-ai-api-migration.md) - AI API移行
- [ADR-010-Part1-environment-comparison.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-Part1-environment-comparison.md) - 環境比較
- [ADR-010-Part2-implementation.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-Part2-implementation.md) - 実装
- [ADR-010-Part3-checklist.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-Part3-checklist.md) - チェックリスト
- [ADR-010-Part4-cost-security.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-Part4-cost-security.md) - コスト・セキュリティ
- [FAILURE_ANALYSIS_20260122.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/FAILURE_ANALYSIS_20260122.md) - 失敗分析（2026-01-22）
