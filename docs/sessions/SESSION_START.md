# セッション開始ガイド - 必読

**作成日**: 2026-02-03  
**最終更新**: 2026-02-03  
**目的**: 新しいセッション開始時に AI が全体像を迅速に理解するためのガイド

---

## 🎯 プロジェクト概要

### **システム名**
自己改善型AI会計処理プラットフォーム

### **本質**
**「入力」から「監査」へ (From Entry to Audit)**
- 手作業の仕訳入力を廃止
- AI が仕訳案を生成
- 税理士が確認・承認する監査業務へシフト

### **ゴール**
Google Drive に領収書を放り込むだけで、会計ソフトに手直しなしでインポート可能な完全なCSVが生成される

---

## 💡 コンセプトと理念

### **自己改善型の仕組み**

```
1. 初期学習（Phase 7）
   過去の仕訳CSV → 統計処理 → 初期知識プロンプト・学習ルール生成
   
2. 継続学習（Phase 6.2以降）
   AIの提案 vs 税理士の修正 → 差分分析 → 学習ルール更新
   
3. 人間承認（必須）
   AI が勝手に学習するのではなく、人間が承認したルールのみを知識として蓄積
```

### **RAG（知識注入）の3層構造**

1. **共通ルール**: 全社的な経理規定（例: 10,000円以上の飲食費は交際費）
2. **個別ルール（知識プロンプト）**: 顧問先ごとの慣習（例: A社は駐車場代を旅費交通費に）
3. **学習ルール**: 過去の修正パターン（例: 「駐車場」→「旅費交通費」）

**参照**: [SYSTEM_PHILOSOPHY.md L144-146](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md#L144-L146)

---

## 📊 現在の進捗状況

### **Phase 6.1 - DriveFileListUI 実装中**

| ステップ | 内容 | 状態 |
|---------|------|------|
| Step 1-2 | UI契約定義 | ✅ 完了 |
| **Step 3** | **Mock Composable** | **👈 次のタスク** |
| Step 4 | Dumb View | ⏸️ 未着手 |
| Step 5 | Real Composable | ⏸️ 未着手 |

**完了条件（Phase 6.1）**:
- ✅ Drive API で実ファイル一覧取得
- ✅ Gemini API で実OCR実行
- ✅ jobId 生成
- ✅ ScreenE に遷移

---

## 📚 必読ファイル一覧（優先順位順）

### **最優先（毎回必読）**

1. **[SESSION_START.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_START.md)** ← 本ファイル
   - 全体像・理念・進捗を記載

2. **task.md**（brain/ ディレクトリ内、会話IDごと）
   - 現在のタスクチェックリスト
   - 完了/未完了の確認

3. **phase6_step2_drivefilelist_contract.md**（brain/ 内）
   - DriveFileListUI の責務と仕様
   - Props 定義・型定義・API仕様

### **設計思想（初回セッションで必読）**

4. **[SYSTEM_PHILOSOPHY.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md)**
   - アーキテクチャ全体像
   - AI×人間の協働モデル

5. **[SESSION_20260202.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260202.md)**
   - 前回セッションの記録
   - AIの失敗と反省（重要な教訓）

### **参考資料（全体像把握用）**

**注意**: 時系列はめちゃくちゃだが、おおむね全体像を掴むには良い。これは正ではなく、参照にとどめよ。

#### **分析系**
- [ui-column-modal-checklist.md](file:///C:/Users/kazen/OneDrive/デスクトッ プ/ai_gogleanti/docs/analysis/ui-column-modal-checklist.md)
- [property-integration-map.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/analysis/property-integration-map.md)
- [complete-property-checklist.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/analysis/complete-property-checklist.md)
- [ui-diff-admin-dg.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/analysis/ui-diff-admin-dg.md)

#### **アーキテクチャ系**
- [ADR-002-gradual-ui-implementation.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-002-gradual-ui-implementation.md)

#### **アーカイブ系**
- [truth-in-lies.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/archive/philosophy/truth-in-lies.md)
- [system_design.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/archive/system_design.md) - GAS時代の設計書

#### **設計系**
- [client-ui-requirements.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/client-ui-requirements.md)
- [Q1-detailed-investigation.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/Q1-detailed-investigation.md)
- [Q1-implementation-complete.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/Q1-implementation-complete.md)
- [Q1-Q2-complete-next-steps.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/Q1-Q2-complete-next-steps.md)
- [Q1-schema-integration.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/Q1-schema-integration.md)
- [Q2-accounting-software.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/Q2-accounting-software.md)
- [Q3-staff-master.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/Q3-staff-master.md)
- [ScreenA-data-contract.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/ScreenA-data-contract.md)

#### **実装系**
- [step3_ai_implementation_full.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/implementation/step3_ai_implementation_full.md)
- [step3_validation_issues.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/implementation/step3_validation_issues.md)

#### **セキュリティ系**
- [SESSION_git_trouble_history.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_git_trouble_history.md) - Git関連トラブル全履歴と教訓

#### **その他**
- [DEPLOY_MASTER.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/DEPLOY_MASTER.md)

---

## ⚠️ 重要なルール（厳守）

### **1. OneDrive配下で作業しない（厳守）**

```
❌ C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti
   → ドキュメント・設計書の保管場所（読み取り専用）
   
✅ C:\dev\receipt-app
   → 実際のプロジェクトコード（すべての編集はここで実施）
```

#### **OneDrive使用禁止の技術的理由**

##### **問題1: EPERM（Operation Not Permitted）エラー**

**症状**:
```bash
npm ci
# エラー:
# EPERM: operation not permitted, rename 'C:\Users\kazen\OneDrive\...\node_modules\.staging\...'
```

**原因**:
1. **OneDrive同期プロセスによるファイルロック**
   - OneDriveがファイルを同期中にロック
   - npmがnode_modulesを削除・作成しようとして衝突
   - Windows特有の排他ロック問題

2. **複数プロセスの競合**
   - 開発サーバー（npm run dev）がファイル監視
   - OneDrive同期がファイルアクセス
   - Gitがファイル状態をチェック
   → 3つのプロセスが同時にファイルアクセスして競合

**影響**:
- **`npm ci` / `npm install` が失敗**
  - 意味: 依存関係のインストールコマンドが途中でエラー停止
  - 結果: node_modulesが作成されず、プロジェクトが起動不可（`npm run dev`等が実行できない）
  - 具体例: `EPERM: operation not permitted, rename ...`
  
- **`package-lock.json` の更新が失敗**
  - 意味: 新しいパッケージ追加時（`npm install axios`等）にpackage-lock.jsonへの書き込みが失敗
  - 原因: OneDriveがファイルをロック中
  - 結果: package-lock.jsonが破損し、次回の`npm ci`が失敗
  
- **ビルドが途中で失敗**
  - 意味: `npm run build`がエラーで停止
  - 原因: ビルド中にnode_modulesへのアクセスが拒否される

##### **問題2: ReadOnly属性の残存**

**症状**:
```bash
git checkout main
# エラー:
# error: unable to unlink old 'src/types/firestore.ts': Permission denied
```

**checkoutとは**:
- `git checkout main` = 「mainブランチに切り替える」コマンド
- 仕組み:
  1. 現在のブランチのファイルを削除
  2. mainブランチのファイルに置き換える
  3. 作業ディレクトリをmainブランチの状態にする

**checkoutが失敗する**:
- Gitが古いファイルを削除しようとする
- OneDriveがファイルにReadOnly属性を付与している
- Windowsが削除を拒否（`Permission denied`）
- 結果: ブランチ切り替えができず、**中途半端な状態**で停止
  - 一部のファイルは削除済み
  - 一部のファイルは古いまま
  - プロジェクトが壊れた状態

**原因**:
- OneDriveが同期したファイルにReadOnly属性が付与される
- Gitが古いファイルを削除できない
- checkout操作全体が失敗

**解決策（実施済み）**:
```powershell
# ReadOnly属性を一括除去
attrib -R C:\dev\receipt-app\* /S /D
```

##### **問題3: package-lock.json破損**

**症状**:
```bash
npm ci
# エラー:
# npm error Missing: get-intrinsic@1.3.0 from lock file
```

**npm ciとは**:
- `ci` = Continuous Integration（継続的インテグレーション）
- package-lock.jsonに記載された**完全に同じバージョン**で依存関係をインストール
- node_modulesを一旦削除してから、クリーンインストール
- **再現性**を保証するためのコマンド

**npm install との違い**:
| コマンド | package-lock.json | node_modules | 速度 | 用途 |
|---------|------------------|--------------|------|------|
| npm ci | **厳密に従う** | 削除してから作成 | 速い | CI/CD、本番環境 |
| npm install | 参考程度 | 既存を保持 | 遅い | 開発中の依存追加 |

**原因**:
- OneDrive同期中にpackage-lock.jsonが変更される
- 同期の途中でファイルが破損（中途半端な状態で書き込み）
- npmが整合性チェックに失敗
- 結果: `Missing: パッケージ名` エラー

**過去の実例**:
- 2026-01-30: feature-restorationブランチでのnpm ci失敗
- 原因: OneDrive同期中のpackage-lock.json破損
- 対策: C:\devに移動してからは発生せず

**重要な疑問: OneDriveとC:\devに同じコードがあるのに、なぜ両方で型エラーが出るのか？**

答え: **実は完全に同じではない**

```
C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti
  ↑ 過去（2026-01-27頃）のコピー、その後更新されていない（古い）

C:\dev\receipt-app
  ↑ 現在の作業ディレクトリ、最新のコード
```

**なぜ両方で型エラーが出るのか**:
- 型定義ファイル（`firestore.ts`等）は両方に存在
- TypeScriptの型チェック（`npm run type-check`）はソースコードのみをチェック
- node_modulesは関係ない
- だから、**古いコードでも新しいコードでも「型エラー」は検出できる**

**なぜ両方でWebアプリが表示されるのか**:
- 開発サーバー（`npm run dev`）を起動している**方**が表示される
- C:\devで起動していれば、C:\devのコードが表示される
- OneDrive配下で起動していれば、OneDrive配下のコードが表示される
- 同時には起動できない（ポート5173が競合）

**重要**: OneDrive配下は古いため、**現在の開発には使うべきでない**

##### **問題4: Gitブランチマージ失敗**

**症状**:
```bash
git merge feature-restoration
# 競合発生（意図しない）
# OneDrive側の変更が勝手にstaging
```

**原因**:
1. **OneDrive同期が未完了の状態でGit操作**
   - OneDriveがファイル同期中
   - Gitが変更を検知
   - 誤った競合として扱われる

2. **AIによる誤編集**
   - AIがOneDrive配下を作業ディレクトリと誤認
   - C:\dev\receipt-appとOneDrive配下が異なる状態
   - マージ時に意図しない差分が発生

**過去の実例**:
- 2026-02-02: OneDrive配下のファイルを誤編集
- 影響: 4ファイル（zod_schema.ts, firestore.ts, ui.type.ts, ClientMapper.ts）
- 復旧: git checkoutで30分

##### **問題5: Git履歴の混乱**

**症状**:
- コミット履歴が2重になる
- OneDrive側とC:\dev側で異なる履歴
- どちらが正しいか不明

**原因**:
- OneDrive配下で作業 → コミット
- 後でC:\dev\receipt-appで作業 → 別のコミット
- 2つのリポジトリが並存
- feature-restorationブランチの混乱の一因

##### **問題6: 開発サーバーの不安定性**

**症状**:
```bash
npm run dev
# 5-6時間稼働後に突然停止
# または、ホットリロードが効かなくなる
```

**原因**:
- OneDrive同期がnode_modulesを監視対象に
- ファイル監視の数がWindows上限を超過
- 開発サーバーが不安定化

**対策（C:\dev移動後）**:
- ✅ OneDrive除外設定
- ✅ Windows Defender除外設定
- ✅ 開発サーバーの安定性向上

##### **問題7: ビルド時間の増加**

**症状**:
- OneDrive配下: ビルド時間 3-5分
- C:\dev: ビルド時間 30秒-1分

**原因**:
- OneDriveがファイルアクセスを監視
- ウイルススキャンが都度実行される
- I/O性能が大幅に低下

#### **セッション開始時の確認項目**

**必ず確認すること**:

1. **作業ディレクトリの確認**
   ```powershell
   pwd
   # 期待値: C:\dev\receipt-app
   # ❌ C:\Users\kazen\OneDrive\... → 即座にC:\devに移動
   ```
   
   **なぜ実施すべきか**:
   - **過去の失敗**: 2026-02-02にAIがOneDrive配下で誤編集（4ファイル破損、復旧30分）
   - **リスク**: 間違ったディレクトリで作業 → 古いコードを編集 → 最新コードとの競合
   - **予防効果**: 即座に正しいディレクトリに移動すれば、誤編集を完全に防止

2. **OneDrive同期状態の確認**
   ```powershell
   Get-Process OneDrive -ErrorAction SilentlyContinue
   # 推奨: 開発中はOneDriveを一時停止
   ```
   
   **なぜ実施すべきか**:
   - **過去の失敗**: 2026-01-30にOneDrive同期中のEPERMエラーで`npm ci`失敗
   - **リスク**: OneDrive同期中のファイルロック → npm操作失敗 → 開発停止
   - **予防効果**: OneDrive停止中なら、ファイルロック問題が発生しない

3. **ReadOnly属性の確認**
   ```powershell
   Get-ChildItem C:\dev\receipt-app -Recurse | Where-Object { $_.Attributes -band [System.IO.FileAttributes]::ReadOnly }
   # 期待値: 0件
   # もし存在する場合: attrib -R C:\dev\receipt-app\* /S /D
   ```
   
   **なぜ実施すべきか**:
   - **過去の失敗**: OneDriveがReadOnly属性を付与 → `git checkout`失敗（ブランチ切り替え不可）
   - **リスク**: Gitが古いファイルを削除できない → 中途半端な状態でプロジェクト破損
   - **予防効果**: 事前に属性除去すれば、Git操作が正常に動作

4. **Git状態の確認**
   ```bash
   git status
   # 期待値: clean or 既知のuntracked files
   # ❌ OneDrive配下のファイルが変更されている → 誤ったディレクトリで作業
   ```
   
   **なぜ実施すべきか**:
   - **過去の失敗**: 2026-01-29にfeature-restorationマージ失敗（OneDrive/C:\dev間の履歴混乱）
   - **リスク**: 意図しない変更がstaging → 誤ったコミット → Git履歴汚染
   - **予防効果**: 変更がないことを確認 → クリーンな状態で作業開始

5. **npm依存関係の確認**
   ```bash
   npm ci
   # EPERMエラーが出る場合:
   # 1. OneDrive同期を停止
   # 2. nodeプロセスを停止
   # 3. 再実行
   ```
   
   **なぜ実施すべきか**:
   - **過去の失敗**: 2026-01-30にpackage-lock.json破損で`npm ci`失敗
   - **リスク**: 依存関係が壊れたまま開発 → ビルドエラー → 型チェック失敗
   - **予防効果**: 
     - 依存関係が正常にインストールされることを確認
     - プロジェクトが起動可能な状態であることを保証
     - EPERMエラーを早期発見 → OneDrive停止で即座に解決

#### **過去の失敗事例まとめ**

| 日付 | 問題 | 原因 | 対策 |
|------|------|------|------|
| 2026-02-02 | OneDrive誤編集 | AIがOneDrive配下を作業ディレクトリと誤認 | SESSION_START.mdに明記 |
| 2026-01-30 | npm ci失敗（EPERM） | OneDrive同期中のファイルロック | C:\devに移動 |
| 2026-01-30 | package-lock.json破損 | OneDrive同期中の破損 | C:\devに移動 |
| 2026-01-29 | feature-restorationマージ失敗 | OneDrive/C:\dev間の履歴混乱 | C:\dev単一化 |

**参照**: 
- [SESSION_20260202.md - OneDrive誤編集の復旧](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260202.md#L155-L179)
- [SESSION_git_trouble_history.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_git_trouble_history.md) - Git関連トラブル全履歴

---

### **2. task.md と implementation_plan.md の命名規則**

**禁止**: brain ディレクトリに `task.md`, `implementation_plan.md` という名前で保存

**理由**: プロジェクトディレクトリに同名ファイルが存在するため、混同を避ける

**正しい命名**:
- ✅ `task_phase6.md`
- ✅ `implementation_plan_phase6.md`
- ✅ `task_drivefilelist.md`

---

### **3. 型安全性の維持**

**baseline: 231エラー（Phase 5で確定）**
- ✅ これ以下に減らすことが目標
- ❌ 新規コードで any 型を使わない
- ✅ TypeScript + Zod で厳格な型チェック

**any 型の例外（承認済み）**:
- [firestore.ts L306, 382, 383](file:///C:/dev/receipt-app/src/types/firestore.ts#L382-L383) - 監査ログの any（承認済み）

---

### **4. 最新性担保ルール**

**原則**:
- 古い情報は削除
- 変更履歴は保持（トレーサビリティ）

**削除前のルール**:
1. 削除する内容を明示
2. ユーザーの承認を得る
3. 変更履歴に記録

---

### **5. エラー解消を後回しにしない**

**参照**: [SESSION_20260201.md L68-80](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260201.md#L68-L80)

**教訓**:
- エラーを解消せずに進めると「意味のある負債」が蓄積
- Phase 4 Part 3 のように「待機フェーズ」として残すことは可能だが、明確な理由が必要
- 再開条件を明文化する

**ルール**:
1. **エラーは原則として即座に解消**
   - baseline増加は即revert
   - 型エラーは放置しない

2. **待機フェーズとして残す場合**
   - 明確な理由を記録（例: UI設計後に再度型修正が必要）
   - 再開条件を明文化
   - task.md に状態を明記（⏸️ スキップ）

3. **「意味のあるノイズレベル」の定義**
   - 残っているエラーが実装途中・TODO明示あり・将来設計に依存
   - 「なぜ出ているか」を人間が即説明できる
   - 数値をゴールにしない（「エラー1件 = 判断1件」が達成条件）

---

### **6. 機密情報の取り扱い**

**参照**: [SESSION_20260129.md L1-100](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260129.md#L1-L100)

**過去の問題**:
- APIキー、テストユーザーID/パスワードがハードコードされていた
- Git履歴に機密情報が残っていた
- 332ファイル、59,736行の大規模修正が必要だった

**ルール**:
1. **機密情報をコードに含めない**
   - APIキー: 環境変数（`.env`）に記載
   - テストユーザー: `admin@example.com` 等のダミーに変更
   - サービスアカウントキー: `.gitignore` に追加

2. **既存の機密情報を削除**
   - `users.json` - パスワードハッシュ
   - `create_user_browser.js` - 平文パスワード
   - `check_firebase_user.js` - テストユーザーID

3. **docs/ ディレクトリの機密情報**
   - プレースホルダーに置換（`[REDACTED]`, `***REMOVED***`）

4. **Git履歴のクリア**
   - 流出した場合は即座にキーを再発行
   - Git履歴から削除（`git filter-branch` 等）は最終手段

---

## 🔄 GAS時代との違い

### **旧: GAS・スプレッドシート中心**
- データベース: Google Spreadsheet
- UI: スプレッドシート上で操作
- バックエンド: GAS がすべて担当

### **新: Vue.js + Firestore 中心**
- データベース: Firestore（スケーラブル・高速）
- UI: Vue.js SPA（モダンなWeb UI）
- バックエンド: **GAS は「ファイル移動・AI解析バッチ」のみ**

**変更理由**:
- 型安全性の必要性（TypeScript）
- スケーラビリティ（Firestoreは無制限）
- モダンなUX（Vue.js）

**参照**: [SYSTEM_PHILOSOPHY.md L81-87](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md#L81-L87)

---

## 🧠 知識プロンプトと学習ルール（詳細）

### **1. 知識プロンプト（aiKnowledgePrompt）**

#### **概念**
顧問先ごとの「AIへの追加指示」（自然言語）

#### **作成方法（2段階）**

**Phase 1: 初期学習（Phase 7 - 過去CSV統計処理）**
```
1. 過去の仕訳CSVを統計処理
   ↓
2. 「取引先ごとの科目・金額閾値」などの傾向を抽出
   ↓
3. 初期知識プロンプトを自動生成
   例: 「この会社は駐車場代を旅費交通費に計上する傾向（信頼度90%）」
```

**Phase 2: 手動カスタマイズ（税理士が追記）**
```
税理士が aiKnowledgePrompt に追加記述
例: 「3,000円以下の飲食費は会議費に計上」
```

**参照**: 
- [SYSTEM_PHILOSOPHY.md L146](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md#L146) - 個別ルール定義
- [HUMAN_WISHLIST.md L64](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/HUMAN_WISHLIST.md#L64) - 過去仕訳CSV学習の要求

#### **実装状況**

| 項目 | 状態 | 証拠 |
|------|------|------|
| 型定義 | ✅ 完了 | [firestore.ts L151](file:///C:/dev/receipt-app/src/types/firestore.ts#L151), [zod_schema.ts L140](file:///C:/dev/receipt-app/src/types/zod_schema.ts#L140) |
| 入力UI | ✅ 完了 | [ClientFormSchema.ts L63](file:///C:/dev/receipt-app/src/features/client-management/schemas/ClientFormSchema.ts#L63) |
| Mapper | ✅ 完了 | [ClientToUiMapper.ts L140](file:///C:/dev/receipt-app/src/features/client-management/mappers/ClientToUiMapper.ts#L140) |
| **実際の使用** | ❌ **未実装** | Gemini API に渡す処理なし（Phase 6.2） |
| **過去CSV統計処理** | ❌ **未実装** | Phase 7 で実装予定 |

---

### **2. 学習ルール（LearningRule）**

#### **概念**
過去の修正パターンを構造化データで記録

#### **作成方法（2段階）**

**Phase 1: 初期学習（Phase 7 - 過去CSV統計処理）**
```
1. 過去の仕訳CSVから keyword → accountItem のパターンを抽出
   ↓
2. 統計的に信頼度の高いルールを作成
   例: keyword: '駐車場' → accountItem: '旅費交通費' 
       (hitCount: 50, confidenceScore: 0.95)
```

**Phase 2: 継続学習（Phase 6.2 - 修正時）**
```
税理士の修正 → 新しい学習ルールを自動生成 → 人間が承認（ScreenD）
```

#### **データ構造**
[LearningRule インターフェース](file:///C:/dev/receipt-app/src/types/firestore.ts#L337-L356)
```typescript
interface LearningRule {
  id: string;
  clientCode: string;         // 'AAA' or 'ALL'（全社共通）
  
  // マッチング条件
  keyword: string;             // '駐車場'
  targetField: 'description' | 'vendor' | 'amount_range';
  
  // 適用結果
  accountItem: string;         // '旅費交通費'
  subAccount?: string;
  taxClass?: string;
  
  // メトリクス
  confidenceScore: number;     // 0.0-1.0（信頼度）
  hitCount: number;            // 適用回数
  lastAppliedJobId?: string;
  
  isActive: boolean;
  updatedAt: Timestamp;
}
```

#### **実装状況（完全検証済み）**

| 項目 | 状態 | 証拠 |
|------|------|------|
| 型定義 | ✅ 完了 | [firestore.ts L337](file:///C:/dev/receipt-app/src/types/firestore.ts#L337), [zod_schema.ts L487](file:///C:/dev/receipt-app/src/types/zod_schema.ts#L487) |
| UI型 | ✅ 完了 | [LearningRuleUi.ts](file:///C:/dev/receipt-app/src/types/LearningRuleUi.ts) |
| Mapper | ✅ 完了 | [AIRulesMapper.ts](file:///C:/dev/receipt-app/src/composables/AIRulesMapper.ts) |
| Composable | ✅ 完了 | [useAIRules.ts](file:///C:/dev/receipt-app/src/composables/useAIRules.ts), [useAIRulesRPC.ts](file:///C:/dev/receipt-app/src/composables/useAIRulesRPC.ts) |
| View | ✅ 完了 | [ScreenD_AIRules.vue](file:///C:/dev/receipt-app/src/views/ScreenD_AIRules.vue) |
| Component | ✅ 完了 | [RuleCard.vue](file:///C:/dev/receipt-app/src/components/RuleCard.vue), [RuleDetailModal.vue](file:///C:/dev/receipt-app/src/components/RuleDetailModal.vue) |
| API | ✅ 完了 | [ai-rules.ts](file:///C:/dev/receipt-app/src/api/routes/ai-rules.ts) |
| **自動学習** | ❌ **未実装** | 修正時に自動生成する機能なし（Phase 6.2） |
| **Gemini連携** | ❌ **未実装** | 学習ルールを AI に渡す処理なし（Phase 6.2） |
| **過去CSV統計処理** | ❌ **未実装** | Phase 7 で実装予定 |

**確認できた機能**:
- ✅ 学習ルール一覧表示（ScreenD）
- ✅ 学習ルール作成・編集・削除
- ✅ keyword, accountItem, confidenceScore 等の管理
- ✅ Firestore `learning_rules` コレクション

---

### **3. learningCsvFolderId の役割**

**場所**: 
- [docs_discrepancy_matrix.md L19](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/docs_discrepancy_matrix.md#L19)
- [firestore.ts L132](file:///C:/dev/receipt-app/src/types/firestore.ts#L132) - Client型に定義

**役割**:
- 過去の仕訳CSVを保存するフォルダ
- Phase 7 で統計処理の対象となる

**統計処理フロー（Phase 7）**:
```
1. learningCsvFolderId フォルダから過去仕訳CSVを読み込み
   ↓
2. 取引先ごとの科目・金額閾値を統計的に抽出
   ↓
3. 初期知識プロンプトを自動生成
   ↓
4. 初期学習ルールを自動生成
```

---

### **4. RAG（知識注入）の全体像**

**設計書の記載**: [system_design.md L34-36](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/archive/system_design.md#L34-L36)

```
知識注入 (RAG):
  - 共通ルール: 全社的な経理規定
  - 個別ルール: 顧問先ごとのマスタ（01-W）および過去の修正履歴（学習データ）
```

**Gemini API への渡し方（想定実装 - Phase 6.2）**:
```typescript
// ❌ これは未実装（Phase 6.2で実装予定）
const prompt = `
あなたは会計の専門家です。
以下の領収書から仕訳を作成してください。

【共通ルール】
- 10,000円以上の飲食費は「交際費」
- 領収書がない場合は「仮払金」
...

【顧問先ルール（${client.companyName}）】
${client.aiKnowledgePrompt}

【学習ルール（過去の修正パターン）】
${learningRules.map(r => \`- "${r.keyword}" → "${r.accountItem}"\`).join('\n')}

【領収書画像】
...
`;
```

**実装状況**:

| 項目 | 状態 |
|------|------|
| 共通ルール管理 | ❌ 未実装 |
| 個別ルール（aiKnowledgePrompt） | △ 型定義のみ |
| 学習ルール（LearningRule） | △ UI管理のみ（AI連携なし） |
| Gemini へのプロンプト生成 | ❌ 未実装（Phase 6.2） |

---

## 🛠️ 技術スタック

### **フロントエンド**
- Vue.js 3 + Composition API
- TypeScript
- Tailwind CSS
- Pinia（状態管理）

### **バックエンド**
- Firebase Functions（将来）
- GAS（ファイル移動・バッチ処理のみ）

### **データベース**
- Firestore（メイン）
- Google Drive（顧問先から領収書を共有する目的のみ）
  - 顧問先用Driveフォルダに領収書等を保管
  - Firebase Storage には移動しない
  - Driveは共有インターフェースとして機能

### **AI**
- Gemini 2.0 Flash（現在）
- Vertex AI（本番環境では移行予定）

---

## 📝 次のアクション

**Phase 6.1 Step 3: Mock Composable 実装**

**実装内容**:
1. `src/types/DriveFileList.types.ts` 作成（ClientStub, DriveFile型定義）
2. `src/composables/useDriveFileListMock.ts` 作成（Mock Composable）

---

## 📐 型定義と型正義（Phase 6.1で重要）

### **1. 既存の型定義（3つ）**

#### **① Client 型（Firestore データ）**
**場所**: [firestore.ts L75-140](file:///C:/dev/receipt-app/src/types/firestore.ts#L75-L140)

```typescript
export interface Client {
  id?: string;
  clientId: string;          // ✅ AAA1, BBB1（Phase 6.1で追加）
  clientCode: string;        // AAA, BBB
  companyName: string;
  fiscalMonth: number;       // 1-12
  status: 'active' | 'inactive' | 'suspension';
  accountingSoftware: 'yayoi' | 'freee' | 'mf' | 'other';
  // ... 他20個以上のプロパティ
}
```

#### **② ClientUi 型（UI表示用）**
**場所**: [ui.type.ts L191-263](file:///C:/dev/receipt-app/src/types/ui.type.ts#L191-L263)

```typescript
export interface ClientUi {
  readonly clientId: string;
  readonly clientCode: string;
  readonly companyName: string;
  readonly fiscalMonthLabel: string;  // "3月決算"
  readonly softwareLabel: string;     // "マネーフォワード"
  readonly actions: readonly {        // ボタン情報
    readonly type: 'edit' | 'delete';
    readonly label: string;
    readonly isEnabled: boolean;
  }[];
  // ... 他30個以上のプロパティ（すべてreadonly）
}
```

**重要な特徴**:
- ✅ すべて `readonly`（変更不可）
- ✅ `optional (?)` が一切ない
- ✅ Label系はすべて文字列化済み

#### **③ DriveFile 型（Phase 6 新規）**
**場所**: phase6_step2_drivefilelist_contract.md（brain/ 内）

```typescript
interface DriveFile {
  fileId: string;       // Google Drive ID
  name: string;         // ファイル名
  mimeType: string;     // "image/jpeg" 等
  uploadedAt: string;   // ISO 8601形式
}
```

---

### **2. 型正義の4原則**

#### **原則1: any 型を使わない**
```typescript
// ❌ 絶対禁止
const data: any = { ... };

// ✅ 必ず型指定
const data: ClientUi = { ... };
```

#### **原則2: readonly 徹底（UIデータは変更不可）**
```typescript
// ❌ 変更可能（UI型では禁止）
clientId: string;

// ✅ 変更不可
readonly clientId: string;
```

#### **原則3: optional/undefined を避ける**
```typescript
// ❌ UI型では禁止
readonly fiscalMonthLabel: string | undefined;

// ✅ 必ず値を埋める（"不明" でもOK）
readonly fiscalMonthLabel: string;
```

#### **原則4: Mapperで変換（Firestore → UI）**
```typescript
// src/composables/ClientMapper.ts が責務
// Firestore型 → ClientUi型 に変換
// fallback値で欠損を補完
```

**参照**: [ClientMapper.ts L54, 106-221](file:///C:/dev/receipt-app/src/composables/ClientMapper.ts#L54)

---

### **3. 安全にMockを実装する方法**

#### **Step 1: 既存のMapperを参考にする**
[ClientMapper.ts L54, 106-221](file:///C:/dev/receipt-app/src/composables/ClientMapper.ts#L54)

```typescript
// fallback値（欠損時のデフォルト）
const fallback: ClientUi = {
  clientId: 'UNKNOWN_ID',
  clientCode: 'UNK',
  companyName: '不明な顧問先',
  // ... すべてのプロパティを埋める
};

// 実際の値を抽出
const clientId = safeString(raw.clientId) || 'UNKNOWN_ID';
```

#### **Step 2: Mock Composable を作成**
ファイル: `src/composables/useDriveFileListMock.ts`（新規）

```typescript
import { ref } from 'vue';
import type { ClientUi } from '@/types/ui.type';

interface DriveFile {
  fileId: string;
  name: string;
  mimeType: string;
  uploadedAt: string;
}

export function useDriveFileListMock() {
  // Mock データ（2社固定）
  const mockClients: ClientUi[] = [
    {
      clientId: 'AAA1',
      clientCode: 'AAA',
      companyName: 'AAA_株式会社テスト',
      fiscalMonthLabel: '3月決算',
      softwareLabel: 'マネーフォワード',
      // ... すべてのプロパティを埋める
    },
  ];

  const mockFiles: DriveFile[] = [
    {
      fileId: 'mock_001',
      name: 'receipt_001.jpg',
      mimeType: 'image/jpeg',
      uploadedAt: '2024-01-01T00:00:00Z',
    },
  ];

  // OCR実行（2秒待機→jobId返却）
  const runOcr = async (fileId: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { jobId: 'J-mock-' + Date.now() };
  };

  return {
    clients: ref(mockClients),
    files: ref(mockFiles),
    isLoadingFiles: ref(false),
    runOcr,
  };
}
```

#### **Step 3: 型チェックで確認**
```bash
cd C:\dev\receipt-app
npm run type-check
```
- ✅ エラーが出なければ成功
- ❌ エラーが出たら:
  - プロパティの不足を確認
  - 型の不一致を修正

---

### **4. チェックリスト**

**✅ Mock実装前**:
- [ ] `ClientUi` の全プロパティをリストアップ
- [ ] `ClientMapper.ts` の fallback を確認
- [ ] `DriveFile` 型定義を確認

**✅ Mock実装中**:
- [ ] `any`

 型を使わない
- [ ] すべてのプロパティを埋める
- [ ] `readonly` を守る

**✅ Mock実装後**:
- [ ] `npm run type-check` で確認
- [ ] baseline 231 を維持（増加させない）
- [ ] lint エラーがないか確認

---

## 🔍 タスク完了確認の方法

### **正しいディレクトリで確認**
```bash
# ✅ 正しい
grep -r "clientId" C:\dev\receipt-app\src

# ❌ 間違い
grep -r "clientId" C:\Users\kazen\OneDrive\...
```

### **確認すべき5つのファイル（clientId 実装例）**

1. [zod_schema.ts](file:///C:/dev/receipt-app/src/types/zod_schema.ts) - Zod スキーマ定義
2. [firestore.ts](file:///C:/dev/receipt-app/src/types/firestore.ts) - Firestore 型定義
3. [ui.type.ts](file:///C:/dev/receipt-app/src/types/ui.type.ts) - UI 型定義
4. [ClientMapper.ts](file:///C:/dev/receipt-app/src/composables/ClientMapper.ts) - Mapper 実装
5. [dbSeeder.ts](file:///C:/dev/receipt-app/src/utils/dbSeeder.ts) - Seed データ

### **実装状況確認チェックリスト**
1. ✅ grep_search で実際の使用箇所を検索
2. ✅ 型定義だけでなく、composables, views を確認
3. ✅ 「実装済み」「未実装」を明確に区別
4. ✅ Vue ファイルの確認が必要か判断

---

## 📖 更新履歴

- 2026-02-03: 初版作成（SESSION_START.md）
- 2026-02-03: docs/sessions/ に移動（会話ID非依存化）
