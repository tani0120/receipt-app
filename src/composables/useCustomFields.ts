/**
 * カスタムフィールド管理Composable
 * 動的フィールドの追加/編集/削除 + extra_fields値の管理
 */
import { ref, watch } from 'vue';
import type { FieldDef, FieldComponent } from '@/types/fieldLayout';

/** カスタムフィールド定義（保存用） */
export interface CustomFieldDef {
  key: string;
  label: string;
  section: string;
  component: FieldComponent;
  widthPercent: number;
  order: number;
}

export function useCustomFields(pageId: string) {
  /** カスタムフィールド定義一覧 */
  const customDefs = ref<CustomFieldDef[]>([]);

  /** extra_fieldsの値（key→value） */
  const extraFieldValues = ref<Record<string, unknown>>({});

  /** localStorageキー */
  const storageKey = `custom-field-defs-${pageId}`;

  /** 定義を読み込み */
  const loadCustomDefs = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        customDefs.value = JSON.parse(stored);
      }
    } catch {
      // デフォルト（なし）
    }
  };

  /** 定義を保存 */
  const saveCustomDefs = (defs: CustomFieldDef[]) => {
    customDefs.value = defs;
    localStorage.setItem(storageKey, JSON.stringify(defs));
  };

  /** カスタムフィールドをFieldDef形式に変換 */
  const toFieldDefs = (): FieldDef[] => {
    return customDefs.value.map(d => ({
      key: d.key,
      label: d.label,
      section: d.section,
      component: d.component,
      widthPercent: d.widthPercent,
      order: d.order,
    }));
  };

  /** extra_fields値を設定 */
  const setExtraValue = (key: string, value: unknown) => {
    extraFieldValues.value[key] = value;
  };

  /** extra_fields値を取得 */
  const getExtraValue = (key: string): unknown => {
    return extraFieldValues.value[key];
  };

  /** extra_fieldsをオブジェクトとして取得（保存用） */
  const getExtraFieldsObject = (): Record<string, unknown> => {
    return { ...extraFieldValues.value };
  };

  /** extra_fieldsを復元 */
  const loadExtraValues = (data: Record<string, unknown> | undefined) => {
    extraFieldValues.value = data ? { ...data } : {};
  };

  return {
    customDefs,
    extraFieldValues,
    loadCustomDefs,
    saveCustomDefs,
    toFieldDefs,
    setExtraValue,
    getExtraValue,
    getExtraFieldsObject,
    loadExtraValues,
  };
}
