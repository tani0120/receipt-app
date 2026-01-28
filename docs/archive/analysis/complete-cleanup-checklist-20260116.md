# プロジェクト全ファイル・フォルダ整理判定リスト【網羅版】

**作成日**: 2026-01-16  
**目的**: 網羅性を担保した整理方針の策定

---

## 判定基準

### **保持**
- 現在使用中
- プロジェクトの実行に必須
- 最新の設計・ドキュメント

### **移動**
- 古いが参考になる
- `docs/archive/`へ移動

### **削除**
- 完全に不要
- テスト・デバッグ用の一時ファイル
- バックアップ（git履歴で十分）

---

## プロジェクトルート全ファイル

### **.agent/workflows/**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `load_context.md` | **保持** | ワークフロー（使用中） |
| `sandbox_strategy.md` | **保持** | ワークフロー（使用中） |
| `self_correction_protocol.md` | **保持** | ワークフロー（使用中） |

---

### **.html**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `index.html` | **保持** | Viteのエントリーポイント |
| `sandbox.html` | **削除** | テスト用、不要 |
| `UI完成_20251217.html` | **移動** | 古いUI、freeze/へ移動 |

---

### **.js / .mjs**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `postcss.config.js` | **保持** | ビルド設定 |
| `tailwind.config.js` | **保持** | ビルド設定 |
| `_read_design_node.js` | **削除** | スクリプト、使用していない |
| `generate_chat_penance.js` | **削除** | 一時スクリプト |
| `generate_penance_final.js` | **削除** | 一時スクリプト |
| `generate_penance_v2.js` | **削除** | 一時スクリプト |
| `debug-mappings.mjs` | **削除** | デバッグ用 |

---

### **.json**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `package.json` | **保持** | 依存関係管理 |
| `package-lock.json` | **保持** | 依存関係ロック |
| `tsconfig.app.json` | **保持** | TypeScript設定 |
| `tsconfig.features.json` | **保持** | 新コード用設定 |
| `tsconfig.json` | **保持** | TypeScript設定 |
| `tsconfig.legacy.json` | **保持** | 旧コード用設定 |
| `tsconfig.node.json` | **保持** | Node用設定 |

---

### **.log**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `build_debug.log` | **削除** | デバッグログ |
| `build_error.log` | **削除** | エラーログ |
| `client_check.log` | **削除** | チェックログ |
| `firestore-debug.log` | **削除** | Firestoreデバッグ |
| `phase5_errors_full.log` | **削除** | エラーログ |
| `phase5_errors_screenE.log` | **削除** | エラーログ |
| `verify.log` | **削除** | 検証ログ |

---

### **.md**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `current.md` | **保持** | 現在の状況記録 |
| `README.md` | **保持** | プロジェクト説明 |
| `ui-freeze-appendix-a.md` | **移動** | freeze/へ移動（ADR-002に統合済み） |
| `ui-freeze-appendix-b.md` | **移動** | freeze/へ移動（ADR-002に統合済み） |
| `ui-freeze-binding.md` | **移動** | freeze/へ移動（ADR-002に統合済み） |
| `ui-freeze-policy.md` | **移動** | freeze/へ移動（ADR-002に統合済み） |

---

### **.ps1 / .py**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `setup_freeze_env.ps1` | **移動** | freeze/へ移動 |
| `_read_design_docs.py` | **削除** | 一時スクリプト |
| `refactor_script.py` | **削除** | 一時スクリプト |

---

### **.ts**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `env.d.ts` | **保持** | TypeScript型定義 |
| `eslint.config.ts` | **保持** | ESLint設定 |
| `vite.config.ts` | **保持** | Vite設定 |

---

### **.txt**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `build_log.txt` | **削除** | ビルドログ |
| `design_dump.txt` | **削除** | ダンプファイル |
| `penance_chat.txt` | **削除** | チャットログ |
| `test_output.txt` | **削除** | テスト出力 |

---

### **.xlsx / .yaml**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `00_管理用_AI会計システム本体.xlsx` | **保持** | **設計書（最重要）** |
| `10_実務用_ワークベンチ.xlsx` | **保持** | 実務用資料 |
| `ui-freeze-checklist.yaml` | **移動** | freeze/へ移動 |

---

### **.cjs**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `_read_context.cjs` | **削除** | 一時スクリプト |
| `debug_build.cjs` | **削除** | デバッグ用 |
| `fix_aaa_route_names.cjs.done` | **削除** | 完了済みスクリプト |
| `refactor_imports_final.cjs` | **削除** | 完了済みスクリプト |
| `refactor_imports_v2.cjs` | **削除** | 完了済みスクリプト |
| `refactor_imports_v3.cjs` | **削除** | 完了済みスクリプト |
| `refactor_script.cjs` | **削除** | 完了済みスクリプト |
| `.eslintrc.cjs` | **保持** | ESLint設定 |

---

### **.csv**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `test_data.csv` | **削除** | テストデータ |

---

## フォルダ

### **プロジェクトルート**

| フォルダ | 判定 | 理由 |
|---------|------|------|
| `.agent/` | **保持** | ワークフロー管理 |
| `.vscode/` | **保持** | VSCode設定 |
| `.git/` | **保持** | Git管理 |
| `dist/` | **保持** | ビルド出力（.gitignore済み） |
| `node_modules/` | **保持** | 依存関係（.gitignore済み） |
| `public/` | **保持** | 静的ファイル |
| `freeze/` | **調査中** | UI Freeze時のバックアップ |

---

### **docs/**

| フォルダ | 判定 | 理由 |
|---------|------|------|
| `docs/architecture/` | **保持** | 最新設計（ADR等） |
| `docs/sessions/` | **保持** | セッション記録 |
| `docs/archaeology/` | **移動** | `docs/archive/archaeology/`へ |
| `docs/design/` | **精査** | 一部古い、詳細確認が必要 |

---

### **src/**

| フォルダ | 判定 | 理由 |
|---------|------|------|
| `src/features/` | **保持** | 新コード（型安全） |
| `src/legacy/` | **調査中** | 段階的削除 |
| `src/components/` | **調査中** | 段階的削除 |
| `src/composables/` | **調査中** | 段階的削除 |
| `src/views/` | **調査中** | 段階的削除 |
| `src/backup_before_ironclad_v1/` | **削除** | バックアップ |
| `src/Mirror_sandbox/` | **削除** | サンドボックス |
| `src/mappings/` | **削除** | 古いマッピング |
| `src/docs/` | **移動** | `docs/ui_specs/`へ |

---

## src/個別ファイル

### **src/*.vue**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `src/App.vue` | **保持** | アプリのルートコンポーネント |
| `src/AaaLayout.vue` | **保持** | レイアウトコンポーネント |

---

### **src/*.ts**

| ファイル | 判定 | 理由 |
|---------|------|------|
| `src/main.ts` | **保持** | エントリーポイント |
| `src/client.ts` | **保持** | Firebaseクライアント |
| `src/firebase.ts` | **保持** | Firebase設定 |
| `src/firebase-admin.ts` | **保持** | Firebase Admin設定 |
| `src/server.ts` | **保持** | サーバー設定 |

---

## 網羅性の担保方法

### **1. 完全なリストアップ**

```powershell
# プロジェクトルート全ファイル
Get-ChildItem -Path . -File -Recurse | Select-Object FullName, Extension, LastWriteTime
```

### **2. 判定基準の明確化**

- 役割（必須、参考、不要）
- 最終更新日（古い、新しい）
- 使用状況（使用中、未使用）

### **3. チェックリスト化**

- [ ] プロジェクトルート全ファイル
- [ ] .agent/workflows/
- [ ] docs/全サブフォルダ
- [ ] src/全サブフォルダ
- [ ] 個別の.vue/.ts/.md/.log等

---

## 次のアクション（優先度順）

### **1. 削除（即実行可能）**

```bash
# ログファイル削除
git rm *.log

# 一時スクリプト削除
git rm _read_design_docs.py refactor_script.py
git rm generate_*.js debug-mappings.mjs
git rm *.cjs（.eslintrc.cjs以外）

# テストファイル削除
git rm test_data.csv test_output.txt
git rm sandbox.html
```

### **2. freeze関連をまとめる**

```bash
# freeze/へ移動
mv ui-freeze-*.md freeze/
mv ui-freeze-checklist.yaml freeze/
mv setup_freeze_env.ps1 freeze/
mv UI完成_20251217.html freeze/
```

### **3. src/削除・移動**

```bash
# 削除
git rm -r src/backup_before_ironclad_v1/
git rm -r src/Mirror_sandbox/
git rm -r src/mappings/

# 移動
mv src/docs/ui_specs docs/
git rm -r src/docs/
```

---

**この網羅的なリストで良いですか？**

それとも、さらに詳細な調査が必要ですか？
