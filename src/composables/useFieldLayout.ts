/**
 * フィールドレイアウト管理Composable
 * ドラッグ&ドロップ順序変更・横幅リサイズ・レイアウト保存/復元
 */
import { ref, computed, watch } from 'vue';
import type { FieldDef, FieldOption, SectionDef, SavedFieldLayout, LayoutVersion } from '@/types/fieldLayout';

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

  /** カスタムフィールドの選択肢（fieldKey -> FieldOption[]） */
  const fieldOptions = ref<Record<string, FieldOption[]>>({});

  /** 非表示フィールド一覧 */
  const hiddenFields = ref<string[]>([]);

  /** 論理削除済みフィールド一覧 */
  const deletedFields = ref<string[]>([]);

  /** 行ベースレイアウト（各行のフィールドキー配列） */
  const fieldRows = ref<string[][]>([]);

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
      fieldHeights: Object.keys(fieldHeights).length ? fieldHeights : undefined,
      sectionHeights: Object.keys(sectionHeights.value).length ? { ...sectionHeights.value } : undefined,
      sectionOrder: sectionOrder.value,
      updatedAt: now.toISOString(),
      updatedBy,
      versionLabel,
      isDefault: layoutVersions.value.length === 0,
      labelOverrides: Object.keys(labelOverrides.value).length ? { ...labelOverrides.value } : undefined,
      fieldOptions: Object.keys(fieldOptions.value).length ? { ...fieldOptions.value } : undefined,
      hiddenFields: hiddenFields.value.length ? [...hiddenFields.value] : undefined,
      deletedFields: deletedFields.value.length ? [...deletedFields.value] : undefined,
      // fieldRows.valueは空行を含まない純粋データなのでそのまま保存
      fieldRows: fieldRows.value.length
        ? fieldRows.value.map(r => [...r])
        : undefined,
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
    // データ層（fieldRows.value）には空行がないので、表示時にドロップゾーンを挿入
    const withDropZones = ensureDropZones(fieldRows.value);
    return withDropZones.map(row =>
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
    if (!deletedFields.value.includes(fieldKey)) {
      deletedFields.value.push(fieldKey);
    }
    const f = fields.value.find(ff => ff.key === fieldKey);
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
  };
}
