/**
 * useServerTable — サーバーサイドテーブルの共通composable
 *
 * 全テーブルページ（Clients, Staff, Vendors, NonVendor, Lead, Export, ExportDetail）で
 * 個別にコピペされていた以下のパターンを統合:
 *   - filteredRows (ref) / pagedRows (computed)
 *   - fetchList() でAPI取得 → filteredRows上書き
 *   - isLoading / currentPage / totalPages / totalCount
 *   - goToPage() / refreshList()
 *   - 楽観的更新（updateRow: 即時反映 + API保存 + ロールバック）
 *
 * Supabase移行時: fetchFn を Supabase クエリに差し替えるだけで全ページ移行完了
 */
import { ref, computed, type Ref } from 'vue';

/** サーバーに送るクエリ（各ページのfetchFnで型を具体化） */
export interface ServerTableQuery {
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

/** サーバーからのレスポンス共通型 */
export interface ServerTableResult<T> {
  rows: T[];
  totalCount: number;
  totalPages: number;
}

/** useServerTable 設定 */
export interface UseServerTableOptions<T> {
  /** サーバーからデータを取得する関数 */
  fetchFn: (query: ServerTableQuery) => Promise<ServerTableResult<T>>;
  /** 行のIDキー名 */
  idKey: keyof T;
  /** 1ページあたりの表示件数（デフォルト50） */
  pageSize?: number;
}

export function useServerTable<T>(options: UseServerTableOptions<T>) {
  const {
    fetchFn,
    idKey,
    pageSize = 50,
  } = options;

  // --- 状態 ---
  const rows: Ref<T[]> = ref([]) as Ref<T[]>;
  const isLoading = ref(true);
  const loadingMessage = ref('読み込み中…');
  const currentPage = ref(1);
  const totalPages = ref(1);
  const totalCount = ref(0);

  /** テーブル表示用（filteredRows → pagedRows互換） */
  const pagedRows = computed(() => rows.value);

  /** ページ範囲表示用 */
  const pageStartIndex = computed(() =>
    totalCount.value === 0 ? 0 : (currentPage.value - 1) * pageSize + 1
  );
  const pageEndIndex = computed(() =>
    Math.min(currentPage.value * pageSize, totalCount.value)
  );

  // --- race condition防止 ---
  let fetchRequestId = 0;

  /**
   * サーバーからデータを取得して rows を更新
   * @param extraQuery fetchFn に渡す追加パラメータ（フィルタ・ソート条件等）
   */
  async function fetchList(extraQuery: Record<string, unknown> = {}) {
    const myRequestId = ++fetchRequestId;
    isLoading.value = true;

    try {
      const result = await fetchFn({
        page: currentPage.value,
        pageSize,
        ...extraQuery,
      });

      // race condition防止: より新しいリクエストが発行されていたら結果を破棄
      if (myRequestId !== fetchRequestId) return;

      rows.value = result.rows as T[];
      totalPages.value = result.totalPages;
      totalCount.value = result.totalCount;
    } catch (e) {
      if (myRequestId !== fetchRequestId) return;
      console.error('[useServerTable] データ取得失敗:', e);
    } finally {
      if (myRequestId === fetchRequestId) {
        isLoading.value = false;
      }
    }
  }

  /** ページ変更 */
  function goToPage(page: number, extraQuery: Record<string, unknown> = {}) {
    const clamped = Math.max(1, Math.min(page, totalPages.value));
    if (currentPage.value === clamped) return;
    currentPage.value = clamped;
    fetchList(extraQuery);
  }

  /** データ再取得（refreshList互換） */
  function refreshList(extraQuery: Record<string, unknown> = {}) {
    return fetchList(extraQuery);
  }

  /**
   * 楽観的更新: rows内の該当行を即時書き換え
   *
   * API保存は呼び出し側の責務（composable経由のupdateClientLocal等）。
   * この関数はフロント側のrows refだけを即時更新する。
   *
   * @param id 更新対象のID
   * @param patch 更新するフィールド
   * @returns 更新前の行データ（ロールバック用）。見つからなければnull
   */
  function updateRow(id: unknown, patch: Partial<T>): T | null {
    const idx = rows.value.findIndex(r => r[idKey] === id);
    if (idx < 0) return null;
    const backup = { ...rows.value[idx]! };
    rows.value[idx] = { ...backup, ...patch };
    return backup;
  }

  /**
   * 楽観的更新のロールバック
   *
   * API保存が失敗した場合に、updateRow で取得したバックアップを使って元に戻す。
   *
   * @param id 対象のID
   * @param backup updateRow の戻り値
   */
  function rollbackRow(id: unknown, backup: T) {
    const idx = rows.value.findIndex(r => r[idKey] === id);
    if (idx >= 0) {
      rows.value[idx] = backup;
    }
  }

  /**
   * 行を追加（テーブル先頭に挿入）
   */
  function addRow(item: T) {
    rows.value = [item, ...rows.value];
    totalCount.value++;
  }

  /**
   * 行を削除
   */
  function deleteRow(id: unknown) {
    rows.value = rows.value.filter(r => r[idKey] !== id);
    totalCount.value = Math.max(0, totalCount.value - 1);
  }

  return {
    // 状態
    rows,
    pagedRows,
    isLoading,
    loadingMessage,
    currentPage,
    totalPages,
    totalCount,
    pageStartIndex,
    pageEndIndex,
    pageSize,

    // 操作
    fetchList,
    goToPage,
    refreshList,

    // 楽観的更新
    updateRow,
    rollbackRow,
    addRow,
    deleteRow,
  };
}
