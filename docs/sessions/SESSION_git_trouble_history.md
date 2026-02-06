# Git トラブル全履歴と教訓

**作成日**: 2026-02-04  
**最終更新**: 2026-02-06  
**対象期間**: 2026-01-27 ~ 2026-02-06  
**総トラブル件数**: 7件（重大3件、中程度3件、軽微1件）

---

## 📊 トラブル全体像

| # | トラブル | 日付 | 重大度 | 対応時間 | 解決状況 |
|---|---------|------|--------|---------|---------| | 1 | APIキー漏洩（3回） | 2026-01-27 | 🔴 重大 | 5時間 | ✅ 解決 |
| 2 | GitHub Actions失敗（19回） | 2026-01-27 | 🟡 中 | 3時間 | ❌ 未解決 |
| 3 | OneDrive誤編集 | 2026-02-02 | 🟡 中 | 30分 | ✅ 解決 |
| 4 | git-filter-repo強制プッシュ | 2026-01-27 | 🔴 重大 | 20分 | ✅ 解決 |
| 5 | GitHub orphan commit | 2026-01-27 | 🔴 重大 | ⏳ 90日 | ⏳ 進行中 |
| 6 | Git履歴汚染（332ファイル） | 2026-01-29 | 🟡 中 | 2時間 | ✅ 解決 |
| 7 | ワークスペース未追加 | 2026-02-06 | 🟢 軽微 | - | ✅ 予防策実施 |

---

## 🔥 トラブル詳細

### **1. APIキー漏洩（3回）**

#### **経緯**
2026-01-27に発覚。過去に3回APIキーをGitHubに誤ってコミット。

**1回目の漏洩**（日時不明）:
- 詳細不明（ユーザー指摘による）

**2回目の漏洩**（日時不明）:
- 詳細不明（ユーザー指摘による）

**3回目の漏洩**（2026-01-27発覚）:
- コミット: `fd814d17fbd0dca4ec5e7adbb563822621b3d337`
- ファイル: `Dockerfile`
- 内容:
  ```dockerfile
  RUN VITE_FIREBASE_API_KEY=***REMOVED*** \
      VITE_FIREBASE_AUTH_DOMAIN=sugu-suru.firebaseapp.com \
      ...
  ```

#### **漏洩したAPIキー**
1. `***REMOVED***`（Firebase API Key）
2. `***REMOVED***`（Gemini API Key）

#### **原因**
- ❌ DockerfileにAPIキーをハードコーディング
- ❌ 確認不足、ベストプラクティス無視
- ❌ AIが3回同じ過ちを繰り返した

#### **対策**
1. **Git履歴から完全削除** （2026-01-27）
   ```bash
   # APIキーリスト作成
   echo "***REMOVED***" > C:\Users\kazen\.gemini\temp_api_keys_to_remove.txt
   echo "***REMOVED***" >> C:\Users\kazen\.gemini\temp_api_keys_to_remove.txt
   
   # git-filter-repo実行
   git filter-repo --replace-text C:\Users\kazen\.gemini\temp_api_keys_to_remove.txt --force
   # 実行時間: 19.64秒
   
   # GitHubに強制push
   git push origin --force --all
   git push origin --force --tags
   ```

2. **古いAPIキーの無効化**
   - Google Cloud Consoleで削除
   - 削除済みリストに移動確認 ✅

3. **新しいAPIキーの発行と安全性確認**
   - 新しいキー2つ発行
   - Git履歴に存在しないことを確認 ✅
   - GitHub Secretsに安全に保存 ✅

4. **再発防止策**
   - GitHub Secret Scanning有効化 ✅
   - ggshield pre-commit設定 ✅（2026-01-30）
   - .gitignoreに.envファイル追加 ✅

#### **未解決問題**
- **GitHub orphan commit問題**（トラブル#5参照）

---

### **2. GitHub Actions失敗（19回）**

#### **経緯**  
2026-01-27、Cloud Runへの自動デプロイを GitHub Actions で実装しようとして 19回失敗。

#### **試行回数内訳**
| 試行 | 内容 | 結果 |
|-----|------|------|
| 1-8 | Workload Identity Federation設定 | ✅ 成功 |
| 9 | GitHub Actionsワークフロー作成 | ✅ 成功 |
| 10 | テスト実行 | ❌ 権限エラー |
| 11-14 | 権限追加・再実行（4回） | ❌ 同じエラー |
| 15-17 | サービスアカウントキー方式に変更 | ❌ 組織ポリシーでキー作成禁止 |
| 18 | Cloud BuildではなくGitHub Actionsで直接ビルド | ✅ ワークフロー更新 |
| 19 | 最終実行 | ❌ ビルドエラー |

#### **最終エラー**
```
Could not resolve "../firebase" from "src/repositories/receiptRepository.ts"
```

#### **原因**
1. **Workload Identity Federationの権限問題**
   - `iam.serviceAccounts.getAccessToken`権限不足
   - すべての権限を付与しても解決せず
   - 根本原因は不明

2. **組織ポリシー制約**
   - `constraints/iam.disableServiceAccountKeyCreation`
   - サービスアカウントキーの作成が完全に禁止

3. **ビルドエラー**
   - [firebase.ts](file:///C:/dev/receipt-app/src/firebase.ts)のインポートパスが間違っている

#### **対策**
- ❌ **未解決**（2026-01-27時点）
- 次セッションで対応予定だったが、その後のセッションでは触れられず

#### **教訓**
- GitHub Actionsデプロイは一旦保留
- 手動デプロイ（gcloud run deploy）を使用中
- Phase 4（2026-01-25）で手動デプロイは成功済み

---

### **3. OneDrive誤編集**

#### **経緯**
2026-02-02、AIがOneDrive配下のファイルを誤編集。

#### **誤編集したファイル**
```
C:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti\
  ├── src/types/zod_schema.ts
  ├── src/types/firestore.ts
  ├── src/types/ui.type.ts
  └── src/composables/ClientMapper.ts
```

#### **原因**
- AIがOneDrive配下のプロジェクトコピーをプロジェクト本体と誤認
- 正しい作業ディレクトリは `C:\dev\receipt-app`

#### **対策**
1. **復旧** （2026-02-02）
   ```bash
   cd C:\dev\receipt-app
   git checkout -- src/types/zod_schema.ts src/types/firestore.ts src/types/ui.type.ts src/composables/ClientMapper.ts
   ```

2. **再発防止**
   - SESSION_START.md に「OneDrive配下で作業しない」ルールを明記 ✅
   - AIに対する教訓として記録 ✅

#### **影響**
- ⏱️ 復旧に30分
- ✅ データ損失なし（git checkoutで復旧）

---

### **4. git-filter-repo強制プッシュ**

#### **経緯**
2026-01-27、APIキー削除のためにGit履歴全体を書き換えて強制プッシュ。

#### **実行内容**
```bash
# Git履歴全体を書き換え
git filter-repo --replace-text C:\Users\kazen\.gemini\temp_api_keys_to_remove.txt --force
# 実行時間: 19.64秒

# すべてのブランチを強制プッシュ
git push origin --force --all
# 結果:
# + 809f521...82bb854 feature-restoration (forced update)
# + 4eb54f7...7ba898f vite-green-g (forced update)

# すべてのタグを強制プッシュ
git push origin --force --tags
```

#### **影響**
- ✅ APIキー完全削除
- ✅ 新しいコミットハッシュ生成
- ⚠️ すべてのブランチのコミットハッシュ変更
- ⚠️ 他の開発者がいた場合は混乱（今回は1人開発なのでセーフ）

#### **教訓**
- `git-filter-repo`は最終手段
- 強制プッシュは慎重に
- バックアップ必須（今回はOneDriveにコピーあり）

---

### **5. GitHub orphan commit問題**

#### **経緯**
2026-01-27、APIキー削除後もGitHubで古いコミットがアクセス可能。

#### **問題のコミット**
```
Commit SHA: fd814d17fbd0dca4ec5e7adbb563822621b3d337
URL: https://github.com/tani0120/receipt-app/blob/fd814d17.../Dockerfile
```

#### **原因**
- GitHubは削除されたコミットを90日間キャッシュ保持
- `git-filter-repo`でGit履歴から削除しても、GitHubのキャッシュには残る

#### **対策**
1. **GitHub Supportへ連絡** （予定）
   - 件名：「Sensitive data in Git history - Request for cache purge」
   - 内容：コミットSHAを指定してキャッシュクリアを依頼

2. **自然消滅を待つ**
   - 90日後に自動削除される

3. **リポジトリ削除・再作成**（最終手段）
   - 実施しない（開発履歴を保持）

#### **状況**
- ⏳ **進行中**（2026-01-27~2026-04-27の90日間）
- ✅ APIキーは既に無効化済み（緊急性は低い）

---

### **6. Git履歴汚染（332ファイル、59,736行）**

#### **経緯**
2026-01-29、過去にコミットされた機密情報の大規模修正。

#### **対象ファイル**
- **332ファイル**
- **59,736行**の修正

#### **機密情報の種類**
1. **APIキー**（流出済み）
2. **テストユーザーID/パスワード**
3. **サービスアカウントキー**

#### **対策**
1. **docs/ ディレクトリの機密情報をプレースホルダーに置換**
   - `[REDACTED]`
   - `***REMOVED***`

2. **.envファイルを.gitignoreに追加**
   - ✅ .env.example のみ保持

3. **テストユーザーをダミーに変更**
   - `admin@example.com` に置換

#### **教訓**
- APIキーだけでなく、すべての機密情報を見直す
- docs/ も機密情報の温床

---

### **7. ワークスペース未追加**

#### **経緯**
2026-02-06、Phase 6.3 Step 0実行時にワークスペース未追加に気づく。

#### **問題点**
- VS CodeでC:\dev\receipt-appがワークスペースに追加されていなかった
- AIがC:\dev\receipt-app内のファイルにアクセスできない可能性

#### **潜在的リスク**
- AIがファイル編集不可
- Phase 6.3実行時にエラー発生の可能性
- OneDrive配下のファイルを誤編集するリスク（トラブル#3再発）

#### **対策**
1. **ワークスペース追加** （2026-02-06 12:17）
   - VS Code: ファイル → フォルダーをワークスペースに追加
   - C:\dev\receipt-appを選択
   - 追加ボタンをクリック

2. **セッションスタート項目追加**
   - SESSION_START.mdに「チェック0: VS Codeワークスペース確認（最優先）」追加 ✅
   - SESSION_git_checkList.mdにチェック0追加 ✅
   - SESSION_git_trouble_history.mdにトラブル#7追加 ✅

3. **今後の確認**
   - 毎セッション開始時にSESSION_START.mdを確認
   - ワークスペース追加状態を最優先確認

#### **影響**
- ⏱️ 対応時間: 10分
- ✅ データ損失なし（予防策実施）
- ✅ 実被害なし（発見が早かった）

#### **教訓**
- ワークスペース設定は環境構築の必須項目
- セッション開始確認項目に追加すべき

---

## 🛡️ 再発防止策（実施済み）

### **1. Git関連**
- ✅ `.gitignore`に`.env`追加
- ✅ `ggshield` pre-commit設定
- ✅ GitHub Secret Scanning有効化
- ✅ Git履歴から機密情報完全削除

### **2. ワークフロー**
- ✅ OneDrive配下で作業しない（SESSION_START.md に明記）
- ✅ プロジェクトディレクトリは `C:\dev\receipt-app` のみ

### **3. APIキー管理**
- ✅ DockerfileにAPIキーをハードコーディングしない（絶対禁止）
- ✅ GitHub Secretsで管理
- ✅ .env.exampleのみGit管理

### **4. ドキュメント化**
- ✅ SESSION_START.md に教訓を記載
- ✅ セッション記録に詳細を残す
- ✅ このドキュメント作成

---

## 📋 未解決問題

### **1. GitHub orphan commit**
- **期限**: 2026-04-27（90日後）
- **対応**: GitHub Supportへ連絡（推奨）

### **2. GitHub Actions デプロイ失敗**
- **エラー**: `Could not resolve "../firebase"`
- **対応**: 次セッションで修正予定（未着手）

### **3. Workload Identity Federation権限問題**
- **状況**: 根本原因不明
- **対応**: 手動デプロイで回避中

---

## 🎯 教訓まとめ

### **やってはいけないこと**
1. ❌ DockerfileにAPIキーをハードコーディング
2. ❌ OneDrive配下のファイルを編集
3. ❌ 確認なしで強制プッシュ
4. ❌ 機密情報を含むファイルをGit管理

### **必ずやること**
1. ✅ `.gitignore`に`.env`を追加
2. ✅ GitHub SecretsでAPIキー管理
3. ✅ pre-commitフックで機密情報スキャン
4. ✅ C:\dev\receipt-app でのみ作業
5. ✅ git checkoutで復旧可能であることを確認

### **緊急時の対応**
1. **APIキー漏洩**
   - 即座にAPIキーを無効化
   - git-filter-repoで履歴から削除
   - 強制プッシュ
   - GitHub Supportへ連絡

2. **誤編集**
   - git checkoutで復旧
   - 正しいディレクトリを確認

---

## 📖 参考資料

- [SESSION_20260127.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260127.md) - APIキー漏洩緊急対応
- [SESSION_20260129.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260129.md) - 機密情報削除
- [SESSION_20260202.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260202.md) - OneDrive誤編集
- [api_key_leak_fix_tasks.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/guides/security/api_key_leak_fix_tasks.md) - セキュリティ対策タスク

---

**最終更新**: 2026-02-04  
**次回レビュー**: 新しいGitトラブル発生時
