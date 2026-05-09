/**
 * フィールドレイアウト定義の型
 * ドラッグ&ドロップ対応のフォームフィールドを定義
 */

/** フィールドのコンポーネント種別 */
export type FieldComponent =
  | 'text'          // テキスト入力
  | 'number'        // 数値入力
  | 'date'          // 日付入力
  | 'url'           // URL入力
  | 'email'         // メール入力
  | 'select'        // プルダウン選択
  | 'checkbox'      // チェックボックス
  | 'textarea'      // 複数行テキスト
  | 'amount'        // 金額入力（「円」付き）
  | 'readonly'      // 読み取り専用
  | 'computed'      // 自動算出値
  | 'link'          // リンクボタン
  | 'urlCopy'       // URL表示+コピーボタン
  | 'dateGroup'     // 月/日 選択グループ
  | 'staffSelect'   // スタッフ選択
  | 'heading'       // セクション見出し（タイトルフィールド）
  | 'spacer'        // 空白行（高さ調整用スペーサー）
  | 'contactTable'  // 連絡先テーブル（ContactTable埋込み）
  | 'custom';       // カスタムスロット

/** 選択肢 */
export interface FieldOption {
  value: string | number;
  label: string;
}

/** フィールド定義 */
export interface FieldDef {
  /** 一意キー（formのプロパティ名）。カスタムフィールドは 'custom_xxx' */
  key: string;
  /** ラベル表示 */
  label: string;
  /** 所属セクション */
  section: string;
  /** サブセクション（サブタイトル下） */
  subSection?: string;
  /** コンポーネント種別 */
  component: FieldComponent;
  /** フィールドの横幅（%単位、0～100。デフォルトは20％） */
  widthPercent: number;
  /** グリッド内の占有行数（デフォルト1） */
  rowSpan?: number;
  /** 表示順序（セクション内） */
  order: number;
  /** このフィールドの後で改行するか（残り列を空白にする） */
  lineBreakAfter?: boolean;
  /** 必須フラグ */
  required?: boolean;
  /** プレースホルダー */
  placeholder?: string;
  /** 選択肢（select用） */
  options?: FieldOption[] | string;  // string = 定数名参照
  /** 最大文字数 */
  maxLength?: number;
  /** ヒントテキスト */
  hint?: string;
  /** 警告テキスト（ラベル右に表示） */
  warnText?: string;
  /** 入力幅を狭くする */
  smallWidth?: boolean;
  /** 条件付き表示（他フィールドの値に依存） */
  visibleWhen?: {
    field: string;
    value: unknown | unknown[];
  };
  /** 編集不可（常にreadonly） */
  alwaysReadonly?: boolean;
  /** 特別なCSSクラス */
  cssClass?: string;
  /** v-modelのバインディングキー（formのプロパティと異なる場合） */
  modelKey?: string;
  /** 入力タイプ（type属性） */
  inputType?: string;
  /** 金額のmin値 */
  min?: number;
  /** タイトルフィールドの文字サイズ（px）。デフォルト14 */
  headingSize?: number;
  /** タイトルフィールドの背景色（CSS色値）。デフォルト '#4a8dc9' */
  headingBg?: string;
  /** スペーサーフィールドの高さ（px）。デフォルト 20 */
  spacerHeight?: number;
}

/** セクション定義 */
export interface SectionDef {
  /** セクションキー */
  key: string;
  /** セクション表示名 */
  title: string;
  /** デフォルトのグリッドカラム数 */
  defaultCols: number;
  /** セクション内のサブセクション */
  subSections?: { key: string; title: string; defaultCols: number }[];
}

/** 保存されるレイアウト設定 */
export interface SavedFieldLayout {
  /** ページ識別子（'client' | 'lead'） */
  pageId: string;
  /** セクション内のフィールド順序 */
  fieldOrders: Record<string, string[]>;  // sectionKey -> fieldKey[]
  /** フィールドごとの横幅（%値） */
  fieldWidths: Record<string, number>;     // fieldKey -> widthPercent
  /** フィールドごとの縦幅（rowSpan） */
  fieldRowSpans?: Record<string, number>;  // fieldKey -> rowSpan
  /** フィールドごとの行区切り */
  fieldLineBreaks?: Record<string, boolean>; // fieldKey -> lineBreakAfter
  /** セクションごとの高さ（px） */
  sectionHeights?: Record<string, number>; // sectionKey -> height
  /** セクション順序 */
  sectionOrder: string[];
  /** 更新日時 */
  updatedAt: string;
  /** 更新者 */
  updatedBy: string;
  /** バージョンラベル（例: "20260508(1)"）*/
  versionLabel?: string;
  /** デフォルトバージョンか */
  isDefault?: boolean;
  /** ラベル上書き（既存フィールドの表示名変更） */
  labelOverrides?: Record<string, string>;  // fieldKey -> 新ラベル
  /** 非表示フィールド一覧 */
  hiddenFields?: string[];  // fieldKey[]
}

/** レイアウトバージョン一覧の1件 */
export interface LayoutVersion {
  /** バージョンラベル（例: "20260508(1)"）*/
  versionLabel: string;
  /** デフォルトか */
  isDefault: boolean;
  /** 作成日時 */
  createdAt: string;
  /** 作成者 */
  createdBy: string;
}

/** カスタムフィールド追加時に選択できるコンポーネント型 */
export const FIELD_COMPONENT_OPTIONS: readonly { value: FieldComponent; label: string }[] = [
  { value: 'text', label: 'テキスト' },
  { value: 'number', label: '数値' },
  { value: 'date', label: '日付' },
  { value: 'textarea', label: 'テキストエリア' },
  { value: 'select', label: '選択' },
  { value: 'checkbox', label: 'チェック' },
  { value: 'heading', label: 'タイトル' },
  { value: 'spacer', label: 'スペーサー' },
] as const;
