<template>
  <div class="learning-page" style="font-family: 'Noto Sans JP', sans-serif">
    <div class="learning-container">

      <!-- ヘッダー -->
      <header class="learning-header">
        <div class="header-icon">💡</div>
        <div>
          <h1 class="header-title">学習</h1>
          <p class="header-sub">摘要キーワードに基づく自動仕訳ルールを管理します。ルールに一致した取引は自動で科目が確定されます。</p>
        </div>
      </header>

      <!-- 証票種別タブ（ストリームド同等） -->
      <div class="source-tabs">
        <button v-for="tab in sourceTabs" :key="tab.value"
          class="source-tab"
          :class="{ 'source-tab--active': sourceFilter === tab.value }"
          @click="sourceFilter = tab.value"
        >
          {{ tab.label }}
          <span class="source-tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- ツールバー -->
      <div class="learning-toolbar">
        <div class="toolbar-left">
          <!-- 有効/無効フィルタ -->
          <div class="filter-tabs">
            <button class="filter-tab" :class="{ 'filter-tab--active': filterMode === 'all' }" @click="filterMode = 'all'">
              すべて <span class="filter-count">{{ sourceFilteredRules.length }}</span>
            </button>
            <button class="filter-tab" :class="{ 'filter-tab--active': filterMode === 'active' }" @click="filterMode = 'active'">
              有効 <span class="filter-count filter-count--active">{{ activeCount }}</span>
            </button>
            <button class="filter-tab" :class="{ 'filter-tab--active': filterMode === 'inactive' }" @click="filterMode = 'inactive'">
              無効 <span class="filter-count filter-count--inactive">{{ inactiveCount }}</span>
            </button>
          </div>
          <!-- 検索 -->
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input v-model="searchText" type="text" class="search-input" placeholder="キーワード検索..." />
          </div>
        </div>
        <div class="toolbar-right">
          <button class="btn-add" @click="handleAdd">
            <i class="fa-solid fa-plus"></i> 新規ルール
          </button>
        </div>
      </div>

      <!-- テーブル -->
      <div class="learning-table-wrap">
        <table class="learning-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th class="th-keyword">キーワード</th>
              <th class="th-match">照合</th>
              <th class="th-source">種別</th>
              <th class="th-direction">入出金</th>
              <th class="th-amount">金額条件</th>
              <th class="th-account">借方勘定科目</th>
              <th class="th-sub">借方補助</th>
              <th class="th-tax">借方税区分</th>
              <th class="th-account">貸方勘定科目</th>
              <th class="th-sub">貸方補助</th>
              <th class="th-tax">貸方税区分</th>
              <th class="th-status">状態</th>
              <th class="th-hit">適用数</th>
              <th class="th-gen">生成元</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRules.length === 0">
              <td :colspan="15" class="empty-row">
                <i class="fa-solid fa-inbox"></i> 条件に一致するルールがありません
              </td>
            </tr>
            <template v-for="(rule, idx) in filteredRules" :key="rule.id">
              <!-- 表示行（1行目） -->
              <tr class="data-row" :class="{ 'data-row--inactive': !rule.isActive }" @click="openModal(rule)">
                <td class="td-num" :rowspan="entryPairCount(rule)">{{ idx + 1 }}</td>
                <td class="td-keyword" :rowspan="entryPairCount(rule)"><span class="keyword-badge">{{ rule.keyword }}</span></td>
                <td class="td-match" :rowspan="entryPairCount(rule)">
                  <span class="match-badge" :class="rule.matchType === 'exact' ? 'match-badge--exact' : 'match-badge--contains'">{{ rule.matchType === 'exact' ? '完全' : '部分' }}</span>
                </td>
                <td class="td-source" :rowspan="entryPairCount(rule)"><span class="source-badge">{{ sourceCategoryLabel(rule.sourceCategory) }}</span></td>
                <td class="td-direction" :rowspan="entryPairCount(rule)">
                  <span v-if="rule.direction" class="direction-badge" :class="rule.direction === 'expense' ? 'direction-badge--expense' : 'direction-badge--income'">{{ rule.direction === 'expense' ? '支出' : '収入' }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="td-amount" :rowspan="entryPairCount(rule)">{{ formatAmountCondition(rule) }}</td>
                <td class="td-account">{{ firstDebit(rule)?.account || '' }}</td>
                <td class="td-sub">{{ firstDebit(rule)?.subAccount || '—' }}</td>
                <td class="td-tax">{{ firstDebit(rule)?.taxCategory || '—' }}</td>
                <td class="td-account">{{ firstCredit(rule)?.account || '' }}</td>
                <td class="td-sub">{{ firstCredit(rule)?.subAccount || '—' }}</td>
                <td class="td-tax">{{ firstCredit(rule)?.taxCategory || '—' }}</td>
                <td class="td-status" :rowspan="entryPairCount(rule)">
                  <button class="status-toggle" :class="rule.isActive ? 'status-toggle--active' : 'status-toggle--inactive'"
                    @click.stop="toggleActive(rule.id)">{{ rule.isActive ? '有効' : '無効' }}</button>
                </td>
                <td class="td-hit" :rowspan="entryPairCount(rule)"><span class="hit-count">{{ rule.hitCount }}</span></td>
                <td class="td-gen" :rowspan="entryPairCount(rule)">
                  <span class="gen-badge" :class="rule.generatedBy === 'ai' ? 'gen-badge--ai' : 'gen-badge--human'">{{ rule.generatedBy === 'ai' ? 'AI' : '手動' }}</span>
                </td>
              </tr>
              <!-- 複合仕訳の追加行 -->
              <tr v-for="(pair, pi) in extraPairs(rule)" :key="rule.id + '-p' + pi"
                class="data-row data-row--extra" :class="{ 'data-row--inactive': !rule.isActive }" @click="openModal(rule)">
                <td class="td-account">{{ pair.debit?.account || '' }}</td>
                <td class="td-sub">{{ pair.debit?.subAccount || '—' }}</td>
                <td class="td-tax">{{ pair.debit?.taxCategory || '—' }}</td>
                <td class="td-account">{{ pair.credit?.account || '' }}</td>
                <td class="td-sub">{{ pair.credit?.subAccount || '—' }}</td>
                <td class="td-tax">{{ pair.credit?.taxCategory || '—' }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- フッター情報 -->
      <div class="learning-footer">
        <span class="footer-info">
          <i class="fa-solid fa-circle-info"></i>
          全 {{ rules.length }} 件中 {{ filteredRules.length }} 件表示
          ・有効 {{ activeCount }} 件 / 無効 {{ inactiveCount }} 件
          ・AI生成 {{ aiCount }} 件 / 手動 {{ humanCount }} 件
        </span>
      </div>

    </div>
  </div>

  <!-- ===== 編集モーダル（ストリームド同等） ===== -->
  <div v-if="modalRule" class="modal-overlay" @click.self="closeModal">
    <div class="modal-dialog" @click.stop>
      <div class="modal-header">
        <h2>学習ルール編集</h2>
        <div class="modal-header-actions">
          <button class="modal-btn modal-btn--text" @click="closeModal">キャンセル</button>
          <button class="modal-btn modal-btn--danger" @click="handleDeleteModal">
            <i class="fa-solid fa-trash-can"></i> 削除
          </button>
        </div>
      </div>

      <div class="modal-body">
        <!-- 証憑種別 -->
        <div class="modal-field">
          <label>証憑種別</label>
          <select v-model="modalRule.sourceCategory" class="modal-select">
            <option :value="null">—</option>
            <option value="receipt">領収書/請求書</option>
            <option value="bank">口座</option>
            <option value="credit">カード</option>
          </select>
        </div>

        <!-- 学習キーワード -->
        <div class="modal-field">
          <label>学習キーワード</label>
          <div class="modal-field-row">
            <select v-model="modalRule.matchType" class="modal-select modal-select--small">
              <option value="exact">等しい</option>
              <option value="contains">含む</option>
            </select>
            <input v-model="modalRule.keyword" class="modal-input" placeholder="キーワード" />
          </div>
        </div>

        <!-- 金額 -->
        <div class="modal-field">
          <label>金額</label>
          <div class="modal-field-row">
            <select v-model="amountMode" class="modal-select">
              <option value="none">金額を条件としない</option>
              <option value="min">以上</option>
              <option value="max">以下</option>
              <option value="exact">同額</option>
              <option value="range">範囲</option>
            </select>
            <input v-if="amountMode === 'min' || amountMode === 'exact'" v-model.number="modalRule.amountMin" class="modal-input modal-input--num" type="number" placeholder="金額" />
            <template v-if="amountMode === 'max'">
              <input v-model.number="modalRule.amountMax" class="modal-input modal-input--num" type="number" placeholder="金額" />
            </template>
            <template v-if="amountMode === 'range'">
              <input v-model.number="modalRule.amountMin" class="modal-input modal-input--num" type="number" placeholder="以上" />
              <span>〜</span>
              <input v-model.number="modalRule.amountMax" class="modal-input modal-input--num" type="number" placeholder="以下" />
            </template>
          </div>
        </div>

        <!-- 学習内容テーブル -->
        <div class="modal-field">
          <label>学習内容 <span class="modal-label-sub">作成日時：{{ modalRule.createdAt?.slice(0, 10) }}</span></label>
          <table class="modal-entry-table">
            <thead>
              <tr>
                <th>借方勘定科目</th><th>借方補助科目</th><th>借方金額</th>
                <th>貸方勘定科目</th><th>貸方補助科目</th><th>貸方金額</th>
                <th></th>
              </tr>
              <tr>
                <th>借方税区分</th><th>借方部門</th><th></th>
                <th>貸方税区分</th><th>貸方部門</th><th></th>
                <th></th>
              </tr>
              <tr>
                <th>摘要表示名</th><th></th><th></th>
                <th>取引内容</th><th></th><th>対象月</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(pair, pi) in modalEntryPairs" :key="pi">
                <!-- 行1: 科目/補助/金額 -->
                <tr class="modal-entry-row">
                  <td><input v-model="pair.debit.account" class="modal-input" /></td>
                  <td><input v-model="pair.debit.subAccount" class="modal-input" /></td>
                  <td>
                    <select v-model="pair.debit.amountType" class="modal-select">
                      <option value="auto">自動計算</option><option value="total">取引金額</option><option value="fixed">固定金額</option>
                    </select>
                    <input v-if="pair.debit.amountType === 'fixed'" v-model.number="pair.debit.fixedAmount" class="modal-input modal-input--num" type="number" />
                  </td>
                  <td><input v-model="pair.credit.account" class="modal-input" /></td>
                  <td><input v-model="pair.credit.subAccount" class="modal-input" /></td>
                  <td>
                    <select v-model="pair.credit.amountType" class="modal-select">
                      <option value="auto">自動計算</option><option value="total">取引金額</option><option value="fixed">固定金額</option>
                    </select>
                    <input v-if="pair.credit.amountType === 'fixed'" v-model.number="pair.credit.fixedAmount" class="modal-input modal-input--num" type="number" />
                  </td>
                  <td class="modal-entry-actions">
                    <button v-if="pi > 0" class="action-btn action-btn--delete" @click="removeModalPair(pi)"><i class="fa-solid fa-minus"></i></button>
                  </td>
                </tr>
                <!-- 行2: 税区分/部門 -->
                <tr class="modal-entry-row modal-entry-row--sub">
                  <td><input v-model="pair.debit.taxCategory" class="modal-input" placeholder="税区分" /></td>
                  <td><input v-model="pair.debit.department" class="modal-input" placeholder="部門" /></td>
                  <td></td>
                  <td><input v-model="pair.credit.taxCategory" class="modal-input" placeholder="税区分" /></td>
                  <td><input v-model="pair.credit.department" class="modal-input" placeholder="部門" /></td>
                  <td></td>
                  <td></td>
                </tr>
                <!-- 行3: 摘要表示名/取引内容/対象月 -->
                <tr class="modal-entry-row modal-entry-row--sub">
                  <td><input v-model="pair.debit.displayName" class="modal-input" placeholder="摘要表示名" /></td>
                  <td></td><td></td>
                  <td><input v-model="pair.debit.description" class="modal-input" placeholder="取引内容" /></td>
                  <td></td>
                  <td><input v-model="pair.debit.targetMonth" class="modal-input" placeholder="対象月" /></td>
                  <td></td>
                </tr>
              </template>
            </tbody>
          </table>
          <button class="btn-add-entry" @click="addModalPair"><i class="fa-solid fa-plus"></i></button>
        </div>

        <!-- 説明エリア -->
        <div class="modal-notes">
          <p><strong>※摘要の設定について</strong></p>
          <p>摘要欄には以下の項目が順に表記されます。空欄の項目はスキップされます。</p>
          <ul>
            <li>摘要表示名（例：ミニストップ、NTT東日本、Amazon）</li>
            <li>取引内容（例：事務用品購入、電気代、クラウドサービス利用料）</li>
            <li>対象月（例：4月分）</li>
          </ul>
          <p><strong>※金額の設定について</strong></p>
          <ul>
            <li><b>自動計算：</b>単一仕訳の場合は証憑記載の金額をそのまま反映。複合仕訳の場合は他の行との差額を自動計算します。</li>
            <li><b>取引金額：</b>証憑に記載の金額をそのまま反映します。</li>
            <li><b>固定金額：</b>入力した金額を常にそのまま反映します。（例：ゴルフ場利用税 1,200円）</li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button class="modal-btn modal-btn--secondary" @click="saveModal('rule')">将来の仕訳のみ適用</button>
        <button class="modal-btn modal-btn--primary" @click="saveModal('all')">今期仕訳に一括適用</button>
      </div>
      <div class="modal-footer-note">
        <p>「将来の仕訳のみ適用」：ルールを保存します。既存の仕訳には反映されません。</p>
        <p>「今期仕訳に一括適用」：ルールを保存し、未反映の既存仕訳にもまとめて適用します。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { LearningRule, LearningRuleEntryLine } from '../types/learning_rule.type'

const route = useRoute()
const clientId = computed(() => (route.params.clientId as string) || 'TST-00011')

// --- データ（API経由で取得） ---
const rules = ref<LearningRule[]>([])

onMounted(async () => {
  try {
    const res = await fetch(`/api/learning-rules/${clientId.value}`)
    if (res.ok) {
      const data = await res.json() as { rules: LearningRule[] }
      rules.value = data.rules
    }
  } catch (e) {
    console.error('[LearningPage] API取得失敗:', e)
  }
})

// --- 証票種別フィルタ ---
const sourceFilter = ref<string>('all')

const sourceTabs = computed(() => {
  const all = rules.value.length
  const receipt = rules.value.filter(r => r.sourceCategory === 'receipt').length
  const bank = rules.value.filter(r => r.sourceCategory === 'bank').length
  const credit = rules.value.filter(r => r.sourceCategory === 'credit').length
  return [
    { label: '全て', value: 'all', count: all },
    { label: '領収書', value: 'receipt', count: receipt },
    { label: '口座', value: 'bank', count: bank },
    { label: 'カード', value: 'credit', count: credit },
  ]
})

const sourceFilteredRules = computed(() => {
  if (sourceFilter.value === 'all') return rules.value
  return rules.value.filter(r => r.sourceCategory === sourceFilter.value)
})

// --- 有効/無効フィルタ ---
const filterMode = ref<'all' | 'active' | 'inactive'>('all')
const searchText = ref('')

const activeCount = computed(() => sourceFilteredRules.value.filter(r => r.isActive).length)
const inactiveCount = computed(() => sourceFilteredRules.value.filter(r => !r.isActive).length)
const aiCount = computed(() => rules.value.filter(r => r.generatedBy === 'ai').length)
const humanCount = computed(() => rules.value.filter(r => r.generatedBy === 'human').length)

const filteredRules = computed(() => {
  let result = sourceFilteredRules.value
  if (filterMode.value === 'active') result = result.filter(r => r.isActive)
  if (filterMode.value === 'inactive') result = result.filter(r => !r.isActive)
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    result = result.filter(r =>
      r.keyword.toLowerCase().includes(q) ||
      r.entries.some(e => e.account.toLowerCase().includes(q) || (e.subAccount && e.subAccount.toLowerCase().includes(q)))
    )
  }
  return result
})

// --- entries展開ヘルパー ---
function firstDebit(rule: LearningRule) { return rule.entries.find(e => e.side === 'debit') || null }
function firstCredit(rule: LearningRule) { return rule.entries.find(e => e.side === 'credit') || null }

function entryPairCount(rule: LearningRule): number {
  return Math.max(rule.entries.filter(e => e.side === 'debit').length, rule.entries.filter(e => e.side === 'credit').length)
}

function extraPairs(rule: LearningRule) {
  const debits = rule.entries.filter(e => e.side === 'debit')
  const credits = rule.entries.filter(e => e.side === 'credit')
  const maxLen = Math.max(debits.length, credits.length)
  if (maxLen <= 1) return []
  const rows = []
  for (let i = 1; i < maxLen; i++) rows.push({ debit: debits[i] || null, credit: credits[i] || null })
  return rows
}

// --- 表示ヘルパー ---
function sourceCategoryLabel(cat: string | null): string {
  if (cat === 'receipt') return '領収書'
  if (cat === 'bank') return '口座'
  if (cat === 'credit') return 'カード'
  if (cat === 'all') return '全て'
  return '—'
}

function formatAmountCondition(rule: LearningRule): string {
  const { amountMin, amountMax } = rule
  if (amountMin == null && amountMax == null) return '—'
  if (amountMin != null && amountMax != null && amountMin === amountMax) return `${amountMin.toLocaleString()}（同額）`
  if (amountMin != null && amountMax != null) return `${amountMin.toLocaleString()}〜${amountMax.toLocaleString()}`
  if (amountMin != null) return `≥${amountMin.toLocaleString()}`
  if (amountMax != null) return `≤${amountMax.toLocaleString()}`
  return '—'
}

// --- 有効/無効トグル（API永続化） ---
const toggleActive = async (id: string) => {
  const rule = rules.value.find(r => r.id === id)
  if (!rule) return
  const newActive = !rule.isActive
  try {
    const res = await fetch(`/api/learning-rules/${clientId.value}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: newActive }),
    })
    if (res.ok) {
      rule.isActive = newActive
    } else {
      console.error('[LearningPage] トグル失敗:', await res.text())
    }
  } catch (err) {
    console.error('[LearningPage] トグルAPI通信失敗:', err)
  }
}

// --- モーダル ---
const modalRule = ref<LearningRule | null>(null)
const modalOriginalId = ref<string | null>(null)
const amountMode = ref<'none' | 'min' | 'max' | 'exact' | 'range'>('none')

interface EntryPair {
  debit: LearningRuleEntryLine
  credit: LearningRuleEntryLine
}
const modalEntryPairs = ref<EntryPair[]>([])

function emptyEntry(side: 'debit' | 'credit', ruleId: string): LearningRuleEntryLine {
  return { id: `LRE-NEW-${Date.now()}-${side}`, ruleId, side, account: '', subAccount: null, taxCategory: null, department: null, amountType: 'auto', fixedAmount: null, displayName: null, description: null, targetMonth: null, displayOrder: 0 }
}

function detectAmountMode(rule: LearningRule): 'none' | 'min' | 'max' | 'exact' | 'range' {
  const { amountMin, amountMax } = rule
  if (amountMin == null && amountMax == null) return 'none'
  if (amountMin != null && amountMax != null && amountMin === amountMax) return 'exact'
  if (amountMin != null && amountMax != null) return 'range'
  if (amountMin != null) return 'min'
  return 'max'
}

function buildPairs(entries: LearningRuleEntryLine[], ruleId: string): EntryPair[] {
  const debits = entries.filter(e => e.side === 'debit').map(e => ({ ...e }))
  const credits = entries.filter(e => e.side === 'credit').map(e => ({ ...e }))
  const maxLen = Math.max(debits.length, credits.length, 1)
  const pairs: EntryPair[] = []
  for (let i = 0; i < maxLen; i++) {
    pairs.push({ debit: debits[i] || emptyEntry('debit', ruleId), credit: credits[i] || emptyEntry('credit', ruleId) })
  }
  return pairs
}

function openModal(rule: LearningRule) {
  modalOriginalId.value = rule.id
  modalRule.value = { ...rule, entries: rule.entries.map(e => ({ ...e })) }
  amountMode.value = detectAmountMode(rule)
  modalEntryPairs.value = buildPairs(rule.entries, rule.id)
}

function closeModal() { modalRule.value = null }

function addModalPair() {
  const ruleId = modalRule.value?.id || ''
  modalEntryPairs.value.push({ debit: emptyEntry('debit', ruleId), credit: emptyEntry('credit', ruleId) })
}

function removeModalPair(index: number) {
  if (modalEntryPairs.value.length <= 1) return
  modalEntryPairs.value.splice(index, 1)
}

function syncAmountFromMode() {
  if (!modalRule.value) return
  const mode = amountMode.value
  if (mode === 'none') { modalRule.value.amountMin = null; modalRule.value.amountMax = null }
  if (mode === 'exact' && modalRule.value.amountMin != null) { modalRule.value.amountMax = modalRule.value.amountMin }
  if (mode === 'min') { modalRule.value.amountMax = null }
  if (mode === 'max') { modalRule.value.amountMin = null }
}

async function saveModal(mode: 'rule' | 'all') {
  if (!modalRule.value) return
  syncAmountFromMode()
  // ペアからentries配列を再構築
  const entries: LearningRuleEntryLine[] = []
  let order = 1
  for (const pair of modalEntryPairs.value) {
    if (pair.debit.account.trim()) { pair.debit.displayOrder = order++; entries.push({ ...pair.debit }) }
    if (pair.credit.account.trim()) { pair.credit.displayOrder = order++; entries.push({ ...pair.credit }) }
  }
  if (entries.length === 0) { alert('少なくとも1つの勘定科目を入力してください'); return }
  modalRule.value.entries = entries
  modalRule.value.updatedAt = new Date().toISOString()

  try {
    if (modalOriginalId.value?.startsWith('NEW-')) {
      // 新規作成: POST
      const res = await fetch(`/api/learning-rules/${clientId.value}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalRule.value),
      })
      if (!res.ok) {
        console.error('[LearningPage] ルール作成失敗:', await res.text())
        alert('ルールの保存に失敗しました')
        return
      }
      const data = await res.json() as { rule: LearningRule }
      // ローカル配列を更新（仮IDの行をサーバー返却のルールに差し替え）
      const idx = rules.value.findIndex(r => r.id === modalOriginalId.value)
      if (idx !== -1) rules.value[idx] = data.rule
      else rules.value.push(data.rule)
    } else {
      // 既存更新: PUT
      const res = await fetch(`/api/learning-rules/${clientId.value}/${modalOriginalId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalRule.value),
      })
      if (!res.ok) {
        console.error('[LearningPage] ルール更新失敗:', await res.text())
        alert('ルールの保存に失敗しました')
        return
      }
      // ローカル配列を更新
      const idx = rules.value.findIndex(r => r.id === modalOriginalId.value)
      if (idx !== -1) rules.value[idx] = { ...modalRule.value!, entries: modalRule.value!.entries.map(e => ({ ...e })) }
    }
    if (mode === 'all') alert('今期仕訳に一括適用しました（モック）')
    closeModal()
  } catch (err) {
    console.error('[LearningPage] 保存API通信失敗:', err)
    alert('ルールの保存に失敗しました')
  }
}

async function handleDeleteModal() {
  if (!modalRule.value || !confirm('このルールを削除しますか？')) return
  try {
    const res = await fetch(`/api/learning-rules/${clientId.value}/${modalOriginalId.value}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      rules.value = rules.value.filter(r => r.id !== modalOriginalId.value)
      closeModal()
    } else {
      console.error('[LearningPage] ルール削除失敗:', await res.text())
      alert('ルールの削除に失敗しました')
    }
  } catch (err) {
    console.error('[LearningPage] 削除API通信失敗:', err)
    alert('ルールの削除に失敗しました')
  }
}

function handleAdd() {
  const newRule: LearningRule = {
    id: `NEW-${Date.now()}`, clientId: clientId.value, keyword: '', matchType: 'exact',
    direction: 'expense', sourceCategory: null, amountMin: null, amountMax: null,
    entries: [emptyEntry('debit', ''), emptyEntry('credit', '')],
    isActive: true, hitCount: 0, generatedBy: 'human',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }
  rules.value.push(newRule)
  openModal(newRule)
}
</script>

<style scoped>
/* === ページ全体 === */
.learning-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
}
.learning-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 100%;
}

/* === ヘッダー === */
.learning-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}
.header-icon { font-size: 28px; }
.header-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
.header-sub { font-size: 12px; color: #94a3b8; margin: 2px 0 0; }

/* === 証票種別タブ（ストリームド同等） === */
.source-tabs {
  display: flex;
  gap: 0;
  padding: 0 20px;
  background: #fff;
  border-bottom: 2px solid #e2e8f0;
}
.source-tab {
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.source-tab:hover { color: #334155; }
.source-tab--active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}
.source-tab-count {
  font-size: 10px;
  background: #e2e8f0;
  color: #475569;
  padding: 0 5px;
  border-radius: 8px;
  min-width: 18px;
  text-align: center;
}
.source-tab--active .source-tab-count {
  background: #dbeafe;
  color: #1d4ed8;
}

/* === ツールバー === */
.learning-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

/* フィルタタブ */
.filter-tabs { display: flex; background: #f1f5f9; border-radius: 6px; padding: 2px; }
.filter-tab {
  padding: 5px 12px; font-size: 12px; font-weight: 600;
  border: none; background: transparent; color: #64748b;
  cursor: pointer; border-radius: 4px; transition: all 0.15s;
  display: flex; align-items: center; gap: 4px;
}
.filter-tab:hover { color: #334155; }
.filter-tab--active { background: #fff; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
.filter-count { font-size: 10px; background: #e2e8f0; color: #475569; padding: 0 5px; border-radius: 8px; min-width: 18px; text-align: center; }
.filter-count--active { background: #dcfce7; color: #166534; }
.filter-count--inactive { background: #fee2e2; color: #991b1b; }

/* 検索 */
.search-box { position: relative; }
.search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 11px; }
.search-input {
  padding: 5px 10px 5px 28px; border: 1px solid #e2e8f0; border-radius: 6px;
  font-size: 12px; width: 180px; outline: none; transition: border-color 0.15s;
}
.search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.12); }

/* ボタン */
.btn-add {
  padding: 6px 14px; font-size: 12px; font-weight: 700;
  background: #3b82f6; color: #fff; border: none; border-radius: 6px;
  cursor: pointer; display: flex; align-items: center; gap: 5px; transition: background 0.15s;
}
.btn-add:hover { background: #2563eb; }

/* === テーブル === */
.learning-table-wrap { flex: 1; overflow: auto; background: #fff; }
.learning-table { width: 100%; min-width: 1300px; border-collapse: collapse; font-size: 12px; }
.learning-table thead { position: sticky; top: 0; z-index: 2; }
.learning-table th {
  background: #f1f5f9; color: #475569; font-weight: 700; font-size: 11px;
  padding: 8px 6px; text-align: left; border-bottom: 2px solid #e2e8f0;
  white-space: nowrap; user-select: none;
}
.th-num { width: 36px; text-align: center; }
.th-keyword { min-width: 100px; }
.th-match { width: 48px; text-align: center; }
.th-source { width: 56px; text-align: center; }
.th-direction { width: 56px; text-align: center; }
.th-amount { width: 110px; }
.th-account { min-width: 100px; }
.th-sub { width: 90px; }
.th-tax { width: 100px; }
.th-status { width: 52px; text-align: center; }
.th-hit { width: 52px; text-align: center; }
.th-gen { width: 52px; text-align: center; }
.th-actions { width: 72px; text-align: center; }

.learning-table td {
  padding: 7px 6px; border-bottom: 1px solid #f1f5f9;
  color: #334155; vertical-align: middle;
}

/* データ行 */
.data-row { transition: background 0.1s; }
.data-row:hover { background: #f8fafc; }
.data-row--inactive { opacity: 0.5; }
.data-row--inactive:hover { opacity: 0.7; }
.data-row--extra td { border-bottom: 1px solid #f1f5f9; }

.td-num { text-align: center; color: #94a3b8; font-size: 11px; }

/* バッジ */
.keyword-badge {
  display: inline-block; background: #eff6ff; color: #1d4ed8;
  font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 12px;
}
.match-badge {
  display: inline-block; font-size: 10px; font-weight: 700;
  padding: 1px 6px; border-radius: 3px;
}
.match-badge--exact { background: #dbeafe; color: #1d4ed8; }
.match-badge--contains { background: #fef3c7; color: #b45309; }

.source-badge {
  display: inline-block; font-size: 10px; font-weight: 600;
  padding: 1px 6px; border-radius: 3px; background: #f1f5f9; color: #475569;
}

.direction-badge {
  display: inline-block; font-size: 10px; font-weight: 700;
  padding: 1px 6px; border-radius: 3px;
}
.direction-badge--expense { background: #fef2f2; color: #dc2626; }
.direction-badge--income { background: #f0fdf4; color: #16a34a; }
.text-muted { color: #cbd5e1; }
.td-amount { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #64748b; }

/* 状態トグル */
.status-toggle {
  font-size: 10px; font-weight: 700; padding: 2px 8px;
  border-radius: 10px; border: none; cursor: pointer; transition: all 0.15s;
}
.status-toggle--active { background: #dcfce7; color: #166534; }
.status-toggle--active:hover { background: #bbf7d0; }
.status-toggle--inactive { background: #f1f5f9; color: #94a3b8; }
.status-toggle--inactive:hover { background: #e2e8f0; }

.hit-count { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b; }
.td-hit { text-align: center; }

.gen-badge { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 3px; }
.gen-badge--ai { background: #ede9fe; color: #7c3aed; }
.gen-badge--human { background: #fef3c7; color: #b45309; }

/* アクションボタン */
.td-actions { text-align: center; white-space: nowrap; }
.action-btn {
  background: none; border: none; cursor: pointer;
  padding: 4px 6px; border-radius: 4px; font-size: 12px; transition: all 0.15s;
}
.action-btn--edit { color: #3b82f6; }
.action-btn--edit:hover { background: #eff6ff; }
.action-btn--delete { color: #ef4444; }
.action-btn--delete:hover { background: #fef2f2; }
.action-btn--save { color: #16a34a; }
.action-btn--save:hover { background: #f0fdf4; }
.action-btn--cancel { color: #94a3b8; }
.action-btn--cancel:hover { background: #f1f5f9; }

/* 編集行 */
.edit-row { background: #fffbeb; }
.edit-row td { padding: 4px 4px; }
.edit-input {
  width: 100%; padding: 4px 6px; border: 1px solid #fbbf24;
  border-radius: 4px; font-size: 11px; outline: none; background: #fff; box-sizing: border-box;
}
.edit-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.15); }
.edit-input--small { max-width: 90px; }
.edit-select {
  width: 100%; padding: 4px 4px; border: 1px solid #fbbf24;
  border-radius: 4px; font-size: 11px; outline: none; background: #fff;
}
.edit-amount-group { display: flex; align-items: center; gap: 2px; }
.edit-amount-sep { color: #94a3b8; font-size: 11px; }

/* 空行 */
.empty-row { text-align: center; padding: 40px 20px !important; color: #94a3b8; font-size: 13px; }
.empty-row i { margin-right: 6px; font-size: 16px; }

/* === フッター === */
.learning-footer { padding: 8px 20px; background: #fff; border-top: 1px solid #e2e8f0; }
.footer-info { font-size: 11px; color: #94a3b8; }
.footer-info i { margin-right: 4px; }

/* サブ列 */
.td-sub, .td-tax { font-size: 11px; color: #64748b; }
.td-account { font-weight: 600; color: #1e293b; }

/* 行クリック可能 */
.data-row { cursor: pointer; }
.data-row:hover { background: #f0f9ff; }

/* 行追加ボタン */
.btn-add-entry {
  padding: 4px 12px; font-size: 12px; font-weight: 600;
  background: #f1f5f9; color: #475569; border: 1px dashed #cbd5e1;
  border-radius: 4px; cursor: pointer; margin-top: 8px;
}
.btn-add-entry:hover { background: #e2e8f0; }
.btn-add-entry i { margin-right: 4px; }

/* ===== モーダル ===== */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 40px; z-index: 9999;
}
.modal-dialog {
  background: #fff; border-radius: 12px; width: 900px; max-height: 85vh;
  overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px; border-bottom: 1px solid #e2e8f0;
}
.modal-header h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
.modal-header-actions { display: flex; gap: 12px; }
.modal-body { padding: 20px 24px; }
.modal-field { margin-bottom: 16px; }
.modal-field > label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; }
.modal-field-row { display: flex; gap: 8px; align-items: center; }
.modal-label-sub { font-weight: 400; color: #94a3b8; margin-left: 12px; }

.modal-input {
  padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 4px;
  font-size: 12px; outline: none; background: #fff; box-sizing: border-box;
}
.modal-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
.modal-input--num { width: 100px; }
.modal-select {
  padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 4px;
  font-size: 12px; outline: none; background: #fff;
}
.modal-select--small { width: 90px; }

/* モーダル内 学習内容テーブル */
.modal-entry-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; font-size: 11px; }
.modal-entry-table th {
  background: #e8edf5; padding: 4px 6px; text-align: left; font-weight: 600;
  color: #334155; border: 1px solid #d1d5db; font-size: 10px;
}
.modal-entry-table td { padding: 4px 4px; border: 1px solid #e2e8f0; }
.modal-entry-table .modal-input { width: 100%; border-color: #e2e8f0; font-size: 11px; padding: 3px 5px; }
.modal-entry-table .modal-select { width: 100%; border-color: #e2e8f0; font-size: 10px; padding: 3px 4px; }
.modal-entry-row--sub td { background: #f8fafc; }
.modal-entry-actions { text-align: center; width: 30px; }

/* モーダルフッター */
.modal-footer {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 12px 24px; border-top: 1px solid #e2e8f0;
}
.modal-footer-note { padding: 0 24px 16px; }
.modal-footer-note p { font-size: 10px; color: #94a3b8; margin: 2px 0; }

.modal-btn {
  padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600;
  cursor: pointer; border: 1px solid transparent; transition: all 0.15s;
}
.modal-btn--primary { background: #3b82f6; color: #fff; }
.modal-btn--primary:hover { background: #2563eb; }
.modal-btn--secondary { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
.modal-btn--secondary:hover { background: #e2e8f0; }
.modal-btn--text { background: none; color: #64748b; }
.modal-btn--text:hover { color: #1e293b; }
.modal-btn--danger { background: none; color: #ef4444; }
.modal-btn--danger:hover { background: #fef2f2; }
.modal-btn--danger i { margin-right: 4px; }

/* 説明エリア */
.modal-notes { margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
.modal-notes p { font-size: 11px; color: #475569; margin: 4px 0; }
.modal-notes ul { margin: 4px 0 8px 16px; padding: 0; }
.modal-notes li { font-size: 11px; color: #64748b; margin: 2px 0; }

/* アクションボタン（汎用） */
.action-btn {
  background: none; border: none; cursor: pointer;
  padding: 4px 6px; border-radius: 4px; font-size: 12px; transition: all 0.15s;
}
.action-btn--delete { color: #ef4444; }
.action-btn--delete:hover { background: #fef2f2; }
</style>
