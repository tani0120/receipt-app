# TASK: Phase 5（L4/L5実装）

**作成日**: 2026-01-17  
**最終更新**: 2026-01-17  
**ステータス**: 計画中  
**親タスク**: TASK_MASTER.md - Penta-Shield実装  
**関連**: ADR-004、ADR-005、ADR-006、phase5-l4l5-plan.md

---

## 目的

Penta-ShieldのL4（Visual Guard）とL5（Sandbox Guard）を Receipt + Client 共通で実装する。

**前提条件**:
- ✅ Receipt L1-L3完成
- ✅ Client L1-L3完成（テスト22/22 Pass）

---

## タスクチェックリスト

### Phase 5-1: Storybook導入

- [ ] package.json更新（@storybook/vue3等追加）
- [ ] .storybook/main.ts作成
- [ ] npm install実行
- [ ] npm run storybookで起動確認

**実施日**: 未実施  
**担当**: AI

---

### Phase 5-2: Receipt用Story作成

- [ ] src/features/receipt/ReceiptView.stories.ts作成
  - [ ] Draft Story
  - [ ] Submitted Story
  - [ ] Approved Story
- [ ] Storybook起動確認

**実施日**: 未実施

---

### Phase 5-3: Client用Story作成

- [ ] src/features/client/ClientView.stories.ts作成
  - [ ] Draft Story
  - [ ] Submitted Story
  - [ ] Approved Story

**実施日**: 未実施

---

### Phase 5-4: ExternalText型定義

- [ ] src/types/ExternalInput.ts作成
  - [ ] ExternalText型定義
  - [ ] createExternalText()関数
  - [ ] displayExternalText()関数
- [ ] TypeScript型チェック通過確認

**実施日**: 未実施

---

### Phase 5-5: システムプロンプト作成

- [ ] docs/prompts/system-prompt.md作成
  - [ ] 絶対法則を明記
  - [ ] 外部入力の扱いを明記
  - [ ] 禁止パターンを例示

**実施日**: 未実施

---

### Phase 5-6: ESLintルール追加

- [ ] .eslintrc.js更新
  - [ ] ExternalText.rawText条件判定禁止ルール追加
- [ ] npm run lint実行確認

**実施日**: 未実施

---

### Phase 5-7: CI統合

- [ ] .github/workflows/penta-shield.yml作成
  - [ ] L1-L3: TypeScript型チェック
  - [ ] L2: Semantic Guard テスト
  - [ ] L3: State Transition テスト
  - [ ] L4: Visual Regression Test
  - [ ] L5: External Input Isolation チェック

**実施日**: 未実施

---

### Phase 5-8: 検証

- [ ] 全自動テスト実行
  - [ ] TypeScript型チェック通過
  - [ ] Receipt/Clientテスト全Pass
  - [ ] ESLint Pass
- [ ] 手動検証
  - [ ] Storybook起動確認
  - [ ] システムプロンプト確認

**実施日**: 未実施

---

### Phase 5-9: ドキュメント更新

- [ ] TASK_MASTER.md更新（Phase 5完了を記録）
- [ ] walkthrough.md作成（Phase 5検証結果）
- [ ] git commit/push

**実施日**: 未実施

---

## ユーザー確認事項

> [!IMPORTANT]
> **L4の判定基準**
> - Layout Shift > 5% → CI Fail
> - **質問**: この5%基準は適切でしょうか？

> [!WARNING]
> **L5のシステムプロンプト配置**
> - **質問**: docs/prompts/system-prompt.md で良いでしょうか？

---

## 完了条件

- [ ] すべてのタスクチェックリスト完了
- [ ] ユーザーレビュー承認
- [ ] git commit/push完了
- [ ] TASK_MASTER.mdに完了記録

---

## 関連ドキュメント

- [phase5-l4l5-plan.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/phase5-l4l5-plan.md) - 詳細実装計画
- [ADR-004](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-004-penta-shield-defense-layers.md) - Penta-Shield定義
- [ADR-006](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-006-ui-ci-integration.md) - L4/L5詳細

---

**最終更新**: 2026-01-17
