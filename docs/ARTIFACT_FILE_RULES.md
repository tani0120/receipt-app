# アーティファクトファイル管理ルール

**作成日**: 2026-01-24  
**最終更新**: 2026-01-24  
**ステータス**: Active  
**適用範囲**: `C:\Users\kazen\.gemini\antigravity\brain\<conversation-id>\` 内のすべてのアーティファクトファイル

---

## 1. **型安全性ルールの必須追記**

### 📜 ルール

**すべてのアーティファクトファイル（.mdファイル）の最上部に、以下の型安全性ルールを必ず記載しなければならない。**

```markdown
<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- CRITICAL: AI TYPE SAFETY RULES - MUST FOLLOW WITHOUT EXCEPTION             -->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- 
【型安全性ルール - AI必須遵守事項】

## ❌ 禁止事項（6項目）- NEVER DO THESE:
1. Partial<T> + フォールバック値 (client.name || 'XXX') - TYPE CONTRACT DESTRUCTION
2. any型（実装済み機能） - TYPE SYSTEM ABANDONMENT
3. status フィールドの無視 - AUDIT TRAIL DESTRUCTION
4. Zodスキーマでのany型 (z.any()) - SCHEMA LEVEL TYPE ABANDONMENT
5. 型定義ファイルでのany型 (interface { field: any }) - INTERFACE LEVEL DESTRUCTION
6. 型定義の二重管理（新旧スキーマ混在） - TYPE DEFINITION CONFLICT

## ✅ 許可事項（3項目）- ALLOWED:
1. 将来のフェーズ未実装機能でのeslint-disable + throw new Error()
2. unknown型の使用（型ガードと組み合わせて）
3. 必要最小限の型定義（Pick<T>, Omit<T>等）

## 📋 類型分類（9種）:
| 類型 | 今すぐ修正 | 将来Phase | 修正不要 |
|------|-----------|----------|---------|
| 1. Partial+フォールバック | ✅ | - | - |
| 2. any型（実装済み） | ✅ | - | - |
| 3. status未使用 | ✅ | - | - |
| 4. eslint-disable | - | - | ✅ |
| 5. Zod.strict()偽装 | ※1+2 | - | - |
| 6. Zodスキーマany型 | ✅ | - | - |
| 7. 型定義any型 | ✅ | - | - |
| 8. 全体any型濫用 | - | ✅ | - |
| 9. 型定義不整合 | ✅ | - | - |

詳細: complete_evidence_no_cover_up.md
-->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->
```

### 🎯 適用対象

以下のすべてのアーティファクトファイル（45件）:

#### 現在のセッションで作成したアーティファクト（14件）
- task.md ✅
- implementation_plan.md ✅
- UI_MASTER.md ✅
- production_issues_report.md
- step2_l1-3_definition.md
- UNRESOLVED_DISCUSSIONS.md
- step3_ai_prompt_design.md
- step3_verification_report.md
- step3_final_direction.md
- error_31_investigation.md
- step3_completion_and_phase2_items.md
- critical_risks_report.md
- evidence_classification.md
- complete_evidence_no_cover_up.md

#### 過去のセッションで作成したアーティファクト（31件）
- L1-L5_LayerABC_Complete_Guide.md
- SESSION_20260117_file_protocol_consolidation.md
- SESSION_CHECKLIST.md
- TASK_PHASE5_L4L5.md
- TASK_UI_RECONCILIATION.md
- adr003_phase23_complete.md
- client-ui-requirements.md
- complete-property-checklist.md
- decision-clusters-all-usecases.md
- file-comparison-result.md
- mapping-table-usecase-subcluster.md
- phase5-l4l5-plan.md
- phase6-verification-complete.md
- property-checklist-screenA-admin.md
- property-integration-map.md
- session-complete-final.md
- session-constraint-report.md
- session-end-protocol-complete.md
- session-management-protocol-complete.md
- session-protocol-improvement.md
- session-summary-20260120.md
- session-summary.md
- step1-4boxes-classification.md
- step1.5-subcluster-classification.md
- task_adr003_cleanup.md
- task_ai_api_migration.md
- ui-column-modal-checklist.md
- ui-diff-admin-dg.md
- usecase-classification-category1.md
- walk through.md
- walkthrough.md

---

## 2. **アーティファクトファイルの削除禁止**

### 📜 ルール

**brainディレクトリ内のアーティファクトファイル（.mdファイル）は、いかなる理由があっても削除してはならない。**

### 🚫 禁止事項

1. ❌ **ファイルの削除**: `rm`, `del`, `write_to_file`での上書き等
2. ❌ **リネーム**: ファイル名の変更（ただし、誤字修正は例外）
3. ❌ **移動**: brainディレクトリ外への移動

### ✅ 許可事項

1. ✅ **内容の編集**: 既存ファイルの内容を更新する
2. ✅ **新規追加**: 新しいアーティファクトファイルを作成する
3. ✅ **メタデータ更新**: `最終更新`日付の更新

### 🛡️ 理由

- アーティファクトは**過去の思考・決定・検証の証拠**である
- 削除すると**知識の継続性が失われる**
- 過去のAIの判断を追跡できなくなる
- 将来のセッションで同じ問題を再発させるリスクがある

---

## 3. **新規アーティファクト作成時の義務**

### 📜 ルール

新しいアーティファクトファイルを作成する際、**必ず以下を実施**しなければならない：

1. ✅ ファイルの最上部に型安全性ルールを記載
2. ✅ メタデータを記載（作成日、最終更新、ステータス、目的）
3. ✅ ファイル名は意味のある名前（例: `step4_ui_implementation_plan.md`）
4. ✅ 作成理由を1行以上記載

### 例

```markdown
<!-- 型安全性ルール（省略） -->

# Step 4: UI実装計画

**作成日**: 2026-01-24  
**最終更新**: 2026-01-24  
**ステータス**: Draft  
**目的**: Step 4の仕訳表示UI実装における詳細計画を記載

**作成理由**: UI実装前に、コンポーネント設計とデータフローを明確化するため

---

（本文）
```

---

## 4. **違反時の対応**

### ⚠️ AIが違反した場合

1. **即座に指摘**: ユーザーまたは次のAIが違反を検出
2. **復元**: 削除されたファイルを復元（可能な場合）
3. **ログ記録**: `TASK_MASTER.md`のAI矯正ログに記録
4. **再教育**: プロンプトに型安全性ルールを追加

### 📝 記録例

```markdown
【AI矯正ログ】
日付: 2026-01-24
違反内容: task.mdを削除しようとした
AI: Antigravity v1.2
対応: 削除を阻止し、このルールを再確認させた
教訓: アーティファクトは削除できないことを再徹底
```

---

## 5. **このルール自体の保護**

### 📜 ルール

**このファイル（`ARTIFACT_FILE_RULES.md`）も削除禁止である。**

- このファイルを削除または改変する行為は、型安全性ルールの削除と同等の重大な違反である
- このファイルは`session-management-protocol-complete.md`から参照される

---

## 6. **参照ドキュメント**

- [session-management-protocol-complete.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/session-management-protocol-complete.md) - セッション管理プロトコル
- [TASK_MASTER.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/TASK_MASTER.md) - AI矯正ログ
- [complete_evidence_no_cover_up.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/complete_evidence_no_cover_up.md) - 型安全性破壊の証拠

---

**End of Document**
