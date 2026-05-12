/**
 * フィールドレイアウト管理Composable（シングルトン版）
 *
 * 【設計原則】
 * - モジュールスコープMap（pageIdごと）でSharedStateをキャッシュ
 * - 全画面で同じrefを共有 → 即時伝播
 * - 永続化: API（/api/field-layout/:pageId）→ data/field-layouts/
 * - localStorage → 初回自動移行後に削除
 *
 * useStaffと同じシングルトンパターンを適用
 */
import { ref, computed, watch, type Ref } from 'vue';
import type { FieldDef, FieldOption, SectionDef, SavedFieldLayout, TableColumnDef } from '@/types/fieldLayout';

/** カスタムフィールド定義（useCustomFieldsから統合） */
export interface CustomFieldDef {
  key: string;
  label: string;
  section: string;
  component: import('@/types/fieldLayout').FieldComponent;
  widthPercent: number;
  order: number;
}

// ============================================================
// モジュールスコープ（シングルトン）
// ============================================================

/** 全画面で共有するレイアウトstate */
interface SharedState {
  fields: Ref<FieldDef[]>;
  sectionOrder: Ref<string[]>;
  sectionHeights: Ref<Record<string, number>>;
  labelOverrides: Ref<Record<string, string>>;
  fieldOptions: Ref<Record<string, FieldOption[]>>;
  hiddenFields: Ref<string[]>;
  deletedFields: Ref<string[]>;
  fieldRows: Ref<string[][]>;
  customDefs: Ref<CustomFieldDef[]>;
  tableColumns: Ref<Record<string, TableColumnDef[]>>;
}

/** pageIdごとのシングルトンキャッシュ */
const stateCache = new Map<string, SharedState>();

/** 初回読込Promise（二重読込防止） */
const loadingPromise = new Map<string, Promise<void>>();

/** SharedStateを新規作成 */
function createSharedState(defaultFields: FieldDef[], sections: SectionDef[]): SharedState {
  return {
    fields: ref<FieldDef[]>(JSON.parse(JSON.stringify(defaultFields))),
    sectionOrder: ref<string[]>(sections.map(s => s.key)),
    sectionHeights: ref<Record<string, number>>({}),
    labelOverrides: ref<Record<string, string>>({}),
    fieldOptions: ref<Record<string, FieldOption[]>>({}),
    hiddenFields: ref<string[]>([]),
    deletedFields: ref<string[]>([]),
    fieldRows: ref<string[][]>([]),
    customDefs: ref<CustomFieldDef[]>([]),
    tableColumns: ref<Record<string, TableColumnDef[]>>({}),
  };
}

// ============================================================
// Composable
// ============================================================

export function useFieldLayout(
  pageId: string,
  sections: SectionDef[],
  defaultFields: FieldDef[]
) {
  // シングルトン: 初回のみ作成、以降はキャッシュから返す
  if (!stateCache.has(pageId)) {
    stateCache.set(pageId, createSharedState(defaultFields, sections));
  }
  const shared = stateCache.get(pageId)!;

  // 以下のエイリアスでSharedStateのrefに直接アクセス
  const fields = shared.fields;
  const sectionOrder = shared.sectionOrder;
  const sectionHeights = shared.sectionHeights;
  const labelOverrides = shared.labelOverrides;
  const fieldOptions = shared.fieldOptions;
  const hiddenFields = shared.hiddenFields;
  const deletedFields = shared.deletedFields;
  const fieldRows = shared.fieldRows;

  // UI固有state（画面ごとに独立）
  /** レイアウト編集モード（管理者のみ有効化） */
  const isLayoutEditing = ref(false);

  /** レイアウト変更済フラグ */
  const isLayoutDirty = ref(false);

  /** UNDO/REDOスタック */
  const undoStack = ref<string[]>([]);
  const redoStack = ref<string[]>([]);
  const maxUndoSize = 50;
  /** 直前の安定状態（操作前のスナップショット） */
  let prevSnapshot: string | null = null;
  /** restoreSnapshot実行中フラグ（watchの二重発火防止） */
  let isRestoring = false;

  /** 現在の状態をスナップショットとして取得 */
  const takeSnapshot = (): string => {
    return JSON.stringify({
      fields: fields.value,
      sectionOrder: sectionOrder.value,
      sectionHeights: sectionHeights.value,
      labelOverrides: labelOverrides.value,
      hiddenFields: hiddenFields.value,
      deletedFields: deletedFields.value,
      fieldOptions: fieldOptions.value,
      fieldRows: fieldRows.value,
    });
  };

  /** スナップショットを復元 */
  const restoreSnapshot = (snapshot: string) => {
    isRestoring = true;
    const snap = JSON.parse(snapshot);
    fields.value = snap.fields;
    sectionOrder.value = snap.sectionOrder;
    sectionHeights.value = snap.sectionHeights;
    labelOverrides.value = snap.labelOverrides;
    hiddenFields.value = snap.hiddenFields;
    deletedFields.value = snap.deletedFields || [];
    fieldOptions.value = snap.fieldOptions;
    fieldRows.value = snap.fieldRows || [];
    // 復元後にprevSnapshotを更新
    prevSnapshot = takeSnapshot();
    isRestoring = false;
  };

  /** UNDO実行 */
  const undo = () => {
    if (undoStack.value.length === 0) return;
    // 現在の状態をREDOに保存
    redoStack.value.push(takeSnapshot());
    const prev = undoStack.value.pop()!;
    restoreSnapshot(prev);
    isLayoutDirty.value = undoStack.value.length > 0;
  };

  /** REDO実行 */
  const redo = () => {
    if (redoStack.value.length === 0) return;
    // 現在の状態をUNDOに保存
    undoStack.value.push(takeSnapshot());
    const next = redoStack.value.pop()!;
    restoreSnapshot(next);
    isLayoutDirty.value = true;
  };

  /** UNDO可能か */
  const canUndo = computed(() => undoStack.value.length > 0);
  /** REDO可能か */
  const canRedo = computed(() => redoStack.value.length > 0);

  const markDirty = () => {
    if (prevSnapshot) {
      undoStack.value.push(prevSnapshot);
      if (undoStack.value.length > maxUndoSize) {
        undoStack.value.shift();
      }
      redoStack.value = [];
    }
    isLayoutDirty.value = true;
    // 次の操作用に現在状態を保存
    prevSnapshot = takeSnapshot();
  };

  /** 保存済レイアウトの読み込み（API優先、localStorage移行） */
  const loadLayout = async () => {
    // 二重読込防止: 既にロード中なら待機のみ
    if (loadingPromise.has(pageId)) {
      await loadingPromise.get(pageId);
      return;
    }

    const doLoad = async () => {
      try {
        // 1. APIから取得
        const res = await fetch(`/api/field-layout/${pageId}`);
        if (res.ok) {
          const saved: SavedFieldLayout = await res.json();

          // customDefsがあれば先にfields.valueに追加（applyLayoutで参照するため）
          if (saved.customDefs) {
            shared.customDefs.value = saved.customDefs as CustomFieldDef[];
            for (const cd of shared.customDefs.value) {
              if (!fields.value.find(f => f.key === cd.key)) {
                fields.value.push({
                  key: cd.key,
                  label: cd.label,
                  section: cd.section,
                  component: cd.component,
                  widthPercent: cd.widthPercent,
                  order: cd.order,
                });
              }
            }
          }

          applyLayout(saved);
          return;
        }

        // 2. APIにデータなし → localStorageから移行
        const lsKey = `field-layout-${pageId}`;
        const stored = localStorage.getItem(lsKey);
        if (stored) {
          const saved: SavedFieldLayout = JSON.parse(stored);

          // customDefs移行（applyLayoutの前にfields.valueに追加）
          const customKey = `custom-field-defs-${pageId}`;
          const customStored = localStorage.getItem(customKey);
          if (customStored) {
            shared.customDefs.value = JSON.parse(customStored);
            saved.customDefs = shared.customDefs.value;
          }
          // customDefsからFieldDefを復元
          for (const cd of shared.customDefs.value) {
            if (!fields.value.find(f => f.key === cd.key)) {
              fields.value.push({
                key: cd.key,
                label: cd.label,
                section: cd.section,
                component: cd.component,
                widthPercent: cd.widthPercent,
                order: cd.order,
              });
            }
          }

          applyLayout(saved);

          // APIに移行保存
          await fetch(`/api/field-layout/${pageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saved),
          });

          // 移行完了 → localStorage削除
          localStorage.removeItem(lsKey);
          localStorage.removeItem(`field-layout-versions-${pageId}`);
          localStorage.removeItem(customKey);
          console.log(`[useFieldLayout] localStorage → API移行完了: ${pageId}`);
        }
      } catch {
        // 保存済レイアウトがない場合はデフォルトを使用
      }
    };

    const promise = doLoad();
    loadingPromise.set(pageId, promise);
    await promise;
    loadingPromise.delete(pageId);
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

    // フィールド高さを適用
    if (saved.fieldHeights) {
      for (const [fk, h] of Object.entries(saved.fieldHeights)) {
        const f = fields.value.find(ff => ff.key === fk);
        if (f) f.fieldHeight = h;
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

    // カスタム選択肢を適用
    if (saved.fieldOptions) {
      fieldOptions.value = { ...saved.fieldOptions };
      for (const [fk, opts] of Object.entries(saved.fieldOptions)) {
        const f = fields.value.find(ff => ff.key === fk);
        if (f) f.options = opts;
      }
    }

    // 論理削除済みフィールドを適用
    if (saved.deletedFields) {
      deletedFields.value = [...saved.deletedFields];
      for (const fk of saved.deletedFields) {
        const f = fields.value.find(ff => ff.key === fk);
        if (f) f.isDeleted = true;
      }
    }

    // 行ベースレイアウトを適用
    if (saved.fieldRows?.length) {
      fieldRows.value = saved.fieldRows.map(r => [...r]);
    } else {
      // 後方互換: fieldRowsがない場合、lineBreakAfterから行を構築
      buildRowsFromFlat();
    }

    // デフォルト定義に存在するがfieldRowsに含まれていないフィールドを末尾行に追加
    const allPlacedKeys = new Set(fieldRows.value.flat());
    const deletedSet = new Set(deletedFields.value);
    const hiddenSet = new Set(hiddenFields.value);
    const missingKeys = defaultFields
      .filter(f => !allPlacedKeys.has(f.key) && !deletedSet.has(f.key) && !hiddenSet.has(f.key))
      .map(f => f.key);
    if (missingKeys.length > 0) {
      fieldRows.value.push(missingKeys);
    }

    // テーブル列定義を適用
    if (saved.tableColumns) {
      shared.tableColumns.value = { ...saved.tableColumns };
    }
  };

  /** レイアウトの保存 */
  const saveLayout = async (updatedBy: string) => {
    const fieldOrders: Record<string, string[]> = {};
    const fieldWidths: Record<string, number> = {};
    const fieldRowSpans: Record<string, number> = {};
    const fieldLineBreaks: Record<string, boolean> = {};
    const fieldHeights: Record<string, number> = {};

    // セクション/サブセクション別にフィールドを収集
    for (const f of fields.value) {
      const groupKey = f.subSection || f.section;
      if (!fieldOrders[groupKey]) fieldOrders[groupKey] = [];
      fieldOrders[groupKey].push(f.key);
      fieldWidths[f.key] = f.widthPercent;
      if (f.rowSpan && f.rowSpan > 1) fieldRowSpans[f.key] = f.rowSpan;
      if (f.lineBreakAfter) fieldLineBreaks[f.key] = true;
      if (f.fieldHeight && f.fieldHeight > 0) fieldHeights[f.key] = f.fieldHeight;
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

    const payload: SavedFieldLayout = {
      pageId,
      fieldOrders,
      fieldWidths,
      fieldRowSpans: Object.keys(fieldRowSpans).length ? fieldRowSpans : undefined,
      fieldLineBreaks: Object.keys(fieldLineBreaks).length ? fieldLineBreaks : undefined,
      fieldHeights: Object.keys(fieldHeights).length ? fieldHeights : undefined,
      sectionHeights: Object.keys(sectionHeights.value).length ? { ...sectionHeights.value } : undefined,
      sectionOrder: sectionOrder.value,
      updatedAt: now.toISOString(),
      updatedBy,
      labelOverrides: Object.keys(labelOverrides.value).length ? { ...labelOverrides.value } : undefined,
      fieldOptions: Object.keys(fieldOptions.value).length ? { ...fieldOptions.value } : undefined,
      hiddenFields: hiddenFields.value.length ? [...hiddenFields.value] : undefined,
      deletedFields: deletedFields.value.length ? [...deletedFields.value] : undefined,
      fieldRows: fieldRows.value.length
        ? fieldRows.value.map(r => [...r])
        : undefined,
    };

    // customDefsを含める
    const fullPayload = {
      ...payload,
      customDefs: shared.customDefs.value.length ? [...shared.customDefs.value] : undefined,
      tableColumns: Object.keys(shared.tableColumns.value).length ? { ...shared.tableColumns.value } : undefined,
    };

    try {
      // API PUTで保存
      const res = await fetch(`/api/field-layout/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload),
      });
      if (!res.ok) throw new Error(`API保存失敗: ${res.status}`);

      isLayoutDirty.value = false;
    } catch (e) {
      console.error('レイアウト保存失敗:', e);
    }
  };
  /** レイアウト編集開始時のスナップショット */
  let layoutSnapshot: string | null = null;

  /** レイアウト編集を開始（スナップショットを保存） */
  const startLayoutEditing = () => {
    layoutSnapshot = JSON.stringify({
      fields: fields.value,
      sectionOrder: sectionOrder.value,
      sectionHeights: sectionHeights.value,
      labelOverrides: labelOverrides.value,
      hiddenFields: hiddenFields.value,
      deletedFields: deletedFields.value,
      fieldOptions: fieldOptions.value,
      fieldRows: fieldRows.value,
    });
    // UNDO/REDO初期化
    prevSnapshot = takeSnapshot();
    undoStack.value = [];
    redoStack.value = [];
    isLayoutEditing.value = true;
    isLayoutDirty.value = false;
  };

  /** レイアウト編集をキャンセル（スナップショットから復元） */
  const cancelLayoutEditing = () => {
    if (layoutSnapshot) {
      const snap = JSON.parse(layoutSnapshot);
      fields.value = snap.fields;
      sectionOrder.value = snap.sectionOrder;
      sectionHeights.value = snap.sectionHeights;
      labelOverrides.value = snap.labelOverrides;
      hiddenFields.value = snap.hiddenFields;
      deletedFields.value = snap.deletedFields || [];
      fieldOptions.value = snap.fieldOptions;
      fieldRows.value = snap.fieldRows || [];
    }
    // isLayoutEditingはtrueのまま（レイアウトページに留まる）
    isLayoutDirty.value = false;
    layoutSnapshot = null;
    prevSnapshot = takeSnapshot();
    undoStack.value = [];
    redoStack.value = [];
  };

  /** レイアウトをデフォルトにリセット */
  const resetLayout = () => {
    fields.value = JSON.parse(JSON.stringify(defaultFields));
    sectionOrder.value = sections.map(s => s.key);
    sectionHeights.value = {};
    labelOverrides.value = {};
    hiddenFields.value = [];
    deletedFields.value = [];
    fieldRows.value = [];
    buildRowsFromFlat();
    markDirty();
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

  /** フラットレイアウト用: 全フィールドをorder順で取得（非表示除外） */
  const getAllFieldsFlat = computed(() => {
    return fields.value
      .filter(f => !hiddenFields.value.includes(f.key))
      .sort((a, b) => a.order - b.order);
  });

  /** フラットレイアウト用: フィールド順序の更新（D&D後、セクション不要） */
  const updateFieldOrderFlat = (newKeys: string[]) => {
    newKeys.forEach((key, idx) => {
      const f = fields.value.find(ff => ff.key === key);
      if (f) f.order = idx + 1;
    });
    markDirty();
  };

  // ============================================================
  // 行ベースレイアウト API
  // ============================================================

  /** フラットフィールドから行を構築（lineBreakAfterまたは幅合計100%で改行） */
  const buildRowsFromFlat = () => {
    const visible = fields.value
      .filter(f => !hiddenFields.value.includes(f.key))
      .sort((a, b) => a.order - b.order);
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let rowWidthSum = 0;
    for (const f of visible) {
      currentRow.push(f.key);
      rowWidthSum += f.widthPercent;
      if (f.lineBreakAfter || rowWidthSum >= 100) {
        rows.push(currentRow);
        currentRow = [];
        rowWidthSum = 0;
      }
    }
    if (currentRow.length) rows.push(currentRow);
    fieldRows.value = rows;
  };

  /** heading行の直前と末尾に空行（ドロップゾーン）を保証 */
  const ensureDropZones = (rows: string[][]): string[][] => {
    const result: string[][] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      // 連続空行を防止: 直前が空行で今回も空行ならスキップ
      if (row.length === 0) {
        const prev = result[result.length - 1];
        if (prev && prev.length === 0) continue;
      }
      result.push([...row]);
      // 非空行の後に空行がなければ追加（ドロップゾーン）
      if (row.length > 0) {
        result.push([]);
      }
    }
    // 末尾に空行がなければ追加
    const lastRow = result[result.length - 1];
    if (result.length === 0 || (lastRow && lastRow.length > 0)) {
      result.push([]);
    }
    return result;
  };

  /** 行ベース: 表示用の行配列を取得（FieldDef[][] — ドロップゾーン空行を含む） */
  const getFieldRows = computed((): FieldDef[][] => {
    const hidden = new Set(hiddenFields.value);
    // ドロップゾーン（空行）はレイアウト編集時のみ追加
    const rows = isLayoutEditing.value
      ? ensureDropZones(fieldRows.value)
      : fieldRows.value;
    return rows.map(row =>
      row
        .filter(key => !hidden.has(key))
        .map(key => fields.value.find(f => f.key === key))
        .filter((f): f is FieldDef => !!f)
    );
  });

  /** 行ベース: 行内のフィールド順序更新（D&D後） */
  const updateRowFields = (rowIndex: number, newKeys: string[]) => {
    if (rowIndex >= 0 && rowIndex < fieldRows.value.length) {
      fieldRows.value[rowIndex] = [...newKeys];
      syncOrderFromRows();
    }
  };

  /** 行ベース: 行全体の更新（行間移動後） */
  const updateAllRows = (newRows: string[][]) => {
    // 空行を除去してデータ層に保存
    fieldRows.value = newRows.filter(r => r.length > 0);
    syncOrderFromRows();
  };



  /** 行ベース: 空行追加 */
  const addEmptyRow = (afterIndex?: number) => {
    const idx = afterIndex != null ? afterIndex + 1 : fieldRows.value.length;
    fieldRows.value.splice(idx, 0, []);
    markDirty();
  };

  /** 行ベース: 空行削除 */
  const removeEmptyRows = () => {
    fieldRows.value = fieldRows.value.filter(r => r.length > 0);
    markDirty();
  };

  /** 行ベース: フィールドを指定行に移動 */
  const moveFieldToRow = (fieldKey: string, targetRowIndex: number) => {
    // 元の行から削除
    for (const row of fieldRows.value) {
      const idx = row.indexOf(fieldKey);
      if (idx >= 0) {
        row.splice(idx, 1);
        break;
      }
    }
    // ターゲット行に追加
    while (fieldRows.value.length <= targetRowIndex) {
      fieldRows.value.push([]);
    }
    fieldRows.value[targetRowIndex]?.push(fieldKey);
    removeEmptyRows();
    syncOrderFromRows();
  };

  /** 行からorderを同期 */
  const syncOrderFromRows = () => {
    let order = 1;
    for (const row of fieldRows.value) {
      for (const key of row) {
        const f = fields.value.find(ff => ff.key === key);
        if (f) f.order = order++;
      }
    }
    markDirty();
  };

  /** headingの文字サイズ更新 */
  const updateHeadingSize = (fieldKey: string, size: number) => {
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) {
      f.headingSize = size;
      markDirty();
    }
  };

  /** headingの背景色更新 */
  const updateHeadingBg = (fieldKey: string, color: string) => {
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) {
      f.headingBg = color;
      markDirty();
    }
  };

  /** headingの文字色更新 */
  const updateHeadingColor = (fieldKey: string, color: string) => {
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) {
      f.headingColor = color;
      markDirty();
    }
  };

  /** spacerの高さ更新 */
  const updateSpacerHeight = (fieldKey: string, height: number) => {
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) {
      f.spacerHeight = height;
      markDirty();
    }
  };

  /** カスタムフィールドを動的追加 */
  const addDynamicField = (fieldDef: FieldDef) => {
    // 既に存在する場合はスキップ
    if (fields.value.find(f => f.key === fieldDef.key)) return;
    fields.value.push({ ...fieldDef });
    // fieldRowsにも追加（既に含まれていなければ末尾行へ）
    const allKeys = fieldRows.value.flat();
    if (!allKeys.includes(fieldDef.key)) {
      const lastRow = fieldRows.value[fieldRows.value.length - 1];
      if (lastRow) {
        lastRow.push(fieldDef.key);
      } else {
        fieldRows.value.push([fieldDef.key]);
      }
    }
    // customDefsにも登録（custom_プレフィックスまたはデフォルト定義に存在しないフィールド）
    const isDefaultField = defaultFields.some(df => df.key === fieldDef.key);
    if (fieldDef.key.startsWith('custom_') || !isDefaultField) {
      const exists = shared.customDefs.value.find(d => d.key === fieldDef.key);
      if (!exists) {
        shared.customDefs.value.push({
          key: fieldDef.key,
          label: fieldDef.label,
          section: fieldDef.section,
          component: fieldDef.component,
          widthPercent: fieldDef.widthPercent,
          order: fieldDef.order,
        });
      }
    }
    // table部品の場合、デフォルト4列を設定
    if (fieldDef.component === 'table' && !shared.tableColumns.value[fieldDef.key]) {
      shared.tableColumns.value = {
        ...shared.tableColumns.value,
        [fieldDef.key]: [
          { key: 'col_1', label: '列1', type: 'text' },
          { key: 'col_2', label: '列2', type: 'text' },
          { key: 'col_3', label: '列3', type: 'text' },
          { key: 'col_4', label: '列4', type: 'text' },
        ],
      };
    }
    markDirty();
  };

  /** カスタムフィールドを動的削除 */
  const removeDynamicField = (fieldKey: string) => {
    fields.value = fields.value.filter(f => f.key !== fieldKey);
    // fieldRowsからも削除
    fieldRows.value = fieldRows.value.map(row => row.filter(k => k !== fieldKey)).filter(row => row.length > 0);
    markDirty();
  };

  /** フィールドを論理削除（データは保持、レイアウトから除外） */
  const softDeleteField = (fieldKey: string) => {
    // 削除可否判定: custom_フィールドまたはdeletable: trueのみ削除可能
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f && !fieldKey.startsWith('custom_') && f.deletable !== true) {
      console.warn(`[レイアウト] 削除不可フィールド: ${fieldKey}`);
      return;
    }
    if (!deletedFields.value.includes(fieldKey)) {
      deletedFields.value.push(fieldKey);
    }
    if (f) f.isDeleted = true;
    // fieldRowsから除外
    fieldRows.value = fieldRows.value.map(row => row.filter(k => k !== fieldKey)).filter(row => row.length > 0);
    markDirty();
  };

  /** 論理削除を復元 */
  const restoreDeletedField = (fieldKey: string) => {
    deletedFields.value = deletedFields.value.filter(k => k !== fieldKey);
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) f.isDeleted = false;
    // fieldRowsの末尾に追加
    const lastRow = fieldRows.value[fieldRows.value.length - 1];
    if (lastRow) {
      lastRow.push(fieldKey);
    } else {
      fieldRows.value.push([fieldKey]);
    }
    markDirty();
  };

  /** フィールドをグリッド（fieldRows）に復元（DnDでゴミ箱/非表示に移動されたが拒否された場合用） */
  const restoreFieldToGrid = (fieldKey: string) => {
    // 既にfieldRowsに存在するなら何もしない
    const allPlaced = new Set(fieldRows.value.flat());
    if (allPlaced.has(fieldKey)) return;
    // 末尾行に追加
    const lastRow = fieldRows.value[fieldRows.value.length - 1];
    if (lastRow) {
      lastRow.push(fieldKey);
    } else {
      fieldRows.value.push([fieldKey]);
    }
  };

  /** ラベル上書きの更新 */
  const updateLabelOverride = (fieldKey: string, newLabel: string) => {
    labelOverrides.value[fieldKey] = newLabel;
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) f.label = newLabel;
    markDirty();
  };

  /** ラベル上書きの解除 */
  const removeLabelOverride = (fieldKey: string) => {
    delete labelOverrides.value[fieldKey];
    // デフォルトラベルに戻す
    const orig = defaultFields.find(ff => ff.key === fieldKey);
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f && orig) f.label = orig.label;
    markDirty();
  };

  /** カスタム選択肢の更新 */
  const updateFieldOptions = (fieldKey: string, options: FieldOption[]) => {
    fieldOptions.value[fieldKey] = [...options];
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) f.options = [...options];
    markDirty();
  };

  /** フィールドの表示/非表示切替 */
  const toggleFieldVisibility = (fieldKey: string, visible: boolean) => {
    if (visible) {
      hiddenFields.value = hiddenFields.value.filter(k => k !== fieldKey);
    } else {
      // 削除不可フィールドは非表示にできない
      const f = fields.value.find(ff => ff.key === fieldKey);
      if (f && !fieldKey.startsWith('custom_') && f.deletable !== true) {
        console.warn(`[レイアウト] 非表示不可フィールド: ${fieldKey}`);
        return;
      }
      if (!hiddenFields.value.includes(fieldKey)) {
        hiddenFields.value.push(fieldKey);
      }
    }
    markDirty();
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
    markDirty();
  };

  /** フィールド横幅の更新（%単位） */
  const updateFieldWidth = (fieldKey: string, newWidthPercent: number) => {
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) {
      f.widthPercent = Math.max(5, Math.min(newWidthPercent, 100));
      markDirty();
    }
  };

  /** フィールドの高さ更新（px単位） */
  const updateFieldHeight = (fieldKey: string, newHeight: number) => {
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) {
      f.fieldHeight = Math.max(30, newHeight);
      markDirty();
    }
  };

  /** セクション順序の更新 */
  const updateSectionOrder = (newOrder: string[]) => {
    sectionOrder.value = newOrder;
    markDirty();
  };

  /** フィールドの行区切り更新 */
  const updateFieldLineBreak = (fieldKey: string, value: boolean) => {
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) {
      f.lineBreakAfter = value;
      markDirty();
    }
  };

  /** フィールドの縦幅更新 */
  const updateFieldRowSpan = (fieldKey: string, rowSpan: number) => {
    const f = fields.value.find(ff => ff.key === fieldKey);
    if (f) {
      f.rowSpan = Math.max(1, rowSpan);
      markDirty();
    }
  };

  /** セクション高さの更新 */
  const updateSectionHeight = (sectionKey: string, height: number) => {
    sectionHeights.value[sectionKey] = height;
    markDirty();
  };

  /** ソート済みセクション一覧 */
  const sortedSections = computed(() => {
    return sectionOrder.value
      .map(key => sections.find(s => s.key === key))
      .filter((s): s is SectionDef => !!s);
  });

  // 変更検知（UNDO不要: 個別操作で既にpushUndoされている）
  watch(fields, () => {
    if (isLayoutEditing.value && !isRestoring) {
      isLayoutDirty.value = true;
    }
  }, { deep: true });

  return {
    fields,
    sectionOrder,
    sectionHeights,
    isLayoutEditing,
    isLayoutDirty,
    sortedSections,
    loadLayout,
    saveLayout,
    resetLayout,
    startLayoutEditing,
    cancelLayoutEditing,
    undo,
    redo,
    canUndo,
    canRedo,
    getFieldsForSection,
    updateFieldOrder,
    updateFieldWidth,
    updateFieldHeight,
    updateFieldLineBreak,
    updateFieldRowSpan,
    updateSectionOrder,
    updateSectionHeight,
    labelOverrides,
    hiddenFields,
    updateLabelOverride,
    removeLabelOverride,
    toggleFieldVisibility,
    defaultFields,
    addDynamicField,
    removeDynamicField,
    // カスタム選択肢管理
    fieldOptions,
    updateFieldOptions,
    // フラットレイアウト用API
    getAllFieldsFlat,
    updateFieldOrderFlat,
    updateHeadingSize,
    updateHeadingBg,
    updateHeadingColor,
    updateSpacerHeight,
    // 行ベースレイアウトAPI
    fieldRows,
    getFieldRows,
    updateRowFields,
    updateAllRows,
    addEmptyRow,
    removeEmptyRows,
    moveFieldToRow,
    buildRowsFromFlat,
    // 論理削除管理
    deletedFields,
    softDeleteField,
    restoreDeletedField,
    restoreFieldToGrid,
    // カスタムフィールド定義（useCustomFieldsから統合）
    customDefs: shared.customDefs,
    // テーブル列定義
    tableColumns: shared.tableColumns,
    updateTableColumns: (fieldKey: string, cols: TableColumnDef[]) => {
      const current = JSON.stringify(shared.tableColumns.value[fieldKey] ?? []);
      const incoming = JSON.stringify(cols);
      if (current === incoming) return; // 変更なし→スキップ
      shared.tableColumns.value = { ...shared.tableColumns.value, [fieldKey]: cols };
      markDirty();
    },
    // dirty状態の手動設定
    markDirty,
  };
}
