# システム哲学 変更履歴

**対象ファイル**: [SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md)

---

## v2.2 (2026-01-21): Firebase認証層の追加

### 変更箇所
- **Section 1.1**: アーキテクチャ構成に認証層を新規追加
  - Firebase Authentication導入
  - 開発環境と本番環境の認証フロー定義

### 変更理由
Firestoreセキュリティルール適用に伴い、認証層の実装が必要になった。開発環境では自動ログイン、本番環境ではログインUIによる認証フローを確立。

### 議論の背景
**実装内容**:
- Firestoreセキュリティルール: 認証済みユーザーのみアクセス可能
- テストユーザー: `***REMOVED***`（開発環境自動ログイン）
- ログインUI: メール/パスワード + Google認証
- 認証ガード: router/index.tsで本番環境のみ適用

**判断**:
- ADR作成は不要（Firebaseは既に採用済み、追加機能の利用）
- SYSTEM_PHILOSOPHY.md更新で対応

### 哲学の進化

```
v2.1 (2026-01-16):
開発原則（型安全・段階的実装）を明文化

v2.2 (2026-01-21):
認証層の追加（セキュリティ強化）
```

**思想の補強**:
- 人間承認・タスク化 + 型安全・段階的実装 + **セキュリティ** = 完全なシステム哲学

### 影響範囲
- Section 1.1: アーキテクチャ構成に認証層追加
- 実装ファイル: LoginView.vue, auth.ts, router/index.ts等

### 関連
- [docs/FIREBASE_SECURITY_SETUP.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/FIREBASE_SECURITY_SETUP.md)
- [brain/walkthrough.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/walkthrough.md)

---

## v2.1 (2026-01-16): 開発原則の追加

### 変更箇所
- **Section 5**: 開発原則を新規追加
  - 5.1: 型安全の徹底（ADR-001の原則）
  - 5.2: 段階的UI実装（ADR-002の原則）

### 変更理由
SYSTEM_PHILOSOPHY.mdにADR-001, ADR-002の原則を参照する必要があると判断。詳細な技術仕様は各ADRに記載されているが、哲学文書では原則のみを明記することで、システムの開発思想を明確化。

### 議論の背景
**ユーザーからの質問**:
> 「ADR-001, ADR-002の概念は追記すべきか？」

**判断**:
- 追記すべき（ただし概要のみ）
- SYSTEM_PHILOSOPHY.mdは「システムの本質・哲学」
- ADR-001, ADR-002は「開発原則」
- 詳細な技術仕様は各ADRに記載されているので、哲学文書では**原則のみ言及**

**追加内容**:
- 型安全の徹底: 「壊せない型安全性」
- 段階的UI実装: 「Screen A First Approach + UI Freeze」

### 哲学の進化

```
v2.0 (2026-01-16):
「AI×人間協働」の概念を確立

v2.1 (2026-01-16):
開発原則（型安全・段階的実装）を明文化
```

**思想の補強**:
- 人間承認・タスク化 + **型安全・段階的実装** = 完全なシステム哲学

### 影響範囲
- なし（既存セクションに影響なし、新規追加のみ）

### 関連
- [ADR-001-type-safe-mapping.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-001-type-safe-mapping.md)
- [ADR-002-gradual-ui-implementation.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-002-gradual-ui-implementation.md)

### Diff

```diff
+ ## 5. 開発原則
+ 
+ ### 5.1 型安全の徹底 (ADR-001)
+ 原則: 「壊せない型安全性」
+ ...
+ 
+ ### 5.2 段階的UI実装 (ADR-002)
+ 原則: 「Screen A First Approach + UI Freeze」
+ ...
```

---

## v2.0 (2026-01-16): 人間承認・タスク化の概念を追加

### 変更箇所
- **Section 1**: システム概要を全面改訂
  - Line 8: 「AIが解析し、仕訳データを自動生成」→「AIが解析し、**人間が承認**した仕訳データを生成」
- **Section 1.2**: 人間とAIの協働モデルを新規追加
  - フロー図、役割分担表、重要な原則を追加
- **Section 1.1**: Frontend役割にタスク化を追記
  - Line 15: 「承認操作」→「タスクとして管理し、承認操作」

### 変更理由
本日の議論で、「AIが全自動で処理」という誤解が判明。システムの本質は「AI×人間の協働」であり、人間の承認・タスク化・可視化が重要であると再定義。

### 議論の背景
**ユーザーの指摘**:
> 「人間の承認、それを補助、タスク化も同時に実行という概念が不足している」

**問題**:
- 従来の`system_design.md`は「自動生成」のみを強調
- 人間の役割が「承認操作」という曖昧な記述のみ
- タスク化、可視化の概念が欠落

**決定**:
- システムの核心は「人間が最終判断を下す協働型」であると明確化
- 「AIは補助、人間が最終判断」という原則を確立
- タスク化により、未処理・処理済みを明確に管理

### 哲学の進化

```
v1.0 (2025-12-27):
「AIが証憑を解析し、仕訳データを自動生成する」
→ AI単独での自動化を重視

v2.0 (2026-01-16):
「AIが解析し、人間が承認した仕訳データを生成する」
→ 人間の承認・タスク化を核心に据える
```

**思想の転換**:
- **効率化重視** → **ROI最適化・人間の判断支援**
- **AI単独** → **AI×人間協働**
- **自動化** → **タスク化・可視化**

### 影響範囲
- データモデル（Job.status に AI_PENDING, REVIEW, APPROVED 等）
- UI設計（タスクリスト、承認ボタン）
- 業務フロー（Phase 6: 人間確認・承認を追加）

### 関連
- [SESSION_20260115.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260115.md)
- [session-management-protocol-complete.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/session-management-protocol-complete.md)

### Diff

```diff
## 1. システム概要
- 本システムは、顧問先の証憑（領収書・請求書等）をAIが解析し、会計ソフト（弥生会計、MFクラウド、freee等）に取り込み可能な仕訳データを自動生成する業務支援プラットフォームです。
+ 本システムは、顧問先の証憑（領収書・請求書等）をAIが解析し、**人間が承認**した仕訳データを会計ソフト（弥生会計、MFクラウド、freee等）に取り込む、**AI×人間協働の業務支援プラットフォーム**です。

### 1.1 Frontend役割
-    *   **役割**: データの閲覧、修正、承認操作。
+    *   **役割**: 
+        - 処理すべき領収書を**タスクとして管理**
+        - データの閲覧、修正、承認操作
+        - 誰が、いつ、何を処理したかを記録（可視化）

+ ### 1.2 人間とAIの協働モデル
+ (新規セクション追加)
```

---

## v1.0 (2025-12-27): 初版作成

### 内容
`system_design.md`をベースに初版を作成

### 主な内容
- システム概要
- アーキテクチャ構成（3層構造 + ハイブリッドDB）
- 業務フローとフェーズ定義
- データモデル（Client, Job）
- 運用ルール

---

**過去の全バージョンは [archive/](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/archive/) を参照してください。**
