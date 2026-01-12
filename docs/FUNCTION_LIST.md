# UseCase一覧 (Phase 4.5)

**作成日**: 2026-01-12  
**基準**: Phase 5で検証した7画面から抽出  
**原則**: UI構造ではなく、ユーザーの「1回の意思決定でやる操作」単位

---

## 抽出方法

**Phase 5検証画面:**
- Screen E (JournalEntry)
- Screen B (JournalStatus)
- Screen A (ClientList)
- Screen D (AIRules)
- Screen G (DataConversion)
- Screen H (TaskDashboard)
- Screen Admin

**抽出基準:**
- ❌ 画面名・モーダル名から抽出しない
- ✅ ユーザーが「これをやりたい」と思う操作単位

---

## Core UseCases (v0.1)

### Journal & Job 関連

#### 1. CreateJournal
仕訳を新規作成する

**Domain:** Journal, Job

#### 2. UpdateJournal
既存の仕訳を編集する

**Domain:** Journal

#### 3. DetectBank
仕訳から銀行名を自動検知する

**Domain:** Journal → Bank detection logic

#### 4. ApplyAIProposal
AI提案を仕訳に適用する

**Domain:** Journal, AIProposal

#### 5. AllocateJob
ジョブに配分金額・時間を計算する

**Domain:** Job, Journal

#### 6. RecalculateMetrics
ジョブのメトリクス（ROI、差異率等）を再計算する

**Domain:** Job

#### 7. ConfirmJournal
仕訳を確定する（状態変更）

**Domain:** Journal (status: review)

#### 8. RemandJournal
仕訳を差戻す（状態変更）

**Domain:** Journal (status: remand)

#### 9. ExcludeJournal
仕訳を除外する（状態変更）

**Domain:** Journal (status: excluded)

---

### Client 関連

#### 10. CreateClient
新規顧問先を登録する

**Domain:** Client

#### 11. UpdateClient
顧問先情報を編集する

**Domain:** Client

#### 12. FetchClientDetail
顧問先詳細を取得する

**Domain:** Client (with folders, files)

---

### AI Rules 関連

#### 13. CreateLearningRule
新規AIルールを作成する

**Domain:** LearningRule, Client

#### 14. UpdateLearningRule
既存のAIルールを編集する

**Domain:** LearningRule

#### 15. DeleteLearningRule
AIルールを削除する

**Domain:** LearningRule

#### 16. ApplyLearningRules
クライアントのAIルールを仕訳に適用する

**Domain:** LearningRule, Journal

---

### Data Conversion 関連

#### 17. ConvertAccountingData
会計データを別フォーマットに変換する

**Domain:** Job, Client (Yayoi/MF/freee)

#### 18. UploadConversionFile
変換用ファイルをアップロードする

**Domain:** File upload

---

### Admin 関連

#### 19. FetchDashboardMetrics
ダッシュボードのメトリクスを取得する

**Domain:** Job, Client (aggregated)

#### 20. UpdateSystemSettings
システム設定を更新する

**Domain:** Settings (API keys, constants)

---

## 今後追加される可能性のあるUseCases

### Status: 未実装だが想定される

#### 21. UndoAllocation
配分を元に戻す

#### 22. LockJournal
仕訳をロックする（編集不可にする）

#### 23. MergeClients
複数のクライアントを統合する

#### 24. SplitJournal
仕訳を分割する

#### 25. ExportArchivedData
アーカイブデータをエクスポートする

---

## 設計原則（Phase 4.5）

### 1. UseCaseは増えてもいい
- 後から追加OK
- 削除も可能（影響範囲が明確）

### 2. 既存UseCaseの責務は増やさない
```
❌ AllocateJobAndUpdateUIAndSaveFirestore()
✅ allocateJob() + saveAllocation()
```

### 3. UseCaseはUI に依存しない
- Screen E で使う
- Modal で使う
- → どちらでも同じ契約

---

## 次のステップ

1. ✅ FUNCTION_LIST.md 作成（完了）
2. ⏳ 主要UseCase（2-3個）のInput/Output Schema作成
3. ⏳ 既存コードとのマッピング確認

---

**Phase 4.5 v0.1 完了**
