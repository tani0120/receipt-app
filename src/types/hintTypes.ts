/** ヒントモーダル用型定義 */

export type HintValidation = {
  level: "error" | "warn";
  message: string;
};

export type HintAlternative = {
  value: string;
  label: string;
};

export type HintSuggestion = {
  side: "debit" | "credit";
  field: string;
  currentValue: string | null;
  currentLabel: string;
  selectedValue: string;
  selectedLabel: string;
  alternatives: HintAlternative[];
  entryIndex: number;
};
