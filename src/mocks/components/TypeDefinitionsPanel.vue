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
          <colgroup>
            <col style="width:100px" /><!-- フィールド -->
            <col style="width:70px" /><!-- 名称 -->
            <col style="width:80px" /><!-- 型 -->
            <col style="width:26px" /><col style="width:26px" /><col style="width:26px" /><!-- UL独自 -->
            <col style="width:26px" /><col style="width:26px" /><col style="width:26px" /><!-- UL Drive -->
            <col style="width:26px" /><col style="width:26px" /><col style="width:26px" /><!-- 選別独自 -->
            <col style="width:26px" /><col style="width:26px" /><col style="width:26px" /><!-- 選別Drive -->
            <col style="width:26px" /><col style="width:26px" /><col style="width:26px" /><!-- 変換 -->
            <col style="width:26px" /><col style="width:26px" /><col style="width:26px" /><!-- 科目 -->
            <col style="width:26px" /><col style="width:26px" /><col style="width:26px" /><!-- 一覧 -->
            <col style="width:30px" /><col style="width:30px" /><col style="width:30px" /><col style="width:30px" /><!-- 出力 MF/費用/件数/時間 -->
            <col style="width:80px" /><!-- 転記元 -->
            <col /><!-- 備考 -->
          </colgroup>
          <thead>
            <tr class="td-group-row">
              <th class="td-th td-th-field" rowspan="3">フィールド</th>
              <th class="td-th td-th-label" rowspan="3">名称</th>
              <th class="td-th td-th-type" rowspan="3">型</th>
              <th class="td-th td-th-group td-grp-upload" colspan="3">UL独自</th>
              <th class="td-th td-th-group td-grp-upload" colspan="3">UL Drive</th>
              <th class="td-th td-th-group td-grp-select" colspan="3">選別独自</th>
              <th class="td-th td-th-group td-grp-select" colspan="3">選別Drive</th>
              <th class="td-th td-th-group td-grp-ts" colspan="3">仕訳変換</th>
              <th class="td-th td-th-group td-grp-ts" colspan="3">科目確定</th>
              <th class="td-th td-th-group td-grp-journal" colspan="3">仕訳一覧</th>
              <th class="td-th td-th-group td-grp-output" colspan="4">出力</th>
              <th class="td-th td-th-cat" rowspan="3">転記元</th>
              <th class="td-th td-th-note" rowspan="3">備考</th>
            </tr>
            <tr class="td-ai-name-row">
              <th class="td-th td-th-ai-name td-grp-upload" colspan="3">証票分類AI ✅</th>
              <th class="td-th td-th-ai-name td-grp-upload" colspan="3">証票分類AI ⛔</th>
              <th class="td-th td-th-ai-name" colspan="3">—</th>
              <th class="td-th td-th-ai-name" colspan="3">—</th>
              <th class="td-th td-th-ai-name" colspan="3">—</th>
              <th class="td-th td-th-ai-name" colspan="3">仕訳確定AI 🔧</th>
              <th class="td-th td-th-ai-name" colspan="3">—</th>
              <th class="td-th td-th-ai-name" colspan="4">—</th>
            </tr>
            <tr class="td-sub-row">
              <th class="td-th td-th-sub td-sub-upload">AI</th>
              <th class="td-th td-th-sub td-sub-upload">TS</th>
              <th class="td-th td-th-sub td-sub-upload">人</th>
              <th class="td-th td-th-sub td-sub-upload">AI</th>
              <th class="td-th td-th-sub td-sub-upload">TS</th>
              <th class="td-th td-th-sub td-sub-upload">人</th>
              <th class="td-th td-th-sub td-sub-select">AI</th>
              <th class="td-th td-th-sub td-sub-select">TS</th>
              <th class="td-th td-th-sub td-sub-select">人</th>
              <th class="td-th td-th-sub td-sub-select">AI</th>
              <th class="td-th td-th-sub td-sub-select">TS</th>
              <th class="td-th td-th-sub td-sub-select">人</th>
              <th class="td-th td-th-sub">AI</th>
              <th class="td-th td-th-sub">TS</th>
              <th class="td-th td-th-sub">人</th>
              <th class="td-th td-th-sub">AI</th>
              <th class="td-th td-th-sub">TS</th>
              <th class="td-th td-th-sub">人</th>
              <th class="td-th td-th-sub td-sub-select">AI</th>
              <th class="td-th td-th-sub td-sub-select">TS</th>
              <th class="td-th td-th-sub td-sub-select">人</th>
              <th class="td-th td-th-sub td-sub-output">MF</th>
              <th class="td-th td-th-sub td-sub-output">費用</th>
              <th class="td-th td-th-sub td-sub-output">件数</th>
              <th class="td-th td-th-sub td-sub-output">時間</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in section.fields" :key="f.field" class="td-row">
              <td class="td-td td-td-field"><code>{{ f.field }}</code></td>
              <td class="td-td td-td-label">{{ f.label }}</td>
              <td class="td-td td-td-type"><code>{{ f.tsType }}</code></td>
              <td class="td-td td-td-cat" :class="cellClass(f.uploadOwnAi)">{{ f.uploadOwnAi }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.uploadOwnTs)">{{ f.uploadOwnTs }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.uploadOwnHuman)">{{ f.uploadOwnHuman }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.uploadDriveAi)">{{ f.uploadDriveAi }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.uploadDriveTs)">{{ f.uploadDriveTs }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.uploadDriveHuman)">{{ f.uploadDriveHuman }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.selectOwnAi)">{{ f.selectOwnAi }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.selectOwnTs)">{{ f.selectOwnTs }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.selectOwnHuman)">{{ f.selectOwnHuman }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.selectDriveAi)">{{ f.selectDriveAi }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.selectDriveTs)">{{ f.selectDriveTs }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.selectDriveHuman)">{{ f.selectDriveHuman }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.convertAi)">{{ f.convertAi }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.convertTs)">{{ f.convertTs }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.convertHuman)">{{ f.convertHuman }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.accountAi)">{{ f.accountAi }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.accountTs)">{{ f.accountTs }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.accountHuman)">{{ f.accountHuman }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.journalAi)">{{ f.journalAi }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.journalTs)">{{ f.journalTs }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.journalHuman)">{{ f.journalHuman }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.outMf)">{{ f.outMf }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.outCost)">{{ f.outCost }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.outStaffCount)">{{ f.outStaffCount }}</td>
              <td class="td-td td-td-cat" :class="cellClass(f.outStaffTime)">{{ f.outStaffTime }}</td>
              <td class="td-td td-td-note">{{ f.dataSource }}</td>
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
  TYPE_SECTIONS.reduce((sum, s) => sum + s.fields.filter(f => f.selectOwnTs === '🔧').length, 0)
)
const selectDriveMissing = computed(() =>
  TYPE_SECTIONS.reduce((sum, s) => sum + s.fields.filter(f => f.selectDriveTs === '🔧').length, 0)
)

function cellClass(v: string): string {
  if (v === '✅') return 'td-cell-ok'
  if (v === '→') return 'td-cell-inherit'
  if (v === '✏️') return 'td-cell-update'
  if (v === '🔧') return 'td-cell-pending'
  if (v === '⛔') return 'td-cell-blocked'
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
.td-table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; min-width: 900px; }

.td-th {
  background: #f1f5f9; color: #475569; font-weight: 600;
  padding: 5px 6px; text-align: left; border: 1px solid #e2e8f0;
  white-space: nowrap; position: sticky; top: 0;
}
.td-th-field { width: 100px; }
.td-th-label { width: 70px; }
.td-th-type { width: 80px; }
.td-th-group { text-align: center; font-size: 11px; font-weight: 700; }
.td-grp-upload { background: #e0f2fe; color: #0369a1; }
.td-grp-select { background: #fef3c7; color: #92400e; }
.td-grp-ts { background: #e0f2fe; color: #0e7490; width: 36px; }
.td-grp-human { background: #fce7f3; color: #be185d; width: 36px; }
.td-grp-journal { background: #ede9fe; color: #6d28d9; width: 72px; }
.td-grp-output { background: #f0fdf4; color: #166534; }
.td-th-sub { text-align: center; font-size: 8px; font-weight: 600; width: 36px; white-space: normal; line-height: 1.2; }
.td-th-ai-name { text-align: center; font-size: 9px; font-weight: 700; padding: 2px 4px; white-space: nowrap; color: #7c3aed; background: #faf5ff; }
.td-sub-upload { background: #f0f9ff; color: #0284c7; }
.td-sub-select { background: #fffbeb; color: #b45309; }
.td-sub-output { background: #f0fdf4; color: #166534; }
.td-th-cat { width: 20px; text-align: center; }
.td-th-note { width: auto; }

.td-row:hover { background: #f8fafc; }
.td-td { padding: 4px 6px; border: 1px solid #e2e8f0; vertical-align: top; line-height: 1.4; }
.td-td-field code { font-size: 9px; color: #7c3aed; background: #f5f3ff; padding: 1px 3px; border-radius: 3px; }
.td-td-type code { font-size: 9px; color: #0369a1; background: #f0f9ff; padding: 1px 3px; border-radius: 3px; }
.td-td-cat { text-align: center; font-weight: 600; font-size: 11px; white-space: nowrap; }
.td-td-note { font-size: 9px; color: #64748b; }
.td-th-ai-col { text-align: center; font-size: 10px; font-weight: 700; color: #7c3aed; background: #faf5ff; white-space: nowrap; width: 80px; }
.td-ai-sub { font-size: 8px; font-weight: 400; color: #a78bfa; }

.td-cell-ok { background: #f0fdf4; color: #16a34a; }
.td-cell-inherit { background: #eff6ff; color: #3b82f6; }
.td-cell-update { background: #faf5ff; color: #9333ea; }
.td-cell-pending { background: #fffbeb; color: #d97706; }
.td-cell-blocked { background: #fef2f2; color: #dc2626; }
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
