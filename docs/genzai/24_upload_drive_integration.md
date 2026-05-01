# 24: アップロード・ドライブ統合（スマホはDrive方式に移行確定）

> 作成日: 2026-04-17
> 関連: task_unified.md B-5, B-9, C-1(3.5)
> 前提: code_quality.md / load_context.md 遵守

---

## 0. スマホ直接アップロードを廃止しDrive方式に移行する理由

### 0-1. 業務要件と技術限界の不一致

| 項目 | 業務要件 | ブラウザの限界 |
|---|---|---|
| 月次送付枚数 | **200枚**単位で一括送付 | Chrome/iOS Safariで**20枚が限界** |
| ファイルサイズ | JPEG 3〜5MB/枚（スマホ撮影） | 20枚 × 5MB = 100MB → OOM発生 |
| 送付頻度 | 月末にまとめて1回 | 少量ずつ分割送付は業務的に非現実的|

### 0-2. 直接アップロードが不可能な技術的理由

**ブラウザ（Chrome / iOS Safari）はファイルをメモリに全展開する。回避不可能。**

```
スマホブラウザのメモリモデル:
  input[type=file] で選択 → File オブジェクトが Blink レンダラプロセスのヒープに生成
  → 選択した枚数 × ファイルサイズ分のメモリが確保される
  → OS の WebView メモリ上限（概ね 200〜500MB）に到達 → タブ強制終了（クラッシュ）

実測:
  Android Chrome: 4枚以上で不安定、20枚で確実にクラッシュ
  iOS Safari:     10枚程度で WebView プロセスが強制終了
```

#### 試行した対策と限界（6回の改修で証明済み）

| 対策 | やったこと | 結果 |
|---|---|---|---|
| チャンク送信 | File.slice(512KB) × N回で分割送信 | File参照がメモリに残る。根本解決にならない |
| 逐次処理 | 1枚完了→次の1枚（同時1枚制限） | 遅すぎる。200枚 × 6秒 = 20分。非現実的 |
| File参照解放 | 処理後 `e.file = null` でGC促進 | 解放タイミングはブラウザ依存。確実ではない |
| DOM制限 | 完了済み6件のみ表示 | DOM負荷軽減だがメモリ問題は別 |
| サムネイル最適化 | canvas→SVG、createImageBitmap縮小 | デコードメモリの節約のみ。元Fileは残る |
| フロント圧縮 | 1280px + JPEG80%に縮小 | 一時的にcanvas + Blob が追加メモリ消費 |

**結論: ブラウザ内でFileオブジェクトを触る限り、大量アップロードの根本解決は不可能。**

### 0-3. Drive方式が解決する理由

```
直接アップロード（現在）:
  スマホのブラウザ → [200枚のFile] → サーバー
                      ↑ ここで200枚分のメモリ確保 → 💥 クラッシュ

Drive方式（移行後）:
  スマホのドライブアプリ → Google Drive（クラウド保存）
  スマホのブラウザ → [200個のファイルID（数byte）] → サーバー → Drive APIでDL
                      ↑ ファイルID（文字列）だけ。メモリほぼゼロ
```

| 項目 | 直接アップロード | Drive方式 |
|---|---|---|
| ブラウザメモリ使用 | 200枚 × 5MB = **1GB**（即死） | 200個 × 40byte = **8KB** |
| 実用上限 | 20枚 | **無制限** |
| 月200枚一括送付 | ❌ 不可能 | ✅ 可能 |
| 処理の信頼性 | ブラウザ依存（クラッシュリスク） | サーバー間通信（100%安定） |

### 0-4. 顧問先の運用フロー（移行後）

```
【日々の業務】
  ① 領収書をスマホで撮影（通常のカメラアプリ）
  ② Googleドライブアプリで自動バックアップ（設定1回だけ）
     → 撮った写真が自動的にドライブに入る

【月末の送付】
  ③ 事務所のWebアプリを開く
  ④ 画面に共有ドライブの写真一覧が表示される（サーバーがDrive APIで取得）
  ⑤ 全選択 or 必要なものだけ選択
  ⑥ 「送付」ボタン → サーバーがDrive APIでダウンロード → AI分類 → 完了
  ★ スマホのブラウザにファイルは一切乗らない
```

### 0-5. 既存の直接アップロード（チャンク方式）の扱い

| 判断 | 理由 |
|---|---|
| **スマホ版は廃止** | 20枚限界では200枚業務に対応不可。維持する意味がない |
| **PC版は維持** | PCはメモリ十分。D&Dの利便性が高い。クラッシュ問題なし |

---

## 1. 現状分析

### 1-1. アップロード方式の全体像（現在）

```
┌─ PC ──────────────────────────────────┐
│  ドラッグ&ドロップ / ファイル選択      │
│  → useUpload.ts                       │
│  → FormData POST /api/pipeline/classify│
│  → Vertex AI（Gemini）分類            │
│  → 結果バッジ表示                     │
│  ★ 問題なし                          │
└───────────────────────────────────────┘

┌─ スマホ ──────────────────────────────┐
│  撮影 / ファイル選択 / showOpenFilePicker │
│  → File がブラウザメモリに乗る 💥      │
│  → チャンク512KB × N回送信            │
│  → SHA-256 + サムネイル（サーバー側）  │
│  ★ 4枚以上でクラッシュリスクあり      │
└───────────────────────────────────────┘
```

### 1-2. モバイルクラッシュの対策履歴（git log）

| コミット | 日付 | 対策 | 効果 |
|---|---|---|---|
| `d6a47fc` | 最新 | チャンク化512KB + DOM制限6件 + ファイル選択最適化 | 大幅改善 |
| `9eb443e` | — | Android 4枚以上クラッシュ修正（メモリ安全化+DOM最適化） | 部分改善 |
| `5d50659` | — | 処理完了後File参照削除（GC促進） | 部分改善 |
| `3b36c5a` | — | サムネイル生成キュー化（同時デコード防止） | 部分改善 |
| `8d62f43` | — | canvas→サムネイル変更（デコードサイズ縮小） | 部分改善 |
| `7bcb2e9` | — | FormData送信化（メモリ70%削減）+ サーバー並列制御 | 部分改善 |

**結論**: 全て対症療法。ブラウザ内でFileオブジェクトを触る限り根本解決不可能。

### 1-3. 現在のファイル構成

#### フロントエンド（アップロードUI + ロジック）

| ファイル | パス | 行数 | 役割 |
|---|---|---|---|
| `MockUploadUnifiedPage.vue` | `src/mocks/views/` | 1,287 | PC/モバイル統合アップロードUI |
| `MockUploadDocsPage.vue` | `src/mocks/views/` | 422 | 書類アップロード（AI分類なし。謄本/CSV等何でも） |
| `MockUploadSelectorUnifiedPage.vue` | `src/mocks/views/` | 691 | 方法選択画面（共有設定・URL発行） |
| `MockDriveSelectPage.vue` | `src/mocks/views/` | 236 | Drive資料選別（モックデータ固定8件。PC用分類UI） |
| **`MockDriveUploadPage.vue`** | `src/mocks/views/` | 約300 | **[新規] スマホDriveアップロード（独自UI。ファイルIDのみ送信）** |
| `useUpload.ts` | `src/mocks/composables/` | 1,026 | アップロード全ロジック（キュー・圧縮・API呼出） |
| ~~`useGooglePicker.ts`~~ | ~~`src/mocks/composables/`~~ | — | **[削除済み] Picker API不使用のため削除** |
| `receiptService.ts` | `src/mocks/services/` | 284 | モック/本番切替サービス層 |
| ~~`hash-worker.ts`~~ | ~~`src/mocks/workers/`~~ | — | **[削除済み] ハッシュ計算はサーバー側（pipeline.ts）で実行** |
| `pdfThumbnail.ts` | `src/mocks/utils/` | 50 | pdfjs-dist で1ページ目→canvasサムネイル |
| `PortalHeader.vue` | `src/mocks/components/` | — | 顧問先名表示ヘッダー（Upload系4画面で共通使用） |

#### 共有モジュール

| ファイル | パス | 行数 | 役割 |
|---|---|---|---|
| `fileTypes.ts` | `src/shared/` | 57 | ファイル形式ホワイトリスト（MIME/拡張子） |
| `validationMessages.ts` | `src/shared/` | 73 | バリデーション・エラー文言の一元管理 |
| `DriveFileList.types.ts` | `src/types/` | 89 | DriveFile型定義（`ClientStub.driveId`あり） |

#### サーバーサイド（パイプライン + Drive）

| ファイル | パス | 行数 | 役割 |
|---|---|---|---|
| `pipeline.ts` | `src/api/routes/` | 348 | APIルーティング（classify, upload-chunk, upload-complete, hashes） |
| **`drive.ts`** | `src/api/routes/` | 約170 | **Drive APIルーティング（GET /files, POST /process + ゴミ箱移動）** |
| **`docStore.ts`** | `src/api/routes/` | 約95 | **[新規] ドキュメントJSON永続化APIルート（GET/POST/PUT/DELETE）** |
| `classify.service.ts` | `src/api/services/pipeline/` | 約400 | Gemini呼出 + sharp前処理 + JSON解析 |
| **`driveService.ts`** | `src/api/services/drive/` | 約310 | **SA認証 + ファイル一覧 + DL + ハッシュ + サムネイル + `grantFolderPermission()` + `trashDriveFile()`** |
| **`documentStore.ts`** | `src/api/services/` | 約130 | **[新規] ドキュメントJSON永続化ストア（インメモリ + data/documents.json）** |
| `types.ts` | `src/api/services/pipeline/` | 約300 | ClassifyResponse / ClassifyResponseLineItem 等の型定義 |
| `postprocess.ts` | `src/api/services/pipeline/` | 約180 | AI生出力の正規化・fallback適用 |
| `validateClassifyResult.ts` | `src/api/services/pipeline/` | 約170 | データ駆動バリデーション（OK/NG判定） |
| `source_type_keywords.ts` | `src/api/services/pipeline/` | 約400 | 証票種別キーワード辞書 |
| `image_preprocessor.ts` | `src/scripts/pipeline/` | — | sharp 6ステップ前処理（唯一のsharp呼出元） |

### 1-4. 現在のルーティング

| パス | コンポーネント | 用途 |
|---|---|---|
| `/upload-v2/:clientId` | MockUploadSelectorUnifiedPage | 方法選択（起点） |
| `/upload/:clientId/staff` | MockUploadUnifiedPage | スタッフ用アップロード |
| `/upload/:clientId/guest` | MockUploadUnifiedPage | 顧問先用アップロード |
| `/upload-docs/:clientId` | MockUploadDocsPage | 書類アップロード（バリデーションなし） |
| **`/drive-upload/:clientId`** | **MockDriveUploadPage** | **[新規] スマホDriveアップロード** |
| **`/drive-upload/:clientId/guest`** | **MockDriveUploadPage** | **[新規] 顧問先用Driveアップロード** |
| `/drive-select/:clientId` | MockDriveSelectPage | Drive資料選別（フェーズ3.5。PC用分類UI） |

### 1-5. Google連携状態

| 要素 | 状態 |
|---|---|
| Firebase Auth（Googleログイン） | ✅ 実装済み |
| `DriveFileList.types.ts`（型定義） | ✅ 存在（`ClientStub.driveId`フィールドあり） |
| Google Picker API | ❌ 不使用（独自UIに決定。`useGooglePicker.ts`削除済み） |
| Google Drive API（ファイル取得） | ✅ **実装済み**（SA認証。`driveService.ts` + `drive.ts`） |
| 環境変数 `GOOGLE_SA_KEY_PATH` | ✅ **設定済み**（`./service-account-key.json`） |
| 環境変数 `VITE_SHARED_DRIVE_ID` | ✅ **設定済み**（`0AIOLCboQ_R-nUk9PVA`） |
| Drive API接続テスト | ✅ **成功**（2026-04-17確認） |
| `googleapis` npm依存 | ✅ **追加済み** |
| Google OAuth（Supabase Auth経由） | ✅ **設定済み**（2026-04-18 同意画面公開済み） |
| `grantFolderPermission()` | ✅ **実装済み**（writer権限付与。2026-04-18 実証テスト成功） |

### 1-6. モバイルアップロードの現在のUI構成

`MockUploadUnifiedPage.vue` L114-241（モバイル版セクション）:

- **空の状態**: 「撮影する」「ファイルをアップロード」「高度な処理でアップロード」の3ボタン
- **カードグリッド**: 処理中/待機中はimg表示、完了後はテキスト化（Rendererクラッシュ防止）
- **DOM制限**: 完了済みは最新6件のみ表示（`MAX_VISIBLE_DONE = 6`）
- **追加ボタン**: 「📷 撮る」「🖼 選ぶ」

`useUpload.ts` のモバイル処理フロー:
1. `addFiles()` → `rawQueue`に追加
2. `processCompressQueue()` → モバイル: **1枚完全完了してから次**（メモリ保護）
3. `processOne()` → `uploadChunked()` (512KB × N回) → サーバーで結合+ハッシュ+サムネイル
4. 完了後 `e.file = null`（File参照削除でGC）

### 1-7. PCアップロードの現状

**★ PCアップロードは問題なく動作している。モバイルのようなクラッシュ問題は発生しない。**

#### 処理フロー（5段階）

```
① ファイル投入
   ドラッグ&ドロップ or input[type=file]（複数選択可）
   → addFiles() → rawQueue に追加

② サムネイル生成（フロント側・4並列）
   rawQueue → processCompressQueue() → compressAndThumbnail()
   COMPRESS_CONCURRENCY = 4（rawQueueから4枚ずつ取り出し）
   ├─ 画像: createImageBitmap → canvas 200px サムネイル + 800px HQプレビュー
   ├─ PDF:  pdfjs-dist → 1ページ目レンダリング → 200px + 800px
   └─ CSV/Excel等: SVGアイコン生成（📊 + 拡張子名）
   → pendingFiles[] (圧縮済みキュー) に追加

③ エントリー作成 + API並列呼出
   pendingFiles → processQueue() → UploadEntry作成 → entries[] に追加
   → processOne() × 6並列（CONCURRENCY_PC = 6）

④ サーバー処理（2モード分岐）
   ┌─ 軽量モード（lite=true）: AI分類スキップ
   │   → uploadChunked() → 512KB × N回 → upload-complete
   │   → サーバー: SHA-256 + サムネイル + 重複チェック
   │   → 即OK（classify不要）
   └─ 高度モード（lite=false）: AI分類実行
       → FormData POST /api/pipeline/classify
       → サーバー: sharp前処理 → Vertex AI（Gemini）分類
       → バリデーション → OK/NG判定

⑤ 結果反映 + メモリ解放
   e.status = 'ok' or 'error'
   e.completedAt = Date.now()
   e.file = null（File参照削除→GC対象化）
   → processQueue()（次の待機エントリーを処理開始）
```

#### 2モードの比較（PC版）

| 項目 | 軽量モード（lite） | 高度モード（advanced） |
|---|---|---|
| ボタン | 「📁 ファイルをアップロード」 | 「⚙ 高度な処理でアップロード」 |
| AI分類 | **なし**（スキップ） | **あり**（Gemini呼出） |
| サーバー処理 | SHA-256 + サムネイル + 重複チェック | sharp前処理 + Gemini分類 + バリデーション |
| 処理時間/枚 | ~1秒 | ~6秒（Gemini応答待ち） |
| 結果 | OK（常にOK。AI判定なし） | OK/NG（日付・金額・取引先が読めない→NG） |
| 送信方式 | チャンク512KB | FormData（全体送信） |
| 用途 | 大量ファイル即投入 | 仕訳AIチェック付きアップロード |

#### PC固有の定数・パラメータ（`useUpload.ts`）

| 定数 | 値 | 場所 | 説明 |
|---|---|---|---|
| `CONCURRENCY_PC` | 6 | L166 | classify API同時呼出数 |
| `COMPRESS_CONCURRENCY` | 4 | L535 | サムネイル生成の同時処理数 |
| `THUMB_MAX` | 200 | L256 | サムネイル最大幅/高さ（px） |
| `PREVIEW_HQ_MAX` | 800 | L257 | HQプレビュー最大幅/高さ（px） |
| `ENABLE_FRONTEND_COMPRESS` | false | L253 | フロント圧縮（無効=元ファイルをサーバーへ） |
| `COMPRESS_MAX_WIDTH` | 1280 | L254 | 圧縮有効時の最大幅（現在は未使用） |
| `COMPRESS_QUALITY` | 0.8 | L255 | 圧縮有効時のJPEG品質（現在は未使用） |
| `CHUNK_SIZE` | 512KB | L124 | チャンクアップロード単位（軽量モード用） |
| `MOBILE_BREAKPOINT` | 640px | L168 | PC/モバイル判定閾値 |

#### サムネイル生成の詳細（`compressAndThumbnail()`）

| ファイル種別 | 生成方法 | サムネイル（200px） | HQプレビュー（800px） |
|---|---|---|---|
| 画像（JPEG/PNG/WebP/HEIC） | `createImageBitmap` → canvas | ✅ JPEG 70% | ✅ JPEG 85% |
| PDF | `pdfjs-dist` → 1ページ目レンダリング | ✅ canvas → JPEG | ✅ canvas → JPEG |
| CSV/Excel | SVGアイコン生成（📊 + 拡張子名） | ✅ SVG | ❌ null |
| その他 | SVGアイコン生成（📎 + 拡張子名） | ✅ SVG | ❌ null |
| 非対応環境 | フォールバック | プレースホルダーSVG | ❌ null |

#### PC版UI構成（`MockUploadUnifiedPage.vue`）

```
┌─ PortalHeader ────────────────────────────────────┐
│  顧問先名                                         │
├───────────────────────────────────────────────────┤
│  ✓ 5  ⏳ 2  計 10件         ← 件数バッジ（L7-12）│
├────────────────┬──────────────────────────────────┤
│  左: upload-lane│  右: preview-panel               │
│                │                                  │
│  ┌ drop-zone ┐│  ┌ preview-header ──────────┐   │
│  │ D&Dゾーン ││  │ ファイル名         ✕    │   │
│  │ [選択]    ││  ├──────────────────────────┤   │
│  └──────────┘│  │                          │   │
│                │  │  preview-body            │   │
│  ┌ file-list ┐│  │  (img / iframe / 📄)     │   │
│  │⚠ 一括削除 ││  │                          │   │
│  │──────────││  │  800px HQ画像             │   │
│  │🖼 file1.jpg││  │  or PDFビューア           │   │
│  │  ✅ 領収書 ││  │  or 非対応メッセージ      │   │
│  │  ¥3,200   ││  │                          │   │
│  │  2026-04-17││  └──────────────────────────┘   │
│  │──────────││                                  │
│  │📄 scan.pdf ││                                  │
│  │  ⏳ 処理中 ││                                  │
│  │──────────││                                  │
│  │📊 data.csv ││                                  │
│  │  📎 参照資料││                                  │
│  └──────────┘│                                  │
├────────────────┴──────────────────────────────────┤
│  footer-bar: [合計: 10件]  [10枚を送付する]        │
└───────────────────────────────────────────────────┘
```

- テンプレート: L17-112（PC版セクション `v-if="!isMobile"`）
- **左カラム**（`upload-lane`）:
  - ドロップゾーン（L20-37）: `dragover` / `dragleave` / `drop` イベント
  - 一括削除バー（L39-46）: エラー・重複子ファイルの一括削除ボタン
  - ファイルリスト（L47-82）: `sortedEntries` でソート済み表示
    - ステータスアイコン（✅⚠⏳）
    - ファイル名 + サイズ
    - classifyバッジ群（証票種別 / 取引先 / 金額 / 日付 / 行数 / 重複グループ）
    - 削除ボタン（🗑️）
- **右カラム**（`preview-panel`）:
  - 未選択時: SVGアイコン + 「ファイルを選択またはドロップすると〜」（L87-96）
  - 選択時: ファイル名ヘッダー + 閉じるボタン + プレビュー本体（L97-110）
    - 画像: `<img>` — ObjectURL（処理中）or HQプレビュー（完了後）
    - PDF: `<iframe>` + `#zoom=page-fit`
    - その他: 「プレビュー非対応」メッセージ

#### ステータス遷移（UploadEntry.status）

```
queued → uploading → analyzing → ok
                               → error
```

| ステータス | 意味 | 表示 |
|---|---|---|
| `queued` | 圧縮済み、API呼出待ち | 待機中 |
| `uploading` | チャンク送信中 or FormData送信中 | ⏳ アップロード中... |
| `analyzing` | Gemini分類中 | ⏳ アップロード中... |
| `ok` | 正常完了 | ✅ + バッジ群 |
| `error` | エラー（日付/金額読取不能等） | ⚠️ + エラー理由 |

#### 5ゾーンソート（`sortedEntries` computed）

表示順序を決定する5ゾーンソート（L908-979）:

| ゾーン | 内容 | ソート順 |
|---|---|---|
| 1 | エラー含む重複グループ | グループ内: エラー先頭。グループ間: 投入順 |
| 2 | 単独エラー（重複なし） | completedAt降順（最新が上） |
| 3 | エラーなし重複グループ | グループ内: completedAt昇順。グループ間: 投入順 |
| 4 | 全てのOK（画像/PDF/CSV混在） | completedAt降順（最新が上） |
| 5 | 処理中（queued/uploading/analyzing） | addedAt昇順（投入順固定） |

#### プレビュー選択（`selectFile()`）

優先順位: 元File（ObjectURL）→ HQプレビュー（800px）→ サムネイル（200px）

- **処理中**: `e.file` が存在 → `URL.createObjectURL(file)` で高画質表示
- **完了後**: `e.file = null`（メモリ解放済み）→ `previewUrlHQ`（800px JPEG）で表示
- **PDF**: `<iframe>` + `#zoom=page-fit`（ブラウザ内蔵ビューア）

#### 方針: PCアップロードは現状維持

| 判断 | 理由 |
|---|---|
| 変更しない | クラッシュ問題なし。D&Dの利便性が高い |
| Drive選択は追加しない | PCのみの判断（Q-3確定済み） |

### 1-8. 本セッションで変更したファイル

| ファイル | 操作 | 備考 |
|---|---|---|
| `src/mocks/composables/useGooglePicker.ts` | **✅ 削除済み** | Picker API不使用のため。参照元なし確認済み |
| `src/api/services/drive/driveService.ts` | **✅ SA認証に改修済み** | googleapis公式クライアント使用。シングルトンパターン |
| `src/api/routes/drive.ts` | **✅ 新規作成** | GET /files + POST /process |
| `src/server.ts` | **✅ 更新** | `app.route('/api/drive', driveRoute)` 追加 |
| `src/mocks/views/MockDriveUploadPage.vue` | **✅ 新規作成** | スマホ独自UI（チェックボックス選択→一括送付） |
| `src/router/index.ts` | **✅ 更新** | `/drive-upload/:clientId` 追加 |
| `package.json` | **✅ 更新** | `googleapis` 依存追加 |

---

## 2. 方針決定事項

### ✅ 確定: スマホはDrive方式に一本化（直接アップロード廃止）

| 項目 | 決定 |
|---|---|
| スマホアップロード | **Google Drive経由に一本化**（直接アップロード廃止） |
| ドライブ種別 | **共有ドライブ（Shared Drive）**（Google Workspace契約済み） |
| フォルダ構造 | 共有ドライブ > 顧問先フォルダ（A社/B社/...） |
| 共有ドライブID保存 | **今: 環境変数 → Supabase移行時: 設定テーブル** |
| 顧問先フォルダID保存 | 顧問先マスタに紐付け（`ClientStub.driveId`を流用） |
| API両対応 | `supportsAllDrives=true` で共有ドライブ対応 |
| 認証方式 | **サービスアカウント**（顧問先にGoogleログイン不要） |
| UI方式 | **独自UI**（Picker API不使用。サーバーがDrive APIで一覧取得） |
| PC対応 | **スマホのみ**（PCは既存D&D方式を維持） |
| Google Cloudプロジェクト | **Vertex AIと同じプロジェクト** |

### フローの全体像（移行後）

```
┌─ 顧問先（スマホ） ────────────────────────────┐
│                                                │
│  ① 領収書を撮影 → Googleドライブアプリで       │
│     自動バックアップ（初回設定のみ）            │
│                                                │
│  ② 月末: 事務所のWebアプリを開く               │
│     ┌────────────────────────────┐            │
│     │  📁 ドライブから取り込み    │ ← タップ   │
│     └────────────────────────────┘            │
│                                                │
│  ③ 独自UI（サーバーがDrive APIで一覧取得）     │
│     ┌────────────────────────────┐            │
│     │ ☑ 📷 receipt1.jpg   3.2MB │            │
│     │ ☑ 📷 receipt2.jpg   4.1MB │ ← 全選択   │
│     │ ☑ 📷 receipt3.jpg   2.8MB │            │
│     │      ... 200件 ...         │            │
│     │     [200件を送付する]       │            │
│     └────────────────────────────┘            │
│            ↓ ファイルIDだけ送信                │
│            （スマホメモリ: 200件 × 40byte = 8KB）│
└────────────────────────────────────────────────┘
            ↓
┌─ Honoサーバー ──────────────────────────────────┐
│  サービスアカウント認証（秘密鍵。顧問先に見えない）│
│  ④ Drive APIでファイル取得（サーバー間通信）    │
│  ⑤ SHA-256 + サムネイル + 重複チェック         │
│  ⑥ AI分類（classify / Gemini）                 │
│  ⑦ 結果をフロントエンドに返す                  │
└────────────────────────────────────────────────┘
```

### サービスアカウント構成

```
事務所のGoogle Cloudプロジェクト（Vertex AIと共用）
  └── サービスアカウント（1つだけ。全顧問先共通）
        例: receipt-bot@my-project.iam.gserviceaccount.com
        ↓ 共有ドライブのメンバーに追加（1回だけ設定）
        ↓
      共有ドライブ
        ├── A社フォルダ ← 顧問先AのGoogleアカウントにも共有
        ├── B社フォルダ ← 顧問先BのGoogleアカウントにも共有
        └── C社フォルダ

費用:
  - サービスアカウント作成: 無料
  - Drive API呼び出し: 無料（日10億リクエスト上限）
  - 共有ドライブ: Google Workspace契約に含まれる（追加費用なし）
  - 顧問先のGoogleアカウント: 無料Gmail でOK（事務所は払わない）
```

### 現在 vs Drive方式

| 項目 | 現在（直接アップロード） | Drive方式 |
|---|---|---|
| ブラウザメモリ | 200枚 × 5MB = 1GB（即死） | 200件 × 40byte = 8KB |
| 実用上限 | 20枚 | **無制限** |
| 月200枚一括送付 | ❌ 不可能 | ✅ 可能 |
| 処理の信頼性 | ブラウザ依存（クラッシュ） | サーバー間通信（100%安定） |
| 顧問先の操作 | 撮影→Webで送信（2手順） | 撮影は自動同期。月末にWebで選択（1手順） |
| 必要なもの | なし | 顧問先のGoogleアカウント（無料Gmail） |
| サムネイル生成 | サーバー側（sharp 200px） | サーバー側（sharp 200px。同じ） |
| 重複チェック | サーバー側（SHA-256） | サーバー側（SHA-256。同じ） |

---

## 3. 決定済み事項（Q&A）

| # | 事項 | 決定 | 理由 |
|---|---|---|---|
| Q-1 | 認証方式 | **サービスアカウント** | 顧問先にGoogleログイン同意画面を見せない。独自UIと相性◎ |
| Q-2 | 既存チャンク方式（スマホ） | **廃止** | 20枚限界では200枚業務に対応不可。維持する意味がない |
| Q-3 | PCにDrive追加するか | **スマホのみ** | PCはD&Dで問題なし |
| Q-4 | Google Cloudプロジェクト | **Vertex AIと同じ** | API有効化・SA管理・請求が統一 |
| Q-5 | Console設定タイミング | **コード実装前に実施推奨** | SA秘密鍵がないとAPI動作確認不可。モック並行は可 |
| Q-6 | UI方式 | **独自UI** | Picker API / gapi / GIS 読み込み不要。軽量。デザイン自由 |

---

## 4. 実装コンポーネント（状態一覧）

| コンポーネント | 内容 | 状態 |
|---|---|---|
| Google Cloud設定 | Drive API有効化 + SA流用 + 共有ドライブにSA追加 | ✅ **完了** |
| 環境変数追加 | `GOOGLE_SA_KEY_PATH` / `VITE_SHARED_DRIVE_ID` | ✅ **完了** |
| Drive API接続テスト | SA認証で共有ドライブにアクセス確認 | ✅ **成功** |
| サーバー: Drive取得 | `driveService.ts`（SA認証 + ファイル一覧 + DL + ハッシュ+サムネイル） | ✅ **完了** |
| サーバー: エンドポイント | `GET /api/drive/files` + `POST /api/drive/process` | ✅ **完了** |
| フロント: 独自UI | `MockDriveUploadPage.vue` 新規作成（一覧+選択+送付+進捗） | ✅ **完了** |
| 削除: useGooglePicker.ts | Picker API不使用のため削除 | ✅ **完了** |
| フロント: useUpload拡張 | `addDriveFiles()` + UploadEntry型拡張 | ⬜ 必要に応じて後日 |

---

## 5. Drive API 呼び出し仕様

### 5-1. ファイル一覧取得

```
GET https://www.googleapis.com/drive/v3/files
  ?q='顧問先フォルダID' in parents
  &driveId=共有ドライブID
  &corpora=drive
  &supportsAllDrives=true
  &includeItemsFromAllDrives=true
  &fields=files(id,name,mimeType,size,createdTime,thumbnailLink)
  &orderBy=createdTime desc
  &pageSize=100
```

### 5-2. ファイルダウンロード

```
GET https://www.googleapis.com/drive/v3/files/{fileId}?alt=media
  &supportsAllDrives=true
Authorization: Bearer {accessToken}
```

### 5-3. 必要なスコープ

| スコープ | 用途 |
|---|---|
| `https://www.googleapis.com/auth/drive.readonly` | ファイル一覧 + ダウンロード |

---

## 6. 技術的制約・注意事項

| # | 制約 | 対策 |
|---|---|---|
| 1 | 共有ドライブはGoogle Workspace必須 | ✅ 事務所がWorkspace契約済み |
| 2 | 顧問先はGoogleアカウント（無料Gmail）が必要 | ドライブアプリでの写真同期に必須 |
| 3 | サービスアカウント秘密鍵の管理 | ✅ `.gitignore`の`*.json`で除外済み。OneDrive漏洩リスクも確認・排除済み |
| 4 | Drive APIダウンロードのファイルサイズ制限 | サーバー側でストリーム処理 |
| 5 | サムネイルURLの有効期限（Drive API thumbnailLink） | 独自UIではサーバーが都度取得。キャッシュ不要 |
| 6 | `code_quality.md` PowerShell禁止 | Node.jsスクリプトでファイル操作 |

---

## 7. 実装完了報告（2026-04-17）

### 7-1. SA（サービスアカウント）構成

| 項目 | 値 |
|---|---|
| プロジェクトID | `gen-lang-client-0837543731`（Vertex AIと共用） |
| SAメールアドレス | `sugu-suru@gen-lang-client-0837543731.iam.gserviceaccount.com` |
| 鍵ファイル | `./service-account-key.json`（`.gitignore`除外済み） |
| 共有ドライブID | `0AIOLCboQ_R-nUk9PVA` |
| SA権限 | 共有ドライブ「**管理者**」（2026-04-18 昇格。メンバー自動追加/削除に必要） |
| API接続テスト | ✅ 成功（2026-04-17 23:09 JST） |

### 7-2. 新規依存パッケージ

| パッケージ | バージョン | 用途 |
|---|---|---|
| `googleapis` | 最新 | Google Drive API v3（SA認証含む） |

### 7-3. セキュリティ確認

| 項目 | 状態 |
|---|---|
| SA鍵ファイルの`.gitignore`除外 | ✅ `*.json`ルールで除外確認済み |
| デスクトップ残留ファイル | ✅ 削除済み（OneDrive同期リスク排除） |
| ダウンロードフォルダ残留 | ✅ 全検索で残留なし確認済み |

### 7-4. 次のステップ

| # | タスク | 担当 |
|---|---|---|
| 1 | 共有ドライブにテスト画像を数枚配置 | ✅ 完了 |
| 2 | `/#/drive-upload/ABC-00001` でスマホ実機テスト | ✅ 完了 |
| 3 | 顧問先フォルダID（`sharedFolderId`）の実データ設定 | ✅ 完了（LDI-00008: `1SWizWuKizIzo6bUDocClsBfdwnXelLZv`） |
| 4 | Drive取込→drive-select→ゴミ箱移動の結合テスト | ✅ **完了**（2026-04-19。3件取込+ゴミ箱移動成功） |
| 5 | 独自アップロード→drive-selectの結合テスト | ✅ **完了**（2026-04-19。5件反映成功） |
| 6 | JSON永続化（サーバー再起動でもデータ保持） | ✅ **完了**（2026-04-19。DL-041） |
| 7 | AI分類との統合テスト | ❌ 未着手 |
| 8 | Supabase Auth `signInWithOAuth` コールバック内で `grantFolderPermission()` 呼び出し | ❌ 未着手 |
| 9 | Supabase Auth `signInWithPassword` / `signUp` 実装（パソコンのみフロー） | ❌ 未着手 |

---

## 8. ゲスト認証・Drive共有権限付与設計（2026-04-18 追加）

### 8-1. 全体フロー

```
招待リンク /guest/:clientId/login
  ↓ STEP 1: 共有方法を選ぶ（デフォルト: スマホも使う）
  ├─ パソコンのみ → メール認証（Supabase Auth signInWithPassword / signUp）
  └─ スマホも使う
       ↓ STEP 2: スマホ種類
       ├─ Android → STEP 3: Googleでログイン（OAuth）
       └─ iPhone  → STEP 3: Googleでログイン + STEP 4: ドライブアプリDL
                    ☝️「STEP 3に戻ってログイン」案内あり
  ↓ ログイン成功
  ├─ スマホ選択時: grantFolderPermission(folderId, email, 'writer') 自動実行
  ├─ localStorage に共有方法保存
  └─ /guest/:clientId（ポータル）に遷移
```

### 8-2. 権限レベル設計

| 操作 | writer（採用） | reader |
|---|---|---|
| ファイルアップロード | ✅ | ❌ |
| ファイル編集・上書き | ✅ | ❌ |
| フォルダ削除 | ❌（共有ドライブではorganizer以上が必要） | ❌ |
| 自分がアップしたファイル削除 | ✅ | ❌ |
| 他人のファイル削除 | ❌（共有ドライブ設定による） | ❌ |

### 8-3. ポータル表示ロジック（`MockPortalPage.vue`）

| 条件 | PCボタン | スマホボタン |
|---|---|---|
| パソコンのみでログイン | ✅ 表示 | ❌ 非表示 |
| スマホも使う + `sharedFolderId` あり | ✅ 表示 | ✅ 表示（Drive直リンク） |
| スマホも使う + `sharedFolderId` 未設定 | ✅ 表示 | ⚠️ 無効化（赤字「共有フォルダが未作成のため利用できません」） |

### 8-4. 修正ファイル一覧

| # | ファイル | 変更内容 |
|---|---|---|
| 1 | `MockPortalLoginPage.vue` | メール認証（ログイン/新規登録切替）、デバイス分岐、デフォルト「スマホも使う」、iPhone STEP4にログイン戻り案内 |
| 2 | `MockPortalPage.vue` | PC/スマホ2ボタン分岐、フォルダ未設定時エラー表示、`hasDriveFolder`判定 |
| 3 | `MockUploadSelectorUnifiedPage.vue` | Drive共有フォルダカードをGoogle Drive直リンクに変更 |
| 4 | `driveService.ts` | `grantFolderPermission()` 追加（writer権限付与） |
| 5 | `useClients.ts` | `Client`型に`sharedFolderId`追加、全モックデータにフィールド追加 |

### 8-5. 実証テスト結果（2026-04-18）

| テスト | 結果 |
|---|---|
| ログインページ全フロー（Android/iPhone/PC/新規登録） | ✅ |
| ポータル — PCのみ/スマホ2ボタン/フォルダ未設定 | ✅ |
| `grantFolderPermission()` でwriter権限自動付与 | ✅ |
| **スマホからDriveフォルダにアクセス → 写真・動画アップロード** | ✅ |
| **サーバー側でアップロードファイル確認（3件: jpg×2, mp4×1）** | ✅ |

- テストフォルダ: `TST_test-corp`（ID: `1SWizWuKizIzo6bUDocClsBfdwnXelLZv`）
- テストユーザー: `marke.hughug@gmail.com`（writer権限付与済み）

---

## 9. 資料管理基盤設計（DL-040）

### 9-1. 概要

資料（Drive/PCアップロードで取り込んだファイル）を統一的に管理する基盤。
資料選別画面と進捗管理画面が同じデータソース（DocEntry）を参照し、連動する。

### 9-2. 型定義（`repositories/types.ts`）

```typescript
export interface DocEntry {
  id: string              // UUID
  clientId: string        // 顧問先ID
  source: DocSource       // データソース（下記参照）
  fileName: string
  fileType: string        // MIMEタイプ
  fileSize: number        // バイト
  fileHash: string | null // SHA-256（重複検知用）
  driveFileId: string | null  // Drive fileId
  thumbnailUrl: string | null // サムネイルURL
  previewUrl: string | null   // プレビュー用画像パス
  status: DocStatus       // 選別ステータス（下記参照）
  receivedAt: string      // 取得日時（ISO 8601）
  batchId: string | null  // 選別完了→送出時に付与（batch-{clientId}-{timestamp}）
  journalId: string | null // 仕訳ID（選別完了→送出時にUUID付与）
}

export type DocSource = 'drive' | 'upload' | 'staff-upload' | 'guest-upload'
export type DocStatus = 'pending' | 'target' | 'supporting' | 'excluded'
```

> **2026-04-19 DL-041更新**: `source`に`staff-upload`/`guest-upload`追加、`status`に`supporting`（根拠資料）追加、`batchId`/`journalId`フィールド追加

### 9-3. SQL（`003_documents.sql`）

- documentsテーブル新規作成（10番目のテーブル）
- インデックス: client_id, client_status, drive_file_id（UNIQUE）, file_hash
- RLS: スタッフ=全顧問先アクセス可、顧問先ユーザー=自分の資料のみ

### 9-4. composable（`useDocuments.ts`）— 2026-04-19 DL-041でAPI接続へ改修

- モジュールスコープrefでフロント側キャッシュを保持（ページ遷移しても保持）
- サーバーAPI（`/api/doc-store`）経由でJSON永続化（`data/documents.json`）
- addDocuments/updateStatus/removeByClientIdはローカル即反映 + サーバーfire-and-forget
- `refresh(clientId?)` でサーバーから最新データを再取得可能
- createRepositories()に依存しない
- 型は`repositories/types.ts`から一元参照（二重定義禁止）

### 9-5. 算出ユーティリティ（`utils/documentUtils.ts`）

| 関数 | 用途 |
|---|---|
| `countUnsorted(docs)` | 未選別件数（送信確定前のトータル書類枚数。migrate後に0になる） |
| `latestReceivedDate(docs)` | 最新の資料受取日（receivedAtの最大値、YYYY/MM/DD形式） |
| `oldestUnexportedDate(docs)` | 最古の未出力資料日（将来用） |

### 9-6. UI変更

| 変更 | 内容 |
|---|---|
| ナビバー名称 | 「Drive資料選別」→「資料選別」 |
| ナビバー順序 | ホーム → **アップロード → 資料選別** → 出力 → 学習 → 設定 |
| 進捗管理 | 「未選別」列を「未出力」列の左に追加（オレンジハイライト） |
| 進捗管理 | 「未出力」列に赤ハイライト追加 |
| 資料選別ページ | ハードコードモック → useDocuments composable接続 |
| 進捗管理 | receivedDate/unsortedをDocEntryから動的算出（ハードコード排除） |

### 9-7. 業務フロー

```
本番: 1時間に1回バッチでDrive/独自を確認 → 新規資料を取り込み → 進捗管理の「未選別」列が通知
モック: 人間がAIに「アップした」と伝える → AIがrefにデータ投入
即時性: 不要（前日昼に届いたら翌朝に資料選別にあればOK）

業務パイプライン（ナビバーの左→右）:
  アップロード → 資料選別 → 出力
```

---

## 10. Drive借景方式設計（Drive-as-Primary-Storage）

> 確定日: 2026-04-21
> 前提: セクション0〜9の全内容を踏まえた上での方式転換

### 10-1. 方式転換の要旨

**旧方式（全コピー方式）**: Drive/PCからアップロード直後に全ファイルをサーバーのローカルディスク（`data/uploads/`）にコピーし、ローカルファイルを表示していた。

**新方式（Drive借景方式）**: **Driveを一次ストレージ（仮置き場）として使い、UIはDrive APIのサムネイル/メタデータを借景表示する。選別確定後に仕訳対象と根拠のみSupabaseに移行する。** 全ファイルをコピーしない。

| 項目 | 旧方式（全コピー） | 新方式（Drive借景） |
|---|---|---|
| ファイルの一次保管場所 | ローカルディスク / Supabase Storage | **Google Drive（顧問先フォルダ）** |
| 転送タイミング | アップロード直後に全件 | **選別確定後に対象分のみ** |
| UIのデータソース | ローカルファイルURL / Supabase Storage URL | **Drive API thumbnailLink（サーバープロキシ経由）** |
| Supabaseに入るデータ | 全ファイル（ゴミ含む） | **選別済みファイルのみ（純度100%）** |
| Driveの役割 | 一時的な通過点（DL後にゴミ箱） | **仮置き場（選別完了まで保持）** |

### 10-2. 全体アーキテクチャ

```
【入口】2経路 → Driveに集約
  ┌─ PC（D&D / ファイル選択）─────────────────────────────────┐
  │  ブラウザ → FormData POST → Honoサーバー                   │
  │  → Drive API files.create（顧問先フォルダにアップロード）  │
  │  → フロントはObjectURLで即時プレビュー（体感変化なし）     │
  └────────────────────────────────────────────────────────────┘
  ┌─ スマホ ───────────────────────────────────────────────────┐
  │  撮影 → Googleドライブアプリで自動バックアップ（設定1回）  │
  │  → サーバー/ブラウザ不要。ネイティブアプリが直接Driveに保存│
  └────────────────────────────────────────────────────────────┘

           ↓ 両方とも同じ顧問先フォルダに集約

【仮置き場】= Google Drive（顧問先フォルダ）
  ※ファイル実体はここにしかない
  ※Supabaseにはまだ入らない
  ※Driveの容量は月1GB/顧問先程度。選別後に削除で回転

           ↓

【選別画面】（drive-select）
  ┌──────────────────────────────────────────────────────────┐
  │  Drive API files.list → サムネイル借景表示                │
  │  人間がクリック → 1枚だけオンデマンドDL（フルプレビュー） │
  │                                                          │
  │  3分類:                                                   │
  │    ☑ 仕訳対象（target）   → Supabase移行                │
  │    ☑ 根拠資料（supporting）→ Supabase移行                │
  │    ☐ 仕訳外（excluded）   → ZIPでDL可能                 │
  └──────────────────────────────────────────────────────────┘

           ↓ 選別確定ボタン

【Supabase移行】（サーバーバッチ処理）
  target + supporting:
    Honoサーバー → Drive API DL → Supabase Storage PUT
                                → Supabase DB INSERT（DocEntry + AI分類結果）
  excluded:
    Driveに留置（ZIPリクエスト時にDL→ZIP生成→送信）

           ↓ 移行完了後

【Drive容量解放】
  移行済みファイル（target + supporting）→ Driveから削除
  excluded → ZIPダウンロード完了後に削除（or 一定期間後に自動削除）

           ↓

【後続の仕訳システム】
  Supabase DB/Storage のみ参照（Driveは無関係）
  Supabaseに入っているデータは「選別済み＝人間が確認済み」の純粋データ
```

### 10-3. PC版統合フロー

PC版も全てDrive経由に統一する。

#### アップロード時

```
① D&D or ファイル選択
   → addFiles() → rawQueue追加（現行と同じ）

② フロント即時プレビュー
   → URL.createObjectURL(file) でサムネイル表示（現行と同じ）
   → ユーザーの体感は変わらない

③ バックグラウンドでDriveアップロード
   → FormData POST /api/drive/upload
   → Honoサーバー → Drive API files.create（顧問先フォルダ）
   → 1枚あたり ~1-2秒（サーバー間通信）
   → 完了後にDrive fileIdを取得

④ アップロード完了
   → フロントのObjectURLを破棄
   → Drive fileId + メタデータを保持
   → 選別画面でDriveのサムネイルを借景表示可能になる
```

#### 体感速度

| 項目 | 現行（ローカル保存） | 統合後（Drive upload） |
|---|---|---|
| D&D直後のプレビュー | 即時（ObjectURL） | **即時（ObjectURL）**←変わらない |
| バックグラウンド保存 | ~10ms（ローカルディスク） | ~1-2秒（Drive API。裏で実行） |
| 選別画面への反映 | 即時 | アップロード完了後（数秒〜数十秒） |

**D&D直後のプレビューは即時表示。バックグラウンドでDriveにアップロードするため、ユーザー体感は現行と同等。**

### 10-4. 選別3分類

| 分類 | DocStatus | 意味 | Supabase移行 | Drive上の処理 |
|---|---|---|---|---|
| **仕訳対象** | `target` | 仕訳として記帳するファイル | ✅ Storage + DB | 移行後に削除 |
| **根拠資料** | `supporting` | 仕訳の裏付け（契約書・謄本等） | ✅ Storage + DB | 移行後に削除 |
| **仕訳外** | `excluded` | 仕訳に関係ないファイル | ❌ 入れない | ZIPでDL後に削除 |

```typescript
// repositories/types.ts（既存のDocStatus。変更なし）
export type DocStatus = 'pending' | 'target' | 'supporting' | 'excluded'
```

### 10-5. サムネイルプロキシ設計

Drive APIの`thumbnailLink`は認証付き一時URLのため、フロントから直接アクセスできない。
サーバー経由でプロキシする。

#### エンドポイント

```
GET /api/drive/files/:folderId
  レスポンス: {
    files: [
      {
        id: "DRIVE_FILE_ID",
        name: "receipt1.jpg",
        mimeType: "image/jpeg",
        size: 3200000,
        createdTime: "2026-04-21T10:00:00Z",
        thumbnailBase64: "data:image/jpeg;base64,/9j/4AAQ..."  ← サーバーで取得+base64変換
      },
      ...
    ]
  }

GET /api/drive/preview/:fileId
  レスポンス: ファイル実体（image/jpeg等）
  用途: 1枚クリック時のフルサイズプレビュー（オンデマンド）
```

#### パフォーマンス

| 操作 | データ量 | 処理時間 |
|---|---|---|
| 一覧取得（200枚・サムネイル付き） | ~2MB（200 × 10KB base64） | ~2-3秒 |
| フルサイズプレビュー（1枚） | ~3-5MB | ~1秒 |

### 10-6. Supabase移行パイプライン設計（選別確定時）

> 確定日: 2026-04-21
> 5つの堅牢性パターンを組み込んだ移行設計

#### ① キュー構造（Drive → Queue → Supabase）

**`POST /api/drive/migrate` はジョブ登録のみ。即レスポンス（~200ms）。**
バックグラウンドワーカーがキューから取り出して非同期処理する。

```
【フロント】
  選別確定ボタン押下
    ↓
  POST /api/drive/migrate { clientId, files: [{fileId, status}] }
    ↓
  レスポンス: { jobId, queued: N件 }  ← 即座に返る（200ms）
    ↓
  SSE or ポーリングで進捗監視（GET /api/drive/migrate/status/:jobId）

【サーバー（ジョブ登録）】
  POST /api/drive/migrate 受信
    ↓
  migration_jobs テーブルに1件ずつINSERT
    status = 'queued', retry_count = 0
    ↓
  レスポンス返却（HTTPコネクション解放）

【サーバー（バックグラウンドワーカー）】
  setInterval(5000) で定期実行
    ↓
  migration_jobs から status = 'queued' を最大5件取得
    ↓
  1件ずつ処理:
    a. status → 'processing' に更新
    b. Drive API DL（ストリーム受信）
    c. SHA-256ハッシュ計算
    d. Supabase Storage PUT
    e. Supabase DB INSERT（ON CONFLICT DO NOTHING）
    f. 成功 → status = 'done', Drive API trash
    g. 失敗 → retry_count++, status = 'queued'（再キュー）
              retry_count >= 3 → status = 'failed', last_error記録
```

**HTTPタイムアウトが原理的に発生しない。** POST /migrateは登録のみ。処理はバックグラウンド。

#### ② 冪等性（drive_file_id UNIQUE）

```sql
-- documents テーブル（003_documents.sql 拡張）
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  drive_file_id TEXT UNIQUE,  -- ★ DBレベルで重複を拒否
  file_hash TEXT,
  ...
);

-- 移行時のINSERT（冪等）
INSERT INTO documents (client_id, drive_file_id, file_hash, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (drive_file_id) DO NOTHING;
-- → 同じファイルを何回流しても1回扱い
```

**サーバー再起動・レースコンディション・手動リトライ、全てのケースで二重登録が発生しない。**

#### ③ リトライ設計

| 失敗原因 | HTTP Status | リトライ | 理由 |
|---|---|---|---|
| Drive APIレート制限 | 429 | ✅ 自動（バックオフ） | 数秒待てば通る |
| 一時ネットワーク障害 | 5xx / timeout | ✅ 自動（バックオフ） | 再試行で通る |
| Supabase一時障害 | 5xx | ✅ 自動（バックオフ） | 再試行で通る |
| ファイル削除済み | 404 | ❌ 即座にfailed | リトライしても無駄 |
| 認証エラー | 401/403 | ❌ 即座にfailed | SA鍵の問題。管理者対応 |

```
リトライ戦略:
  retry_count  待機時間（指数バックオフ）
  0 → 1       5秒
  1 → 2       25秒（5^2）
  2 → 3       125秒（5^3）
  3以上        → status = 'failed'、last_error に原因記録
               → 管理画面で確認。手動リトライ or 破棄を判断
```

#### ④ 小分け処理

ワーカーは **1回のポーリングで最大5件** を取り出して逐次処理する。

```
一気に流さない理由:
  200枚一括 → サーバーメモリ1GB消費 + Drive APIレート制限に到達
  5枚ずつ  → サーバーメモリ25MB + APIレート制限に到達しない

ワーカーのポーリング間隔: 5秒
  → 5件/5秒 = 60件/分 = 200件を3分20秒で処理
  → 人間の体感: 「3分で全件完了」（十分）
```

#### ⑤ 移行ジョブのステート管理

```sql
-- migration_jobs テーブル（新設）
CREATE TABLE migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,           -- バッチ単位のジョブID（1回の選別確定 = 1 job_id）
  client_id TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  doc_status TEXT NOT NULL,       -- 'target' | 'supporting'（選別結果）
  migration_status TEXT NOT NULL DEFAULT 'queued',
                                   -- 'queued' | 'processing' | 'done' | 'failed'
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,                -- 失敗時のエラーメッセージ
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_migration_status ON migration_jobs (migration_status)
  WHERE migration_status IN ('queued', 'processing');
```

DocStatus（選別の分類）とmigration_status（移行処理の状態）は**完全に独立した概念**。混ぜない。

```
DocStatus（人間が設定）:        pending → target / supporting / excluded
migration_status（システム管理）: queued → processing → done / failed
```

#### 移行パイプライン全体フロー

```
選別確定ボタン押下
  ↓
① メタデータ集計
   target: N件、supporting: M件、excluded: K件
   → 確認モーダル「仕訳対象N件 + 根拠M件をSupabaseに移行します。仕訳外K件はZIPでDL可能です」

② ジョブ登録（POST /api/drive/migrate）
   → migration_jobs に N+M 件を status='queued' でINSERT
   → レスポンス: { jobId, queued: N+M }（即座に返却）

③ バックグラウンドワーカーが処理
   → 5件ずつ取り出し → Drive DL → Supabase PUT/INSERT → Done or Failed
   → 失敗 → retry_count++ → 3回超えたらfailed隔離
   → 冪等性保証: drive_file_id UNIQUE で二重登録を防止

④ フロント進捗監視
   → GET /api/drive/migrate/status/:jobId（ポーリング 3秒間隔）
   → レスポンス: { total, queued, processing, done, failed }
   → 全件 done + failed → 完了表示

⑤ 完了後
   → done件のDriveファイルはゴミ箱移動済み
   → failed件は管理画面で確認→手動リトライ or 破棄
   → excluded件はDriveに留置（ZIPダウンロード可能）
```

#### エラーリカバリ

| 失敗箇所 | 影響 | リカバリ |
|---|---|---|
| Drive DL失敗 | Supabaseに入らない。Driveにファイルは残る | 自動リトライ（3回）。404なら即failed |
| Supabase Storage PUT失敗 | ファイル未保存 | 自動リトライ。Drive側は未削除 |
| Supabase DB INSERT失敗 | メタデータ未保存 | Storage DELETE → リトライ（トランザクション） |
| Drive trash失敗 | フォルダにファイルが残る | status=doneは確定（データ損失なし）。trashDriveFile()を即3回リトライ（5秒→25秒→125秒）。3回失敗→ログのみ。冪等性②でフォルダに残っても二重移行されない |
| ワーカー自体がクラッシュ | processing状態のまま停止 | 起動時にprocessing→queued に戻す（デッドレター処理） |

**全てのケースでDriveにファイルが残っているため、リトライ可能。データロスのリスクが極めて低い。**

### 10-7. 仕訳外ZIPダウンロード仕様

```
「仕訳外をZIPでダウンロード」ボタン押下
  ↓
Honoサーバー:
  ① Drive API で excluded ファイルを逐次DL（ストリーム）
  ② archiver (npm) でZIPストリーム生成
  ③ HTTP レスポンスで chunk 送信（Transfer-Encoding: chunked）
  ↓
ブラウザ: excluded_20260421.zip としてDL
  ↓
DL完了後:
  「DL確認済み。Driveから削除」ボタン押下（手動確認。B方式）
  → Drive上のexcludedファイルをゴミ箱移動（容量解放）
  ↓
セーフティネット（C方式）:
  選別確定から30日経過したexcludedファイルは自動でゴミ箱移動
  → 確認ボタンを押し忘れても容量は回転する
```

#### excluded削除タイミング（確定）

**B + C 併用方式を採用。**

| 方式 | トリガー | タイミング |
|---|---|---|
| **B. 確認ボタン（主）** | ZIP DL後に「DL確認済み。Driveから削除」ボタン | ユーザー操作時 |
| **C. 自動削除（副）** | 選別確定から30日経過 | 定期バッチ（日次） |

- Bだけだとボタン押し忘れで溜まる → Cがセーフティネット
- Driveのゴミ箱は30日後にGoogleが完全削除 → ゴミ箱の中はノータッチ

#### パフォーマンス見積

| ファイル数 | 合計サイズ | 処理時間 | サーバーメモリ |
|---|---|---|---|
| 20枚 | 100MB | ~30秒 | ~10MB（ストリーム） |
| 80枚 | 400MB | ~2分 | ~10MB（ストリーム） |
| 200枚 | 1GB | ~5分 | ~10MB（ストリーム） |

**ストリーム処理（Drive DL → archiver → HTTPレスポンスのパイプライン）により、サーバーメモリは10MB程度で一定。**

### 10-8. Drive容量管理

```
月間データ量:
  月200枚 × 5MB = 1GB/顧問先
  10顧問先 × 1GB = 10GB

Google Workspace Business Standard: 2TB/ユーザー
  → 使用率 0.5%。問題なし

容量回転:
  target/supporting: Supabase移行成功 → 即ゴミ箱移動
  excluded: 確認ボタン（B方式） or 30日経過（C方式） → ゴミ箱移動
  → 月末に仮置きデータがリセットされる

最悪ケース（選別を3ヶ月放置）:
  3ヶ月 × 10GB = 30GB → それでも2TBの1.5%
```

#### pending（未選別）ファイルの扱い（確定）

**何もしない。警告も不要。**

- pendingファイルは次回選別画面を開いた時にDrive一覧に表示される
- ユーザーは自然に気づいて選別する
- Drive容量は十分（2TB）なので放置しても問題なし

---

## 11. 現行方式からの差分一覧

### 11-1. 廃止するもの

| 廃止対象 | 現在のファイル | 参照箇所 | 理由 |
|---|---|---|---|
| `data/uploads/` ローカル保存 | `downloadAndProcessDriveFile()` L321-330 | drive.ts, docStore.ts | Driveが一次ストレージになるため不要 |
| `POST /api/doc-store/upload-file` | `docStore.ts` L128-159 | `useUpload.ts` L880, `MockUploadDocsPage.vue` L385 | Drive API uploadに置き換え |
| `documentStore.ts` JSON永続化 | `documentStore.ts` 全211行 | `docStore.ts`, `drive.ts` | 選別前: Drive。選別後: Supabase DB |
| `POST /api/drive/process`（DL+ゴミ箱移動） | `drive.ts` L154-239 | `MockDriveSelectPage.vue` L411, `MockDriveUploadPage.vue` L317 | 即時DL+ゴミ箱方式を廃止。Driveに留置 |
| blob URL / ローカルファイルURL | `useUpload.ts` | 複数画面 | Drive APIサムネイル/プレビューに置き換え |

### 11-2. 新設するもの

| 新設対象 | 内容 | 備考 |
|---|---|---|
| `GET /api/drive/files/:folderId`（拡張） | サムネイルbase64付きファイル一覧 | 既存の`GET /api/drive/files`をサムネイルbase64埋め込みに拡張 |
| `GET /api/drive/preview/:fileId` | フルサイズプレビュー（オンデマンドDL） | 新設。`downloadAndProcessDriveFile`のDL部分を切り出し |
| `POST /api/drive/upload` | PC D&D → サーバー → Drive API files.create | 新設。`createDriveFolder`と同じSA認証を使用 |
| `POST /api/drive/migrate` | 選別確定→**ジョブ登録のみ（即レスポンス）** | ①キュー構造。処理はワーカーが非同期実行 |
| `GET /api/drive/migrate/status/:jobId` | 移行進捗監視（total/queued/done/failed） | フロントがポーリング（3秒間隔）で呼び出し |
| `GET /api/drive/download-excluded` | 仕訳外ZIPダウンロード | 新設。`archiver` npm依存追加が必要 |
| `migration_jobs` テーブル | 移行ジョブのステート管理 | ⑤ステート管理。queued/processing/done/failed |
| `migrationWorker.ts` | バックグラウンドワーカー（5秒ポーリング） | ③リトライ + ④小分け処理（最大5件/回） |

### 11-3. 変更するもの

| 変更対象 | 行数 | 変更内容 | 変更規模 |
|---|---|---|---|
| `MockDriveSelectPage.vue` | 720行 | データソース差し替え（useDocuments → Drive API）。**3分類UI・ショートカット・Undo/Redo・ズーム・PDFは全て流用** | 小（L190-210のimport+onMounted部分のみ） |
| `MockDriveUploadPage.vue` | 422行 | 「送付」→「選別」に転用。3分類ボタン追加。`handleProcess`削除 | 中（L306-380の処理フロー変更） |
| `driveService.ts` | 401行 | `uploadToDrive()`, `getFilePreview()`, `getFilesWithThumbnails()` 追加 | 中（関数3本追加） |
| `drive.ts` | 266行 | 5エンドポイント追加。`/process`は段階的に非推奨化 | 中 |
| `documents` テーブル | — | `drive_file_id TEXT UNIQUE` 制約追加（②冪等性） | 小（SQL 1行） |
| `server.ts` | — | `startMigrationWorker()` 呼び出し追加 | 小（起動時に1行追加） |
| `useUpload.ts` | ~940行 | `handleConfirm`のアップロード先をローカル→Drive APIに変更 | 小（L880付近の1箇所） |
| `useDocuments.ts` | 198行 | 選別前: Drive APIからデータ取得。選別後: Supabase DBから取得 | 中（データソース切替ロジック追加） |

---

## 12. 技術的検証結果（2026-04-21確認済み）

| 検証項目 | 判定 | 根拠 |
|---|---|---|
| スマホメモリ非依存 | ✅ 成立 | Fileオブジェクトを一切生成しない。ファイルIDのみ |
| 独自UI | ✅ 成立 | Drive APIメタデータ + サーバープロキシでサムネイル表示 |
| 3分類選別 | ✅ 成立 | 既存のDocStatus型（target/supporting/excluded）と完全一致 |
| target+supporting → Supabase | ✅ 成立 | サーバー間通信。トランザクション設計で整合性保証 |
| excluded → ZIP DL | ✅ 成立 | ストリームZIPでサーバーメモリ~10MB。処理時間は枚数依存 |
| PC D&D体感速度 | ✅ 変化なし | ObjectURLで即時プレビュー→裏でDrive upload |
| Drive容量 | ✅ 問題なし | 月10GB程度。2TBの0.5%。選別後に削除で回転 |
| エラーリカバリ | ✅ 全ケースでリトライ可能 | Driveにファイルが残るため、失敗してもデータロスなし |

---

## 13. 実装フェーズ

| フェーズ | 内容 | 前提 |
|---|---|---|
| **Phase A** | サムネイルプロキシAPI（`GET /api/drive/files`, `GET /api/drive/preview`） | 現行のdriveService.ts |
| **Phase B** | 選別画面改修（既存画面流用。データソース差し替え + スマホ版3分類追加） | Phase A |
| **Phase C** | PC版Drive upload統合（`POST /api/drive/upload`） | Phase A |
| **Phase D** | Supabase移行バッチ — **全3種別（target/supporting/excluded）をSupabaseに移動**。Drive全ゴミ箱 | Phase B + Supabase Storage接続 |
| **Phase E** | 仕訳外ZIPダウンロード（**Supabase Storageから取得**）+ 二重DL防止 + 肥大化防止 | Phase D |
| **Phase F** | 旧方式の廃止（`data/uploads/`・`documentStore.ts` JSON永続化・`upload-file` API・`/process` API） | Phase A〜E全完了 |

---

## 14. 技術的現状調査（2026-04-21コードベース分析）

### 14-1. 既存Drive API実装（driveService.ts 401行）

#### 実装済みの関数

| 関数 | 行 | 責務 | Drive借景方式での扱い |
|---|---|---|---|
| `getDriveClient()` | L63-83 | SA認証シングルトン | ✅ そのまま流用 |
| `createDriveFolder()` | L94-141 | フォルダ新規作成（重複チェック付き） | ✅ そのまま流用 |
| `renameDriveFolder()` | L149-164 | フォルダリネーム | ✅ そのまま流用 |
| `shareFolderWithEmail()` | L173-194 | メールアドレスに共有権限付与 | ✅ そのまま流用 |
| `trashDriveFile()` | L202-212 | ファイルをゴミ箱移動 | ✅ 流用（移行完了後に呼び出し） |
| `checkFolderExists()` | L220-244 | フォルダ存在確認 | ✅ そのまま流用 |
| `listDriveFiles()` | L254-287 | ファイル一覧取得（メタデータ+thumbnailLink） | **🔧 拡張**: サムネイルbase64の埋め込み追加 |
| `downloadAndProcessDriveFile()` | L298-362 | DL+ハッシュ+ローカル保存+サムネイル | **🔧 分割**: DL部分→`getFilePreview()`, ローカル保存部分→廃止 |
| `grantFolderPermission()` | L378-400 | ゲストにDrive権限付与 | ✅ そのまま流用 |

#### 追加する関数

| 関数 | 責務 | 技術的根拠 |
|---|---|---|
| `getFilesWithThumbnails(folderId)` | listDriveFiles + 各ファイルのサムネイルDL + base64変換 | `getDriveClient()`のSA認証でthumbnailLinkのHTTPクライアント取得が可能 |
| `getFilePreview(fileId)` | `files.get(fileId, {alt: 'media'})` でバイナリ返却 | 既存の`downloadAndProcessDriveFile`のL306-316と同等のコード |
| `uploadToDrive(folderId, buffer, fileName, mimeType)` | `files.create`で顧問先フォルダにアップロード | `createDriveFolder`と同じ`supportsAllDrives: true`パターン |
| `migrateToSupabase(fileIds, clientId)` | Drive DL → Supabase Storage PUT → Supabase DB INSERT | Phase D。Supabase接続が前提 |
| `generateExcludedZip(fileIds)` | Drive DL → archiverでストリームZIP生成 | Phase E。`archiver` npm追加が必要 |

### 14-2. 既存APIルート（drive.ts 266行）

| エンドポイント | 行 | Drive借景方式での扱い |
|---|---|---|
| `GET /files` | L25-45 | **🔧 拡張**: サムネイルbase64を埋め込み返却に変更 |
| `POST /folder` | L51-84 | ✅ そのまま流用 |
| `GET /folder/check` | L90-105 | ✅ そのまま流用 |
| `PATCH /folder/rename` | L111-127 | ✅ そのまま流用 |
| `POST /process` | L154-239 | **⚠️ 段階的廃止**: 現在はDL+ローカル保存+ゴミ箱移動。借景方式では不要 |
| `POST /grant-permission` | L246-263 | ✅ そのまま流用 |

### 14-3. 既存選別画面の流用可能分析

#### MockDriveSelectPage.vue（PC版 720行）

```
流用可能（変更不要）:
  ✅ 3分類ボタン（target/supporting/excluded）    L150-161
  ✅ キーボードショートカット（A/S/D/F/W/Z）      L474-487
  ✅ Undo/Redo（undoStack/redoStack）               L303-326
  ✅ ズーム制御（doZoomIn/doZoomOut/doZoomReset）   L247-259
  ✅ PDF.jsプレビュー + ページ送り                  L104-114, L211-220
  ✅ 件数サマリー（pending/target/supporting/excluded） L293-301
  ✅ 完了モーダル（sendToProcess）                  L171-186
  ✅ サイドバーサムネイル一覧                       L38-57
  ✅ ステータスバッジ表示                           L454-472
  ✅ CSS全490行                                     L490-719

変更が必要:
  🔧 データソース（useDocuments → Drive API）       L190-210（~20行変更）
  🔧 imagePath（ローカルURL → base64/ProxyURL）     L232, L125（2箇所）
  🔧 handleImport（取り込み→削除 or 更新ボタンに）  L380-452（~70行変更）
  🔧 sendToProcess（removeByClientId → migrate API） L366-375（~10行変更）

変更率: ~100行 / 720行 = 約14%。86%がそのまま流用可能。
```

#### MockDriveUploadPage.vue（スマホ版 422行）

```
流用可能（変更不要）:
  ✅ ファイル一覧レイアウト                         L48-106
  ✅ ローディング/エラー/空表示                     L10-32
  ✅ プログレスバー                                 L113-125
  ✅ 完了モーダル                                   L149-171
  ✅ ファイル選択（toggleFile/toggleSelectAll）      L291-304
  ✅ ユーティリティ（formatSize/formatDate）         L388-405
  ✅ PortalHeaderコンポーネント                      L4-5
  ✅ CSS 全11行                                      L411-421

変更が必要:
  🔧 handleProcess（DL+ゴミ箱 → 3分類選別に変更）   L307-380（~70行書き換え）
  🔧 送付ボタン → 3分類ボタン追加                   L134-145（~10行変更）
  🔧 thumbnailLink（Drive直URL → ProxyAPI）          L78（1箇所）
  🔧 fetchFiles（サムネイルbase64対応）              L229-267（~10行変更）

変更率: ~90行 / 422行 = 約21%。79%がそのまま流用可能。
```

### 14-4. 型定義の状況（repositories/types.ts）

| 型 | 行 | Drive借景方式との整合性 |
|---|---|---|
| `DocSource` | L311 | ✅ `'drive' | 'upload' | 'staff-upload' | 'guest-upload'` — そのまま使用 |
| `DocStatus` | L314 | ✅ `'pending' | 'target' | 'supporting' | 'excluded'` — 3分類と完全一致 |
| `DocEntry` | L324-363 | ✅ `driveFileId`, `thumbnailUrl`, `previewUrl`, `fileHash` — 全フィールドそのまま使用 |
| `DocumentRepository` | L374-386 | ✅ `getByClientId`, `updateStatus`, `save`, `saveBatch` — Supabase移行時にこのinterfaceを実装 |

**型の変更は一切不要。既存の型定義がDrive借景方式と完全に整合している。**

### 14-5. 環境変数の状況

| 変数 | 値 | 状態 |
|---|---|---|
| `GOOGLE_SA_KEY_PATH` | `./service-account-key.json` | ✅ 設定済み |
| `VITE_SHARED_DRIVE_ID` | `0AIOLCboQ_R-nUk9PVA` | ✅ 設定済み |
| `SUPABASE_URL` | `https://cujksbvnzjxbklhofyfu.supabase.co` | ✅ 設定済み |
| `SUPABASE_SERVICE_ROLE_KEY` | （設定済み） | ✅ サーバー側バッチ処理で使用 |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | （設定済み） | ✅ フロントエンド用 |

**Phase A〜C（Drive API系）はSA鍵+共有ドライブIDが設定済みのため即着手可能。Phase D（Supabase移行）もSupabase接続情報が揃っているため環境的にはブロッカーなし。**

### 14-6. ルーティング状況

| ルート | 画面 | 備考 |
|---|---|---|
| `/drive-select/:clientId` | `MockDriveSelectPage.vue` | PC版選別画面。リダイレクト `/client/drive-select/:clientId` あり |
| `/drive-upload/:clientId` | `MockDriveUploadPage.vue` | スマホ版。ゲスト用 `/drive-upload/:clientId/guest` も存在 |
| `/mock/drive-select` | リダイレクト → `/drive-select/ABC-00001` | 開発用ショートカット |

### 14-7. npm依存の状況

| パッケージ | 状態 | Phase |
|---|---|---|
| `googleapis` | ✅ インストール済み（v171.4.0） | A, B, C |
| `sharp` | ✅ インストール済み（v0.34.5） | A（サムネイル生成用。流用） |
| `@supabase/supabase-js` | ✅ インストール済み（v2.102.1） | D |
| `archiver` | ❌ 未インストール | **E（要 `npm i archiver @types/archiver`）** |

### 14-8. upload-file API参照箇所（Phase F廃止時の削除対象）

| ファイル | 行 | 参照 |
|---|---|---|
| `docStore.ts` | L124-159 | エンドポイント定義 |
| `useUpload.ts` | L880 | `fetch('/api/doc-store/upload-file', ...)` |
| `MockUploadDocsPage.vue` | L385 | `fetch('/api/doc-store/upload-file', ...)` |

---

## 15. 仕訳外ファイルライフサイクル設計（2026-04-21 追加）

### 15-1. 全体フロー

```
① Drive保存（一次ストレージ。スマホ/PCから投入）
      ↓
② UIで3種別に選別（target / supporting / excluded）
      ↓
③ 全３種別をSupabaseに移動（種別情報を付与してStorage + DB）
    - target/supporting: Supabase Storage + DB（doc_status付き）
    - excluded: Supabase Storage + DB（doc_status='excluded'付き）
      ↓
④ Drive → ゴミ箱（全ファイル。Supabase移動完了後）
      ↓
⑤ 仕訳外ZIPダウンロード（Supabase Storageから取得）
    - 移行完了モーダル内ボタン（主導線）
    - 選別画面常設ボタン（DLし忘れ対策）
      ↓
⑥ 過去分も遡ってDL可能（Supabase DBに記録が残っている）
    - 「2026年4月分のexcluded」のようにバッチ単位で過去DL
      ↓
⑦ 一定期間後にSupabaseからexcluded Storageファイル削除（肥大化防止）
    - DL済み（downloaded_atがある）かつ 90日経過 → Storage削除
    - DB記録は残す（履歴保持）
    - 未DL（downloaded_at IS NULL）のファイルは削除しない
```

### 15-2. 重要な設計判断

| 項目 | 判断 | 理由 |
|------|------|------|
| excludedのSupabase移行 | **する** | 移行しないと「何がexcludedだったか」が不明になる |
| Driveゴミ箱対象 | **全3種別** | Supabase移動完了後にDriveを空にする。例外なし |
| ZIP DL元 | **Supabase Storage** | Driveは既に空。Supabaseが唯一のデータ源 |
| 二重DL防止 | **downloaded_atカラム** | 初回DL時にタイムスタンプ記録。次回はNULLのみ対象 |
| 過去DL | **可能** | `?all=true`でdownloaded_at済みも含めて再DL |
| 肥大化防止 | **90日後に自動削除** | Storageファイルのみ削除。DB履歴は永続保持 |

### 15-3. migration_jobsテーブル拡張

```sql
-- Phase Eで追加するカラム
ALTER TABLE migration_jobs ADD COLUMN downloaded_at TIMESTAMPTZ;
ALTER TABLE migration_jobs ADD COLUMN storage_path TEXT;
ALTER TABLE migration_jobs ADD COLUMN file_hash TEXT;
ALTER TABLE migration_jobs ADD COLUMN storage_purged_at TIMESTAMPTZ;
```

| カラム | 用途 |
|--------|------|
| `downloaded_at` | ZIP DL済みフラグ。NULL = 未DL |
| `storage_path` | Supabase Storage上のパス（`documents/{clientId}/{hash}.{ext}`） |
| `file_hash` | SHA-256ハッシュ（冪等性確認用） |
| `storage_purged_at` | Storageファイル削除日時。NULL = 未削除 |

### 15-4. API一覧

| エンドポイント | 責務 |
|------------------|------|
| `GET /api/drive/download-excluded/:clientId` | 未DLのexcludedをZIPで返却。DL後にdownloaded_at記録 |
| `GET /api/drive/download-excluded/:clientId?all=true` | 全excluded（DL済み含む）をZIPで返却 |

### 15-5. フロント側UI配置

```
導線1: 移行完了モーダル内（主導線）
┌─────────────────────────┐
│      ✅ 移行完了         │
│  5件移行完了。           │
│  仕訳外: 3件             │
│                         │
│  [📥 仕訳外をZIP DL]    │  ← excluded件数がある場合のみ表示
│  [閉じる]               │
└─────────────────────────┘

導線2: 選別画面ヘッダー常設ボタン（DLし忘れ対策）
┌──────────────────────────────────────┐
│  📂 LDI（株）  [🔄 更新] [📥 仕訳外DL (3)]  │  ← 未DL件数をバッジ表示
└──────────────────────────────────────┘
```

---

## 16. データアクセス抽象化（2026-04-21 追加）

### 16-1. 設計背景

Phase D/Eの実装当初、migrationRepositoryとStorageServiceがSupabase直叩きだったため、
dev環境（JSON永続化 + APIサーバー方式）で一切テストできない状態だった。

既存のRepositoryパターン（`src/repositories/` の interface + mock/supabase切り替え）に合わせて
サーバーサイドのデータアクセス層もinterface化・ファクトリ方式に統一した。

### 16-2. ファイル構成

```
src/api/lib/
  └── storage.ts                        ← StorageProvider interface + ファクトリ
                                           - createLocalProvider()  : data/storage/ にファイル保存
                                           - createSupabaseProvider(): Supabase Storage API
                                           - StorageService class   : 公開API（呼び出し側変更不要）

src/api/services/migration/
  ├── migrationRepository.ts            ← MigrationRepository interface + ファクトリ + 互換ラッパー
  ├── migrationRepository.json.ts       ← JSON永続化版（data/migration_jobs.json）
  └── migrationRepository.supabase.ts   ← Supabase版（migration_jobsテーブル）
```

### 16-3. 切り替え方式

| 環境変数 | 値 | Repository | Storage |
|---------|-----|-----------|---------|
| `USE_SUPABASE_MIGRATION` | 未設定（デフォルト） | JSON版 | ローカルファイル版 |
| `USE_SUPABASE_MIGRATION` | `true` | Supabase版 | Supabase Storage版 |

### 16-4. 呼び出し側への影響

**なし。** 以下の既存importはそのまま動作する：

```typescript
// migrationWorker.ts / excludedZipService.ts / drive.ts
import { enqueueMigrationJobs, dequeueJobs, ... } from './migrationRepository';
import { StorageService } from '../../lib/storage';

// これらの呼び出しは内部でファクトリ経由で適切な実装に委譲される
await StorageService.uploadImage(buffer, path, mimeType);
await enqueueMigrationJobs(jobId, clientId, files);
```

### 16-5. ローカルファイル保存先

| データ | パス | gitignore |
|--------|------|-----------|
| 移行ジョブ | `data/migration_jobs.json` | ✅（`data/` で除外） |
| ファイル実体 | `data/storage/{storagePath}` | ✅（`data/` で除外） |

### 16-6. 既存パターンとの対応

| レイヤー | 既存（フロントサイド） | 新規（サーバーサイド） |
|---------|----------------------|---------------------|
| interface定義 | `repositories/types.ts` | `migrationRepository.ts` |
| mock実装 | `repositories/mock/` | `migrationRepository.json.ts` |
| Supabase実装 | `repositories/supabase/` | `migrationRepository.supabase.ts` |
| 切り替え | `VITE_USE_MOCK` | `USE_SUPABASE_MIGRATION` |
| ファクトリ | `repositories/index.ts` | `migrationRepository.ts` 内 |

---

## 17. classify API仕様（UIプレビュー用軽量AI）

> 旧 22_classify_realtime_validation.md を統合（2026-04-29）

### 17-1. classifyの役割と限界

**classifyはアップロード時のUIプレビュー表示専用。仕訳一覧が期待する型（JournalPhase5Mock）は一切出力しない。**

| | classify API（UIプレビュー用） | Extract API（本番仕訳生成）※未実装 |
|---|---|---|
| **目的** | アップロード画面で種別・金額・日付をプレビュー表示 | 仕訳一覧が期待する全フィールド（科目、税区分、補助等）を出力 |
| **出力** | source_type, direction, line_items（粗い） | JournalPhase5Mock型の完全な仕訳データ |
| **発火** | 独自アップロード時に即時（画像1枚ずつ） | **選別確定時**（独自+Drive全証票をまとめて） |
| **入力** | 画像1枚 | **独自+Driveの全証票をバッチ投入** |
| **出力の寿命** | 選別確定後に**削除**（再利用価値なし） | 永続保存（仕訳一覧UI → CSV出力） |

### 17-2. なぜExtract APIは選別確定時に発火するか

Driveと独自アップロードの証票が揃うタイミングが選別確定時。バラバラにAIにかけるのではなく、全証票をまとめて渡す必要がある。

```
独自アップロード → classify（UIプレビュー）→ DocEntry保存
Drive連携        → ファイルID取得のみ       → DocEntry保存
                    ↓
              選別画面で証票が集約される
                    ↓
              ユーザーが確定送信ボタン押下
                    ↓
              Extract API発火（全証票バッチ投入）
                    ↓
              JournalPhase5Mock[] 生成 → 仕訳一覧UIに表示
                    ↓
              classifyの出力を削除（不要になったため）
```

### 17-3. classify バリデーション仕様

#### 対象ルート（4つ）= すべて同じAI処理＋バリデーション

| ルート | UI | ロール |
|---|---|---|
| `/upload/:clientId/staff/mobile` | スマホ用 | 事務所スタッフ |
| `/upload/:clientId/staff/pc` | PC用 | 事務所スタッフ |
| `/upload/:clientId/guest/mobile` | スマホ用 | 顧問先ゲスト |
| `/upload/:clientId/guest/pc` | PC用 | 顧問先ゲスト |

#### 対象外

| ルート | 理由 |
|---|---|
| `/upload-docs/:clientId` | CSV・エクセル・謄本・税務届等。AIバリデーション不要 |

#### AIが返す項目とバリデーション

| 項目 | AIが返す値 | バリデーション |
|---|---|---|
| `date` | `YYYY-MM-DD` or null | **nullならNG**（撮り直し） |
| `total_amount` | 数値 or null | **nullまたは0以下ならNG** |
| `issuer_name` | 文字列 or null | 警告のみ（NGにはしない） |
| `source_type` | 11種enum | `non_journal` / `other` → 除外フラグ |
| 重複 | SHA-256 + 日付+金額+取引先の一致 | ⚠警告表示（ブロックしない） |

#### テスト用追加項目

| 項目 | 単位 | 用途 |
|---|---|---|
| `date` | `YYYY-MM-DD` | 証票の日付 |
| `duration_seconds` | 秒（整数 or 小数） | 処理時間 |
| `token_count` | 整数 | 入力+出力トークン合計 |
| `cost_yen` | 円（小数） | 利用料 |

#### 処理フロー

```
4ルートすべて
  → MockUploadPage.vue / MockUploadPcPage.vue
    → analyzeReceipt(file)
      → 現状: analyzeReceiptMock()     ← ランダム
      → 本番: POST /api/pipeline/classify  ← AIが判定
        → 前処理（image_preprocessor.ts）
        → Gemini classify
        → postprocess（バリデーション+fallback）
        → レスポンスを ReceiptAnalysisResult に変換
          → date/amount が null → ok: false, errorReason表示
          → date/amount が有効  → ok: true, 結果表示
```

### 17-4. classifyの出力ライフサイクル

```
① アップロード → classify → aiLineItems等をDocEntryに一時保存
② 選別画面で表示（種別、金額、摘要等のUIプレビューに使用）
③ 確定送信 → classifyの出力（aiLineItems等）を**完全削除**
④ Extract API発火 → 画像からゼロで本番仕訳データ生成
   ※classifyの出力はExtract APIへの入力パラメータとしても渡さない
```

### 17-5. 暫定処理（Extract API未実装時）

Extract APIが未実装のため、現在は以下の暫定フローで動作:

```
暫定: classify出力 → lineItemToJournalMock()で無理やり仕訳形式に変換
本来: Extract API → JournalPhase5Mock型の完全な仕訳を直接出力
```

`lineItemToJournalMock()` はExtract API実装後に不要になる暫定処理。

### 17-6. 実装ステップ（classify）

- [x] classify API に `duration_seconds`, `token_count`, `cost_yen` を追加返却
- [x] `analyzeReceiptReal` を実装（POST `/api/pipeline/classify` に接続）
- [x] `ReceiptAnalysisResult` 型を拡張（テスト用項目追加）
- [x] フロント側バリデーション（date/amount nullチェック → ok: false）
- [x] 前処理パイプライン統一（`image_preprocessor.ts`）
- [x] モデルID修正（`gemini-2.5-flash`）
- [ ] 重複検出強化（日付+金額+取引先の内容ベース重複チェック）


