🛑 Meta Layer: 紛争解決・承認プロトコル (Conflict Resolution & Approval)
current.mdと人間の指示が一致しない場合は、作業を実施する前に一致しない個所と一致しない理由、それを解決する対案を人間に提示し、人間の承認を得たうえで作業しなければならない。
すべての作業は人間の明示的な承認を得てから実行しなければならない。暗黙的、あるいは承認したことが類推される場合であっても、人間の承認を得なければならない。

Layer 0: 原文固定層 (Evidence Layer)
このセクションは「唯一の真実」であり、人間（あなた）の指示を一文字、改行一つ変えずにそのまま保存しています。編集・整形・要約は一切行われていません。
Plaintext
[SOURCE: human_original_2026-01-11.txt]

/ai_gogleanti
  /src
    /shared           <-- 新設：ここが「聖典」
      schema_dictionary.ts
    /composables      <-- Frontend (Vite) から import ../shared/schema_dictionary
    /repositories     <-- Backend (Hono) から import ../shared/schema_dictionary

① 通信スキーマ（RPC層）の定義
共有ファイル: src/shared/schema_dictionary.ts を唯一の参照先とします。
物理的制約: Honoの zod スキーマ（バリデーション用）と TypeScript の interface をこのファイルで同期させます。
メリット: 「バックエンドが期待する型」と「フロントエンドが送る型」が 100% 一致するため、通信エラー（400 Bad Request等）を物理的に根絶できます。

② 共通計算ルール（COMMON_RULES）の新設
型定義（名前）だけでなく、「計算ルール（値の意味）」を格納する区画を追加します。
新設: #region COMMON_RULES（共通ルール）
内容: TAX_RATE = 0.10 や、ROUNDING_FLOOR = 0 などの定数（Enum/Constants）。
役割: バックエンドでの最終計算と、フロントエンドでのリアルタイム表示計算で、「全く同じ定数」を参照することを強制します。

拡張時のルール（再定義）
黄金期のコアを「拡張」してUI状態を作る際の「通信上の振る舞い」を明確にします。
ルール: #region SCREEN_SPECIFIC で extends された UIプロパティ（_付き）は、「通信（保存）時には自動的にストリップ（削除）される」ことを前提とします。
物理的保証: アダプター層（通信の出口）で、_ で始まるプロパティを物理的に排除する処理を実装し、DBを汚染させない仕組みを構築します。

1. 黄金期における「スクリーン専用」の扱い
黄金期に存在した「特定の画面（例：Screen E）でのみ保存・利用されるデータ」については、以下の基準で仕分けます。
状態 | 格納場所 | 理由
DBに保存される項目 | #region COMMON_CORE | たとえScreen Eでしか使わなくても、DBのスキーマ（保存の器）である以上、システムの「核」とみなします。
画面内でのみ完結するロジック | #region SCREEN_SPECIFIC | 保存されない一時的な計算用インターフェースなどは、特定の画面リージョンに隔離します。

3. 監査官(Gemini)の検索・報告ルール
[考古学的検索ログ]
検索クエリ: grep -r "taxRounding" ./src
対象ファイル: src/types.ts, src/repositories/jobRepository.ts
発見した事実: 黄金期コードの 45行目に roundingType という記述を確認。
AIの判断: 現在の Job インターフェースには欠損しているため、COMMON_CORE への追加を提案。
物理的差異: AIが捏造していた _taxMode は黄金期に存在しないため削除を提案。

スキーマの分類基準と拡張ルール
分類 | 格納場所 | プロパティの命名規則 | 拡張（extends）のルール
純粋データ | COMMON_CORE | id, amount, status | 拡張禁止。黄金期のマスターそのもの。
UI状態 | SCREEN_SPECIFIC | _isEditing, _isLoading | プレフィックス _ を必須とする。
表示用計算値 | SCREEN_SPECIFIC | _displayTaxAmount | コアの型を extends して作成。

1. 区画の定義（#region の物理構造）
① #region COMMON_CORE（共通コア）
定義: データベース（Firestore/SQLite等）の保存構造と1対1で対応する純粋な型定義。対象: Job, Client, Company, TaxRate など。
② #region SCREEN_SPECIFIC（スクリーン専用）
定義: 特定の画面でしか使われない一時的なステート。対象: ScreenE_EntryForm など。ルール: #region SCREEN_E_ONLY のように分割。

フェーズに関する粒度
現在：復元期 (Phase 2-3) | 考古学的な地図 | 黄金期との完全一致。
将来：進納期 (Phase 4+) | エンジニアリングの仕様書 | 破壊的変更の安全性。

確定した実行ロードマップ
1. UI復旧 | 1525行目の構文エラー修正 | 視認性の確保
2. スキーマ集約 | 全プロジェクトから型定義を抽出 | 部品の棚卸し
3. 辞書作成 | 各プロパティに「意味・出所・ルール」を日本語で追記 | あるべき論の封殺
4. 隔離と配線 | 辞書にないAI創作ロジックを捨てる | 等価交換の完了

人間が分かる辞書の作成方法 (Methodology)
export interface Client {
/**
* ■ 端数処理区分 (Tax Rounding Type)
* -------------------------------------------------------------
* [意味] 消費税計算時に、1円未満の端数をどう処理するかを規定する。
* [値の定義] 0: 切り捨て (Floor), 1: 四捨五入 (Round), 2: 切り上げ (Ceil)
* [出所] GoldenMaster (2803d462): ClientMaster.js L45
* [警告] 未設定(undefined)の場合は、税法上「切り捨て」とみなす。
* -------------------------------------------------------------
*/
taxRoundingMode: 0 | 1 | 2;
}

🛑 Layer 1: 構造インデックス層 (Wrapper / Index)
※地層（S01）モデルを採用。要約・中略（...）を永久追放し、UNIT単位（1文＝1UNIT）で物理複写・測量しました。

セクションID	原文項目（1文字も削らない物理複写）	属性
IDX-S01-01-01	/ai_gogleanti /src /shared <-- 新設：ここが「聖典」	UNIT
IDX-S01-02-01	① 通信スキーマ（RPC層）の定義	MAJOR
IDX-S01-02-02	共有ファイル: src/shared/schema_dictionary.ts を唯一の参照先とします。	UNIT
IDX-S01-02-03	物理的制約: Honoの zod スキーマ（バリデーション用）と TypeScript の interface をこのファイルで同期させます。	UNIT
IDX-S01-02-04	メリット: 「バックエンドが期待する型」と「フロントエンドが送る型」が 100% 一致するため、通信エラー（400 Bad Request等）を物理的に根絶できます。	UNIT
IDX-S01-03-01	② 共通計算ルール（COMMON_RULES）の新設	MAJOR
IDX-S01-03-02	型定義（名前）だけでなく、「計算ルール（値の意味）」を格納する区画を追加します。	UNIT
IDX-S01-03-03	新設: #region COMMON_RULES（共通ルール）	UNIT
IDX-S01-03-04	内容: TAX_RATE = 0.10 や、ROUNDING_FLOOR = 0 などの定数（Enum/Constants）。	UNIT
IDX-S01-03-05	役割: バックエンドでの最終計算と、フロントエンドでのリアルタイム表示計算で、「全く同じ定数」を参照することを強制します。	UNIT
IDX-S01-04-01	拡張時のルール（再定義）	MAJOR
IDX-S01-04-02	黄金期のコアを「拡張」してUI状態を作る際の「通信上の振る舞い」を明確にします。	UNIT
IDX-S01-04-03	ルール: #region SCREEN_SPECIFIC で extends された UIプロパティ（_付き）は、「通信（保存）時には自動的にストリップ（削除）される」ことを前提とします。	UNIT
IDX-S01-04-04	物理的保証: アダプター層（通信の出口）で、_ で始まるプロパティを物理的に排除する処理を実装し、DBを汚染させない仕組みを構築します。	UNIT
IDX-S01-05-01	1. 黄金期における「スクリーン専用」の扱い	MAJOR
IDX-S01-05-02	黄金期に存在した「特定の画面（例：Screen E）でのみ保存・利用されるデータ」については、以下の基準で仕分けます。	UNIT
IDX-S01-05-03	状態 ｜ 格納場所 ｜ 理由	UNIT (Header)
IDX-S01-05-04	DBに保存される項目 ｜ #region COMMON_CORE ｜ たとえScreen Eでしか使わなくても、DBのスキーマ（保存の器）である以上、システムの「核」とみなします。	UNIT (Row 1)
IDX-S01-05-05	画面内でのみ完結するロジック ｜ #region SCREEN_SPECIFIC ｜ 保存されない一時的な計算用インターフェースなどは、特定の画面リージョンに隔離します。	UNIT (Row 2)
IDX-S01-06-01	3. 監査官(Gemini)の検索・報告ルール	MAJOR
IDX-S01-06-02	[考古学的検索ログ]	UNIT
IDX-S01-06-03	検索クエリ: grep -r "taxRounding" ./src	UNIT
IDX-S01-06-04	対象ファイル: src/types.ts, src/repositories/jobRepository.ts	UNIT
IDX-S01-06-05	発見した事実: 黄金期コードの 45行目に roundingType という記述を確認。	UNIT
IDX-S01-06-06	AIの判断: 現在の Job インターフェースには欠損しているため、COMMON_CORE への追加を提案。	UNIT
IDX-S01-06-07	物理的差異: AIが捏造していた _taxMode は黄金期に存在しないため削除を提案。	UNIT
IDX-S01-07-01	スキーマの分類基準と拡張ルール	MAJOR
IDX-S01-07-02	分類 ｜ 格納場所 ｜ プロパティの命名規則 ｜ 拡張（extends）のルール	UNIT (Header)
IDX-S01-07-03	純粋データ ｜ COMMON_CORE ｜ id, amount, status ｜ 拡張禁止。黄金期のマスターそのもの。	UNIT (Row 1)
IDX-S01-07-04	UI状態 ｜ SCREEN_SPECIFIC ｜ _isEditing, _isLoading ｜ プレフィックス _ を必須とする。	UNIT (Row 2)
IDX-S01-07-05	表示用計算値 ｜ SCREEN_SPECIFIC ｜ _displayTaxAmount ｜ コアの型を extends して作成。	UNIT (Row 3)
IDX-S01-08-01	1. 区画の定義（#region の物理構造）	MAJOR
IDX-S01-08-02	① #region COMMON_CORE（共通コア）	UNIT
IDX-S01-08-03	定義: データベース（Firestore/SQLite等）の保存構造と1対1で対応する純粋な型定義。対象: Job, Client, Company, TaxRate など。	UNIT
IDX-S01-08-04	② #region SCREEN_SPECIFIC（スクリーン専用）	UNIT
IDX-S01-08-05	定義: 特定の画面でしか使われない一時的なステート。対象: ScreenE_EntryForm など。ルール: #region SCREEN_E_ONLY のように分割。	UNIT
IDX-S01-09-01	フェーズに関する粒度	MAJOR
IDX-S01-09-02	現在：復元期 (Phase 2-3) ｜ 考古学的な地図 ｜ 黄金期との完全一致。	UNIT
IDX-S01-09-03	将来：進納期 (Phase 4+) ｜ エンジニアリングの仕様書 ｜ 破壊的変更の安全性。	UNIT
IDX-S01-10-01	確定した実行ロードマップ	MAJOR
IDX-S01-10-02	1. UI復旧 ｜ 1525行目の構文エラー修正 ｜ 視認性の確保	UNIT (Step 1)
IDX-S01-10-03	2. スキーマ集約 ｜ 全プロジェクトから型定義を抽出 ｜ 部品の棚卸し	UNIT (Step 2)
IDX-S01-10-04	3. 辞書作成 ｜ 各プロパティに「意味・出所・ルール」を日本語で追記 ｜ あるべき論の封殺	UNIT (Step 3)
IDX-S01-10-05	4. 隔離と配線 ｜ 辞書にないAI創作ロジックを捨てる ｜ 等価交換の完了	UNIT (Step 4)
IDX-S01-11-01	人間が分かる辞書の作成方法 (Methodology)	MAJOR
IDX-S01-11-02	export interface Client {	UNIT (Code)
IDX-S01-11-03	/**	UNIT (JSDoc Start)
IDX-S01-11-04	* ■ 端数処理区分 (Tax Rounding Type)	UNIT
IDX-S01-11-05	* -------------------------------------------------------------	UNIT
IDX-S01-11-06	* [意味] 消費税計算時に、1円未満の端数をどう処理するかを規定する。	UNIT
IDX-S01-11-07	* [値の定義] 0: 切り捨て (Floor), 1: 四捨五入 (Round), 2: 切り上げ (Ceil)	UNIT
IDX-S01-11-08	* [出所] GoldenMaster (2803d462): ClientMaster.js L45	UNIT
IDX-S01-11-09	* [警告] 未設定(undefined)の場合は、税法上「切り捨て」とみなす。	UNIT
IDX-S01-11-10	* -------------------------------------------------------------	UNIT
IDX-S01-11-11	*/	UNIT (JSDoc End)
IDX-S01-11-12	taxRoundingMode: 0 | 1 | 2;	UNIT (Prop)
IDX-S01-11-13	}	UNIT (Close)

🛑 Layer 2: 運用・監査層 (Operational Layer)
1. 物理的粒度規定（監査基準）
RULE-G1 (分割不足): 1つの UNIT 内に「。」「!」「?」等の文末記号が複数含まれていないか。スプリット（分割）が不十分でないか。原則として「1文 = 1 UNIT」とする。
RULE-G2 (過剰分割): 1つの文を途中で切り離していないか。
文字数等価原則: Layer 1 の引用項目は、Layer 0 とスペース・記号を含め 100% 一致させ、... による省略は永久に禁止する。

2. 作業指示（IDEへの最終要求）
任務: IDX-STEP-01 (UI復旧) のステータス確認。
状態: **LOCKED / 停止 (地図不備のため)**
条件: current.md の物理的等価性監査に合格すること。

任務: IDX-STEP-02 (スキーマ集約) のステータス確認。
状態: **LOCKED / 停止**
条件: IDX-STEP-01 の正式なロック解除および完了承認。

証跡: 本ファイル (current.md) の完全性を提示し、貴殿の「監査承認 (APPROVE)」を待て。
承認されるまで、プログラムコードの修正およびスキャン作業は全面的に禁止とする。
