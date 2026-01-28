# 古いコード整理戦略【実装計画】

**策定日**: 2026-01-16  
**目的**: 型安全を確保しながら、不要な古いコードを整理

---

## 背景

### 問題
- SYSTEM_PHILOSOPHY.mdが古い（実装と乖離）
- docs/に古い資料（system_design.md等）が混在
- src/legacy/に不要なコードが残存

### 原因
- 「最新の実装」と「哲学文書」の同期チェック不足
- 古い/新しいの判別基準が不明確

---

## 整理方針

### 1. docs/の整理

#### **フォルダ構造**

```
docs/
  architecture/
    README.md          ← ファイルステータス一覧
    SYSTEM_PHILOSOPHY.md
    CHANGELOG_SYSTEM_PHILOSOPHY.md
    ADR-001-type-safe-mapping.md
    ADR-002-gradual-ui-implementation.md
    ADR-003-legacy-cleanup-strategy.md  ← NEW
    archive/
      system_design.md（2025/12/27時点、参考のみ）
      old_*.md
  sessions/
    SESSION_INDEX.md
    SESSION_YYYYMMDD.md
```

#### **README.mdの内容**

```markdown
# ファイルステータス

## 最新（必読）
- SYSTEM_PHILOSOPHY.md - システム哲学
- ADR-001 - 型安全戦略
- ADR-002 - 段階的UI実装
- ADR-003 - 古いコード整理戦略

## 古い資料（archive/、参考のみ）
- system_design.md（2025/12/27時点）
- ⚠️ 実装とは乖離している可能性あり

## 削除予定
- （なし）
```

---

### 2. src/の整理

#### **現状の物理的分離（既に実現）**

```
src/
  features/       ← 新コード（型安全、strict）
  legacy/         ← 旧コード
  composables/    ← 旧コード
  components/     ← 旧コード
  views/          ← 旧コード
```

#### **実際の調査結果（完全版）**

```
src/
  features/                      ← 新コード（型安全）
  legacy/                        ← 旧コード
  components/                    ← 旧コード（47ファイル）
  composables/                   ← 旧コード（22ファイル）
  views/                         ← 旧コード（26ファイル）
  
  削除候補（高優先度）:
    backup_before_ironclad_v1/   ← バックアップ（81ファイル）
    Mirror_sandbox/              ← サンドボックス（80ファイル）
    mappings/                    ← 古いマッピング（1ファイル）
  
  移動候補:
    docs/ui_specs/               ← UI仕様（11ファイル）→ プロジェクトルートのdocs/へ
```

#### **調査が必要**

| フォルダ | 場所 | 理由 |
|---------|-----|------|
| `freeze/` | プロジェクトルート | UI Freeze時の「正」の可能性 |
| `docs/archaeology/` | docs/ | 古い調査ファイル（.txt） |

#### **判別方法**

| 場所 | ステータス | 型チェック | ESLint |
|------|----------|-----------|--------|
| `src/features/` | **新コード** | tsconfig.features.json（strict） | import legacy禁止 |
| `src/legacy/` | **旧コード** | tsconfig.legacy.json（緩い） | import features禁止 |

---

## 段階的整理手順（具体版）

### **Step 1: 明らかに不要なものを削除**

#### **削除対象**

| フォルダ/ファイル | 削除理由 | サイズ |
|-----------------|---------|--------|
| `src/backup_before_ironclad_v1/` | バックアップ（git管理されている） | 81ファイル |
| `src/Mirror_sandbox/` | 実験用サンドボックス | 80ファイル |
| `src/mappings/` | 古いマッピング（Lv.2.5で不要） | 1ファイル |

#### **安全な削除手順**

```bash
# 1. 使用箇所確認
grep -r "backup_before_ironclad_v1" src/
grep -r "Mirror_sandbox" src/
grep -r "mappings" src/
# → 結果：使用箇所なし

# 2. 型チェック（削除前）
npm run type-check
# → エラーなし

# 3. 削除実行
git rm -r src/backup_before_ironclad_v1/
git rm -r src/Mirror_sandbox/
git rm -r src/mappings/

# 4. 型チェック（削除後）
npm run type-check
# → エラーなし

# 5. ESLintチェック
npm run lint
# → エラーなし

# 6. コミット
git commit -m "chore: remove unused backup, sandbox, and old mappings"
```

---

### **Step 2: src/docs/をプロジェクトルートへ移動**

#### **移動対象**

```
src/docs/ui_specs/ → docs/ui_specs/
```

#### **手順**

```bash
# 1. 移動
mv src/docs/ui_specs docs/

# 2. src/docs/削除（空になったため）
git rm -r src/docs/

# 3. コミット
git commit -m "refactor: move UI specs from src/docs to docs/"
```

---

### **Step 3: freeze/の調査と判断**

#### **freeze/とは？**

```
プロジェクトルート/
  freeze/
    ScreenA/
    ScreenB/
    ScreenC/
    ...（全画面の.vue/.tsファイル）
```

**可能性**:
1. UI Freeze時の「正」のバックアップ
2. 参照用のスナップショット
3. 不要な古いコード

#### **調査項目**

```bash
# 1. freeze/README.mdを確認
cat freeze/README.md

# 2. freeze/とsrc/の差分確認
diff -r freeze/ScreenA src/features/

# 3. 最終更新日時確認
ls -lt freeze/
```

#### **判断基準**

| 調査結果 | 判断 | アクション |
|---------|------|----------|
| 「Freeze時の正」と明記 | **残す** | 参照用として保持 |
| src/と同期している | **削除** | git履歴で十分 |
| 古いコードのみ | **archive/** | 念のため保存 |

---

### **Step 4: docs/archaeology/をarchive/へ移動**

#### **移動対象**

```
docs/archaeology/ → docs/archive/archaeology/
```

#### **手順**

```bash
# 1. archive/ディレクトリ作成
mkdir -p docs/archive

# 2. 移動
mv docs/archaeology docs/archive/

# 3. コミット
git commit -m "docs: archive old archaeology files"
```

---

## リスク管理

### **リスク分析**

| リスク | 発生確率 | 影響度 | 対策 |
|--------|---------|--------|------|
| **誤削除** | 低 | 高 | grep調査 + 型チェック + git管理 |
| **隠れた依存** | 中 | 中 | ESLintが検知（import禁止） |
| **ビルド失敗** | 低 | 中 | npm run type-checkで検証 |
| **実行時エラー** | 低 | 高 | 段階的削除 + コミット分割 |

### **ロールバック手順**

```bash
# 削除直後にエラーが発生した場合
git revert HEAD
npm run type-check
```

---

## 型安全が整理を助ける理由

### **1. 物理的分離**

- features/とlegacy/はESLintで相互import禁止
- 削除してもfeatures/に影響なし

### **2. 型チェック**

```bash
# features/のみチェック（strictモード）
npm run type-check:features
→ 削除したファイルがfeaturesに影響していたらエラー

# legacy/のみチェック
npm run type-check:legacy
→ legacy内での影響を確認
```

### **3. 自動検知**

- ESLintが不正なimportを検知
- TypeScriptが型エラーを検知
- ビルドが失敗したらすぐ分かる

---

## 最新性チェックルール（追加）

### **session-management-protocol-complete.mdに追記**

```markdown
9. 【義務】SYSTEM_PHILOSOPHY.md更新時の最新性チェック

データモデル更新時、必ず以下を確認：

1. **実装ファイル（Single Source of Truth）**
   - src/features/**/*Schema.ts
   - 型定義が最も正確

2. **設計書・議論記録**
   - SESSION_YYYYMMDD.md（確定した仕様）
   - ADR-XXX.md（設計決定）

3. **古い参考資料**
   - docs/system_design.md（参考のみ、最新性なし）

チェック順序：
実装 > 議論記録 > 設計書 > 古い資料

チェック漏れ防止：
- AIが「実装ファイルを確認しましたか？」と自問
- 確認したファイルパスを明記
```

---

## 次のアクション

### **優先度高**
1. docs/architecture/README.md作成
2. docs/architecture/archive/作成、system_design.md移動
3. ADR-003作成（本ファイルを基に）

### **優先度中**
4. Phase 1（調査）実行
5. 削除候補リスト作成

### **優先度低**
6. Phase 2（段階的削除）実行
7. Phase 3（機能移行）実行

---

**承認されますか？**
