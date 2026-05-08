/**
 * フィールドレイアウト管理Composable
 * ドラッグ&ドロップ順序変更・横幅リサイズ・レイアウト保存/復元
 */
import { ref, computed, watch } from 'vue';
import type { FieldDef, SectionDef, SavedFieldLayout, LayoutVersion } from '@/types/fieldLayout';

export function useFieldLayout(
  pageId: string,
  sections: SectionDef[],
  defaultFields: FieldDef[]
) {
  /** フィールド定義の実体（order/widthPercentが変更される） */
  const fields = ref<FieldDef[]>(JSON.parse(JSON.stringify(defaultFields)));

  /** セクション順序 */
  const sectionOrder = ref<string[]>(sections.map(s => s.key));

  /** レイアウト編集モード（管理者のみ有効化） */
  const isLayoutEditing = ref(false);

  /** レイアウト変更済フラグ */
  const isLayoutDirty = ref(false);

  /** セクションごとの高さ（px） */
  const sectionHeights = ref<Record<string, number>>({});

  /** バージョン一覧 */
  const layoutVersions = ref<LayoutVersion[]>([]);

  /** 現在選択中のバージョンラベル */
  const currentVersionLabel = ref<string>('');

  /** ラベル上書き（fieldKey -> 新ラベル） */
  const labelOverrides = ref<Record<string, string>>({});

  /** 非表示フィールド一覧 */
  const hiddenFields = ref<string[]>([]);

  /** 保存済レイアウトの読み込み */
  const loadLayout = async () => {
    try {
      // localStorageからデフォルトレイアウトを読み込み
      const stored = localStorage.getItem(`field-layout-${pageId}`);
      if (stored) {
        const saved: SavedFieldLayout = JSON.parse(stored);
        applyLayout(saved);
        currentVersionLabel.value = saved.versionLabel || '';
      } else {
        // フォールバック: API
        const res = await fetch(`/api/field-layout/${pageId}`);
        if (!res.ok) return;
        const saved: SavedFieldLayout = await res.json();
        applyLayout(saved);
      }
    } catch {
      // 保存済レイアウトがない場合はデフォルトを使用
    }
    refreshVersionList();
  };

  /** レイアウトの適用 */
  const applyLayout = (saved: SavedFieldLayout) => {
    // セクション順序を適用
    if (saved.sectionOrder?.length) {
      sectionOrder.value = saved.sectionOrder;
    }

    // フィールド順序を適用
    if (saved.fieldOrders) {
      for (const [sectionKey, fieldKeys] of Object.entries(saved.fieldOrders)) {
        fieldKeys.forEach((fk, idx) => {
          const f = fields.value.find(ff => ff.key === fk && (ff.subSection || ff.section) === sectionKey);
          if (!f) {
            // サブセクションなしで検索
            const f2 = fields.value.find(ff => ff.key === fk && ff.section === sectionKey);
            if (f2) f2.order = idx + 1;
          } else {
            f.order = idx + 1;
          }
        });
      }
    }

    // フィールド横幅を適用
    if (saved.fieldWidths) {
      for (const [fk, pct] of Object.entries(saved.fieldWidths)) {
        const f = fields.value.find(ff => ff.key === fk);
        if (f) f.widthPercent = pct;
      }
    }

    // フィールド縦幅を適用
    if (saved.fieldRowSpans) {
      for (const [fk, span] of Object.entries(saved.fieldRowSpans)) {
        const f = fields.value.find(ff => ff.key === fk);
        if (f) f.rowSpan = span;
      }
    }

    // 行区切りを適用
    if (saved.fieldLineBreaks) {
      for (const [fk, val] of Object.entries(saved.fieldLineBreaks)) {
        const f = fields.value.find(ff => ff.key === fk);
        if (f) f.lineBreakAfter = val;
      }
    }

    // セクション高さを適用
    if (saved.sectionHeights) {
      sectionHeights.value = { ...saved.sectionHeights };
    }

    // ラベル上書きを適用
    if (saved.labelOverrides) {
      labelOverrides.value = { ...saved.labelOverrides };
      // fieldsにラベルを反映
      for (const [fk, newLabel] of Object.entries(saved.labelOverrides)) {
        const f = fields.value.find(ff => ff.key === fk);
        if (f) f.label = newLabel;
      }
    }

    // 非表示フィールドを適用
    if (saved.hiddenFields) {
      hiddenFields.value = [...saved.hiddenFields];
    }
  };

  /** レイアウトの保存 */
  const saveLayout = async (updatedBy: string) => {
    const fieldOrders: Record<string, string[]> = {};
    const fieldWidths: Record<string, number> = {};
    const fieldRowSpans: Record<string, number> = {};
    const fieldLineBreaks: Record<string, boolean> = {};

    // セクション/サブセクション別にフィールドを収集
    for (const f of fields.value) {
      const groupKey = f.subSection || f.section;
      if (!fieldOrders[groupKey]) fieldOrders[groupKey] = [];
      fieldOrders[groupKey].push(f.key);
      fieldWidths[f.key] = f.widthPercent;
      if (f.rowSpan && f.rowSpan > 1) fieldRowSpans[f.key] = f.rowSpan;
      if (f.lineBreakAfter) fieldLineBreaks[f.key] = true;
    }

    // order順にソート
    for (const gk of Object.keys(fieldOrders)) {
      const arr = fieldOrders[gk];
      if (!arr) continue;
      fieldOrders[gk] = arr.sort((a, b) => {
        const fa = fields.value.find(ff => ff.key === a);
        const fb = fields.value.find(ff => ff.key === b);
        return (fa?.order ?? 0) - (fb?.order ?? 0);
      });
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    // 同日の連番を算出
    const sameDayVersions = layoutVersions.value.filter(v => v.versionLabel.startsWith(dateStr));
    const seq = sameDayVersions.length + 1;
    const versionLabel = `${dateStr}(${seq})`;

    const payload: SavedFieldLayout = {
      pageId,
      fieldOrders,
      fieldWidths,
      fieldRowSpans: Object.keys(fieldRowSpans).length ? fieldRowSpans : undefined,
      fieldLineBreaks: Object.keys(fieldLineBreaks).length ? fieldLineBreaks : undefined,
      sectionHeights: Object.keys(sectionHeights.value).length ? { ...sectionHeights.value } : undefined,
      sectionOrder: sectionOrder.value,
      updatedAt: now.toISOString(),
      updatedBy,
      versionLabel,
      isDefault: layoutVersions.value.length === 0,
      labelOverrides: Object.keys(labelOverrides.value).length ? { ...labelOverrides.value } : undefined,
      hiddenFields: hiddenFields.value.length ? [...hiddenFields.value] : undefined,
    };

    try {
      // バージョンストレージに保存
      const storageKey = `field-layout-versions-${pageId}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]') as SavedFieldLayout[];
      existing.push(payload);
      localStorage.setItem(storageKey, JSON.stringify(existing));

      // デフォルトも更新
      localStorage.setItem(`field-layout-${pageId}`, JSON.stringify(payload));

      isLayoutDirty.value = false;
      currentVersionLabel.value = versionLabel;
      refreshVersionList();
    } catch (e) {
      console.error('レイアウト保存失敗:', e);
    }
  };

  /** レイアウトをデフォルトにリセット */
  const resetLayout = () => {
    fields.value = JSON.parse(JSON.stringify(defaultFields));
    sectionOrder.value = sections.map(s => s.key);
    sectionHeights.value = {};
    labelOverrides.value = {};
    hiddenFields.value = [];
    isLayoutDirty.value = true;
  };

  /** セクション内のフィールドを取得（order順、非表示除外） */
  const getFieldsForSection = (sectionKey: string, subSectionKey?: string) => {
    return computed(() => {
      return fields.value
        .filter(f => {
          // 非表示チェック
          if (hiddenFields.value.includes(f.key)) return false;
          if (subSectionKey) {
            return f.section === sectionKey && f.subSection === subSectionKey;
          }
          return f.section === sectionKey && !f.subSection;
        })
        .sort((a, b) => a.order - b.order);
    });
  };

  /** カスタムフィールドを動的追加 */
  const addDynamicField = (fieldDef: FieldDef) => {
    // 既に存在する場合はスキップ
    if (fields.value.find(f => f.key === fieldDef.key)) return;
    fields.value.push({ ...fieldDef });
    isLayoutDirty.value = true;
  };

  /** カスタムフィールドを動的削除 */
  const removeDynamicField = (fieldKey: string) => {
    fields.value = fields.value.filter(f => f.key !== fieldKey);
    isLayoutDirty.value = true;
  };

  /** ラベル上書きの更新 */
  const updateLabelOverride = (fieldKey: string, newLabel: string) => {
    labelOverrides.value[fieldKey] = newLabel;
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) f.label = newLabel;
    isLayoutDirty.value = true;
  };

  /** ラベル上書きの解除 */
  const removeLabelOverride = (fieldKey: string) => {
    delete labelOverrides.value[fieldKey];
    // デフォルトラベルに戻す
    const orig = defaultFields.find(ff => ff.key === fieldKey);
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f && orig) f.label = orig.label;
    isLayoutDirty.value = true;
  };

  /** フィールドの表示/非表示切替 */
  const toggleFieldVisibility = (fieldKey: string, visible: boolean) => {
    if (visible) {
      hiddenFields.value = hiddenFields.value.filter(k => k !== fieldKey);
    } else {
      if (!hiddenFields.value.includes(fieldKey)) {
        hiddenFields.value.push(fieldKey);
      }
    }
    isLayoutDirty.value = true;
  };

  /** フィールド順序の更新（D&D後） */
  const updateFieldOrder = (sectionKey: string, subSectionKey: string | undefined, newKeys: string[]) => {
    newKeys.forEach((key, idx) => {
      const f = fields.value.find(ff => {
        if (subSectionKey) {
          return ff.key === key && ff.section === sectionKey && ff.subSection === subSectionKey;
        }
        return ff.key === key && ff.section === sectionKey && !ff.subSection;
      });
      if (f) f.order = idx + 1;
    });
    isLayoutDirty.value = true;
  };

  /** フィールド横幅の更新（%単位） */
  const updateFieldWidth = (fieldKey: string, newWidthPercent: number) => {
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) {
      f.widthPercent = Math.max(5, Math.min(newWidthPercent, 100));
      isLayoutDirty.value = true;
    }
  };

  /** セクション順序の更新 */
  const updateSectionOrder = (newOrder: string[]) => {
    sectionOrder.value = newOrder;
    isLayoutDirty.value = true;
  };

  /** フィールドの行区切り更新 */
  const updateFieldLineBreak = (fieldKey: string, value: boolean) => {
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) {
      f.lineBreakAfter = value;
      isLayoutDirty.value = true;
    }
  };

  /** フィールドの縦幅更新 */
  const updateFieldRowSpan = (fieldKey: string, rowSpan: number) => {
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) {
      f.rowSpan = Math.max(1, rowSpan);
      isLayoutDirty.value = true;
    }
  };

  /** セクション高さの更新 */
  const updateSectionHeight = (sectionKey: string, height: number) => {
    sectionHeights.value[sectionKey] = height;
    isLayoutDirty.value = true;
  };

  /** ソート済みセクション一覧 */
  const sortedSections = computed(() => {
    return sectionOrder.value
      .map(key => sections.find(s => s.key === key))
      .filter((s): s is SectionDef => !!s);
  });

  // 変更検知
  watch(fields, () => {
    if (isLayoutEditing.value) {
      isLayoutDirty.value = true;
    }
  }, { deep: true });

  /** バージョン一覧を更新 */
  const refreshVersionList = () => {
    const storageKey = `field-layout-versions-${pageId}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]') as SavedFieldLayout[];
    layoutVersions.value = existing.map(v => ({
      versionLabel: v.versionLabel || v.updatedAt,
      isDefault: !!v.isDefault,
      createdAt: v.updatedAt,
      createdBy: v.updatedBy,
    }));
  };

  /** バージョン切替 */
  const switchVersion = (versionLabel: string) => {
    const storageKey = `field-layout-versions-${pageId}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]') as SavedFieldLayout[];
    const target = existing.find(v => v.versionLabel === versionLabel);
    if (target) {
      applyLayout(target);
      currentVersionLabel.value = versionLabel;
    }
  };

  /** デフォルトバージョン設定 */
  const setDefaultVersion = (versionLabel: string) => {
    const storageKey = `field-layout-versions-${pageId}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]') as SavedFieldLayout[];
    for (const v of existing) {
      v.isDefault = v.versionLabel === versionLabel;
    }
    localStorage.setItem(storageKey, JSON.stringify(existing));
    const defaultLayout = existing.find(v => v.isDefault);
    if (defaultLayout) {
      localStorage.setItem(`field-layout-${pageId}`, JSON.stringify(defaultLayout));
    }
    refreshVersionList();
  };

  /** バージョン削除 */
  const deleteVersion = (versionLabel: string) => {
    const storageKey = `field-layout-versions-${pageId}`;
    let existing = JSON.parse(localStorage.getItem(storageKey) || '[]') as SavedFieldLayout[];
    existing = existing.filter(v => v.versionLabel !== versionLabel);
    localStorage.setItem(storageKey, JSON.stringify(existing));
    if (currentVersionLabel.value === versionLabel) {
      currentVersionLabel.value = '';
      // デフォルトに戻す
      const defaultLayout = existing.find(v => v.isDefault);
      if (defaultLayout) applyLayout(defaultLayout);
    }
    refreshVersionList();
  };

  return {
    fields,
    sectionOrder,
    sectionHeights,
    isLayoutEditing,
    isLayoutDirty,
    sortedSections,
    layoutVersions,
    currentVersionLabel,
    loadLayout,
    saveLayout,
    resetLayout,
    getFieldsForSection,
    updateFieldOrder,
    updateFieldWidth,
    updateFieldLineBreak,
    updateFieldRowSpan,
    updateSectionOrder,
    updateSectionHeight,
    refreshVersionList,
    switchVersion,
    setDefaultVersion,
    deleteVersion,
    labelOverrides,
    hiddenFields,
    updateLabelOverride,
    removeLabelOverride,
    toggleFieldVisibility,
    defaultFields,
    addDynamicField,
    removeDynamicField,
  };
}
