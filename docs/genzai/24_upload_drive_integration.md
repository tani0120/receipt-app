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
| `hash-worker.ts` | `src/mocks/workers/` | 37 | Web Workerハッシュ計算（SHA-256 / FNV-1aフォールバック） |
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
| **`drive.ts`** | `src/api/routes/` | 約120 | **[新規] Drive APIルーティング（GET /files, POST /process）** |
| `classify.service.ts` | `src/api/services/pipeline/` | 約400 | Gemini呼出 + sharp前処理 + JSON解析 |
| **`driveService.ts`** | `src/api/services/drive/` | 約290 | **[改修済み] SA認証 + ファイル一覧 + DL + ハッシュ + サムネイル + `grantFolderPermission()`** |
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
| 4 | AI分類との統合テスト | ❌ 未着手 |
| 5 | Supabase Auth `signInWithOAuth` コールバック内で `grantFolderPermission()` 呼び出し | ❌ 未着手 |
| 6 | Supabase Auth `signInWithPassword` / `signUp` 実装（パソコンのみフロー） | ❌ 未着手 |

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
  source: 'drive' | 'upload'  // データソース
  fileName: string
  fileType: string        // MIMEタイプ
  fileSize: number        // バイト
  fileHash: string | null // SHA-256（重複検知用）
  driveFileId: string | null  // Drive fileId
  thumbnailUrl: string | null // サムネイルURL
  previewUrl: string | null   // プレビュー用画像パス
  status: 'pending' | 'target' | 'excluded'  // 選別ステータス
  receivedAt: string      // 取得日時（ISO 8601）
}
```

### 9-3. SQL（`003_documents.sql`）

- documentsテーブル新規作成（10番目のテーブル）
- インデックス: client_id, client_status, drive_file_id（UNIQUE）, file_hash
- RLS: スタッフ=全顧問先アクセス可、顧問先ユーザー=自分の資料のみ

### 9-4. composable（`useDocuments.ts`）

- モジュールスコープrefで全資料を直接保持（フェーズルール準拠）
- createRepositories()に依存しない
- モックデータ: LDI 8件（Drive 4件 + PCアップロード 4件）、MHL 3件

### 9-5. 算出ユーティリティ（`utils/documentUtils.ts`）

| 関数 | 用途 |
|---|---|
| `countUnsorted(docs)` | 未選別件数（status==='pending'の件数） |
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
