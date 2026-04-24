<template>
  <div class="td-root">
    <!-- 凡例 -->
    <div class="td-legend">
      <span v-for="l in LEGEND" :key="l.symbol" class="td-legend-item">
        <span class="td-legend-dot" :style="{ background: l.color }"></span>
        <span class="td-legend-symbol">{{ l.symbol }}</span>
        <span class="td-legend-label">{{ l.label }}</span>
      </span>
    </div>

    <!-- セクション -->
    <div v-for="section in TYPE_SECTIONS" :key="section.title" class="td-section">
      <div class="td-section-header">
        <i :class="section.icon"></i>
        <span>{{ section.title }}</span>
      </div>
      <div class="td-table-wrap">
        <table class="td-table">
          <thead>
            <tr class="td-group-row">
              <th class="td-th td-th-field" rowspan="2">フィールド</th>
              <th class="td-th td-th-label" rowspan="2">名称</th>
              <th class="td-th td-th-type" rowspan="2">型</th>
              <th class="td-th td-th-group td-grp-upload" colspan="2">アップロード</th>
              <th class="td-th td-th-group td-grp-select" colspan="2">資料選別</th>
              <th class="td-th td-th-cat" rowspan="2">本番AI</th>
              <th class="td-th td-th-group td-grp-output" colspan="4">出力</th>
              <th class="td-th td-th-note" rowspan="2">備考</th>
            </tr>
            <tr class="td-sub-row">
              <th class="td-th td-th-sub td-sub-upload">独自</th>
              <th class="td-th td-th-sub td-sub-upload">ドライブ</th>
              <th class="td-th td-th-sub td-sub-select">独自</th>
              <th class="td-th td-th-sub td-sub-select">ドライブ</th>
              <th class="td-th td-th-sub td-sub-output">MF</th>
              <th class="td-th td-th-sub td-sub-output">費用</th>
              <th class="td-th td-th-sub td-sub-output">担当別<br>仕訳数</th>
              <th class="td-th td-th-sub td-sub-output">担当別<br>処理時間</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in section.fields" :key="f.field" class="td-row">
              <td class="td-td td-td-field"><code>{{ f.field }}</code></td>
              <td class="td-td td-td-label">{{ f.label }}</td>
              <td class="td-td td-td-type"><code>{{ f.tsType }}</code></td>
              <td class="td-td td-td-cat" :class="cellClass(f.uploadOwn)">{{ f.uploadOwn }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.uploadDrive)">{{ f.uploadDrive }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.selectOwn)">{{ f.selectOwn }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.selectDrive)">{{ f.selectDrive }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.prodAi)">{{ f.prodAi }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.outMf)">{{ f.outMf }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.outCost)">{{ f.outCost }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.outStaffCount)">{{ f.outStaffCount }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.outStaffTime)">{{ f.outStaffTime }}</td>
              <td class="td-td td-td-note">{{ f.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 統計サマリ -->
    <div class="td-summary">
      <div class="td-summary-card">
        <div class="td-summary-num">{{ totalFields }}</div>
        <div class="td-summary-label">総フィールド数</div>
      </div>
      <div class="td-summary-card td-summary-warn">
        <div class="td-summary-num">{{ selectOwnMissing }}</div>
        <div class="td-summary-label">選別・独自で未保存</div>
      </div>
      <div class="td-summary-card td-summary-miss">
        <div class="td-summary-num">{{ selectDriveMissing }}</div>
        <div class="td-summary-label">選別・ドライブで未取得</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TYPE_SECTIONS, LEGEND } from './typeDefinitionsData'

const totalFields = computed(() =>
  TYPE_SECTIONS.reduce((sum, s) => sum + s.fields.length, 0)
)
const selectOwnMissing = computed(() =>
  TYPE_SECTIONS.reduce((sum, s) => sum + s.fields.filter(f => f.selectOwn === '🔧').length, 0)
)
const selectDriveMissing = computed(() =>
  TYPE_SECTIONS.reduce((sum, s) => sum + s.fields.filter(f => f.selectDrive === '🔧').length, 0)
)

function cellClass(v: string): string {
  if (v === '✅') return 'td-cell-ok'
  if (v === '🔧') return 'td-cell-pending'
  if (v === '⛔') return 'td-cell-blocked'
  if (v === '将来') return 'td-cell-future'
  return 'td-cell-na'
}
</script>

<style scoped>
.td-root { font-family: 'Noto Sans JP', 'Inter', sans-serif; }

.td-legend { display: flex; flex-wrap: wrap; gap: 16px; padding: 12px 0 16px; }
.td-legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; }
.td-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.td-legend-symbol { font-weight: 700; }
.td-legend-label { color: #64748b; }

.td-section { margin-bottom: 24px; }
.td-section-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 700; color: #1e293b;
  padding: 8px 0; border-bottom: 2px solid #e2e8f0;
}

.td-table-wrap { overflow-x: auto; }
.td-table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }

.td-th {
  background: #f1f5f9; color: #475569; font-weight: 600;
  padding: 5px 6px; text-align: left; border: 1px solid #e2e8f0;
  white-space: nowrap; position: sticky; top: 0;
}
.td-th-field { width: 130px; }
.td-th-label { width: 90px; }
.td-th-type { width: 90px; }
.td-th-group { text-align: center; font-size: 11px; font-weight: 700; }
.td-grp-upload { background: #e0f2fe; color: #0369a1; }
.td-grp-select { background: #fef3c7; color: #92400e; }
.td-grp-output { background: #f0fdf4; color: #166534; }
.td-th-sub { text-align: center; font-size: 9px; font-weight: 600; width: 48px; white-space: normal; line-height: 1.2; }
.td-sub-upload { background: #f0f9ff; color: #0284c7; }
.td-sub-select { background: #fffbeb; color: #b45309; }
.td-sub-output { background: #f0fdf4; color: #166534; }
.td-th-cat { width: 48px; text-align: center; }
.td-th-note { width: auto; }

.td-row:hover { background: #f8fafc; }
.td-td { padding: 4px 6px; border: 1px solid #e2e8f0; vertical-align: top; line-height: 1.4; }
.td-td-field code { font-size: 9px; color: #7c3aed; background: #f5f3ff; padding: 1px 3px; border-radius: 3px; }
.td-td-type code { font-size: 9px; color: #0369a1; background: #f0f9ff; padding: 1px 3px; border-radius: 3px; }
.td-td-cat { text-align: center; font-weight: 600; font-size: 11px; white-space: nowrap; }
.td-td-note { font-size: 9px; color: #64748b; }

.td-cell-ok { background: #f0fdf4; color: #16a34a; }
.td-cell-pending { background: #fffbeb; color: #d97706; }
.td-cell-blocked { background: #fef2f2; color: #dc2626; }
.td-cell-future { background: #f5f3ff; color: #7c3aed; }
.td-cell-na { color: #cbd5e1; }

.td-summary { display: flex; gap: 16px; padding: 16px 0; }
.td-summary-card {
  background: white; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 16px 24px; text-align: center; min-width: 120px;
}
.td-summary-num { font-size: 28px; font-weight: 800; color: #1e293b; }
.td-summary-label { font-size: 11px; color: #64748b; margin-top: 4px; }
.td-summary-warn .td-summary-num { color: #dc2626; }
.td-summary-miss .td-summary-num { color: #f59e0b; }
</style>
