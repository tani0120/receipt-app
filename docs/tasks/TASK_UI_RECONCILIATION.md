# TASK: UI統合（Phase 5前の必須作業）

**作成日**: 2026-01-17  
**最終更新**: 2026-01-17  
**ステータス**: 計画中  
**優先度**: 🔥 最高（Phase 5ブロッカー）  
**親タスク**: TASK_MASTER.md - Penta-Shield実装  
**関連**: ADR-002、ADR-004、TASK_PHASE5_L4L5.md

---

## 目的

**Phase 5（L4 Visual Guard）の前提条件を確立する**

### 問題の本質

- 公開URL（Cloud Run）: 80%正しい（実運用の痕跡）
- ローカルURL: 20%正しい（前AIが混乱した修正）
- **L4 Visual Guardは「このUIが契約」= 契約すべきUIが存在しない**

### なぜ最優先か

> Phase 5でやること = Visual Guard（UIを契約にする）  
> 今の状態で進むと = **バグを永久保存する**

---

## 作業手順（Phase 0: 世界線の統合）

### 前提状況

**公開URL**:
- admin-settings（Screen Admin）: 80%正しい（実運用の痕跡）
- DG: おおむね正しい
- Screen E等: 全然ダメ

**ローカルURL**:
- admin-settings、DG: 20%正しい（前AIが混乱）
- Screen E等: 全然ダメ

**議論済み**:
- 顧問先プロパティ: 整合性取れた
- 担当者プロパティ: 整合性取れた

---

### Phase 1: 公開UI × ローカルUI 差分分析（最優先）

**対象**: admin-settings、DG（公開スクリーン）

**理由**: 公開URL側が80%正しい、業務実績・人間の修正痕跡がある

**タスク**:
- [ ] 公開URL（admin-settings）にアクセス
- [ ] ローカルURL（admin-settings）にアクセス
- [ ] 表示項目差分をリストアップ
  - [ ] プロパティ名
  - [ ] 表示条件
  - [ ] デフォルト値
  - [ ] 並び順
- [ ] 公開URL（DG）で同様の作業
- [ ] 差分分析結果を`docs/analysis/ui-diff-admin-dg.md`に記録

**禁止事項**:
- ❌ この段階でUIを修正
- ❌ 「こっちの方が良さそう」判断

**成果物**: `docs/analysis/ui-diff-admin-dg.md`（存在が確認できたプロパティ一次確定）

---

### Phase 2: 議論で整合が取れたプロパティを合流（第二優先）

**対象**: 顧問先プロパティ、担当者プロパティ

**タスク**:
- [ ] Phase 1で洗い出したプロパティと突き合わせ
- [ ] 重複／意味ズレ／名前ズレを調整
- [ ] 概念定義を1行で言える状態にする
- [ ] 統合プロパティ定義を`docs/design/core-properties.md`に記録

**成果物**: `docs/design/core-properties.md`（中核ドメインのプロパティ定義完成）

**重要**: この時点でも❌Freezeしない（Temporary Freeze前）

---

### Phase 3: ダメなスクリーン群（E系など）を「再定義対象」に格下げ

**対象**: Screen E等（公開もローカルも信用できない）

**タスク**:
- [ ] Phase 1-2で確定したプロパティを前提条件にする
- [ ] Screen E等を「再定義対象」としてマーク
- [ ] 議論しながら、UIを直しながら必要なプロパティを掘り起こす
- [ ] `docs/design/screen-e-redesign.md`に設計を記録

**重要**: ここは設計生成フェーズ（観測ではなく創造）

---

### Phase 4: ローカルUI修正（admin-settings、DG）

**対象**: admin-settings、DG

**タスク**:
- [ ] ローカルUIを統合設計（Phase 2の成果物）に合わせて修正
- [ ] 公開UIとの差分がすべて説明可能な状態
- [ ] 全項目が説明可能な状態を確認

**成果物**: ローカルUI（統合設計準拠）

---

### Phase 5: 検証

**タスク**:
- [ ] ローカルUIで全項目確認
- [ ] 「なぜ存在するか不明」な項目がゼロ
- [ ] 公開UIとの差分が説明可能
- [ ] walkthrough.mdに検証結果を記録
- [ ] git commit/push

**成果物**: 検証レポート（walkthrough.md）

---

## Freeze の位置

| フェーズ | Freeze |
|---------|--------|
| admin / DG 統合後 | ❌ Freezeしない |
| 中核プロパティ定義完了 | ✅ Temporary Freeze |
| UIで全スクリーン確認後 | ✅ Full Freeze |

---

## Phase 5進行可能条件

- [ ] 公開UI観測ログ完成
- [ ] ローカルUI項目リスト完成
- [ ] 統合設計書完成
- [ ] ローカルUI修正完了
- [ ] 全項目が説明可能
- [ ] TASK_MASTER.mdに「AI破壊ログ」記録

---

## AI破壊ログ（TASK_MASTER.md記録用）

```markdown
### [2026-01-17] admin-settings UI 分裂

- **レイヤー**: L4準備（Visual Guard前）
- **事象**: 公開UIとローカルUIが乖離（公開80%正、ローカル20%正）
- **原因**: 複数AI（Gemini）による文脈非同期修正、正の参照点を定義しないままデバッグ
- **本来の正解**: 公開UIを観測→統合設計→ローカルUI修正
- **AIの癖**: 「直しているつもり」で多世界分岐を作る
- **是正策**: 公開UIを不可侵の「事実」として扱う、ローカルUIは統合設計に従って再構築
```

---

## 🟢 完了

### Phase 0: プロパティレベルチェックリスト作成（2026-01-17完了）

**実施内容**:
- [x] complete-property-checklist.md作成（全644行）
- [x] ソースコード解析（template, script, schema, types の4レイヤー）
- [x] 公開URL観察（Pinia認証回避128ステップ）
- [x] 全8画面（Screen A-H + admin）のプロパティ抽出完了

**成果**:
- Screen A: ClientUi型 50+プロパティ
- Screen B: JobUi型 80+プロパティ
- Screen C-H: 各種業務プロパティ
- **驚くべき結果**: Admin Settings以外の主要画面（A-H）は致命的な差分なし
- **最大の不整合点**: Admin Settingsに重大な差分あり（Phase分離設定、GCS Bucket、ジョブ間隔等）

**成果物**: [complete-property-checklist.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/analysis/complete-property-checklist.md)

---

### Phase 2: プロパティ統合マップ作成（2026-01-17完了）

**実施内容**:
- [x] property-integration-map.md作成（全336プロパティマッピング）
- [x] Client/Job/Admin/Systemドメイン別マッピング
- [x] 議論済みプロパティ体系（PROPERTY_CATALOG, ADR-004/005）との突き合わせ
- [x] 各プロパティの議論結果・Lレイヤー帰属・対応アクション明確化
- [x] Freeze可能範囲とPENDING項目の完全可視化
- [x] implementation_plan.md作成（Admin/System統合計画）
- [x] task.md更新（Phase 11追加）

**発見**:
- ✅ Freeze可能（即座に実装可）:
  - Client基本情報: 17プロパティ（L1-L3実装済み）
  - Job全体: 80+プロパティ（State Machine/Semantic Guard実装必要）
  - Screen C-H全体: 30+プロパティ
- ⚠️ PENDING（人間判断が必要）:
  - Admin/System: 12プロパティ（運用ポリシーL0レベル）
  - Client税務設定: 11プロパティ（計算ロジックに直結）
- 🚫 廃止候補:
  - `담당자Id`: 韓国語プロパティ（削除 or rename）
  - `debugMode`: 本番環境では削除すべき

**成果物**:
- [property-integration-map.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/analysis/property-integration-map.md)
- [phase2-admin-integration-plan.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/phase2-admin-integration-plan.md)

---

## 🟡 次のステップ

### Phase 3: Admin/System設定統合（PENDING項目の判断）

**ブロッカー**: ユーザーの判断が必要

**判断待ち項目**:
1. `phase1_aiProvider`等（公開のみ）: ローカルに統合すべきか？
2. `jobRegistrationInterval`等（ローカルのみ）: 本番環境で必要か？
3. Client税務設定: UI反映すべきか？
4. `담당자Id`（韓国語）: 削除 or rename？

**判断後のアクション**:
- [ ] Full Freeze判定
- [ ] Admin/System設定のローカルUI修正
- [ ] Client税務設定のUI反映（必要な場合）
- [ ] 韓国語プロパティの削除 or rename
- [ ] State Machine/Semantic Guard実装（Job）

---

**最終更新**: 2026-01-17

