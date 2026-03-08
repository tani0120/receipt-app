/**
 * 月カラム生成ユーティリティ
 * 現在月から12ヶ月遡りを動的に計算する。
 * 月次レポート等、他ページでも再利用可能。
 */
import { computed } from 'vue';
import type { MonthColumn } from '../types';

/**
 * 直近12ヶ月のカラム定義を返すcomputedを生成する。
 * @param monthCount 表示月数（デフォルト: 12）
 * @returns computed<MonthColumn[]> — 古い月から新しい月の順
 */
export function useMonthColumns(monthCount = 12) {
    return computed<MonthColumn[]>(() => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();
        const cols: MonthColumn[] = [];

        for (let i = monthCount - 1; i >= 0; i--) {
            let m = currentMonth - i;
            let y = currentYear;
            if (m <= 0) {
                m += 12;
                y -= 1;
            }
            const key = `${y}-${String(m).padStart(2, '0')}`;
            cols.push({ key, label: `${m}月`, year: y, month: m });
        }

        return cols;
    });
}
