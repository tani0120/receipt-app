<script setup lang="ts">
import { ref } from 'vue';
import { executeOCR } from '@/api/ocr/ocr_service';
import type { AIIntermediateOutput } from '@/types/GeminiOCR.types';

// 単発テスト用
const selectedFile = ref<File | null>(null);
const isProcessing = ref(false);
const result = ref<any>(null);
const error = ref<string | null>(null);

// 10回テスト用
interface TestResult {
  run_number: number;
  json_output: AIIntermediateOutput;
  processing_time_ms: number;
  timestamp: string;
}

interface TestSummary {
  total_runs: number;
  identical_count: number;
  time_min: number;
  time_avg: number;
  time_max: number;
  estimated_cost_jpy: number;
  variance_report: {
    vendor_unique: string[];
    date_unique: string[];
    amount_unique: number[];
    category_unique: string[];
  };
}

const isRunning10Test = ref(false);
const testResults = ref<TestResult[]>([]);
const testSummary = ref<TestSummary | null>(null);

const COST_PER_RUN_JPY = 0.19; // 実測値（Gemini 3 Flash）

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    result.value = null;
    error.value = null;
  }
}

async function runOCR() {
  if (!selectedFile.value) {
    error.value = '画像ファイルを選択してください';
    return;
  }

  isProcessing.value = true;
  error.value = null;
  result.value = null;

  try {
    const ocrResult = await executeOCR(
      selectedFile.value,
      'CL-001'
    );

    result.value = ocrResult;
    console.log('✅ OCR成功:', ocrResult);
  } catch (err: any) {
    error.value = err.message || 'OCR実行エラー';
    console.error('❌ OCR失敗:', err);
  } finally {
    isProcessing.value = false;
  }
}

/**
 * JSON比較（explanation除外）
 */
function normalizeForCompare(obj: AIIntermediateOutput): any {
  const { explanation, ...rest } = obj;
  return rest;
}

function areJSONsIdentical(a: AIIntermediateOutput, b: AIIntermediateOutput): boolean {
  const normA = normalizeForCompare(a);
  const normB = normalizeForCompare(b);
  return JSON.stringify(normA) === JSON.stringify(normB);
}

/**
 * 10回連続OCRテスト
 */
async function run10TimesTest() {
  if (!selectedFile.value) {
    error.value = '画像ファイルを選択してください';
    return;
  }

  isRunning10Test.value = true;
  error.value = null;
  testResults.value = [];
  testSummary.value = null;

  const results: TestResult[] = [];

  try {
    for (let i = 1; i <= 10; i++) {
      console.log(`🔄 実行中: ${i}/10`);

      const startTime = performance.now();

      const ocrResult = await executeOCR(
        selectedFile.value,
        'CL-001'
      );

      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);

      results.push({
        run_number: i,
        json_output: ocrResult,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      });
    }

    testResults.value = results;
    testSummary.value = calculateSummary(results);

    console.log('✅ 10回テスト完了:', testSummary.value);
  } catch (err: any) {
    error.value = `10回テストエラー: ${err.message}`;
    console.error('❌ 10回テスト失敗:', err);
  } finally {
    isRunning10Test.value = false;
  }
}

/**
 * CSV/JSONダウンロード機能
 */
function downloadJSON() {
  if (!testSummary.value || testResults.value.length === 0) return;

  const data = {
    summary: testSummary.value,
    detailed_results: testResults.value
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ocr_test_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV() {
  if (testResults.value.length === 0) return;

  // CSV Header
  const headers = ['試行', '店名', '日付', '金額', 'T番号', '推定科目', 'explanation', '処理時間(ms)'];
  const rows = testResults.value.map(r => [
    r.run_number,
    r.json_output.vendor,
    r.json_output.date,
    r.json_output.total_amount,
    r.json_output.t_number,
    r.json_output.inferred_category,
    r.json_output.explanation || '',
    r.processing_time_ms
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ocr_test_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 結果集計
 */
function calculateSummary(results: TestResult[]): TestSummary {
  const times = results.map(r => r.processing_time_ms);
  const baseJSON = results[0].json_output;

  let identicalCount = 0;
  const vendors = new Set<string>();
  const dates = new Set<string>();
  const amounts = new Set<number>();
  const categories = new Set<string>();

  results.forEach(r => {
    if (areJSONsIdentical(r.json_output, baseJSON)) {
      identicalCount++;
    }

    vendors.add(r.json_output.vendor || '');
    dates.add(r.json_output.date || '');
    amounts.add(r.json_output.total_amount || 0);
    categories.add(r.json_output.inferred_category || '');
  });

  return {
    total_runs: results.length,
    identical_count: identicalCount,
    time_min: Math.min(...times),
    time_avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    time_max: Math.max(...times),
    estimated_cost_jpy: results.length * COST_PER_RUN_JPY,
    variance_report: {
      vendor_unique: Array.from(vendors),
      date_unique: Array.from(dates),
      amount_unique: Array.from(amounts),
      category_unique: Array.from(categories)
    }
  };
}
</script>

<template>
  <div class="ocr-test-page">
    <div class="container">
      <h1>📄 Gemini OCR テスト（ブラウザ版）</h1>

      <div class="upload-section">
        <h2>画像選択</h2>
        <input
          type="file"
          accept="image/*"
          @change="onFileChange"
          class="file-input"
        />
        <p v-if="selectedFile" class="selected-file">
          選択中: {{ selectedFile.name }}
        </p>
      </div>

      <div class="action-section">
        <button
          @click="runOCR"
          :disabled="!selectedFile || isProcessing"
          class="btn-primary"
        >
          {{ isProcessing ? 'OCR実行中...' : 'OCR実行' }}
        </button>

        <button
          @click="run10TimesTest"
          :disabled="!selectedFile || isRunning10Test"
          class="btn-test"
        >
          {{ isRunning10Test ? '10回テスト実行中...' : '🔁 10回連続テスト（Done Definition検証）' }}
        </button>
      </div>

      <div v-if="isRunning10Test" class="progress-section">
        <p>📊 10回連続テスト実行中...（{{ testResults.length }}/10）</p>
      </div>

      <!-- 10回テスト結果サマリー -->
      <div v-if="testSummary" class="summary-section">
        <h2>📊 Done Definition検証結果</h2>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">実行回数</div>
            <div class="summary-value">{{ testSummary.total_runs }}回</div>
          </div>

          <div class="summary-card" :class="testSummary.identical_count >= 9 ? 'success' : 'warning'">
            <div class="summary-label">JSON完全一致</div>
            <div class="summary-value">{{ testSummary.identical_count }}/10回</div>
            <div class="summary-note">{{ testSummary.identical_count >= 9 ? '✅ 合格（≥9回）' : '⚠️ 要確認' }}</div>
          </div>

          <div class="summary-card">
            <div class="summary-label">処理時間（平均）</div>
            <div class="summary-value">{{ testSummary.time_avg }}ms</div>
            <div class="summary-note">Min: {{testSummary.time_min}}ms / Max: {{testSummary.time_max}}ms</div>
          </div>

          <div class="summary-card">
            <div class="summary-label">推定コスト</div>
            <div class="summary-value">¥{{ testSummary.estimated_cost_jpy.toFixed(2) }}</div>
            <div class="summary-note">実測（1回≒¥0.19）</div>
          </div>
        </div>

        <!-- 揺れレポート -->
        <div v-if="testSummary.variance_report" class="variance-section">
          <h3>🔍 揺れレポート（explanation除外）</h3>
          <div class="variance-grid">
            <div class="variance-item">
              <strong>店名:</strong> {{ testSummary.variance_report.vendor_unique.length }}種類
              <span v-if="testSummary.variance_report.vendor_unique.length > 1" class="warning-badge">要確認</span>
            </div>
            <div class="variance-item">
              <strong>日付:</strong> {{ testSummary.variance_report.date_unique.length }}種類
              <span v-if="testSummary.variance_report.date_unique.length > 1" class="warning-badge">要確認</span>
            </div>
            <div class="variance-item">
              <strong>金額:</strong> {{ testSummary.variance_report.amount_unique.length }}種類
              <span v-if="testSummary.variance_report.amount_unique.length > 1" class="warning-badge">要確認</span>
            </div>
            <div class="variance-item">
              <strong>推定科目:</strong> {{ testSummary.variance_report.category_unique.length }}種類
              <span v-if="testSummary.variance_report.category_unique.length > 1" class="warning-badge">要確認</span>
            </div>
          </div>
        </div>

        <!-- ダウンロードボタン -->
        <div class="download-section">
          <button @click="downloadCSV" class="btn-download">
            📊 CSVダウンロード
          </button>
          <button @click="downloadJSON" class="btn-download">
            📥 JSONダウンロード
          </button>
        </div>

        <!-- 詳細結果テーブル -->
        <div class="details-section">
          <h3>📋 詳細結果（全10回）</h3>
          <div class="table-wrapper">
            <table class="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>処理時間</th>
                  <th>店名</th>
                  <th>日付</th>
                  <th>金額</th>
                  <th>推定科目</th>
                  <th>explanation</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="result in testResults" :key="result.run_number">
                  <td>{{ result.run_number }}</td>
                  <td>{{ result.processing_time_ms }}ms</td>
                  <td>{{ result.json_output.vendor }}</td>
                  <td>{{ result.json_output.date }}</td>
                  <td>¥{{ result.json_output.total_amount?.toLocaleString() }}</td>
                  <td>{{ result.json_output.inferred_category }}</td>
                  <td class="explanation-cell">{{ result.json_output.explanation || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-section">
        <h2>❌ エラー</h2>
        <pre>{{ error }}</pre>
      </div>

      <div v-if="result" class="result-section">
        <h2>✅ OCR結果</h2>
        <div class="result-summary">
          <div class="result-item">
            <strong>店名:</strong> {{ result.vendor }}
          </div>
          <div class="result-item">
            <strong>日付:</strong> {{ result.date }}
          </div>
          <div class="result-item">
            <strong>合計金額:</strong> ¥{{ result.total_amount?.toLocaleString() }}
          </div>
          <div class="result-item">
            <strong>T番号:</strong> {{ result.t_number || '(なし)' }}
          </div>
          <div class="result-item">
            <strong>推定科目:</strong> {{ result.inferred_category }}
          </div>
        </div>

        <h3>📋 完全なJSON</h3>
        <pre class="json-output">{{ JSON.stringify(result, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ocr-test-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.upload-section {
  margin-bottom: 2rem;
}

.file-input {
  display: block;
  margin: 1rem 0;
  padding: 0.5rem;
  border: 2px dashed #ddd;
  border-radius: 4px;
  width: 100%;
}

.selected-file {
  color: #27ae60;
  font-weight: 500;
}

.action-section {
  margin: 2rem 0;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.error-section {
  margin-top: 2rem;
  padding: 1rem;
  background: #fee;
  border-left: 4px solid #e74c3c;
  border-radius: 4px;
}

.error-section pre {
  color: #c0392b;
  white-space: pre-wrap;
}

.result-section {
  margin-top: 2rem;
}

.result-summary {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.result-item {
  margin: 0.5rem 0;
  font-size: 1rem;
}

.result-item strong {
  color: #2c3e50;
  min-width: 120px;
  display: inline-block;
}

.json-output {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 1.5rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9rem;
  line-height: 1.6;
}

/* 10回テスト用スタイル */
.btn-test {
  background: #9b59b6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  margin-left: 1rem;
}

.btn-test:hover:not(:disabled) {
  background: #8e44ad;
}

.btn-test:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.progress-section {
  margin-top: 1rem;
  padding: 1rem;
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
  border-radius: 4px;
  font-weight: 600;
}

.summary-section {
  margin-top: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.summary-section h2 {
  margin-top: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.summary-card {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.summary-card.success {
  border-left-color: #27ae60;
  background: #ecf9f2;
}

.summary-card.warning {
  border-left-color: #f39c12;
  background: #fef5e7;
}

.summary-label {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

.summary-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
}

.summary-note {
  font-size: 0.8rem;
  color: #95a5a6;
  margin-top: 0.5rem;
}

.variance-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #fef9e7;
  border-left: 4px solid #f39c12;
  border-radius: 4px;
}

.variance-section h3 {
  margin-top: 0;
}

.variance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.variance-item {
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
}

.warning-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #e74c3c;
  color: white;
  font-size: 0.75rem;
  border-radius: 3px;
}

.details-section {
  margin-top: 2rem;
}

.table-wrapper {
  overflow-x: auto;
  margin-top: 1rem;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.results-table th,
.results-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

.results-table th {
  background: #34495e;
  color: white;
  font-weight: 600;
}

.explanation-cell {
  max-width: 300px;
  font-size: 0.9rem;
  color: #555;
}

.download-section {
  margin: 1.5rem 0;
  display: flex;
  gap: 1rem;
}

.btn-download {
  background: #27ae60;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-download:hover {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.btn-download:active {
  transform: translateY(0);
}

.results-table tr:hover {
  background: #f8f9fa;
}
</style>
