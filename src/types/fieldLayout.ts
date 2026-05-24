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
  | 'table'         // 汎用テーブル
  | 'file'          // ファイル添付
  | 'custom';       // カスタムスロット

/** テーブル列定義 */
export interface TableColumnDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'url' | 'email' | 'select' | 'checkbox' | 'textarea';
  options?: string[];
  /** 列幅(px)。0=自動 */
  width?: number;
}

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
  /** フィールドの高さ（px単位、ドラッグで変更可能） */
  fieldHeight?: number;
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
  /** タイトルフィールドの文字色（CSS色値）。デフォルト '#fff' */
  headingColor?: string;
  /** スペーサーフィールドの高さ（px）。デフォルト 20 */
  spacerHeight?: number;
  /** 削除可能か（false=初期フィールドまたはデータ参照あり → 削除不可） */
  deletable?: boolean;
  /** 論理削除済みフラグ（trueの場合レイアウトから除外されるがデータは保持） */
  isDeleted?: boolean;
  /** MF連携由来フラグ
   *  true = 常にMF由来
   *  { when: { field, value } } = 条件付きMF由来（formData[field]がvalueと一致するとき）
   */
  mfSource?: boolean | { when: { field: string; value: string | string[] } };
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
  /** フィールドごとの高さ（px） */
  fieldHeights?: Record<string, number>;    // fieldKey -> fieldHeight（px）
  /** セクションごとの高さ（px） */
  sectionHeights?: Record<string, number>; // sectionKey -> height
  /** セクション順序 */
  sectionOrder: string[];
  /** 更新日時 */
  updatedAt: string;
  /** 更新者 */
  updatedBy: string;
  /** ラベル上書き（既存フィールドの表示名変更） */
  labelOverrides?: Record<string, string>;  // fieldKey -> 新ラベル
  /** カスタムフィールドの選択肢（select用） */
  fieldOptions?: Record<string, FieldOption[]>;  // fieldKey -> 選択肢配列
  /** 非表示フィールド一覧 */
  hiddenFields?: string[];  // fieldKey[]
  /** 行ベースレイアウト（各行のフィールドキー配列） */
  fieldRows?: string[][];  // row[] -> fieldKey[]
  /** 論理削除済みフィールドキー一覧 */
  deletedFields?: string[];  // fieldKey[]
  /** カスタムフィールド定義 */
  customDefs?: Array<{ key: string; label: string; section: string; component: string; widthPercent: number; order: number }>;
  /** テーブル部品の列定義（fieldKey → 列定義配列） */
  tableColumns?: Record<string, TableColumnDef[]>;
}



/** カスタムフィールド追加時に選択できるコンポーネント型 */
export const FIELD_COMPONENT_OPTIONS: readonly { value: FieldComponent; label: string }[] = [
  { value: 'text', label: 'テキスト' },
  { value: 'number', label: '数値' },
  { value: 'date', label: '日付' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'メール' },
  { value: 'textarea', label: 'テキストエリア' },
  { value: 'select', label: '選択' },
  { value: 'checkbox', label: 'チェック' },
  { value: 'amount', label: '金額' },
  { value: 'heading', label: 'タイトル' },
  { value: 'spacer', label: 'スペーサー' },
  { value: 'file', label: 'ファイル添付' },
  { value: 'table', label: '表' },
] as const;

/** 全コンポーネント型→日本語ラベルの変換マップ */
export const COMPONENT_LABEL_MAP: Record<FieldComponent, string> = {
  text: 'テキスト',
  number: '数値',
  date: '日付',
  url: 'URL',
  email: 'メール',
  select: '選択',
  checkbox: 'チェック',
  textarea: 'テキストエリア',
  amount: '金額',
  readonly: '読取専用',
  computed: '自動算出',
  link: 'リンク',
  urlCopy: 'URLコピー',
  dateGroup: '日付グループ',
  staffSelect: 'スタッフ選択',
  heading: 'タイトル',
  spacer: 'スペーサー',
  contactTable: '連絡先テーブル',
  table: '表',
  file: 'ファイル添付',
  custom: 'カスタム',
};
