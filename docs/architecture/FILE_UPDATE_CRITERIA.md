# ファイル更新判断基準（ADR-010作成時）

**作成日**: 2026-01-22

---

## フォルダ構造と役割

### プロジェクト全体のディレクトリ構造

```
docs/
├── architecture/          # 現行のアーキテクチャドキュメント（更新対象）
├── design/               # 設計ドキュメント（参照のみ）
├── sessions/             # セッション記録（参照のみ）
├── archive/              # 古いドキュメント（参照のみ、更新禁止）
│   ├── analysis/
│   ├── archaeology/
│   ├── philosophy/
│   └── rejected/
├── analysis/             # 分析ドキュメント（参照のみ）
└── tasks/                # タスクファイル（参照のみ）
```

---

## 更新したファイルの判断基準

### 更新対象（2ファイル）

| ファイル | 場所 | 理由 |
|---------|------|------|
| **READING_INDEX.md** | `docs/` | ✅ **現行の必読ファイルマスター**。すべてのADRを一覧化。常に最新状態を保つ。 |
| **SYSTEM_PHILOSOPHY.md** | `docs/architecture/` | ✅ **現行のシステム哲学**。AI モデルの記載があったため、ADR-010へのリンクを追加。 |

---

## 更新しなかったファイルの判断基準

### 1. `archive/` フォルダ（更新禁止）

**理由**: 歴史的資料。参照のみ。

| ファイル | 場所 | 判断理由 |
|---------|------|----------|
| `system_design.md` | `docs/archive/` | ❌ 古い設計書。「Gemini 1.5 Flash (Vision) を採用（予定）」の記載があるが、**archiveなので更新禁止**。 |
| `philosophy/DECISION_LOG_20260114.md` | `docs/archive/philosophy/` | ❌ 2026-01-14の判断ログ。歴史的記録。 |

---

### 2. `design/` フォルダ（参照のみ）

**理由**: 設計ドキュメント。UseCaseやDecision Logは記録であり、事後の更新は不適切。

| ファイル | 場所 | 判断理由 |
|---------|------|----------|
| `usecase-workbook.md` | `docs/design/` | ❌ UC-186「Vertex AI一択」の記載あり。**UseCaseは記録**なので、事後の更新は不適切。ADR-010で参照済み。 |
| `DECISION_LOG_TEMPLATE.md` | `docs/design/` | ❌ EVD-016「geminiの各プラン選択UI」の記載あり。**Decision Logは記録**なので事後の更新は不適切。 |
| `DEFERRED_USECASES.md` | `docs/design/` | ❌ 見送りUseCase一覧。**設計記録**なので更新不要。 |

---

### 3. `sessions/` フォルダ（参照のみ）

**理由**: 過去セッションの記録。歴史的資料。

| ファイル | 場所 | 判断理由 |
|---------|------|----------|
| `SESSION_20260121.md` | `docs/sessions/` | ❌ 2026-01-21のセッション記録。**歴史的記録**なので更新禁止。 |
| `UNRESOLVED_DISCUSSIONS.md` | `docs/sessions/` | ❌ 未解決議論。今回のADR-010は議論ではなく確定事項なので更新不要。 |

---

### 4. `analysis/` フォルダ（参照のみ）

**理由**: 分析ドキュメント。記録であり、事後の更新は不適切。

| ファイル | 場所 | 判断理由 |
|---------|------|----------|
| `ui-diff-admin-dg.md` | `docs/analysis/` | ❌ UI差分分析。「Gemini 1.5 Flash」の記載があるが、**分析記録**なので更新不要。 |

---

## 判断基準の明確化

### ✅ 更新すべきファイル

1. **現行のマスターファイル**
   - READING_INDEX.md
   - SYSTEM_PHILOSOPHY.md
   - ADR-XXX（現行のADR）

2. **条件**:
   - ✅ `docs/architecture/` にある
   - ✅ Status が「Accepted」または「現行」
   - ✅ 継続的に更新される性質のもの

---

### ❌ 更新してはいけないファイル

1. **歴史的記録**
   - `docs/archive/` 配下のすべて
   - `docs/sessions/` 配下のすべて
   - `docs/design/` 配下のDecision Log、UseCase

2. **条件**:
   - ❌ 過去の判断・議論の記録
   - ❌ 時系列で記録されたもの
   - ❌ 事後の更新が歴史の改ざんになるもの

---

## ADR-010作成時の具体的な判断

### grep検索結果（gemini、flash）

**検索結果**: 約180件

**内訳**:
- `docs/architecture/ADR-010-*`: ✅ 新規作成（自作）
- `docs/architecture/SYSTEM_PHILOSOPHY.md`: ✅ 更新（現行ドキュメント）
- `docs/READING_INDEX.md`: ✅ 更新（マスターファイル）
- `docs/design/usecase-workbook.md`: ❌ 更新不要（設計記録）
- `docs/archive/system_design.md`: ❌ 更新禁止（archive）
- `docs/archive/philosophy/DECISION_LOG_20260114.md`: ❌ 更新禁止（歴史的記録）

---

## フォルダ別の更新ルール

| フォルダ | 更新可否 | 理由 |
|---------|---------|------|
| `docs/architecture/` | ✅ **更新可能** | 現行のアーキテクチャドキュメント |
| `docs/` （トップレベル） | ✅ **更新可能** | マスターファイル（READING_INDEX.md等） |
| `docs/design/` | ❌ **参照のみ** | 設計記録、事後の更新は不適切 |
| `docs/sessions/` | ❌ **参照のみ** | セッション記録、歴史的資料 |
| `docs/archive/` | ❌ **更新禁止** | 古いドキュメント、歴史的資料 |
| `docs/analysis/` | ❌ **参照のみ** | 分析記録、事後の更新は不適切 |
| `docs/tasks/` | ❌ **参照のみ** | タスク記録 |

---

## 例外ケース

### 1. Superseded ADR

**例**: ADR-004, ADR-005, ADR-006, ADR-008

**更新内容**: Statusを「Superseded by ADR-009」に変更

**理由**: 
- ✅ Statusの更新は**メタデータ**であり、内容の改ざんではない
- ✅ 読者に「このADRは古い」ことを明示する必要がある
- ✅ ADRのライフサイクル管理の一部

---

### 2. READING_INDEX.md

**更新内容**: 新しいADRを追加

**理由**:
- ✅ **マスターファイル**の役割
- ✅ 常に最新の必読ファイル一覧を提供する必要がある
- ✅ 歴史的記録ではなく、現在の状態を示すもの

---

## まとめ

### 構造的な分離

**✅ 明確に分離されている**:

1. **現行ドキュメント** (`docs/architecture/`, `docs/` トップレベル)
   - 更新可能
   - 現在の設計・判断を反映

2. **歴史的記録** (`docs/archive/`, `docs/sessions/`, `docs/design/`)
   - 参照のみ
   - 事後の更新は不適切

---

### 今回の更新判断

**更新したファイル（2ファイル）**:
1. ✅ READING_INDEX.md（現行マスターファイル）
2. ✅ SYSTEM_PHILOSOPHY.md（現行ドキュメント、AI モデル記載）

**更新しなかったファイル（理由別）**:
1. ❌ `docs/archive/` - 歴史的資料
2. ❌ `docs/design/` - 設計記録（UseCase、Decision Log）
3. ❌ `docs/sessions/` - セッション記録
4. ❌ `docs/analysis/` - 分析記録

**判断基準は明確で、フォルダ構造と一致している。**
