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

### Phase 3: 利用シーン棚卸し → UIモック → 意味定義確定

**Phase 3の構造**:
- **Phase 3-A**: 利用シーン棚卸し（Human Use-Case Layer）
- **Phase 3-B**: UIモックフェーズ（意味を壊すためのUI）
- **Phase 3-C**: 意味定義の確定

---

#### **Phase 3-A: 利用シーン棚卸し**（次フェーズ）

**目的**:
- プロパティの意味・正しさを決めない
- **利用シーン（文脈）のみを固定する**
- 後続フェーズで意味定義表（property-integration-map.md）を再構築できる材料を揃える

**成果物**:
- `usecase-workbook.md`（新規）

**property-integration-map.mdの扱い**:
- ❌ Phase 3-Aでは一切編集しない
- 現在の「意味」列は仮置きとして扱う
- 意味の確定・更新はPhase 3-Cで行う

**黄金ルート（Step 1-3）**:

**Step 1: IDEの仕事**（機械向き）
- 意味定義表から**業務判断が匂う項目**を抽出
- それを**「問いの形」**に変換
- ❌ UseCaseを創作しない
- ❌ 意味を定義しない
- ❌ 想像で補完しない

**Step 2: 人間の仕事**（人間にしかできない）
- IDEが出した「問い」を眺める
- 実際の現場を思い出す
- 足りない・違う・ズレている部分を**自然言語で語る**

**Step 3: IDEの再投入**（翻訳フェーズ）
- 人間の自然言語をusecase-workbook.mdのフォーマットに落とす
- **清書係に徹する**

**役割分担（厳守）**:

| 作業 | 担当 |
|------|------|
| プロパティ棚卸し | IDE |
| 問いへの変換 | IDE |
| **業務の語り** | **人間** |
| UseCase整形 | IDE |
| 意味確定 | Phase 3-C |

**重要な原則**:
- UseCaseは「意味定義表を網羅する」ためではない
- しかし「最終的に336プロパティが"どこかの利用シーンに必ず帰属する"密度」で書く
- Entity は業務エンティティ（Client / Staff / Transaction）を使用
- Admin / System への再投影はPhase 3-CでAIが行う

**書いてはいけないこと（厳守）**:
- プロパティ名
- 型定義
- UIコンポーネント構成
- API / DB / 実装方式
- 正確性を前提とした数値定義

**Human Use-Case Table形式（必須）**:

成果物は**表形式**で記述する。文章形式は禁止。

**表の項目（9項目固定）**:

| 項目 | 内容 |
|---|---|
| **利用者** | 誰が使うか（経理担当／記帳代行／マネージャー 等） |
| **タイミング** | いつ（月初／月中／月末／突発対応 等） |
| **目的** | 何のために見る・使うか |
| **きっかけ** | 何が起きたらこの行動を取るか |
| **行動** | 画面上で何を確認・操作するか |
| **判断** | 何を見て、何を決めたいか |
| **許容曖昧さ** | 正確でなくてよい／傾向が分かればよい 等 |
| **間違うと困ること** | 誤ると何が起きるか |
| **代替手段** | 今はExcel／記憶／Slack 等で代替しているか |

**なぜ表形式か**:
- ✅ 比較できる（複数UseCase間で欠けている項目が分かる）
- ✅ 視覚的（欠けている項目が一目で分かる）
- ✅ 射影可能（後でproperty-integration-map.mdに対応付けられる）
- ❌ 文章だけだとAIが構造を誤解する

**禁止事項（IDE向け・厳守）**:
- ❌ プロパティ名を推測して埋めない
- ❌ 判断基準を数値化しない
- ❌ UI構成を確定させない
- ❌ 意味を決めない

**完了条件**:
- [ ] 主要業務フローがUseCaseとして記述されている
- [ ] 各UseCaseにおいて「判断」が明確に書かれている
- [ ] 後続フェーズでプロパティを過不足なく再構成できる密度がある

---

#### **Phase 3-B: UIモックフェーズ**

**目的**:
- 意味定義を確定しない
- **利用シーンが破綻する箇所を暴く**

**範囲**:
- Admin Settings全体はやらない
- **UseCaseに必要な画面だけ**

**UIモックの実装レベル**:
- 技術: Vue / HTML どちらでもOK
- スタイル: ダミーでOK
- データ: 仮データ
- 目的: 「あ、これ足りない」を出す

**重要**:
- 契約ではない
- Visual Guard対象外

---

#### **Phase 3-C: 意味定義の確定**

**目的**:
- UIで露呈したズレを反映
- **この時点で初めて** property-integration-map.mdの「意味」列を更新

**AIの仕事**:
```
for each property:
  find related UseCases
  if none:
    flag as orphan → 削除 or 再設計
```

**完了条件**:
- [ ] すべてのプロパティが少なくとも1つのUseCaseに帰属
- [ ] 孤立プロパティ（orphan）が明確化
- [ ] property-integration-map.mdの「意味」列が確定

---

**最終更新**: 2026-01-17

